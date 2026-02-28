import re
from typing import Optional
from models import CanonicalPricingRow, PrcData


SUBMARKET_PATTERNS = [
    ("sudeste/centro-oeste", "SE_CO"),
    ("sudeste / centro-oeste", "SE_CO"),
    ("sudeste centro-oeste", "SE_CO"),
    ("se/co", "SE_CO"),
    ("se_co", "SE_CO"),
    ("centro-oeste", "SE_CO"),
    ("sudeste", "SE_CO"),
    ("nordeste", "NE"),
    ("norte", "N"),
    ("sul", "S"),
]

TERM_MAP = {
    "12 meses": 12,
    "12meses": 12,
    "1 ano": 12,
    "1ano": 12,
    "anual": 12,
    "annual": 12,
    "24 meses": 24,
    "24meses": 24,
    "2 anos": 24,
    "2anos": 24,
    "bianual": 24,
    "biennial": 24,
    "bienal": 24,
    "36 meses": 36,
    "36meses": 36,
    "3 anos": 36,
    "3anos": 36,
    "trianual": 36,
    "triennial": 36,
    "trienal": 36,
    "48 meses": 48,
    "48meses": 48,
    "4 anos": 48,
    "4anos": 48,
    "60 meses": 60,
    "60meses": 60,
    "5 anos": 60,
    "5anos": 60,
    "quinquenal": 60,
    "quinquennial": 60,
}

PRODUCT_MAP = {
    "convencional": "CONVENCIONAL",
    "conv": "CONVENCIONAL",
    "conv.": "CONVENCIONAL",
    "energia convencional": "CONVENCIONAL",
    "incentivada 50": "INCENTIVADA_50",
    "incentivada 50%": "INCENTIVADA_50",
    "incentivada50": "INCENTIVADA_50",
    "i50": "INCENTIVADA_50",
    "inc 50": "INCENTIVADA_50",
    "inc50": "INCENTIVADA_50",
    "incentivada especial": "INCENTIVADA_50",
    "incentivada": "INCENTIVADA_50",
    "i5": "INCENTIVADA_50",
    "incentivada 100": "INCENTIVADA_100",
    "incentivada 100%": "INCENTIVADA_100",
    "i100": "INCENTIVADA_100",
    "inc 100": "INCENTIVADA_100",
    "inc100": "INCENTIVADA_100",
    "i1": "INCENTIVADA_100",
}

PRICE_MIN = 50.0
PRICE_MAX = 1500.0

NAMED_PERIOD_PATTERNS = [
    (r"\bquinquenal\b", 60),
    (r"\btrianual\b", 36),
    (r"\btrienal\b", 36),
    (r"\bbianual\b", 24),
    (r"\bbienal\b", 24),
    (r"\banual\b", 12),
    (r"\bannual\b", 12),
]


def parse_brazilian_number(text: str) -> Optional[float]:
    text = text.strip().replace(" ", "")
    text = re.sub(r"[rR]\$", "", text)
    text = text.replace("R$", "").replace("r$", "").strip()
    if not text:
        return None
    if re.match(r"^\d{1,3}(\.\d{3})+(,\d+)?$", text):
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(".", "").replace(",", ".")
    try:
        val = float(text)
        return val
    except ValueError:
        return None


def detect_submarket(text: str) -> Optional[str]:
    text_lower = text.lower().strip()
    for pattern, code in SUBMARKET_PATTERNS:
        if pattern in text_lower:
            return code
    if re.match(r"^\s*ne\s*$", text_lower):
        return "NE"
    if re.match(r"^\s*n\s*$", text_lower):
        return "N"
    if re.match(r"^\s*s\s*$", text_lower):
        return "S"
    return None


def detect_term(text: str) -> Optional[int]:
    text_lower = text.lower().strip()
    for pattern, months in TERM_MAP.items():
        if pattern in text_lower:
            return months
    match = re.search(r"(\d+)\s*(?:meses|mes|m)", text_lower)
    if match:
        val = int(match.group(1))
        if val in (12, 24, 36, 48, 60):
            return val
    return None


