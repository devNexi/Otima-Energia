import { IStorage } from './storage';
import { BlockerEngine } from './blockerEngine';

export const ASSEMBLY_STAGES = [
  'ORIGIN_QUALIFICATION',
  'BILL_UPLOADED',
  'ECOS_GENERATED',
  'DOSSIER_DRAFT',
  'DOSSIER_LOCKED',
  'RFQ_SENT',
  'QUOTES_RECEIVED',
  'QUOTE_SELECTED',
  'PROPOSAL_GENERATED',
  'ONBOARDING',
  'CONTRACT_SIGNED',
  'SUPPLY_LIVE'
] as const;

export type AssemblyStage = typeof ASSEMBLY_STAGES[number];

export interface AssemblyBlocker {
  code: string;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  deepLink: string;
  severity: 'error' | 'warning';
}

export interface AssemblyStageStatus {
  stage: AssemblyStage;
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked';
  blockers: AssemblyBlocker[];
  actionButtonPt: string | null;
  actionButtonEn: string | null;
  actionDeepLink: string | null;
  evidenceLinks: Array<{ label: string; url: string }>;
  completedAt: string | null;
}

export interface AssemblyStatus {
  dealId: string;
  currentStage: AssemblyStage;
  stages: AssemblyStageStatus[];
  nextStep: {
    stagePt: string;
    stageEn: string;
    actionPt: string;
    actionEn: string;
    deepLink: string;
  } | null;
  isBlocked: boolean;
  blockerCount: number;
  idleSinceDays: number;
  lastActivityAt: string | null;
  canAdvance: boolean;
}

const STAGE_LABELS = {
  ORIGIN_QUALIFICATION: { pt: 'Origem & Qualificação', en: 'Origin & Qualification' },
  BILL_UPLOADED: { pt: 'Fatura Carregada', en: 'Bill Uploaded' },
  ECOS_GENERATED: { pt: 'ECOS Gerado', en: 'ECOS Generated' },
  DOSSIER_DRAFT: { pt: 'Dossiê do Cliente', en: 'Client Dossier' },
  DOSSIER_LOCKED: { pt: 'Dossiê Travado', en: 'Dossier Locked' },
  RFQ_SENT: { pt: 'RFQ Enviado', en: 'RFQ Sent' },
  QUOTES_RECEIVED: { pt: 'Cotações Recebidas', en: 'Quotes Received' },
  QUOTE_SELECTED: { pt: 'Cotação Selecionada', en: 'Quote Selected' },
  PROPOSAL_GENERATED: { pt: 'Proposta Gerada', en: 'Proposal Generated' },
  ONBOARDING: { pt: 'Onboarding (Docs)', en: 'Onboarding (Docs)' },
  CONTRACT_SIGNED: { pt: 'Contrato Assinado', en: 'Contract Signed' },
  SUPPLY_LIVE: { pt: 'Fornecimento Ativo', en: 'Supply Live' }
};

export class DealAssemblyEngine {
  private blockerEngine: BlockerEngine;

  constructor(private storage: IStorage) {
    this.blockerEngine = new BlockerEngine(storage);
  }

