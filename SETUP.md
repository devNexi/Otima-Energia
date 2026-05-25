# Ótima Energia — Production Setup Guide

All secrets use the `OTIMA_*` prefix to prevent collisions with other projects.  
Go to Replit → Secrets (lock icon) to add each one.

---

## Quick Reference

| Purpose | Secrets |
|---|---|
| Lead capture (Sheets + Drive + Email) | `OTIMA_LEADS_*` + `OTIMA_SMTP_*` |
| Google Ads keyword research | `OTIMA_ADS_*` |
| Tracking | `OTIMA_GTM_ID`, `OTIMA_GA_MEASUREMENT_ID` |

---

## Part 1 — Lead Capture (Landing Page)

These secrets power the `/reduza` lead form: saving rows to Google Sheets, uploading bills to Google Drive, and sending email notifications.

### 1a. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name the first sheet tab exactly **Sheet1**.
3. Add these headers in row 1 (columns A through AE):

```
Submitted At | Lead ID | Name | Company | Email | Phone | City | State |
Average Energy Bill | Property Type | Bill Uploaded? | Bill File URL | Message |
UTM Source | UTM Medium | UTM Campaign | UTM Term | UTM Content |
GCLID | GBRAID | WBRAID | Landing Page URL | Referrer | User Agent | IP Address |
Lead Status | Assigned To | Sales Notes | Qualified? | Monthly Bill Confirmed | Next Action Date
```

4. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

### 1b. Create the Google Drive Folder

