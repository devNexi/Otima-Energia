# Portal Parser — VPS Deployment Guide

## Target: Ubuntu 24.04 · /opt/portal-parser · systemd service `portal-parser`

---

## 1. System Dependencies

```bash
sudo apt update && sudo apt install -y python3.12 python3.12-venv python3-pip poppler-utils tesseract-ocr tesseract-ocr-por
```

- `poppler-utils` provides `pdftoppm` (PDF → image for OCR)
- `tesseract-ocr` + `tesseract-ocr-por` provides OCR with Portuguese language pack

---

## 2. Deploy the Package

```bash
# Stop current service
sudo systemctl stop portal-parser

# Backup existing app (if any)
sudo mv /opt/portal-parser /opt/portal-parser.bak.$(date +%Y%m%d%H%M%S)

# Upload portal-parser.zip to VPS, then:
cd /tmp
unzip portal-parser.zip
sudo mv portal-parser /opt/portal-parser
sudo chown -R www-data:www-data /opt/portal-parser
```

---

## 3. Python Virtual Environment

```bash
cd /opt/portal-parser
sudo python3.12 -m venv venv
sudo venv/bin/pip install --upgrade pip
sudo venv/bin/pip install -r requirements.txt
```

---

## 4. Environment File

```bash
sudo tee /opt/portal-parser/.env << 'EOF'
PARSER_API_KEY=leo_lilly_sienna!
HOST=0.0.0.0
PORT=8000
EOF
sudo chmod 600 /opt/portal-parser/.env
```

---

## 5. Systemd Service

```bash
sudo tee /etc/systemd/system/portal-parser.service << 'EOF'
[Unit]
Description=Portal Parser (FastAPI)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/portal-parser
EnvironmentFile=/opt/portal-parser/.env
ExecStart=/opt/portal-parser/venv/bin/uvicorn main:app --host ${HOST} --port ${PORT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable portal-parser
sudo systemctl start portal-parser
```

---

## 6. Verify Service is Running

```bash
sudo systemctl status portal-parser
curl -s http://localhost:8000/health | python3 -m json.tool
```

Expected health response:
```json
{
    "status": "ok",
    "version": "1.0.0",
    "ocr_available": true
}
```

---

## 7. Run Unit Tests (Optional)

```bash
cd /opt/portal-parser
sudo venv/bin/python run_tests.py
```

Expected: 12 tests pass (classifier, PRC extractor, bill extractor).

---

## 8. Smoke Tests (PRC + Bill)

### PRC Smoke Test

Create a minimal PRC PDF text file and send it:

```bash
curl -s -X POST http://localhost:8000/parse \
  -H "X-Parser-Key: leo_lilly_sienna!" \
  -F "file=@/opt/portal-parser/tests/fixtures/smoke_prc.pdf;type=application/pdf" \
  -F "supplier=TestSupplier" \
  -F "referenceMonth=2025-01" \
  | python3 -m json.tool
```

If you don't have a real PRC PDF, use this inline smoke test instead:

```bash
curl -s -X POST http://localhost:8000/parse \
  -H "X-Parser-Key: leo_lilly_sienna!" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/dev/null;type=application/pdf" \
  -F "supplier=SmokeTest" \
  -F "referenceMonth=2025-03" \
  2>&1
```

This will return a classification result. For a full PRC extraction test with structured rows, use the smoke test script below.

### Bill Smoke Test

Same approach — use a real electricity bill PDF:

```bash
curl -s -X POST http://localhost:8000/parse \
  -H "X-Parser-Key: leo_lilly_sienna!" \
  -F "file=@/path/to/real-bill.pdf;type=application/pdf" \
  | python3 -m json.tool
```

Expected bill response includes: `distributor`, `referenceMonth`, `totalAmount`, `totalEnergyKwh`.

### Automated Smoke Test Script

Run the included smoke test:

```bash
cd /opt/portal-parser
sudo venv/bin/python smoke_test.py
```

---

## 9. Nginx Reverse Proxy (if serving on port 443)

If your Nginx already proxies to the old app, just ensure:

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 50M;
}
```

Then `sudo nginx -t && sudo systemctl reload nginx`.

---

## File Inventory

```
/opt/portal-parser/
├── main.py              # FastAPI app (entry point)
├── models.py            # Pydantic response models
├── classifier.py        # PRC / BILL / OTHER classifier
├── ocr.py               # PDF text extraction + Tesseract OCR fallback
├── requirements.txt     # Python dependencies
├── run_tests.py         # Test runner
├── smoke_test.py        # Deployment smoke test
├── extractors/
│   ├── __init__.py
│   ├── prc.py           # PRC tariff extraction
│   └── bill.py          # Electricity bill extraction
└── tests/
    ├── test_classifier.py
    ├── test_prc_extractor.py
    ├── test_bill_extractor.py
    └── fixtures/
        ├── golden_axia_prc.json
        ├── golden_boven_prc.json
        └── golden_light_bill.json
```
