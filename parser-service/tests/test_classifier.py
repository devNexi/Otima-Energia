import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from classifier import classify_document, DocType


def test_prc_classification():
    prc_text = """
    CIRCULAR DE PREÇO DE REFERÊNCIA COMPARÁVEL
    Axia Energia - Janeiro 2025
    
    Submercado    12 meses   36 meses   60 meses
    Sudeste/Centro-Oeste  280,50  295,00  310,00  R$/MWh
    Sul                   275,00  290,00  305,00  R$/MWh
    Nordeste              260,00  275,00  290,00  R$/MWh
    Norte                 250,00  265,00  280,00  R$/MWh
    
    Energia Convencional
    """
    doc_type, scores = classify_document(prc_text)
    assert doc_type == DocType.PRC, f"Expected PRC, got {doc_type}. Scores: {scores}"
    print("PASS: PRC classification")


def test_bill_classification():
    bill_text = """
    NOTA FISCAL DE ENERGIA ELÉTRICA
    Light S.A.
    
    Unidade Consumidora: 1234567
    Leitura anterior: 01/01/2025
    Leitura atual: 31/01/2025
    Consumo: 1500 kWh
    Vencimento: 15/02/2025
    Valor Total: R$ 1.337,95
    """
    doc_type, scores = classify_document(bill_text)
    assert doc_type == DocType.BILL, f"Expected BILL, got {doc_type}. Scores: {scores}"
    print("PASS: BILL classification")


def test_other_classification():
    other_text = """
    Contrato de Prestação de Serviços
    Entre as partes abaixo assinadas...
    """
    doc_type, scores = classify_document(other_text)
    assert doc_type == DocType.OTHER, f"Expected OTHER, got {doc_type}. Scores: {scores}"
    print("PASS: OTHER classification")


if __name__ == "__main__":
    test_prc_classification()
    test_bill_classification()
    test_other_classification()
    print("\nAll classifier tests passed!")
