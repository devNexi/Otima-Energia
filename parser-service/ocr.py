import os
import subprocess
import tempfile
import shutil
from pathlib import Path


def check_tesseract() -> tuple[bool, str]:
    try:
        result = subprocess.run(
            ["tesseract", "--list-langs"],
            capture_output=True, text=True, timeout=10
        )
        langs = result.stdout.lower()
        has_por = "por" in langs
        return has_por, result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False, "tesseract not found"


def check_pdftoppm() -> tuple[bool, str]:
    try:
        result = subprocess.run(
            ["pdftoppm", "-v"],
            capture_output=True, text=True, timeout=10
        )
        version = result.stderr.strip() or result.stdout.strip()
        return True, version
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False, "pdftoppm not found"


def extract_text_pdfplumber(pdf_path: str) -> tuple[str, int]:
    import pdfplumber
    texts = []
    page_count = 0
    with pdfplumber.open(pdf_path) as pdf:
        page_count = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            texts.append(f"--- PAGE {i+1} ---\n{text}")
    return "\n\n".join(texts), page_count


def extract_text_ocr(pdf_path: str, dpi: int = 300, langs: str = "por+eng") -> str:
    tmpdir = tempfile.mkdtemp(prefix="parser_ocr_")
    try:
        subprocess.run(
            ["pdftoppm", "-r", str(dpi), "-png", pdf_path, os.path.join(tmpdir, "page")],
            capture_output=True, timeout=120, check=True
        )

        png_files = sorted(Path(tmpdir).glob("page-*.png"))
        if not png_files:
            png_files = sorted(Path(tmpdir).glob("page*.png"))

        if not png_files:
            return ""

        ocr_texts = []
        for i, png_file in enumerate(png_files):
            try:
                result = subprocess.run(
                    ["tesseract", str(png_file), "stdout", "-l", langs, "--psm", "6"],
                    capture_output=True, text=True, timeout=60
                )
                text = result.stdout.strip()
                ocr_texts.append(f"--- PAGE {i+1} (OCR) ---\n{text}")
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
                ocr_texts.append(f"--- PAGE {i+1} (OCR FAILED) ---\n{str(e)}")

        return "\n\n".join(ocr_texts)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def should_use_ocr(pdf_text: str, page_count: int) -> bool:
    if not pdf_text.strip():
        return True

    text_len = len(pdf_text.strip())
    if page_count > 0 and text_len / page_count < 50:
        return True

    garbled_ratio = sum(1 for c in pdf_text if ord(c) > 0xFFFF or c in "□■◊◆●▪") / max(len(pdf_text), 1)
    if garbled_ratio > 0.05:
        return True

    return False


def choose_best_text(pdf_text: str, ocr_text: str, page_count: int) -> tuple[str, str]:
    if not pdf_text.strip() and ocr_text.strip():
        return ocr_text, "ocr"
    if not ocr_text.strip() and pdf_text.strip():
        return pdf_text, "pdf_text"

    pdf_tokens = len(pdf_text.split())
    ocr_tokens = len(ocr_text.split())

    if pdf_tokens > ocr_tokens * 1.2:
        return pdf_text, "pdf_text"
    elif ocr_tokens > pdf_tokens * 1.5:
        return ocr_text, "ocr"

    return pdf_text, "pdf_text"
