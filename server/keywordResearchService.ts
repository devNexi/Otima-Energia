import { google } from "googleapis";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Campaign =
  | "Alta Conta de Energia"
  | "Mercado Livre de Energia"
  | "ACR ACL GDL"
  | "Redução de Custos Empresariais"
  | "Condomínios"
  | "Indústria e Comércio"
  | "Reject";

export type MatchType = "exact" | "phrase" | "reject";

export interface MonthlyVolume {
  year: number;
  month: string;
  monthlySearches: number;
}

export interface RawKeywordResult {
  keyword: string;
  avg_monthly_searches: number | null;
  competition: string;
  competition_index: number | null;
  low_top_of_page_bid_micros: number | null;
  high_top_of_page_bid_micros: number | null;
  monthly_search_volumes: MonthlyVolume[];
}

export interface ClassifiedKeyword extends RawKeywordResult {
  campaign: Campaign;
  ad_group: string;
  commercial_intent_score: number;
  recommended_match_type: MatchType;
  reason: string;
  negative_keyword_warnings: string[];
}

// ─── OAuth2 access token ──────────────────────────────────────────────────────

async function getAdsAccessToken(): Promise<string> {
  const clientId =
    process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken =
    process.env.GOOGLE_ADS_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Ads OAuth credentials missing. Set GOOGLE_ADS_CLIENT_ID, " +
        "GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN (or fall back to " +
        "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN if the " +
        "refresh token includes the adwords scope)."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2.getAccessToken();
  if (!token) throw new Error("Failed to refresh Google Ads access token.");
  return token;
}

// ─── Google Ads API — keyword ideas ──────────────────────────────────────────

// Brazil geo target constant:  2076
// Portuguese language constant: 1014
const GEO_BRAZIL = "geoTargetConstants/2076";
const LANG_PORTUGUESE = "languageConstants/1014";

// Default: v19 (Feb 2025). Override via GOOGLE_ADS_API_VERSION env var if
// Google has sunset v19 — check https://developers.google.com/google-ads/api/docs/sunset-dates
function getApiVersion(): string {
  return process.env.GOOGLE_ADS_API_VERSION?.trim() || "v19";
}

function buildKeywordIdeasUrl(customerId: string): string {
  return `https://googleads.googleapis.com/${getApiVersion()}/customers/${customerId}:generateKeywordIdeas`;
}

function parseAdsError(status: number, contentType: string, body: string): string {
  const isHtml = contentType.includes("text/html") || body.trimStart().startsWith("<!DOCTYPE") || body.trimStart().startsWith("<html");

  if (isHtml || status === 404) {
    return (
      `Google Ads API returned ${status} (HTML/Not Found). ` +
      `The API version "${getApiVersion()}" is likely sunset or the endpoint path is wrong. ` +
      `Set GOOGLE_ADS_API_VERSION to a supported version (e.g. v19, v20, v21) and check ` +
      `https://developers.google.com/google-ads/api/docs/sunset-dates. ` +
      `Run /api/admin/google-ads-diagnostics?test=1 for details.`
    );
  }

  try {
    const parsed = JSON.parse(body);
    const err = parsed?.error;
    if (err) {
      const parts: string[] = [`Google Ads API error ${status}`];
      if (err.status) parts.push(err.status);
      if (err.message) parts.push(err.message);
      const details = err.details?.[0];
      if (details?.errors?.[0]?.message) parts.push(details.errors[0].message);
      return parts.join(" — ");
    }
  } catch { /* not JSON */ }

  return `Google Ads API error (HTTP ${status}): ${body.slice(0, 300)}`;
}

