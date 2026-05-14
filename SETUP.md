# Landing Page Production Setup — /reduza

This guide walks through every step required to put the Google Ads landing page fully into production, including Google Sheets, Google Drive, email, and tracking.

---

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name the first sheet tab exactly **Sheet1**.
3. Add the following headers in row 1 (one per column, A through AE):

```
Submitted At | Lead ID | Name | Company | Email | Phone | City | State |
Average Energy Bill | Property Type | Bill Uploaded? | Bill File URL | Message |
UTM Source | UTM Medium | UTM Campaign | UTM Term | UTM Content |
GCLID | GBRAID | WBRAID | Landing Page URL | Referrer | User Agent | IP Address |
Lead Status | Assigned To | Sales Notes | Qualified? | Monthly Bill Confirmed | Next Action Date
```

4. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

---

## 2. Create the Google Drive Folder

1. Go to [drive.google.com](https://drive.google.com) and create a folder named e.g. **Contas de Energia - Leads**.
2. Open the folder and copy the **Folder ID** from the URL:  
   `https://drive.google.com/drive/folders/**FOLDER_ID**`

---

## 3. Create a Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or use an existing one).
3. Enable the **Google Sheets API**:  
   APIs & Services → Library → search "Google Sheets API" → Enable.
4. Enable the **Google Drive API**:  
   APIs & Services → Library → search "Google Drive API" → Enable.
5. Create a service account:  
   APIs & Services → Credentials → Create Credentials → Service Account.  
   Give it any name (e.g. `otima-landing-sheet`). No roles needed.
6. Open the service account → Keys tab → Add Key → JSON.  
   Download the JSON key file.
7. From the JSON file, you need:
   - `client_email` — looks like `otima-landing-sheet@your-project.iam.gserviceaccount.com`
   - `private_key` — long string starting with `-----BEGIN RSA PRIVATE KEY-----`

---

## 4. Share the Sheet and Drive Folder with the Service Account

1. Open your Google Sheet → Share → paste the `client_email` → give **Editor** access.
2. Open your Google Drive folder → Share → paste the `client_email` → give **Editor** access.

---

## 5. Add Replit Secrets

Go to your Replit project → Secrets (lock icon) and add:

| Secret Name | Value |
|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | The spreadsheet ID from step 1 |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | The `client_email` from the JSON key |
| `GOOGLE_SHEETS_PRIVATE_KEY` | The full `private_key` string (including `\n` characters) |
| `GOOGLE_DRIVE_FOLDER_ID` | The folder ID from step 2 |
| `SMTP_PASS` | Zoho SMTP password for `notificacoes@otimaenergia.com` (already set) |
| `VITE_GTM_ID` | Your Google Tag Manager container ID, e.g. `GTM-XXXXXX` (optional) |
| `VITE_GA_MEASUREMENT_ID` | Your GA4 Measurement ID, e.g. `G-XXXXXXXXXX` (optional, used if no GTM) |

> **Note on GTM/GA:** Both `VITE_GTM_ID` and `NEXT_PUBLIC_GTM_ID` are supported (same for GA). Use whichever name you prefer — both are checked.

---

## 6. Verify the Setup

### Check configuration status

Visit or `curl` the following endpoint:

```
GET /api/setup-check
```

Example response when fully configured:
```json
{
  "integrations": {
    "GOOGLE_SHEETS_SPREADSHEET_ID": true,
    "GOOGLE_SHEETS_CLIENT_EMAIL": true,
    "GOOGLE_SHEETS_PRIVATE_KEY": true,
    "GOOGLE_DRIVE_FOLDER_ID": true,
    "SMTP_PASS": true,
    "NEXT_PUBLIC_GTM_ID": false,
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": false
  },
  "ready": true
}
```

`"ready": true` means the three critical integrations (SMTP, Sheets credentials) are all set.

---

## 7. Test a Form Submission

1. Go to `/reduza` in your browser.
2. Fill in all required fields with test data.
3. Optionally attach a small PDF or JPG.
4. Submit the form — you should be redirected to `/obrigado`.

### Confirm the row appears in Sheets

Open your Google Sheet and verify a new row has been appended with all fields populated.

### Confirm the bill appears in Drive

Open your Google Drive folder and verify the uploaded file is present with the naming format `conta-{company}-{timestamp}.{ext}`.

### Confirm the emails are sent

1. Check `callum@otimaenergia.com` inbox for the internal notification with subject:  
   `Novo lead Google Ads - {company} - {bill amount}`
2. Check the lead's email inbox for the confirmation with subject:  
   `Recebemos sua solicitação de auditoria gratuita | Ótima Energia`

---

## 8. GTM / GA4 Event Reference

The following events are pushed to `dataLayer` (and forwarded to GTM/GA4 if configured):

| Event | Fired when |
|---|---|
| `lead_form_start` | User first focuses any form field |
| `bill_upload_added` | User selects a bill file |
| `lead_form_submit` | Backend confirms lead successfully received |
| `thank_you_page_view` | `/obrigado` page loads |

---

## 9. File Upload Limits

- **Accepted formats:** PDF, JPG, JPEG, PNG
- **Maximum size:** 10 MB
- Files are uploaded to Google Drive and the link is stored in the Sheet and included in the internal notification email.

---

## 10. Rate Limiting

The `/api/landing/submit` endpoint is limited to **5 submissions per IP address per hour** to prevent spam. Legitimate test submissions count toward this limit — restart the server to reset the in-memory counter during testing.
