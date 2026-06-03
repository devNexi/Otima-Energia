import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  TOTAL_BURN, POST_DEV_BURN, CASH_TOTAL, CASH_CURRENT, CASH_INCOMING,
  calcMRR, calcAvgTicket, calcClientsForBreakEven, calcMonthlyDeficit, calcRunwayMonths,
  buildScenario,
} from "@/data/financialConfig";
import { CheckCircle, Clock, TrendingUp, Target, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";

const fmtBRL = (n: number) =>
  "R$\u00A0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MRR = calcMRR();
const avgTicket = calcAvgTicket();
const deficit = calcMonthlyDeficit();
const runway = calcRunwayMonths();
const clientsNeeded = calcClientsForBreakEven();
const activeClients = 6;

// Scenarios (starting Jul 2025)
const { rows: consRows, breakEvenMonth: consBE } = buildScenario(MRR, 1, avgTicket, TOTAL_BURN, () => 0, 12);
const { rows: baseRows, breakEvenMonth: baseBE } = buildScenario(MRR, 2, avgTicket, TOTAL_BURN, () => 0, 18);
const { rows: optRows, breakEvenMonth: optBE } = buildScenario(
  MRR, 4, avgTicket, TOTAL_BURN,
  (m) => (m >= 2 ? 8000 : 0) + (m >= 4 ? 5000 : 0),
  12
);

const runwayColor = runway > 9 ? "#16a34a" : runway > 6 ? "#d97706" : "#dc2626";

const MILESTONES = [
  { label: "Sales OS em produção com Zoho integrado",         date: "Esta semana",         done: true },
  { label: "Elayne e Thaina atingem 2 contas/dia",            date: "Até 30 de junho",      done: false },
  { label: "Oscar activa primeiro agente",                    date: "Até 30 de junho",      done: false },
  { label: "Dev costs reduzem 50%",                          date: "Até agosto 2025",      done: false },
  { label: "Primeira parceria gera fluxo de leads",           date: "Até julho 2025",       done: false },
];

function ScenarioChart({ data, breakEvenMonth, color, height = 140 }: {
  data: { month: string; receita: number; custo: number }[];
  breakEvenMonth: number | null;
  color: string;
  height?: number;
}) {
  const beDot = breakEvenMonth !== null ? data[breakEvenMonth - 1] : null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={2} />
        <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
          tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v: number, name: string) => [fmtBRL(v), name === "receita" ? "Receita" : "Queima"]}
          labelStyle={{ color: "#16163f", fontWeight: 600, fontSize: 11 }}
          contentStyle={{ borderRadius: 10, border: "1px solid #E8EAED", fontSize: 11 }}
        />
        <Line dataKey="receita" stroke={color} strokeWidth={2} dot={false} name="receita" />
        <Line dataKey="custo" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="custo" />
        {beDot && (
          <ReferenceDot x={beDot.month} y={beDot.receita} r={5} fill={color} stroke="#fff" strokeWidth={2}
            label={{ value: `BE Mês ${breakEvenMonth}`, position: "top", fontSize: 9, fill: color }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Previsao() {
  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Previsão — Runway e Cenários</h1>
            <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · Projecções baseadas em dados reais</div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Runway card */}
          <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: `2px solid ${runwayColor}30`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} style={{ color: runwayColor }} />
              <span className="font-bold text-base" style={{ color: "#16163f" }}>Runway Actual</span>
              <span className="ml-auto px-3 py-1 rounded-full text-sm font-bold"
                style={{ background: `${runwayColor}15`, color: runwayColor }}>
                {runway} meses
              </span>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Saldo Total Disponível", value: fmtBRL(CASH_TOTAL), sub: `${fmtBRL(CASH_CURRENT)} + ${fmtBRL(CASH_INCOMING)} entrada`, color: "#16a34a" },
                { label: "Queima Mensal Actual", value: fmtBRL(TOTAL_BURN), sub: "138 linhas de custo activas", color: "#dc2626" },
                { label: "Queima Pós-Dev (Mês 3)", value: fmtBRL(POST_DEV_BURN), sub: "Após redução dev em agosto", color: "#d97706" },
                { label: "MRR Actual", value: fmtBRL(MRR), sub: `${activeClients} clientes com contrato`, color: "#9e3ffd" },
                { label: "Déficit Mensal", value: fmtBRL(deficit), sub: "Queima − MRR", color: "#dc2626" },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-xl font-bold mb-0.5" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: "#6B7280" }}>{item.label}</div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((MRR / TOTAL_BURN) * 100, 100)}%`, background: runwayColor }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "#9CA3AF" }}>
              <span>MRR actual: {Math.round((MRR / TOTAL_BURN) * 100)}% da queima</span>
              <span>Break-even a 100%</span>
            </div>
          </div>

          {/* Break-even calculator */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target size={15} style={{ color: "#9e3ffd" }} />
              <span className="font-bold text-sm" style={{ color: "#16163f" }}>Calculadora de Break-Even</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                <div className="text-2xl font-bold mb-1" style={{ color: "#9e3ffd" }}>{clientsNeeded}</div>
                <div className="text-xs font-semibold mb-1" style={{ color: "#6B7280" }}>Clientes para Break-Even</div>
                <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Burn ÷ ticket médio real ({fmtBRL(Math.round(avgTicket))})</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                <div className="text-2xl font-bold mb-1" style={{ color: "#d97706" }}>~{Math.round((clientsNeeded - activeClients) / 1)} meses</div>
                <div className="text-xs font-semibold mb-1" style={{ color: "#6B7280" }}>Ao ritmo actual (1/mês)</div>
                <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{clientsNeeded - activeClients} clientes em falta</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="text-2xl font-bold mb-1" style={{ color: "#16a34a" }}>~{Math.round((clientsNeeded - activeClients) / 2)} meses</div>
                <div className="text-xs font-semibold mb-1" style={{ color: "#6B7280" }}>Com Sales OS (2 contas/dia)</div>
                <div className="text-[10px]" style={{ color: "#16a34a" }}>2 novos clientes/mês</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-center" style={{ color: "#9CA3AF" }}>
              Calculado automaticamente com base no ticket médio real dos seus clientes ({fmtBRL(Math.round(avgTicket))}/mês)
            </div>
          </div>

          {/* Three scenario cards */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Cenários de Projecção</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  title: "Conservador",
                  desc: "1 novo cliente/mês ao ritmo actual",
                  color: "#d97706",
                  bg: "#fffbeb",
                  border: "#fde68a",
                  rows: consRows,
                  be: consBE,
                  details: [
                    { label: "Novos clientes/mês", value: "1" },
                    { label: "Crescimento MRR/mês", value: fmtBRL(Math.round(avgTicket)) },
                    { label: "Break-even", value: consBE ? `Mês ${consBE}` : "+24 meses" },
                  ],
                },
                {
                  title: "Base",
                  desc: "Sales OS entrega 2 contas/dia em 30 dias",
                  color: "#9e3ffd",
                  bg: "rgba(158,63,253,0.04)",
                  border: "rgba(158,63,253,0.2)",
                  rows: baseRows,
                  be: baseBE,
                  details: [
                    { label: "Novos clientes/mês", value: "2" },
                    { label: "Crescimento MRR/mês", value: fmtBRL(Math.round(avgTicket * 2)) },
                    { label: "Break-even", value: baseBE ? `Mês ${baseBE}` : "+24 meses" },
                  ],
                },
                {
                  title: "Otimista",
                  desc: "4 contas/dia + Oscar 2 agentes + 1 parceria Mês 4",
                  color: "#16a34a",
                  bg: "#f0fdf4",
                  border: "#bbf7d0",
                  rows: optRows,
                  be: optBE,
                  details: [
                    { label: "Novos clientes/mês", value: "4" },
                    { label: "Oscar agentes (+R$8k/mês)", value: "Mês 2" },
                    { label: "Break-even", value: optBE ? `Mês ${optBE} ← Mês ${optBE}` : "+24 meses" },
                  ],
                },
              ].map(sc => (
                <div key={sc.title} className="rounded-2xl overflow-hidden"
                  style={{ background: "#FFFFFF", border: `1px solid ${sc.border}` }}>
                  <div className="px-4 py-3 border-b" style={{ background: sc.bg, borderColor: sc.border }}>
                    <div className="font-bold text-sm" style={{ color: sc.color }}>{sc.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{sc.desc}</div>
                  </div>
                  <div className="px-4 py-3">
                    <ScenarioChart data={sc.rows} breakEvenMonth={sc.be} color={sc.color} />
                    <div className="mt-3 space-y-1.5">
                      {sc.details.map(d => (
                        <div key={d.label} className="flex justify-between text-xs">
                          <span style={{ color: "#6B7280" }}>{d.label}</span>
                          <span className="font-bold" style={{ color: sc.color }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <Zap size={14} style={{ color: "#9e3ffd" }} />
              <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Milestones do Plano</span>
            </div>
            {MILESTONES.map((m, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0"
                style={{ borderColor: "#F9FAFB" }}>
                {m.done
                  ? <CheckCircle size={16} style={{ color: "#16a34a" }} />
                  : <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: "#E8EAED" }} />
                }
                <div className="flex-1 text-sm" style={{ color: m.done ? "#374151" : "#16163f" }}>{m.label}</div>
                <div className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: m.done ? "#f0fdf4" : "#F8F9FC", color: m.done ? "#16a34a" : "#9CA3AF", border: `1px solid ${m.done ? "#bbf7d0" : "#E8EAED"}` }}>
                  {m.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
