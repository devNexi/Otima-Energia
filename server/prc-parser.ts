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

const SUBMARKETS = ['SE_CO', 'S', 'NE', 'N', 'SE/CO', 'SECO', 'SUL', 'NNE', 'NORTE'];
const VALID_SUBMARKETS = ['SE_CO', 'S', 'NE', 'N'];
const PRODUCT_TYPES = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100', 'I0', 'I50', 'I100', 'CONV'];
const PRICE_MIN_R_MWH = 10;
const PRICE_MAX_R_MWH = 2000;
const PRICE_OUTLIER_Z_THRESHOLD = 2.5;
const PARSE_TIMEOUT_MS = 120_000;
const PASS_CONFIDENCE_THRESHOLD = 0.60;

const TABLE_COLUMN_KEYWORDS = [
  'submercado', 'preço', 'valor', 'r$/mwh', 'mwh', 'convencional',
  'incentivada', 'i0', 'i50', 'i100', 'prazo', 'vigência', 'desconto',
  'tarifa', 'te', 'tusd', 'ponta', 'fora ponta', 'demanda', 'grupo',
  'subgrupo', 'modalidade', 'tensão', 'bandeira', 'encargos', 'icms', 'pis', 'cofins',
  'distribuidora', 'concessionária', 'concessionaria', 'grupo tarifário', 'grupo tarifario',
  'classe consumo', 'classe de consumo', 'intermediário', 'intermediario',
  'ultrapassagem', 'energia',
];

const COLUMN_SYNONYMS: Record<string, string[]> = {
  submarket: ['submercado', 'sub-mercado', 'mercado', 'region', 'regiao', 'região'],
  productType: [
    'produto', 'tipo', 'product', 'convencional', 'incentivada', 'modalidade',
    'fonte', 'tipo energia', 'tipo de energia', 'classe consumo', 'classe de consumo',
  ],
  termMonths: ['prazo', 'term', 'meses', 'vigencia', 'vigência', 'contrato', 'duração', 'duracao'],
  priceRPerMWh: ['preco', 'preço', 'price', 'valor', 'r$/mwh', 'rs/mwh', 'tarifa', 'custo', 'energia'],
  grupo: ['grupo', 'group', 'grupo tarifário', 'grupo tarifario'],
  subgrupo: ['subgrupo', 'sub-grupo', 'subgroup'],
  modalidade: ['modalidade', 'modality'],
  tensao: ['tensao', 'tensão', 'voltage'],
  teValue: ['te', 'tarifa energia', 'tarifa de energia'],
  tusdValue: ['tusd', 'tarifa uso', 'tarifa de uso'],
  desconto: ['desconto', 'discount', 'desc'],
  demandCharge: ['demanda', 'demand', 'demanda contratada'],
  distribuidora: ['distribuidora', 'concessionária', 'concessionaria', 'distribuidora local'],
  ponta: ['ponta', 'horário ponta', 'horario ponta'],
  foraPonta: ['fora ponta', 'fora-ponta', 'horário fora ponta'],
  intermediario: ['intermediário', 'intermediario', 'horário intermediário'],
  ultrapassagem: ['ultrapassagem', 'excess'],
  bandeira: ['bandeira', 'flag', 'bandeira tarifária'],
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

  for (const [key, val] of Object.entries(EXACT_COLUMN_MAP)) {
    if (removeAccents(key) === normalized) return val;
  }

  const tokens = normalized.split(/[\s\/\-_]+/);
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
    'SE/CO': 'SE_CO',
    'SECO': 'SE_CO',
    'SE': 'SE_CO',
    'CO': 'SE_CO',
    'SUDESTE': 'SE_CO',
    'SUDESTE/CENTRO-OESTE': 'SE_CO',
    'SE_CO': 'SE_CO',
    'S': 'S',
    'SUL': 'S',
    'NE': 'NE',
    'NNE': 'NE',
    'NORDESTE': 'NE',
    'N': 'N',
    'NORTE': 'N',
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
    'INCENTIVADA I0': 'INC_I0',
    'INCENTIVADA 0': 'INC_I0',
    'INCENTIVADA 0%': 'INC_I0',
    'INCENTIVADA 50%': 'INC_I50',
    'INCENTIVADA 50': 'INC_I50',
    'INCENTIVADA 100%': 'INC_I100',
    'INCENTIVADA 100': 'INC_I100',
    'INCENTIVADA ESPECIAL': 'INCENTIVADA',
    'INC I0': 'INC_I0',
    'INC I50': 'INC_I50',
    'INC I100': 'INC_I100',
    'INC-I0': 'INC_I0',
    'INC-I50': 'INC_I50',
    'INC-I100': 'INC_I100',
    'INC_0': 'INC_I0',
    'INC_50': 'INC_I50',
    'INC_100': 'INC_I100',
  };
  return mappings[cleaned] || cleaned;
}

