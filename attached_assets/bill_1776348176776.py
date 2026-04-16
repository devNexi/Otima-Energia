"""
Ótima Energia — Bill Extractor v2.0
Extracts structured data from Brazilian electricity bills (faturas de energia).

Handles:
- Standard distributor bills (Enel, CPFL, Equatorial, Cemig, Light, etc.)
- GD reseller / comercializadora bills (ABL Energia, etc.)
- Bills with ICMS/PIS/COFINS interleaved between labels and values
- Brazilian number formatting (96.199,73 → 96199.73)
- Redacted CNPJs (07..***.***-56)
- Non-standard tariff groups (A-Conc, Comercial)
- Bandeira/tariff flag extraction
- Accented characters in Portuguese labels
"""

import re
import pdfplumber
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


# =============================================================================
# BRAZILIAN NUMBER PARSING
# =============================================================================

def parse_br_number(text: str) -> Optional[float]:
    """
    Parse Brazilian number formats robustly.

    Handles:
      96.199,73  → 96199.73   (dots=thousands, comma=decimal)
      1.234,56   → 1234.56
      1.234      → 1234       (dot=thousands, no decimal)
      121224.6   → 121224.6   (English decimal, large integer part)
      2,70141    → 2.70141    (comma=decimal, no thousands)
      300        → 300.0
      R$**96.199,73 → 96199.73
    """
    if not text:
        return None

    clean = text.strip()
    # Strip currency, asterisks, whitespace
    clean = re.sub(r'[R$*\s]', '', clean)
    if not clean:
        return None

    # Brazilian format: dots as thousands, comma as decimal
    # Pattern: 1.234,56 or 96.199,73 or 113.158,77
    if re.match(r'^-?\d{1,3}(\.\d{3})+(,\d+)?$', clean):
        clean = clean.replace('.', '').replace(',', '.')
        try:
            return float(clean)
        except ValueError:
            return None

    # Comma as decimal only: 2,70141 or 1234,56
    if ',' in clean and '.' not in clean:
        clean = clean.replace(',', '.')
        try:
            return float(clean)
        except ValueError:
            return None

    # Single dot — could be thousands (1.234) or decimal (121224.6)
    if '.' in clean and ',' not in clean and clean.count('.') == 1:
        parts = clean.split('.')
        # If exactly 3 digits after dot → likely thousands separator
        if len(parts[1]) == 3 and len(parts[0]) <= 3:
            clean = clean.replace('.', '')
        # Otherwise treat as decimal (121224.6, 32.90566, etc.)
        try:
            return float(clean)
        except ValueError:
            return None

    # Plain integer or already float-compatible
    try:
        return float(clean)
    except ValueError:
        return None


# =============================================================================
# TEXT EXTRACTION
# =============================================================================

def extract_text_from_pdf(pdf_path: str) -> Tuple[str, Dict[str, Any]]:
    """
    Extract text from PDF using multiple pdfplumber strategies.
    Returns (full_text, debug_info).
    """
    pages_text = []
    debug = {"pages": 0, "textSource": "pdfplumber", "extractionMethods": []}

    try:
        with pdfplumber.open(pdf_path) as pdf:
            debug["pages"] = len(pdf.pages)

            for i, page in enumerate(pdf.pages):
                # Method 1: Standard extraction
                t1 = page.extract_text() or ""

                # Method 2: Tighter tolerances for table-heavy bills
                t2 = page.extract_text(x_tolerance=1, y_tolerance=1) or ""

                # Method 3: Table cell text (catches values in grid layouts)
                t3_parts = []
                for table in (page.extract_tables() or []):
                    for row in table:
                        t3_parts.append(" ".join(str(c) for c in row if c))
                t3 = " ".join(t3_parts)

                # Pick longest
                best = max([t1, t2, t3], key=len)
                method = ["standard", "tight", "tables"][[t1, t2, t3].index(best)]
                debug["extractionMethods"].append(f"page{i}:{method}({len(best)})")

                pages_text.append(best)

    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        debug["error"] = str(e)

    full_text = "\n".join(pages_text)
    return full_text, debug


# =============================================================================
# FIELD EXTRACTORS — each returns (value, confidence, reason)
# =============================================================================

