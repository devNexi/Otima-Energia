import re
from typing import Optional
from models import BillData


DISTRIBUTOR_PATTERNS = [
    (r"(?i)\b(cemig)\b", "CEMIG"),
    (r"(?i)\b(copel)\b", "COPEL"),
    (r"(?i)\b(cpfl)\b", "CPFL"),
    (r"(?i)\b(enel)\b", "Enel"),
    (r"(?i)\b(eletropaulo)\b", "Eletropaulo"),
    (r"(?i)\b(light)\b", "Light"),
    (r"(?i)\b(coelba)\b", "Coelba"),
    (r"(?i)\b(celpe)\b", "Celpe"),
    (r"(?i)\b(celesc)\b", "Celesc"),
    (r"(?i)\b(elektro)\b", "Elektro"),
    (r"(?i)\b(energisa)\b", "Energisa"),
    (r"(?i)\b(equatorial)\b", "Equatorial"),
    (r"(?i)\b(neoenergia)\b", "Neoenergia"),
    (r"(?i)\b(EDP)\b", "EDP"),
    (r"(?i)\b(RGE)\b", "RGE"),
    (r"(?i)\b(CEEE)\b", "CEEE"),
    (r"(?i)\b(coelce)\b", "Coelce"),
    (r"(?i)\b(cosern)\b", "Cosern"),
    (r"(?i)\b(ampla)\b", "Ampla"),
    (r"(?i)\b(bandeirante)\b", "Bandeirante"),
]


def parse_br_number(text: str) -> Optional[float]:
    text = text.strip().replace(" ", "")
    text = re.sub(r"[rR]\$\s*", "", text)
    if not text:
        return None
    if re.match(r"^\d{1,3}(\.\d{3})+(,\d+)?$", text):
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        parts = text.split(",")
        if len(parts) == 2 and len(parts[1]) <= 3:
            text = parts[0].replace(".", "") + "." + parts[1]
    try:
        return float(text)
    except ValueError:
        return None


def detect_distributor(text: str) -> Optional[str]:
    for pattern, name in DISTRIBUTOR_PATTERNS:
        if re.search(pattern, text):
            return name
    return None


def detect_reference_month(text: str) -> Optional[str]:
    months_pt = {
        "janeiro": "01", "fevereiro": "02", "março": "03", "marco": "03",
        "abril": "04", "maio": "05", "junho": "06",
        "julho": "07", "agosto": "08", "setembro": "09",
        "outubro": "10", "novembro": "11", "dezembro": "12",
        "jan": "01", "fev": "02", "mar": "03", "abr": "04",
        "mai": "05", "jun": "06", "jul": "07", "ago": "08",
        "set": "09", "out": "10", "nov": "11", "dez": "12",
    }

    ref_patterns = [
        r"(?:m[êe]s\s*(?:de\s*)?refer[êe]ncia|referente\s*(?:a|ao?\s*m[êe]s)?)\s*:?\s*",
        r"(?:compet[êe]ncia|per[ií]odo)\s*:?\s*",
    ]
    for prefix in ref_patterns:
        for month_name, month_num in months_pt.items():
            pattern = prefix + rf"({month_name})\s*(?:de\s+)?/?(\d{{4}})"
            match = re.search(pattern, text.lower())
            if match:
                return f"{match.group(2)}-{month_num}"

        match = re.search(prefix + r"(\d{2})/(\d{4})", text, re.IGNORECASE)
        if match:
            month, year = match.group(1), match.group(2)
            if 1 <= int(month) <= 12:
                return f"{year}-{month}"

    for month_name, month_num in months_pt.items():
        pattern = rf"\b{month_name}\s*(?:de\s+)?/?(\d{{4}})\b"
        match = re.search(pattern, text.lower())
        if match:
            return f"{match.group(1)}-{month_num}"

    match = re.search(r"(\d{2})/(\d{4})", text)
    if match:
        month, year = match.group(1), match.group(2)
        if 1 <= int(month) <= 12:
            return f"{year}-{month}"

    return None


