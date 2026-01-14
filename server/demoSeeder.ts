import { db } from "./db";
import {
  clients,
  suppliers,
  deals,
  dealQuotes,
  dealCommissionEvents,
  clientUsagePeriods,
  dealCases,
  clientDossiers,
  rfqDispatches,
  supplierRfqPlaybooks,
  dealProposals,
  dealProposalItems,
  dealProposalSnapshots,
  dealProposalViews,
  dealEcosSnapshots,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

const DEMO_PREFIX = "DEMO_";

function generateDemoId(prefix: string, index: number): string {
  return `${DEMO_PREFIX}${prefix}_${String(index).padStart(3, '0')}`;
}

function generateScenarioId(scenario: string, prefix: string, index: number): string {
  return `${DEMO_PREFIX}${scenario}_${prefix}_${String(index).padStart(3, '0')}`;
}

// Scenario pack types
export type ScenarioPack = 
  | 'FULL_DATASET'
  | 'HAPPY_PATH'
  | 'SLA_BREACH'
  | 'CREDIT_REJECTED'
  | 'WRONG_SIGNER'
  | 'COMMISSION_DISPUTE'
  | 'OVERDUE_PAYMENT'
  | 'ASSEMBLY_STUCK';

export const SCENARIO_PACK_LABELS: Record<ScenarioPack, string> = {
  FULL_DATASET: 'Full Demo Dataset',
  HAPPY_PATH: 'Happy Path Deal',
  SLA_BREACH: 'Supplier Silent / SLA Breach',
  CREDIT_REJECTED: 'Credit Rejected After Selection',
  WRONG_SIGNER: 'Wrong Signer Risk',
  COMMISSION_DISPUTE: 'Commission Dispute',
  OVERDUE_PAYMENT: 'Overdue Payment Recovery',
  ASSEMBLY_STUCK: 'Assembly Stuck States (3 deals)',
};

const brazilianCompanyNames = [
  "TEST - Indústria Metalúrgica São Paulo",
  "TEST - Têxteis Brasil Ltda",
  "TEST - Agroindústria Norte",
  "TEST - Plásticos do Sul",
  "TEST - Construtora Horizonte",
  "TEST - Supermercados União",
  "TEST - Química Verde Industrial",
  "TEST - Frigorífico Bovinos",
  "TEST - Cerâmica Minas",
  "TEST - Papel e Celulose Amazônia"
];

const supplierNames = [
  "DEMO - Eneva Energia",
  "DEMO - Comerc ESCO",
  "DEMO - Âmbar Energia",
  "DEMO - Atlas Energia",
  "DEMO - Prime Energy",
  "DEMO - Tradener",
  "DEMO - Omega Energia",
  "DEMO - CPFL Soluções"
];

const submarkets = ["SE/CO", "S", "NE", "N"];
const distributors = ["CPFL", "Cemig", "Light", "Energisa", "CELPE", "COPEL", "Eletropaulo", "RGE"];
const tariffClasses = ["A4", "A3", "A2", "AS"];
const eligibilityTypes = ["ACL_DIRECT", "ACL_VAREJISTA", "NOT_ELIGIBLE_YET"];
const channels = ["EMAIL", "WHATSAPP", "PORTAL", "MANUAL"];

// Helper to create base client
async function createDemoClient(name: string, index: number) {
  const [client] = await db.insert(clients).values({
    companyName: name,
    cnpj: `${10 + index}.${100 + index * 3}.${200 + index * 5}/0001-${50 + index}`,
    contactPerson: `Contato ${index + 1}`,
    email: `contato${index + 1}@demo-company.com.br`,
    phone: `+55 11 9${String(1000 + index * 111).padStart(4, '0')}-${String(2000 + index * 222).padStart(4, '0')}`,
    status: "prospect",
    ucCode: `UC${1000 + index}`,
    segment: ["SME", "Industrial"][index % 2],
    region: ["Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"][index % 5],
    avgConsumptionKwh: 80000 + index * 20000,
    isDemo: true,
  }).returning();
  return client;
}

// Helper to create base supplier
async function createDemoSupplier(name: string, index: number) {
  const [supplier] = await db.insert(suppliers).values({
    name,
    shortCode: `DEMO_${name.replace(/DEMO - /, '').substring(0, 4).toUpperCase()}${index}`,
    category: ["large", "medium", "renewable"][index % 3],
    contactEmail: `comercial@${name.toLowerCase().replace(/demo - |\s+/g, '')}.com.br`,
    contactPhone: `+55 21 9${String(3000 + index * 100).padStart(4, '0')}-${String(4000 + index * 100).padStart(4, '0')}`,
    isActive: true,
    isDemo: true,
  }).returning();
  return supplier;
}

// Helper to create playbook
async function createDemoPlaybook(supplierId: number, index: number) {
  const [playbook] = await db.insert(supplierRfqPlaybooks).values({
    supplierId,
    version: 1,
    status: "ACTIVE" as const,
    preferredChannel: channels[index % channels.length],
    requiredFields: ["ucCodes", "demandKw", "monthlyMwh", "contractMonths"],
    emailConfig: {
      toEmails: [`supplier${index}@demo.com`],
      subjectTemplate: "RFQ - {{clientName}} - {{volume}}MWh/mês",
      bodyTemplate: "Solicitamos cotação para:\n- Cliente: {{clientName}}\n- Volume: {{volume}} MWh/mês",
    },
    slaConfig: { quoteDueHours: 48, followupCadenceHours: [24, 48] },
    internalNotes: `Demo playbook ${index}`,
    isDemo: true,
  }).returning();
  return playbook;
}

// ========== SCENARIO: HAPPY PATH ==========
async function seedHappyPath(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  // Create client
  const client = await createDemoClient("TEST - Happy Path Corp", 100);
  summary.clients = 1;
  
  // Create 3 suppliers
  const supplierList = [];
  for (let i = 0; i < 3; i++) {
    const supplier = await createDemoSupplier(`DEMO - Supplier Happy ${i + 1}`, 100 + i);
    supplierList.push(supplier);
    await createDemoPlaybook(supplier.id, 100 + i);
  }
  summary.suppliers = 3;
  summary.playbooks = 3;
  
  // Create dossier (LOCKED - ready for RFQ)
  const [dossier] = await db.insert(clientDossiers).values({
    clientId: client.id,
    legalName: client.companyName,
    tradeName: "Happy Path",
    cnpj: client.cnpj!,
    distributor: "CPFL",
    submarket: "SE/CO",
    connectionType: "GROUP_A",
    eligibilityType: "ACL_DIRECT",
    annualConsumptionMWh: 1200,
    averageMonthlyMWh: 100,
    peakDemandKW: 250,
    numberOfUCs: 1,
    tariffClass: "A4",
    confidenceScore: "HIGH",
    status: "LOCKED",
    isDemo: true,
  }).returning();
  summary.dossiers = 1;
  
  // Create deal in CLOSED_WON state
  const [deal] = await db.insert(deals).values({
    id: generateScenarioId("HP", "DEAL", 1),
    clientId: client.id,
    status: "CLOSED_WON",
    volumeMwhYear: 1200,
    volumeMwhMonth: 100,
    contractTermMonths: 36,
    contractStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    energyType: "convencional",
    submarket: "SE/CO",
    internalOwner: "Renan",
    isDemo: true,
  }).returning();
  summary.deals = 1;
  
  // Create RFQ dispatches with responses
  for (let i = 0; i < 3; i++) {
    const supplier = supplierList[i];
    const [dispatch] = await db.insert(rfqDispatches).values({
      dealId: deal.id,
      supplierId: supplier.id,
      channelUsed: "EMAIL",
      status: "RESPONDED",
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      messageSubject: `RFQ - Happy Path - 100MWh/mês`,
      isDemo: true,
    }).returning();
    
    // Create quotes (winner is first supplier)
    await db.insert(dealQuotes).values({
      dealId: deal.id,
      supplierId: supplier.id,
      rfqDispatchId: dispatch.id,
      rawQuoteJson: { pricePerMwh: 180 + i * 10, term: 36 },
      baseEnergyPriceRmwh: parseFloat((180 + i * 10).toFixed(2)),
      energyType: "convencional",
      priceStructure: "fixed",
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      quoteNotes: i === 0 ? "WINNER - Best price" : "Competitive quote",
      isNormalized: true,
      normalizationConfidence: 0.95,
      isDemo: true,
    });
  }
  summary.dispatches = 3;
  summary.quotes = 3;
  
  // Create milestone-based commission events (50/50 model)
  await db.insert(dealCommissionEvents).values([
    {
      dealId: deal.id,
      eventType: "MILESTONE_1" as const,
      eventIndex: 0,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 5000, volume_mwh: 1200, percent: 50 },
      amountBrl: 5000,
      isEstimated: false,
      dueCondition: "CONTRACT_SIGNED",
      paymentTrigger: "50% due on Contract Signed",
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "CONFIRMED" as const,
      confirmedAt: new Date(),
      notes: "M1: Contract Signed - 50% milestone",
      isDemo: true,
    },
    {
      dealId: deal.id,
      eventType: "MILESTONE_2" as const,
      eventIndex: 1,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 5000, volume_mwh: 1200, percent: 50 },
      amountBrl: 5000,
      isEstimated: false,
      dueCondition: "SUPPLY_LIVE",
      paymentTrigger: "50% due on CCEE Activation / Supply Live",
      expectedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "PENDING" as const,
      notes: "M2: Supply Live - 50% milestone",
      isDemo: true,
    }
  ]);
  summary.commissionEvents = 2;
  
  // ========== PROPOSALS ==========
  // Get the quotes we just created
  const quotes = await db.select().from(dealQuotes).where(eq(dealQuotes.dealId, deal.id));
  
  // Proposal 1: GENERATED (PDF ready)
  const proposal1PublicId = randomBytes(8).toString('hex');
  const [proposal1] = await db.insert(dealProposals).values({
    dealId: deal.id,
    clientId: client.id,
    publicId: proposal1PublicId,
    title: "Proposta Comercial - Happy Path Corp",
    status: "GENERATED",
    publicEnabled: true,
    viewCount: 0,
    isDemo: true,
  }).returning();
  
  // Add items to proposal 1
  if (quotes.length > 0) {
    await db.insert(dealProposalItems).values({
      proposalId: proposal1.id,
      dealQuoteId: quotes[0].id,
      supplierId: quotes[0].supplierId,
      supplierName: supplierList[0].name,
      productType: "CONVENCIONAL",
      marginType: "ADD_R_PER_MWH",
      marginValue: "5.00",
      finalEnergyPriceRmwh: "185.00",
      isRecommended: true,
      publicNotes: "Melhor custo-benefício",
      isDemo: true,
    });
    
    // Create snapshot for proposal 1
    const snapshot1Data = {
      proposal: proposal1,
      items: [{
        supplierName: supplierList[0].name,
        productType: "CONVENCIONAL",
        finalEnergyPriceRmwh: "185.00",
        isRecommended: true,
        publicNotes: "Melhor custo-benefício"
      }],
      client: { name: client.contactPerson, company: client.companyName },
      generatedAt: new Date().toISOString()
    };
    const hash1 = randomBytes(32).toString('hex');
    await db.insert(dealProposalSnapshots).values({
      proposalId: proposal1.id,
      snapshotJson: snapshot1Data,
      sha256Hash: hash1,
      createdByUserId: null,
      isDemo: true,
    });
  }
  
  // Proposal 2: GENERATED (second one)
  const proposal2PublicId = randomBytes(8).toString('hex');
  const [proposal2] = await db.insert(dealProposals).values({
    dealId: deal.id,
    clientId: client.id,
    publicId: proposal2PublicId,
    title: "Proposta Alternativa - Happy Path Corp",
    status: "GENERATED",
    publicEnabled: true,
    viewCount: 0,
    isDemo: true,
  }).returning();
  
  if (quotes.length > 1) {
    await db.insert(dealProposalItems).values({
      proposalId: proposal2.id,
      dealQuoteId: quotes[1].id,
      supplierId: quotes[1].supplierId,
      supplierName: supplierList[1].name,
      productType: "CONVENCIONAL",
      marginType: "ADD_PERCENT",
      marginValue: "3.00",
      finalEnergyPriceRmwh: "195.70",
      isRecommended: true,
      publicNotes: "Opção premium com garantias extras",
      isDemo: true,
    });
    
    const snapshot2Data = {
      proposal: proposal2,
      items: [{
        supplierName: supplierList[1].name,
        productType: "CONVENCIONAL",
        finalEnergyPriceRmwh: "195.70",
        isRecommended: true,
        publicNotes: "Opção premium com garantias extras"
      }],
      client: { name: client.contactPerson, company: client.companyName },
      generatedAt: new Date().toISOString()
    };
    const hash2 = randomBytes(32).toString('hex');
    await db.insert(dealProposalSnapshots).values({
      proposalId: proposal2.id,
      snapshotJson: snapshot2Data,
      sha256Hash: hash2,
      createdByUserId: null,
      isDemo: true,
    });
  }
  
  // Proposal 3: SENT
  const proposal3PublicId = randomBytes(8).toString('hex');
  const [proposal3] = await db.insert(dealProposals).values({
    dealId: deal.id,
    clientId: client.id,
    publicId: proposal3PublicId,
    title: "Proposta Enviada - Happy Path Corp",
    status: "SENT",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    publicEnabled: true,
    viewCount: 0,
    isDemo: true,
  }).returning();
  
  // Proposal 4: VIEWED (with view records)
  const proposal4PublicId = randomBytes(8).toString('hex');
  const [proposal4] = await db.insert(dealProposals).values({
    dealId: deal.id,
    clientId: client.id,
    publicId: proposal4PublicId,
    title: "Proposta Visualizada - Happy Path Corp",
    status: "VIEWED",
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    publicEnabled: true,
    viewCount: 3,
    isDemo: true,
  }).returning();
  
  // Add view records
  await db.insert(dealProposalViews).values([
    {
      proposalId: proposal4.id,
      ipHash: randomBytes(8).toString('hex'),
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
      referrer: "https://mail.google.com",
      isDemo: true,
    },
    {
      proposalId: proposal4.id,
      ipHash: randomBytes(8).toString('hex'),
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1",
      referrer: null,
      isDemo: true,
    },
    {
      proposalId: proposal4.id,
      ipHash: randomBytes(8).toString('hex'),
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/17.0",
      referrer: "https://outlook.office.com",
      isDemo: true,
    }
  ]);
  
  // Proposal 5: DRAFT
  const proposal5PublicId = randomBytes(8).toString('hex');
  await db.insert(dealProposals).values({
    dealId: deal.id,
    clientId: client.id,
    publicId: proposal5PublicId,
    title: "Proposta em Rascunho - Happy Path Corp",
    status: "DRAFT",
    publicEnabled: false,
    viewCount: 0,
    isDemo: true,
  });
  
  summary.proposals = 5;
  summary.proposalViews = 3;
  
  // ========== ECOS SNAPSHOTS ==========
  // ECOS Snapshot 1: WITHIN_BAND, HIGH confidence
  await db.insert(dealEcosSnapshots).values({
    dealId: deal.id,
    version: 1,
    triggerType: "MANUAL",
    inputData: {
      submarket: "SE/CO",
      distributor: "CPFL",
      segment: "Industrial",
      volumeMwh12m: 1200,
      demandKw: 250,
      clientCurrentPriceRmwh: 195.00
    },
    benchmarkMatch: {
      benchmarkId: 1,
      segment: "Industrial",
      region: "SE/CO",
      lowerBoundRmwh: 175.00,
      upperBoundRmwh: 210.00,
      confidence: 0.92
    },
    results: {
      clientEstimatedPriceRmwh: 195.00,
      gapPercent: 0,
      potentialSavingsMin: 0,
      potentialSavingsMax: 18000
    },
    status: "WITHIN_BAND",
    confidenceLevel: "HIGH",
    confidenceReasons: [
      { factor: "Multiple PRCs available", impact: "positive", descriptionPt: "Múltiplos PRCs disponíveis" },
      { factor: "Recent benchmark data", impact: "positive", descriptionPt: "Dados de benchmark recentes" },
      { factor: "Segment match exact", impact: "positive", descriptionPt: "Correspondência exata do segmento" }
    ],
    recommendedNextStep: "WAIT",
    talkTrack: "Client is within market band - no urgent action needed",
    talkTrackPt: "Cliente está dentro da faixa de mercado - sem ação urgente necessária",
    isDemo: true,
  });
  
  // ECOS Snapshot 2: ABOVE_BAND, MEDIUM confidence
  await db.insert(dealEcosSnapshots).values({
    dealId: deal.id,
    version: 2,
    triggerType: "BILL_UPLOAD",
    inputData: {
      submarket: "SE/CO",
      distributor: "CPFL",
      segment: "Industrial",
      volumeMwh12m: 1200,
      demandKw: 250,
      clientCurrentPriceRmwh: 245.00
    },
    benchmarkMatch: {
      benchmarkId: 1,
      segment: "Industrial",
      region: "SE/CO",
      lowerBoundRmwh: 175.00,
      upperBoundRmwh: 210.00,
      confidence: 0.78
    },
    results: {
      clientEstimatedPriceRmwh: 245.00,
      gapPercent: 16.7,
      potentialSavingsMin: 42000,
      potentialSavingsMax: 84000
    },
    status: "ABOVE_BAND",
    confidenceLevel: "MEDIUM",
    confidenceReasons: [
      { factor: "Benchmark 45 days old", impact: "negative", descriptionPt: "Benchmark com 45 dias" },
      { factor: "Single bill analyzed", impact: "negative", descriptionPt: "Apenas uma fatura analisada" },
      { factor: "Segment match partial", impact: "positive", descriptionPt: "Correspondência parcial do segmento" }
    ],
    recommendedNextStep: "REQUEST_RFQ",
    talkTrack: "Client is paying above market - recommend RFQ process",
    talkTrackPt: "Cliente está pagando acima do mercado - recomenda-se processo de RFQ",
    isDemo: true,
  });
  
  // ECOS Snapshot 3: NO_DATA, LOW confidence
  await db.insert(dealEcosSnapshots).values({
    dealId: deal.id,
    version: 3,
    triggerType: "MANUAL",
    inputData: {
      submarket: "N",
      distributor: "Equatorial",
      segment: "Commercial",
      volumeMwh12m: 600,
      demandKw: 120,
      clientCurrentPriceRmwh: null
    },
    benchmarkMatch: null,
    results: {
      clientEstimatedPriceRmwh: null,
      gapPercent: null,
      potentialSavingsMin: null,
      potentialSavingsMax: null
    },
    status: "NO_DATA",
    confidenceLevel: "LOW",
    confidenceReasons: [
      { factor: "No benchmark for region", impact: "negative", descriptionPt: "Sem benchmark para a região" },
      { factor: "No billing data provided", impact: "negative", descriptionPt: "Dados de fatura não fornecidos" },
      { factor: "Small sample size", impact: "negative", descriptionPt: "Amostra pequena" }
    ],
    recommendedNextStep: "NEED_MORE_DATA",
    talkTrack: "Insufficient data for analysis - need more billing information",
    talkTrackPt: "Dados insuficientes para análise - necessário mais informações de fatura",
    isDemo: true,
  });
  
  summary.ecosSnapshots = 3;
  
  return summary;
}