def detect_named_period(text: str) -> Optional[int]:
    text_lower = text.lower().strip()
    for pattern, months in NAMED_PERIOD_PATTERNS:
        if re.search(pattern, text_lower):
            return months
    year_range = re.search(r"(\d{4})\s*[-–]\s*(\d{4})", text)
    if year_range:
        years = int(year_range.group(2)) - int(year_range.group(1))
        if 0 < years <= 10:
            return years * 12
    match = re.search(r"(\d+)\s*(?:meses|mes|anos?|m\b)", text_lower)
    if match:
        val = int(match.group(1))
        if val <= 5:
            val = val * 12
        if val in (12, 24, 36, 48, 60):
            return val
    return None


def detect_product(text: str) -> Optional[str]:
    text_lower = text.lower().strip()
    for pattern, code in PRODUCT_MAP.items():
        if pattern in text_lower:
            return code
    return None


def detect_all_products(text: str) -> list[str]:
    text_lower = text.lower().strip()
    found: list[tuple[int, str]] = []

    patterns = [
        (r"(?:energia\s+)?convencional", "CONVENCIONAL"),
        (r"(?:energia\s+)?incentivada\s*100\s*%?", "INCENTIVADA_100"),
        (r"(?:energia\s+)?incentivada\s*50\s*%?", "INCENTIVADA_50"),
        (r"(?:energia\s+)?incentivada\s+especial", "INCENTIVADA_50"),
    ]

    for pattern, product in patterns:
        for m in re.finditer(pattern, text_lower):
            if product not in [p for _, p in found]:
                found.append((m.start(), product))

    if not found and "incentivada" in text_lower:
        pos = text_lower.index("incentivada")
        found.append((pos, "INCENTIVADA_50"))

    found.sort(key=lambda x: x[0])
    return [p for _, p in found]


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
    for month_name, month_num in months_pt.items():
        pattern = rf"{month_name}\s*(?:de\s+|/\s*)?(\d{{4}})"
        match = re.search(pattern, text.lower())
        if match:
            year = match.group(1)
            return f"{year}-{month_num}"

    match = re.search(r"(\d{2})/(\d{4})", text)
    if match:
        month, year = match.group(1), match.group(2)
        if 1 <= int(month) <= 12:
            return f"{year}-{month}"

    match = re.search(r"(\d{4})-(\d{2})", text)
    if match:
        year, month = match.group(1), match.group(2)
        if 1 <= int(month) <= 12:
            return f"{year}-{month}"
    return None


def detect_supplier(text: str) -> Optional[str]:
    supplier_patterns = [
        (r"(?i)\b(axia)\b", "Axia"),
        (r"(?i)\b(boven)\b", "Boven"),
        (r"(?i)\b(capacitech)\b", "Capacitech"),
        (r"(?i)\b(tradener)\b", "Tradener"),
        (r"(?i)\b(comerc)\b", "Comerc"),
        (r"(?i)\b(engie)\b", "Engie"),
        (r"(?i)\b(enel)\b", "Enel"),
        (r"(?i)\b(copel)\b", "Copel"),
        (r"(?i)\b(statkraft)\b", "Statkraft"),
        (r"(?i)\b(matrix)\b", "Matrix"),
        (r"(?i)\b(safira)\b", "Safira"),
        (r"(?i)\b(alianca|aliança)\b", "Aliança"),
        (r"(?i)\b(omega|ômega)\b", "Omega"),
        (r"(?i)\b(light)\b", "Light"),
        (r"(?i)\b(voltalia)\b", "Voltalia"),
        (r"(?i)\b(focus)\b", "Focus"),
        (r"(?i)\b(rio\s*energy)\b", "Rio Energy"),
        (r"(?i)\b(delta)\b", "Delta"),
    ]
    for pattern, name in supplier_patterns:
        if re.search(pattern, text):
            return name
    return None


