import Tesseract from 'tesseract.js';
import { storage } from './storage';

async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  const pdfParseModule = await import('pdf-parse');
  const pdfParse = pdfParseModule.default || pdfParseModule;
  return pdfParse(buffer);
}

export interface ParsedPrcRow {
  submarket: string;
  productType: string;
  termMonths: number | null;
  priceRPerMWh: string;
  volumeMwm: string | null;
  validFrom: string | null;
  validUntil: string | null;
  rawText: string;
  confidence: number;
  isOutlierFlag: boolean;
  outlierReason: string | null;
}

export interface PrcParseResult {
  success: boolean;
  rows: ParsedPrcRow[];
  parseMethod: 'text' | 'ocr' | 'manual';
  confidence: number;
  errors: string[];
  warnings: string[];
  rawExtractedText: string;
}

const SUBMARKETS = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE', 'SE/CO', 'S', 'N'];
const PRODUCT_TYPES = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100', 'I0', 'I50', 'I100', 'CONV'];
const PRICE_MIN_R_MWH = 50;
const PRICE_MAX_R_MWH = 1000;
const PRICE_OUTLIER_Z_THRESHOLD = 2.5;
const PARSE_TIMEOUT_MS = 120_000;

const TABLE_COLUMN_KEYWORDS = [
  'submercado', 'preço', 'valor', 'r$/mwh', 'mwh', 'convencional',
  'incentivada', 'i0', 'i50', 'i100', 'prazo', 'vigência', 'desconto',
  'tarifa', 'te', 'tusd', 'ponta', 'fora ponta', 'demanda', 'grupo',
  'subgrupo', 'modalidade', 'tensão', 'bandeira', 'encargos', 'icms', 'pis', 'cofins'
];

const COLUMN_SYNONYMS: Record<string, string[]> = {
  submarket: ['submercado', 'sub-mercado', 'mercado', 'region', 'regiao', 'região'],
  productType: ['produto', 'tipo', 'product', 'convencional', 'incentivada', 'modalidade', 'fonte', 'tipo energia'],
  termMonths: ['prazo', 'term', 'meses', 'vigencia', 'vigência', 'contrato', 'duração', 'duracao'],
  priceRPerMWh: ['preco', 'preço', 'price', 'valor', 'r$/mwh', 'rs/mwh', 'tarifa', 'custo'],
  grupo: ['grupo', 'group'],
  subgrupo: ['subgrupo', 'sub-grupo', 'subgroup'],
  modalidade: ['modalidade', 'modality'],
  tensao: ['tensao', 'tensão', 'voltage'],
  teValue: ['te', 'tarifa energia', 'tarifa de energia'],
  tusdValue: ['tusd', 'tarifa uso', 'tarifa de uso'],
  desconto: ['desconto', 'discount', 'desc'],
  demandCharge: ['demanda', 'demand', 'demanda contratada'],
};