// ========== SCENARIO: SLA BREACH ==========
async function seedSlaBreach(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  const client = await createDemoClient("TEST - SLA Breach Client", 200);
  summary.clients = 1;
  
  // Create 3 suppliers - one will be silent
  const supplierList = [];
  for (let i = 0; i < 3; i++) {
    const supplier = await createDemoSupplier(`DEMO - Supplier SLA ${i + 1}`, 200 + i);
    supplierList.push(supplier);
    await createDemoPlaybook(supplier.id, 200 + i);
  }
  summary.suppliers = 3;
  summary.playbooks = 3;
  
  // Create dossier
  const [dossier] = await db.insert(clientDossiers).values({
    clientId: client.id,
    legalName: client.companyName,
    tradeName: "SLA Test",
    cnpj: client.cnpj!,
    distributor: "Cemig",
    submarket: "SE/CO",
    connectionType: "GROUP_A",
    eligibilityType: "ACL_DIRECT",
    annualConsumptionMWh: 800,
    averageMonthlyMWh: 66.67,
    peakDemandKW: 180,
    numberOfUCs: 1,
    tariffClass: "A4",
    confidenceScore: "MEDIUM",
    status: "LOCKED",
    isDemo: true,
  }).returning();
  summary.dossiers = 1;
  
  // Create deal in RFQ_SENT state
  const [deal] = await db.insert(deals).values({
    id: generateScenarioId("SLA", "DEAL", 1),
    clientId: client.id,
    status: "RFQ_SENT",
    volumeMwhYear: 800,
    volumeMwhMonth: parseFloat((800 / 12).toFixed(2)),
    contractTermMonths: 24,
    contractStartDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    energyType: "incentivada_50",
    submarket: "SE/CO",
    internalOwner: "Renan",
    isDemo: true,
  }).returning();
  summary.deals = 1;
  
  // Create RFQ dispatches - supplier 0 is OVERDUE (SLA breach)
  for (let i = 0; i < 3; i++) {
    const supplier = supplierList[i];
    const isOverdue = i === 0;
    await db.insert(rfqDispatches).values({
      dealId: deal.id,
      supplierId: supplier.id,
      channelUsed: "EMAIL",
      status: isOverdue ? "SENT" : "RESPONDED",
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      respondedAt: isOverdue ? null : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // PAST DUE
      followupCount: isOverdue ? 2 : 0,
      messageSubject: `RFQ - SLA Test - ${Math.round(800/12)}MWh/mês`,
      isDemo: true,
    });
  }
  summary.dispatches = 3;
  
  // Create case for SLA breach
  await db.insert(dealCases).values({
    dealId: deal.id,
    caseType: "SUPPLIER_ISSUE",
    severity: "HIGH",
    status: "OPEN",
    nextActionDate: new Date().toISOString().split('T')[0],
    slaDueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rootCause: "Supplier not responding - SLA breach",
    isDemo: true,
  });
  summary.cases = 1;
  
  return summary;
}

