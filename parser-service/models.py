from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum


class DocType(str, Enum):
    PRC = "PRC"
    BILL = "BILL"
    OTHER = "OTHER"


class ParseStatus(str, Enum):
    PARSED = "parsed"
    FAILED = "failed"


class CanonicalPricingRow(BaseModel):
    docType: Literal["PRC"] = "PRC"
    supplier: Optional[str] = None
    referenceMonth: Optional[str] = None
    product: str
    submarket: str
    termMonths: int
    price: float
    currency: str = "BRL"
    unit: str = "R$/MWh"
    sourceDocId: Optional[str] = None
    confidence: float = 1.0
    isOutlier: bool = False
    outlierReason: Optional[str] = None


class BillData(BaseModel):
    distributor: Optional[str] = None
    referenceMonth: Optional[str] = None
    dueDate: Optional[str] = None
    totalAmount: Optional[float] = None
    totalEnergyKwh: Optional[float] = None
    customerName: Optional[str] = None
    customerId: Optional[str] = None
    tariffGroup: Optional[str] = None
    readingDatePrevious: Optional[str] = None
    readingDateCurrent: Optional[str] = None
    invoiceKey: Optional[str] = None


class PrcData(BaseModel):
    supplier: Optional[str] = None
    referenceMonth: Optional[str] = None
    unit: str = "R$/MWh"
    productTypesFound: list[str] = Field(default_factory=list)
    notes: Optional[str] = None


class Timings(BaseModel):
    classifyMs: float = 0
    extractMs: float = 0
    validateMs: float = 0
    totalMs: float = 0


class DebugInfo(BaseModel):
    textSource: str = "pdf_text"
    pages: int = 0
    timingsMs: Timings = Field(default_factory=Timings)
    rawPdfText: Optional[str] = None
    rawOcrText: Optional[str] = None
    chosenText: Optional[str] = None
    classifierScores: Optional[dict] = None
    extractionDetails: Optional[dict] = None


class ParseResponse(BaseModel):
    status: ParseStatus
    docType: DocType
    confidence: float = Field(ge=0.0, le=1.0)
    validated: bool
    data: dict = Field(default_factory=dict)
    rows: list[dict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    debug: DebugInfo = Field(default_factory=DebugInfo)


class HealthResponse(BaseModel):
    status: str
    tesseract_por: bool
    pdftoppm: bool
    pdfplumber: bool
    openai_key: bool
