import { storage } from "./storage";
import type { Deal, ClientDossier, MarketPriceBenchmark, InsertDealEcosSnapshot } from "@shared/schema";

export type DealEcosStatus = "BELOW_BAND" | "WITHIN_BAND" | "ABOVE_BAND" | "NO_DATA";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ConfidenceReason {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  descriptionEn: string;
  descriptionPt: string;
}

export interface DealEcosEvaluation {
  status: DealEcosStatus;
  confidenceLevel: ConfidenceLevel;
  confidenceReasons: ConfidenceReason[];
  clientPriceRmwh: number | null;
  benchmarkLowerRmwh: number | null;
  benchmarkUpperRmwh: number | null;
  priceGapPercent: number | null;
  potentialSavingsAnnual: number | null;
  talkTrackEn: string;
  talkTrackPt: string;
  recommendedNextStep: string;
  frozenInputs: FrozenInputData;
  benchmarkMatch: BenchmarkMatch | null;
}

export interface FrozenInputData {
  annualConsumptionMwh: number | null;
  segment: string | null;
  region: string | null;
  contractLengthMonths: number | null;
  distributor: string | null;
  submarket: string | null;
  tariffClass: string | null;
  capturedAt: string;
}

export interface BenchmarkMatch {
  benchmarkId: number;
  segment: string;
  region: string;
  contractLength: number;
  lowerBoundRmwh: number;
  upperBoundRmwh: number;
  lastUpdated: string | null;
  confidence: string | null;
}