// ========== SCENARIO: CREDIT REJECTED ==========
async function seedCreditRejected(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  const client = await createDemoClient("TEST - Credit Rejected Corp", 300);
  summary.clients = 1;
  
  const supplier = await createDemoSupplier("DEMO - Supplier Credit", 300);
  await createDemoPlaybook(supplier.id, 300);
  summary.suppliers = 1;
  summary.playbooks = 1;
  
  // Create dossier
  await db.insert(clientDossiers).values({
    clientId: client.id,
    legalName: client.companyName,
    tradeName: "Credit Test",
    cnpj: client.cnpj!,
    distributor: "Light",
    submarket: "SE/CO",
    connectionType: "GROUP_A",
    eligibilityType: "ACL_DIRECT",
    annualConsumptionMWh: 600,
    averageMonthlyMWh: 50,
    peakDemandKW: 120,
    numberOfUCs: 1,
    tariffClass: "A4",
    confidenceScore: "LOW",
    status: "LOCKED",
    isDemo: true,
  });
  summary.dossiers = 1;
  
  // Create deal - blocked at PROPOSAL due to credit rejection
  const [deal] = await db.insert(deals).values({
    id: generateScenarioId("CR", "DEAL", 1),
    clientId: client.id,
    status: "PROPOSAL",
    volumeMwhYear: 600,
    volumeMwhMonth: 50,
    contractTermMonths: 12,
    contractStartDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    energyType: "convencional",
    submarket: "SE/CO",
    internalOwner: "Renan",
    isDemo: true,
  }).returning();
  summary.deals = 1;
  
  // Create dispatch and quote
  const [dispatch] = await db.insert(rfqDispatches).values({
    dealId: deal.id,
    supplierId: supplier.id,
    channelUsed: "EMAIL",
    status: "RESPONDED",
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    messageSubject: "RFQ - Credit Test",
    isDemo: true,
  }).returning();
  summary.dispatches = 1;
  
  await db.insert(dealQuotes).values({
    dealId: deal.id,
    supplierId: supplier.id,
    rfqDispatchId: dispatch.id,
    rawQuoteJson: { pricePerMwh: 195, term: 12 },
    baseEnergyPriceRmwh: 195,
    energyType: "convencional",
    priceStructure: "fixed",
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quoteNotes: "Selected quote - pending credit approval",
    isNormalized: true,
    normalizationConfidence: 0.92,
    isDemo: true,
  });
  summary.quotes = 1;
  
  // Create case for credit rejection
  await db.insert(dealCases).values({
    dealId: deal.id,
    caseType: "DOCUMENTATION_MISSING",
    severity: "CRITICAL",
    status: "IN_PROGRESS",
    nextActionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    slaDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rootCause: "Client credit rejected by supplier - requires guarantee or upfront payment",
    isDemo: true,
  });
  summary.cases = 1;
  
  return summary;
}

