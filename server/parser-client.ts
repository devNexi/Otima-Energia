const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || '';
const PARSER_API_KEY = process.env.PARSER_API_KEY || '';
const PARSER_TIMEOUT_MS = parseInt(process.env.PARSER_TIMEOUT_MS || '120000', 10);

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

  const headers: Record<string, string> = {};
  if (PARSER_API_KEY) {
    headers['X-Parser-Key'] = PARSER_API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PARSER_TIMEOUT_MS);

  try {
    const response = await fetch(`${PARSER_SERVICE_URL}/parse`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Parser service returned ${response.status}: ${errorText}`);
    }

    const result = await response.json() as ParserResponse;
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Parser service timed out after ${PARSER_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkParserHealth(): Promise<{
  healthy: boolean;
  details?: Record<string, any>;
  error?: string;
}> {
  if (!PARSER_SERVICE_URL) {
    return { healthy: false, error: 'PARSER_SERVICE_URL not configured' };
  }

  try {
    const headers: Record<string, string> = {};
    if (PARSER_API_KEY) {
      headers['X-Parser-Key'] = PARSER_API_KEY;
    }

    const response = await fetch(`${PARSER_SERVICE_URL}/health`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { healthy: false, error: `Health check returned ${response.status}` };
    }

    const data = await response.json();
    return { healthy: data.status === 'ok', details: data };
  } catch (error: any) {
    return { healthy: false, error: error.message };
  }
}
