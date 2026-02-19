import os
import time
import tempfile
import hashlib
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from models import (
    ParseResponse, ParseStatus, DocType, HealthResponse,
    DebugInfo, Timings, PrcData, BillData,
)
from classifier import classify_document
from extractors.prc import extract_prc
from extractors.bill import extract_bill
from ocr import (
    check_tesseract, check_pdftoppm,
    extract_text_pdfplumber, extract_text_ocr,
    should_use_ocr, choose_best_text,
)

app = FastAPI(title="Ótima Parser Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.environ.get("PARSER_API_KEY", "")

debug_store: dict[str, dict] = {}


def verify_api_key(x_parser_key: Optional[str] = Header(None)):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="PARSER_API_KEY not configured on server")
    if not x_parser_key or x_parser_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Parser-Key")


@app.get("/health", response_model=HealthResponse)
async def health():
    tess_ok, _ = check_tesseract()
    pdftoppm_ok, _ = check_pdftoppm()

    try:
        import pdfplumber
        pdfplumber_ok = True
    except ImportError:
        pdfplumber_ok = False

    openai_key = bool(os.environ.get("OPENAI_API_KEY"))

    return HealthResponse(
        status="ok" if (pdfplumber_ok) else "degraded",
        tesseract_por=tess_ok,
        pdftoppm=pdftoppm_ok,
        pdfplumber=pdfplumber_ok,
        openai_key=openai_key,
    )


@app.post("/parse", response_model=ParseResponse)
async def parse_document(
    file: UploadFile = File(...),
    source_doc_id: Optional[str] = Form(None),
    hint_supplier: Optional[str] = Form(None),
    hint_doc_type: Optional[str] = Form(None),
    x_parser_key: Optional[str] = Header(None),
):
    verify_api_key(x_parser_key)
    start_time = time.time()
    timings = Timings()
    warnings: list[str] = []

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    doc_hash = hashlib.md5(content).hexdigest()[:12]
    doc_id = source_doc_id or doc_hash

    suffix = os.path.splitext(file.filename or "doc.pdf")[1].lower()
    if suffix not in (".pdf", ".PDF"):
        return ParseResponse(
            status=ParseStatus.FAILED,
            docType=DocType.OTHER,
            confidence=0.0,
            validated=False,
            warnings=[f"Unsupported file type: {suffix}. Only PDF files are supported."],
            debug=DebugInfo(timingsMs=timings),
        )

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        t0 = time.time()
        pdf_text, page_count = extract_text_pdfplumber(tmp_path)
        timings.extractMs = (time.time() - t0) * 1000

        ocr_text = ""
        text_source = "pdf_text"
        chosen_text = pdf_text

        tess_ok, _ = check_tesseract()
        pdftoppm_ok, _ = check_pdftoppm()
        needs_ocr = should_use_ocr(pdf_text, page_count)

        if needs_ocr and tess_ok and pdftoppm_ok:
            t0 = time.time()
            ocr_text = extract_text_ocr(tmp_path)
            ocr_time = (time.time() - t0) * 1000
            timings.extractMs += ocr_time
            chosen_text, text_source = choose_best_text(pdf_text, ocr_text, page_count)
            if text_source == "ocr":
                warnings.append("Used OCR fallback (pdf text was insufficient)")
        elif needs_ocr:
            warnings.append("OCR needed but tesseract/pdftoppm not available")

        t0 = time.time()
        if hint_doc_type and hint_doc_type.upper() in ("PRC", "BILL"):
            doc_type = DocType(hint_doc_type.upper())
            classifier_scores = {"hint": hint_doc_type}
        else:
            doc_type, classifier_scores = classify_document(chosen_text)
        timings.classifyMs = (time.time() - t0) * 1000

        t0 = time.time()
        if doc_type == DocType.PRC:
            prc_data, rows, ext_warnings, ext_details = extract_prc(chosen_text, doc_id)
            warnings.extend(ext_warnings)

            validated = len(rows) >= 4 and prc_data.referenceMonth is not None
            confidence = 1.0
            if len(rows) < 12:
                confidence -= 0.2
            if not prc_data.supplier:
                confidence -= 0.1
            if not prc_data.referenceMonth:
                confidence -= 0.3
            outlier_count = sum(1 for r in rows if r.isOutlier)
            if outlier_count > 0:
                confidence -= 0.1 * min(outlier_count, 3)
            confidence = max(0.0, min(1.0, confidence))

            data = prc_data.model_dump()
            row_dicts = [r.model_dump() for r in rows]

        elif doc_type == DocType.BILL:
            bill_data, ext_warnings, ext_details = extract_bill(chosen_text)
            warnings.extend(ext_warnings)

            has_ref_month = bill_data.referenceMonth is not None
            has_amount = bill_data.totalAmount is not None or bill_data.totalEnergyKwh is not None
            has_id = bill_data.customerId is not None or bill_data.invoiceKey is not None
            validated = has_ref_month and has_amount and has_id

            confidence = 1.0
            if not has_ref_month:
                confidence -= 0.3
            if not has_amount:
                confidence -= 0.2
            if not has_id:
                confidence -= 0.2
            if not bill_data.distributor:
                confidence -= 0.1
            if not bill_data.customerName:
                confidence -= 0.05
            confidence = max(0.0, min(1.0, confidence))

            data = bill_data.model_dump()
            row_dicts = []
            ext_details = ext_details

        else:
            validated = False
            confidence = 0.0
            data = {}
            row_dicts = []
            ext_details = {}
            warnings.append("Document type could not be determined (OTHER)")

        timings.validateMs = (time.time() - t0) * 1000

    except Exception as e:
        import traceback
        return ParseResponse(
            status=ParseStatus.FAILED,
            docType=DocType.OTHER,
            confidence=0.0,
            validated=False,
            warnings=[f"Parse error: {str(e)}"],
            debug=DebugInfo(
                timingsMs=timings,
                rawPdfText=pdf_text if 'pdf_text' in dir() else None,
            ),
        )
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass

    total_time = (time.time() - start_time) * 1000
    timings.totalMs = total_time

    debug = DebugInfo(
        textSource=text_source,
        pages=page_count,
        timingsMs=timings,
        rawPdfText=pdf_text[:5000] if pdf_text else None,
        rawOcrText=ocr_text[:5000] if ocr_text else None,
        chosenText=chosen_text[:5000] if chosen_text else None,
        classifierScores=classifier_scores if 'classifier_scores' in dir() else None,
        extractionDetails=ext_details if 'ext_details' in dir() else None,
    )

    debug_store[doc_id] = {
        "rawPdfText": pdf_text,
        "rawOcrText": ocr_text,
        "chosenText": chosen_text,
        "data": data,
        "rows": row_dicts,
        "warnings": warnings,
        "validated": validated,
        "confidence": confidence,
        "debug": debug.model_dump(),
    }

    status = ParseStatus.PARSED if (validated or len(row_dicts) > 0) else ParseStatus.FAILED

    return ParseResponse(
        status=status,
        docType=doc_type,
        confidence=round(confidence, 2),
        validated=validated,
        data=data,
        rows=row_dicts,
        warnings=warnings,
        debug=debug,
    )


@app.get("/debug/{doc_id}")
async def get_debug(doc_id: str, x_parser_key: Optional[str] = Header(None)):
    verify_api_key(x_parser_key)
    if doc_id not in debug_store:
        raise HTTPException(status_code=404, detail="Document not found in debug store")
    return debug_store[doc_id]


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8100"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