function parseBrazilianNumber(text: string): number | null {
  let cleaned = text.replace(/\s/g, '').replace(/R\$/gi, '');
  if (/^\-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\-?\d+(,\d{1,2})$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function extractPrice(text: string): number | null {
  const patterns = [
    /R\$\s*([\-]?[\d.,]+)/i,
    /([\-]?[\d.,]+)\s*R\$/i,
    /([\-]?[\d.,]+)\s*(?:\/MWh|BRL)/i,
    /(?:pre[çc]o|price|valor|tarifa)[:\s]*([\-]?[\d.,]+)/i,
    /([\-]?\d{2,4}[,]\d{2})/,
    /([\-]?\d{1,3}\.\d{3}[,]\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseBrazilianNumber(match[1]);
      if (price !== null && price >= PRICE_MIN_R_MWH && price <= PRICE_MAX_R_MWH) {
        return price;
      }
    }
  }

  const allNumbers = text.match(/[\-]?\d[\d.,]*/g);
  if (allNumbers) {
    for (const numStr of allNumbers) {
      const price = parseBrazilianNumber(numStr);
      if (price !== null && price >= PRICE_MIN_R_MWH && price <= PRICE_MAX_R_MWH) {
        return price;
      }
    }
  }

  return null;
}

function extractNegativePrice(text: string): boolean {
  const negPatterns = [
    /R\$\s*\-[\d.,]+/i,
    /\-\s*R\$\s*[\d.,]+/i,
    /(?:pre[çc]o|price|valor|tarifa)[:\s]*\-[\d.,]+/i,
  ];
  for (const p of negPatterns) {
    if (p.test(text)) return true;
  }
  return false;
}

function extractTerm(text: string): number | null {
  const patterns = [
    /(\d+)\s*(?:meses|months|m(?:\s|$))/i,
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

function hasColumnSeparators(line: string): boolean {
  return /\t/.test(line) || /\s{3,}/.test(line) || /\|/.test(line);
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
  let linesWithSeparators = 0;
  for (const line of block.lines) {
    if (countNumericValues(line) >= 2) linesWithMultipleNums++;
    if (hasColumnSeparators(line)) linesWithSeparators++;
  }
  return linesWithMultipleNums >= 2 || (linesWithSeparators >= 2 && linesWithMultipleNums >= 1);
}

function detectHeaderColumns(headerLine: string): { field: string; startPos: number }[] {
  const columns: { field: string; startPos: number }[] = [];
  const lowerLine = removeAccents(headerLine.toLowerCase());
  const tokens = lowerLine.split(/\s{2,}|\t|\|/);

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

function detectSubmarketFromContext(lines: string[], lineIndex: number): string | null {
  const searchRange = 5;
  const start = Math.max(0, lineIndex - searchRange);
  const end = Math.min(lines.length, lineIndex + searchRange + 1);
  for (let i = start; i < end; i++) {
    const upper = lines[i].toUpperCase();
    for (const sm of SUBMARKETS) {
      if (upper.includes(sm)) {
        return normalizeSubmarket(sm);
      }
    }
    if (/SUDESTE|CENTRO[\s-]*OESTE/i.test(lines[i])) return 'SECO';
    if (/NORDESTE/i.test(lines[i])) return 'NNE';
  }
  return null;
}

function detectProductTypeFromText(text: string): string | null {
  const upper = text.toUpperCase();
  const multiWordMappings: [RegExp, string][] = [
    [/INCENTIVADA\s+ESPECIAL/i, 'INCENTIVADA'],
    [/INCENTIVADA\s+100\s*%?/i, 'INC_I100'],
    [/INCENTIVADA\s+50\s*%?/i, 'INC_I50'],
    [/INCENTIVADA\s+I?0\s*%?/i, 'INC_I0'],
    [/INC[\s_-]*I?100/i, 'INC_I100'],
    [/INC[\s_-]*I?50/i, 'INC_I50'],
    [/INC[\s_-]*I?0/i, 'INC_I0'],
  ];
  for (const [regex, result] of multiWordMappings) {
    if (regex.test(upper)) return result;
  }
  for (const pt of PRODUCT_TYPES) {
    if (upper.includes(pt)) {
      return normalizeProductType(pt);
    }
  }
  return null;
}

function scoreRow(row: ParsedPrcRow): number {
  let score = 0;
  const price = parseFloat(row.priceRPerMWh);
  if (row.submarket && row.submarket !== 'UNKNOWN') score += 0.30;
  if (row.productType && row.productType !== 'CONVENCIONAL') score += 0.15;
  else if (row.productType === 'CONVENCIONAL') score += 0.10;
  if (price > 0) score += 0.35;
  if (row.termMonths !== null && row.termMonths > 0) score += 0.10;
  if (row.volumeMwm !== null) score += 0.05;
  if (row.validFrom !== null) score += 0.05;
  return Math.min(score, 1.0);
}

function parseTableRow(line: string, contextSubmarket?: string | null): ParsedPrcRow | null {
  let submarket: string | null = null;
  let productType: string | null = null;

  const upper = line.toUpperCase();

  for (const sm of SUBMARKETS) {
    if (upper.includes(sm)) {
      submarket = normalizeSubmarket(sm);
      break;
    }
  }
  if (!submarket && /SUDESTE|CENTRO[\s-]*OESTE/i.test(line)) submarket = 'SECO';
  if (!submarket && /NORDESTE/i.test(line)) submarket = 'NNE';

  if (!submarket && contextSubmarket) {
    submarket = contextSubmarket;
  }

  productType = detectProductTypeFromText(line);

  const price = extractPrice(line);
  const hasNegative = extractNegativePrice(line);

  if (!submarket && !productType && !price) {
    return null;
  }

  const term = extractTerm(line);
  const volume = extractVolume(line);

  const row: ParsedPrcRow = {
    submarket: submarket || 'UNKNOWN',
    productType: productType || 'CONVENCIONAL',
    termMonths: term,
    priceRPerMWh: price?.toFixed(2) || '0.00',
    volumeMwm: volume,
    validFrom: extractDate(line),
    validUntil: null,
    rawText: line.substring(0, 500),
    confidence: 0,
    isOutlierFlag: false,
    outlierReason: hasNegative && !price ? 'Negative price detected in source' : null,
  };

  row.confidence = scoreRow(row);
  return row;
}

function extractRowsFromTableBlock(block: TextBlock, allLines?: string[]): ParsedPrcRow[] {
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

  let blockSubmarket: string | null = null;
  const contextLines = allLines || block.lines;
  for (const line of block.lines.slice(0, Math.min(5, block.lines.length))) {
    for (const sm of SUBMARKETS) {
      if (line.toUpperCase().includes(sm)) {
        blockSubmarket = normalizeSubmarket(sm);
        break;
      }
    }
    if (blockSubmarket) break;
    if (/SUDESTE|CENTRO[\s-]*OESTE/i.test(line)) { blockSubmarket = 'SECO'; break; }
    if (/NORDESTE/i.test(line)) { blockSubmarket = 'NNE'; break; }
  }

  for (let i = dataStartIdx; i < block.lines.length; i++) {
    const line = block.lines[i];
    if (countNumericValues(line) >= 1) {
      const row = parseTableRow(line, blockSubmarket);
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
  validationErrors: string[];
}

function validateRows(rows: ParsedPrcRow[]): ValidationResult {
  const errors: string[] = [];
  const validationErrors: string[] = [];
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

    if (row.submarket === 'UNKNOWN' || price <= 0) {
      rowErrors.push(`Missing required fields: need submarket+price at minimum`);
    }

    if (row.submarket !== 'UNKNOWN' && !VALID_SUBMARKETS.includes(row.submarket)) {
      rowErrors.push(`Invalid submarket '${row.submarket}' - must be one of ${VALID_SUBMARKETS.join('/')}`);
    }

    const dedupeKey = `${row.submarket}|${row.productType}|${row.termMonths}|${row.priceRPerMWh}`;
    if (seen.has(dedupeKey)) {
      rowErrors.push(`Duplicate row: ${dedupeKey}`);
      failedCount++;
      validationErrors.push(`Row [${row.submarket}/${row.productType}]: Duplicate row`);
      continue;
    }
    seen.add(dedupeKey);

    if (rowErrors.length > 0) {
      failedCount++;
      const mapped = rowErrors.map(e => `Row [${row.submarket}/${row.productType}]: ${e}`);
      errors.push(...mapped);
      validationErrors.push(...mapped);
    } else {
      cleanRows.push(row);
    }
  }

  if (cleanRows.length < 2) {
    validationErrors.push(`Insufficient valid rows: ${cleanRows.length} (minimum 2 required for PARSED status)`);
  }

  const totalRows = rows.length;
  const failRate = totalRows > 0 ? failedCount / totalRows : 0;

  return {
    valid: failRate <= 0.5 && cleanRows.length >= 2,
    errors,
    cleanRows,
    validationErrors,
  };
}

interface PassResult {
  rows: ParsedPrcRow[];
  confidence: number;
  warnings: string[];
}

function computePassConfidence(rows: ParsedPrcRow[]): number {
  if (rows.length === 0) return 0;
  const avgRowConf = rows.reduce((sum, r) => sum + r.confidence, 0) / rows.length;
  const coverageFactor = Math.min(1.0, rows.length / 5);
  return avgRowConf * coverageFactor;
}

function runPassA(text: string): PassResult {
  const warnings: string[] = [];
  const rows: ParsedPrcRow[] = [];

  const blocks = splitIntoBlocks(text);
  const allLines = text.split('\n');
  const tableCandidates = blocks.filter(isTableCandidateBlock);

  if (tableCandidates.length > 0) {
    for (const block of tableCandidates) {
      const blockRows = extractRowsFromTableBlock(block, allLines);
      rows.push(...blockRows);
    }
  }

  if (rows.length === 0) {
    const lines = allLines.filter((line: string) => line.trim().length > 0);
    for (let i = 0; i < lines.length; i++) {
      const contextSm = detectSubmarketFromContext(lines, i);
      const row = parseTableRow(lines[i], contextSm);
      if (row && parseFloat(row.priceRPerMWh) > 0) {
        rows.push(row);
      }
    }
  }

  if (rows.length > 0) {
    detectOutliers(rows);
    const outlierCount = rows.filter(r => r.isOutlierFlag).length;
    if (outlierCount > 0) {
      warnings.push(`${outlierCount} row(s) flagged as potential outliers`);
    }
  }

  return {
    rows,
    confidence: computePassConfidence(rows),
    warnings,
  };
}

function runPassB(text: string): PassResult {
  const warnings: string[] = [];
  const allRows: ParsedPrcRow[] = [];
  const allLines = text.split('\n').filter((l: string) => l.trim().length > 0);

  const tabRows: ParsedPrcRow[] = [];
  for (let i = 0; i < allLines.length; i++) {
    if (/\t/.test(allLines[i])) {
      const fields = allLines[i].split('\t').map(f => f.trim());
      const combined = fields.join(' ');
      const contextSm = detectSubmarketFromContext(allLines, i);
      const row = parseTableRow(combined, contextSm);
      if (row && parseFloat(row.priceRPerMWh) > 0) {
        tabRows.push(row);
      }
    }
  }
  if (tabRows.length > 0) {
    allRows.push(...tabRows);
    warnings.push(`Pass B: tab-split extracted ${tabRows.length} rows`);
  }

  if (allRows.length === 0) {
    const fixedWidthRows: ParsedPrcRow[] = [];
    for (let i = 0; i < allLines.length; i++) {
      if (/\s{3,}/.test(allLines[i])) {
        const fields = allLines[i].split(/\s{3,}/).map(f => f.trim()).filter(f => f.length > 0);
        if (fields.length >= 2) {
          const combined = fields.join(' ');
          const contextSm = detectSubmarketFromContext(allLines, i);
          const row = parseTableRow(combined, contextSm);
          if (row && parseFloat(row.priceRPerMWh) > 0) {
            fixedWidthRows.push(row);
          }
        }
      }
    }
    if (fixedWidthRows.length > 0) {
      allRows.push(...fixedWidthRows);
      warnings.push(`Pass B: fixed-width extracted ${fixedWidthRows.length} rows`);
    }
  }

  if (allRows.length === 0) {
    const combinedRows: ParsedPrcRow[] = [];

    let contextSubmarket: string | null = null;
    for (const line of allLines) {
      const upper = line.toUpperCase();
      for (const sm of SUBMARKETS) {
        if (upper.includes(sm)) {
          contextSubmarket = normalizeSubmarket(sm);
          break;
        }
      }
      if (/SUDESTE|CENTRO[\s-]*OESTE/i.test(line)) contextSubmarket = 'SECO';
      if (/NORDESTE/i.test(line)) contextSubmarket = 'NNE';
    }

    for (let i = 0; i < allLines.length - 1; i++) {
      const combined = allLines[i] + ' ' + allLines[i + 1];
      const row = parseTableRow(combined, contextSubmarket);
      if (row && parseFloat(row.priceRPerMWh) > 0) {
        combinedRows.push(row);
        i++;
      }
    }
    if (combinedRows.length > 0) {
      allRows.push(...combinedRows);
      warnings.push(`Pass B: combined-line extracted ${combinedRows.length} rows`);
    }
  }

  if (allRows.length === 0) {
    const regexRows: ParsedPrcRow[] = [];
    const priceRegex = /(?:R\$\s*)?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:\/?\s*MWh)?/gi;

    let contextSubmarket: string | null = null;
    for (const line of allLines) {
      for (const sm of SUBMARKETS) {
        if (line.toUpperCase().includes(sm)) {
          contextSubmarket = normalizeSubmarket(sm);
          break;
        }
      }
    }

    for (let i = 0; i < allLines.length; i++) {
      let match: RegExpExecArray | null;
      while ((match = priceRegex.exec(allLines[i])) !== null) {
        const price = parseBrazilianNumber(match[1]);
        if (price !== null && price >= PRICE_MIN_R_MWH && price <= PRICE_MAX_R_MWH) {
          const lineSm = detectSubmarketFromContext(allLines, i) || contextSubmarket;
          const productType = detectProductTypeFromText(allLines[i]);
          const term = extractTerm(allLines[i]);
          const row: ParsedPrcRow = {
            submarket: lineSm || 'UNKNOWN',
            productType: productType || 'CONVENCIONAL',
            termMonths: term,
            priceRPerMWh: price.toFixed(2),
            volumeMwm: extractVolume(allLines[i]),
            validFrom: extractDate(allLines[i]),
            validUntil: null,
            rawText: allLines[i].substring(0, 500),
            confidence: 0,
            isOutlierFlag: false,
            outlierReason: null,
          };
          row.confidence = scoreRow(row);
          regexRows.push(row);
        }
      }
    }
    if (regexRows.length > 0) {
      allRows.push(...regexRows);
      warnings.push(`Pass B: regex-based extracted ${regexRows.length} rows`);
    }
  }

  if (allRows.length > 0) {
    detectOutliers(allRows);
    const outlierCount = allRows.filter(r => r.isOutlierFlag).length;
    if (outlierCount > 0) {
      warnings.push(`${outlierCount} row(s) flagged as potential outliers`);
    }
  }

  return {
    rows: allRows,
    confidence: computePassConfidence(allRows),
    warnings,
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

    const passA = runPassA(text);

    let passB: PassResult | null = null;
    if (passA.confidence < PASS_CONFIDENCE_THRESHOLD || passA.rows.length === 0) {
      passB = runPassB(text);
    }

    let selected: PassResult;
    let selectedPass: 'A' | 'B';
    if (passB && passB.confidence > passA.confidence) {
      selected = passB;
      selectedPass = 'B';
    } else {
      selected = passA;
      selectedPass = 'A';
    }

    result.rows = selected.rows;
    result.confidence = selected.confidence;
    result.warnings.push(...selected.warnings);

    if (passB) {
      result.warnings.push(`Two-pass: selected Pass ${selectedPass} (A=${passA.confidence.toFixed(2)}, B=${passB.confidence.toFixed(2)})`);
    }

    if (result.rows.length > 0) {
      result.success = true;
      result.parseMethod = 'text';
    } else {
      result.warnings.push('No pricing data extracted from PDF text');
    }

    (result as any)._passA = { confidence: passA.confidence, rowCount: passA.rows.length, warnings: passA.warnings };
    (result as any)._passB = passB ? { confidence: passB.confidence, rowCount: passB.rows.length, warnings: passB.warnings } : null;
    (result as any)._selectedPass = selectedPass;
    (result as any)._extractionStats = {
      textLength: text.length,
      blockCount: splitIntoBlocks(text).length,
      tableCandidateCount: splitIntoBlocks(text).filter(isTableCandidateBlock).length,
      headerDetected: text.split('\n').some((l: string) => isHeaderLine(l)),
    };
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

    const passA = runPassA(text);
    for (const row of passA.rows) {
      row.confidence *= 0.8;
    }

    let passB: PassResult | null = null;
    if (passA.confidence < PASS_CONFIDENCE_THRESHOLD || passA.rows.length === 0) {
      passB = runPassB(text);
      for (const row of passB.rows) {
        row.confidence *= 0.8;
      }
      passB.confidence = computePassConfidence(passB.rows);
    }
    passA.confidence = computePassConfidence(passA.rows);

    let selected: PassResult;
    let selectedPass: 'A' | 'B';
    if (passB && passB.confidence > passA.confidence) {
      selected = passB;
      selectedPass = 'B';
    } else {
      selected = passA;
      selectedPass = 'A';
    }

    result.rows = selected.rows;
    result.confidence = selected.confidence;
    result.warnings.push(...selected.warnings);

    if (result.rows.length > 0) {
      result.success = true;
      const outlierCount = result.rows.filter(r => r.isOutlierFlag).length;
      if (outlierCount > 0) {
        result.warnings.push(`${outlierCount} row(s) flagged as potential outliers for review`);
      }
    } else {
      result.warnings.push('No pricing data extracted via OCR');
    }

    (result as any)._passA = { confidence: passA.confidence, rowCount: passA.rows.length, warnings: passA.warnings };
    (result as any)._passB = passB ? { confidence: passB.confidence, rowCount: passB.rows.length, warnings: passB.warnings } : null;
    (result as any)._selectedPass = selectedPass;
    (result as any)._extractionStats = {
      textLength: (text || '').length,
      blockCount: splitIntoBlocks(text || '').length,
      tableCandidateCount: splitIntoBlocks(text || '').filter(isTableCandidateBlock).length,
      headerDetected: (text || '').split('\n').some((l: string) => isHeaderLine(l)),
    };
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
      try {
        result = await parsePrcDocumentWithOcr(fileBuffer);
      } catch (ocrErr: any) {
        console.error(`${tag} ocr_failed | error=${ocrErr.message}`);
        result = {
          success: false,
          rows: [],
          parseMethod: 'ocr',
          confidence: 0,
          errors: [`OCR failed: ${ocrErr.message}`],
          warnings: [],
          rawExtractedText: '',
        };
      }
    } else {
      result = await parsePrcDocument(fileBuffer);
      console.log(`${tag} text_extracted | length=${result.rawExtractedText.length}`);
    }

    const passAData = (result as any)._passA || null;
    const passBData = (result as any)._passB || null;
    const selectedPass = (result as any)._selectedPass || 'A';
    const extractionStats = (result as any)._extractionStats || {};

    const tableCandidateCount = extractionStats.tableCandidateCount || (result.rows.length > 0 ? 1 : 0);
    console.log(`${tag} table_candidates_found | count=${tableCandidateCount}`);
    console.log(`${tag} rows_detected | count=${result.rows.length}`);

    const buildDebugJson = (extra?: Record<string, any>) => ({
      parseMethod: result.parseMethod,
      passA: passAData,
      passB: passBData,
      selectedPass,
      warnings: result.warnings,
      validationErrors: [] as string[],
      rowsBeforeFilter: result.rows.length,
      rowsAfterFilter: 0,
      outlierCount: 0,
      extractionStats,
      ...extra,
    });

    if (!result.success || result.rows.length === 0) {
      console.log(`${tag} validation_failed | reason=no_rows_extracted`);
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        0,
        result.errors.length > 0 ? result.errors : ['No rows extracted - manual entry required'],
        {
          rawExtractedText: result.rawExtractedText,
          parseDebugJson: buildDebugJson({ validationErrors: ['No rows extracted'] }),
        }
      );
      console.log(`${tag} status_updated | status=NEEDS_REVIEW`);
      return;
    }

    const validation = validateRows(result.rows);

    if (!validation.valid) {
      console.log(`${tag} validation_failed | errorCount=${validation.errors.length}`);
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        result.confidence,
        validation.errors,
        {
          rawExtractedText: result.rawExtractedText,
          parseDebugJson: buildDebugJson({
            validationErrors: validation.validationErrors,
            rowsAfterFilter: validation.cleanRows.length,
          }),
        }
      );
      console.log(`${tag} status_updated | status=NEEDS_REVIEW`);
      return;
    }

    if (validation.errors.length > 0) {
      result.warnings.push(...validation.errors);
    }

    console.log(`${tag} validation_passed | cleanRows=${validation.cleanRows.length}`);

    const validProducts = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100'];
    const validRows = validation.cleanRows.filter(row =>
      VALID_SUBMARKETS.includes(row.submarket) && validProducts.includes(row.productType)
    );

    if (validRows.length === 0) {
      console.log(`${tag} validation_failed | reason=no_valid_submarket_product_combos`);
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        0,
        ['No valid pricing rows extracted - manual entry required'],
        {
          rawExtractedText: result.rawExtractedText,
          parseDebugJson: buildDebugJson({
            validationErrors: ['No valid submarket/product combinations found'],
            rowsAfterFilter: 0,
          }),
        }
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

    try {
      await storage.deleteCanonicalPricingRowsBySource('prc', documentId);
      await storage.createCanonicalPricingRows(validRows.map(row => ({
        source: 'prc',
        sourceId: documentId,
        supplierId: document.supplierId,
        referenceMonth: document.referenceMonth,
        submarket: row.submarket,
        productType: row.productType,
        termMonths: row.termMonths || undefined,
        priceRPerMWh: row.priceRPerMWh,
        confidence: Math.round(row.confidence * 100),
        isOutlierFlag: row.isOutlierFlag,
      })));
      console.log(`${tag} canonical_pricing_written | rows=${validRows.length}`);
    } catch (canonicalError: any) {
      console.error(`${tag} canonical_pricing_error | error=${canonicalError.message}`);
      result.warnings.push(`Failed to write canonical pricing: ${canonicalError.message}`);
    }

    const outlierCount = validRows.filter(r => r.isOutlierFlag).length;
    const bestConfidence = result.confidence;

    let newStatus: string;
    if (bestConfidence < PASS_CONFIDENCE_THRESHOLD) {
      newStatus = 'NEEDS_REVIEW';
    } else if (outlierCount > 0) {
      newStatus = 'NEEDS_REVIEW';
    } else {
      newStatus = 'PARSED';
    }

    await storage.updatePrcDocumentParseStatus(
      documentId,
      newStatus,
      result.confidence,
      result.errors.length > 0 ? result.errors : undefined,
      {
        rawExtractedText: result.rawExtractedText,
        parseDebugJson: buildDebugJson({
          validationErrors: validation.validationErrors,
          rowsAfterFilter: validRows.length,
          outlierCount,
        }),
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