export async function fetchKeywordIdeas(params: {
  seedKeywords: string[];
  includeAdultKeywords?: boolean;
}): Promise<RawKeywordResult[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const rawCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!developerToken)
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN not configured.");
  if (!rawCustomerId)
    throw new Error("GOOGLE_ADS_CUSTOMER_ID not configured.");

  const customerId = rawCustomerId.replace(/-/g, "");
  if (!/^\d+$/.test(customerId))
    throw new Error(`GOOGLE_ADS_CUSTOMER_ID must be digits only. Got: "${rawCustomerId}"`);

  const accessToken = await getAdsAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) {
    headers["login-customer-id"] = loginCustomerId.replace(/-/g, "");
  }

  const body = {
    keywordSeed: { keywords: params.seedKeywords },
    geoTargetConstants: [GEO_BRAZIL],
    language: LANG_PORTUGUESE,
    keywordPlanNetwork: "GOOGLE_SEARCH",
    includeAdultKeywords: params.includeAdultKeywords ?? false,
  };

  const url = buildKeywordIdeasUrl(customerId);
  console.log(`[keyword-research] POST ${url} — seeds: ${params.seedKeywords.join(", ")}`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    const errText = await res.text();
    console.error(`[keyword-research] Error — status: ${res.status}, content-type: ${contentType}, url: ${url}, body[0:500]: ${errText.slice(0, 500)}`);
    throw new Error(parseAdsError(res.status, contentType, errText));
  }

  const data = await res.json();
  return (data.results || []).map((r: any): RawKeywordResult => {
    const m = r.keywordIdeaMetrics || {};
    const volumes: MonthlyVolume[] = (m.monthlySearchVolumes || []).map(
      (v: any) => ({
        year: Number(v.year ?? 0),
        month: String(v.month ?? ""),
        monthlySearches: Number(v.monthlySearches ?? 0),
      })
    );
    return {
      keyword: String(r.text || ""),
      avg_monthly_searches:
        m.avgMonthlySearches != null ? Number(m.avgMonthlySearches) : null,
      competition: String(m.competition || "UNKNOWN"),
      competition_index:
        m.competitionIndex != null ? Number(m.competitionIndex) : null,
      low_top_of_page_bid_micros:
        m.lowTopOfPageBidMicros != null
          ? Number(m.lowTopOfPageBidMicros)
          : null,
      high_top_of_page_bid_micros:
        m.highTopOfPageBidMicros != null
          ? Number(m.highTopOfPageBidMicros)
          : null,
      monthly_search_volumes: volumes,
    };
  });
}

// ─── Classifier ──────────────────────────────────────────────────────────────

const REJECT_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /segunda\s*via|2[aª]\s*via/i,
    reason: "utility customer service (segunda via)",
  },
  {
    pattern: /boleto|fatura\s+atrasada|d[eé]bito\s+autom[aá]tico/i,
    reason: "billing/payment service search",
  },
  {
    pattern: /emprego|vaga(s)?\s+de|trabalhar\s+em|carreira\s+em|curr[ií]culo|sele[cç][aã]o\s+de\s+pessoal/i,
    reason: "job/career search",
  },
  {
    pattern: /\bcurso\s+(de\s+)?(energia|elétric)|faculdade|universidade|gradua[cç][aã]o|p[oó]s.gradu|certifica[cç][aã]o\s+em\s+(energia|elétric)/i,
    reason: "education/course search",
  },
  {
    pattern: /residencial|pessoa\s+f[ií]sica|energia\s+para\s+casa|conta\s+de\s+luz\s+(da\s+)?(casa|minha)/i,
    reason: "residential user (not B2B)",
  },
  {
    pattern: /painel\s+solar|placa\s+solar|kit\s+solar|instala[cç][aã]o\s+solar|fotovoltaico\s+(residencial|para\s+casa)/i,
    reason: "solar equipment purchase (not brokerage)",
  },
  {
    pattern: /baixar|download|\.pdf|\bpdf\b|template|modelo\s+de\s+(contrato|planilha)|planilha\s+grat/i,
    reason: "document/template search",
  },
  {
    pattern: /calculadora\s+grat|ferramenta\s+grat|software\s+grat|sistema\s+grat/i,
    reason: "free tool search",
  },
  {
    pattern: /ouvidoria|reclamação\s+(enel|cemig|copel|cpfl|equatorial|elektro)|atendimento\s+ao\s+cliente\s+(enel|cemig|copel)/i,
    reason: "utility complaint/customer service",
  },
  {
    pattern: /concurso\s+p[uú]blico/i,
    reason: "public service exam",
  },
  {
    pattern: /significado\s+de|defini[cç][aã]o\s+de|conceito\s+de/i,
    reason: "generic educational/definitional search",
  },
];

const WARNING_PATTERNS: Array<{ pattern: RegExp; warning: string }> = [
  {
    pattern: /grat(is|uito)/i,
    warning: 'Contains "grátis" — may attract non-commercial users',
  },
  {
    pattern: /o\s+que\s+[eé]|como\s+funciona/i,
    warning: "Informational intent — lower conversion probability",
  },
  {
    pattern: /\bsolar\b/i,
    warning: 'Contains "solar" — verify intent is brokerage, not solar installation',
  },
  {
    pattern: /microempresa|mei\b/i,
    warning: "MEI/microempresa — may be below ACL eligibility threshold",
  },
];

interface CampaignRule {
  campaign: Campaign;
  ad_group: string;
  patterns: RegExp[];
  base_intent: number;
}

