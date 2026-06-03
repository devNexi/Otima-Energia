import { useState } from "react";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  MOCK_CLIENTS, MONTHLY_COSTS, TOTAL_BURN, PL_CHART_DATA,
  calcMRR, calcConfirmedRevenue,
} from "@/data/financialConfig";
import { Info } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmtBRL = (n: number) =>
  "R$\u00A0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const currentMonth = new Date().getMonth();

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Em Dia":            { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Pendente":          { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Em Atraso":         { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "Aguardando Início": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "Proposta Aceita":   { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Equipa": "#9e3ffd",
  "Operações": "#2563eb",
  "Marketing": "#d97706",
};

export default function PL() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const MRR = calcMRR();
  const resultado = MRR - TOTAL_BURN;

  const categoryTotals = MONTHLY_COSTS.reduce((acc, c) => {
    if (!c.inactive) acc[c.category] = (acc[c.category] ?? 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 text-xs" style={{ background: "#fff", border: "1px solid #E8EAED", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <div className="font-bold mb-2" style={{ color: "#16163f" }}>{label} 2025</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex gap-4 justify-between">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-bold">{fmtBRL(p.value)}</span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-1.5 pt-1.5 border-t flex gap-4 justify-between" style={{ borderColor: "#F3F4F6" }}>
            <span style={{ color: payload[0].value - payload[1].value >= 0 ? "#16a34a" : "#dc2626" }}>Gap</span>
            <span className="font-bold" style={{ color: payload[0].value - payload[1].value >= 0 ? "#16a34a" : "#dc2626" }}>
              {fmtBRL(payload[0].value - payload[1].value)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>P&L — Demonstrativo de Resultados</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · Análise financeira completa</div>
            </div>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m} 2025</option>)}
            </select>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Three summary numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-6 text-center" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Receita</div>
              <div className="text-4xl font-bold" style={{ color: "#16a34a" }}>{fmtBRL(MRR)}</div>
              <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{MOCK_CLIENTS.filter(c => ["Em Dia","Pendente","Em Atraso"].includes(c.status)).length} clientes ativos</div>
            </div>
            <div className="rounded-2xl p-6 text-center" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Custos</div>
              <div className="text-4xl font-bold" style={{ color: "#dc2626" }}>{fmtBRL(TOTAL_BURN)}</div>
              <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{MONTHLY_COSTS.filter(c => !c.inactive).length} linhas de custo activas</div>
            </div>
            <div className="rounded-2xl p-6 text-center" style={{ background: resultado >= 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${resultado >= 0 ? "#bbf7d0" : "#fecaca"}` }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Resultado Líquido</div>
              <div className="text-4xl font-bold" style={{ color: resultado >= 0 ? "#16a34a" : "#dc2626" }}>
                {resultado >= 0 ? "" : "–"}{fmtBRL(Math.abs(resultado))}
              </div>
              <div className="text-xs mt-1" style={{ color: resultado >= 0 ? "#16a34a" : "#dc2626" }}>
                {resultado >= 0 ? "Break-even atingido" : `Déficit de ${fmtBRL(Math.abs(resultado))}/mês`}
              </div>
            </div>
          </div>

          {/* Two-column detail */}
          <div className="grid grid-cols-2 gap-4">
            {/* Revenue detail */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Detalhe de Receita</div>
              </div>
              <div>
                {MOCK_CLIENTS.filter(c => ["Em Dia","Pendente","Em Atraso"].includes(c.status)).map(c => {
                  const cfg = STATUS_CFG[c.status];
                  return (
                    <div key={c.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0"
                      style={{ borderColor: "#F9FAFB" }}>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "#16163f" }}>{c.name}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}>{c.status}</span>
                      </div>
                      <div className="font-bold text-sm" style={{ color: c.status === "Em Atraso" ? "#dc2626" : "#16a34a" }}>
                        {fmtBRL(c.valorEstimadoMensal)}
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between px-5 py-3" style={{ background: "#F8F9FC", borderTop: "2px solid #E8EAED" }}>
                  <span className="font-bold text-sm" style={{ color: "#16163f" }}>MRR Total</span>
                  <span className="font-bold text-sm" style={{ color: "#16a34a" }}>{fmtBRL(MRR)}</span>
                </div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Estrutura de Custos</div>
              </div>
              <div>
                {MONTHLY_COSTS.map(c => (
                  <div key={c.name} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0"
                    style={{ borderColor: "#F9FAFB", opacity: c.inactive ? 0.45 : 1 }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#16163f" }}>{c.name}</span>
                        <span className="text-[9px] px-1.5 rounded-full" style={{ background: `${CATEGORY_COLORS[c.category]}15`, color: CATEGORY_COLORS[c.category] }}>
                          {c.category}
                        </span>
                        {c.inactive && <span className="text-[9px] px-1.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>Inativo</span>}
                      </div>
                      {c.reduceNote && (
                        <div className="text-[9px] mt-0.5" style={{ color: "#16a34a" }}>{c.reduceNote}</div>
                      )}
                      {c.name === "Publicidade" && (
                        <div className="text-[9px] mt-0.5" style={{ color: "#9CA3AF" }}>Não activar antes de conversão provada</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs" style={{ color: c.inactive ? "#9CA3AF" : "#dc2626" }}>{fmtBRL(c.amount)}</div>
                      <div className="text-[9px]" style={{ color: "#9CA3AF" }}>{Math.round((c.amount / TOTAL_BURN) * 100)}%</div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between px-5 py-3" style={{ background: "#fef2f2", borderTop: "2px solid #fecaca" }}>
                  <span className="font-bold text-sm" style={{ color: "#16163f" }}>Queima Total</span>
                  <span className="font-bold text-sm" style={{ color: "#dc2626" }}>{fmtBRL(TOTAL_BURN)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6-month bar chart */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Receita vs Queima — Jan a Jun 2025</div>
                <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Crescimento de receita vs queima mensal fixa</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "#16a34a" }} /><span style={{ color: "#6B7280" }}>Receita</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1" style={{ background: "#dc2626" }} /><span style={{ color: "#6B7280" }}>Queima</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={PL_CHART_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="receita" name="Receita" fill="#16a34a" radius={[4,4,0,0]} />
                <Line dataKey="custo" name="Queima" stroke="#dc2626" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-3 px-3 py-2 rounded-lg text-xs flex items-start gap-2"
              style={{ background: "rgba(37,99,235,0.05)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.12)" }}>
              <Info size={12} className="shrink-0 mt-0.5" />
              Em produção: receita via Google Sheets API (Valor Estimado Mensal). Pagamentos confirmados via Cora Statement API.
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