def detect_due_date(text: str) -> Optional[str]:
    patterns = [
        r"vencimento\s*:?\s*(\d{2})/(\d{2})/(\d{4})",
        r"data\s*(?:de\s*)?vencimento\s*:?\s*(\d{2})/(\d{2})/(\d{4})",
        r"vence\s*(?:em)?\s*:?\s*(\d{2})/(\d{2})/(\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            day, month, year = match.group(1), match.group(2), match.group(3)
            return f"{year}-{month}-{day}"
    return None


def detect_total_amount(text: str) -> Optional[float]:
    patterns = [
        r"(?:valor\s*(?:a\s*pagar|total|da\s*fatura))\s*:?\s*R?\$?\s*([\d.,]+)",
        r"(?:total\s*(?:a\s*pagar|da?\s*nota|geral))\s*:?\s*R?\$?\s*([\d.,]+)",
        r"(?:valor\s*l[ií]quido)\s*:?\s*R?\$?\s*([\d.,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = parse_br_number(match.group(1))
            if val and val > 0:
                return val
    return None


def detect_total_energy(text: str) -> Optional[float]:
    patterns = [
        r"(?:consumo\s*(?:ativo|total|registrado|medido))\s*:?\s*([\d.,]+)\s*kWh",
        r"(?:energia\s*(?:ativa|el[ée]trica|consumida))\s*:?\s*([\d.,]+)\s*kWh",
        r"([\d.,]+)\s*kWh\s*(?:consumo|total|ativo)",
        r"(?:total\s*kWh|kWh\s*total)\s*:?\s*([\d.,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = parse_br_number(match.group(1))
            if val and val > 0:
                return val
    return None


def detect_customer_name(text: str) -> Optional[str]:
    patterns = [
        r"(?:nome|cliente|titular|raz[ãa]o\s*social)\s*:?\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+)",
        r"(?:consumidor)\s*:?\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if len(name) > 3:
                return name[:100]
    return None


def detect_customer_id(text: str) -> Optional[str]:
    patterns = [
        r"(?:unidade\s*consumidora|UC|instala[çc][ãa]o)\s*:?\s*(\d[\d./-]+)",
        r"(?:n[úu]mero\s*(?:da\s*)?UC)\s*:?\s*(\d[\d./-]+)",
        r"(?:c[óo]digo\s*(?:do\s*)?cliente)\s*:?\s*(\d[\d./-]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    match = re.search(r"(?:chave\s*(?:de\s*)?acesso|NF[Ee])\s*:?\s*(\d{44})", text)
    if match:
        return match.group(1)
    return None


def detect_tariff_group(text: str) -> Optional[str]:
    match = re.search(r"(?:grupo|subgrupo)\s*:?\s*(A[1-4S]?|B[1-4]?)", text, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    match = re.search(r"\b(A[1-4S]|B[1-4])\b", text)
    if match:
        return match.group(1)
    return None


def detect_invoice_key(text: str) -> Optional[str]:
    match = re.search(r"(\d{44})", text)
    if match:
        return match.group(1)
    return None


def extract_bill(text: str) -> tuple[BillData, list[str], dict]:
    warnings: list[str] = []
    details: dict = {}

    distributor = detect_distributor(text)
    ref_month = detect_reference_month(text)
    due_date = detect_due_date(text)
    total_amount = detect_total_amount(text)
    total_energy = detect_total_energy(text)
    customer_name = detect_customer_name(text)
    customer_id = detect_customer_id(text)
    tariff_group = detect_tariff_group(text)
    invoice_key = detect_invoice_key(text)

    if not distributor:
        warnings.append("Could not detect distributor")
    if not ref_month:
        warnings.append("Could not detect reference month")
    if not total_amount and not total_energy:
        warnings.append("Could not detect total amount or total energy")
    if not customer_id and not invoice_key:
        warnings.append("Could not detect customer ID or invoice key")

    data = BillData(
        distributor=distributor,
        referenceMonth=ref_month,
        dueDate=due_date,
        totalAmount=total_amount,
        totalEnergyKwh=total_energy,
        customerName=customer_name,
        customerId=customer_id,
        tariffGroup=tariff_group,
        invoiceKey=invoice_key,
    )

    details["fieldsDetected"] = sum(1 for v in [
        distributor, ref_month, due_date, total_amount, total_energy,
        customer_name, customer_id, tariff_group, invoice_key
    ] if v is not None)

    return data, warnings, details
