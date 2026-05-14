import { randomUUID } from "crypto";

// ── Shared OAuth2 client ───────────────────────────────────────────────────────
async function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const msg = "[Landing] CRITICAL: Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.";
    console.error(msg);
    throw new Error(msg);
  }

  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return { google, auth: oauth2Client };
}

// ── Google Sheets ──────────────────────────────────────────────────────────────
export async function appendToGoogleSheet(row: Record<string, any>): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    const msg = "[Landing] CRITICAL: GOOGLE_SHEETS_SPREADSHEET_ID not configured — lead NOT saved to sheet.";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    const { google, auth } = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const COLUMNS = [
      "Submitted At", "Lead ID", "Name", "Company", "Email", "Phone", "City", "State",
      "Average Energy Bill", "Property Type", "Bill Uploaded?", "Bill File URL", "Message",
      "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content",
      "GCLID", "GBRAID", "WBRAID", "Landing Page URL", "Referrer", "User Agent", "IP Address",
      "Lead Status", "Assigned To", "Sales Notes", "Qualified?", "Monthly Bill Confirmed", "Next Action Date",
    ];

    const values = COLUMNS.map(col => {
      const key = col.toLowerCase().replace(/[^a-z0-9]/g, "_");
      return row[key] ?? row[col] ?? "";
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    console.log("[Landing] Row appended to Google Sheet");
  } catch (err: any) {
    console.error("[Landing] Google Sheets error:", err.message);
    throw err;
  }
}

// ── Google Drive upload ────────────────────────────────────────────────────────
export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string | null> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    const msg = "[Landing] CRITICAL: GOOGLE_DRIVE_FOLDER_ID not configured — bill NOT uploaded.";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    const { google, auth } = await getGoogleAuth();
    const { Readable } = await import("stream");
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: "id,webViewLink",
    });

    const fileId = res.data.id;
    if (fileId) {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
      });
    }

    console.log("[Landing] File uploaded to Drive:", res.data.webViewLink);
    return res.data.webViewLink || null;
  } catch (err: any) {
    console.error("[Landing] Google Drive error:", err.message);
    throw err;
  }
}

// ── Email via Zoho SMTP ────────────────────────────────────────────────────────
export async function sendLandingEmails(params: {
  nome: string;
  empresa: string;
  email: string;
  phone: string;
  cidade: string;
  estado: string;
  valorConta: string;
  tipoImovel: string;
  mensagem?: string;
  billFileUrl?: string | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  landingPageUrl?: string;
  referrer?: string;
  userAgent?: string;
  submittedAt: string;
  leadId: string;
}): Promise<void> {
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpPass) {
    console.error("[Landing] SMTP_PASS not set — internal notification NOT sent. Lead may be lost if Sheet is also not configured.");
    return;
  }

  const fromEmail = process.env.EMAIL_FROM || "notificacoes@otimaenergia.com";

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: { user: fromEmail, pass: smtpPass },
    });

    const internalBody = `
Novo lead do Google Ads — ID: ${params.leadId}
Enviado em: ${params.submittedAt}

DADOS DO LEAD
Nome: ${params.nome}
Empresa: ${params.empresa}
Email: ${params.email}
Telefone: ${params.phone}
Cidade: ${params.cidade} / ${params.estado}
Valor médio da conta: ${params.valorConta}
Tipo de imóvel: ${params.tipoImovel}
Mensagem: ${params.mensagem || "—"}

CONTA DE ENERGIA
${params.billFileUrl ? `Link: ${params.billFileUrl}` : "Não enviada"}

RASTREAMENTO
UTM Source: ${params.utm_source || "—"}
UTM Medium: ${params.utm_medium || "—"}
UTM Campaign: ${params.utm_campaign || "—"}
UTM Term: ${params.utm_term || "—"}
UTM Content: ${params.utm_content || "—"}
GCLID: ${params.gclid || "—"}
GBRAID: ${params.gbraid || "—"}
WBRAID: ${params.wbraid || "—"}
Landing Page: ${params.landingPageUrl || "—"}
Referrer: ${params.referrer || "—"}
User Agent: ${params.userAgent || "—"}
    `.trim();

    await transporter.sendMail({
      from: `"Ótima Energia" <${fromEmail}>`,
      to: "callum@otimaenergia.com",
      subject: `Novo lead Google Ads - ${params.empresa} - ${params.valorConta}`,
      text: internalBody,
    });

    const confirmBody = `Olá ${params.nome},

Recebemos sua solicitação de auditoria gratuita de economia de energia.

Nossa equipe irá analisar as informações enviadas e um Especialista em Energia da Ótima entrará em contato com sua comparação personalizada.

Se você ainda não enviou sua conta de energia, pode responder este email com o arquivo para agilizar a análise.

Obrigado,
Equipe Ótima Energia
www.otimaenergia.com`;

    await transporter.sendMail({
      from: `"Ótima Energia" <${fromEmail}>`,
      replyTo: "callum@otimaenergia.com",
      to: params.email,
      subject: "Recebemos sua solicitação de auditoria gratuita | Ótima Energia",
      text: confirmBody,
    });

    console.log(`[Landing] Emails sent for lead ${params.leadId}`);
  } catch (err: any) {
    console.error("[Landing] Email error:", err.message);
    throw err;
  }
}

// ── Rate limiter (simple in-memory, per IP) ────────────────────────────────────
const submissionLog = new Map<string, number[]>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;

export function checkLandingRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= MAX_PER_HOUR) return false;
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return true;
}

export function generateLeadId(): string {
  return `LD-${randomUUID().slice(0, 8).toUpperCase()}`;
}