const CAMPAIGN_RULES: CampaignRule[] = [
  // ACR ACL GDL
  {
    campaign: "ACR ACL GDL",
    ad_group: "Migração para Mercado Livre",
    patterns: [/migrar?\s+(para\s+)?(o\s+)?mercado\s+livre|migração\s+(para\s+)?energia|sair\s+do\s+mercado\s+cativo/i],
    base_intent: 5,
  },
  {
    campaign: "ACR ACL GDL",
    ad_group: "ACL Mercado Livre",
    patterns: [/\bacl\b.*empresa|\bacl\b.*energia|energia.*\bacl\b|mercado\s+livre\s+de\s+energia\s+(para\s+)?(empresa|indústria|compan)/i],
    base_intent: 4,
  },
  {
    campaign: "ACR ACL GDL",
    ad_group: "GDL Geração Distribuída",
    patterns: [/\bgdl\b|\bgeração\s+distribu[íi]da/i],
    base_intent: 4,
  },
  {
    campaign: "ACR ACL GDL",
    ad_group: "Incentivada e Convencional",
    patterns: [/energia\s+(incentivada|convencional)|tarifa\s+(incentivada|convencional)|\bacr\b|mercado\s+cativo/i],
    base_intent: 3,
  },
  // Mercado Livre de Energia
  {
    campaign: "Mercado Livre de Energia",
    ad_group: "Cotação e Comparação de Fornecedores",
    patterns: [/cotar?\s+energia|comparar\s+(fornecedor|preço|tarifa)\s+de\s+energia|melhor\s+fornecedor\s+de\s+energia/i],
    base_intent: 5,
  },
  {
    campaign: "Mercado Livre de Energia",
    ad_group: "Fornecedores de Energia",
    patterns: [/fornecedor\s+de\s+energia|comercializador(a)?\s+de\s+energia|trading\s+de\s+energia|broker\s+de\s+energia/i],
    base_intent: 5,
  },
  {
    campaign: "Mercado Livre de Energia",
    ad_group: "Mercado Livre Geral",
    patterns: [/mercado\s+livre\s+de\s+energia|energia\s+livre|energia\s+no\s+mercado\s+livre/i],
    base_intent: 4,
  },
  // Alta Conta de Energia
  {
    campaign: "Alta Conta de Energia",
    ad_group: "Auditoria de Conta",
    patterns: [/auditoria\s+de\s+(conta\s+de\s+)?(energia|luz)|análise\s+de\s+conta\s+de\s+(energia|luz)|revisão\s+de\s+conta\s+de\s+energia/i],
    base_intent: 5,
  },
  {
    campaign: "Alta Conta de Energia",
    ad_group: "Redução de Conta de Energia",
    patterns: [/reduzir?\s+(a\s+)?(conta|gasto|custo|valor)\s+de\s+(energia|luz)|economizar\s+(na\s+)?(conta|energia|luz)\s+(da\s+)?(empresa|negócio)/i],
    base_intent: 4,
  },
  {
    campaign: "Alta Conta de Energia",
    ad_group: "Conta de Energia Alta",
    patterns: [/conta\s+de\s+(energia|luz)\s+(alta|cara|elevada|subindo|aumentando)|energia\s+(muito\s+)?cara\s+(para\s+)?(empresa|negócio)/i],
    base_intent: 3,
  },
  {
    campaign: "Alta Conta de Energia",
    ad_group: "Gasto com Energia",
    patterns: [/gasto\s+com\s+energia|despesa\s+(com|de)\s+energia|custo\s+(com|de)\s+energia\s+(da\s+)?(empresa|industrial|comercial)/i],
    base_intent: 4,
  },
  // Condomínios
  {
    campaign: "Condomínios",
    ad_group: "Condomínio Comercial",
    patterns: [/condomínio\s+comercial|shopping\s+(center\s+)?energia|energia\s+para\s+shopping/i],
    base_intent: 4,
  },
  {
    campaign: "Condomínios",
    ad_group: "Condomínio Geral",
    patterns: [/condomínio|síndico|administradora\s+de\s+condomínio/i],
    base_intent: 3,
  },
  // Redução de Custos Empresariais
  {
    campaign: "Redução de Custos Empresariais",
    ad_group: "Eficiência Energética Empresarial",
    patterns: [/eficiência\s+energética\s+(para\s+)?(empresa|indústria|comercial|corporativ)/i],
    base_intent: 4,
  },
  {
    campaign: "Redução de Custos Empresariais",
    ad_group: "Custo Operacional",
    patterns: [/reduzir?\s+(custo|despesa)\s+(operacional|empresarial)|cortar\s+gasto\s+(empresa|negócio|corporativo)/i],
    base_intent: 3,
  },
  // Indústria e Comércio
  {
    campaign: "Indústria e Comércio",
    ad_group: "Consultoria de Energia Empresarial",
    patterns: [/consultoria\s+de\s+energia|gestão\s+(de\s+)?energia\s+(empresa|corporativ|industrial)/i],
    base_intent: 4,
  },
  {
    campaign: "Indústria e Comércio",
    ad_group: "Energia para Empresa",
    patterns: [/energia\s+para\s+empresa|energia\s+empresarial|energia\s+corporativa/i],
    base_intent: 4,
  },
  {
    campaign: "Indústria e Comércio",
    ad_group: "Indústria",
    patterns: [/energia\s+(para\s+)?(indústria|industrial|fábrica|manufatura|planta\s+industrial)/i],
    base_intent: 3,
  },
  {
    campaign: "Indústria e Comércio",
    ad_group: "Comércio e Varejo",
    patterns: [/energia\s+(para\s+)?(comércio|varejo|loja|supermercado|rede\s+de\s+lojas)/i],
    base_intent: 3,
  },
];