// ========== SCENARIO: WRONG SIGNER ==========
async function seedWrongSigner(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  const client = await createDemoClient("TEST - Wrong Signer Ltd", 400);
  summary.clients = 1;
  
  const supplier = await createDemoSupplier("DEMO - Supplier Signer", 400);
  await createDemoPlaybook(supplier.id, 400);
  summary.suppliers = 1;
  summary.playbooks = 1;
  
  // Create dossier with missing authority verification
  await db.insert(clientDossiers).values({
    clientId: client.id,
    legalName: client.companyName,
    tradeName: "Signer Test",
    cnpj: client.cnpj!,
    distributor: "Energisa",
    submarket: "NE",
    connectionType: "GROUP_A",
    eligibilityType: "ACL_DIRECT",
    annualConsumptionMWh: 900,
    averageMonthlyMWh: 75,
    peakDemandKW: 200,
    numberOfUCs: 2,
    tariffClass: "A3",
    confidenceScore: "MEDIUM",
    status: "DRAFT", // Still DRAFT because signer verification missing
    isDemo: true,
  });
  summary.dossiers = 1;
  
  // Create deal - blocked at DOC_COLLECTION
  const [deal] = await db.insert(deals).values({
    id: generateScenarioId("WS", "DEAL", 1),
    clientId: client.id,
    status: "DOC_COLLECTION",
    volumeMwhYear: 900,
    volumeMwhMonth: 75,
    contractTermMonths: 36,
    contractStartDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    energyType: "incentivada_100",
    submarket: "NE",
    internalOwner: "Renan",
    isDemo: true,
  }).returning();
  summary.deals = 1;
  
  // Create case for wrong signer risk
  await db.insert(dealCases).values({
    dealId: deal.id,
    caseType: "DOCUMENTATION_MISSING",
    severity: "HIGH",
    status: "OPEN",
    nextActionDate: new Date().toISOString().split('T')[0],
    slaDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rootCause: "Signer authority not verified - need power of attorney or board resolution",
    isDemo: true,
  });
  summary.cases = 1;
  
  return summary;
}

// ========== SCENARIO: COMMISSION DISPUTE ==========
async function seedCommissionDispute(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  const client = await createDemoClient("TEST - Commission Dispute Inc", 500);
  summary.clients = 1;
  
  const supplier = await createDemoSupplier("DEMO - Supplier Commission", 500);
  await createDemoPlaybook(supplier.id, 500);
  summary.suppliers = 1;
  summary.playbooks = 1;
  
  // Create dossier
  await db.insert(clientDossiers).values({
    clientId: client.id,
    legalName: client.companyName,
    tradeName: "Commission Test",
    cnpj: client.cnpj!,
    distributor: "COPEL",
    submarket: "S",
    connectionType: "GROUP_A",
    eligibilityType: "ACL_DIRECT",
    annualConsumptionMWh: 1500,
    averageMonthlyMWh: 125,
    peakDemandKW: 320,
    numberOfUCs: 3,
    tariffClass: "A4",
    confidenceScore: "HIGH",
    status: "LOCKED",
    isDemo: true,
  });
  summary.dossiers = 1;
  
  // Create closed won deal
  const [deal] = await db.insert(deals).values({
    id: generateScenarioId("CD", "DEAL", 1),
    clientId: client.id,
    status: "CLOSED_WON",
    volumeMwhYear: 1500,
    volumeMwhMonth: 125,
    contractTermMonths: 48,
    contractStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    energyType: "convencional",
    submarket: "S",
    internalOwner: "Renan",
    isDemo: true,
  }).returning();
  summary.deals = 1;
  
  // Create dispatch and quote
  const [dispatch] = await db.insert(rfqDispatches).values({
    dealId: deal.id,
    supplierId: supplier.id,
    channelUsed: "EMAIL",
    status: "RESPONDED",
    sentAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    respondedAt: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000),
    isDemo: true,
  }).returning();
  summary.dispatches = 1;
  
  await db.insert(dealQuotes).values({
    dealId: deal.id,
    supplierId: supplier.id,
    rfqDispatchId: dispatch.id,
    rawQuoteJson: { pricePerMwh: 175, term: 48 },
    baseEnergyPriceRmwh: 175,
    energyType: "convencional",
    priceStructure: "fixed",
    validUntil: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quoteNotes: "Winner quote",
    isNormalized: true,
    normalizationConfidence: 0.98,
    isDemo: true,
  });
  summary.quotes = 1;
  
  // Create milestone-based commission events with disputed adjustment
  await db.insert(dealCommissionEvents).values([
    {
      dealId: deal.id,
      eventType: "MILESTONE_1" as const,
      eventIndex: 0,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 7500, percent: 50 },
      amountBrl: 7500,
      isEstimated: false,
      dueCondition: "CONTRACT_SIGNED",
      paymentTrigger: "50% due on Contract Signed",
      expectedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "PAID" as const,
      paidDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "M1: Contract Signed - Paid",
      isDemo: true,
    },
    {
      dealId: deal.id,
      eventType: "MILESTONE_2" as const,
      eventIndex: 1,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 7500, percent: 50 },
      amountBrl: 7500,
      isEstimated: false,
      dueCondition: "SUPPLY_LIVE",
      paymentTrigger: "50% due on CCEE Activation / Supply Live",
      expectedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "PAID" as const,
      paidDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "M2: Supply Live - Paid",
      isDemo: true,
    },
    {
      dealId: deal.id,
      eventType: "ADJUSTMENT" as const,
      eventIndex: 2,
      calcType: "per_mwh",
      calcInputs: { volume_mwh: 125, rate_rmwh: 2.8 },
      amountBrl: 350,
      isEstimated: false,
      dueCondition: "ADJUSTMENT",
      paymentTrigger: "Volume adjustment based on usage reconciliation",
      expectedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "DISPUTED" as const,
      notes: "DISPUTED - Supplier claims lower volume consumed (112 MWh vs 125 MWh contracted)",
      isDemo: true,
    }
  ]);
  summary.commissionEvents = 3;
  
  // Create case for dispute
  await db.insert(dealCases).values({
    dealId: deal.id,
    caseType: "PRICING_DISPUTE",
    severity: "MED",
    status: "IN_PROGRESS",
    nextActionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    slaDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rootCause: "Supplier disputes consumed volume - need usage data reconciliation",
    isDemo: true,
  });
  summary.cases = 1;
  
  // Create usage periods for reconciliation
  for (let month = 0; month < 3; month++) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - month - 1);
    startDate.setDate(1);
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    
    await db.insert(clientUsagePeriods).values({
      clientId: client.id,
      ucCode: `UC${client.id}001`,
      periodStartDate: startDate.toISOString().split('T')[0],
      periodEndDate: endDate.toISOString().split('T')[0],
      energyKwh: parseFloat((110000 + Math.random() * 30000).toFixed(2)),
      demandKw: parseFloat((280 + Math.random() * 40).toFixed(2)),
      billedAmountBrl: parseFloat((20000 + Math.random() * 5000).toFixed(2)),
      sourceType: "EXTRACTED" as const,
      status: month === 1 ? "DRAFT" : "VERIFIED",
      notes: month === 1 ? "Disputed period - needs verification" : "Verified usage",
      isDemo: true,
    });
  }
  summary.usagePeriods = 3;
  
  return summary;
}