def _detect_submarket_columns(line: str) -> list[str]:
    sm_pattern = r"\b(SE/CO|SE_CO|SECO|NE|N|S|SUL|NORTE|NORDESTE|SUDESTE)\b"
    matches = list(re.finditer(sm_pattern, line, re.IGNORECASE))
    if len(matches) < 3:
        return []

    SM_NORMALIZE = {
        "SE/CO": "SE_CO", "SE_CO": "SE_CO", "SECO": "SE_CO", "SUDESTE": "SE_CO",
        "S": "S", "SUL": "S",
        "NE": "NE", "NORDESTE": "NE",
        "N": "N", "NORTE": "N",
    }
    cols = []
    for m in matches:
        raw = m.group(1).upper()
        normalized = SM_NORMALIZE.get(raw, raw)
        cols.append(normalized)
    return cols


def _extract_prices_from_line(line: str) -> list[float]:
    prices = re.findall(r"(\d{2,4}[.,]\d{2})", line)
    parsed = []
    for p in prices:
        val = parse_brazilian_number(p)
        if val is not None and PRICE_MIN <= val <= PRICE_MAX:
            parsed.append(val)
    return parsed


def extract_prc_tables(text: str, supplier: Optional[str] = None, ref_month: Optional[str] = None, source_doc_id: Optional[str] = None) -> tuple[list[CanonicalPricingRow], list[str], dict]:
    rows: list[CanonicalPricingRow] = []
    warnings: list[str] = []
    details: dict = {"method": "deterministic", "sections_found": 0}

    lines = text.split("\n")

    columnar_rows = _try_columnar_extraction(lines, supplier, ref_month, source_doc_id, warnings, details)
    if columnar_rows and len(columnar_rows) >= 4:
        details["method"] = "columnar"
        details["total_rows"] = len(columnar_rows)
        return columnar_rows, warnings, details

    section_rows = _try_section_extraction(lines, supplier, ref_month, source_doc_id, warnings, details)
    if section_rows:
        details["total_rows"] = len(section_rows)
        return section_rows, warnings, details

    fallback_rows, fallback_warnings = _fallback_line_scan(text, supplier, ref_month, source_doc_id)
    warnings.extend(fallback_warnings)
    details["method"] = "fallback_line_scan"
    details["total_rows"] = len(fallback_rows)
    return fallback_rows, warnings, details


def _try_columnar_extraction(lines: list[str], supplier: Optional[str], ref_month: Optional[str], source_doc_id: Optional[str], warnings: list[str], details: dict) -> list[CanonicalPricingRow]:
    rows: list[CanonicalPricingRow] = []

    sm_header_line_idx = None
    submarket_columns: list[str] = []
    product_sections: list[str] = []

    for i, line in enumerate(lines):
        cols = _detect_submarket_columns(line.strip())
        if len(cols) >= 4:
            submarket_columns = cols
            sm_header_line_idx = i
            break

    if not submarket_columns or sm_header_line_idx is None:
        return []

    for i in range(max(0, sm_header_line_idx - 5), sm_header_line_idx):
        line = lines[i].strip()
        prods = detect_all_products(line)
        for p in prods:
            if p not in product_sections:
                product_sections.append(p)

    if not product_sections:
        product_sections = ["CONVENCIONAL"]

    n_submarkets_per_product = len(submarket_columns) // len(product_sections) if len(product_sections) > 0 else len(submarket_columns)
    if n_submarkets_per_product < 2:
        n_submarkets_per_product = 4

    unique_sms = []
    seen = set()
    for sm in submarket_columns:
        if sm not in seen:
            unique_sms.append(sm)
            seen.add(sm)

    if len(unique_sms) < len(submarket_columns) and len(submarket_columns) == n_submarkets_per_product * len(product_sections):
        pass
    elif len(unique_sms) == len(submarket_columns) and len(product_sections) > 1:
        n_submarkets_per_product = len(submarket_columns)
        submarket_columns = submarket_columns * len(product_sections)

    for i in range(sm_header_line_idx + 1, len(lines)):
        line = lines[i].strip()
        if not line:
            continue

        term = detect_named_period(line)
        if term is None:
            continue

        prices = _extract_prices_from_line(line)
        if not prices:
            continue

        expected_total = n_submarkets_per_product * len(product_sections)

        if len(prices) == expected_total:
            for prod_idx, product in enumerate(product_sections):
                start = prod_idx * n_submarkets_per_product
                for sm_idx in range(n_submarkets_per_product):
                    price_idx = start + sm_idx
                    if price_idx < len(prices):
                        sm = unique_sms[sm_idx] if sm_idx < len(unique_sms) else submarket_columns[price_idx] if price_idx < len(submarket_columns) else "UNKNOWN"
                        rows.append(CanonicalPricingRow(
                            supplier=supplier,
                            referenceMonth=ref_month,
                            product=product,
                            submarket=sm,
                            termMonths=term,
                            price=prices[price_idx],
                            sourceDocId=source_doc_id,
                            confidence=0.9,
                            isOutlier=False,
                            outlierReason=None,
                        ))
        elif len(prices) == n_submarkets_per_product and len(product_sections) == 1:
            for sm_idx, price in enumerate(prices):
                sm = unique_sms[sm_idx] if sm_idx < len(unique_sms) else "UNKNOWN"
                rows.append(CanonicalPricingRow(
                    supplier=supplier,
                    referenceMonth=ref_month,
                    product=product_sections[0],
                    submarket=sm,
                    termMonths=term,
                    price=price,
                    sourceDocId=source_doc_id,
                    confidence=0.9,
                    isOutlier=False,
                    outlierReason=None,
                ))
        elif len(prices) >= n_submarkets_per_product:
            for prod_idx, product in enumerate(product_sections):
                start = prod_idx * n_submarkets_per_product
                for sm_idx in range(n_submarkets_per_product):
                    price_idx = start + sm_idx
                    if price_idx < len(prices):
                        sm = unique_sms[sm_idx] if sm_idx < len(unique_sms) else "UNKNOWN"
                        rows.append(CanonicalPricingRow(
                            supplier=supplier,
                            referenceMonth=ref_month,
                            product=product,
                            submarket=sm,
                            termMonths=term,
                            price=prices[price_idx],
                            sourceDocId=source_doc_id,
                            confidence=0.7,
                            isOutlier=False,
                            outlierReason=None,
                        ))

    details["sections_found"] = len(product_sections)
    return rows


