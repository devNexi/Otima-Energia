// ── Financial Configuration ───────────────────────────────────────────────
// Source of truth for Finance OS pages. In production, revenue derives from
// Google Sheets API (Valor Estimado Mensal column). Cost structure is config.

export interface CostLine {
  name: string;
  amount: number;
  category: "Equipa" | "Operações" | "Marketing";
  reducedAmount?: number;
  reduceNote?: string;
  inactive?: boolean;
}

export const MONTHLY_COSTS: CostLine[] = [
  { name: "Fundador",       amount: 34000, category: "Equipa" },
  { name: "Dev Team",       amount: 40500, category: "Equipa",    reducedAmount: 20250,   reduceNote: "Redução para R$20.250 prevista em ~2 meses" },
  { name: "Renan",          amount: 12000, category: "Equipa" },
  { name: "Alexandre",      amount: 8500,  category: "Equipa" },
  { name: "Elayne",         amount: 4500,  category: "Equipa" },
  { name: "Thaina",         amount: 4500,  category: "Equipa" },
  { name: "Oscar",          amount: 4000,  category: "Equipa" },
  { name: "Tech Stack",     amount: 14000, category: "Operações" },
  { name: "Escritório",     amount: 6500,  category: "Operações" },
  { name: "Contabilidade",  amount: 1600,  category: "Operações" },
  { name: "Publicidade",    amount: 8000,  category: "Marketing", inactive: true },
];

export const TOTAL_BURN      = 138100;
export const POST_DEV_BURN   = 117850;
export const CASH_CURRENT    = 269000;
export const CASH_INCOMING   = 1000000;
export const CASH_TOTAL      = 1269000;

// ── Client data ───────────────────────────────────────────────────────────
export type ClientStatus = "Em Dia" | "Pendente" | "Em Atraso" | "Aguardando Início" | "Proposta Aceita";

export interface FinancialClient {
  id: string;
  name: string;
  status: ClientStatus;
  valorEstimadoMensal: number;
  consumoMedioKwh: number;
  consumoMedioRS: number;
  remuneracaoOtima: number;
  dataAssinatura: string | null;
  paymentDueDate: string | null;
  faturamentoEstimado: number;
  lastUpdate: string;
}

export const MOCK_CLIENTS: FinancialClient[] = [
  { id: "c1", name: "Metalúrgica Paulista Ltda",  status: "Em Dia",         valorEstimadoMensal: 4200, consumoMedioKwh: 48000, consumoMedioRS: 38400, remuneracaoOtima: 10.9, dataAssinatura: "01/11/2024", paymentDueDate: "10/06/2025", faturamentoEstimado: 4200, lastUpdate: "hoje" },
  { id: "c2", name: "Clínica São Lucas",           status: "Em Dia",         valorEstimadoMensal: 2800, consumoMedioKwh: 32000, consumoMedioRS: 25600, remuneracaoOtima: 10.9, dataAssinatura: "15/12/2024", paymentDueDate: "10/06/2025", faturamentoEstimado: 2800, lastUpdate: "ontem" },
  { id: "c3", name: "Transportadora Norte & Sul",  status: "Pendente",       valorEstimadoMensal: 6500, consumoMedioKwh: 75000, consumoMedioRS: 60000, remuneracaoOtima: 10.8, dataAssinatura: "20/01/2025", paymentDueDate: "05/06/2025", faturamentoEstimado: 6500, lastUpdate: "3 dias atrás" },
  { id: "c4", name: "Frigorifico Bela Vista",      status: "Em Dia",         valorEstimadoMensal: 3200, consumoMedioKwh: 38000, consumoMedioRS: 30400, remuneracaoOtima: 10.5, dataAssinatura: "01/02/2025", paymentDueDate: "10/06/2025", faturamentoEstimado: 3200, lastUpdate: "hoje" },
  { id: "c5", name: "Supermercados Horizonte",     status: "Aguardando Início", valorEstimadoMensal: 5100, consumoMedioKwh: 58000, consumoMedioRS: 46400, remuneracaoOtima: 11.0, dataAssinatura: "15/05/2025", paymentDueDate: null,         faturamentoEstimado: 5100, lastUpdate: "1 sem. atrás" },
  { id: "c6", name: "Cerâmica Santa Cruz",         status: "Proposta Aceita",  valorEstimadoMensal: 1800, consumoMedioKwh: 22000, consumoMedioRS: 17600, remuneracaoOtima: 10.2, dataAssinatura: null,         paymentDueDate: null,         faturamentoEstimado: 1800, lastUpdate: "2 dias atrás" },
  { id: "c7", name: "Gráfica Digital Moderna",     status: "Em Dia",         valorEstimadoMensal: 800,  consumoMedioKwh: 9500,  consumoMedioRS: 7600,  remuneracaoOtima: 10.5, dataAssinatura: "10/03/2025", paymentDueDate: "10/06/2025", faturamentoEstimado: 800,  lastUpdate: "hoje" },
  { id: "c8", name: "Indústria Têxtil Nordeste",   status: "Em Atraso",      valorEstimadoMensal: 2400, consumoMedioKwh: 28000, consumoMedioRS: 22400, remuneracaoOtima: 10.7, dataAssinatura: "05/10/2024", paymentDueDate: "10/05/2025", faturamentoEstimado: 2400, lastUpdate: "2 sem. atrás" },
];