def extract_customer_name(text: str) -> Tuple[Optional[str], float, str]:
    """Extract business/customer name."""

    # Pattern 1: After "Dados do Cliente" header, first all-caps line
    m = re.search(
        r'Dados\s+do\s+Cliente[^\n]*\n\s*([A-Z][A-Z0-9\s\.\,\'\-\&`´]+)',
        text, re.IGNORECASE
    )
    if m:
        name = m.group(1).strip().split('\n')[0].strip()
        # Remove trailing field labels
        for suffix in ['Data Emissão', 'Data Emiss', 'CPF', 'CNPJ', 'Mes/Ano', 'Histórico']:
            if suffix in name:
                name = name.split(suffix)[0].strip()
        if len(name) > 3:
            return name, 0.95, "after_dados_do_cliente"

    # Pattern 2: Known business suffixes
    m = re.search(
        r'\n\s*([A-Z][A-Za-z0-9\s\.\,\'\-\&`´]+'
        r'(?:LTDA|S/?A|EIRELI|MEI|SHOPPING|CENTER|PLAZA|CONDOMINIO|CONDOMINÍO'
        r'|EMPRESA|INDUSTRIA|COMERCIO|ASSOCIA|HOSPITAL|HOTEL|MERCADO))',
        text
    )
    if m:
        name = m.group(1).strip().split('\n')[0].strip()
        if len(name) > 3:
            return name, 0.90, "business_suffix_match"

    # Pattern 3: CONSUMIDOR/CLIENTE/RAZÃO SOCIAL label
    for label in [r'CONSUMIDOR', r'CLIENTE', r'RAZ[ÃA]O\s*SOCIAL', r'NOME']:
        m = re.search(label + r':?\s*([A-Z][A-Za-z0-9\s\.\,\'\-\&`´]{3,80})', text)
        if m:
            name = m.group(1).strip().split('\n')[0].strip()
            if len(name) > 3:
                return name, 0.85, f"label_{label[:8]}"

    return None, 0.0, "not_found"