def _try_section_extraction(lines: list[str], supplier: Optional[str], ref_month: Optional[str], source_doc_id: Optional[str], warnings: list[str], details: dict) -> list[CanonicalPricingRow]:
    rows: list[CanonicalPricingRow] = []
    current_product = None
    current_submarket = None
    current_terms: list[int] = []
    section_prices: dict = {}

    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue

        prod = detect_product(line_stripped)
        if prod:
            if current_product and section_prices:
                rows.extend(_flush_section(current_product, section_prices, supplier, ref_month, source_doc_id, warnings))
                details["sections_found"] += 1
            current_product = prod
            section_prices = {}
            current_terms = []

        period = detect_named_period(line_stripped)
        if period:
            current_terms = [period]

        if not current_terms:
            terms_in_line = re.findall(r"(\d+)\s*(?:meses|mes|anos?|m\b)", line_stripped.lower())
            found_terms = []
            for t in terms_in_line:
                tv = int(t)
                if tv <= 5:
                    tv = tv * 12
                if tv in (12, 24, 36, 48, 60):
                    found_terms.append(tv)
            if found_terms:
                current_terms = found_terms

        subm = detect_submarket(line_stripped)
        if subm:
            current_submarket = subm

        prices = _extract_prices_from_line(line_stripped)

        if prices and current_submarket:
            if not current_product:
                current_product = "CONVENCIONAL"

            if current_terms and len(prices) == len(current_terms):
                for term, price in zip(current_terms, prices):
                    key = (current_submarket, term)
                    if key not in section_prices:
                        section_prices[key] = price
            elif current_terms and len(current_terms) == 1:
                key = (current_submarket, current_terms[0])
                if key not in section_prices:
                    section_prices[key] = prices[0]
            elif current_terms:
                for j, price in enumerate(prices):
                    if j < len(current_terms):
                        key = (current_submarket, current_terms[j])
                        if key not in section_prices:
                            section_prices[key] = price
            elif len(prices) == 3:
                default_terms = [12, 36, 60]
                for term, price in zip(default_terms, prices):
                    key = (current_submarket, term)
                    if key not in section_prices:
                        section_prices[key] = price
            elif len(prices) == 1:
                key = (current_submarket, 12)
                if key not in section_prices:
                    section_prices[key] = prices[0]

    if current_product and section_prices:
        rows.extend(_flush_section(current_product, section_prices, supplier, ref_month, source_doc_id, warnings))
        details["sections_found"] += 1

    return rows


