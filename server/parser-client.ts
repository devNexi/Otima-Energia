const PARSER_SERVICE_URL = process.env.PARSER_BASE_URL || process.env.PARSER_SERVICE_URL || '';
const PARSER_API_KEY = process.env.PARSER_API_KEY || '';
const PARSER_TIMEOUT_MS = parseInt(process.env.PARSER_TIMEOUT_MS || '300000', 10);

const RETRYABLE_STATUS_CODES = [502, 503, 504];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

export interface ParserResponse {
  status: 'parsed' | 'failed';
  docType: 'PRC' | 'BILL' | 'OTHER';
  confidence: number;
  validated: boolean;
  data: Record<string, any>;
  rows: Array<Record<string, any>>;
  warnings: string[];
  debug: {
    textSource: string;
    pages: number;
    timingsMs: Record<string, number>;
    rawPdfText?: string;
    rawOcrText?: string;
    chosenText?: string;
    classifierScores?: Record<string, any>;
    extractionDetails?: Record<string, any>;
  };
}

export function isParserServiceConfigured(): boolean {
  return !!PARSER_SERVICE_URL;
}

function validateFileBeforeSend(fileBuffer: Buffer, filename: string): void {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('PARSER_PRE_CHECK: file buffer is empty (0 bytes)');
  }
  const lowerName = filename.toLowerCase();
  const isPdfName = lowerName.endsWith('.pdf');
  const hasPdfMagic = fileBuffer.length >= 5 && fileBuffer.subarray(0, 5).toString('ascii') === '%PDF-';
  const isImage = /\.(png|jpg|jpeg|tiff|tif|bmp|webp)$/.test(lowerName);
  if (!isPdfName && !hasPdfMagic && !isImage) {
    throw new Error(`PARSER_PRE_CHECK: file "${filename}" is not a supported format (PDF or image required)`);
  }
}

function normalizeCnpj(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 14) return digits;
  if (digits.length > 14) return digits.substring(0, 14);
  return digits || null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const PARSER_DATA_FIELDS = [
  'customerName', 'customerCnpj', 'customerId', 'cnpj',
  'distributor', 'referenceMonth', 'dueDate', 'totalAmount',
  'totalEnergyKwh', 'tariffGroup', 'invoiceKey', 'ucCode', 'uc',
  'ucNumber', 'installation', 'unidadeConsumidora',
  'endereco', 'address', 'modalidade', 'modality',
  'tariffModality', 'consumoPonta', 'consumoPontaKwh',
  'consumoForaPonta', 'consumoForaPontaKwh', 'demandaContratada',
  'demandaContratadaKw', 'demandaMedida', 'demandaMedidaKw',
  'consumption', 'consumptionPeriod', 'grupo', 'subgrupo',
  'groupSubgroup', 'docKind',
  'fieldConfidence', 'fieldReasons',
];

const PARSER_META_FIELDS = new Set([
  'status', 'docType', 'doc_type', 'confidence', 'validated',
  'data', 'rows', 'warnings', 'debug', 'error', 'message',
]);