1. Go to [drive.google.com](https://drive.google.com) and create a folder named e.g. **Contas de Energia - Leads**.
2. Copy the **Folder ID** from the URL:  
   `https://drive.google.com/drive/folders/**FOLDER_ID**`

### 1c. Create OAuth2 Credentials for Lead Capture

> These credentials are **only** for Sheets + Drive (lead capture). Do **not** reuse them for Google Ads.
> Scopes: `spreadsheets`, `drive.file`

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create or select a project. Enable **Google Sheets API** and **Google Drive API**.
3. APIs & Services → Credentials → Create Credentials → **OAuth client ID** (Web application).
4. Add `http://localhost` as an authorized redirect URI.
5. Note the **Client ID** and **Client Secret**.
6. OAuth consent screen → add the Google account as a test user.

### 1d. Generate the Lead Capture Refresh Token

Set `OTIMA_LEADS_GOOGLE_CLIENT_ID` and `OTIMA_LEADS_GOOGLE_CLIENT_SECRET` in Replit Secrets, then run:

```bash
node scripts/get-otima-leads-refresh-token.js
```

Follow the prompts. Copy the output into `OTIMA_LEADS_GOOGLE_REFRESH_TOKEN`.

### 1e. Add Lead Capture Secrets to Replit

| Secret Name | Value |
|---|---|
| `OTIMA_LEADS_GOOGLE_CLIENT_ID` | OAuth2 Client ID from step 1c |
| `OTIMA_LEADS_GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret from step 1c |
| `OTIMA_LEADS_GOOGLE_REFRESH_TOKEN` | Refresh token from step 1d |
| `OTIMA_LEADS_SHEETS_SPREADSHEET_ID` | Spreadsheet ID from step 1a |
| `OTIMA_LEADS_DRIVE_FOLDER_ID` | Drive folder ID from step 1b |
| `OTIMA_SMTP_PASS` | Zoho SMTP password for `notificacoes@otimaenergia.com` |
| `OTIMA_EMAIL_FROM` | *(optional)* defaults to `notificacoes@otimaenergia.com` |
| `OTIMA_INTERNAL_LEAD_EMAIL` | *(optional)* defaults to `callum@otimaenergia.com` |

---

## Part 2 — Google Ads Keyword Research

These secrets power the `/admin/keyword-research` tool. They are **completely independent** from the lead capture secrets above — different OAuth client, different scope.

> Scope for this token: `https://www.googleapis.com/auth/adwords`

### 2a. Find your Google Ads Customer ID

1. Log in to [ads.google.com](https://ads.google.com).
2. The **Customer ID** is shown top-right as `XXX-XXX-XXXX`.
3. If you use a **Manager Account (MCC)**, note:
   - **Client Account ID** → `OTIMA_ADS_CUSTOMER_ID`
   - **Manager Account ID** → `OTIMA_ADS_LOGIN_CUSTOMER_ID` (optional, only if needed)

### 2b. Apply for a Google Ads Developer Token

1. In Google Ads: **Tools → API Center**.
2. Apply for **Basic Access**. Allows up to 15,000 operations/day — sufficient for keyword research.
3. Once approved, copy the **Developer Token**.

### 2c. Create OAuth2 Credentials for Google Ads

> Create a **separate** OAuth2 client from the one used for lead capture.

1. In Google Cloud Console → APIs & Services → Enable **Google Ads API**.
2. Credentials → Create Credentials → **OAuth client ID** (Web application).
3. Add `http://localhost` as redirect URI.
4. Note the **Client ID** and **Client Secret**.

### 2d. Generate the Google Ads Refresh Token

Set `OTIMA_ADS_CLIENT_ID` and `OTIMA_ADS_CLIENT_SECRET` in Replit Secrets, then run:

```bash
node scripts/get-otima-ads-refresh-token.js
```

Follow the prompts. Sign in with the Google account linked to your Ads account.  
Copy the output into `OTIMA_ADS_REFRESH_TOKEN`.

### 2e. Add Google Ads Secrets to Replit

| Secret Name | Value | Required |
|---|---|---|
| `OTIMA_ADS_DEVELOPER_TOKEN` | Developer token from step 2b | Yes |
| `OTIMA_ADS_CUSTOMER_ID` | Client account ID, digits only, e.g. `1234567890` | Yes |
| `OTIMA_ADS_CLIENT_ID` | OAuth Client ID from step 2c | Yes |
| `OTIMA_ADS_CLIENT_SECRET` | OAuth Client Secret from step 2c | Yes |
| `OTIMA_ADS_REFRESH_TOKEN` | Refresh token from step 2d | Yes |
| `OTIMA_ADS_LOGIN_CUSTOMER_ID` | MCC/Manager Account ID, digits only | Optional |
| `OTIMA_ADS_API_VERSION` | API version, e.g. `v24` (defaults to `v24` if not set) | Optional |

> **Important:** Do **not** fall back to lead-capture credentials for Ads. These must be separate.

---

## Part 3 — Tracking (Optional)

| Secret Name | Value |
|---|---|
| `OTIMA_GTM_ID` | Google Tag Manager container ID, e.g. `GTM-XXXXXX` |
| `OTIMA_GA_MEASUREMENT_ID` | GA4 Measurement ID, e.g. `G-XXXXXXXXXX` (used if no GTM) |

---

## Part 4 — Verify the Setup

### Check `/api/setup-check`

```
GET /api/setup-check
```

Example fully-configured response:
```json
{
  "landing_page": {
    "ready": true,
    "required": {
      "OTIMA_LEADS_GOOGLE_CLIENT_ID": true,
      "OTIMA_LEADS_GOOGLE_CLIENT_SECRET": true,
      "OTIMA_LEADS_GOOGLE_REFRESH_TOKEN": true,
      "OTIMA_LEADS_SHEETS_SPREADSHEET_ID": true,
      "OTIMA_LEADS_DRIVE_FOLDER_ID": true,
      "OTIMA_SMTP_PASS": true
    }
  },
  "tracking": {
    "gtm": false,
    "ga4": false
  },
  "google_ads_keyword_research": {
    "ready": true,
    "required": {
      "OTIMA_ADS_DEVELOPER_TOKEN": true,
      "OTIMA_ADS_CUSTOMER_ID": true,
      "OTIMA_ADS_CLIENT_ID": true,
      "OTIMA_ADS_CLIENT_SECRET": true,
      "OTIMA_ADS_REFRESH_TOKEN": true,
      "OTIMA_ADS_API_VERSION": false
    },
    "optional": {
      "OTIMA_ADS_LOGIN_CUSTOMER_ID": false
    }
  }
}
```

### Test the Lead Form

1. Go to `/reduza` and submit a test lead (with and without a bill file).
2. Confirm a row appears in your Google Sheet.
3. Confirm the uploaded file appears in your Google Drive folder.
4. Confirm the internal notification arrives at `callum@otimaenergia.com` (or `OTIMA_INTERNAL_LEAD_EMAIL`).
5. Confirm the confirmation email arrives at the lead's email address.

### Check Google Ads Diagnostics

```
GET /api/admin/google-ads-diagnostics
```

Returns:
- Which `OTIMA_ADS_*` secrets are present
- Whether `OTIMA_ADS_CUSTOMER_ID` is digits-only
- The exact endpoint URL being used
- Whether access token generation succeeded

### Test a Live Keyword Call

```
GET /api/admin/google-ads-diagnostics?test=1
```

Runs one live call with seed keyword `mercado livre de energia`. Returns result count or error details.

### Run the First Keyword Batch

1. Log in as admin → `/admin/keyword-research`.
2. Enter a **Batch Name** (e.g. `Maio 2026 — Mercado Livre`).
3. Enter seed keywords, one per line.
4. Click **Run Research**.
5. Download the CSV — it includes `batch_name` in every row.

---

## Part 5 — Common Errors

| Error | Cause | Fix |
|---|---|---|
| `OTIMA_LEADS_SHEETS_SPREADSHEET_ID not configured` | Secret missing | Add to Replit Secrets |
| `OTIMA_ADS_DEVELOPER_TOKEN not configured` | Secret missing | Add to Replit Secrets |
| `Google Ads API error (HTTP 403)` | Developer token not approved or wrong account | Verify token in Google Ads → Tools → API Center |
| `Google Ads API error (HTTP 401)` | Invalid or expired refresh token | Re-run `scripts/get-otima-ads-refresh-token.js` |
| `OTIMA_ADS_CUSTOMER_ID must be digits only` | Dashes included | Remove dashes — use `1234567890` not `123-456-7890` |
| API version sunset (HTML 404 from Google) | `OTIMA_ADS_API_VERSION` is old | Set `OTIMA_ADS_API_VERSION` to current version (e.g. `v24`) |

---

## Part 6 — Cleaning Up Old Secrets

Once you have confirmed the new `OTIMA_*` secrets are working, you can safely remove the old generic secrets from Replit:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_API_VERSION`
- `SMTP_PASS`
- `VITE_GTM_ID`
- `NEXT_PUBLIC_GTM_ID`
- `VITE_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

The app no longer reads any of these names — they are safe to delete.
