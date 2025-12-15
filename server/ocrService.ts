import Tesseract from "tesseract.js";
import sharp from "sharp";
import * as fs from "fs/promises";
import * as path from "path";
import * as pdfParseModule from "pdf-parse";

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

export interface ExtractedBillData {
  uc: string;
  consumo: string;
  demanda: string;
  valor: string;
  distribuidora: string;
  mes: string;
}

export interface OcrResult {
  success: boolean;
  data: ExtractedBillData;
  confidence: number;
  needsManual: boolean;
  rawText: string;
}

const DISTRIBUTORS = [
  "CPFL",
  "EDP",
  "Enel",
  "Cemig",
  "Light",
  "Neoenergia",
  "Energisa",
  "Celesc",
  "CEB",
  "Copel",
  "Coelba",
  "Celpe",
  "Elektro",
  "AES",
  "Equatorial",
  "CEEE",
  "RGE",
  "Ampla"
];

function parseBrazilianBill(text: string): ExtractedBillData {
  const data: ExtractedBillData = {
    uc: "",
    consumo: "",
    demanda: "",
    valor: "",
    distribuidora: "",
    mes: ""
  };

  const ucPatterns = [
    /(?:UC|Unidade\s+Consumidora|N[ºo°]?\s*UC)[:\s]*([0-9.-]+)/i,
    /(?:Instalação|Instalacao)[:\s]*([0-9.-]+)/i,
    /([0-9]{3}[\.\-]?[0-9]{3}[\.\-]?[0-9]{3}[\.\-]?[0-9])/
  ];
  for (const pattern of ucPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.uc = match[1].trim();
      break;
    }
  }

  const consumoPatterns = [
    /(?:Consumo|Energia\s+Ativa|kWh\s+Ativo)[:\s]*([0-9.,]+)\s*(?:kWh)?/i,
    /([0-9.,]+)\s*kWh/i,
    /(?:Total\s+kWh)[:\s]*([0-9.,]+)/i
  ];
  for (const pattern of consumoPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.consumo = match[1].trim();
      break;
    }
  }

  const demandaPatterns = [
    /(?:Demanda|Demanda\s+Contratada|kW)[:\s]*([0-9.,]+)\s*(?:kW)?/i,
    /([0-9.,]+)\s*kW(?!\s*h)/i
  ];
  for (const pattern of demandaPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.demanda = match[1].trim();
      break;
    }
  }

  const valorPatterns = [
    /(?:Total\s+a\s+Pagar|Valor\s+Total|Total\s+Fatura|TOTAL)[:\s]*R?\$?\s*([0-9.,]+)/i,
    /R\$\s*([0-9.,]+)/,
    /(?:Valor)[:\s]*([0-9.,]+)/i
  ];
  for (const pattern of valorPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.valor = match[1].trim();
      break;
    }
  }

  for (const dist of DISTRIBUTORS) {
    if (text.toUpperCase().includes(dist.toUpperCase())) {
      data.distribuidora = dist;
      break;
    }
  }

  const mesPatterns = [
    /(?:Mês\s+Refer[êe]ncia|Refer[êe]ncia|Período)[:\s]*(\d{2}\/\d{4})/i,
    /(\d{2}\/\d{4})/
  ];
  for (const pattern of mesPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.mes = match[1].trim();
      break;
    }
  }

  return data;
}

function calculateConfidence(data: ExtractedBillData): number {
  let score = 0;
  let total = 0;
  
  const weights = {
    uc: 0.25,
    consumo: 0.25,
    valor: 0.25,
    distribuidora: 0.1,
    demanda: 0.1,
    mes: 0.05
  };

  for (const [key, weight] of Object.entries(weights)) {
    total += weight;
    if (data[key as keyof ExtractedBillData]) {
      score += weight;
    }
  }

  return total > 0 ? score / total : 0;
}

export async function processImageOcr(imagePath: string): Promise<{ text: string; confidence: number }> {
  const result = await Tesseract.recognize(imagePath, "por", {
    logger: (info) => {
      if (info.status === "recognizing text") {
        console.log(`OCR progress: ${Math.round(info.progress * 100)}%`);
      }
    }
  });

  return {
    text: result.data.text,
    confidence: result.data.confidence / 100
  };
}

export async function processPdfToText(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  try {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    
    if (!text || text.trim().length < 50) {
      return {
        text: "[PDF contains insufficient text - may be scanned image]",
        confidence: 0.1
      };
    }
    
    return {
      text: text,
      confidence: 0.85
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    return {
      text: "[PDF parsing failed - please enter data manually]",
      confidence: 0
    };
  }
}

export async function processImage(buffer: Buffer, tempDir: string): Promise<string> {
  const imagePath = path.join(tempDir, `image_${Date.now()}.png`);
  
  await sharp(buffer)
    .resize(2000, null, { withoutEnlargement: true })
    .sharpen()
    .normalize()
    .png()
    .toFile(imagePath);
  
  return imagePath;
}

export async function processBillFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> {
  const tempDir = "/tmp/ocr_uploads";
  await fs.mkdir(tempDir, { recursive: true });

  let ocrText = "";
  let avgConfidence = 0;

  try {
    if (mimeType === "application/pdf") {
      const pdfResult = await processPdfToText(fileBuffer);
      ocrText = pdfResult.text;
      avgConfidence = pdfResult.confidence;
    } else {
      const imagePath = await processImage(fileBuffer, tempDir);
      
      try {
        const result = await processImageOcr(imagePath);
        ocrText = result.text;
        avgConfidence = result.confidence;
      } catch (error) {
        console.error("OCR error for image:", error);
        ocrText = "[OCR Error - please enter data manually]";
        avgConfidence = 0;
      }

      await fs.unlink(imagePath).catch(() => {});
    }

  } catch (error) {
    console.error("Error processing bill file:", error);
    throw error;
  }

  const extractedData = parseBrazilianBill(ocrText);
  const dataConfidence = calculateConfidence(extractedData);
  
  const finalConfidence = (avgConfidence * 0.4) + (dataConfidence * 0.6);
  
  return {
    success: true,
    data: extractedData,
    confidence: finalConfidence,
    needsManual: finalConfidence < 0.7,
    rawText: ocrText.substring(0, 5000)
  };
}