def _flush_section(product: str, prices: dict, supplier: Optional[str], ref_month: Optional[str], source_doc_id: Optional[str], warnings: list[str]) -> list[CanonicalPricingRow]:
    rows = []
    for (submarket, term), price in prices.items():
        is_outlier = False
        outlier_reason = None
        if price < PRICE_MIN or price > PRICE_MAX:
            is_outlier = True
            outlier_reason = f"Price {price} outside plausible range [{PRICE_MIN}, {PRICE_MAX}]"
            warnings.append(outlier_reason)

        rows.append(CanonicalPricingRow(
            supplier=supplier,
            referenceMonth=ref_month,
            product=product,
            submarket=submarket,
            termMonths=term,
            price=price,
            sourceDocId=source_doc_id,
            confidence=0.5 if is_outlier else 1.0,
            isOutlier=is_outlier,
            outlierReason=outlier_reason,
        ))
    return rows


def _fallback_line_scan(text: str, supplier: Optional[str], ref_month: Optional[str], source_doc_id: Optional[str]) -> tuple[list[CanonicalPricingRow], list[str]]:
    rows = []
    warnings = ["Using fallback line scan - results may be less accurate"]
    lines = text.split("\n")

    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue

        subm = detect_submarket(line_stripped)
        if not subm:
            continue

        prices = _extract_prices_from_line(line_stripped)
        if not prices:
            continue

        prod = detect_product(line_stripped) or "CONVENCIONAL"

        term = detect_named_period(line_stripped)
        if term:
            for price in prices:
                rows.append(CanonicalPricingRow(
                    supplier=supplier, referenceMonth=ref_month, product=prod,
                    submarket=subm, termMonths=term, price=price,
                    sourceDocId=source_doc_id, confidence=0.5,
                ))
            continue

        terms_in_line = re.findall(r"(\d+)\s*(?:meses|mes|anos?|m\b)", line_stripped.lower())
        found_terms = []
        for t in terms_in_line:
            tv = int(t)
            if tv <= 5:
                tv = tv * 12
            if tv in (12, 24, 36, 48, 60):
                found_terms.append(tv)

        if found_terms and len(prices) == len(found_terms):
            for t, price in zip(found_terms, prices):
                rows.append(CanonicalPricingRow(
                    supplier=supplier, referenceMonth=ref_month, product=prod,
                    submarket=subm, termMonths=t, price=price,
                    sourceDocId=source_doc_id, confidence=0.6,
                ))
        elif len(prices) == 3:
            for t, price in zip([12, 36, 60], prices):
                rows.append(CanonicalPricingRow(
                    supplier=supplier, referenceMonth=ref_month, product=prod,
                    submarket=subm, termMonths=t, price=price,
                    sourceDocId=source_doc_id, confidence=0.5,
                ))
        else:
            for price in prices:
                rows.append(CanonicalPricingRow(
                    supplier=supplier, referenceMonth=ref_month, product=prod,
                    submarket=subm, termMonths=12, price=price,
                    sourceDocId=source_doc_id, confidence=0.4,
                ))

    return rows, warnings


def extract_prc(text: str, source_doc_id: Optional[str] = None) -> tuple[PrcData, list[CanonicalPricingRow], list[str], dict]:
    supplier = detect_supplier(text)
    ref_month = detect_reference_month(text)
    rows, warnings, details = extract_prc_tables(text, supplier, ref_month, source_doc_id)

    products_found = list(set(r.product for r in rows))

    data = PrcData(
        supplier=supplier,
        referenceMonth=ref_month,
        productTypesFound=products_found,
    )

    if len(rows) < 4:
        warnings.append(f"Only {len(rows)} rows extracted, minimum expected is 4")
    elif len(rows) < 12:
        warnings.append(f"Only {len(rows)} rows extracted, full extraction expects >= 12")

    details["supplier"] = supplier
    details["referenceMonth"] = ref_month
    details["products"] = products_found

    return data, rows, warnings, details
