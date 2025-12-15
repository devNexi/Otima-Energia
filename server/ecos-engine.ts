import { storage } from "./storage";
import type { Client, ClientContract, MarketPriceBenchmark, EcosSettings, EcosDecisionLog } from "@shared/schema";

export type EcosStatus = "within_band" | "at_risk" | "above_band" | "no_data";

export interface EcosEvaluationResult {
  status: EcosStatus;
  recommendation: string;
  explanation: string;
  clientPrice: number | null;
  benchmarkLower: number | null;
  benchmarkUpper: number | null;
  priceGapPercent: number | null;
  potentialSavingsR: number | null;
  remainingMonths: number | null;
  contractEndDate: string | null;
  triggerType: string;
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export async function evaluateClient(
  clientId: number,
  triggerType: string = "manual"
): Promise<EcosEvaluationResult> {
  const client = await storage.getClient(clientId);
  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const contract = await storage.getActiveClientContract(clientId);
  
  if (!contract || !contract.priceRmwh) {
    return {
      status: "no_data",
      recommendation: "Add an active contract with pricing information to enable ECOS evaluation.",
      explanation: "No active contract found for this client.",
      clientPrice: null,
      benchmarkLower: null,
      benchmarkUpper: null,
      priceGapPercent: null,
      potentialSavingsR: null,
      remainingMonths: null,
      contractEndDate: null,
      triggerType
    };
  }

  const clientPrice = parseFloat(contract.priceRmwh);
  
  const segment = client.segment || "SME";
  const region = client.region || "Sudeste";
  
  const contractStart = contract.contractStart ? new Date(contract.contractStart) : new Date();
  const contractEnd = contract.contractEnd ? new Date(contract.contractEnd) : null;
  
  let contractLengthMonths = 12;
  if (contractEnd && contractStart) {
    contractLengthMonths = monthsBetween(contractStart, contractEnd);
  }
  
  const roundedContractLength = contractLengthMonths <= 18 ? 12 : contractLengthMonths <= 30 ? 24 : 36;
  
  const benchmark = await storage.getBenchmarkForClient(segment, region, roundedContractLength);
  
  if (!benchmark) {
    return {
      status: "no_data",
      recommendation: `Add market benchmarks for segment "${segment}", region "${region}", and ${roundedContractLength}-month contracts.`,
      explanation: `No benchmark data available for this client's profile.`,
      clientPrice,
      benchmarkLower: null,
      benchmarkUpper: null,
      priceGapPercent: null,
      potentialSavingsR: null,
      remainingMonths: contractEnd ? monthsBetween(new Date(), contractEnd) : null,
      contractEndDate: contract.contractEnd || null,
      triggerType
    };
  }

  const lowerBound = parseFloat(benchmark.lowerBoundRmwh);
  const upperBound = parseFloat(benchmark.upperBoundRmwh);
  
  let status: EcosStatus;
  let recommendation: string;
  let explanation: string;

  const settings = await storage.getEcosSettings(segment);
  const priceGapThresholdPercent = settings ? parseFloat(settings.priceGapThresholdPercent || "15") : 15;
  const minAnnualSavingsR = settings ? parseFloat(settings.minAnnualSavingsR || "10000") : 10000;
  const minRemainingMonths = settings?.minRemainingMonths || 6;
  const renewalWindowMonths = settings?.renewalWindowMonths || 6;
  
  const remainingMonths = contractEnd ? monthsBetween(new Date(), contractEnd) : null;
  
  const avgConsumptionMwh = client.avgConsumptionKwh 
    ? parseFloat(client.avgConsumptionKwh) / 1000 
    : (contract.volumeMwhMonth ? parseFloat(contract.volumeMwhMonth) : 100);
  
  const priceGap = clientPrice - lowerBound;
  const safeLowerBound = lowerBound > 0 ? lowerBound : 1;
  const priceGapPercent = (priceGap / safeLowerBound) * 100;
  const potentialMonthlySavings = Math.max(0, priceGap) * avgConsumptionMwh;
  const potentialAnnualSavings = potentialMonthlySavings * 12;

  if (clientPrice <= lowerBound) {
    status = "within_band";
    recommendation = "No action required. Current contract is well-positioned.";
    explanation = `Client's price of R$${clientPrice.toFixed(2)}/MWh is at or below the market lower bound of R$${lowerBound.toFixed(2)}/MWh.`;
  } else if (clientPrice > upperBound) {
    status = "above_band";
    
    if (remainingMonths !== null && remainingMonths <= renewalWindowMonths) {
      recommendation = `URGENT: Contract expires in ${remainingMonths} months. Start renegotiation immediately to capture R$${potentialAnnualSavings.toFixed(0)} annual savings.`;
    } else if (priceGapPercent >= priceGapThresholdPercent && potentialAnnualSavings >= minAnnualSavingsR) {
      recommendation = `Consider early renegotiation. Price gap of ${priceGapPercent.toFixed(1)}% could yield R$${potentialAnnualSavings.toFixed(0)} annual savings.`;
    } else {
      recommendation = `Monitor closely. Current price is above market band but potential savings may not justify early action.`;
    }
    
    explanation = `Client's price of R$${clientPrice.toFixed(2)}/MWh exceeds market upper bound of R$${upperBound.toFixed(2)}/MWh by ${priceGapPercent.toFixed(1)}%.`;
  } else {
    status = "at_risk";
    
    const distanceToUpper = upperBound - clientPrice;
    const bandWidth = upperBound - lowerBound;
    const positionInBand = ((clientPrice - lowerBound) / bandWidth) * 100;
    
    if (positionInBand > 70) {
      recommendation = `Watch closely. Price is in the upper third of the market band. Consider proactive renewal discussions.`;
    } else if (remainingMonths !== null && remainingMonths <= renewalWindowMonths) {
      recommendation = `Contract expires in ${remainingMonths} months. Begin renewal process to secure better pricing.`;
    } else {
      recommendation = `Continue monitoring. Price is within acceptable range but not optimal.`;
    }
    
    explanation = `Client's price of R$${clientPrice.toFixed(2)}/MWh is within the market band (R$${lowerBound.toFixed(2)} - R$${upperBound.toFixed(2)}/MWh), positioned at ${positionInBand.toFixed(0)}% from lower bound.`;
  }

  const result: EcosEvaluationResult = {
    status,
    recommendation,
    explanation,
    clientPrice,
    benchmarkLower: lowerBound,
    benchmarkUpper: upperBound,
    priceGapPercent,
    potentialSavingsR: potentialAnnualSavings,
    remainingMonths,
    contractEndDate: contract.contractEnd || null,
    triggerType
  };

  await storage.createDecisionLog({
    clientId,
    contractId: contract.id,
    triggerType,
    benchmarkId: benchmark.id,
    benchmarkLowerRmwh: lowerBound.toString(),
    benchmarkUpperRmwh: upperBound.toString(),
    snapshotConfidence: benchmark.confidence || null,
    snapshotSourceType: benchmark.sourceType || null,
    clientPriceRmwh: clientPrice.toString(),
    clientConsumptionMwh: avgConsumptionMwh.toString(),
    contractRemainingMonths: remainingMonths,
    statusResult: status,
    recommendation,
    explanationPt: explanation,
    potentialSavingsR: potentialAnnualSavings.toString()
  });

  return result;
}

export async function evaluateAllClients(
  triggerType: string = "quarterly_check"
): Promise<{ clientId: number; result: EcosEvaluationResult }[]> {
  const clients = await storage.getClients();
  const results: { clientId: number; result: EcosEvaluationResult }[] = [];
  
  for (const client of clients) {
    if (client.status === "active") {
      try {
        const result = await evaluateClient(client.id, triggerType);
        results.push({ clientId: client.id, result });
      } catch (error) {
        console.error(`Failed to evaluate client ${client.id}:`, error);
      }
    }
  }
  
  return results;
}

export async function getClientEcosStatus(clientId: number): Promise<EcosDecisionLog | null> {
  const log = await storage.getLatestDecisionLog(clientId);
  return log ?? null;
}