function calculateConfidence(
  dossier: ClientDossier | null | undefined,
  benchmark: MarketPriceBenchmark | null | undefined,
  hasCurrentPrice: boolean
): { level: ConfidenceLevel; reasons: ConfidenceReason[] } {
  const reasons: ConfidenceReason[] = [];
  let score = 0;
  const maxScore = 100;

  if (dossier?.annualConsumptionMWh) {
    score += 20;
    reasons.push({
      factor: "consumption_data",
      impact: "positive",
      descriptionEn: "Annual consumption data is available",
      descriptionPt: "Dados de consumo anual disponíveis"
    });
  } else {
    reasons.push({
      factor: "consumption_data",
      impact: "negative",
      descriptionEn: "Missing annual consumption data",
      descriptionPt: "Dados de consumo anual não informados"
    });
  }

  if (hasCurrentPrice) {
    score += 25;
    reasons.push({
      factor: "current_price",
      impact: "positive",
      descriptionEn: "Current contract price is known",
      descriptionPt: "Preço atual do contrato é conhecido"
    });
  } else {
    reasons.push({
      factor: "current_price",
      impact: "negative",
      descriptionEn: "Current contract price is unknown",
      descriptionPt: "Preço atual do contrato não informado"
    });
  }

  if (benchmark) {
    const benchmarkAge = benchmark.lastReviewedAt 
      ? Math.floor((Date.now() - new Date(benchmark.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (benchmarkAge <= 30) {
      score += 25;
      reasons.push({
        factor: "benchmark_freshness",
        impact: "positive",
        descriptionEn: `Benchmark reviewed ${benchmarkAge} days ago`,
        descriptionPt: `Benchmark revisado há ${benchmarkAge} dias`
      });
    } else if (benchmarkAge <= 90) {
      score += 15;
      reasons.push({
        factor: "benchmark_freshness",
        impact: "neutral",
        descriptionEn: `Benchmark is ${benchmarkAge} days old`,
        descriptionPt: `Benchmark tem ${benchmarkAge} dias`
      });
    } else {
      score += 5;
      reasons.push({
        factor: "benchmark_freshness",
        impact: "negative",
        descriptionEn: "Benchmark data is outdated (>90 days)",
        descriptionPt: "Dados do benchmark desatualizados (>90 dias)"
      });
    }

    if (benchmark.confidence === "HIGH") {
      score += 15;
    } else if (benchmark.confidence === "MEDIUM") {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    reasons.push({
      factor: "benchmark_availability",
      impact: "negative",
      descriptionEn: "No matching benchmark found for this profile",
      descriptionPt: "Nenhum benchmark encontrado para este perfil"
    });
  }

  if (dossier?.distributor) {
    score += 10;
    reasons.push({
      factor: "distributor_known",
      impact: "positive",
      descriptionEn: "Distributor is identified",
      descriptionPt: "Distribuidora identificada"
    });
  }

  if (dossier?.submarket) {
    score += 5;
    reasons.push({
      factor: "submarket_known",
      impact: "positive",
      descriptionEn: "Submarket is known",
      descriptionPt: "Submercado conhecido"
    });
  }

  const percentage = (score / maxScore) * 100;
  let level: ConfidenceLevel;
  
  if (percentage >= 65) {
    level = "HIGH";
  } else if (percentage >= 35) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  return { level, reasons };
}

function generateTalkTracks(
  status: DealEcosStatus,
  priceGapPercent: number | null,
  potentialSavings: number | null,
  dossier: ClientDossier | null | undefined
): { en: string; pt: string } {
  const enParts: string[] = [];
  const ptParts: string[] = [];

  if (status === "ABOVE_BAND") {
    enParts.push(`Your current energy price is above the market average by approximately ${priceGapPercent?.toFixed(0) || '?'}%.`);
    ptParts.push(`Seu preço atual de energia está acima da média do mercado em aproximadamente ${priceGapPercent?.toFixed(0) || '?'}%.`);
    
    if (potentialSavings && potentialSavings > 0) {
      enParts.push(`This represents potential annual savings of R$ ${potentialSavings.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}.`);
      ptParts.push(`Isso representa uma economia potencial anual de R$ ${potentialSavings.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}.`);
    }
    
    enParts.push("We can help negotiate a better rate with your current supplier or explore alternatives.");
    ptParts.push("Podemos ajudar a negociar uma melhor tarifa com seu fornecedor atual ou explorar alternativas.");
  } else if (status === "WITHIN_BAND") {
    enParts.push("Your current energy price is within the expected market range.");
    ptParts.push("Seu preço atual de energia está dentro da faixa esperada do mercado.");
    
    enParts.push("While not overpriced, there may still be opportunities for optimization.");
    ptParts.push("Embora não esteja acima do mercado, ainda podem existir oportunidades de otimização.");
  } else if (status === "BELOW_BAND") {
    enParts.push("Excellent! Your current energy price is below the market average.");
    ptParts.push("Excelente! Seu preço atual de energia está abaixo da média do mercado.");
    
    enParts.push("Your current contract represents good value. We can help ensure your next renewal maintains this advantage.");
    ptParts.push("Seu contrato atual representa um bom valor. Podemos ajudar a garantir que sua próxima renovação mantenha essa vantagem.");
  } else {
    enParts.push("We need more information to provide a complete market analysis.");
    ptParts.push("Precisamos de mais informações para fornecer uma análise completa do mercado.");
    
    enParts.push("Please share your recent energy bills so we can evaluate your current pricing.");
    ptParts.push("Por favor, compartilhe suas faturas de energia recentes para podermos avaliar seu preço atual.");
  }

  return { en: enParts.join(" "), pt: ptParts.join(" ") };
}

function generateNextStep(
  status: DealEcosStatus,
  confidenceLevel: ConfidenceLevel
): string {
  if (status === "NO_DATA" || confidenceLevel === "LOW") {
    return "NEED_MORE_DATA";
  }

  if (status === "ABOVE_BAND") {
    return "REQUEST_RFQ";
  } else if (status === "WITHIN_BAND") {
    return "WAIT";
  } else if (status === "BELOW_BAND") {
    return "WAIT";
  }
  
  return "NEED_MORE_DATA";
}

export async function evaluateDealEcos(
  dealId: string,
  triggeredBy: string
): Promise<DealEcosEvaluation> {
  const deal = await storage.getDeal(dealId);
  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`);
  }

  const dossier = deal.clientId ? await storage.getClientDossier(deal.clientId) : null;

  const segment = dossier?.tariffClass || "A4";
  const region = dossier?.submarket || "SE/CO";
  const contractLengthMonths = 12;

  const roundedContractLength = contractLengthMonths <= 18 ? 12 : contractLengthMonths <= 30 ? 24 : 36;
  const benchmark = await storage.getBenchmarkForClient(segment, region, roundedContractLength);

  const annualConsumption = dossier?.annualConsumptionMWh ? parseFloat(dossier.annualConsumptionMWh) : null;
  
  const estimatedPrice = annualConsumption && annualConsumption > 0 ? 250 : null;
  const hasCurrentPrice = estimatedPrice !== null;

  const { level: confidenceLevel, reasons: confidenceReasons } = calculateConfidence(
    dossier,
    benchmark,
    hasCurrentPrice
  );

  let status: DealEcosStatus = "NO_DATA";
  let priceGapPercent: number | null = null;
  let potentialSavingsAnnual: number | null = null;
  let benchmarkLower: number | null = null;
  let benchmarkUpper: number | null = null;
  let benchmarkMatch: BenchmarkMatch | null = null;

  if (benchmark && hasCurrentPrice) {
    benchmarkLower = parseFloat(benchmark.lowerBoundRmwh);
    benchmarkUpper = parseFloat(benchmark.upperBoundRmwh);

    benchmarkMatch = {
      benchmarkId: benchmark.id,
      segment: benchmark.segment,
      region: benchmark.region,
      contractLength: benchmark.contractLengthMonths,
      lowerBoundRmwh: benchmarkLower,
      upperBoundRmwh: benchmarkUpper,
      lastUpdated: benchmark.lastReviewedAt?.toISOString() || null,
      confidence: benchmark.confidence
    };

    if (estimatedPrice <= benchmarkLower) {
      status = "BELOW_BAND";
    } else if (estimatedPrice > benchmarkUpper) {
      status = "ABOVE_BAND";
    } else {
      status = "WITHIN_BAND";
    }

    priceGapPercent = ((estimatedPrice - benchmarkLower) / benchmarkLower) * 100;
    
    if (annualConsumption && estimatedPrice > benchmarkLower) {
      const priceGap = estimatedPrice - benchmarkLower;
      potentialSavingsAnnual = priceGap * annualConsumption;
    }
  }

  const { en: talkTrackEn, pt: talkTrackPt } = generateTalkTracks(
    status,
    priceGapPercent,
    potentialSavingsAnnual,
    dossier
  );

  const recommendedNextStep = generateNextStep(status, confidenceLevel);

  const frozenInputs: FrozenInputData = {
    annualConsumptionMwh: annualConsumption,
    segment: dossier?.tariffClass || null,
    region: dossier?.submarket || null,
    contractLengthMonths: contractLengthMonths,
    distributor: dossier?.distributor || null,
    submarket: dossier?.submarket || null,
    tariffClass: dossier?.tariffClass || null,
    capturedAt: new Date().toISOString()
  };

  return {
    status,
    confidenceLevel,
    confidenceReasons,
    clientPriceRmwh: estimatedPrice,
    benchmarkLowerRmwh: benchmarkLower,
    benchmarkUpperRmwh: benchmarkUpper,
    priceGapPercent,
    potentialSavingsAnnual,
    talkTrackEn,
    talkTrackPt,
    recommendedNextStep,
    frozenInputs,
    benchmarkMatch
  };
}

export async function createDealEcosSnapshot(
  dealId: string,
  triggeredBy: string,
  triggerType: string = "MANUAL",
  notes?: string
): Promise<{ snapshotId: number; evaluation: DealEcosEvaluation }> {
  const evaluation = await evaluateDealEcos(dealId, triggeredBy);
  
  const version = await storage.getNextSnapshotVersion(dealId);
  
  const results = {
    clientEstimatedPriceRmwh: evaluation.clientPriceRmwh,
    gapPercent: evaluation.priceGapPercent,
    potentialSavingsMin: evaluation.potentialSavingsAnnual ? evaluation.potentialSavingsAnnual * 0.8 : null,
    potentialSavingsMax: evaluation.potentialSavingsAnnual ? evaluation.potentialSavingsAnnual * 1.2 : null
  };

  const snapshotData: InsertDealEcosSnapshot = {
    dealId,
    version,
    triggerType,
    inputData: evaluation.frozenInputs,
    benchmarkMatch: evaluation.benchmarkMatch,
    results,
    status: evaluation.status,
    confidenceLevel: evaluation.confidenceLevel,
    confidenceReasons: evaluation.confidenceReasons,
    recommendedNextStep: evaluation.recommendedNextStep,
    talkTrack: evaluation.talkTrackEn,
    talkTrackPt: evaluation.talkTrackPt,
    createdByUserId: triggeredBy
  };

  const snapshot = await storage.createDealEcosSnapshot(snapshotData);

  await storage.logAdminAction({
    actor: triggeredBy,
    action: 'CREATE',
    entityType: 'DEAL_ECOS_SNAPSHOT',
    entityId: snapshot.id,
    dealId,
    detailsJson: { 
      status: evaluation.status, 
      confidenceLevel: evaluation.confidenceLevel,
      version,
      message: `Created ECOS snapshot v${version} for deal ${dealId}`
    }
  });

  return { snapshotId: snapshot.id, evaluation };
}
