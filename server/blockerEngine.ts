import { IStorage } from './storage';
import { billsExtracted, dealEcosSnapshots } from '@shared/schema';
import { db } from './db';
import { eq, and } from 'drizzle-orm';

export interface Blocker {
  code: string;
  message: string;
  cta: string;
  deepLink: string;
  severity: 'error' | 'warning';
}

export interface BlockerResult {
  ok: boolean;
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
        message: 'Client not found in system.',
        cta: 'Find Client',
        deepLink: '/admin/sales/clients',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkDealHasBill(dealId: string): Promise<{ hasBill: boolean; parsedCount: number; totalCount: number; pendingCount: number; failedCount: number }> {
    const allBills = await db.select().from(billsExtracted)
      .where(eq(billsExtracted.dealId, dealId));
    const parsedCount = allBills.filter(b => b.parseStatus === 'PARSED').length;
    const pendingCount = allBills.filter(b => b.parseStatus === 'PENDING' || b.parseStatus === 'PARSING' || b.parseStatus === 'UPLOADED').length;
    const failedCount = allBills.filter(b => b.parseStatus === 'FAILED').length;
    return { hasBill: parsedCount > 0, parsedCount, totalCount: allBills.length, pendingCount, failedCount };
  }

  async checkDealHasEcos(dealId: string): Promise<boolean> {
    const snapshots = await db.select().from(dealEcosSnapshots)
      .where(eq(dealEcosSnapshots.dealId, dealId));
    return snapshots.length > 0;
  }

  async checkSendRfq(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];
    const did = String(dealId);

    const deal = await this.storage.getDeal(did);
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    const { hasBill } = await this.checkDealHasBill(did);
    if (!hasBill) {
      blockers.push({
        code: 'NO_BILL',
        message: 'No parsed bill uploaded for this deal. Upload at least one energy bill (PDF).',
        cta: 'Upload Bill',
        deepLink: `/admin/ops/deals/${did}?tab=assembly`,
        severity: 'error'
      });
    }

    const hasEcos = await this.checkDealHasEcos(did);
    if (!hasEcos) {
      blockers.push({
        code: 'NO_ECOS',
        message: 'ECOS profile not generated. Generate ECOS from bill data + PRC pricing.',
        cta: 'Generate ECOS',
        deepLink: `/admin/ops/deals/${did}?tab=assembly`,
        severity: 'error'
      });
    }