  async getAssemblyStatus(dealId: string): Promise<AssemblyStatus | null> {
    const deal = await this.storage.getDeal(dealId);
    if (!deal) return null;

    const dossier = await this.storage.getClientDossier(deal.clientId);
    const quotes = await this.storage.getDealQuotes(dealId);
    const proposals = await this.storage.getDealProposals(dealId);
    const rfqDispatches = await this.storage.getRfqDispatchesForDeal(dealId);

    const billCheck = await this.blockerEngine.checkDealHasBill(dealId);
    const hasEcos = await this.blockerEngine.checkDealHasEcos(dealId);
    
    const today = new Date();
    const lastActivityAt = deal.updatedAt?.toISOString() || deal.createdAt?.toISOString() || null;
    const idleSinceDays = lastActivityAt 
      ? Math.floor((today.getTime() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const stages: AssemblyStageStatus[] = [];
    let currentStage: AssemblyStage = 'ORIGIN_QUALIFICATION';
    let isBlocked = false;
    let blockerCount = 0;

    stages.push(this.buildOriginStage(deal));
    stages.push(this.buildBillUploadedStage(deal, billCheck));
    stages.push(this.buildEcosGeneratedStage(deal, billCheck.hasBill, hasEcos));
    stages.push(await this.buildDossierDraftStage(deal, dossier));
    stages.push(await this.buildDossierLockedStage(deal, dossier));
    stages.push(await this.buildRfqSentStage(deal, dossier, rfqDispatches));
    stages.push(await this.buildQuotesReceivedStage(deal, quotes));
    stages.push(await this.buildQuoteSelectedStage(deal, quotes));
    stages.push(await this.buildProposalGeneratedStage(deal, proposals));
    stages.push(await this.buildOnboardingStage(deal));
    stages.push(await this.buildContractSignedStage(deal));
    stages.push(this.buildSupplyLiveStage(deal));

    for (const stage of stages) {
      if (stage.status === 'in_progress' || stage.status === 'blocked') {
        currentStage = stage.stage;
        if (stage.status === 'blocked') {
          isBlocked = true;
          blockerCount += stage.blockers.length;
        }
        break;
      }
      if (stage.status === 'complete') {
        currentStage = stage.stage;
      }
    }

    const nextStep = this.computeNextStep(stages, currentStage);

    return {
      dealId,
      currentStage,
      stages,
      nextStep,
      isBlocked,
      blockerCount,
      idleSinceDays,
      lastActivityAt,
      canAdvance: !isBlocked
    };
  }

  private buildOriginStage(deal: any): AssemblyStageStatus {
    return {
      stage: 'ORIGIN_QUALIFICATION',
      status: 'complete',
      blockers: [],
      actionButtonPt: null,
      actionButtonEn: null,
      actionDeepLink: null,
      evidenceLinks: deal.zohoLeadId 
        ? [{ label: 'Lead Zoho', url: `#zoho-lead-${deal.zohoLeadId}` }]
        : [],
      completedAt: deal.createdAt?.toISOString() || null
    };
  }

  private buildBillUploadedStage(deal: any, billCheck: { hasBill: boolean; parsedCount: number; totalCount: number; pendingCount: number; failedCount: number }): AssemblyStageStatus {
    const blockers: AssemblyBlocker[] = [];

    if (billCheck.totalCount === 0) {
      blockers.push({
        code: 'NO_BILL',
        titlePt: 'Nenhuma fatura carregada',
        titleEn: 'No bill uploaded',
        descriptionPt: 'Carregue pelo menos uma fatura de energia (PDF) para iniciar a análise.',
        descriptionEn: 'Upload at least one energy bill (PDF) to start analysis.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=assembly`,
        severity: 'error'
      });
    } else if (billCheck.failedCount > 0 && billCheck.parsedCount === 0 && billCheck.pendingCount === 0) {
      blockers.push({
        code: 'BILL_PARSE_FAILED',
        titlePt: `${billCheck.failedCount} fatura(s) com falha na análise`,
        titleEn: `${billCheck.failedCount} bill(s) failed parsing`,
        descriptionPt: 'A análise da fatura falhou. Clique em Reprocessar na aba de montagem.',
        descriptionEn: 'Bill parsing failed. Click Retry on the assembly tab.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=assembly`,
        severity: 'error'
      });
    }

    const isParsing = billCheck.pendingCount > 0;
    const status = billCheck.hasBill ? 'complete'
      : isParsing ? 'in_progress'
      : blockers.length > 0 ? 'blocked'
      : 'in_progress';

    return {
      stage: 'BILL_UPLOADED',
      status,
      blockers,
      actionButtonPt: billCheck.hasBill ? null
        : isParsing ? null
        : billCheck.failedCount > 0 ? 'Reprocessar Fatura'
        : 'Carregar Fatura',
      actionButtonEn: billCheck.hasBill ? null
        : isParsing ? null
        : billCheck.failedCount > 0 ? 'Retry Parse'
        : 'Upload Bill',
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=assembly`,
      evidenceLinks: billCheck.hasBill
        ? [{ label: `${billCheck.parsedCount} fatura(s)`, url: `/admin/ops/deals/${deal.id}?tab=assembly` }]
        : billCheck.totalCount > 0
        ? [{ label: `${billCheck.totalCount} enviada(s), ${billCheck.pendingCount} pendente(s), ${billCheck.failedCount} falha(s)`, url: `/admin/ops/deals/${deal.id}?tab=assembly` }]
        : [],
      completedAt: null
    };
  }

  private buildEcosGeneratedStage(deal: any, hasBill: boolean, hasEcos: boolean): AssemblyStageStatus {
    const blockers: AssemblyBlocker[] = [];

    if (!hasBill) {
      blockers.push({
        code: 'BILL_REQUIRED_FOR_ECOS',
        titlePt: 'Fatura necessária',
        titleEn: 'Bill required',
        descriptionPt: 'Carregue uma fatura antes de gerar o ECOS.',
        descriptionEn: 'Upload a bill before generating ECOS.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=assembly`,
        severity: 'error'
      });
    } else if (!hasEcos) {
      blockers.push({
        code: 'ECOS_NOT_GENERATED',
        titlePt: 'ECOS não gerado',
        titleEn: 'ECOS not generated',
        descriptionPt: 'Gere o perfil ECOS a partir dos dados da fatura.',
        descriptionEn: 'Generate the ECOS profile from bill data.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=assembly`,
        severity: 'error'
      });
    }

    const status = hasEcos ? 'complete' : !hasBill ? 'not_started' : 'blocked';

    return {
      stage: 'ECOS_GENERATED',
      status,
      blockers,
      actionButtonPt: hasBill && !hasEcos ? 'Gerar ECOS' : null,
      actionButtonEn: hasBill && !hasEcos ? 'Generate ECOS' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=assembly`,
      evidenceLinks: hasEcos ? [{ label: 'ECOS Snapshot', url: `/admin/ops/deals/${deal.id}?tab=ecos` }] : [],
      completedAt: null
    };
  }

  private async buildDossierDraftStage(deal: any, dossier: any): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    if (!dossier) {
      blockers.push({
        code: 'DOSSIER_NOT_CREATED',
        titlePt: 'Dossiê não criado',
        titleEn: 'Dossier not created',
        descriptionPt: 'Crie o dossiê energético do cliente.',
        descriptionEn: 'Create the client energy dossier.',
        deepLink: `/admin/dossier/${deal.clientId}`,
        severity: 'error'
      });
    }

    const status = !dossier ? 'blocked' 
      : dossier.status === 'DRAFT' ? 'in_progress'
      : 'complete';

    return {
      stage: 'DOSSIER_DRAFT',
      status,
      blockers,
      actionButtonPt: status !== 'complete' ? 'Completar Dossiê' : null,
      actionButtonEn: status !== 'complete' ? 'Complete Dossier' : null,
      actionDeepLink: `/admin/dossier/${deal.clientId}`,
      evidenceLinks: dossier ? [{ label: 'Dossiê', url: `/admin/dossier/${deal.clientId}` }] : [],
      completedAt: dossier?.status !== 'DRAFT' ? dossier?.updatedAt?.toISOString() : null
    };
  }

  private async buildDossierLockedStage(deal: any, dossier: any): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];

    const hasRequiredFields = dossier?.legalName && dossier?.cnpj && dossier?.distributor && dossier?.annualConsumptionMWh && dossier?.connectionType;

    if (!dossier) {
      blockers.push({
        code: 'DOSSIER_NOT_CREATED',
        titlePt: 'Dossiê não criado',
        titleEn: 'Dossier not created',
        descriptionPt: 'Crie o dossiê energético do cliente.',
        descriptionEn: 'Create the client energy dossier.',
        deepLink: `/admin/dossier/${deal.clientId}`,
        severity: 'error'
      });
    } else if (!hasRequiredFields) {
      blockers.push({
        code: 'DOSSIER_INCOMPLETE',
        titlePt: 'Dossiê incompleto',
        titleEn: 'Dossier incomplete',
        descriptionPt: 'Preencha todos os campos obrigatórios: razão social, CNPJ, distribuidora, consumo e tipo de conexão.',
        descriptionEn: 'Fill all required fields: legal name, CNPJ, distributor, consumption, and connection type.',
        deepLink: `/admin/dossier/${deal.clientId}`,
        severity: 'error'
      });
    }

    const status = !dossier ? 'not_started'
      : hasRequiredFields ? 'complete'
      : 'in_progress';

    return {
      stage: 'DOSSIER_LOCKED',
      status: blockers.length > 0 ? 'blocked' : status,
      blockers,
      actionButtonPt: status !== 'complete' ? 'Completar Dossiê' : null,
      actionButtonEn: status !== 'complete' ? 'Complete Dossier' : null,
      actionDeepLink: `/admin/dossier/${deal.clientId}`,
      evidenceLinks: dossier ? [{ label: 'Dossiê', url: `/admin/dossier/${deal.clientId}` }] : [],
      completedAt: hasRequiredFields ? (dossier?.updatedAt?.toISOString() || null) : null
    };
  }

  private async buildRfqSentStage(deal: any, dossier: any, rfqDispatches: any[]): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    const dossierHasFields = dossier?.legalName && dossier?.cnpj && dossier?.distributor && dossier?.annualConsumptionMWh && dossier?.connectionType;
    if (!dossier || !dossierHasFields) {
      blockers.push({
        code: 'DOSSIER_NOT_READY',
        titlePt: 'Dossiê incompleto',
        titleEn: 'Dossier incomplete',
        descriptionPt: 'Complete o dossiê do cliente antes de enviar RFQ.',
        descriptionEn: 'Complete the client dossier before sending RFQ.',
        deepLink: `/admin/dossier/${deal.clientId}`,
        severity: 'error'
      });
    }

    const sentDispatches = rfqDispatches.filter(d => d.status === 'SENT' || d.status === 'RESPONDED');
    const hasSentRfq = sentDispatches.length > 0 || ['RFQ_SENT', 'QUOTES_RECEIVED', 'OFFER_SELECTED', 'ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);

    const status = hasSentRfq ? 'complete' 
      : blockers.length > 0 ? 'blocked'
      : 'in_progress';

    return {
      stage: 'RFQ_SENT',
      status,
      blockers,
      actionButtonPt: status !== 'complete' ? 'Enviar RFQ' : null,
      actionButtonEn: status !== 'complete' ? 'Send RFQ' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=rfq`,
      evidenceLinks: sentDispatches.map(d => ({ label: `RFQ #${d.id}`, url: `/admin/ops/rfq/${d.id}` })),
      completedAt: sentDispatches[0]?.sentAt?.toISOString() || null
    };
  }