// ========== SCENARIO: OVERDUE PAYMENT ==========
async function seedOverduePayment(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  const client = await createDemoClient("TEST - Overdue Payment SA", 600);
  summary.clients = 1;
  
  const supplier = await createDemoSupplier("DEMO - Supplier Overdue", 600);
  await createDemoPlaybook(supplier.id, 600);
  summary.suppliers = 1;
  summary.playbooks = 1;
  
  // Create dossier
  await db.insert(clientDossiers).values({
    clientId: client.id,
    legalName: client.companyName,
    tradeName: "Overdue Test",
    cnpj: client.cnpj!,
    distributor: "RGE",
    submarket: "S",
    connectionType: "GROUP_A",
    eligibilityType: "ACL_DIRECT",
    annualConsumptionMWh: 1000,
    averageMonthlyMWh: 83.33,
    peakDemandKW: 220,
    numberOfUCs: 1,
    tariffClass: "A4",
    confidenceScore: "HIGH",
    status: "LOCKED",
    isDemo: true,
  });
  summary.dossiers = 1;
  
  // Create closed won deal (older)
  const [deal] = await db.insert(deals).values({
    id: generateScenarioId("OP", "DEAL", 1),
    clientId: client.id,
    status: "CLOSED_WON",
    volumeMwhYear: 1000,
    volumeMwhMonth: 83.33,
    contractTermMonths: 24,
    contractStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    energyType: "convencional",
    submarket: "S",
    internalOwner: "Renan",
    isDemo: true,
  }).returning();
  summary.deals = 1;
  
  // Create dispatch and quote
  const [dispatch] = await db.insert(rfqDispatches).values({
    dealId: deal.id,
    supplierId: supplier.id,
    channelUsed: "EMAIL",
    status: "RESPONDED",
    sentAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    respondedAt: new Date(Date.now() - 195 * 24 * 60 * 60 * 1000),
    isDemo: true,
  }).returning();
  summary.dispatches = 1;
  
  await db.insert(dealQuotes).values({
    dealId: deal.id,
    supplierId: supplier.id,
    rfqDispatchId: dispatch.id,
    rawQuoteJson: { pricePerMwh: 185, term: 24 },
    baseEnergyPriceRmwh: 185,
    energyType: "convencional",
    priceStructure: "fixed",
    validUntil: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quoteNotes: "Winner quote",
    isNormalized: true,
    normalizationConfidence: 0.96,
    isDemo: true,
  });
  summary.quotes = 1;
  
  // Create milestone-based commission events with OVERDUE adjustment
  await db.insert(dealCommissionEvents).values([
    {
      dealId: deal.id,
      eventType: "MILESTONE_1" as const,
      eventIndex: 0,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 4000, percent: 50 },
      amountBrl: 4000,
      isEstimated: false,
      dueCondition: "CONTRACT_SIGNED",
      paymentTrigger: "50% due on Contract Signed",
      expectedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "PAID" as const,
      paidDate: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "M1: Contract Signed - Paid",
      isDemo: true,
    },
    {
      dealId: deal.id,
      eventType: "MILESTONE_2" as const,
      eventIndex: 1,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 4000, percent: 50 },
      amountBrl: 4000,
      isEstimated: false,
      dueCondition: "SUPPLY_LIVE",
      paymentTrigger: "50% due on CCEE Activation / Supply Live",
      expectedDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "PAID" as const,
      paidDate: new Date(Date.now() - 145 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "M2: Supply Live - Paid",
      isDemo: true,
    },
    {
      dealId: deal.id,
      eventType: "ADJUSTMENT" as const,
      eventIndex: 2,
      calcType: "per_mwh",
      calcInputs: { volume_mwh: 622.50, rate_rmwh: 2.5 },
      amountBrl: 622.50,
      isEstimated: false,
      dueCondition: "ADJUSTMENT",
      paymentTrigger: "Volume adjustment for usage reconciliation",
      expectedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "OVERDUE" as const,
      notes: "OVERDUE - Adjustment not paid (60 days overdue)",
      isDemo: true,
    }
  ]);
  summary.commissionEvents = 3;
  
  // Create case for overdue recovery
  await db.insert(dealCases).values({
    dealId: deal.id,
    caseType: "CONTRACT_DELAY",
    severity: "CRITICAL",
    status: "IN_PROGRESS",
    nextActionDate: new Date().toISOString().split('T')[0],
    slaDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rootCause: "3 months of commission payments overdue - total R$ 622.50 outstanding",
    isDemo: true,
  });
  summary.cases = 1;
  
  return summary;
}