    const dossier = await this.storage.getClientDossier(deal.clientId);
    if (!dossier || dossier.status === 'DRAFT') {
      blockers.push({
        code: 'DOSSIER_NOT_READY',
        message: 'Client dossier is not ready. Complete and mark as READY before sending RFQ.',
        cta: 'Complete Dossier',
        deepLink: `/admin/sales/clients?action=dossier&clientId=${deal.clientId}`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkRecordQuotes(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    if (deal.status !== 'RFQ_SENT') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        message: `RFQ must be sent before recording quotes. Current state: ${deal.status}`,
        cta: 'Send RFQ First',
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkGenerateProposal(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    if (deal.status !== 'QUOTES_RECEIVED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        message: `Quotes must be received before generating proposal. Current state: ${deal.status}`,
        cta: 'Wait for Quotes',
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkAdvanceToOfferSelected(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    if (deal.status !== 'QUOTES_RECEIVED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        message: `Current state does not allow offer selection. State: ${deal.status}`,
        cta: 'Wait for Quotes',
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    if (!deal.selectedQuoteId) {
      blockers.push({
        code: 'NO_QUOTE_SELECTED',
        message: 'Select a quote before advancing.',
        cta: 'Select Quote',
        deepLink: `/admin/ops/deals?dealId=${dealId}&tab=quotes`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkAdvanceToOnboarding(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    if (deal.status !== 'OFFER_SELECTED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        message: `Current state does not allow onboarding. State: ${deal.status}`,
        cta: 'Select Offer First',
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkAdvanceToContractSigned(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    if (deal.status !== 'ONBOARDING_PENDING') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        message: `Current state does not allow contract signing. State: ${deal.status}`,
        cta: 'Complete Onboarding',
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    const checklist = await this.storage.getDealChecklistItems(String(dealId));
    const incompleteItems = checklist.filter((item: any) => !item.completed);
    if (incompleteItems.length > 0) {
      blockers.push({
        code: 'CHECKLIST_INCOMPLETE',
        message: `${incompleteItems.length} checklist item(s) need completion.`,
        cta: 'Complete Checklist',
        deepLink: `/admin/ops/deals?dealId=${dealId}&tab=compliance`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async checkAdvanceToSupplyLive(dealId: number | string): Promise<BlockerResult> {
    const blockers: Blocker[] = [];

    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      blockers.push({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        cta: 'Find Deal',
        deepLink: '/admin/ops/deals',
        severity: 'error'
      });
      return { ok: false, blockers };
    }

    if (deal.status !== 'CONTRACT_SIGNED') {
      blockers.push({
        code: 'INVALID_DEAL_STATE',
        message: `Current state does not allow supply activation. State: ${deal.status}`,
        cta: 'Sign Contract First',
        deepLink: `/admin/ops/deals?dealId=${dealId}`,
        severity: 'error'
      });
    }

    return { ok: blockers.length === 0, blockers };
  }

  async getClientNextAction(clientId: number): Promise<{ action: string; actionLabel: string; deepLink: string; blockers: Blocker[] }> {
    const client = await this.storage.getClient(clientId);
    if (!client) {
      return {
        action: 'not_found',
        actionLabel: 'Client not found',
        deepLink: '/admin/sales/clients',
        blockers: []
      };
    }

    const deals = await this.storage.getDealsForClient(clientId);
    const activeDeals = deals.filter((d: any) => d.status !== 'CLOSED' && d.status !== 'LOST');
    
    if (activeDeals.length === 0) {
      return {
        action: 'create_deal',
        actionLabel: 'Create Deal',
        deepLink: `/admin/ops/deals?action=create&clientId=${clientId}`,
        blockers: []
      };
    }

    return {
      action: 'view_deals',
      actionLabel: 'View Deals',
      deepLink: `/admin/ops/deals?clientId=${clientId}`,
      blockers: []
    };
  }

  async getDealNextAction(dealId: number | string): Promise<{ action: string; actionLabel: string; deepLink: string; blockers: Blocker[] }> {
    const deal = await this.storage.getDeal(String(dealId));
    if (!deal) {
      return {
        action: 'not_found',
        actionLabel: 'Deal not found',
        deepLink: '/admin/ops/deals',
        blockers: []
      };
    }

    const stateActions: Record<string, { action: string; actionLabel: string }> = {
      'DRAFT': { action: 'send_rfq', actionLabel: 'Send RFQ' },
      'RFQ_SENT': { action: 'record_quotes', actionLabel: 'Record Quotes' },
      'QUOTES_RECEIVED': { action: 'generate_proposal', actionLabel: 'Generate Proposal' },
      'OFFER_SELECTED': { action: 'start_onboarding', actionLabel: 'Start Onboarding' },
      'ONBOARDING_PENDING': { action: 'sign_contract', actionLabel: 'Sign Contract' },
      'CONTRACT_SIGNED': { action: 'activate_supply', actionLabel: 'Activate Supply' },
      'SUPPLY_LIVE': { action: 'track_revenue', actionLabel: 'Track Revenue' },
      'CONTRACT_ENDED': { action: 'renew_or_close', actionLabel: 'Renew or Close' },
      'CLOSED': { action: 'view_history', actionLabel: 'View History' },
      'LOST': { action: 'view_history', actionLabel: 'View History' }
    };

    const nextAction = stateActions[deal.status] || { action: 'unknown', actionLabel: 'Unknown Action' };
    
    let blockerResult: BlockerResult = { ok: true, blockers: [] };
    
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