  private async buildQuotesReceivedStage(deal: any, quotes: any[]): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    const eligibleQuotes = quotes.filter(q => 
      q.clientEnergyPriceRmwh && 
      q.termMonths && 
      !q.isExpired && 
      !q.isRiskFlagged
    );

    if (eligibleQuotes.length < 2 && !['OFFER_SELECTED', 'ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status)) {
      blockers.push({
        code: 'INSUFFICIENT_QUOTES',
        titlePt: `Apenas ${eligibleQuotes.length} cotação(ões) elegível(is)`,
        titleEn: `Only ${eligibleQuotes.length} eligible quote(s)`,
        descriptionPt: 'Mínimo de 2 cotações elegíveis para proposta.',
        descriptionEn: 'Minimum 2 eligible quotes for proposal.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=quotes`,
        severity: eligibleQuotes.length === 0 ? 'error' : 'warning'
      });
    }

    const hasQuotes = quotes.length > 0 || ['QUOTES_RECEIVED', 'OFFER_SELECTED', 'ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);

    const status = hasQuotes ? 'complete' 
      : blockers.some(b => b.severity === 'error') ? 'blocked'
      : 'in_progress';

    return {
      stage: 'QUOTES_RECEIVED',
      status,
      blockers,
      actionButtonPt: status !== 'complete' ? 'Registrar Cotação' : null,
      actionButtonEn: status !== 'complete' ? 'Record Quote' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=quotes&action=add`,
      evidenceLinks: quotes.slice(0, 5).map(q => ({ label: `Cotação ${q.supplierId}`, url: `/admin/ops/deals/${deal.id}?tab=quotes&quoteId=${q.id}` })),
      completedAt: quotes[0]?.createdAt?.toISOString() || null
    };
  }

  private async buildQuoteSelectedStage(deal: any, quotes: any[]): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    const selectedQuote = quotes.find(q => q.isSelected);
    
    if (!selectedQuote && !['OFFER_SELECTED', 'ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status)) {
      blockers.push({
        code: 'NO_QUOTE_SELECTED',
        titlePt: 'Nenhuma cotação selecionada',
        titleEn: 'No quote selected',
        descriptionPt: 'Selecione uma cotação recomendada para gerar proposta.',
        descriptionEn: 'Select a recommended quote to generate proposal.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=quotes`,
        severity: 'error'
      });
    }