const EXACT_COLUMN_MAP: Record<string, string> = {};
for (const [canonical, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
  for (const syn of synonyms) {
    EXACT_COLUMN_MAP[syn] = canonical;
  }
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchColumn(header: string): string | null {
  const normalized = removeAccents(header.toLowerCase().trim());
  if (EXACT_COLUMN_MAP[normalized]) return EXACT_COLUMN_MAP[normalized];

  const normalizedNoAccent = removeAccents(normalized);
  for (const [key, val] of Object.entries(EXACT_COLUMN_MAP)) {
    if (removeAccents(key) === normalizedNoAccent) return val;
  }

  const tokens = normalizedNoAccent.split(/[\s\/\-_]+/);
  for (const token of tokens) {
    if (token.length < 2) continue;
    for (const [key, val] of Object.entries(EXACT_COLUMN_MAP)) {
      const keyNorm = removeAccents(key);
      if (keyNorm === token || keyNorm.includes(token) || token.includes(keyNorm)) {
        return val;
      }
    }
  }

  return null;
}

function normalizeSubmarket(raw: string): string {
  const cleaned = raw.toUpperCase().trim();
  const mappings: Record<string, string> = {
    'SE/CO': 'SECO',
    'SE': 'SECO',
    'CO': 'SECO',
    'S': 'SUL',
    'N': 'NORTE',
  };
  return mappings[cleaned] || cleaned;
}

function normalizeProductType(raw: string): string {
  const cleaned = raw.toUpperCase().trim();
  const mappings: Record<string, string> = {
    'CONV': 'CONVENCIONAL',
    'CONVENTIONAL': 'CONVENCIONAL',
    'I0': 'INC_I0',
    'I50': 'INC_I50',
    'I100': 'INC_I100',
    '0%': 'INC_I0',
    '50%': 'INC_I50',
    '100%': 'INC_I100',
  };
  return mappings[cleaned] || cleaned;
}

function extractPrice(text: string): number | null {
  const patterns = [
    /R\$\s*([\d.,]+)/i,
    /([\d.,]+)\s*R\$/i,
    /([\d.,]+)\s*(?:R\$|BRL|\/MWh)/i,
    /(?:pre[çc]o|price|valor)[:\s]*([\d.,]+)/i,
    /([\d]{2,3}[,.][\d]{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace('.', '').replace(',', '.');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price >= PRICE_MIN_R_MWH && price <= PRICE_MAX_R_MWH) {
        return price;
      }
    }
  }
  return null;
}

function extractTerm(text: string): number | null {
  const patterns = [
    /(\d+)\s*(?:meses|months|m)/i,
    /(?:prazo|term|contrato)[:\s]*(\d+)/i,
    /(\d+)\s*(?:anos?|years?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let term = parseInt(match[1]);
      if (text.match(/anos?|years?/i)) {
        term = term * 12;
      }
      if (term >= 1 && term <= 120) {
        return term;
      }
    }
  }
  return null;
}

function extractVolume(text: string): string | null {
  const patterns = [
    /([\d.,]+)\s*(?:MWm|MW\s*m[eé]dio)/i,
    /(?:volume|carga)[:\s]*([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(',', '.');
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function countNumericValues(line: string): number {
  const matches = line.match(/\d+[.,]?\d*/g);
  return matches ? matches.length : 0;
}

function isHeaderLine(line: string): boolean {
  const lower = removeAccents(line.toLowerCase());
  let matchCount = 0;
  for (const kw of TABLE_COLUMN_KEYWORDS) {
    if (lower.includes(removeAccents(kw))) {
      matchCount++;
    }
  }
  return matchCount >= 2;
}

interface TextBlock {
  lines: string[];
  startIndex: number;
}

function splitIntoBlocks(text: string): TextBlock[] {
  const allLines = text.split('\n');
  const blocks: TextBlock[] = [];
  let currentBlock: string[] = [];
  let blockStart = 0;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();
    if (line.length === 0) {
      if (currentBlock.length > 0) {
        blocks.push({ lines: currentBlock, startIndex: blockStart });
        currentBlock = [];
      }
      blockStart = i + 1;
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push({ lines: currentBlock, startIndex: blockStart });
  }
  return blocks;
}

function isTableCandidateBlock(block: TextBlock): boolean {
  let linesWithMultipleNums = 0;
  for (const line of block.lines) {
    if (countNumericValues(line) >= 2) {
      linesWithMultipleNums++;
    }
  }
  return linesWithMultipleNums >= 2;
}

function detectHeaderColumns(headerLine: string): { field: string; startPos: number }[] {
  const columns: { field: string; startPos: number }[] = [];
  const lowerLine = removeAccents(headerLine.toLowerCase());
  const tokens = lowerLine.split(/\s{2,}|\t/);

  let pos = 0;
  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed.length > 0) {
      const mapped = matchColumn(trimmed);
      if (mapped) {
        columns.push({ field: mapped, startPos: pos });
      }
    }
    pos += token.length + 2;
  }

  return columns;
}

function parseTableRow(line: string): ParsedPrcRow | null {
  let submarket: string | null = null;
  let productType: string | null = null;

  for (const sm of SUBMARKETS) {
    if (line.toUpperCase().includes(sm)) {
      submarket = normalizeSubmarket(sm);
      break;
    }
  }

  for (const pt of PRODUCT_TYPES) {
    if (line.toUpperCase().includes(pt)) {
      productType = normalizeProductType(pt);
      break;
    }
  }

  const price = extractPrice(line);

  if (!submarket && !productType && !price) {
    return null;
  }

  const term = extractTerm(line);
  const volume = extractVolume(line);

  const baseConfidence =
    (submarket ? 0.3 : 0) +
    (productType ? 0.25 : 0) +
    (price ? 0.35 : 0) +
    (term ? 0.1 : 0);

  return {
    submarket: submarket || 'UNKNOWN',
    productType: productType || 'CONVENCIONAL',
    termMonths: term,
    priceRPerMWh: price?.toFixed(2) || '0.00',
    volumeMwm: volume,
    validFrom: extractDate(line),
    validUntil: null,
    rawText: line.substring(0, 500),
    confidence: baseConfidence,
    isOutlierFlag: false,
    outlierReason: null,
  };
}

function extractRowsFromTableBlock(block: TextBlock): ParsedPrcRow[] {
  const rows: ParsedPrcRow[] = [];
  let headerIdx = -1;
  let _headerColumns: { field: string; startPos: number }[] = [];

  for (let i = 0; i < block.lines.length; i++) {
    if (isHeaderLine(block.lines[i])) {
      headerIdx = i;
      _headerColumns = detectHeaderColumns(block.lines[i]);
      break;
    }
  }

  const dataStartIdx = headerIdx >= 0 ? headerIdx + 1 : 0;

  for (let i = dataStartIdx; i < block.lines.length; i++) {
    const line = block.lines[i];
    if (countNumericValues(line) >= 1) {
      const row = parseTableRow(line);
      if (row && parseFloat(row.priceRPerMWh) > 0) {
        rows.push(row);
      }
    }
  }

  return rows;
}

function detectOutliers(rows: ParsedPrcRow[]): void {
  if (rows.length < 3) return;

  const pricesByGroup: Record<string, number[]> = {};

  for (const row of rows) {
    const key = `${row.submarket}|${row.productType}`;
    if (!pricesByGroup[key]) pricesByGroup[key] = [];
    pricesByGroup[key].push(parseFloat(row.priceRPerMWh));
  }

  for (const row of rows) {
    const key = `${row.submarket}|${row.productType}`;
    const groupPrices = pricesByGroup[key];

    if (groupPrices.length < 3) continue;

    const mean = groupPrices.reduce((a, b) => a + b, 0) / groupPrices.length;
    const stdDev = Math.sqrt(
      groupPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / groupPrices.length
    );

    if (stdDev === 0) continue;

    const price = parseFloat(row.priceRPerMWh);
    const zScore = Math.abs((price - mean) / stdDev);

    if (zScore > PRICE_OUTLIER_Z_THRESHOLD) {
      row.isOutlierFlag = true;
      row.outlierReason = `Z-score ${zScore.toFixed(2)} exceeds threshold (${PRICE_OUTLIER_Z_THRESHOLD}). Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`;
      row.confidence *= 0.5;
    }

    if (price < PRICE_MIN_R_MWH || price > PRICE_MAX_R_MWH) {
      row.isOutlierFlag = true;
      row.outlierReason = `Price ${price} R$/MWh outside expected range (${PRICE_MIN_R_MWH}-${PRICE_MAX_R_MWH})`;
      row.confidence *= 0.5;
    }
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  cleanRows: ParsedPrcRow[];
}

function validateRows(rows: ParsedPrcRow[]): ValidationResult {
  const errors: string[] = [];
  const cleanRows: ParsedPrcRow[] = [];
  let failedCount = 0;

  const seen = new Set<string>();

  for (const row of rows) {
    const rowErrors: string[] = [];
    const price = parseFloat(row.priceRPerMWh);

    if (price < 0) {
      rowErrors.push(`Negative tariff value: ${price}`);
    }

    if (price > 0 && (price < PRICE_MIN_R_MWH || price > PRICE_MAX_R_MWH)) {
      rowErrors.push(`Price ${price} outside reasonable range (${PRICE_MIN_R_MWH}-${PRICE_MAX_R_MWH} R$/MWh)`);
    }

    const hasSubmarketAndPrice = row.submarket !== 'UNKNOWN' && price > 0;
    const hasProductAndPrice = row.productType !== 'CONVENCIONAL' && price > 0;
    if (!hasSubmarketAndPrice && !hasProductAndPrice) {
      rowErrors.push(`Missing required fields: need submarket+price or productType+price`);
    }

    const dedupeKey = `${row.submarket}|${row.productType}|${row.termMonths}|${row.priceRPerMWh}`;
    if (seen.has(dedupeKey)) {
      rowErrors.push(`Duplicate row: ${dedupeKey}`);
      failedCount++;
      continue;
    }
    seen.add(dedupeKey);

    if (rowErrors.length > 0) {
      failedCount++;
      errors.push(...rowErrors.map(e => `Row [${row.submarket}/${row.productType}]: ${e}`));
    } else {
      cleanRows.push(row);
    }
  }

  const totalRows = rows.length;
  const failRate = totalRows > 0 ? failedCount / totalRows : 0;

  return {
    valid: failRate <= 0.5,
    errors,
    cleanRows,
  };
}

export async function parsePrcDocument(pdfBuffer: Buffer): Promise<PrcParseResult> {
  const result: PrcParseResult = {
    success: false,
    rows: [],
    parseMethod: 'text',
    confidence: 0,
    errors: [],
    warnings: [],
    rawExtractedText: '',
  };

  try {
    const pdfData = await parsePdf(pdfBuffer);
    const text = pdfData.text;
    result.rawExtractedText = text || '';

    if (!text || text.trim().length < 50) {
      result.warnings.push('PDF text extraction yielded minimal content, attempting OCR fallback');
      return result;
    }

    const blocks = splitIntoBlocks(text);
    const tableCandidates = blocks.filter(isTableCandidateBlock);

    if (tableCandidates.length > 0) {
      for (const block of tableCandidates) {
        const blockRows = extractRowsFromTableBlock(block);
        result.rows.push(...blockRows);
      }
    }

    if (result.rows.length === 0) {
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
      for (const line of lines) {
        const row = parseTableRow(line);
        if (row && parseFloat(row.priceRPerMWh) > 0) {
          result.rows.push(row);
        }
      }
    }

    if (result.rows.length === 0) {
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
      const combinedLines: string[] = [];
      for (let i = 0; i < lines.length - 1; i++) {
        combinedLines.push(lines[i] + ' ' + lines[i + 1]);
      }
      for (const line of combinedLines) {
        const row = parseTableRow(line);
        if (row && parseFloat(row.priceRPerMWh) > 0) {
          result.rows.push(row);
        }
      }
    }

    if (result.rows.length > 0) {
      detectOutliers(result.rows);
      result.success = true;
      result.parseMethod = 'text';
      result.confidence = result.rows.reduce((sum, r) => sum + r.confidence, 0) / result.rows.length;

      const outlierCount = result.rows.filter(r => r.isOutlierFlag).length;
      if (outlierCount > 0) {
        result.warnings.push(`${outlierCount} row(s) flagged as potential outliers for review`);
      }
    } else {
      result.warnings.push('No pricing data extracted from PDF text');
    }
  } catch (error: any) {
    result.errors.push(`PDF parsing error: ${error.message}`);
  }

  return result;
}

export async function parsePrcDocumentWithOcr(imageBuffer: Buffer): Promise<PrcParseResult> {
  const result: PrcParseResult = {
    success: false,
    rows: [],
    parseMethod: 'ocr',
    confidence: 0,
    errors: [],
    warnings: [],
    rawExtractedText: '',
  };

  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'por+eng', {
      logger: () => {},
    });

    result.rawExtractedText = text || '';

    if (!text || text.trim().length < 30) {
      result.errors.push('OCR produced minimal output');
      return result;
    }

    const blocks = splitIntoBlocks(text);
    const tableCandidates = blocks.filter(isTableCandidateBlock);

    if (tableCandidates.length > 0) {
      for (const block of tableCandidates) {
        const blockRows = extractRowsFromTableBlock(block);
        for (const row of blockRows) {
          row.confidence *= 0.8;
        }
        result.rows.push(...blockRows);
      }
    }

    if (result.rows.length === 0) {
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
      for (const line of lines) {
        const row = parseTableRow(line);
        if (row && parseFloat(row.priceRPerMWh) > 0) {
          row.confidence *= 0.8;
          result.rows.push(row);
        }
      }
    }

    if (result.rows.length > 0) {
      detectOutliers(result.rows);
      result.success = true;
      result.confidence = result.rows.reduce((sum, r) => sum + r.confidence, 0) / result.rows.length;

      const outlierCount = result.rows.filter(r => r.isOutlierFlag).length;
      if (outlierCount > 0) {
        result.warnings.push(`${outlierCount} row(s) flagged as potential outliers for review`);
      }
    } else {
      result.warnings.push('No pricing data extracted via OCR');
    }
  } catch (error: any) {
    result.errors.push(`OCR processing error: ${error.message}`);
  }

  return result;
}

export async function processPrcDocumentWithBuffer(
  documentId: number,
  fileBuffer: Buffer,
  isImage: boolean = false,
  retryCount: number = 0
): Promise<void> {
  const tag = `[PRC:${documentId}]`;
  console.log(`${tag} file_received | isImage=${isImage} retryCount=${retryCount} bufferSize=${fileBuffer.length}`);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('PARSE_TIMEOUT: exceeded 120s')), PARSE_TIMEOUT_MS);
  });

  const processingPromise = (async () => {
    const document = await storage.getPrcDocument(documentId);
    if (!document) {
      throw new Error(`PRC document ${documentId} not found`);
    }

    await storage.updatePrcDocumentParseStatus(documentId, 'PARSING');

    console.log(`${tag} parsing_started | method=${isImage ? 'ocr' : 'text'}`);

    let result: PrcParseResult;

    if (isImage) {
      result = await parsePrcDocumentWithOcr(fileBuffer);
    } else {
      result = await parsePrcDocument(fileBuffer);
      console.log(`${tag} text_extracted | length=${result.rawExtractedText.length}`);

      if (!result.success || result.rows.length === 0) {
        console.log(`${tag} text_extraction_insufficient | falling_back_to_ocr`);
        result = await parsePrcDocumentWithOcr(fileBuffer);
      }
    }

    const tableCandidateCount = result.rows.length > 0 ? 1 : 0;
    console.log(`${tag} table_candidates_found | count=${tableCandidateCount}`);
    console.log(`${tag} rows_detected | count=${result.rows.length}`);

    if (!result.success || result.rows.length === 0) {
      console.log(`${tag} validation_failed | reason=no_rows_extracted`);
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        0,
        result.errors.length > 0 ? result.errors : ['No rows extracted - manual entry required'],
        {
          rawExtractedText: result.rawExtractedText,
          parseDebugJson: { parseMethod: result.parseMethod, warnings: result.warnings, errors: result.errors },
        }
      );
      console.log(`${tag} status_updated | status=NEEDS_REVIEW`);
      return;
    }

    const validation = validateRows(result.rows);

    if (!validation.valid) {
      console.log(`${tag} validation_failed | errorCount=${validation.errors.length} failRate>50%`);
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        result.confidence,
        validation.errors,
        {
          rawExtractedText: result.rawExtractedText,
          parseDebugJson: { parseMethod: result.parseMethod, warnings: result.warnings, validationErrors: validation.errors },
        }
      );
      console.log(`${tag} status_updated | status=NEEDS_REVIEW`);
      return;
    }

    if (validation.errors.length > 0) {
      result.warnings.push(...validation.errors);
    }

    console.log(`${tag} validation_passed | cleanRows=${validation.cleanRows.length}`);

    const validSubmarkets = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE'];
    const validProducts = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100'];
    const validRows = validation.cleanRows.filter(row =>
      validSubmarkets.includes(row.submarket) && validProducts.includes(row.productType)
    );

    if (validRows.length === 0) {
      console.log(`${tag} validation_failed | reason=no_valid_submarket_product_combos`);
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        0,
        ['No valid pricing rows extracted - manual entry required']
      );
      console.log(`${tag} status_updated | status=NEEDS_REVIEW`);
      return;
    }

    await storage.deletePrcRowsForDocument(documentId);

    for (const row of validRows) {
      await storage.createPrcRow({
        prcDocumentId: documentId,
        supplierId: document.supplierId,
        referenceMonth: document.referenceMonth,
        submarket: row.submarket,
        productType: row.productType,
        termMonths: row.termMonths,
        priceRPerMWh: row.priceRPerMWh,
        rawSnippet: row.rawText,
        confidence: Math.round(row.confidence * 100),
        isOutlierFlag: row.isOutlierFlag,
        outlierReason: row.outlierReason,
      });
    }

    const outlierCount = validRows.filter(r => r.isOutlierFlag).length;
    const newStatus = outlierCount > 0 ? 'NEEDS_REVIEW' : 'PARSED';

    await storage.updatePrcDocumentParseStatus(
      documentId,
      newStatus,
      result.confidence,
      result.errors.length > 0 ? result.errors : undefined,
      {
        rawExtractedText: result.rawExtractedText,
        parseDebugJson: {
          parseMethod: result.parseMethod,
          warnings: result.warnings,
          rowsBeforeFilter: result.rows.length,
          rowsAfterFilter: validRows.length,
          outlierCount,
        },
        rowsExtracted: validRows.length,
        rowsFlagged: outlierCount,
      }
    );

    console.log(`${tag} status_updated | status=${newStatus} rows=${validRows.length} outliers=${outlierCount}`);
  })();

  try {
    await Promise.race([processingPromise, timeoutPromise]);
  } catch (error: any) {
    console.error(`${tag} processing_error | error=${error.message}`);
    try {
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'FAILED',
        0,
        [`Processing error: ${error.message}`]
      );
      console.log(`${tag} status_updated | status=FAILED`);
    } catch (storageError: any) {
      console.error(`${tag} storage_update_failed | error=${storageError.message}`);
    }
  }
}

export async function processPrcDocument(documentId: number): Promise<void> {
  await storage.updatePrcDocumentParseStatus(
    documentId,
    'NEEDS_REVIEW',
    0,
    ['Document uploaded - manual data entry required. Use processPrcDocumentWithBuffer for automatic parsing.']
  );
}

export function calculateBenchmarkPrices(rows: ParsedPrcRow[]): {
  lowPrice: number;
  midPrice: number;
  highPrice: number;
  numSources: number;
} {
  const prices = rows.map(r => parseFloat(r.priceRPerMWh)).sort((a, b) => a - b);

  if (prices.length === 0) {
    return { lowPrice: 0, midPrice: 0, highPrice: 0, numSources: 0 };
  }

  const p25Index = Math.floor(prices.length * 0.25);
  const p50Index = Math.floor(prices.length * 0.5);
  const p75Index = Math.floor(prices.length * 0.75);

  return {
    lowPrice: prices[p25Index] || prices[0],
    midPrice: prices[p50Index] || prices[0],
    highPrice: prices[p75Index] || prices[prices.length - 1],
    numSources: prices.length,
  };
}