def extract_cnpj(text: str) -> Tuple[Optional[str], float, str]:
    """Extract customer CNPJ/CPF. Handles redacted values. Distinguishes customer vs supplier."""

    # Priority 1: "CPF/CNPJ:" label — this is almost always the customer's
    m = re.search(r'(?:CPF\s*/?\s*CNPJ|CNPJ\s*/?\s*CPF)\s*:?\s*([0-9.*/-]+)', text, re.IGNORECASE)
    if m:
        val = m.group(1).strip()
        if '*' in val or '..' in val:
            return "REDACTED", 0.50, "redacted_cnpj"
        digits = re.sub(r'\D', '', val)
        if len(digits) >= 11:
            return val, 0.95, "cpf_cnpj_label"

    # Priority 2: "CNPJ DO CONSUMIDOR" / "CNPJ DO CLIENTE"
    m = re.search(
        r'CNPJ\s*(?:DO\s*)?(?:CONSUMIDOR|CLIENTE)\s*:?\s*([0-9./-]+)',
        text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip(), 0.95, "cnpj_consumidor"

    # Priority 3: Standard CNPJ format — but skip if it's near supplier/concessionária context
    for m in re.finditer(r'(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})', text):
        context_before = text[max(0, m.start()-80):m.start()].upper()
        # Skip if this CNPJ is in the supplier/company header
        if any(kw in context_before for kw in ['CONCESSION', 'DISTRIBUIDORA', 'CNPJ\n', 'WWW.', 'ENERGIA\n']):
            continue
        return m.group(1), 0.80, "standard_cnpj"

    # Priority 4: Bare "CNPJ: XX.XXX.XXX/XXXX-XX" anywhere
    m = re.search(r'CNPJ\s*:?\s*(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})', text, re.IGNORECASE)
    if m:
        return m.group(1), 0.70, "cnpj_generic"

    return None, 0.0, "not_found"


def extract_uc_code(text: str) -> Tuple[Optional[str], float, str]:
    """Extract Unidade Consumidora code. Prioritizes data section over footer."""

    # Pattern 1: "Unidade  128271787" in data table (number right after "Unidade")
    # This catches the split layout where "Consumidora" is on the next line
    m = re.search(r'(?:Dados\s+da\s+Medi|Dados\s+do\s+Cliente).*?Unidade\s+(\d{6,15})', text, re.IGNORECASE | re.DOTALL)
    if m:
        return m.group(1), 0.95, "uc_data_section"

    # Pattern 2: Explicit label "Unidade Consumidora: 12345"
    m = re.search(r'Unidade\s+Consumidora\s*:?\s*(\d{6,15})', text, re.IGNORECASE)
    if m:
        # Avoid matching footer "INFORME A UNIDADE CONSUMIDORA 16809956"
        start = m.start()
        context_before = text[max(0, start-50):start].upper()
        if 'INFORME' not in context_before and 'LIGAR' not in context_before:
            return m.group(1), 0.95, "uc_label"

    # Pattern 3: N° DA INSTALAÇÃO
    m = re.search(r'N[º°]\s*(?:DA\s*)?INSTALA[ÇC][ÃA]O\s*:?\s*(\d{6,15})', text, re.IGNORECASE)
    if m:
        return m.group(1), 0.95, "instalacao"

    # Pattern 4: Generic "Unidade NUMBER" (first occurrence, not after "INFORME")
    for m in re.finditer(r'(?:Unidade)\s+(\d{6,15})', text, re.IGNORECASE):
        context_before = text[max(0, m.start()-50):m.start()].upper()
        if 'INFORME' not in context_before and 'LIGAR' not in context_before:
            return m.group(1), 0.90, "uc_nearby"

    return None, 0.0, "not_found"


def extract_uc_empreendimento(text: str) -> Tuple[Optional[str], float, str]:
    """Extract UC do Empreendimento (parent UC for GD)."""

    m = re.search(r'UC\s+do\s+(\d{6,15})\s*\n?\s*Empreendimento', text, re.IGNORECASE)
    if m:
        return m.group(1), 0.95, "uc_do_empreendimento"

    m = re.search(r'Empreendimento\s*:?\s*(\d{6,15})', text, re.IGNORECASE)
    if m:
        return m.group(1), 0.90, "empreendimento_label"

    return None, 0.0, "not_found"


def extract_reference_month(text: str) -> Tuple[Optional[str], float, str]:
    """Extract reference month. Returns YYYY-MM or MM/YYYY."""

    patterns = [
        # "Referente à 12/2025" or "Referente a 12/2025" (handle accented à)
        (r'Referente\s+[àa]\s*:?\s*(\d{1,2})\s*/\s*(\d{4})', 0.95, "referente_a"),
        # "Mês de Referência: 12/2025"
        (r'M[êeÊE]S?\s*(?:DE\s*)?REFER[êeÊE]NCIA\s*:?\s*(\d{1,2})\s*/\s*(\d{4})', 0.95, "mes_referencia"),
        # "Competência: 12/2025"
        (r'Compet[êe]ncia\s*:?\s*(\d{1,2})\s*/\s*(\d{4})', 0.90, "competencia"),
        # "Mês/Ano: 12/2025"
        (r'M[êe]s\s*/\s*Ano\s*:?\s*(\d{1,2})\s*/\s*(\d{4})', 0.90, "mes_ano"),
    ]

    for pattern, conf, reason in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            month = m.group(1).zfill(2)
            year = m.group(2)
            return f"{year}-{month}", conf, reason

    return None, 0.0, "not_found"


def extract_due_date(text: str) -> Tuple[Optional[str], float, str]:
    """Extract due date (vencimento)."""

    patterns = [
        (r'Vencimento\s*:?\s*(\d{2}/\d{2}/\d{4})', 0.95, "vencimento"),
        (r'DATA\s*(?:DE\s*|DO\s*)?VENCIMENTO\s*:?\s*(\d{2}/\d{2}/\d{4})', 0.95, "data_vencimento"),
        (r'Pagar\s*at[ée]\s*:?\s*(\d{2}/\d{2}/\d{4})', 0.90, "pagar_ate"),
    ]

    for pattern, conf, reason in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1), conf, reason

    return None, 0.0, "not_found"


