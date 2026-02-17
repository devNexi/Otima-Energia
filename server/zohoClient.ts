export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  region: string;
  enabled: boolean;
}

export interface ZohoTask {
  id: string;
  subject: string;
  status: string;
  priority: string;
  dueDate: string | null;
  description: string | null;
  owner: { id: string; name: string } | null;
}

export interface ZohoCall {
  id: string;
  subject: string;
  callType: string;
  callStartTime: string | null;
  callDuration: string | null;
  callResult: string | null;
  description: string | null;
}

export interface ZohoNote {
  id: string;
  noteTitle: string | null;
  noteContent: string;
  createdTime: string;
  createdBy: { id: string; name: string } | null;
}

export interface ZohoSnapshot {
  tasks: ZohoTask[];
  calls: ZohoCall[];
  notes: ZohoNote[];
  lastContactAt: Date | null;
  nextTaskAt: Date | null;
  totalCalls: number;
  totalTasks: number;
  totalNotes: number;
}

function getZohoConfig(): ZohoConfig {
  return {
    clientId: process.env.ZOHO_CLIENT_ID || '',
    clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || '',
    region: process.env.ZOHO_REGION || 'com',
    enabled: !!(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN),
  };
}

export function isZohoEnabled(): boolean {
  return getZohoConfig().enabled && process.env.ENABLE_ZOHO_SNAPSHOT_SYNC !== 'false';
}

export function isZohoCallbackTaskEnabled(): boolean {
  return getZohoConfig().enabled && process.env.ENABLE_ZOHO_AUTO_CALLBACK_TASK !== 'false';
}

export function getZohoDeepLink(zohoDealId: string): string {
  const region = process.env.ZOHO_REGION || 'com';
  return `https://crm.zoho.${region}/crm/tab/Deals/${zohoDealId}`;
}

export function getZohoLeadDeepLink(zohoLeadId: string): string {
  const region = process.env.ZOHO_REGION || 'com';
  return `https://crm.zoho.${region}/crm/tab/Leads/${zohoLeadId}`;
}

export async function fetchZohoSnapshot(zohoLeadId: string): Promise<ZohoSnapshot | null> {
  const config = getZohoConfig();
  if (!config.enabled) {
    console.log('[ZohoClient] Zoho API not configured - returning null snapshot');
    return null;
  }

  // TODO: Implement actual Zoho API calls when credentials are available
  // This would:
  // 1. Get OAuth access token using refresh token
  // 2. Fetch Tasks related to the deal/lead
  // 3. Fetch Calls related to the deal/lead
  // 4. Fetch Notes related to the deal/lead
  // 5. Compute aggregates

  console.log(`[ZohoClient] Would fetch snapshot for lead ${zohoLeadId} - API not yet configured`);
  return null;
}

export async function createZohoCallbackTask(params: {
  zohoLeadId: string;
  zohoDealId?: string;
  zohoOwnerId?: string;
  companyName: string;
  portalDealId: string;
  portalDealUrl: string;
  dueDate: Date;
  contactDetails?: string;
}): Promise<{ success: boolean; taskId?: string; error?: string }> {
  const config = getZohoConfig();
  if (!config.enabled) {
    console.log('[ZohoClient] Zoho API not configured - skipping callback task creation');
    return { success: false, error: 'Zoho API not configured' };
  }

  // TODO: Implement actual Zoho Task creation when credentials are available
  // This would:
  // 1. Get OAuth access token
  // 2. Check for existing task with idempotency marker
  // 3. Create Zoho Task with:
  //    - Subject: "CALL NEW LEAD: <CompanyName>"
  //    - Description with portal link, Zoho link, and idempotency marker
  //    - Due date from scheduler
  //    - Owner assignment
  //    - High priority

  const marker = `[OTIMA_AUTO_CALLBACK_TASK v1] dealId=${params.portalDealId} zohoLeadId=${params.zohoLeadId}`;
  console.log(`[ZohoClient] Would create callback task: "${marker}" - API not yet configured`);
  return { success: false, error: 'Zoho API not configured' };
}

export async function searchZohoTasksByMarker(marker: string): Promise<ZohoTask[]> {
  const config = getZohoConfig();
  if (!config.enabled) {
    return [];
  }

  // TODO: Search Zoho tasks for idempotency check
  return [];
}
