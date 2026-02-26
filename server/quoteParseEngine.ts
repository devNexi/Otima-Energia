interface ParsedQuoteFields {
  supplierName: string | null;
  energyPriceRmwh: string | null;
  contractDurationMonths: number | null;
  energyType: string | null;
  priceStructure: string | null;
  contractStart: string | null;
  validUntil: string | null;
  volume: string | null;
  submarket: string | null;
  quoteReference: string | null;
  confidence: number;
  extractedPairs: Record<string, string>;
}

const SUPPLIER_KEYWORDS = [
  'engie', 'enel', 'aes', 'cpfl', 'neoenergia', 'equatorial', 'light',
  'cemig', 'copel', 'celesc', 'energisa', 'elektro', 'eletrobras',
  'omega', 'voltalia', 'statkraft', 'atiaia', 'comerc', 'tradener',
  'matrix', 'safira', 'nova', 'total', 'shell', 'bp', 'eneva',
  'casa dos ventos', 'auren', 'rio energy', 'atlas', 'focus', 'vtrm'
];

const ENERGY_TYPES: Record<string, string> = {
  'convencional': 'Convencional',
  'conventional': 'Convencional',
  'incentivada 50': 'Incentivada 50%',
  'incentivada 100': 'Incentivada 100%',
  'incentivada': 'Incentivada',
  'i5': 'Incentivada 50%',
  'i1': 'Incentivada 100%',
  'i-5': 'Incentivada 50%',
  'i-1': 'Incentivada 100%',
  'i50': 'Incentivada 50%',
  'i100': 'Incentivada 100%',
};

const SUBMARKETS: Record<string, string> = {
  'sudeste': 'SE_CO',
  'se/co': 'SE_CO',
  'seco': 'SE_CO',
  'se_co': 'SE_CO',
  'centro-oeste': 'SE_CO',
  'centro oeste': 'SE_CO',
  'sul': 'S',
  'nordeste': 'NE',
  'norte': 'N',
  'nne': 'NE',
};

export function parseQuoteFromText(text: string, subject: string = ''): ParsedQuoteFields {
  const fullText = `${subject}\n${text}`.toLowerCase();
  const extractedPairs: Record<string, string> = {};
  let confidence = 0;

  let supplierName: string | null = null;
  for (const kw of SUPPLIER_KEYWORDS) {
    if (fullText.includes(kw)) {
      supplierName = kw.charAt(0).toUpperCase() + kw.slice(1);
      extractedPairs['supplier_match'] = kw;
      confidence += 0.15;
      break;
    }
  }

  let energyPriceRmwh: string | null = null;
  const pricePatterns = [
    /(\d{2,4}[.,]\d{1,4})\s*(?:r\$\s*\/?\s*mwh|r\$\/mwh|reais?\s*(?:por\s*)?mwh)/i,
    /(?:r\$\s*\/?\s*mwh|preço|price|cotação|valor)\s*[:=]?\s*(?:r\$\s*)?(\d{2,4}[.,]\d{1,4})/i,
    /(\d{2,4}[.,]\d{2})\s*\/\s*mwh/i,
    /(?:preço|price|cotação|valor)\s*[:=]?\s*(\d{2,4}[.,]\d{1,4})/i,
  ];
  for (const pattern of pricePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      energyPriceRmwh = match[1].replace(',', '.');
      extractedPairs['price_match'] = match[0];
      confidence += 0.25;
      break;
    }
  }

  let contractDurationMonths: number | null = null;
  const durationPatterns = [
    /(\d{1,3})\s*(?:meses|months|mes)/i,
    /(?:prazo|term|duração|duration|vigência)\s*[:=]?\s*(\d{1,3})/i,
    /(\d{1,3})\s*(?:anos?|years?)/i,
  ];
  for (const pattern of durationPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const val = parseInt(match[1] || match[2]);
      if (fullText.match(/(\d{1,3})\s*(?:anos?|years?)/)) {
        contractDurationMonths = val * 12;
      } else {
        contractDurationMonths = val;
      }
      extractedPairs['duration_match'] = match[0];
      confidence += 0.15;
      break;
    }
  }

  let energyType: string | null = null;
  for (const [key, value] of Object.entries(ENERGY_TYPES)) {
    if (fullText.includes(key)) {
      energyType = value;
      extractedPairs['energy_type_match'] = key;
      confidence += 0.1;
      break;
    }
  }

  let submarket: string | null = null;
  for (const [key, value] of Object.entries(SUBMARKETS)) {
    if (fullText.includes(key)) {
      submarket = value;
      extractedPairs['submarket_match'] = key;
      confidence += 0.05;
      break;
    }
  }

  let volume: string | null = null;
  const volumePatterns = [
    /(\d+[.,]?\d*)\s*(?:mwm|mw\s*médio|mw\s*med)/i,
    /(\d+[.,]?\d*)\s*(?:mwh\s*\/?\s*(?:mes|mês|month|h))/i,
    /(?:volume|carga|demanda|load)\s*[:=]?\s*(\d+[.,]?\d*)/i,
  ];
  for (const pattern of volumePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      volume = (match[1] || match[2]).replace(',', '.');
      extractedPairs['volume_match'] = match[0];
      confidence += 0.1;
      break;
    }
  }

  let validUntil: string | null = null;
  const validPatterns = [
    /(?:válid[ao]|valid|validade)\s*(?:até|until|through)?\s*[:=]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /(?:expir[ae]|vencimento)\s*[:=]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ];
  for (const pattern of validPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      validUntil = match[1];
      extractedPairs['valid_until_match'] = match[0];
      confidence += 0.05;
      break;
    }
  }

  let contractStart: string | null = null;
  const startPatterns = [
    /(?:início|inicio|start|suprimento)\s*[:=]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /(?:fornecimento|supply)\s*(?:a partir de|from)?\s*[:=]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ];
  for (const pattern of startPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      contractStart = match[1];
      extractedPairs['contract_start_match'] = match[0];
      confidence += 0.05;
      break;
    }
  }

  let quoteReference: string | null = null;
  const refPatterns = [
    /(?:ref|referência|reference|cot|cotação|proposta|proposal)\s*[#.:=]?\s*([A-Za-z0-9\-\/]+)/i,
    /(?:nº|no\.?|number)\s*[:=]?\s*([A-Za-z0-9\-\/]+)/i,
  ];
  for (const pattern of refPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      quoteReference = match[1];
      extractedPairs['reference_match'] = match[0];
      confidence += 0.05;
      break;
    }
  }

  let priceStructure: string | null = null;
  if (fullText.includes('fixo') || fullText.includes('fixed') || fullText.includes('flat')) {
    priceStructure = 'Fixed';
    confidence += 0.05;
  } else if (fullText.includes('pld') || fullText.includes('spot')) {
    priceStructure = 'PLD+Spread';
    confidence += 0.05;
  }

  confidence = Math.min(confidence, 1.0);

  return {
    supplierName,
    energyPriceRmwh,
    contractDurationMonths,
    energyType,
    priceStructure,
    contractStart,
    validUntil,
    volume,
    submarket,
    quoteReference,
    confidence,
    extractedPairs,
  };
}
