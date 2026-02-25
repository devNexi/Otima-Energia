const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || process.env.PARSER_BASE_URL || '';
const PARSER_API_KEY = process.env.PARSER_API_KEY || '';
const PARSER_TIMEOUT_MS = parseInt(process.env.PARSER_TIMEOUT_MS || '120000', 10);

const RETRYABLE_STATUS_CODES = [502, 503];
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

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
  if (!isPdfName && !hasPdfMagic) {
    throw new Error(`PARSER_PRE_CHECK: file "${filename}" is not a PDF (no .pdf extension and missing PDF magic bytes)`);
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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`[ParserClient] Retry attempt ${attempt}/${MAX_RETRIES} after ${RETRY_DELAY_MS}ms`);
      await sleep(RETRY_DELAY_MS);
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

    try {
      const url = `${PARSER_SERVICE_URL}/parse`;
      console.log(`[ParserClient] POST ${url} (file=${filename}, size=${fileBuffer.length}b, timeout=${PARSER_TIMEOUT_MS}ms, attempt=${attempt + 1})`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const statusCode = response.status;

        if (RETRYABLE_STATUS_CODES.includes(statusCode) && attempt < MAX_RETRIES) {
          console.warn(`[ParserClient] Retryable status ${statusCode}, will retry. Body: ${errorText.substring(0, 500)}`);
          lastError = new Error(`Parser service returned ${statusCode}: ${errorText.substring(0, 500)}`);
          continue;
        }

        throw new Error(`Parser service returned ${statusCode}: ${errorText.substring(0, 500)}`);
      }

      const rawBody = await response.text();
      let result: ParserResponse;
      try {
        result = JSON.parse(rawBody) as ParserResponse;
      } catch (jsonErr) {
        const preview = rawBody.substring(0, 500);
        console.error(`[ParserClient] FATAL: Response is not valid JSON. Status: ${response.status}. Body preview: ${preview}`);
        throw new Error(`Parser returned non-JSON response (status ${response.status}). Body preview: ${preview}`);
      }

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

      console.log(`[ParserClient] Success: docType=${result.docType}, validated=${result.validated}, confidence=${result.confidence}`);
      return result;

    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        lastError = new Error(`Parser service timed out after ${PARSER_TIMEOUT_MS}ms`);
        if (attempt < MAX_RETRIES) {
          console.warn(`[ParserClient] Timeout, will retry`);
          continue;
        }
        throw lastError;
      }
      if (attempt < MAX_RETRIES && isNetworkError(error)) {
        console.warn(`[ParserClient] Network error: ${error.message}, will retry`);
        lastError = error;
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Parser request failed after retries');
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
    diag.lastError = error.message;
    console.error(`[ParserClient] Health check FAILED: ${error.message} (${latencyMs}ms)`);
    _lastDiagnostics = diag;
    return { healthy: false, error: error.message, latencyMs };
  }
}

export async function runParserSelfTest(): Promise<{
  passed: boolean;
  steps: Array<{ name: string; passed: boolean; detail: string }>;
  rawResponse?: any;
}> {
  const steps: Array<{ name: string; passed: boolean; detail: string }> = [];

  const healthResult = await checkParserHealth();
  steps.push({
    name: 'health_check',
    passed: healthResult.healthy,
    detail: healthResult.healthy
      ? `Parser healthy: ${JSON.stringify(healthResult.details)}`
      : `Health check failed: ${healthResult.error}`,
  });

  if (!healthResult.healthy) {
    return { passed: false, steps };
  }

  const fixturePdf = createMinimalTestPdf();

  let parseResult: ParserResponse | null = null;
  try {
    parseResult = await callParserService(fixturePdf, 'self_test_bill.pdf', {
      sourceDocId: 'self-test',
    });
    steps.push({
      name: 'parse_request',
      passed: true,
      detail: `Parser returned status=${parseResult.status}, docType=${parseResult.docType}`,
    });
  } catch (err: any) {
    steps.push({
      name: 'parse_request',
      passed: false,
      detail: `Parse request failed: ${err.message}`,
    });
    return { passed: false, steps };
  }

  const hasDocType = parseResult.docType === 'BILL' || parseResult.docType === 'PRC' || parseResult.docType === 'OTHER';
  steps.push({
    name: 'doctype_valid',
    passed: hasDocType,
    detail: `docType=${parseResult.docType} (expected BILL, PRC, or OTHER)`,
  });

  const hasData = parseResult.data && typeof parseResult.data === 'object';
  steps.push({
    name: 'data_present',
    passed: !!hasData,
    detail: hasData ? `Data keys: ${Object.keys(parseResult.data).join(', ')}` : 'No data object in response',
  });

  if (parseResult.docType === 'BILL' && hasData) {
    const cnpj = parseResult.data.customerId;
    const cnpjDigits = cnpj ? String(cnpj).replace(/\D/g, '') : '';
    const cnpjValid = cnpjDigits.length === 14;
    steps.push({
      name: 'bill_customerId_cnpj',
      passed: cnpjValid,
      detail: cnpjValid
        ? `customerId is valid 14-digit CNPJ: ${cnpjDigits}`
        : `customerId "${cnpj}" is not a valid 14-digit CNPJ (got ${cnpjDigits.length} digits)`,
    });

    const amt = parseResult.data.totalAmount;
    const amtPresent = amt !== null && amt !== undefined && !isNaN(Number(amt));
    steps.push({
      name: 'bill_totalAmount_present',
      passed: amtPresent,
      detail: amtPresent
        ? `totalAmount present: ${amt}`
        : `totalAmount missing or invalid: ${JSON.stringify(amt)}`,
    });
  }

  const allPassed = steps.every(s => s.passed);
  return { passed: allPassed, steps, rawResponse: parseResult };
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
