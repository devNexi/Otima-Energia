#!/usr/bin/env node
/**
 * One-time setup script — generates a Google OAuth2 refresh token for Google Ads API.
 * Run with:  node scripts/get-otima-ads-refresh-token.js
 *
 * Scope:
 *   - https://www.googleapis.com/auth/adwords
 *
 * Requires OTIMA_ADS_CLIENT_ID and OTIMA_ADS_CLIENT_SECRET
 * to be set as environment variables (Replit Secrets) before running.
 *
 * Does NOT modify any production code.
 */

import readline from "readline";
import { google } from "googleapis";

const clientId = process.env.OTIMA_ADS_CLIENT_ID;
const clientSecret = process.env.OTIMA_ADS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("\nERROR: OTIMA_ADS_CLIENT_ID and OTIMA_ADS_CLIENT_SECRET must be set as environment variables.");
  console.error("Add them to Replit Secrets before running this script.\n");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost";
const SCOPES = [
  "https://www.googleapis.com/auth/adwords",
];

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n─────────────────────────────────────────────────────────────────");
console.log("  Ótima Energia — Google Ads OAuth2 Refresh Token Generator");
console.log("─────────────────────────────────────────────────────────────────");
console.log("\nThis token is ONLY for Google Ads keyword research.");
console.log("For lead capture (Sheets/Drive), use scripts/get-otima-leads-refresh-token.js instead.\n");
console.log("Step 1 — Open this URL in your browser and sign in with the");
console.log("         Google account that has access to your Ads account:\n");
console.log("  " + authUrl);
console.log("\nStep 2 — After authorising, Google will redirect to a URL that");
console.log("         starts with http://localhost/?code=...");
console.log("         The page will fail to load — that is expected.");
console.log("         Copy the full URL from the browser address bar.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Step 3 — Paste the full redirect URL (or just the code= value) here:\n> ", async (input) => {
  rl.close();

  let code = input.trim();

  try {
    const url = new URL(code);
    const extracted = url.searchParams.get("code");
    if (extracted) code = extracted;
  } catch {
    // Not a URL — assume it's already the raw code
  }

  if (!code) {
    console.error("\nERROR: No code provided. Please re-run the script and paste the redirect URL.\n");
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error("\nERROR: No refresh_token was returned.");
      console.error("This usually means the account has already authorised this app.");
      console.error("To force a new refresh token:");
      console.error("  1. Go to https://myaccount.google.com/permissions");
      console.error("  2. Remove access for your app.");
      console.error("  3. Re-run this script.\n");
      process.exit(1);
    }

    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("  SUCCESS — your refresh token:");
    console.log("─────────────────────────────────────────────────────────────────\n");
    console.log(tokens.refresh_token);
    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("\nNext step — add this to Replit Secrets:");
    console.log("  Secret name : OTIMA_ADS_REFRESH_TOKEN");
    console.log("  Secret value: (the token printed above)\n");
    console.log("Then verify your setup at:  GET /api/admin/google-ads-diagnostics\n");
  } catch (err) {
    console.error("\nERROR: Token exchange failed:", err.message);
    console.error("The authorisation code may have expired (they are single-use and short-lived).");
    console.error("Re-run the script and paste the code immediately after copying it.\n");
    process.exit(1);
  }
});
