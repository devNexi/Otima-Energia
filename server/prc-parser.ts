import Tesseract from 'tesseract.js';
import { storage } from './storage';

// Dynamic import for pdf-parse due to ESM compatibility
async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  // pdf-parse has ESM compatibility issues, use dynamic require pattern
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
}

const SUBMARKETS = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE', 'SE/CO', 'S', 'N', 'NE'];
const PRODUCT_TYPES = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100', 'I0', 'I50', 'I100', 'CONV'];
const PRICE_MIN_R_MWH = 50;
const PRICE_MAX_R_MWH = 1000;
const PRICE_OUTLIER_Z_THRESHOLD = 2.5;

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

export async function parsePrcDocument(pdfBuffer: Buffer): Promise<PrcParseResult> {
  const result: PrcParseResult = {
    success: false,
    rows: [],
    parseMethod: 'text',
    confidence: 0,
    errors: [],
    warnings: [],
  };
  
  try {
    const pdfData = await parsePdf(pdfBuffer);
    const text = pdfData.text;
    
    if (!text || text.trim().length < 50) {
      result.warnings.push('PDF text extraction yielded minimal content, attempting OCR fallback');
      return result;
    }
    
    const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
    
    for (const line of lines) {
      const row = parseTableRow(line);
      if (row && parseFloat(row.priceRPerMWh) > 0) {
        result.rows.push(row);
      }
    }
    
    if (result.rows.length === 0) {
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
  };
  
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'por+eng', {
      logger: () => {},
    });
    
    if (!text || text.trim().length < 30) {
      result.errors.push('OCR produced minimal output');
      return result;
    }
    
    const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
    
    for (const line of lines) {
      const row = parseTableRow(line);
      if (row && parseFloat(row.priceRPerMWh) > 0) {
        row.confidence *= 0.8;
        result.rows.push(row);
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

export async function processPrcDocumentWithBuffer(documentId: number, fileBuffer: Buffer, isImage: boolean = false): Promise<void> {
  const document = await storage.getPrcDocument(documentId);
  if (!document) {
    throw new Error(`PRC document ${documentId} not found`);
  }
  
  await storage.updatePrcDocumentParseStatus(documentId, 'PARSING');
  
  try {
    let result: PrcParseResult;
    
    // For images, skip PDF text extraction and go directly to OCR
    if (isImage) {
      console.log(`Processing image doc ${documentId} with OCR directly`);
      result = await parsePrcDocumentWithOcr(fileBuffer);
    } else {
      // For PDFs, try text extraction first
      result = await parsePrcDocument(fileBuffer);
      
      if (!result.success || result.rows.length === 0) {
        console.log(`Text extraction failed for doc ${documentId}, attempting OCR...`);
        result = await parsePrcDocumentWithOcr(fileBuffer);
      }
    }
    
    if (!result.success || result.rows.length === 0) {
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        0,
        result.errors.length > 0 ? result.errors : ['No rows extracted - manual entry required']
      );
      return;
    }
    
    // Filter out rows with invalid submarket/product (UNKNOWN fallbacks)
    const validSubmarkets = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE'];
    const validProducts = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100'];
    const validRows = result.rows.filter(row => 
      validSubmarkets.includes(row.submarket) && validProducts.includes(row.productType)
    );
    
    if (validRows.length === 0) {
      await storage.updatePrcDocumentParseStatus(
        documentId,
        'NEEDS_REVIEW',
        0,
        ['No valid pricing rows extracted - manual entry required']
      );
      return;
    }
    
    // Delete any existing rows for this document before inserting (avoid duplicates on re-parse)
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
      result.errors.length > 0 ? result.errors : undefined
    );
    
  } catch (error: any) {
    console.error(`Error processing PRC document ${documentId}:`, error);
    await storage.updatePrcDocumentParseStatus(
      documentId,
      'NEEDS_REVIEW',
      0,
      [`Processing error: ${error.message}`]
    );
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
