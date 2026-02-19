"""
Smoke test for deployed portal-parser service.
Run: python smoke_test.py [base_url] [api_key]

Defaults: http://localhost:8000, reads PARSER_API_KEY from env
"""

import sys
import os
import json
import io
import urllib.request
import urllib.error

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
API_KEY = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("PARSER_API_KEY", "")

PASSED = 0
FAILED = 0


def report(name, ok, detail=""):
    global PASSED, FAILED
    if ok:
        PASSED += 1
        print(f"  PASS: {name}")
    else:
        FAILED += 1
        print(f"  FAIL: {name} — {detail}")


def test_health():
    print("\n[1] Health Check")
    try:
        req = urllib.request.Request(f"{BASE_URL}/health")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
        report("status=ok", data.get("status") == "ok", f"got {data.get('status')}")
        report("version present", bool(data.get("version")), "missing version")
        report("ocr_available", data.get("ocr_available") is not None, "missing ocr field")
    except Exception as e:
        report("health reachable", False, str(e))


def test_auth_required():
    print("\n[2] Auth Enforcement")
    try:
        boundary = "----SmokeTestBoundary"
        body = f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.pdf\"\r\nContent-Type: application/pdf\r\n\r\ndummy\r\n--{boundary}--\r\n"
        req = urllib.request.Request(
            f"{BASE_URL}/parse",
            data=body.encode(),
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=5)
        report("rejects missing key", False, "expected 401 but got 200")
    except urllib.error.HTTPError as e:
        report("rejects missing key", e.code == 401, f"got HTTP {e.code}")
    except Exception as e:
        report("rejects missing key", False, str(e))


def build_multipart(fields, files):
    boundary = "----SmokeTestBoundary9876"
    parts = []
    for name, value in fields.items():
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n")
    for name, (filename, content, content_type) in files.items():
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\n"
            f"Content-Type: {content_type}\r\n\r\n"
        )
        parts.append(content)
        parts.append("\r\n")
    parts.append(f"--{boundary}--\r\n")
    body = b""
    for p in parts:
        body += p.encode() if isinstance(p, str) else p
    return body, f"multipart/form-data; boundary={boundary}"


PRC_TEXT = """CIRCULAR DE PREÇOS DE REFERÊNCIA
Axia Energia - Janeiro 2025

Submarket: SE/CO
Convencional 12 meses: 285,50
Convencional 24 meses: 292,00
Convencional 36 meses: 305,75

Submarket: SUL
Convencional 12 meses: 278,00
Convencional 24 meses: 285,50
Convencional 36 meses: 298,25

Submarket: NE
Convencional 12 meses: 270,00
Convencional 24 meses: 277,50
Convencional 36 meses: 290,00

Submarket: N
Convencional 12 meses: 310,00
Convencional 24 meses: 318,50
Convencional 36 meses: 330,00
"""


def test_prc_parse():
    print("\n[3] PRC Extraction")
    if not API_KEY:
        report("PRC parse", False, "no API key provided")
        return

    pdf_bytes = PRC_TEXT.encode("utf-8")
    body, content_type = build_multipart(
        {"supplier": "Axia", "referenceMonth": "2025-01"},
        {"file": ("smoke_prc.pdf", pdf_bytes, "application/pdf")},
    )
    req = urllib.request.Request(
        f"{BASE_URL}/parse",
        data=body,
        headers={"Content-Type": content_type, "X-Parser-Key": API_KEY},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())

        doc_type = data.get("documentType")
        report("classified as PRC", doc_type == "PRC", f"got {doc_type}")

        rows = data.get("prcRows", [])
        report(f"has rows (got {len(rows)})", len(rows) >= 4, "expected >=4 rows")

        if rows:
            first = rows[0]
            report("row has submarket", bool(first.get("submarket")), "missing submarket")
            report("row has term", first.get("termMonths") is not None, "missing termMonths")
            report("row has price", first.get("price") is not None, "missing price")

            prices = [r["price"] for r in rows if r.get("price")]
            in_range = all(50 <= p <= 1500 for p in prices)
            report("prices in 50-1500 range", in_range, f"got {prices}")
    except urllib.error.HTTPError as e:
        report("PRC parse request", False, f"HTTP {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        report("PRC parse request", False, str(e))


BILL_TEXT = """NOTA FISCAL DE ENERGIA ELÉTRICA
Light S.A.
CNPJ: 60.444.437/0001-46

Referência: Janeiro/2025
Vencimento: 15/02/2025

Cliente: Empresa Teste Ltda
UC: 1234567890
Grupo Tarifário: A4

Consumo Ponta: 2.500 kWh
Consumo Fora Ponta: 15.800 kWh
Total Energia: 18.300 kWh

Valor Total: R$ 12.337,95
"""


def test_bill_parse():
    print("\n[4] Bill Extraction")
    if not API_KEY:
        report("Bill parse", False, "no API key provided")
        return

    pdf_bytes = BILL_TEXT.encode("utf-8")
    body, content_type = build_multipart(
        {},
        {"file": ("smoke_bill.pdf", pdf_bytes, "application/pdf")},
    )
    req = urllib.request.Request(
        f"{BASE_URL}/parse",
        data=body,
        headers={"Content-Type": content_type, "X-Parser-Key": API_KEY},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())

        doc_type = data.get("documentType")
        report("classified as BILL", doc_type == "BILL", f"got {doc_type}")

        bill = data.get("billData", {})
        report("has referenceMonth", bool(bill.get("referenceMonth")), f"got {bill.get('referenceMonth')}")
        report("has totalAmount", bill.get("totalAmount") is not None, f"got {bill.get('totalAmount')}")
        report("has totalEnergyKwh", bill.get("totalEnergyKwh") is not None, f"got {bill.get('totalEnergyKwh')}")
        report("has distributor", bool(bill.get("distributor")), f"got {bill.get('distributor')}")

        if bill.get("totalAmount"):
            report("totalAmount > 0", bill["totalAmount"] > 0, f"got {bill['totalAmount']}")
        if bill.get("totalEnergyKwh"):
            report("totalEnergyKwh > 0", bill["totalEnergyKwh"] > 0, f"got {bill['totalEnergyKwh']}")
    except urllib.error.HTTPError as e:
        report("Bill parse request", False, f"HTTP {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        report("Bill parse request", False, str(e))


if __name__ == "__main__":
    print(f"Smoke testing {BASE_URL}")
    test_health()
    test_auth_required()
    test_prc_parse()
    test_bill_parse()

    print(f"\n{'='*40}")
    print(f"Results: {PASSED} passed, {FAILED} failed")
    if FAILED:
        print("SMOKE TEST FAILED")
        sys.exit(1)
    else:
        print("ALL SMOKE TESTS PASSED")
        sys.exit(0)
