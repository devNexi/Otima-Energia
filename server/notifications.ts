import { storage } from "./storage";
import type { Deal, DealCase, DealCommissionEvent } from "@shared/schema";

export const NOTIFICATION_TYPES = {
  DEAL_BLOCKED: 'DEAL_BLOCKED',
  SLA_BREACH: 'SLA_BREACH',
  COMMISSION_OVERDUE: 'COMMISSION_OVERDUE',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

interface NotificationTemplate {
  subject: string;
  body: string;
}

function generateDealBlockedTemplate(deal: Deal, missingCount: number): NotificationTemplate {
  const dealLabel = deal.supplierBrandName || deal.supplierLegalEntityName || deal.id;
  return {
    subject: `[Action Required] Deal ${dealLabel} blocked by compliance`,
    body: `The deal "${dealLabel}" (${deal.id}) is blocked and cannot progress.

${missingCount} compliance requirement(s) must be completed before the deal can move forward.

Current Status: ${deal.status}
Client ID: ${deal.clientId}
Owner: ${deal.internalOwner}

Please review the compliance checklist and complete the outstanding items.

---
Ótima Energia - Deal OS`
  };
}

function generateSlaBreachTemplate(dealCase: DealCase): NotificationTemplate {
  return {
    subject: `[SLA Breach] Case ${dealCase.id} overdue`,
    body: `A case has exceeded its SLA deadline and requires immediate attention.

Case ID: ${dealCase.id}
Deal ID: ${dealCase.dealId}
Type: ${dealCase.caseType}
Severity: ${dealCase.severity}
SLA Due: ${dealCase.slaDueDate ? new Date(dealCase.slaDueDate).toLocaleDateString() : 'Not set'}

Root Cause: ${dealCase.rootCause || 'Not specified'}

Please take action immediately to resolve this case.

---
Ótima Energia - Commission OS`
  };
}

function generateCommissionOverdueTemplate(event: DealCommissionEvent): NotificationTemplate {
  return {
    subject: `[Commission Overdue] Event ${event.id} past due date`,
    body: `A commission event has passed its expected date and requires attention.

Event ID: ${event.id}
Deal ID: ${event.dealId}
Type: ${event.eventType}
Amount: R$ ${event.amountBrl || '0.00'}
Expected Date: ${event.expectedDate ? new Date(event.expectedDate).toLocaleDateString() : 'Not set'}

Status: ${event.status}

Please follow up on this commission payment.

---
Ótima Energia - Commission OS`
  };
}

export async function generateBlockedDealNotifications(): Promise<number> {
  const tasks = await storage.getOpsDashboardTasks();
  let count = 0;
  
  for (const { deal, missingCount } of tasks.dealsBlockedByCompliance) {
    const template = generateDealBlockedTemplate(deal, missingCount);
    
    const opsUsers = await getOpsUsers();
    if (opsUsers.length === 0) {
      console.log('[Notifications] No notification recipients configured. Set OPS_NOTIFICATION_EMAIL or ADMIN_EMAIL.');
      break;
    }
    
    for (const user of opsUsers) {
      if (!user.email) continue;
      
      await storage.createNotification({
        type: NOTIFICATION_TYPES.DEAL_BLOCKED,
        recipientEmail: user.email,
        subject: template.subject,
        body: template.body,
        dealId: deal.id,
        metadata: { missingCount },
        status: 'PENDING',
      });
      count++;
    }
  }
  
  return count;
}

export async function generateSlaBreachNotifications(): Promise<number> {
  const tasks = await storage.getOpsDashboardTasks();
  let count = 0;
  
  const opsUsers = await getOpsUsers();
  if (opsUsers.length === 0) {
    console.log('[Notifications] No notification recipients configured. Set OPS_NOTIFICATION_EMAIL or ADMIN_EMAIL.');
    return 0;
  }
  
  for (const dealCase of tasks.openCasesBreachingSla) {
    const template = generateSlaBreachTemplate(dealCase);
    
    for (const user of opsUsers) {
      if (!user.email) continue;
      
      await storage.createNotification({
        type: NOTIFICATION_TYPES.SLA_BREACH,
        recipientEmail: user.email,
        subject: template.subject,
        body: template.body,
        dealId: dealCase.dealId,
        metadata: { caseId: dealCase.id, caseType: dealCase.caseType },
        status: 'PENDING',
      });
      count++;
    }
  }
  
  return count;
}

export async function generateCommissionOverdueNotifications(): Promise<number> {
  const tasks = await storage.getOpsDashboardTasks();
  let count = 0;
  
  const opsUsers = await getOpsUsers();
  if (opsUsers.length === 0) {
    console.log('[Notifications] No notification recipients configured. Set OPS_NOTIFICATION_EMAIL or ADMIN_EMAIL.');
    return 0;
  }
  
  for (const event of tasks.commissionEventsOverdue) {
    const template = generateCommissionOverdueTemplate(event);
    
    for (const user of opsUsers) {
      if (!user.email) continue;
      
      await storage.createNotification({
        type: NOTIFICATION_TYPES.COMMISSION_OVERDUE,
        recipientEmail: user.email,
        subject: template.subject,
        body: template.body,
        dealId: event.dealId,
        metadata: { eventId: event.id, eventType: event.eventType },
        status: 'PENDING',
      });
      count++;
    }
  }
  
  return count;
}

async function getOpsUsers(): Promise<Array<{ id: string; username: string; email?: string }>> {
  const notificationEmail = process.env.OPS_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  
  if (notificationEmail) {
    return [{ id: 'system', username: 'ops', email: notificationEmail }];
  }
  
  return [];
}

export async function processNotificationQueue(): Promise<{ sent: number; failed: number }> {
  const pending = await storage.getPendingNotifications();
  let sent = 0;
  let failed = 0;
  
  for (const notification of pending) {
    try {
      const emailConfigured = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;
      
      if (!emailConfigured) {
        console.log(`[Notifications] Email not configured. Would send to ${notification.recipientEmail}: ${notification.subject}`);
        continue;
      }
      
      await storage.markNotificationSent(notification.id);
      sent++;
    } catch (error: any) {
      await storage.markNotificationFailed(notification.id, error.message);
      failed++;
    }
  }
  
  return { sent, failed };
}

export async function runNotificationCheck(): Promise<{
  generated: { blocked: number; slaBreach: number; overdue: number };
  processed: { sent: number; failed: number };
}> {
  const blocked = await generateBlockedDealNotifications();
  const slaBreach = await generateSlaBreachNotifications();
  const overdue = await generateCommissionOverdueNotifications();
  
  const processed = await processNotificationQueue();
  
  return {
    generated: { blocked, slaBreach, overdue },
    processed,
  };
}