function normalizeParserResponse(raw: any): ParserResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      status: 'failed',
      docType: 'OTHER',
      confidence: 0,
      validated: false,
      data: {},
      rows: [],
      warnings: ['Parser returned empty or non-object response'],
      debug: { textSource: 'unknown', pages: 0, timingsMs: {} },
    };
  }

  const isAlreadyWrapped = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
    && (raw.status === 'parsed' || raw.status === 'failed');

  if (isAlreadyWrapped) {
    const r = raw as ParserResponse;
    if (r.validated === undefined) {
      r.validated = r.status === 'parsed';
    }
    return r;
  }

  const rawStatus = (raw.status || '').toString().toLowerCase();
  const isSuccess = rawStatus === 'success' || rawStatus === 'parsed' || rawStatus === 'ok';
  const isExplicitFail = rawStatus === 'failed' || rawStatus === 'error';

  const data: Record<string, any> = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
    ? { ...raw.data }
    : {};

  for (const field of PARSER_DATA_FIELDS) {
    if (raw[field] !== undefined && data[field] === undefined) {
      data[field] = raw[field];
    }
  }
  for (const key of Object.keys(raw)) {
    if (!PARSER_META_FIELDS.has(key) && data[key] === undefined) {
      data[key] = raw[key];
    }
  }

  if (data.customerCnpj && !data.customerId) {
    data.customerId = data.customerCnpj;
  }
  if (data.cnpj && !data.customerId) {
    data.customerId = data.cnpj;
  }

  if (data.ucNumber && !data.ucCode) {
    data.ucCode = data.ucNumber;
  }
  if (data.installation && !data.ucCode) {
    data.ucCode = data.installation;
  }

  if (data.groupSubgroup && !data.tariffGroup) {
    data.tariffGroup = data.groupSubgroup;
  }

  if (data.modality && !data.modalidade) {
    data.modalidade = data.modality;
  }

  if (data.consumption != null && !data.totalEnergyKwh) {
    data.totalEnergyKwh = data.consumption;
  }

  if (data.consumptionPeriod && !data.referenceMonth) {
    const periodStr = String(data.consumptionPeriod);
    const dateMatch = periodStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      const endMonth = dateMatch[5];
      const endYear = dateMatch[6];
      data.referenceMonth = `${endYear}-${endMonth}`;
    }
  }

  const extractedFieldCount = Object.keys(data).filter(k => data[k] != null && data[k] !== '').length;

  let confidence = typeof raw.confidence === 'number'
    ? raw.confidence
    : (extractedFieldCount >= 5 ? 0.85 : extractedFieldCount >= 3 ? 0.6 : extractedFieldCount >= 1 ? 0.4 : 0);

  const hasMinimumData = extractedFieldCount >= 1;
  const validated = raw.validated !== undefined
    ? !!raw.validated
    : (isSuccess || (!isExplicitFail && hasMinimumData));

  const docType = raw.docType || raw.doc_type || 'BILL';

  const debug = raw.debug || {
    textSource: raw.textSource || 'unknown',
    pages: raw.pages || 0,
    timingsMs: raw.timingsMs || {},
    chosenText: raw.chosenText || raw.rawText || undefined,
  };

  const warnings: string[] = Array.isArray(raw.warnings)
    ? raw.warnings
    : (raw.error ? [raw.error] : (raw.message && !isSuccess ? [raw.message] : []));

  console.log(`[ParserClient] Normalized response: rawStatus="${rawStatus}" → validated=${validated}, extractedFields=${extractedFieldCount}, confidence=${confidence}, isWrapped=${isAlreadyWrapped}`);

  return {
    status: validated ? 'parsed' : 'failed',
    docType: docType as ParserResponse['docType'],
    confidence,
    validated,
    data,
    rows: Array.isArray(raw.rows) ? raw.rows : [],
    warnings,
    debug,
  };
}

