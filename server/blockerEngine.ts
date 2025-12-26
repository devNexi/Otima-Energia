import { IStorage } from './storage';

export interface Blocker {
  code: string;
  title: string;
  description: string;
  deepLink: string;
  severity: 'error' | 'warning';
}

export interface BlockerResult {
  isBlocked: boolean;
  blockers: Blocker[];
}

export class BlockerEngine {
  constructor(private storage: IStorage) {}

  async checkCreateDeal(clientId: number): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const client = await this.storage.getClient(clientId);
    if (!client) {
      blockers.push({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        description: 'O cliente não existe no sistema.',
        deepLink: '/admin/sales/clients',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    const dossier = await this.storage.getClientDossier(clientId);
    if (!dossier) {
      blockers.push({
        code: 'DOSSIER_REQUIRED',
        title: 'Dossiê não criado',
        description: 'Crie o dossiê energético do cliente antes de criar um negócio.',
        deepLink: `/admin/sales/clients?action=dossier&clientId=${clientId}`,
        severity: 'error'
      });
    } else if (dossier.status === 'DRAFT') {
      blockers.push({
        code: 'DOSSIER_NOT_READY',
        title: 'Dossiê incompleto',
        description: 'O dossiê deve estar marcado como PRONTO antes de criar um negócio.',
        deepLink: `/admin/sales/clients?action=dossier&clientId=${clientId}`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkSendRfq(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'DRAFT') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `O negócio deve estar em DRAFT para enviar RFQ. Estado atual: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    const dossier = await this.storage.getClientDossier(deal.clientId);
    if (!dossier || dossier.status === 'DRAFT') {
      blockers.push({
        code: 'DOSSIER_NOT_READY',
        title: 'Dossiê incompleto',
        description: 'O dossiê do cliente deve estar PRONTO antes de enviar RFQ.',
        deepLink: `/admin/sales/clients?action=dossier&clientId=${deal.clientId}`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkRecordQuotes(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'RFQ_SENT') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `RFQ deve ser enviado antes de registrar cotações. Estado atual: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkGenerateProposal(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'QUOTES_RECEIVED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `Cotações devem ser recebidas antes de gerar proposta. Estado atual: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkAdvanceToOfferSelected(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'QUOTES_RECEIVED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `Estado atual não permite seleção de oferta. Estado: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    if (!deal.selectedQuoteId) {
      blockers.push({
        code: 'NO_QUOTE_SELECTED',
        title: 'Nenhuma cotação selecionada',
        description: 'Selecione uma cotação antes de avançar.',
        deepLink: `/admin/ops/deals?dealId=${dealId}&tab=quotes`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkAdvanceToOnboarding(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'OFFER_SELECTED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `Estado atual não permite onboarding. Estado: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkAdvanceToContractSigned(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'ONBOARDING_PENDING') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `Estado atual não permite assinatura de contrato. Estado: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    const checklist = await this.storage.getDealChecklistItems(String(dealId));
    const incompleteItems = checklist.filter((item: any) => !item.completed);
    if (incompleteItems.length > 0) {
      blockers.push({
        code: 'CHECKLIST_INCOMPLETE',
        title: 'Checklist incompleto',
        description: `${incompleteItems.length} item(s) do checklist precisam ser concluídos.`,
        deepLink: `/admin/ops/deals?dealId=${dealId}&tab=compliance`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async checkAdvanceToSupplyLive(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        title: 'Negócio não encontrado',
        description: 'O negócio não existe no sistema.',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { isBlocked: true, blockers };
    }

    if (deal.status !== 'CONTRACT_SIGNED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        title: 'Estado inválido',
        description: `Estado atual não permite ativar fornecimento. Estado: ${deal.status}`,
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { isBlocked: blockers.some(b => b.severity === 'error'), blockers };
  }

  async getClientNextAction(clientId: number): Promise<{ action: string; actionLabel: string; deepLink: string; blockers: Blocker[] }> {
    const client = await this.storage.getClient(clientId);
    if (!client) {
      return {
        action: 'not_found',
        actionLabel: 'Cliente não encontrado',
        deepLink: '/admin/sales/clients',
        blockers: []
      };
    }

    const dossier = await this.storage.getClientDossier(clientId);
    
    if (!dossier) {
      return {
        action: 'create_dossier',
        actionLabel: 'Criar Dossiê',
        deepLink: `/admin/sales/clients?action=dossier&clientId=${clientId}`,
        blockers: [{
          code: 'DOSSIER_REQUIRED',
          title: 'Dossiê não criado',
          description: 'Crie o dossiê energético para prosseguir.',
          deepLink: `/admin/sales/clients?action=dossier&clientId=${clientId}`,
          severity: 'warning'
        }]
      };
    }

    if (dossier.status === 'DRAFT') {
      return {
        action: 'complete_dossier',
        actionLabel: 'Completar Dossiê',
        deepLink: `/admin/sales/clients?action=dossier&clientId=${clientId}`,
        blockers: [{
          code: 'DOSSIER_NOT_READY',
          title: 'Dossiê incompleto',
          description: 'Complete o dossiê e marque como PRONTO.',
          deepLink: `/admin/sales/clients?action=dossier&clientId=${clientId}`,
          severity: 'warning'
        }]
      };
    }

    const deals = await this.storage.getDealsForClient(clientId);
    const activeDeals = deals.filter((d: any) => d.status !== 'CLOSED' && d.status !== 'LOST');
    
    if (activeDeals.length === 0) {
      return {
        action: 'create_deal',
        actionLabel: 'Criar Negócio',
        deepLink: `/admin/ops/deals?action=create&clientId=${clientId}`,
        blockers: []
      };
    }

    return {
      action: 'view_deals',
      actionLabel: 'Ver Negócios',
      deepLink: `/admin/ops/deals?clientId=${clientId}`,
      blockers: []
    };
  }

  async getDealNextAction(dealId: number | string): Promise<{ action: string; actionLabel: string; deepLink: string; blockers: Blocker[] }> {
    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      return {
        action: 'not_found',
        actionLabel: 'Negócio não encontrado',
        deepLink: '/admin/ops/deals',
        blockers: []
      };
    }

    const stateActions: Record<string, { action: string; actionLabel: string }> = {
      'DRAFT': { action: 'send_rfq', actionLabel: 'Enviar RFQ' },
      'RFQ_SENT': { action: 'record_quotes', actionLabel: 'Registrar Cotações' },
      'QUOTES_RECEIVED': { action: 'generate_proposal', actionLabel: 'Gerar Proposta' },
      'OFFER_SELECTED': { action: 'start_onboarding', actionLabel: 'Iniciar Onboarding' },
      'ONBOARDING_PENDING': { action: 'sign_contract', actionLabel: 'Assinar Contrato' },
      'CONTRACT_SIGNED': { action: 'activate_supply', actionLabel: 'Ativar Fornecimento' },
      'SUPPLY_LIVE': { action: 'track_revenue', actionLabel: 'Acompanhar Receita' },
      'CONTRACT_ENDED': { action: 'renew_or_close', actionLabel: 'Renovar ou Encerrar' },
      'CLOSED': { action: 'view_history', actionLabel: 'Ver Histórico' },
      'LOST': { action: 'view_history', actionLabel: 'Ver Histórico' }
    };

    const nextAction = stateActions[deal.status] || { action: 'unknown', actionLabel: 'Ação desconhecida' };
    
    let blockerResult: BlockerResult = { isBlocked: false, blockers: [] };
    
    switch (deal.status) {
      case 'DRAFT':
        blockerResult = await this.checkSendRfq(dealId);
        break;
      case 'RFQ_SENT':
        blockerResult = await this.checkRecordQuotes(dealId);
        break;
      case 'QUOTES_RECEIVED':
        blockerResult = await this.checkGenerateProposal(dealId);
        break;
      case 'OFFER_SELECTED':
        blockerResult = await this.checkAdvanceToOnboarding(dealId);
        break;
      case 'ONBOARDING_PENDING':
        blockerResult = await this.checkAdvanceToContractSigned(dealId);
        break;
      case 'CONTRACT_SIGNED':
        blockerResult = await this.checkAdvanceToSupplyLive(dealId);
        break;
    }

    return {
      action: nextAction.action,
      actionLabel: nextAction.actionLabel,
      deepLink: `/admin/ops/deals?dealId=${dealId}`,
      blockers: blockerResult.blockers
    };
  }
}
