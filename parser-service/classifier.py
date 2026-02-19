import re
from models import DocType


PRC_KEYWORDS = [
    r"pre[çc]o.*refer[êe]ncia",
    r"\bPRC\b",
    r"submercado",
    r"R\$/MWh",
    r"pre[çc]o.*compar[aá]vel",
    r"circular.*pre[çc]o",
    r"tabela.*pre[çc]o",
    r"energia.*incentivada",
    r"convencional.*especial",
    r"sudeste.*centro.?oeste",
]

BILL_KEYWORDS = [
    r"nota\s*fiscal",
    r"\bNF3?E?\b",
    r"unidade\s*consumidora",
    r"\bkWh\b",
    r"leitura",
    r"vencimento",
    r"fatura\s*de\s*energia",
    r"conta\s*de\s*luz",
    r"consumo\s*ativo",
    r"tarifa.*social",
    r"bandeira.*tarif",
    r"ICMS.*energia",
]


def classify_document(text: str) -> tuple[DocType, dict]:
    text_lower = text.lower()

    prc_score = 0
    prc_matches = []
    for kw in PRC_KEYWORDS:
        matches = re.findall(kw, text_lower, re.IGNORECASE)
        if matches:
            prc_score += len(matches)
            prc_matches.append(kw)

    bill_score = 0
    bill_matches = []
    for kw in BILL_KEYWORDS:
        matches = re.findall(kw, text_lower, re.IGNORECASE)
        if matches:
            bill_score += len(matches)
            bill_matches.append(kw)

    scores = {
        "prc_score": prc_score,
        "bill_score": bill_score,
        "prc_matches": prc_matches,
        "bill_matches": bill_matches,
    }

    if prc_score > bill_score and prc_score >= 2:
        return DocType.PRC, scores
    elif bill_score > prc_score and bill_score >= 2:
        return DocType.BILL, scores
    elif prc_score >= 1 and bill_score == 0:
        return DocType.PRC, scores
    elif bill_score >= 1 and prc_score == 0:
        return DocType.BILL, scores
    else:
        return DocType.OTHER, scores