// ========== FULL DATASET (Original) ==========
async function seedFullDataset(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  // Create clients
  const demoClients = [];
  for (let i = 0; i < 10; i++) {
    const client = {
      companyName: brazilianCompanyNames[i],
      cnpj: `${10 + i}.${100 + i * 3}.${200 + i * 5}/0001-${50 + i}`,
      contactPerson: `Contato ${i + 1}`,
      email: `contato${i + 1}@demo-company.com.br`,
      phone: `+55 11 9${String(1000 + i * 111).padStart(4, '0')}-${String(2000 + i * 222).padStart(4, '0')}`,
      status: ["prospect", "awaiting_quote", "negotiating", "active"][i % 4],
      ucCode: `UC${1000 + i}`,
      segment: ["SME", "Industrial"][i % 2],
      region: ["Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"][i % 5],
      avgConsumptionKwh: 80000 + i * 20000,
      isDemo: true,
    };
    demoClients.push(client);
  }
  
  const insertedClients = await db.insert(clients).values(demoClients).returning();
  summary.clients = insertedClients.length;

  // Create suppliers
  const demoSuppliers = [];
  for (let i = 0; i < supplierNames.length; i++) {
    const supplier = {
      name: supplierNames[i],
      shortCode: `DEMO_${supplierNames[i].replace(/DEMO - /, '').substring(0, 4).toUpperCase()}${i}`,
      category: ["large", "medium", "renewable"][i % 3],
      contactEmail: `comercial@${supplierNames[i].toLowerCase().replace(/demo - |\s+/g, '')}.com.br`,
      contactPhone: `+55 21 9${String(3000 + i * 100).padStart(4, '0')}-${String(4000 + i * 100).padStart(4, '0')}`,
      isActive: true,
      isDemo: true,
    };
    demoSuppliers.push(supplier);
  }
  
  const insertedSuppliers = await db.insert(suppliers).values(demoSuppliers).returning();
  summary.suppliers = insertedSuppliers.length;

  // Create deals across all states
  const dealStatuses = [
    { status: "DRAFT", label: "Draft" },
    { status: "PROSPECTING", label: "Early Stage" },
    { status: "QUALIFICATION", label: "Qualifying" },
    { status: "DOC_COLLECTION", label: "Documents" },
    { status: "RFQ_PREP", label: "RFQ Ready" },
    { status: "RFQ_SENT", label: "Quotes Pending" },
    { status: "QUOTE_ANALYSIS", label: "Analyzing" },
    { status: "PROPOSAL", label: "Proposal Sent" },
    { status: "CLOSED_WON", label: "Won Deal" },
    { status: "CLOSED_LOST", label: "Lost Deal" },
  ];

  const demoDeals = [];
  for (let i = 0; i < 10; i++) {
    const clientIndex = i % insertedClients.length;
    const statusInfo = dealStatuses[i];
    const deal = {
      id: generateDemoId("DEAL", i + 1),
      clientId: insertedClients[clientIndex].id,
      status: statusInfo.status,
      volumeMwhYear: 1000 + i * 500,
      volumeMwhMonth: parseFloat(((1000 + i * 500) / 12).toFixed(2)),
      contractTermMonths: [12, 24, 36, 48, 60][i % 5],
      contractStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * (i + 1)).toISOString().split('T')[0],
      energyType: ["convencional", "incentivada_50", "incentivada_100"][i % 3],
      submarket: submarkets[i % 4],
      internalOwner: "Renan",
      isDemo: true,
    };
    demoDeals.push(deal);
  }
  
  const insertedDeals = await db.insert(deals).values(demoDeals).returning();
  summary.deals = insertedDeals.length;

  // Create dossiers
  const demoDossiers = [];
  for (let i = 0; i < 5; i++) {
    const clientIndex = i % insertedClients.length;
    const client = insertedClients[clientIndex];
    const dossier = {
      clientId: client.id,
      legalName: client.companyName,
      tradeName: client.companyName.split(' ')[0],
      cnpj: client.cnpj!,
      distributor: distributors[i % distributors.length],
      submarket: submarkets[i % submarkets.length],
      connectionType: ["GROUP_A", "GROUP_B"][i % 2],
      eligibilityType: eligibilityTypes[i % eligibilityTypes.length],
      annualConsumptionMWh: 500 + i * 200,
      averageMonthlyMWh: parseFloat(((500 + i * 200) / 12).toFixed(2)),
      peakDemandKW: 100 + i * 50,
      numberOfUCs: 1 + (i % 4),
      tariffClass: tariffClasses[i % tariffClasses.length],
      confidenceScore: ["LOW", "MEDIUM", "HIGH"][i % 3],
      status: ["DRAFT", "READY", "LOCKED"][i % 3],
      isDemo: true,
    };
    demoDossiers.push(dossier);
  }
  
  const insertedDossiers = await db.insert(clientDossiers).values(demoDossiers).onConflictDoNothing().returning();
  summary.dossiers = insertedDossiers.length;

  // Create playbooks
  const demoPlaybooks = [];
  for (let i = 0; i < insertedSuppliers.length; i++) {
    const supplier = insertedSuppliers[i];
    const playbook = {
      supplierId: supplier.id,
      version: 1,
      status: "ACTIVE" as const,
      preferredChannel: channels[i % channels.length],
      requiredFields: ["ucCodes", "demandKw", "monthlyMwh", "contractMonths"],
      emailConfig: {
        toEmails: [supplier.contactEmail],
        subjectTemplate: "RFQ - {{clientName}} - {{volume}}MWh/mês",
        bodyTemplate: "Prezados,\n\nSolicitamos cotação para:\n- Cliente: {{clientName}}\n- Volume: {{volume}} MWh/mês\n- Prazo: {{term}} meses\n\nAtenciosamente,\nÓtima Energia",
      },
      slaConfig: {
        quoteDueHours: 48,
        followupCadenceHours: [24, 48],
      },
      internalNotes: `Demo playbook for ${supplier.name}`,
      isDemo: true,
    };
    demoPlaybooks.push(playbook);
  }
  
  const insertedPlaybooks = await db.insert(supplierRfqPlaybooks).values(demoPlaybooks).returning();
  summary.playbooks = insertedPlaybooks.length;

  // Create RFQ dispatches
  const rfqDeals = insertedDeals.filter(d => 
    ["RFQ_SENT", "QUOTE_ANALYSIS", "PROPOSAL", "NEGOTIATION", "CLOSED_WON"].includes(d.status)
  );
  
  const demoDispatches = [];
  for (const deal of rfqDeals) {
    for (let i = 0; i < 3; i++) {
      const supplierIndex = (rfqDeals.indexOf(deal) + i) % insertedSuppliers.length;
      const supplier = insertedSuppliers[supplierIndex];
      const playbook = insertedPlaybooks.find(p => p.supplierId === supplier.id);
      
      const dispatch = {
        dealId: deal.id,
        supplierId: supplier.id,
        supplierRfqPlaybookId: playbook?.id,
        playbookVersion: 1,
        channelUsed: channels[i % channels.length],
        status: ["SENT", "DELIVERED", "RESPONDED", "CLOSED"][i % 4],
        sentAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000),
        dueAt: new Date(Date.now() + (3 + i) * 24 * 60 * 60 * 1000),
        respondedAt: i > 0 ? new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000) : null,
        followupCount: i,
        messageSubject: `RFQ - Demo Client - ${100 + rfqDeals.indexOf(deal) * 50}MWh/mês`,
        messageBody: `Cotação demo para teste de workflow`,
        isDemo: true,
      };
      demoDispatches.push(dispatch);
    }
  }
  
  const insertedDispatches = await db.insert(rfqDispatches).values(demoDispatches).returning();
  summary.dispatches = insertedDispatches.length;

  // Create quotes
  const quotableDeals = insertedDeals.filter(d => 
    ["QUOTE_ANALYSIS", "PROPOSAL", "NEGOTIATION", "CLOSED_WON"].includes(d.status)
  );
  
  const demoQuotes = [];
  for (const deal of quotableDeals) {
    const relatedDispatches = insertedDispatches.filter(d => d.dealId === deal.id);
    
    for (let i = 0; i < Math.min(3, relatedDispatches.length); i++) {
      const dispatch = relatedDispatches[i];
      const pricePerMwh = 180 + Math.random() * 60;
      const quote = {
        dealId: deal.id,
        supplierId: dispatch.supplierId,
        rfqDispatchId: dispatch.id,
        rawQuoteJson: {
          pricePerMwh,
          term: deal.contractTermMonths || 24,
          structure: ["FIXED", "FLEX", "I5"][i % 3],
          receivedAt: new Date().toISOString(),
          source: "demo_seeder",
        },
        baseEnergyPriceRmwh: parseFloat(pricePerMwh.toFixed(2)),
        energyType: ["convencional", "incentivada_50", "incentivada_100"][i % 3],
        priceStructure: ["fixed", "indexed_ipca", "indexed_igpm"][i % 3],
        validUntil: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quoteNotes: `Demo quote ${i + 1} for testing`,
        isNormalized: true,
        normalizationConfidence: parseFloat((0.85 + Math.random() * 0.15).toFixed(2)),
        isDemo: true,
      };
      demoQuotes.push(quote);
    }
  }
  
  const insertedQuotes = await db.insert(dealQuotes).values(demoQuotes).returning();
  summary.quotes = insertedQuotes.length;

  // Create commission events
  const wonDeals = insertedDeals.filter(d => d.status === "CLOSED_WON");
  const demoCommissionEvents = [];
  
  for (const deal of wonDeals) {
    // M1: Contract Signed - 50%
    const m1Event = {
      dealId: deal.id,
      eventType: "MILESTONE_1" as const,
      eventIndex: 0,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 2500, volume_mwh: 100, percent: 50 },
      amountBrl: 2500.00,
      isEstimated: false,
      dueCondition: "CONTRACT_SIGNED",
      paymentTrigger: "50% due on Contract Signed",
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "CONFIRMED" as const,
      confirmedAt: new Date(),
      notes: "M1: Contract Signed - 50% milestone",
      isDemo: true,
    };
    demoCommissionEvents.push(m1Event);
    
    // M2: Supply Live - 50%
    const m2Event = {
      dealId: deal.id,
      eventType: "MILESTONE_2" as const,
      eventIndex: 1,
      calcType: "fixed_amount",
      calcInputs: { base_amount: 2500, volume_mwh: 100, percent: 50 },
      amountBrl: 2500.00,
      isEstimated: false,
      dueCondition: "SUPPLY_LIVE",
      paymentTrigger: "50% due on CCEE Activation / Supply Live",
      expectedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "PENDING" as const,
      notes: "M2: Supply Live - 50% milestone",
      isDemo: true,
    };
    demoCommissionEvents.push(m2Event);
  }
  
  const insertedCommissionEvents = await db.insert(dealCommissionEvents).values(demoCommissionEvents).returning();
  summary.commissionEvents = insertedCommissionEvents.length;

  // Create cases
  const demoCases = [];
  for (let i = 0; i < 5; i++) {
    const dealIndex = i % insertedDeals.length;
    const deal = insertedDeals[dealIndex];
    const caseTypes = ["DOCUMENTATION_MISSING", "CLIENT_UNRESPONSIVE", "PRICING_DISPUTE", "CONTRACT_DELAY", "SUPPLIER_ISSUE"];
    const severities = ["LOW", "MED", "HIGH", "CRITICAL"];
    const statuses = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED"];
    
    const dealCase = {
      dealId: deal.id,
      caseType: caseTypes[i % caseTypes.length],
      severity: severities[i % severities.length],
      status: statuses[i % statuses.length],
      nextActionDate: new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      slaDueDate: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rootCause: `Demo case root cause ${i + 1}`,
      isDemo: true,
    };
    demoCases.push(dealCase);
  }
  
  const insertedCases = await db.insert(dealCases).values(demoCases).returning();
  summary.cases = insertedCases.length;

  // Create usage periods
  const activeClients = insertedClients.filter((_, i) => i < 3);
  const demoUsagePeriods = [];
  
  for (const client of activeClients) {
    for (let month = 0; month < 6; month++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - month - 1);
      startDate.setDate(1);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      
      const usagePeriod = {
        clientId: client.id,
        ucCode: `UC${client.id}001`,
        periodStartDate: startDate.toISOString().split('T')[0],
        periodEndDate: endDate.toISOString().split('T')[0],
        energyKwh: parseFloat((80000 + Math.random() * 40000).toFixed(2)),
        demandKw: parseFloat((150 + Math.random() * 50).toFixed(2)),
        billedAmountBrl: parseFloat((15000 + Math.random() * 10000).toFixed(2)),
        sourceType: "EXTRACTED" as const,
        status: ["DRAFT", "VERIFIED", "CONFIRMED"][month % 3] as "DRAFT" | "VERIFIED" | "CONFIRMED",
        notes: `Demo usage period for testing`,
        isDemo: true,
      };
      demoUsagePeriods.push(usagePeriod);
    }
  }
  
  const insertedUsagePeriods = await db.insert(clientUsagePeriods).values(demoUsagePeriods).returning();
  summary.usagePeriods = insertedUsagePeriods.length;

  return summary;
}