def extract_grupo_subgrupo(text: str) -> Tuple[Optional[str], Optional[str], float, str]:
    """Extract Grupo and Subgrupo. Handles A-Conc, Comercial, etc."""

    grupo = None
    subgrupo = None
    conf = 0.0
    reason = "not_found"

    # Pattern 1: Table layout "Grupo Subgrupo" header, then "A-Conc Comercial"
    m = re.search(
        r'Grupo\s+Subgrupo[^\n]*\n\s*([A-Za-z0-9\-]+)\s+([A-Za-z0-9\-\s]+?)(?:\n|PIS|ICMS|Reservado)',
        text, re.IGNORECASE
    )
    if m:
        raw_grupo = m.group(1).strip()
        raw_subgrupo = m.group(2).strip()

        # Normalize grupo
        if raw_grupo.upper().startswith('A'):
            grupo = 'A'
        elif raw_grupo.upper().startswith('B'):
            grupo = 'B'

        subgrupo = raw_grupo  # Keep full value like "A-Conc"
        return grupo, subgrupo, 0.90, "table_layout"

    # Pattern 2: Standard tariff codes inline
    m = re.search(r'\b(A[1-4S]|AS|B[1-3])\b', text)
    if m:
        code = m.group(1).upper()
        grupo = 'A' if code.startswith('A') else 'B'
        subgrupo = code
        return grupo, subgrupo, 0.95, "standard_code"

    # Pattern 3: "GRUPO: A" or "SUBGRUPO: A4"
    m = re.search(r'GRUPO\s*:?\s*([AB]\d?)', text, re.IGNORECASE)
    if m:
        val = m.group(1).upper()
        grupo = val[0]
        subgrupo = val
        conf = 0.85
        reason = "grupo_label"

    m2 = re.search(r'SUBGRUPO\s*:?\s*([A-Za-z0-9\-]+)', text, re.IGNORECASE)
    if m2:
        subgrupo = m2.group(1).strip()
        if subgrupo.upper().startswith('A'):
            grupo = 'A'
        elif subgrupo.upper().startswith('B'):
            grupo = 'B'
        conf = max(conf, 0.85)
        reason = "subgrupo_label"

    # Pattern 4: "Classificação" section
    m = re.search(
        r'Classifica[çc][ãa]o\s+da\s+Unidade\s+Consumidora.*?(A[1-4S]|AS|B[1-3]|A-\w+)',
        text, re.IGNORECASE | re.DOTALL
    )
    if m and not grupo:
        val = m.group(1).strip()
        grupo = 'A' if val.upper().startswith('A') else 'B'
        subgrupo = val
        return grupo, subgrupo, 0.85, "classificacao_section"

    return grupo, subgrupo, conf, reason


def extract_distributor(text: str) -> Tuple[Optional[str], float, str]:
    """
    Extract the actual electricity distributor.
    Distinguishes between GD resellers (ABL, Prime, etc.) and real distributors.
    """

    KNOWN_DISTRIBUTORS = [
        "Equatorial", "Enel", "CPFL", "Light", "Cemig", "Eletrobras",
        "Neoenergia", "Energisa", "EDP", "Copel", "Celesc", "Coelba",
        "Celpe", "Elektro", "RGE", "CEEE", "Coelce", "Cosern", "Ampla",
        "Bandeirante", "Eletropaulo", "CEB", "AES", "CEAL", "CEPISA",
    ]

    GD_RESELLERS = [
        "ABL", "Ablenergia", "Prime", "Comerc", "Matrix", "Safira",
    ]

    text_upper = text.upper()

    # First: check for real distributor names
    for dist in KNOWN_DISTRIBUTORS:
        if dist.upper() in text_upper:
            return dist, 0.90, "known_distributor"

    # Explicit label
    m = re.search(
        r'(?:DISTRIBUIDORA|CONCESSION[ÁA]RIA)\s*:?\s*([A-Za-z0-9\s\.\-]+?)(?:\n|CNPJ|CEP|$)',
        text, re.IGNORECASE
    )
    if m:
        val = m.group(1).strip()
        if len(val) > 2:
            return val, 0.80, "label_match"

    # Check for GD reseller (lower confidence — it's the intermediary, not the distributor)
    for reseller in GD_RESELLERS:
        if reseller.upper() in text_upper:
            return reseller, 0.50, "gd_reseller_fallback"

    return None, 0.0, "not_found"


def extract_consumption(text: str) -> Tuple[Optional[float], float, str]:
    """Extract total consumption in kWh."""

    patterns = [
        (r'Consumo\s+do\s+m[êe]s\s*\(?\s*k?W?h?\s*\)?\s*:?\s*([\d.,]+)', 0.95, "consumo_do_mes"),
        (r'Consumo\s*\(\s*kWh\s*\)\s*:?\s*([\d.,]+)', 0.90, "consumo_kwh"),
        (r'Total\s+(?:de\s+)?Energia\s*\(?kWh\)?\s*:?\s*([\d.,]+)', 0.90, "total_energia"),
        (r'CONSUMO\s+MENSAL\s*:?\s*([\d.,]+)', 0.85, "consumo_mensal"),
    ]

    for pattern, conf, reason in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = parse_br_number(m.group(1))
            if val and val > 0:
                return val, conf, reason

    return None, 0.0, "not_found"


