import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extractors.bill import extract_bill, parse_br_number


def test_br_number_parsing():
    assert parse_br_number("1.337,95") == 1337.95
    assert parse_br_number("R$ 1.337,95") == 1337.95
    assert parse_br_number("280,50") == 280.50
    assert parse_br_number("1500") == 1500.0
    assert parse_br_number("10.000,00") == 10000.00
    print("PASS: Brazilian number parsing")


def test_light_nf3e_bill():
    text = """
    NOTA FISCAL DE ENERGIA ELÉTRICA - NF3E
    Light Serviços de Eletricidade S.A.
    
    Cliente: EMPRESA EXEMPLO LTDA
    Unidade Consumidora: 0123456789
    Grupo Tarifário: A4
    
    Mês de referência: Janeiro/2025
    Data de Vencimento: 15/02/2025
    
    Consumo Ativo: 15.500 kWh
    
    Valor Total a Pagar: R$ 12.337,95
    
    Chave de Acesso NF3e: 33250112345678000190550010000012341234567890
    """
    
    data, warnings, details = extract_bill(text)
    
    assert data.distributor == "Light", f"Expected Light, got {data.distributor}"
    assert data.referenceMonth == "2025-01", f"Expected 2025-01, got {data.referenceMonth}"
    assert data.dueDate == "2025-02-15", f"Expected 2025-02-15, got {data.dueDate}"
    assert data.totalAmount == 12337.95, f"Expected 12337.95, got {data.totalAmount}"
    assert data.customerName is not None, f"Expected customer name"
    assert data.customerId is not None or data.invoiceKey is not None, f"Expected customer ID or invoice key"
    assert data.tariffGroup == "A4", f"Expected A4, got {data.tariffGroup}"
    
    has_ref_month = data.referenceMonth is not None
    has_amount = data.totalAmount is not None or data.totalEnergyKwh is not None
    has_id = data.customerId is not None or data.invoiceKey is not None
    validated = has_ref_month and has_amount and has_id
    assert validated, f"Bill should be validated"
    
    golden_expected = {
        "distributor": "Light",
        "referenceMonth": "2025-01",
        "dueDate": "2025-02-15",
        "totalAmount": 12337.95,
        "tariffGroup": "A4",
        "validated": True,
    }
    
    golden_path = os.path.join(os.path.dirname(__file__), "fixtures", "golden_light_bill.json")
    if os.path.exists(golden_path):
        with open(golden_path) as f:
            saved = json.load(f)
        assert saved == golden_expected, f"Golden snapshot mismatch: {saved} != {golden_expected}"
    else:
        with open(golden_path, "w") as f:
            json.dump(golden_expected, f, indent=2)
    
    assert data.distributor == golden_expected["distributor"]
    assert data.referenceMonth == golden_expected["referenceMonth"]
    assert data.dueDate == golden_expected["dueDate"]
    assert data.totalAmount == golden_expected["totalAmount"]
    assert data.tariffGroup == golden_expected["tariffGroup"]
    assert validated == golden_expected["validated"]
    
    print(f"PASS: Light NF3e bill (validated={validated})")


def test_cemig_bill():
    text = """
    CEMIG Distribuição S.A.
    Fatura de Energia Elétrica
    
    Nome: COMERCIO ABC LTDA
    Código do Cliente: 987654321
    Subgrupo: B3
    
    Competência: 02/2025
    Vencimento: 20/03/2025
    
    Consumo Total: 2.500 kWh
    Valor a Pagar: R$ 3.250,00
    """
    
    data, warnings, details = extract_bill(text)
    
    assert data.distributor == "CEMIG", f"Expected CEMIG, got {data.distributor}"
    assert data.referenceMonth is not None, f"Expected reference month"
    assert data.totalAmount == 3250.00, f"Expected 3250.00, got {data.totalAmount}"
    
    print(f"PASS: CEMIG bill (distributor={data.distributor}, amount={data.totalAmount})")


def test_minimal_bill_validation():
    text_valid = """
    Nota Fiscal
    Unidade Consumidora: 12345
    Mês de referência: Janeiro/2025
    Valor Total: R$ 500,00
    """
    
    data, _, _ = extract_bill(text_valid)
    has_ref = data.referenceMonth is not None
    has_amount = data.totalAmount is not None or data.totalEnergyKwh is not None
    has_id = data.customerId is not None or data.invoiceKey is not None
    assert has_ref and has_amount and has_id, "Should be validated"
    print("PASS: Minimal valid bill")

    text_invalid = """
    Documento qualquer
    Sem informações de energia
    """
    
    data2, _, _ = extract_bill(text_invalid)
    has_ref2 = data2.referenceMonth is not None
    has_amount2 = data2.totalAmount is not None or data2.totalEnergyKwh is not None
    has_id2 = data2.customerId is not None or data2.invoiceKey is not None
    validated2 = has_ref2 and has_amount2 and has_id2
    assert not validated2, "Should NOT be validated"
    print("PASS: Invalid bill not validated")


if __name__ == "__main__":
    test_br_number_parsing()
    test_light_nf3e_bill()
    test_cemig_bill()
    test_minimal_bill_validation()
    print("\nAll bill extractor tests passed!")