// ========== ASSEMBLY STUCK STATES ==========
async function seedAssemblyStuck(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  
  // Create 3 demo suppliers for quotes
  const demoSuppliersList = [];
  for (let i = 0; i < 3; i++) {
    demoSuppliersList.push(await createDemoSupplier(`DEMO - Assembly Supplier ${i + 1}`, 700 + i));
  }
  summary.suppliers = demoSuppliersList.length;
  
  // === DEAL 1: Stuck at DOSSIER_DRAFT (no dossier created) ===
  const client1 = await createDemoClient("TEST - Stuck No Dossier SA", 701);
  const dealId1 = generateScenarioId('ASM', 'DEAL', 1);
  const [deal1] = await db.insert(deals).values({
    id: dealId1,
    clientId: client1.id,
    status: "rfq_preparation",
    estimatedVolumeMwh: 120,
    estimatedSavingsPercent: 12,
    notes: "ASSEMBLY STUCK: No dossier created - cannot proceed to RFQ",
    isDemo: true,
  }).returning();
  
  // === DEAL 2: Stuck at DOSSIER_DRAFT (dossier in DRAFT status) ===
  const client2 = await createDemoClient("TEST - Stuck Draft Dossier Ltd", 702);
  const dealId2 = generateScenarioId('ASM', 'DEAL', 2);
  const [deal2] = await db.insert(deals).values({
    id: dealId2,
    clientId: client2.id,
    status: "rfq_preparation",
    estimatedVolumeMwh: 85,
    estimatedSavingsPercent: 8,
    notes: "ASSEMBLY STUCK: Dossier in DRAFT - needs to be READY/LOCKED for RFQ",
    isDemo: true,
  }).returning();
  
  // Create DRAFT dossier for deal 2
  await db.insert(clientDossiers).values({
    clientId: client2.id,
    dealId: dealId2,
    status: "DRAFT",
    distributorName: "CPFL",
    tariffClass: "A4",
    submarket: "SE/CO",
    eligibilityType: "ACL_DIRECT",
    contractedDemandKw: 200,
    avgMonthlyConsumptionKwh: 85000,
    isDemo: true,
  });
  summary.dossiers = 1;
  
  // === DEAL 3: Stuck at QUOTES_RECEIVED (only 1 eligible quote, needs 2) ===
  const client3 = await createDemoClient("TEST - Stuck Insufficient Quotes Inc", 703);
  const dealId3 = generateScenarioId('ASM', 'DEAL', 3);
  const [deal3] = await db.insert(deals).values({
    id: dealId3,
    clientId: client3.id,
    status: "quotes_received",
    estimatedVolumeMwh: 150,
    estimatedSavingsPercent: 15,
    notes: "ASSEMBLY STUCK: Only 1 eligible quote - needs minimum 2 for proposal",
    isDemo: true,
  }).returning();
  
  // Create LOCKED dossier for deal 3
  await db.insert(clientDossiers).values({
    clientId: client3.id,
    dealId: dealId3,
    status: "LOCKED",
    distributorName: "Cemig",
    tariffClass: "A4",
    submarket: "SE/CO",
    eligibilityType: "ACL_DIRECT",
    contractedDemandKw: 350,
    avgMonthlyConsumptionKwh: 150000,
    lockedAt: new Date().toISOString(),
    lockedBy: "demo_user",
    isDemo: true,
  });
  summary.dossiers = (summary.dossiers || 0) + 1;
  
  // Create RFQ dispatch for deal 3
  await db.insert(rfqDispatches).values({
    dealId: dealId3,
    supplierId: demoSuppliersList[0].id,
    channel: "EMAIL",
    status: "RESPONDED",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    responseDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  });
  summary.dispatches = 1;
  
  // Create 1 eligible quote and 1 expired quote for deal 3
  await db.insert(dealQuotes).values([
    {
      dealId: dealId3,
      supplierId: demoSuppliersList[0].id,
      supplierBasePrice: 280.00,
      otimaMarginRmwh: 3.00,
      clientEnergyPriceRmwh: 283.00,
      spreadsheetUrl: null,
      contractMonths: 24,
      status: "VALID",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Eligible quote - valid for 7 more days",
      isDemo: true,
    },
    {
      dealId: dealId3,
      supplierId: demoSuppliersList[1].id,
      supplierBasePrice: 275.00,
      otimaMarginRmwh: 3.00,
      clientEnergyPriceRmwh: 278.00,
      spreadsheetUrl: null,
      contractMonths: 24,
      status: "EXPIRED",
      validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "EXPIRED - was cheaper but expired yesterday",
      isDemo: true,
    },
  ]);
  summary.quotes = 2;
  
  summary.clients = 3;
  summary.deals = 3;
  
  return summary;
}

// ========== MAIN SEEDER FUNCTION ==========
export async function seedDemoData(scenarioPacks?: ScenarioPack[]): Promise<{ success: boolean; summary: Record<string, number> }> {
  const packs = scenarioPacks && scenarioPacks.length > 0 ? scenarioPacks : ['FULL_DATASET' as ScenarioPack];
  const combinedSummary: Record<string, number> = {};
  
  try {
    for (const pack of packs) {
      let packSummary: Record<string, number> = {};
      
      switch (pack) {
        case 'FULL_DATASET':
          packSummary = await seedFullDataset();
          break;
        case 'HAPPY_PATH':
          packSummary = await seedHappyPath();
          break;
        case 'SLA_BREACH':
          packSummary = await seedSlaBreach();
          break;
        case 'CREDIT_REJECTED':
          packSummary = await seedCreditRejected();
          break;
        case 'WRONG_SIGNER':
          packSummary = await seedWrongSigner();
          break;
        case 'COMMISSION_DISPUTE':
          packSummary = await seedCommissionDispute();
          break;
        case 'OVERDUE_PAYMENT':
          packSummary = await seedOverduePayment();
          break;
        case 'ASSEMBLY_STUCK':
          packSummary = await seedAssemblyStuck();
          break;
      }
      
      // Combine summaries
      for (const [key, value] of Object.entries(packSummary)) {
        combinedSummary[key] = (combinedSummary[key] || 0) + value;
      }
    }
    
    return { success: true, summary: combinedSummary };
  } catch (error) {
    console.error("Error seeding demo data:", error);
    throw error;
  }
}