def extract_consumo_ponta(text: str) -> Tuple[Optional[float], float, str]:
    """
    Extract peak consumption (Consumo Ponta kWh).
    Handles "Consumo Ponta kWh + ICMS/PIS/COFINS  14579.6  2,70141  39.385,42"
    where the number follows the label with possible ICMS text in between.
    """

    # Pattern 1: "Consumo Ponta kWh" followed by optional junk then a number
    # The key insight: the FIRST number after "Consumo Ponta kWh" is the quantity
    m = re.search(
        r'Consumo\s+(?:de\s+)?Ponta\s+kWh\s*\+?\s*(?:ICMS/?PIS/?COFINS)?\s*([\d.,]+)',
        text, re.IGNORECASE
    )
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            return val, 0.95, "consumo_ponta_kwh"

    # Pattern 2: Simpler "Consumo Ponta: 14579.6"
    m = re.search(r'Consumo\s+(?:na\s+)?Ponta\s*:?\s*([\d.,]+)', text, re.IGNORECASE)
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            return val, 0.90, "consumo_ponta_simple"

    # Pattern 3: "PONTA (kWh): 14579.6"
    m = re.search(r'PONTA\s*\(?\s*kWh\s*\)?\s*:?\s*([\d.,]+)', text, re.IGNORECASE)
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            return val, 0.85, "ponta_kwh"

    return None, 0.0, "not_found"


def extract_consumo_fora_ponta(text: str) -> Tuple[Optional[float], float, str]:
    """
    Extract off-peak consumption (Consumo Fora Ponta / F. Ponta kWh).
    Same ICMS handling as ponta.
    """

    # Pattern 1: "Consumo F. Ponta kWh" with optional ICMS
    m = re.search(
        r'Consumo\s+F\.?\s*Ponta\s+kWh\s*\+?\s*(?:ICMS/?PIS/?COFINS)?\s*([\d.,]+)',
        text, re.IGNORECASE
    )
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            return val, 0.95, "consumo_fponta_kwh"

    # Pattern 2: "Consumo Fora Ponta"
    m = re.search(
        r'Consumo\s+Fora\s+(?:de\s+)?Ponta\s*\(?kWh\)?\s*:?\s*([\d.,]+)',
        text, re.IGNORECASE
    )
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            return val, 0.90, "consumo_fora_ponta"

    # Pattern 3: "FORA PONTA (kWh)"
    m = re.search(r'FORA\s*PONTA\s*\(?\s*kWh\s*\)?\s*:?\s*([\d.,]+)', text, re.IGNORECASE)
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            return val, 0.85, "fponta_kwh"

    return None, 0.0, "not_found"


def extract_demanda(text: str) -> Tuple[Optional[float], Optional[float], float, str]:
    """
    Extract demand values (kW). Returns (demanda_contratada, demanda_medida, confidence, reason).
    Handles "Demanda F. Ponta kW + ICMS/PIS/COFINS  300  32,90566  9.871,70"
    """

    demanda_contratada = None
    demanda_medida = None
    conf = 0.0
    reason = "not_found"

    # Demanda F. Ponta kW (with ICMS) — this is measured demand in billing context
    m = re.search(
        r'Demanda\s+F\.?\s*Ponta\s+kW\s*\+?\s*(?:ICMS/?PIS/?COFINS)?\s*([\d.,]+)',
        text, re.IGNORECASE
    )
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            demanda_medida = val
            conf = 0.90
            reason = "demanda_fponta_kw"

    # Demanda Contratada
    m = re.search(r'Demanda\s+Contratada\s*:?\s*([\d.,]+)', text, re.IGNORECASE)
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            demanda_contratada = val
            conf = max(conf, 0.95)
            reason = "demanda_contratada"

    # Demanda Medida
    m = re.search(r'Demanda\s+Medida\s*:?\s*([\d.,]+)', text, re.IGNORECASE)
    if m:
        val = parse_br_number(m.group(1))
        if val and val > 0:
            demanda_medida = val
            conf = max(conf, 0.95)
            reason = "demanda_medida"

    # Generic "Demanda (kW): 300"
    if not demanda_contratada and not demanda_medida:
        m = re.search(r'Demanda\s*\(?\s*kW\s*\)?\s*:?\s*([\d.,]+)', text, re.IGNORECASE)
        if m:
            val = parse_br_number(m.group(1))
            if val and val > 0:
                demanda_contratada = val
                conf = 0.80
                reason = "demanda_generic"

    # "DEMANDA LIVRE - kW  300" (from table/chart sections)
    if not demanda_contratada and not demanda_medida:
        m = re.search(r'DEMANDA\s+LIVRE\s*[-–]?\s*kW\s*([\d.,]+)', text, re.IGNORECASE)
        if m:
            val = parse_br_number(m.group(1))
            if val and val > 0:
                demanda_contratada = val
                conf = 0.85
                reason = "demanda_livre"

    return demanda_contratada, demanda_medida, conf, reason