function classifyKeyword(raw: RawKeywordResult): ClassifiedKeyword {
  const kw = raw.keyword.toLowerCase();

  for (const { pattern, reason } of REJECT_PATTERNS) {
    if (pattern.test(kw)) {
      return {
        ...raw,
        campaign: "Reject",
        ad_group: "—",
        commercial_intent_score: 1,
        recommended_match_type: "reject",
        reason: `Rejected: ${reason}`,
        negative_keyword_warnings: [],
      };
    }
  }

  const warnings: string[] = [];
  for (const { pattern, warning } of WARNING_PATTERNS) {
    if (pattern.test(kw)) warnings.push(warning);
  }

  for (const rule of CAMPAIGN_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(kw)) {
        let intent = rule.base_intent;
        if (raw.avg_monthly_searches != null) {
          if (raw.avg_monthly_searches < 10) intent = Math.max(1, intent - 1);
          else if (raw.avg_monthly_searches >= 1000) intent = Math.min(5, intent + 1);
        }
        const matchType: MatchType =
          intent >= 4 ? "exact" : intent >= 2 ? "phrase" : "reject";
        return {
          ...raw,
          campaign: rule.campaign,
          ad_group: rule.ad_group,
          commercial_intent_score: intent,
          recommended_match_type: matchType,
          reason: `Matched: "${rule.campaign}" › "${rule.ad_group}"`,
          negative_keyword_warnings: warnings,
        };
      }
    }
  }

  // Fallback
  return {
    ...raw,
    campaign: "Indústria e Comércio",
    ad_group: "PME e Empresas Gerais",
    commercial_intent_score: 2,
    recommended_match_type: "phrase",
    reason: "No specific campaign rule matched — defaulted to broad B2B category",
    negative_keyword_warnings: warnings,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runKeywordResearch(params: {
  seedKeywords: string[];
  includeAdultKeywords?: boolean;
}): Promise<{
  raw: RawKeywordResult[];
  classified: ClassifiedKeyword[];
  summary: {
    total: number;
    byCampaign: Record<string, number>;
    rejected: number;
    exact: number;
    phrase: number;
  };
}> {
  const raw = await fetchKeywordIdeas(params);
  const classified = raw.map(classifyKeyword);

  const byCampaign: Record<string, number> = {};
  let rejected = 0;
  let exact = 0;
  let phrase = 0;

  for (const c of classified) {
    byCampaign[c.campaign] = (byCampaign[c.campaign] || 0) + 1;
    if (c.recommended_match_type === "reject") rejected++;
    if (c.recommended_match_type === "exact") exact++;
    if (c.recommended_match_type === "phrase") phrase++;
  }

  return {
    raw,
    classified,
    summary: { total: raw.length, byCampaign, rejected, exact, phrase },
  };
}

// ─── Readiness check ─────────────────────────────────────────────────────────

export function checkGoogleAdsReadiness(): {
  ready: boolean;
  fields: Record<string, boolean>;
} {
  const has = (k: string) =>
    !!(process.env[k] && process.env[k]!.trim().length > 0);

  const hasDeveloperToken = has("GOOGLE_ADS_DEVELOPER_TOKEN");
  const hasClientId = has("GOOGLE_ADS_CLIENT_ID") || has("GOOGLE_CLIENT_ID");
  const hasClientSecret = has("GOOGLE_ADS_CLIENT_SECRET") || has("GOOGLE_CLIENT_SECRET");
  const hasRefreshToken = has("GOOGLE_ADS_REFRESH_TOKEN") || has("GOOGLE_REFRESH_TOKEN");
  const hasCustomerId = has("GOOGLE_ADS_CUSTOMER_ID");

  return {
    ready: hasDeveloperToken && hasClientId && hasClientSecret && hasRefreshToken && hasCustomerId,
    fields: {
      GOOGLE_ADS_DEVELOPER_TOKEN: hasDeveloperToken,
      "GOOGLE_ADS_CLIENT_ID (or GOOGLE_CLIENT_ID)": hasClientId,
      "GOOGLE_ADS_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)": hasClientSecret,
      "GOOGLE_ADS_REFRESH_TOKEN (or GOOGLE_REFRESH_TOKEN)": hasRefreshToken,
      GOOGLE_ADS_CUSTOMER_ID: hasCustomerId,
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: has("GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
    },
  };
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export async function runDiagnostics(testMode: boolean): Promise<Record<string, unknown>> {
  const has = (k: string) =>
    !!(process.env[k] && process.env[k]!.trim().length > 0);

  const rawCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID || "";
  const customerId = rawCustomerId.replace(/-/g, "");
  const customerIdDigitsOnly = /^\d+$/.test(customerId);
  const apiVersion = getApiVersion();
  const endpointUrl = customerIdDigitsOnly && customerId
    ? buildKeywordIdeasUrl(customerId)
    : `https://googleads.googleapis.com/${apiVersion}/customers/{CUSTOMER_ID}:generateKeywordIdeas`;

  const diag: Record<string, unknown> = {
    secrets: {
      GOOGLE_ADS_DEVELOPER_TOKEN: has("GOOGLE_ADS_DEVELOPER_TOKEN"),
      "GOOGLE_ADS_CUSTOMER_ID (present)": has("GOOGLE_ADS_CUSTOMER_ID"),
      "GOOGLE_ADS_CUSTOMER_ID (digits only)": customerIdDigitsOnly,
      "OAuth client ID (ADS or GOOGLE)": has("GOOGLE_ADS_CLIENT_ID") || has("GOOGLE_CLIENT_ID"),
      "OAuth client secret (ADS or GOOGLE)": has("GOOGLE_ADS_CLIENT_SECRET") || has("GOOGLE_CLIENT_SECRET"),
      "Refresh token (ADS or GOOGLE)": has("GOOGLE_ADS_REFRESH_TOKEN") || has("GOOGLE_REFRESH_TOKEN"),
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: has("GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
    },
    api_version: apiVersion,
    endpoint_url: endpointUrl,
  };

  // Try to get an access token
  try {
    await getAdsAccessToken();
    diag.access_token_generation = "success";
  } catch (e: any) {
    diag.access_token_generation = `failed: ${e.message}`;
  }

  if (!testMode) return diag;

  // Test mode: call the API with one seed keyword
  if (!has("GOOGLE_ADS_DEVELOPER_TOKEN") || !customerIdDigitsOnly || !customerId) {
    diag.test = { success: false, message: "Cannot test — missing GOOGLE_ADS_DEVELOPER_TOKEN or valid GOOGLE_ADS_CUSTOMER_ID." };
    return diag;
  }

  try {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    const accessToken = await getAdsAccessToken();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    };
    if (loginCustomerId) headers["login-customer-id"] = loginCustomerId.replace(/-/g, "");

    const body = {
      keywordSeed: { keywords: ["mercado livre de energia"] },
      geoTargetConstants: [GEO_BRAZIL],
      language: LANG_PORTUGUESE,
      keywordPlanNetwork: "GOOGLE_SEARCH",
      includeAdultKeywords: false,
    };

    const url = buildKeywordIdeasUrl(customerId);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const contentType = res.headers.get("content-type") || "";
    const bodyText = await res.text();

    if (res.ok) {
      let resultCount = 0;
      try { resultCount = JSON.parse(bodyText)?.results?.length ?? 0; } catch { /* */ }
      diag.test = { success: true, status: res.status, keyword_ideas_returned: resultCount };
    } else {
      const errMsg = parseAdsError(res.status, contentType, bodyText);
      diag.test = {
        success: false,
        status: res.status,
        content_type: contentType,
        error: errMsg,
        body_preview: bodyText.slice(0, 300),
      };
    }
  } catch (e: any) {
    diag.test = { success: false, message: e.message };
  }

  return diag;
}
