import { randomUUID } from "crypto";

// ── Shared OAuth2 client ───────────────────────────────────────────────────────
async function getGoogleAuth() {
  const clientId = process.env.OTIMA_LEADS_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.OTIMA_LEADS_GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.OTIMA_LEADS_GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const msg = "[Landing] CRITICAL: Google OAuth credentials not configured. Set OTIMA_LEADS_GOOGLE_CLIENT_ID, OTIMA_LEADS_GOOGLE_CLIENT_SECRET, OTIMA_LEADS_GOOGLE_REFRESH_TOKEN.";
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
  const spreadsheetId = process.env.OTIMA_LEADS_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    const msg = "[Landing] CRITICAL: OTIMA_LEADS_SHEETS_SPREADSHEET_ID not configured — lead NOT saved to sheet.";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    const { google, auth } = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const COLUMNS = [
      "Submitted At", "Lead ID", "Channel", "Name", "Company", "Email", "Phone", "City", "State",
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
      range: "A1",
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
  const folderId = process.env.OTIMA_LEADS_DRIVE_FOLDER_ID;

  if (!folderId) {
    const msg = "[Landing] CRITICAL: OTIMA_LEADS_DRIVE_FOLDER_ID not configured — bill NOT uploaded.";
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

// ── Constants ──────────────────────────────────────────────────────────────────
const WA_BUSINESS = "5521997959777";
const BRAND_PURPLE = "#9e3ffd";

// ── WhatsApp helper ────────────────────────────────────────────────────────────
function buildWhatsAppLinks(rawPhone: string, nome: string, empresa: string): { plain: string; prefilled: string } {
  const digits = rawPhone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  const plain = `https://wa.me/${normalized}`;
  const message = `Olá ${nome}, aqui é o Renan da Ótima Energia. Recebemos sua solicitação de análise gratuita para reduzir a conta de energia da ${empresa || nome}. Posso te chamar por aqui para confirmar alguns dados?`;
  const prefilled = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  return { plain, prefilled };
}

// ── Email building blocks ──────────────────────────────────────────────────────
const EMAIL_LOGO_URL = "https://otimaenergia.com/logo-email.png";
const EMAIL_BRAND_PURPLE = "#5B3FBA";

const EMAIL_HEADER = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_BRAND_PURPLE};">
  <tr>
    <td align="center" style="padding:24px;">
      <img src="${EMAIL_LOGO_URL}" alt="Ótima Energia" width="140" style="display:block;width:140px;max-width:140px;height:auto;" />
    </td>
  </tr>
</table>`;

const EMAIL_FOOTER = `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:24px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e5e5;">
        <tr>
          <td style="padding-top:20px;color:#666;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <p style="margin:0 0 4px 0;">—</p>
            <p style="margin:4px 0;"><strong>Equipe Ótima Energia</strong></p>
            <p style="margin:0;color:#888;">Especialistas em Geração Distribuída e Mercado Livre de Energia</p>
            <p style="margin:8px 0;">
              <a href="https://otimaenergia.com" style="color:${EMAIL_BRAND_PURPLE};text-decoration:none;">otimaenergia.com</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/${WA_BUSINESS}" style="color:${EMAIL_BRAND_PURPLE};text-decoration:none;">WhatsApp</a>
            </p>
            <div style="margin-top:16px;">
              <img src="${EMAIL_LOGO_URL}" alt="Ótima Energia" width="80" style="width:80px;max-width:80px;height:auto;opacity:0.7;" />
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
        <tr>
          <td align="center" style="padding:24px;color:#888;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;">
            <p style="margin:0 0 4px 0;">Ótima Energia · CNPJ 65.023.912/0001-24</p>
            <p style="margin:0 0 4px 0;">Especialistas em Geração Distribuída e Mercado Livre de Energia</p>
            <p style="margin:0 0 4px 0;">Atendemos empresas em 23 estados do Brasil</p>
            <p style="margin:8px 0 0 0;">
              <a href="https://otimaenergia.com" style="color:${EMAIL_BRAND_PURPLE};text-decoration:none;">otimaenergia.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

function infoBox(content: string, variant: "purple" | "yellow" | "gray"): string {
  const styles = {
    purple: { bg: "#f8f5ff", border: EMAIL_BRAND_PURPLE },
    yellow: { bg: "#fff8e1", border: "#f5a623" },
    gray:   { bg: "#f5f5f5", border: "#999999" },
  }[variant];
  return `<div style="background-color:${styles.bg};border-left:4px solid ${styles.border};padding:16px 20px;margin:24px 0;border-radius:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${content}</div>`;
}

function waButton(url: string, label = "💬 Falar pelo WhatsApp"): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;padding:14px 28px;background-color:#25D366;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function wrapEmail(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#f0f0f0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;">
  <tr>
    <td align="center" style="padding:24px 0;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#222222;">
            ${body}
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </td>
  </tr>
</table>
</body></html>`;
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
  billUploaded?: boolean;
  tipo?: string;
  ipAddress?: string;
  leadStatus?: string;
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
  const smtpPass = process.env.OTIMA_SMTP_PASS;
  if (!smtpPass) {
    console.error("[Landing] OTIMA_SMTP_PASS not set — internal notification NOT sent. Lead may be lost if Sheet is also not configured.");
    return;
  }

  const fromEmail = process.env.OTIMA_EMAIL_FROM || "marketing@otimaenergia.com";
  const internalLeadEmail = process.env.OTIMA_INTERNAL_LEAD_EMAIL || "callum@otimaenergia.com";
  const ottoFrom = `"Otto - Ótima Energia" <${fromEmail}>`;
  const marketingFrom = `"Ótima Energia" <${fromEmail}>`;

  const smtpHost = process.env.OTIMA_SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.OTIMA_SMTP_PORT || "587");
  const smtpUser = process.env.OTIMA_SMTP_USER || fromEmail;

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const companyOrName = params.empresa?.trim() || params.nome;
  const { plain: waPlain, prefilled: waPrefilled } = buildWhatsAppLinks(params.phone, params.nome, companyOrName);
  const billLine = params.billUploaded
    ? (params.billFileUrl ? `Sim — <a href="${params.billFileUrl}" style="color:${BRAND_PURPLE};">Ver arquivo</a>` : "Sim (upload falhou — coletar manualmente)")
    : "Não";

  // ── Copy block for internal forward ──
  const copyBlock = `Novo lead Ótima

Nome: ${params.nome}
Empresa: ${params.empresa || "—"}
Email: ${params.email}
WhatsApp: ${params.phone}
Cidade/UF: ${params.cidade} / ${params.estado}
Conta média: ${params.valorConta}
Tipo de imóvel: ${params.tipoImovel}
Conta enviada: ${params.billUploaded ? "Sim" : "Não"}
Link da conta: ${params.billFileUrl || "—"}
Mensagem: ${params.mensagem || "—"}

Origem: ${params.utm_source || "—"}
Campanha: ${params.utm_campaign || "—"}
Termo: ${params.utm_term || "—"}
Conteúdo: ${params.utm_content || "—"}
GCLID: ${params.gclid || "—"}

Próxima ação sugerida:
Chamar no WhatsApp imediatamente.`;

  // ── Internal alert HTML ──
  const internalHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222;">
  <div style="background:${BRAND_PURPLE};padding:20px 24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:20px;">🔔 Novo lead Ótima</h1>
    <p style="color:#e8d5ff;margin:4px 0 0;">${params.leadId} · ${params.submittedAt}</p>
  </div>
  <div style="background:#f9f6ff;padding:20px 24px;border-bottom:3px solid ${BRAND_PURPLE};">
    <a href="${waPrefilled}" style="display:inline-block;background:#25D366;color:#fff;font-weight:bold;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:16px;">📲 Abrir WhatsApp do lead</a>
    <p style="margin:10px 0 0;font-size:13px;color:#666;">Link direto: <a href="${waPlain}" style="color:${BRAND_PURPLE};">${waPlain}</a></p>
  </div>
  <div style="padding:20px 24px;">
    <h2 style="font-size:16px;color:${BRAND_PURPLE};margin:0 0 12px;">Dados do lead</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#666;width:160px;">Nome</td><td style="padding:6px 0;font-weight:bold;">${params.nome}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:6px 4px;color:#666;">Empresa</td><td style="padding:6px 4px;">${params.empresa || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${params.email}" style="color:${BRAND_PURPLE};">${params.email}</a></td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:6px 4px;color:#666;">WhatsApp</td><td style="padding:6px 4px;"><a href="${waPlain}" style="color:${BRAND_PURPLE};">${params.phone}</a></td></tr>
      <tr><td style="padding:6px 0;color:#666;">Cidade / UF</td><td style="padding:6px 0;">${params.cidade} / ${params.estado}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:6px 4px;color:#666;">Conta média</td><td style="padding:6px 4px;font-weight:bold;">${params.valorConta}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Tipo de imóvel</td><td style="padding:6px 0;">${params.tipoImovel}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:6px 4px;color:#666;">Conta enviada?</td><td style="padding:6px 4px;">${billLine}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Status</td><td style="padding:6px 0;">${params.leadStatus || "Novo"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:6px 4px;color:#666;">Mensagem</td><td style="padding:6px 4px;">${params.mensagem || "—"}</td></tr>
    </table>
    <h2 style="font-size:16px;color:${BRAND_PURPLE};margin:20px 0 12px;">Rastreamento</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#555;">
      <tr><td style="padding:4px 0;width:160px;">UTM Source</td><td>${params.utm_source || "—"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:4px 4px;">UTM Medium</td><td style="padding:4px 4px;">${params.utm_medium || "—"}</td></tr>
      <tr><td style="padding:4px 0;">UTM Campaign</td><td>${params.utm_campaign || "—"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:4px 4px;">UTM Term</td><td style="padding:4px 4px;">${params.utm_term || "—"}</td></tr>
      <tr><td style="padding:4px 0;">UTM Content</td><td>${params.utm_content || "—"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:4px 4px;">GCLID</td><td style="padding:4px 4px;">${params.gclid || "—"}</td></tr>
      <tr><td style="padding:4px 0;">GBRAID</td><td>${params.gbraid || "—"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:4px 4px;">WBRAID</td><td style="padding:4px 4px;">${params.wbraid || "—"}</td></tr>
      <tr><td style="padding:4px 0;">Landing Page</td><td style="word-break:break-all;">${params.landingPageUrl || "—"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:4px 4px;">Referrer</td><td style="padding:4px 4px;word-break:break-all;">${params.referrer || "—"}</td></tr>
      <tr><td style="padding:4px 0;">IP</td><td>${params.ipAddress || "—"}</td></tr>
      <tr style="background:#f5f0ff;"><td style="padding:4px 4px;">User Agent</td><td style="padding:4px 4px;font-size:11px;word-break:break-all;">${params.userAgent || "—"}</td></tr>
    </table>
    <h2 style="font-size:16px;color:${BRAND_PURPLE};margin:20px 0 8px;">Bloco para encaminhar ao Renan</h2>
    <pre style="background:#f0ebff;border:1px solid #d4b8ff;border-radius:6px;padding:14px;font-size:12px;white-space:pre-wrap;word-break:break-word;">${copyBlock}</pre>
  </div>
  <div style="background:#f3f0f8;padding:12px 24px;font-size:11px;color:#999;border-radius:0 0 8px 8px;">
    Ótima Energia · otto@otimaenergia.com · otimaenergia.com
  </div>
</body>
</html>`;

  // ── Send internal alert ──
  const internalSubject = `Novo lead Ótima — ${companyOrName} — ${params.valorConta} — ${params.estado}`;
  await transporter.sendMail({
    from: ottoFrom,
    to: internalLeadEmail,
    subject: internalSubject,
    html: internalHtml,
    text: copyBlock,
  });

  // ── Customer confirmation — HTML, varies by tipo ──
  const waCompleto = `https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent("Olá! Acabei de me cadastrar no site da Ótima Energia e gostaria de conversar sobre minha análise.")}`;
  const waSemConta = `https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent(`Olá! Acabei de me cadastrar no site da Ótima Energia e vou enviar minha conta de luz para análise. Meu nome é ${params.nome} da empresa ${companyOrName}.`)}`;
  const waCasoEspecial = `https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent("Olá! Acabei de me cadastrar no site da Ótima Energia - caso especial - gostaria de conversar sobre minha situação.")}`;

  let confirmHtml: string;
  if (params.tipo === "sem-conta") {
    confirmHtml = wrapEmail(`
<p style="margin:0 0 16px;">Olá ${params.nome},</p>
<p style="margin:0 0 16px;">Recebemos seus dados!</p>
${infoBox(`<p style="margin:0 0 8px;font-weight:600;color:#b45309;">Próximo passo importante</p><p style="margin:0;color:#222;">Para fazermos sua análise gratuita o mais rápido possível, precisamos da sua conta de luz mais recente.</p>`, "yellow")}
<p style="margin:0 0 8px;">A forma mais rápida é enviar agora pelo WhatsApp:</p>
${waButton(waSemConta, "💬 Enviar conta pelo WhatsApp")}
<p style="margin:0 0 16px;color:#444;">Ou responda este email anexando o PDF ou foto da conta.</p>
<p style="margin:0;color:#666;font-size:14px;">Sem a conta, nossa equipe entrará em contato pelo telefone informado para coletar as informações necessárias.</p>`);
  } else if (params.tipo === "caso-especial") {
    confirmHtml = wrapEmail(`
<p style="margin:0 0 16px;">Olá ${params.nome},</p>
<p style="margin:0 0 16px;">Recebemos sua solicitação.</p>
${infoBox(`<p style="margin:0 0 8px;color:#555;">Seu caso está um pouco fora do perfil padrão que atendemos (empresas com conta de luz acima de R$ 5.000/mês), mas vamos fazer uma revisão individual para ver se conseguimos te ajudar.</p>`, "gray")}
<p style="margin:0 0 8px;font-size:14px;color:#666;">Esse processo pode levar um pouco mais que o normal. Se tiver dúvidas, fale conosco pelo WhatsApp:</p>
${waButton(waCasoEspecial)}`);
  } else {
    confirmHtml = wrapEmail(`
<p style="margin:0 0 16px;">Olá ${params.nome},</p>
<p style="margin:0 0 16px;">Recebemos sua conta de luz e seus dados!</p>
${infoBox(`<p style="margin:0;color:#3b1e7a;">Nossa equipe de especialistas vai analisar tudo e entrar em contato em até <strong>24 horas úteis</strong>. Não precisa fazer mais nada agora. Vamos cuidar de tudo a partir daqui.</p>`, "purple")}
<p style="margin:0 0 8px;color:#444;">Se preferir falar conosco agora pelo WhatsApp:</p>
${waButton(waCompleto)}`);
  }

  await transporter.sendMail({
    from: marketingFrom,
    replyTo: internalLeadEmail,
    to: params.email,
    subject: "Recebemos sua solicitação — Ótima Energia",
    html: confirmHtml,
    text: confirmHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });

  console.log(`[Landing] Emails sent for lead ${params.leadId}`);
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