export async function nukeDemoData(): Promise<{ success: boolean; deleted: Record<string, number> }> {
  const deleted: Record<string, number> = {};
  
  try {
    // Delete proposal-related demo data first (child tables)
    const proposalViewsResult = await db.delete(dealProposalViews).where(eq(dealProposalViews.isDemo, true)).returning();
    deleted.proposalViews = proposalViewsResult.length;
    
    const proposalSnapshotsResult = await db.delete(dealProposalSnapshots).where(eq(dealProposalSnapshots.isDemo, true)).returning();
    deleted.proposalSnapshots = proposalSnapshotsResult.length;
    
    const proposalItemsResult = await db.delete(dealProposalItems).where(eq(dealProposalItems.isDemo, true)).returning();
    deleted.proposalItems = proposalItemsResult.length;
    
    const proposalsResult = await db.delete(dealProposals).where(eq(dealProposals.isDemo, true)).returning();
    deleted.proposals = proposalsResult.length;
    
    // Delete ECOS snapshots
    const ecosSnapshotsResult = await db.delete(dealEcosSnapshots).where(eq(dealEcosSnapshots.isDemo, true)).returning();
    deleted.ecosSnapshots = ecosSnapshotsResult.length;
    
    const usageResult = await db.delete(clientUsagePeriods).where(eq(clientUsagePeriods.isDemo, true)).returning();
    deleted.usagePeriods = usageResult.length;

    const casesResult = await db.delete(dealCases).where(eq(dealCases.isDemo, true)).returning();
    deleted.cases = casesResult.length;

    const commissionResult = await db.delete(dealCommissionEvents).where(eq(dealCommissionEvents.isDemo, true)).returning();
    deleted.commissionEvents = commissionResult.length;

    const quotesResult = await db.delete(dealQuotes).where(eq(dealQuotes.isDemo, true)).returning();
    deleted.quotes = quotesResult.length;

    const dispatchesResult = await db.delete(rfqDispatches).where(eq(rfqDispatches.isDemo, true)).returning();
    deleted.dispatches = dispatchesResult.length;

    const playbooksResult = await db.delete(supplierRfqPlaybooks).where(eq(supplierRfqPlaybooks.isDemo, true)).returning();
    deleted.playbooks = playbooksResult.length;

    const dossiersResult = await db.delete(clientDossiers).where(eq(clientDossiers.isDemo, true)).returning();
    deleted.dossiers = dossiersResult.length;

    const dealsResult = await db.delete(deals).where(eq(deals.isDemo, true)).returning();
    deleted.deals = dealsResult.length;

    const suppliersResult = await db.delete(suppliers).where(eq(suppliers.isDemo, true)).returning();
    deleted.suppliers = suppliersResult.length;

    const clientsResult = await db.delete(clients).where(eq(clients.isDemo, true)).returning();
    deleted.clients = clientsResult.length;

    return { success: true, deleted };
  } catch (error) {
    console.error("Error nuking demo data:", error);
    throw error;
  }
}

export async function getDemoDataStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  
  const clientCount = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.isDemo, true));
  stats.clients = Number(clientCount[0]?.count || 0);
  
  const supplierCount = await db.select({ count: sql<number>`count(*)` }).from(suppliers).where(eq(suppliers.isDemo, true));
  stats.suppliers = Number(supplierCount[0]?.count || 0);
  
  const dealCount = await db.select({ count: sql<number>`count(*)` }).from(deals).where(eq(deals.isDemo, true));
  stats.deals = Number(dealCount[0]?.count || 0);
  
  const quoteCount = await db.select({ count: sql<number>`count(*)` }).from(dealQuotes).where(eq(dealQuotes.isDemo, true));
  stats.quotes = Number(quoteCount[0]?.count || 0);
  
  const dispatchCount = await db.select({ count: sql<number>`count(*)` }).from(rfqDispatches).where(eq(rfqDispatches.isDemo, true));
  stats.dispatches = Number(dispatchCount[0]?.count || 0);
  
  const caseCount = await db.select({ count: sql<number>`count(*)` }).from(dealCases).where(eq(dealCases.isDemo, true));
  stats.cases = Number(caseCount[0]?.count || 0);
  
  const commissionCount = await db.select({ count: sql<number>`count(*)` }).from(dealCommissionEvents).where(eq(dealCommissionEvents.isDemo, true));
  stats.commissionEvents = Number(commissionCount[0]?.count || 0);
  
  const usageCount = await db.select({ count: sql<number>`count(*)` }).from(clientUsagePeriods).where(eq(clientUsagePeriods.isDemo, true));
  stats.usagePeriods = Number(usageCount[0]?.count || 0);
  
  // New stats for proposals and ECOS
  const proposalCount = await db.select({ count: sql<number>`count(*)` }).from(dealProposals).where(eq(dealProposals.isDemo, true));
  stats.proposals = Number(proposalCount[0]?.count || 0);
  
  const ecosSnapshotCount = await db.select({ count: sql<number>`count(*)` }).from(dealEcosSnapshots).where(eq(dealEcosSnapshots.isDemo, true));
  stats.ecosSnapshots = Number(ecosSnapshotCount[0]?.count || 0);
  
  return stats;
}

// Get demo proposals for guided flow
export async function getDemoProposals(): Promise<Array<{
  id: number;
  publicId: string;
  title: string;
  status: string;
  viewCount: number;
  dealId: string;
}>> {
  const proposals = await db.select({
    id: dealProposals.id,
    publicId: dealProposals.publicId,
    title: dealProposals.title,
    status: dealProposals.status,
    viewCount: dealProposals.viewCount,
    dealId: dealProposals.dealId,
  }).from(dealProposals).where(eq(dealProposals.isDemo, true));
  
  return proposals;
}

// Get demo ECOS snapshots for guided flow
export async function getDemoEcosSnapshots(): Promise<Array<{
  id: number;
  dealId: string;
  version: number;
  status: string;
  confidenceLevel: string;
  triggerType: string;
}>> {
  const snapshots = await db.select({
    id: dealEcosSnapshots.id,
    dealId: dealEcosSnapshots.dealId,
    version: dealEcosSnapshots.version,
    status: dealEcosSnapshots.status,
    confidenceLevel: dealEcosSnapshots.confidenceLevel,
    triggerType: dealEcosSnapshots.triggerType,
  }).from(dealEcosSnapshots).where(eq(dealEcosSnapshots.isDemo, true));
  
  return snapshots;
}

// Get list of demo deals with their scenarios for tours
export async function getDemoDeals(): Promise<Array<{ id: string; clientName: string; status: string; scenario?: string }>> {
  const demoDeals = await db.select({
    id: deals.id,
    status: deals.status,
    clientId: deals.clientId
  }).from(deals).where(eq(deals.isDemo, true));
  
  const result = [];
  for (const deal of demoDeals) {
    const client = await db.select({ companyName: clients.companyName }).from(clients).where(eq(clients.id, deal.clientId!)).limit(1);
    
    // Determine scenario from deal ID prefix
    let scenario: string | undefined;
    if (deal.id.includes('_HP_')) scenario = 'Happy Path';
    else if (deal.id.includes('_SLA_')) scenario = 'SLA Breach';
    else if (deal.id.includes('_CR_')) scenario = 'Credit Rejected';
    else if (deal.id.includes('_WS_')) scenario = 'Wrong Signer';
    else if (deal.id.includes('_CD_')) scenario = 'Commission Dispute';
    else if (deal.id.includes('_OP_')) scenario = 'Overdue Payment';
    
    result.push({
      id: deal.id,
      clientName: client[0]?.companyName || 'Unknown',
      status: deal.status,
      scenario
    });
  }
  
  return result;
}
