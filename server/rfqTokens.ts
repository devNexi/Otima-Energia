// RFQ Token Replacement System
// Replaces {{TOKENS}} in email/WhatsApp templates with actual values

export interface TokenContext {
  // Client Data
  clientName?: string;
  cnpj?: string;
  ucs?: string[];
  distributor?: string;
  submarket?: string;
  
  // Consumption Data
  annualMwh?: number;
  monthlyMwh?: number;
  demandKw?: number;
  
  // Contract Data
  productType?: string;
  startDate?: string;
  termMonths?: number;
  deadlineHours?: number;
  
  // RFO/Deal Data
  rfoNumber?: string;
  dealId?: string;
  
  // Contact Data
  contactName?: string;
  otimaContact?: string;
}

// List of all supported tokens
export const SUPPORTED_TOKENS = [
  'CLIENT_NAME',
  'CNPJ',
  'UCS',
  'DISTRIBUTOR',
  'SUBMARKET',
  'ANNUAL_MWH',
  'MONTHLY_MWH',
  'DEMAND_KW',
  'PRODUCT_TYPE',
  'START_DATE',
  'TERM_MONTHS',
  'DEADLINE_HOURS',
  'RFO_NUMBER',
  'DEAL_ID',
  'CONTACT_NAME',
  'OTIMA_CONTACT',
] as const;

export type TokenKey = typeof SUPPORTED_TOKENS[number];

// Map token keys to context values
function getTokenValue(token: TokenKey, context: TokenContext): string {
  switch (token) {
    case 'CLIENT_NAME':
      return context.clientName || '';
    case 'CNPJ':
      return context.cnpj || '';
    case 'UCS':
      return context.ucs?.join(', ') || '';
    case 'DISTRIBUTOR':
      return context.distributor || '';
    case 'SUBMARKET':
      return context.submarket || '';
    case 'ANNUAL_MWH':
      return context.annualMwh?.toString() || '';
    case 'MONTHLY_MWH':
      return context.monthlyMwh?.toString() || '';
    case 'DEMAND_KW':
      return context.demandKw?.toString() || '';
    case 'PRODUCT_TYPE':
      return context.productType || '';
    case 'START_DATE':
      return context.startDate || '';
    case 'TERM_MONTHS':
      return context.termMonths?.toString() || '';
    case 'DEADLINE_HOURS':
      return context.deadlineHours?.toString() || '48';
    case 'RFO_NUMBER':
      return context.rfoNumber || '';
    case 'DEAL_ID':
      return context.dealId || '';
    case 'CONTACT_NAME':
      return context.contactName || '';
    case 'OTIMA_CONTACT':
      return context.otimaContact || process.env.OTIMA_CONTACT_NAME || 'Equipe Ótima Energia';
    default:
      return '';
  }
}

// Replace all {{TOKEN}} patterns in a template
export function replaceTokens(template: string, context: TokenContext): string {
  if (!template) return '';
  
  let result = template;
  
  for (const token of SUPPORTED_TOKENS) {
    const pattern = new RegExp(`\\{\\{${token}\\}\\}`, 'g');
    const value = getTokenValue(token, context);
    result = result.replace(pattern, value);
  }
  
  return result;
}

// Find missing tokens that are required but have no value
export function findMissingTokens(template: string, context: TokenContext): TokenKey[] {
  const missing: TokenKey[] = [];
  
  for (const token of SUPPORTED_TOKENS) {
    const pattern = new RegExp(`\\{\\{${token}\\}\\}`);
    if (pattern.test(template)) {
      const value = getTokenValue(token, context);
      if (!value || value.trim() === '') {
        missing.push(token);
      }
    }
  }
  
  return missing;
}

// Build token context from RFO request and client data
export function buildTokenContext(data: {
  client?: {
    companyName?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
  };
  rfo?: {
    rfoNumber?: string;
    snapshotConsumptionKwh?: string | number;
    snapshotDemandaKw?: string | number;
    snapshotUc?: string;
    snapshotDistribuidora?: string;
    snapshotContractEnd?: string;
    responseDeadline?: string;
  };
  deal?: {
    id?: string;
    contractStartDate?: string;
    contractTermMonths?: number;
    productType?: string;
    submarket?: string;
  };
  supplierContact?: {
    name?: string;
  };
  consumptionData?: {
    annualMwh?: number;
    monthlyMwh?: number;
  };
}): TokenContext {
  const { client, rfo, deal, supplierContact, consumptionData } = data;
  
  // Calculate annual MWh from monthly consumption if available
  const monthlyKwh = rfo?.snapshotConsumptionKwh ? parseFloat(String(rfo.snapshotConsumptionKwh)) : undefined;
  const annualMwh = consumptionData?.annualMwh || (monthlyKwh ? (monthlyKwh * 12) / 1000 : undefined);
  const monthlyMwh = consumptionData?.monthlyMwh || (monthlyKwh ? monthlyKwh / 1000 : undefined);
  
  // Calculate deadline hours from response deadline
  let deadlineHours = 48; // default
  if (rfo?.responseDeadline) {
    const deadline = new Date(rfo.responseDeadline);
    const now = new Date();
    const hoursUntil = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
    deadlineHours = hoursUntil || 48;
  }
  
  return {
    clientName: client?.companyName,
    cnpj: client?.cnpj,
    ucs: rfo?.snapshotUc ? [rfo.snapshotUc] : undefined,
    distributor: rfo?.snapshotDistribuidora,
    submarket: deal?.submarket,
    annualMwh,
    monthlyMwh,
    demandKw: rfo?.snapshotDemandaKw ? parseFloat(String(rfo.snapshotDemandaKw)) : undefined,
    productType: deal?.productType,
    startDate: deal?.contractStartDate || rfo?.snapshotContractEnd,
    termMonths: deal?.contractTermMonths,
    deadlineHours,
    rfoNumber: rfo?.rfoNumber,
    dealId: deal?.id,
    contactName: supplierContact?.name,
    otimaContact: process.env.OTIMA_CONTACT_NAME || 'Equipe Ótima Energia',
  };
}

// Validate required fields against a schema
export interface RequiredFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'list' | 'dropdown';
  required: boolean;
  validation?: {
    regex?: string;
    min?: number;
    max?: number;
  };
  minItems?: number;
}

export interface RequiredAttachmentSchema {
  key: string;
  label: string;
  required: boolean;
}

export function validateRequiredFields(
  schema: RequiredFieldSchema[],
  values: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const field of schema) {
    if (!field.required) continue;
    
    const value = values[field.key];
    
    if (value === undefined || value === null || value === '') {
      missing.push(field.key);
      continue;
    }
    
    if (field.type === 'list' && Array.isArray(value)) {
      if (field.minItems && value.length < field.minItems) {
        missing.push(field.key);
      }
    }
    
    if (field.validation?.regex) {
      const regex = new RegExp(field.validation.regex);
      if (!regex.test(String(value))) {
        missing.push(field.key);
      }
    }
  }
  
  return { valid: missing.length === 0, missing };
}

export function validateRequiredAttachments(
  schema: RequiredAttachmentSchema[],
  attachments: { key: string; docId: number | string }[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const attachedKeys = new Set(attachments.map(a => a.key));
  
  for (const attachment of schema) {
    if (attachment.required && !attachedKeys.has(attachment.key)) {
      missing.push(attachment.key);
    }
  }
  
  return { valid: missing.length === 0, missing };
}
