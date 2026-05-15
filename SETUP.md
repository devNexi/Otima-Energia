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

---

## 11. Google Ads API — Keyword Research Module

The internal keyword research tool at `/admin/keyword-research` uses the **Google Ads API** (KeywordPlanIdeaService) to fetch keyword ideas, search volumes, competition, and CPC estimates for Brazil/Portuguese campaigns.

> **Read-only only.** The module performs keyword research exclusively. It does not create campaigns, budgets, ads, or keywords in Google Ads — no spend-related actions are possible.

### 11a. Find your Google Ads Customer ID

1. Log in to [ads.google.com](https://ads.google.com).
2. The **Customer ID** is the 10-digit number displayed in the top-right corner, formatted as `XXX-XXX-XXXX`.
3. If you use a **Manager Account (MCC)**, note both:
   - The **Client Account ID** — the account where keyword data is pulled from (becomes `GOOGLE_ADS_CUSTOMER_ID`)
   - The **Manager Account ID** — becomes `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (optional but required if the client account is under an MCC)

### 11b. Apply for a Google Ads Developer Token

1. Go to [Google Ads API Center](https://developers.google.com/google-ads/api/docs/get-started/dev-token).
2. Sign in with the Google account that manages your Google Ads MCC (or standard account).
3. In Google Ads, navigate to: **Tools → API Center**.
4. Apply for a **Basic Access** developer token. Basic access allows up to 15,000 operations/day and is sufficient for keyword research.
5. Once approved (can take a few days), copy the **Developer Token** string.

> **Test token:** While waiting for approval, Google issues a test token that works only with test accounts. You can generate keyword ideas from a test account to verify the integration.

### 11c. Create OAuth2 Credentials with the Ads scope

If you want to use **dedicated** Google Ads credentials (recommended for production), create a separate OAuth2 client with the `adwords` scope. If your existing `GOOGLE_REFRESH_TOKEN` already includes `https://www.googleapis.com/auth/adwords`, you can skip this step and the system will fall back to `GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN` automatically.

**To create dedicated Ads credentials:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → your project.
2. Enable the **Google Ads API**:  
   APIs & Services → Library → search "Google Ads API" → Enable.
3. APIs & Services → Credentials → Create Credentials → **OAuth client ID**.
4. Application type: **Web application** (add `https://developers.google.com/oauthplayground` as redirect URI).
5. Note the new **Client ID** and **Client Secret**.

### 11d. Generate a Refresh Token with the Ads scope

Using [OAuth Playground](https://developers.google.com/oauthplayground):

1. Click the gear icon → check **"Use your own OAuth credentials"**.
2. Enter the Client ID and Client Secret from step 11c.
3. In Step 1, add the scope:
   ```
   https://www.googleapis.com/auth/adwords
   ```
4. Click **Authorize APIs** → sign in with the Google account linked to your Ads account.
5. In Step 2, click **Exchange authorization code for tokens**.
6. Copy the **Refresh token**.

Alternatively, run the existing helper script which already handles the adwords scope:
```bash
node scripts/get-google-refresh-token.js
```
When prompted, add `https://www.googleapis.com/auth/adwords` to the scope list before authorizing.

### 11e. Add Replit Secrets for Google Ads

Go to your Replit project → Secrets (lock icon) and add:

| Secret Name | Value | Required |
|---|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Developer token from step 11b | Yes |
| `GOOGLE_ADS_CUSTOMER_ID` | Client account ID (digits only, e.g. `1234567890`) | Yes |
| `GOOGLE_ADS_CLIENT_ID` | OAuth Client ID for Ads (from 11c) — or omit if using `GOOGLE_CLIENT_ID` | If dedicated |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth Client Secret for Ads — or omit if using `GOOGLE_CLIENT_SECRET` | If dedicated |
| `GOOGLE_ADS_REFRESH_TOKEN` | Refresh token with adwords scope — or omit if using `GOOGLE_REFRESH_TOKEN` | If dedicated |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | MCC/Manager Account ID (digits only) — only needed if using a manager account | Optional |

**Fallback behavior:** If `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` / `GOOGLE_ADS_REFRESH_TOKEN` are not set, the system automatically uses `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN`. This works only if those credentials were authorized with the `adwords` scope.

### 11f. Verify Google Ads Readiness

Check the setup endpoint:
```
GET /api/setup-check
```

Look for the `google_ads` block in the response:
```json
{
  "google_ads": {
    "ready": true,
    "fields": {
      "GOOGLE_ADS_DEVELOPER_TOKEN": true,
      "GOOGLE_ADS_CLIENT_ID (or GOOGLE_CLIENT_ID)": true,
      "GOOGLE_ADS_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)": true,
      "GOOGLE_ADS_REFRESH_TOKEN (or GOOGLE_REFRESH_TOKEN)": true,
      "GOOGLE_ADS_CUSTOMER_ID": true,
      "GOOGLE_ADS_LOGIN_CUSTOMER_ID": false
    }
  }
}
```

`ready: true` means all required credentials are present. `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is optional.

> **Note:** `google_ads.ready` does **not** affect the landing page `"ready"` field. The landing page and keyword research module are fully independent.

### 11g. Test the Keyword Research Endpoint

Log in as admin and navigate to `/admin/keyword-research` — or test directly via the API:

```bash
curl -X POST https://your-app.replit.app/api/admin/keyword-research \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_ADMIN_SESSION_ID" \
  -d '{
    "seedKeywords": [
      "reduzir conta de luz empresa",
      "mercado livre de energia para empresas"
    ]
  }'
```

A successful response will look like:
```json
{
  "raw": [...],
  "classified": [
    {
      "keyword": "reduzir conta de energia empresa",
      "avg_monthly_searches": 1000,
      "competition": "MEDIUM",
      "competition_index": 45,
      "low_top_of_page_bid_micros": 500000,
      "high_top_of_page_bid_micros": 2000000,
      "campaign": "Alta Conta de Energia",
      "ad_group": "Redução de Conta de Energia",
      "commercial_intent_score": 4,
      "recommended_match_type": "exact",
      "reason": "Matched: \"Alta Conta de Energia\" › \"Redução de Conta de Energia\"",
      "negative_keyword_warnings": []
    }
  ],
  "summary": {
    "total": 50,
    "byCampaign": { "Alta Conta de Energia": 12, "Reject": 5 },
    "rejected": 5,
    "exact": 20,
    "phrase": 25
  }
}
```

### 11h. Common Errors

| Error | Cause | Fix |
|---|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN not configured` | Secret not set | Add `GOOGLE_ADS_DEVELOPER_TOKEN` to Replit Secrets |
| `Google Ads API error (HTTP 403)` | Developer token not approved or wrong account | Verify token status in Google Ads API Center |
| `Google Ads API error (HTTP 401)` | Invalid or expired refresh token | Regenerate refresh token with adwords scope (step 11d) |
| `Google Ads API error (HTTP 400): Customer not found` | Wrong Customer ID format | Strip dashes — use `1234567890` not `123-456-7890` |
| `Google Ads API error: The developer token is not approved` | Token in test mode with live account | Use a test account, or wait for basic access approval |
| `Google Ads API not fully configured` | One or more secrets missing | Check `/api/setup-check` → `google_ads.fields` for which ones are missing |

### 11i. API Version

The module uses Google Ads API **v17**. If you encounter version-related errors after Google sunsets v17, update the `ADS_API_VERSION` constant in `server/keywordResearchService.ts` to the current stable version (check [developers.google.com/google-ads/api/docs/sunset-dates](https://developers.google.com/google-ads/api/docs/sunset-dates)).