    const hasSelected = selectedQuote || ['OFFER_SELECTED', 'ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);

    return {
      stage: 'QUOTE_SELECTED',
      status: hasSelected ? 'complete' : blockers.length > 0 ? 'blocked' : 'in_progress',
      blockers,
      actionButtonPt: !hasSelected ? 'Selecionar Cotação' : null,
      actionButtonEn: !hasSelected ? 'Select Quote' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=quotes`,
      evidenceLinks: selectedQuote ? [{ label: 'Cotação Selecionada', url: `/admin/ops/deals/${deal.id}?tab=quotes&quoteId=${selectedQuote.id}` }] : [],
      completedAt: selectedQuote?.selectedAt?.toISOString() || null
    };
  }

  private async buildProposalGeneratedStage(deal: any, proposals: any[]): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    const generatedProposals = proposals.filter(p => p.status !== 'DRAFT');
    
    if (generatedProposals.length === 0 && !['ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status)) {
      blockers.push({
        code: 'NO_PROPOSAL_GENERATED',
        titlePt: 'Proposta não gerada',
        titleEn: 'Proposal not generated',
        descriptionPt: 'Gere a proposta comercial para o cliente.',
        descriptionEn: 'Generate the commercial proposal for the client.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=proposals`,
        severity: 'warning'
      });
    }

    const hasProposal = generatedProposals.length > 0 || ['ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);

    return {
      stage: 'PROPOSAL_GENERATED',
      status: hasProposal ? 'complete' : 'in_progress',
      blockers,
      actionButtonPt: !hasProposal ? 'Gerar Proposta' : null,
      actionButtonEn: !hasProposal ? 'Generate Proposal' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=proposals`,
      evidenceLinks: generatedProposals.map(p => ({ label: `Proposta ${p.id.slice(0, 8)}`, url: `/admin/ops/deals/${deal.id}?tab=proposals&proposalId=${p.id}` })),
      completedAt: generatedProposals[0]?.createdAt?.toISOString() || null
    };
  }

  private async buildOnboardingStage(deal: any): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    const isOnboarding = ['ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);
    const isComplete = ['CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);

    return {
      stage: 'ONBOARDING',
      status: isComplete ? 'complete' : isOnboarding ? 'in_progress' : 'not_started',
      blockers,
      actionButtonPt: isOnboarding && !isComplete ? 'Ver Checklist' : null,
      actionButtonEn: isOnboarding && !isComplete ? 'View Checklist' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?tab=compliance`,
      evidenceLinks: [],
      completedAt: null
    };
  }

  private async buildContractSignedStage(deal: any): Promise<AssemblyStageStatus> {
    const blockers: AssemblyBlocker[] = [];
    
    const isContractSigned = ['CONTRACT_SIGNED', 'SUPPLY_LIVE'].includes(deal.status);

    if (!isContractSigned && deal.status === 'ONBOARDING_PENDING') {
      blockers.push({
        code: 'COMPLIANCE_INCOMPLETE',
        titlePt: 'Checklist de compliance incompleto',
        titleEn: 'Compliance checklist incomplete',
        descriptionPt: 'Complete todos os itens de compliance antes de assinar.',
        descriptionEn: 'Complete all compliance items before signing.',
        deepLink: `/admin/ops/deals/${deal.id}?tab=compliance`,
        severity: 'error'
      });
    }

    return {
      stage: 'CONTRACT_SIGNED',
      status: isContractSigned ? 'complete' : blockers.length > 0 ? 'blocked' : 'not_started',
      blockers,
      actionButtonPt: !isContractSigned ? 'Marcar Assinado' : null,
      actionButtonEn: !isContractSigned ? 'Mark Signed' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?action=sign-contract`,
      evidenceLinks: [],
      completedAt: null
    };
  }

  private buildSupplyLiveStage(deal: any): AssemblyStageStatus {
    const isLive = deal.status === 'SUPPLY_LIVE';

    return {
      stage: 'SUPPLY_LIVE',
      status: isLive ? 'complete' : 'not_started',
      blockers: [],
      actionButtonPt: !isLive ? 'Ativar Fornecimento' : null,
      actionButtonEn: !isLive ? 'Activate Supply' : null,
      actionDeepLink: `/admin/ops/deals/${deal.id}?action=go-live`,
      evidenceLinks: [],
      completedAt: null
    };
  }

  private computeNextStep(stages: AssemblyStageStatus[], currentStage: AssemblyStage): AssemblyStatus['nextStep'] {
    for (const stage of stages) {
      if (stage.status === 'blocked' && stage.blockers.length > 0) {
        const blocker = stage.blockers[0];
        return {
          stagePt: STAGE_LABELS[stage.stage].pt,
          stageEn: STAGE_LABELS[stage.stage].en,
          actionPt: blocker.titlePt,
          actionEn: blocker.titleEn,
          deepLink: blocker.deepLink
        };
      }
      if (stage.status === 'in_progress' && stage.actionButtonPt) {
        return {
          stagePt: STAGE_LABELS[stage.stage].pt,
          stageEn: STAGE_LABELS[stage.stage].en,
          actionPt: stage.actionButtonPt,
          actionEn: stage.actionButtonEn || '',
          deepLink: stage.actionDeepLink || ''
        };
      }
    }
    return null;
  }

  async getAssemblyQueue(filters: {
    userId?: string;
    stage?: AssemblyStage;
    blockedOnly?: boolean;
    needsActionToday?: boolean;
    limit?: number;
  } = {}): Promise<Array<AssemblyStatus & { deal: any; client: any }>> {
    const maxItems = filters.limit ?? 50;
    const allDeals = await this.storage.getDeals();
    const queue: Array<AssemblyStatus & { deal: any; client: any }> = [];

    for (const deal of allDeals) {
      if (queue.length >= maxItems) break;
      if (deal.status === 'LOST' || deal.status === 'CLOSED' || deal.status === 'CONTRACT_ENDED') continue;
      
      if (filters.userId && deal.opsOwner !== filters.userId && deal.internalOwner !== filters.userId) continue;

      const status = await this.getAssemblyStatus(deal.id);
      if (!status) continue;

      if (filters.stage && status.currentStage !== filters.stage) continue;
      if (filters.blockedOnly && !status.isBlocked) continue;
      if (filters.needsActionToday && status.idleSinceDays < 1) continue;

      const client = await this.storage.getClient(deal.clientId);
      queue.push({ ...status, deal, client });
    }

    return queue.sort((a, b) => {
      if (a.isBlocked !== b.isBlocked) return a.isBlocked ? -1 : 1;
      return b.idleSinceDays - a.idleSinceDays;
    });
  }
}
