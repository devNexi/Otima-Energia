import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  MOCK_CLIENTS, CORA_TRANSACTIONS,
  calcMRR, calcConfirmedRevenue, calcPendingRevenue, calcOverdueRevenue,
} from "@/data/financialConfig";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { mockLeads } from "@/data/mockLeads";

const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const fmtBRL = (n: number) =>
  "R$\u00A0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MRR = calcMRR();
const confirmed = calcConfirmedRevenue();
const pending = calcPendingRevenue();
const overdue = calcOverdueRevenue();
const lastMonthMRR = 15400;

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Em Dia":          { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Pendente":        { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Em Atraso":       { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "Aguardando Início": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "Proposta Aceita": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

const billsInCS = mockLeads.filter(l => l.bill_status).length;
const avgTicket = MRR / MOCK_CLIENTS.filter(c => ["Em Dia","Pendente","Em Atraso"].includes(c.status)).length;
const pipelineRevenue = Math.round(billsInCS * avgTicket * 0.4);

function StatCard({ title, value, sub, icon, color, alert }: {
  title: string; value: string; sub: string; icon: React.ReactNode; color: string; alert?: "red"|"amber"|"green";
}) {
  const alertColors = { red: { bg: "#fef2f2", border: "#fecaca" }, amber: { bg: "#fffbeb", border: "#fde68a" }, green: { bg: "#f0fdf4", border: "#bbf7d0" } };
  const a = alert ? alertColors[alert] : null;
  return (
    <div className="rounded-xl p-4" style={{ background: a?.bg ?? "#FFFFFF", border: `1px solid ${a?.border ?? "#E8EAED"}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {alert === "red" && <AlertTriangle size={14} style={{ color: "#dc2626" }} />}
        {alert === "amber" && <Clock size={14} style={{ color: "#d97706" }} />}
        {alert === "green" && <CheckCircle size={14} style={{ color: "#16a34a" }} />}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: "#16163f" }}>{value}</div>
      <div className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>{title}</div>
      <div className="text-[11px]" style={{ color }}>{sub}</div>
    </div>
  );
}

export default function Receita() {
  const mrrTrend = MRR - lastMonthMRR;
  const mrrTrendPct = Math.round((mrrTrend / lastMonthMRR) * 100);

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Receita</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {today}</div>
            </div>
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-semibold"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              <Info size={12} />
              Produção: Google Sheets API + Cora Statement API
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="MRR Atual"
              value={fmtBRL(MRR)}
              sub={`${mrrTrend >= 0 ? "+" : ""}${fmtBRL(mrrTrend)} vs mês passado (+${mrrTrendPct}%)`}
              icon={<TrendingUp size={15} />}
              color="#16a34a"
              alert="green"
            />
            <StatCard
              title="Receita Recebida Este Mês"
              value={fmtBRL(confirmed)}
              sub={`${Math.round((confirmed / MRR) * 100)}% do MRR confirmado — Cora`}
              icon={<CheckCircle size={15} />}
              color={confirmed >= MRR * 0.8 ? "#16a34a" : "#d97706"}
              alert={confirmed >= MRR * 0.8 ? "green" : "amber"}
            />
            <StatCard
              title="Receita Pendente"
              value={fmtBRL(pending)}
              sub="Contratada, aguardando pagamento"
              icon={<Clock size={15} />}
              color="#d97706"
              alert="amber"
            />
            <StatCard
              title="Receita em Atraso"
              value={fmtBRL(overdue)}
              sub={overdue > 0 ? "Acção necessária" : "Nenhuma em atraso"}
              icon={overdue > 0 ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
              color={overdue > 0 ? "#dc2626" : "#16a34a"}
              alert={overdue > 0 ? "red" : "green"}
            />
          </div>

          {/* Client table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <TrendingUp size={14} style={{ color: "#9e3ffd" }} />
              <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Clientes — Contratos Ativos e em Curso</span>
              <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>Fonte: Google Sheets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                    {["Cliente","Valor Est. Mensal","Status","Venc. Pagamento","Última Atualização","Fat. Estimado"].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => {
                    const cfg = STATUS_CFG[c.status];
                    return (
                      <tr key={c.id} className="border-b" style={{ borderColor: "#F9FAFB" }}>
                        <td className="px-5 py-3 font-semibold" style={{ color: "#16163f" }}>{c.name}</td>
                        <td className="px-5 py-3 font-bold" style={{ color: ["Em Dia","Pendente","Em Atraso"].includes(c.status) ? "#16163f" : "#9CA3AF" }}>
                          {fmtBRL(c.valorEstimadoMensal)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3" style={{ color: c.status === "Em Atraso" ? "#dc2626" : "#374151" }}>
                          {c.paymentDueDate ?? "—"}
                        </td>
                        <td className="px-5 py-3" style={{ color: "#9CA3AF" }}>{c.lastUpdate}</td>
                        <td className="px-5 py-3 font-semibold" style={{ color: "#16163f" }}>{fmtBRL(c.faturamentoEstimado)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: "#F8F9FC" }}>
                    <td className="px-5 py-3 font-bold text-sm" style={{ color: "#16163f" }}>MRR Total</td>
                    <td className="px-5 py-3 font-bold text-sm" style={{ color: "#16a34a" }}>{fmtBRL(MRR)}</td>
                    <td colSpan={4} className="px-5 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                      {MOCK_CLIENTS.filter(c => ["Em Dia","Pendente","Em Atraso"].includes(c.status)).length} clientes com contrato activo
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Two-column bottom */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cora transactions */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <div className="font-semibold text-sm mb-0.5" style={{ color: "#16163f" }}>Entradas Confirmadas — Cora</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>Débito em conta identificado e cruzado com contrato</div>
              </div>
              <div>
                {CORA_TRANSACTIONS.map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0"
                    style={{ borderColor: "#F9FAFB" }}>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "#16163f" }}>{t.client}</div>
                      <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{t.date} · {t.matched ? "Cruzado c/ contrato ✓" : "Sem correspondência"}</div>
                    </div>
                    <div className="font-bold text-sm" style={{ color: "#16a34a" }}>+{fmtBRL(t.amount)}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 text-[10px] leading-relaxed" style={{ color: "#9CA3AF", background: "#F8F9FC", borderTop: "1px solid #F3F4F6" }}>
                Produção: Cora Statement API com autenticação mTLS. Nubank e Santander = pagamentos de saída, não requerem integração.
              </div>
            </div>

            {/* Pipeline revenue */}
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="font-semibold text-sm mb-1" style={{ color: "#16163f" }}>Receita em Pipeline</div>
              <div className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                Se leads em Conta Solicitada converterem (estimativa 40%)
              </div>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-3xl font-bold" style={{ color: "#9e3ffd" }}>+{fmtBRL(pipelineRevenue)}</div>
                <div className="text-sm mb-1" style={{ color: "#9CA3AF" }}>/mês estimado</div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#6B7280" }}>Leads em Conta Solicitada</span>
                  <span className="font-bold" style={{ color: "#16163f" }}>{billsInCS}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#6B7280" }}>Ticket médio actual</span>
                  <span className="font-bold" style={{ color: "#16163f" }}>{fmtBRL(Math.round(avgTicket))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#6B7280" }}>Taxa de conversão estimada</span>
                  <span className="font-bold" style={{ color: "#16163f" }}>40%</span>
                </div>
              </div>
              <div className="mt-4 px-3 py-2.5 rounded-lg text-xs" style={{ background: "rgba(158,63,253,0.06)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.15)" }}>
                Calculado a partir do pipeline real do Sales OS. Actualiza automaticamente quando leads avançam.
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