export async function callParserService(
  fileBuffer: Buffer,
  filename: string,
  options: {
    sourceDocId?: string;
    hintSupplier?: string;
    hintDocType?: string;
  } = {}
): Promise<ParserResponse> {
  if (!PARSER_SERVICE_URL) {
    throw new Error('PARSER_SERVICE_URL is not configured');
  }
  if (!PARSER_API_KEY) {
    throw new Error('PARSER_API_KEY is not configured — refusing to call parser without auth');
  }

  validateFileBeforeSend(fileBuffer, filename);

  let lastError: Error | null = null;
  let nextRetryDelayMs = RETRY_DELAY_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`[ParserClient] Retry attempt ${attempt}/${MAX_RETRIES} after ${nextRetryDelayMs}ms`);
      await sleep(nextRetryDelayMs);
      nextRetryDelayMs = RETRY_DELAY_MS;
    }

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, filename);

    if (options.sourceDocId) {
      formData.append('source_doc_id', options.sourceDocId);
    }
    if (options.hintSupplier) {
      formData.append('hint_supplier', options.hintSupplier);
    }
    if (options.hintDocType) {
      formData.append('hint_doc_type', options.hintDocType);
    }

    const headers: Record<string, string> = {
      'X-Parser-Key': PARSER_API_KEY,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PARSER_TIMEOUT_MS);
    const forceType = options.hintDocType === 'PRC' ? 'PRC' : 'BILL';
    const url = `${PARSER_SERVICE_URL}/parse?force=${forceType}`;

    try {
      const startMs = Date.now();
      console.log(`[ParserClient] POST ${url} (file=${filename}, size=${fileBuffer.length}b, timeout=${PARSER_TIMEOUT_MS}ms, attempt=${attempt + 1})`);

      const progressTimer = setInterval(() => {
        const elapsed = Math.round((Date.now() - startMs) / 1000);
        console.log(`[ParserClient] ⏳ Parse in progress... ${elapsed}s elapsed (timeout=${Math.round(PARSER_TIMEOUT_MS/1000)}s)`);
      }, 30000);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearInterval(progressTimer);
      }

      const responseMs = Date.now() - startMs;
      console.log(`[ParserClient] Response received in ${responseMs}ms, status=${response.status}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const statusCode = response.status;

        if (RETRYABLE_STATUS_CODES.includes(statusCode) && attempt < MAX_RETRIES) {
          nextRetryDelayMs = statusCode === 504 ? 10000 : RETRY_DELAY_MS;
          console.warn(`[ParserClient] Retryable status ${statusCode}, will retry in ${nextRetryDelayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES}). Body: ${errorText.substring(0, 200)}`);
          lastError = new Error(`Parser service returned ${statusCode}: ${errorText.substring(0, 500)}`);
          continue;
        }

        throw new Error(`Parser service returned ${statusCode}: ${errorText.substring(0, 500)}`);
      }

      const rawBody = await response.text();
      let raw: any;
      try {
        raw = JSON.parse(rawBody);
      } catch (jsonErr) {
        const preview = rawBody.substring(0, 500);
        console.error(`[ParserClient] FATAL: Response is not valid JSON. Status: ${response.status}. Body preview: ${preview}`);
        throw new Error(`Parser returned non-JSON response (status ${response.status}). Body preview: ${preview}`);
      }

      const result = normalizeParserResponse(raw);

      if (result.data?.customerId) {
        result.data.customerId = normalizeCnpj(result.data.customerId);
      }
      if (result.data?.invoiceKey && !result.data.customerId) {
        const invoiceDigits = (result.data.invoiceKey as string).replace(/\D/g, '');
        if (invoiceDigits.length >= 14) {
          result.data.customerId = invoiceDigits.substring(0, 14);
          console.log(`[ParserClient] Derived customerId (CNPJ) from invoiceKey: ${result.data.customerId}`);
        }
      }

      console.log(`[ParserClient] Success: docType=${result.docType}, validated=${result.validated}, confidence=${result.confidence}, dataKeys=${Object.keys(result.data || {}).join(',')}`);
      return result;

    } catch (error: any) {
      clearTimeout(timeout);
      const detailedMsg = buildDetailedErrorMessage(error, url);
      console.error(`[ParserClient] Request failed (attempt ${attempt + 1}): ${detailedMsg}`);

      if (error.name === 'AbortError') {
        lastError = new Error(`PARSER_TIMEOUT: timed out after ${PARSER_TIMEOUT_MS}ms calling ${url}`);
        if (attempt < MAX_RETRIES) {
          console.warn(`[ParserClient] Timeout, will retry`);
          continue;
        }
        throw lastError;
      }
      if (attempt < MAX_RETRIES && isNetworkError(error)) {
        console.warn(`[ParserClient] Network error, will retry: ${detailedMsg}`);
        lastError = new Error(detailedMsg);
        continue;
      }
      throw new Error(detailedMsg);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Parser request failed after retries');
}

function buildDetailedErrorMessage(error: any, url: string): string {
  const parts: string[] = [];
  
  if (error.code) {
    const codeMap: Record<string, string> = {
      'ECONNREFUSED': 'CONNECTION_REFUSED',
      'ECONNRESET': 'CONNECTION_RESET',
      'ETIMEDOUT': 'CONNECT_TIMEOUT',
      'ENOTFOUND': 'DNS_RESOLUTION_FAILED',
      'DEPTH_ZERO_SELF_SIGNED_CERT': 'TLS_SELF_SIGNED_CERT',
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE': 'TLS_CERT_INVALID',
      'CERT_HAS_EXPIRED': 'TLS_CERT_EXPIRED',
      'ERR_TLS_CERT_ALTNAME_INVALID': 'TLS_HOSTNAME_MISMATCH',
    };
    parts.push(codeMap[error.code] || error.code);
  }

  parts.push(error.message || 'Unknown error');
  parts.push(`url=${url}`);

  if (error.cause) {
    const cause = error.cause;
    if (cause.code) parts.push(`cause.code=${cause.code}`);
    if (cause.message && cause.message !== error.message) parts.push(`cause=${cause.message}`);
    if (cause.cause) {
      const innerCause = cause.cause;
      if (innerCause.code) parts.push(`inner.code=${innerCause.code}`);
      if (innerCause.message) parts.push(`inner=${innerCause.message}`);
    }
  }

  if (error.errno) parts.push(`errno=${error.errno}`);

  return parts.join(' | ');
}

function isNetworkError(error: any): boolean {
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('socket hang up')
  );
}

export interface ParserDiagnostics {
  parserBaseUrl: string;
  configured: boolean;
  apiKeySet: boolean;
  lastHealthStatus: 'ok' | 'degraded' | 'error' | 'unreachable' | 'not_configured';
  lastError: string | null;
  lastLatencyMs: number | null;
  parserVersion: string | null;
  ocrAvailable: boolean | null;
  healthResponseBody: Record<string, any> | null;
  httpStatus: number | null;
  checkedAt: string;
}

let _lastDiagnostics: ParserDiagnostics | null = null;

export function getLastDiagnostics(): ParserDiagnostics | null {
  return _lastDiagnostics;
}

export async function checkParserHealth(): Promise<{
  healthy: boolean;
  details?: Record<string, any>;
  error?: string;
  latencyMs?: number;
}> {
  const diag: ParserDiagnostics = {
    parserBaseUrl: PARSER_SERVICE_URL || '(not set)',
    configured: !!PARSER_SERVICE_URL,
    apiKeySet: !!PARSER_API_KEY,
    lastHealthStatus: 'not_configured',
    lastError: null,
    lastLatencyMs: null,
    parserVersion: null,
    ocrAvailable: null,
    healthResponseBody: null,
    httpStatus: null,
    checkedAt: new Date().toISOString(),
  };

  if (!PARSER_SERVICE_URL) {
    diag.lastError = 'PARSER_SERVICE_URL not configured';
    _lastDiagnostics = diag;
    return { healthy: false, error: diag.lastError };
  }
  if (!PARSER_API_KEY) {
    diag.lastError = 'PARSER_API_KEY not configured';
    _lastDiagnostics = diag;
    return { healthy: false, error: diag.lastError };
  }

  const url = `${PARSER_SERVICE_URL}/health`;
  const startMs = Date.now();

  try {
    console.log(`[ParserClient] Health check: GET ${url}`);

    const response = await fetch(url, {
      headers: { 'X-Parser-Key': PARSER_API_KEY },
      signal: AbortSignal.timeout(15000),
    });

    const latencyMs = Date.now() - startMs;
    diag.lastLatencyMs = latencyMs;
    diag.httpStatus = response.status;

    const rawBody = await response.text();
    console.log(`[ParserClient] Health response: status=${response.status}, latency=${latencyMs}ms, body=${rawBody.substring(0, 500)}`);

    let data: Record<string, any>;
    try {
      data = JSON.parse(rawBody);
    } catch {
      diag.lastHealthStatus = 'error';
      diag.lastError = `Health endpoint returned non-JSON (HTTP ${response.status}): ${rawBody.substring(0, 500)}`;
      _lastDiagnostics = diag;
      return { healthy: false, error: diag.lastError, latencyMs };
    }

    diag.healthResponseBody = data;
    diag.parserVersion = data.version || null;
    diag.ocrAvailable = data.ocr_available ?? null;

    if (!response.ok) {
      diag.lastHealthStatus = 'error';
      diag.lastError = `Health check returned HTTP ${response.status}`;
      _lastDiagnostics = diag;
      return { healthy: false, error: diag.lastError, latencyMs };
    }

    if (data.status === 'ok') {
      if (data.ocr_available === false) {
        diag.lastHealthStatus = 'degraded';
        console.warn(`[ParserClient] Parser ONLINE but OCR degraded (ocr_available=false)`);
      } else {
        diag.lastHealthStatus = 'ok';
        console.log(`[ParserClient] Parser ONLINE: version=${data.version}, ocr=${data.ocr_available}, latency=${latencyMs}ms`);
      }
      _lastDiagnostics = diag;
      return { healthy: true, details: data, latencyMs };
    } else {
      diag.lastHealthStatus = 'error';
      diag.lastError = `Health returned status="${data.status}" (expected "ok")`;
      _lastDiagnostics = diag;
      return { healthy: false, error: diag.lastError, details: data, latencyMs };
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startMs;
    diag.lastLatencyMs = latencyMs;
    diag.lastHealthStatus = 'unreachable';
    const detailedError = buildDetailedErrorMessage(error, url);
    diag.lastError = detailedError;
    console.error(`[ParserClient] Health check FAILED: ${detailedError} (${latencyMs}ms)`);
    _lastDiagnostics = diag;
    return { healthy: false, error: detailedError, latencyMs };
  }
}

export interface FullDiagnostics {
  parserBaseUrl: string;
  timestamp: string;
  runtime: string;
  health: {
    ok: boolean;
    httpStatus: number | null;
    latencyMs: number | null;
    bodySnippet: string | null;
    error: string | null;
    json: Record<string, any> | null;
  };
  parse: {
    ok: boolean;
    httpStatus: number | null;
    latencyMs: number | null;
    docType: string | null;
    extractedFields: Record<string, any> | null;
    error: string | null;
    fixtureFile: string;
  };
}

async function loadFixturePdf(): Promise<Buffer> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const url = await import('url');
    const thisDir = path.dirname(url.fileURLToPath(import.meta.url));
    const fixturePath = path.join(thisDir, 'fixtures', 'test-bill.pdf');
    return fs.readFileSync(fixturePath);
  } catch {
    return createMinimalTestPdf();
  }
}

export async function runFullDiagnostics(): Promise<FullDiagnostics> {
  const startTime = new Date();
  const result: FullDiagnostics = {
    parserBaseUrl: PARSER_SERVICE_URL || '(not set)',
    timestamp: startTime.toISOString(),
    runtime: `Node ${process.version}`,
    health: { ok: false, httpStatus: null, latencyMs: null, bodySnippet: null, error: null, json: null },
    parse: { ok: false, httpStatus: null, latencyMs: null, docType: null, extractedFields: null, error: null, fixtureFile: 'test-bill.pdf' },
  };

  console.log(`[ParserDiag] Running full diagnostics against ${result.parserBaseUrl}`);

  const healthResult = await checkParserHealth();
  const diag = getLastDiagnostics();
  result.health.ok = healthResult.healthy;
  result.health.httpStatus = diag?.httpStatus ?? null;
  result.health.latencyMs = healthResult.latencyMs ?? null;
  result.health.json = diag?.healthResponseBody ?? null;
  result.health.error = healthResult.error ?? null;
  if (!diag?.healthResponseBody && diag?.lastError) {
    result.health.bodySnippet = diag.lastError.substring(0, 500);
  }

  console.log(`[ParserDiag] Health: ok=${result.health.ok}, status=${result.health.httpStatus}, latency=${result.health.latencyMs}ms`);

  if (!healthResult.healthy) {
    console.log(`[ParserDiag] Skipping parse test — health check failed: ${result.health.error}`);
    return result;
  }

  const fixturePdf = await loadFixturePdf();
  const parseStart = Date.now();
  try {
    const parseResponse = await callParserService(fixturePdf, 'diag_test_bill.pdf', {
      sourceDocId: 'diagnostics-test',
      hintDocType: 'BILL',
    });
    const parseLatency = Date.now() - parseStart;
    result.parse.ok = parseResponse.status === 'parsed' || parseResponse.validated === true;
    result.parse.httpStatus = 200;
    result.parse.latencyMs = parseLatency;
    result.parse.docType = parseResponse.docType;
    result.parse.extractedFields = parseResponse.data ? {
      distributor: parseResponse.data.distributor || null,
      referenceMonth: parseResponse.data.referenceMonth || null,
      totalAmount: parseResponse.data.totalAmount || null,
      totalEnergyKwh: parseResponse.data.totalEnergyKwh || null,
      customerName: parseResponse.data.customerName || null,
      customerId: parseResponse.data.customerId || null,
      tariffGroup: parseResponse.data.tariffGroup || null,
    } : null;

    console.log(`[ParserDiag] Parse: ok=${result.parse.ok}, docType=${result.parse.docType}, latency=${parseLatency}ms, fields=${JSON.stringify(result.parse.extractedFields)}`);
  } catch (err: any) {
    const parseLatency = Date.now() - parseStart;
    result.parse.latencyMs = parseLatency;
    result.parse.error = err.message;
    console.error(`[ParserDiag] Parse FAILED: ${err.message} (${parseLatency}ms)`);
  }

  return result;
}

export async function runParserSelfTest(): Promise<{
  passed: boolean;
  steps: Array<{ name: string; passed: boolean; detail: string }>;
  rawResponse?: any;
}> {
  const diag = await runFullDiagnostics();
  const steps: Array<{ name: string; passed: boolean; detail: string }> = [];

  steps.push({
    name: 'health_check',
    passed: diag.health.ok,
    detail: diag.health.ok
      ? `Parser healthy: HTTP ${diag.health.httpStatus}, ${diag.health.latencyMs}ms`
      : `Health failed: ${diag.health.error}`,
  });

  if (!diag.health.ok) return { passed: false, steps };

  steps.push({
    name: 'parse_request',
    passed: diag.parse.ok,
    detail: diag.parse.ok
      ? `Parse OK: docType=${diag.parse.docType}, ${diag.parse.latencyMs}ms`
      : `Parse failed: ${diag.parse.error}`,
  });

  if (diag.parse.extractedFields) {
    const fields = diag.parse.extractedFields;
    const fieldNames = Object.entries(fields).filter(([, v]) => v != null).map(([k]) => k);
    steps.push({
      name: 'extracted_fields',
      passed: fieldNames.length > 0,
      detail: fieldNames.length > 0 ? `Extracted: ${fieldNames.join(', ')}` : 'No fields extracted',
    });
  }

  return { passed: steps.every(s => s.passed), steps };
}

function createMinimalTestPdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (Self-test PDF) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000360 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
441
%%EOF`;
  return Buffer.from(content, 'ascii');
}
