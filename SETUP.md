# Landing Page Production Setup — /reduza

This guide walks through every step required to put the Google Ads landing page fully into production, including Google Sheets, Google Drive, email, and tracking.

Authentication uses **OAuth2 with a refresh token** — no service account JSON keys required.

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

## 3. Create a Google Cloud OAuth2 App and Get a Refresh Token

Authentication is done via OAuth2 refresh token. The token grants the app access to Sheets and Drive on behalf of the Google account that authorizes it — no service account keys needed.

### 3a. Set up the Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or use an existing one).
3. Enable the **Google Sheets API**:  
   APIs & Services → Library → search "Google Sheets API" → Enable.
4. Enable the **Google Drive API**:  
   APIs & Services → Library → search "Google Drive API" → Enable.

### 3b. Create OAuth2 credentials

1. APIs & Services → Credentials → Create Credentials → **OAuth client ID**.
2. Application type: **Web application** (or Desktop app for testing).
3. Add an authorized redirect URI. For token generation you can use:  
   `https://developers.google.com/oauthplayground`
4. Click Create. Note the **Client ID** and **Client Secret**.
5. Go to **OAuth consent screen** → add the Google account you'll authorize as a test user (if the app is in "Testing" mode).

### 3c. Generate the refresh token using OAuth Playground

1. Go to [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground).
2. Click the gear icon (top right) → check **"Use your own OAuth credentials"**.
3. Enter your **Client ID** and **Client Secret**.
4. In Step 1, add these scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive`
5. Click **Authorize APIs** → sign in with the Google account that owns the Sheet and Drive folder.
6. In Step 2, click **Exchange authorization code for tokens**.
7. Copy the **Refresh token** from the response. Keep it safe — it does not expire unless revoked.

> **Note on Drive scope:** `drive.file` limits access to files created by the app. `drive` gives broader access and is more reliable when uploading to a pre-existing folder. Use `drive` unless you have a specific reason to restrict scope.

---

## 4. Add Replit Secrets

Go to your Replit project → Secrets (lock icon) and add:

| Secret Name | Value |
|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | The spreadsheet ID from step 1 |
| `GOOGLE_DRIVE_FOLDER_ID` | The folder ID from step 2 |
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID from step 3b |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret from step 3b |
| `GOOGLE_REFRESH_TOKEN` | Refresh token from step 3c |
| `SMTP_PASS` | Zoho SMTP password for `notificacoes@otimaenergia.com` (already set) |
| `VITE_GTM_ID` | Google Tag Manager container ID, e.g. `GTM-XXXXXX` (optional) |
| `VITE_GA_MEASUREMENT_ID` | GA4 Measurement ID, e.g. `G-XXXXXXXXXX` (optional, used if no GTM) |

> **Note on GTM/GA:** Both `VITE_GTM_ID` and `NEXT_PUBLIC_GTM_ID` are supported (same for GA). Use whichever name you prefer — both are checked.

---

## 5. Verify the Setup

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
    "GOOGLE_DRIVE_FOLDER_ID": true,
    "GOOGLE_CLIENT_ID": true,
    "GOOGLE_CLIENT_SECRET": true,
    "GOOGLE_REFRESH_TOKEN": true,
    "SMTP_PASS": true,
    "NEXT_PUBLIC_GTM_ID": false,
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": false
  },
  "ready": true
}
```

`"ready": true` means all 6 required integrations are configured. GTM/GA are shown but do not block readiness.

---

## 6. Test a Form Submission

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

## 7. GTM / GA4 Event Reference

The following events are pushed to `dataLayer` (and forwarded to GTM/GA4 if configured):

| Event | Fired when |
|---|---|
| `lead_form_start` | User first focuses any form field |
| `bill_upload_added` | User selects a bill file |
| `lead_form_submit` | Backend confirms lead successfully received |
| `thank_you_page_view` | `/obrigado` page loads |

---

## 8. File Upload Limits

- **Accepted formats:** PDF, JPG, JPEG, PNG
- **Maximum size:** 10 MB
- Files are uploaded to Google Drive and the link is stored in the Sheet and included in the internal notification email.
- If Drive upload fails, the form submission is **rejected** — the file is never silently discarded.

---

## 9. Failure Behaviour

| Step | Failure behaviour |
|---|---|
| Drive upload fails | Form returns an error to the user — file not lost silently |
| Sheets append fails | Form returns an error; email to Callum is still attempted as a fallback |
| Email fails (after Sheets succeeds) | Logged as an error; user still gets success (lead is safely in Sheets) |

---

## 10. Rate Limiting

The `/api/landing/submit` endpoint is limited to **5 submissions per IP address per hour** to prevent spam. Legitimate test submissions count toward this limit — restart the server to reset the in-memory counter during testing.
