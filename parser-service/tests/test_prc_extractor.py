import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extractors.prc import extract_prc, parse_brazilian_number, detect_submarket, detect_term


def test_brazilian_number_parsing():
    assert parse_brazilian_number("280,50") == 280.50
    assert parse_brazilian_number("1.337,95") == 1337.95
    assert parse_brazilian_number("R$ 295,00") == 295.00
    assert parse_brazilian_number("310.00") == 310.00
    assert parse_brazilian_number("1.000,00") == 1000.00
    print("PASS: Brazilian number parsing")


def test_submarket_detection():
    assert detect_submarket("Sudeste/Centro-Oeste") == "SE_CO"
    assert detect_submarket("SE/CO") == "SE_CO"
    assert detect_submarket("Sul") == "SUL"
    assert detect_submarket("Nordeste") == "NE"
    assert detect_submarket("Norte") == "N"
    assert detect_submarket("NE") == "NE"
    assert detect_submarket("N") == "N"
    assert detect_submarket("Random text") is None
    print("PASS: Submarket detection")


def test_term_detection():
    assert detect_term("12 meses") == 12
    assert detect_term("36 meses") == 36
    assert detect_term("60 meses") == 60
    assert detect_term("1 ano") == 12
    assert detect_term("3 anos") == 36
    assert detect_term("5 anos") == 60
    print("PASS: Term detection")


def test_axia_style_prc():
    text = """
    PREÇO DE REFERÊNCIA COMPARÁVEL - PRC
    Axia Energia
    Referência: Janeiro/2025
    
    Energia Convencional
    
    Submercado         12 meses    36 meses    60 meses
    Sudeste/Centro-Oeste  280,50     295,00     310,00
    Sul                   275,00     290,00     305,00
    Nordeste              260,00     275,00     290,00
    Norte                 250,00     265,00     280,00
    """
    
    data, rows, warnings, details = extract_prc(text, "test-axia-1")
    
    assert data.supplier == "Axia", f"Expected supplier Axia, got {data.supplier}"
    assert data.referenceMonth == "2025-01", f"Expected 2025-01, got {data.referenceMonth}"
    assert len(rows) >= 12, f"Expected >= 12 rows, got {len(rows)}"
    
    submarkets = set(r.submarket for r in rows)
    assert "SE_CO" in submarkets, f"Missing SE_CO in {submarkets}"
    assert "SUL" in submarkets, f"Missing SUL in {submarkets}"
    assert "NE" in submarkets, f"Missing NE in {submarkets}"
    assert "N" in submarkets, f"Missing N in {submarkets}"
    
    for row in rows:
        assert 50 <= row.price <= 1500, f"Price {row.price} out of range"
    
    golden_expected = {
        "supplier": "Axia",
        "referenceMonth": "2025-01",
        "minRows": 12,
        "submarkets": ["N", "NE", "SE_CO", "SUL"],
        "products": ["CONVENCIONAL"],
    }
    
    golden_path = os.path.join(os.path.dirname(__file__), "fixtures", "golden_axia_prc.json")
    if os.path.exists(golden_path):
        with open(golden_path) as f:
            saved = json.load(f)
        assert saved == golden_expected, f"Golden snapshot mismatch: {saved} != {golden_expected}"
    else:
        with open(golden_path, "w") as f:
            json.dump(golden_expected, f, indent=2)
    
    assert data.supplier == golden_expected["supplier"]
    assert data.referenceMonth == golden_expected["referenceMonth"]
    assert len(rows) >= golden_expected["minRows"]
    assert sorted(list(submarkets)) == golden_expected["submarkets"]
    assert sorted(list(set(r.product for r in rows))) == golden_expected["products"]
    
    print(f"PASS: Axia-style PRC ({len(rows)} rows, {len(submarkets)} submarkets)")


def test_boven_style_prc():
    text = """
    Boven Energia
    PRC - Preço de Referência Comparável
    Março 2025
    
    CONVENCIONAL
    Submercado    1 ano      3 anos     5 anos
    SE/CO         295,80     310,50     325,00
    Sul           288,00     303,00     318,00
    NE            272,00     287,00     302,00
    Norte         262,00     277,00     292,00
    
    INCENTIVADA 50%
    Submercado    1 ano      3 anos     5 anos
    SE/CO         315,80     330,50     345,00
    Sul           308,00     323,00     338,00
    NE            292,00     307,00     322,00
    Norte         282,00     297,00     312,00
    """
    
    data, rows, warnings, details = extract_prc(text, "test-boven-1")
    
    assert data.supplier == "Boven", f"Expected supplier Boven, got {data.supplier}"
    assert data.referenceMonth == "2025-03", f"Expected 2025-03, got {data.referenceMonth}"
    assert len(rows) >= 12, f"Expected >= 12 rows, got {len(rows)}"
    
    products = set(r.product for r in rows)
    assert "CONVENCIONAL" in products, f"Missing CONVENCIONAL in {products}"
    assert "INCENTIVADA_50" in products, f"Missing INCENTIVADA_50 in {products}"
    
    golden_expected = {
        "supplier": "Boven",
        "referenceMonth": "2025-03",
        "minRows": 12,
        "products": ["CONVENCIONAL", "INCENTIVADA_50"],
    }
    
    golden_path = os.path.join(os.path.dirname(__file__), "fixtures", "golden_boven_prc.json")
    if os.path.exists(golden_path):
        with open(golden_path) as f:
            saved = json.load(f)
        assert saved == golden_expected, f"Golden snapshot mismatch: {saved} != {golden_expected}"
    else:
        with open(golden_path, "w") as f:
            json.dump(golden_expected, f, indent=2)
    
    assert data.supplier == golden_expected["supplier"]
    assert data.referenceMonth == golden_expected["referenceMonth"]
    assert len(rows) >= golden_expected["minRows"]
    assert sorted(list(products)) == golden_expected["products"]
    
    print(f"PASS: Boven-style PRC ({len(rows)} rows, {len(products)} products)")


def test_single_product_prc():
    text = """
    Capacitech Energia
    Circular de Preço
    Fevereiro 2025
    
    Convencional - R$/MWh
    Submercado    12 meses
    Sudeste       285,00
    Sul           278,00
    Nordeste      265,00
    Norte         255,00
    """
    
    data, rows, warnings, details = extract_prc(text, "test-capacitech-1")
    
    assert data.supplier == "Capacitech", f"Expected Capacitech, got {data.supplier}"
    assert len(rows) >= 4, f"Expected >= 4 rows, got {len(rows)}"
    
    print(f"PASS: Single product PRC ({len(rows)} rows)")


def test_outlier_detection():
    text = """
    PRC Test Supplier
    Janeiro 2025
    
    Convencional R$/MWh
    Submercado    12 meses
    Sudeste       1450,00
    Sul           278,00
    """
    
    data, rows, warnings, details = extract_prc(text, "test-outlier")
    
    assert len(rows) >= 1, f"Expected at least 1 row, got {len(rows)}"
    valid_prices = [r for r in rows if 50 <= r.price <= 1500]
    assert len(valid_prices) == len(rows), f"All prices should be within range"
    
    print(f"PASS: Price range validation ({len(rows)} rows, all valid)")


if __name__ == "__main__":
    test_brazilian_number_parsing()
    test_submarket_detection()
    test_term_detection()
    test_axia_style_prc()
    test_boven_style_prc()
    test_single_product_prc()
    test_outlier_detection()
    print("\nAll PRC extractor tests passed!")