// ── Derived helpers ───────────────────────────────────────────────────────
const ACTIVE_STATUSES: ClientStatus[] = ["Em Dia", "Pendente", "Em Atraso"];

export function calcMRR(clients = MOCK_CLIENTS): number {
  return clients.filter(c => ACTIVE_STATUSES.includes(c.status))
    .reduce((sum, c) => sum + c.valorEstimadoMensal, 0);
}

export function calcConfirmedRevenue(clients = MOCK_CLIENTS): number {
  return clients.filter(c => c.status === "Em Dia")
    .reduce((sum, c) => sum + c.valorEstimadoMensal, 0);
}

export function calcPendingRevenue(clients = MOCK_CLIENTS): number {
  return clients.filter(c => c.status === "Pendente")
    .reduce((sum, c) => sum + c.valorEstimadoMensal, 0);
}

export function calcOverdueRevenue(clients = MOCK_CLIENTS): number {
  return clients.filter(c => c.status === "Em Atraso")
    .reduce((sum, c) => sum + c.valorEstimadoMensal, 0);
}

export function calcAvgTicket(clients = MOCK_CLIENTS): number {
  const active = clients.filter(c => ACTIVE_STATUSES.includes(c.status));
  if (!active.length) return 0;
  return calcMRR(clients) / active.length;
}

export function calcClientsForBreakEven(clients = MOCK_CLIENTS, burn = TOTAL_BURN): number {
  const avg = calcAvgTicket(clients);
  return avg > 0 ? Math.ceil(burn / avg) : 0;
}

export function calcMonthlyDeficit(clients = MOCK_CLIENTS, burn = TOTAL_BURN): number {
  return burn - calcMRR(clients);
}

export function calcRunwayMonths(clients = MOCK_CLIENTS, cash = CASH_TOTAL, burn = TOTAL_BURN): number {
  const deficit = calcMonthlyDeficit(clients, burn);
  if (deficit <= 0) return 999;
  return Math.floor(cash / deficit);
}

// ── P&L chart history (Jan–Jun 2025) ─────────────────────────────────────
export const PL_CHART_DATA = [
  { month: "Jan", receita: 0,     custo: 138100 },
  { month: "Fev", receita: 2800,  custo: 138100 },
  { month: "Mar", receita: 7000,  custo: 138100 },
  { month: "Abr", receita: 11000, custo: 138100 },
  { month: "Mai", receita: 15400, custo: 138100 },
  { month: "Jun", receita: 19900, custo: 138100 },
];

// ── Scenario projections (starting Jul 2025 = Month 1) ───────────────────
export function buildScenario(
  startMRR: number,
  newClientsPerMonth: number,
  avgTicket: number,
  burn: number,
  extraRevByMonth: (m: number) => number,
  months = 24
) {
  const rows: { month: string; receita: number; custo: number }[] = [];
  const labels = ["Jul","Ago","Set","Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai","Jun"];
  let mrr = startMRR;
  let breakEvenMonth: number | null = null;
  for (let m = 1; m <= months; m++) {
    mrr += newClientsPerMonth * avgTicket;
    const extra = extraRevByMonth(m);
    const custo = m >= 3 ? POST_DEV_BURN : burn; // dev costs drop in month 3 (Aug)
    const receita = mrr + extra;
    rows.push({ month: labels[m - 1] ?? `M${m}`, receita, custo });
    if (breakEvenMonth === null && receita >= custo) breakEvenMonth = m;
  }
  return { rows, breakEvenMonth };
}

// ── Cora mock transactions ────────────────────────────────────────────────
export const CORA_TRANSACTIONS = [
  { date: "05/06", client: "Metalúrgica Paulista Ltda",  amount: 4200, matched: true },
  { date: "04/06", client: "Clínica São Lucas",          amount: 2800, matched: true },
  { date: "03/06", client: "Frigorifico Bela Vista",     amount: 3200, matched: true },
  { date: "01/06", client: "Gráfica Digital Moderna",    amount: 800,  matched: true },
];