def extract_total_amount(text: str) -> Tuple[Optional[float], float, str]:
    """Extract total amount (R$). Handles R$**96.199,73 format."""

    patterns = [
        # "TOTAL A PAGAR R$**96.199,73" — asterisks before number
        (r'TOTAL\s*A\s*PAGAR\s*R?\$?\s*\*{0,5}\s*([\d.,]+)', 0.95, "total_a_pagar"),
        # "Valor a Pagar: R$ 96.199,73"
        (r'Valor\s*a\s*Pagar\s*:?\s*R?\$?\s*([\d.,]+)', 0.90, "valor_a_pagar"),
        # "VALOR FINAL: R$ 96.199,73"
        (r'Valor\s*Final\s*:?\s*R?\$?\s*([\d.,]+)', 0.85, "valor_final"),
        # "Total: R$ 96.199,73"
        (r'Total\s*:?\s*R\$\s*([\d.,]+)', 0.80, "total_rs"),
    ]

    for pattern, conf, reason in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = parse_br_number(m.group(1))
            if val and val > 10:  # Bills should be > R$10
                return val, conf, reason

    return None, 0.0, "not_found"


def extract_bandeira(text: str) -> Tuple[Optional[str], float, str]:
    """Extract tariff flag (bandeira tarifária)."""

    # Pattern 1: "Bandeira(s) Tarifária(s) aplicada(s) no mês AMARELA"
    m = re.search(
        r'Bandeira\(?s?\)?\s*Tarif[áa]ria\(?s?\)?\s*(?:aplicada\(?s?\)?\s*)?'
        r'(?:no\s+m[êe]s\s*)?:?\s*(VERDE|AMARELA|VERMELHA\s*(?:PATAMAR\s*[12])?|ESCASSEZ)',
        text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip().upper(), 0.95, "bandeira_label"

    # Pattern 2: "ADICIONAL BANDEIRA AMARELA"
    m = re.search(r'BANDEIRA\s+(VERDE|AMARELA|VERMELHA|ESCASSEZ)', text, re.IGNORECASE)
    if m:
        return m.group(1).strip().upper(), 0.90, "adicional_bandeira"

    # Pattern 3: Standalone flag name near "bandeira"
    m = re.search(
        r'(?:bandeira|flag)\s*:?\s*(verde|amarela|vermelha|escassez)',
        text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip().upper(), 0.85, "bandeira_generic"

    return None, 0.0, "not_found"


def extract_modalidade(text: str) -> Tuple[Optional[str], float, str]:
    """Extract tariff modality (Azul, Verde, Convencional)."""

    patterns = [
        (r'MODALIDADE\s*TARIF[ÁA]RIA\s*:?\s*(Azul|Verde|Convencional|Branca|Hor[áa]ria)', 0.95, "modalidade_label"),
        (r'MODALIDADE\s*:?\s*(Azul|Verde|Convencional|Branca|Hor[áa]ria)', 0.90, "modalidade_simple"),
        (r'\b(AZUL|VERDE|CONVENCIONAL|BRANCA)\b.*?tarif', 0.80, "modalidade_context"),
    ]

    for pattern, conf, reason in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), conf, reason

    return None, 0.0, "not_found"


def extract_endereco(text: str) -> Tuple[Optional[str], float, str]:
    """Extract address from bill."""

    # After customer name, look for address-like content before CEP
    m = re.search(
        r'(?:AV|RUA|ALAMEDA|RODOVIA|ESTRADA|TRAV|R\.)\s+[^\n]+',
        text, re.IGNORECASE
    )
    if m:
        addr = m.group(0).strip()
        # Try to append CEP line
        m2 = re.search(re.escape(addr) + r'\s*\n?\s*([^\n]*CEP[^\n]+)', text, re.IGNORECASE)
        if m2:
            addr = addr + ", " + m2.group(1).strip()
        if len(addr) > 10:
            return addr, 0.75, "address_pattern"

    return None, 0.0, "not_found"


def extract_invoice_key(text: str) -> Tuple[Optional[str], float, str]:
    """Extract NF-e / invoice key (chave de acesso — 44 digits)."""

    m = re.search(r'(\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4})', text)
    if m:
        key = re.sub(r'\s', '', m.group(1))
        if len(key) == 44:
            return key, 0.95, "nfe_44_digits"

    return None, 0.0, "not_found"


def extract_consumption_period(text: str) -> Tuple[Optional[str], float, str]:
    """Extract consumption period from reading dates."""

    m = re.search(
        r'Leitura\s+anterior\s*:?\s*(\d{2}/\d{2}/\d{4})',
        text, re.IGNORECASE
    )
    m2 = re.search(
        r'Leitura\s+atual\s*:?\s*(\d{2}/\d{2}/\d{4})',
        text, re.IGNORECASE
    )
    if m and m2:
        return f"{m.group(1)} - {m2.group(1)}", 0.95, "leitura_anterior_atual"

    # Generic two dates
    dates = re.findall(r'(\d{2}/\d{2}/\d{4})', text)
    if len(dates) >= 2:
        return f"{dates[0]} - {dates[1]}", 0.60, "first_two_dates"

    return None, 0.0, "not_found"


def detect_doc_kind(text: str, filename: str = "") -> str:
    """Detect the bill subtype."""

    text_upper = text.upper()
    fname_upper = filename.upper()

    if 'HISTÓRICO DE CONSUMO' in text_upper or 'HISTORICO DE CONSUMO' in text_upper:
        return 'CONSUMPTION_HISTORY'
    if 'HISTÓRICO' in fname_upper or 'HISTORICO' in fname_upper:
        return 'CONSUMPTION_HISTORY'
    if 'SIMULAÇÃO' in text_upper or 'SIMULACAO' in text_upper:
        return 'STANDARD_BILL'  # GD simulation bills are still standard bills
    if 'NF3E' in fname_upper or 'NOTA FISCAL' in text_upper:
        return 'NF3E'
    if 'DEMONSTRATIVO' in text_upper or 'DEMONSTRATIVO' in fname_upper:
        return 'DEMONSTRATIVO'

    return 'STANDARD_BILL'


# =============================================================================
# MAIN EXTRACTION FUNCTION
# =============================================================================

def extract_bill(pdf_path: str, doc_id: str = None) -> Dict[str, Any]:
    """
    Extract data from any Brazilian electricity bill.
    Returns a flat dict compatible with the Replit normalizer.
    """
    import time
    start_ms = time.time()

    try:
        logger.info(f"Bill parser v2 reading: {pdf_path}")

        # Step 1: Extract text
        full_text, debug = extract_text_from_pdf(pdf_path)

        if not full_text or len(full_text) < 50:
            return {
                "status": "failed",
                "confidence": 0.0,
                "warnings": ["PDF text extraction yielded insufficient text"],
                "debug": debug,
            }

        logger.info(f"Extracted {len(full_text)} chars from {debug['pages']} pages")

        # Step 2: Extract all fields
        customer_name, cn_conf, cn_reason = extract_customer_name(full_text)
        cnpj, cnpj_conf, cnpj_reason = extract_cnpj(full_text)
        uc_code, uc_conf, uc_reason = extract_uc_code(full_text)
        uc_empreendimento, uce_conf, uce_reason = extract_uc_empreendimento(full_text)
        ref_month, rm_conf, rm_reason = extract_reference_month(full_text)
        due_date, dd_conf, dd_reason = extract_due_date(full_text)
        grupo, subgrupo, gs_conf, gs_reason = extract_grupo_subgrupo(full_text)
        distributor, dist_conf, dist_reason = extract_distributor(full_text)
        consumption, cons_conf, cons_reason = extract_consumption(full_text)
        consumo_ponta, cp_conf, cp_reason = extract_consumo_ponta(full_text)
        consumo_fponta, cfp_conf, cfp_reason = extract_consumo_fora_ponta(full_text)
        demanda_contratada, demanda_medida, dem_conf, dem_reason = extract_demanda(full_text)
        total_amount, ta_conf, ta_reason = extract_total_amount(full_text)
        bandeira, band_conf, band_reason = extract_bandeira(full_text)
        modalidade, mod_conf, mod_reason = extract_modalidade(full_text)
        endereco, end_conf, end_reason = extract_endereco(full_text)
        invoice_key, ik_conf, ik_reason = extract_invoice_key(full_text)
        consumption_period, per_conf, per_reason = extract_consumption_period(full_text)
        doc_kind = detect_doc_kind(full_text, pdf_path)

        # Build tariffGroup from grupo+subgrupo
        tariff_group = subgrupo or (grupo if grupo else None)

        # Step 3: Calculate confidence
        field_confidence = {
            "customerName": cn_conf,
            "customerCnpj": cnpj_conf,
            "ucCode": uc_conf,
            "referenceMonth": rm_conf,
            "grupo": gs_conf,
            "distributor": dist_conf,
            "consumption": cons_conf,
            "consumoPonta": cp_conf,
            "consumoForaPonta": cfp_conf,
            "demanda": dem_conf,
            "totalAmount": ta_conf,
            "bandeira": band_conf,
        }

        field_reasons = {
            "customerName": cn_reason,
            "customerCnpj": cnpj_reason,
            "ucCode": uc_reason,
            "referenceMonth": rm_reason,
            "grupo": gs_reason,
            "distributor": dist_reason,
            "consumption": cons_reason,
            "consumoPonta": cp_reason,
            "consumoForaPonta": cfp_reason,
            "demanda": dem_reason,
            "totalAmount": ta_reason,
            "bandeira": band_reason,
        }

        critical_fields = [
            customer_name, cnpj, uc_code, tariff_group, consumption or consumo_ponta, total_amount
        ]
        found_critical = sum(1 for f in critical_fields if f)

        if found_critical >= 5:
            overall_confidence = 0.95
        elif found_critical >= 4:
            overall_confidence = 0.90
        elif found_critical >= 3:
            overall_confidence = 0.80
        elif found_critical >= 2:
            overall_confidence = 0.70
        elif found_critical >= 1:
            overall_confidence = 0.55
        else:
            overall_confidence = 0.30

        elapsed_ms = int((time.time() - start_ms) * 1000)

        # Step 4: Build response (flat dict — normalizer picks up all fields)
        warnings = []
        if cnpj == "REDACTED":
            warnings.append("CNPJ is redacted on this bill")
        if dist_reason == "gd_reseller_fallback":
            warnings.append(f"Distributor '{distributor}' may be a GD reseller, not the actual distributor")
        if not consumption and not consumo_ponta:
            warnings.append("Could not extract consumption value")
        if not total_amount:
            warnings.append("Could not extract total amount")

        result = {
            "status": "success" if found_critical >= 2 else "failed",
            "docType": "BILL",
            "confidence": overall_confidence,

            # Identity
            "customerName": customer_name,
            "customerCnpj": cnpj if cnpj != "REDACTED" else None,
            "customerId": cnpj if cnpj and cnpj != "REDACTED" else None,

            # Location
            "ucCode": uc_code,
            "ucNumber": uc_code,
            "installation": uc_empreendimento or uc_code,
            "endereco": endereco,

            # Classification
            "grupo": grupo,
            "subgrupo": subgrupo,
            "tariffGroup": tariff_group,
            "groupSubgroup": tariff_group,
            "modalidade": modalidade,
            "distributor": distributor,

            # Consumption
            "consumption": consumption,
            "totalEnergyKwh": consumption,
            "consumoPonta": consumo_ponta,
            "consumoPontaKwh": consumo_ponta,
            "consumoForaPonta": consumo_fponta,
            "consumoForaPontaKwh": consumo_fponta,

            # Demand
            "demandaContratada": demanda_contratada,
            "demandaContratadaKw": demanda_contratada,
            "demandaMedida": demanda_medida,
            "demandaMedidaKw": demanda_medida,

            # Financial
            "totalAmount": total_amount,

            # Tariff
            "bandeira": bandeira,
            "tariffFlag": bandeira,
            "bandeiraName": bandeira,

            # Dates
            "referenceMonth": ref_month,
            "dueDate": due_date,
            "consumptionPeriod": consumption_period,

            # Document
            "docKind": doc_kind,
            "invoiceKey": invoice_key,

            # Per-field confidence
            "fieldConfidence": field_confidence,
            "fieldReasons": field_reasons,

            # Warnings
            "warnings": warnings,

            # Debug
            "debug": {
                **debug,
                "timingsMs": {"total": elapsed_ms},
                "chosenText": full_text[:5000],
                "rawPdfText": full_text[:5000],
                "criticalFieldsFound": found_critical,
                "version": "2.0",
            },
        }

        logger.info(
            f"Bill parsed: {found_critical}/6 critical fields, "
            f"confidence={overall_confidence}, elapsed={elapsed_ms}ms, "
            f"fields=[name={'Y' if customer_name else 'N'} cnpj={'Y' if cnpj else 'N'} "
            f"uc={'Y' if uc_code else 'N'} grupo={'Y' if grupo else 'N'} "
            f"cons={'Y' if consumption else 'N'} ponta={'Y' if consumo_ponta else 'N'} "
            f"fponta={'Y' if consumo_fponta else 'N'} dem={'Y' if demanda_contratada or demanda_medida else 'N'} "
            f"total={'Y' if total_amount else 'N'} band={'Y' if bandeira else 'N'}]"
        )

        return result

    except Exception as e:
        logger.exception(f"Bill parser error: {e}")
        return {
            "status": "error",
            "docType": "BILL",
            "confidence": 0.0,
            "error": str(e),
            "warnings": [f"Parser exception: {str(e)}"],
            "debug": {"version": "2.0"},
        }
