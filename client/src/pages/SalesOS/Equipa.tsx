import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const TEAM = [
  {
    name: "Construtora Alpha (via Oscar)", role: "Parceria — top performer",
    cost: 0, revenueAttr: 11200, roi: "∞", trend: "Melhorando", trendColor: "#16a34a",
    output: "8 leads → 3 clientes", note: "Sem custo fixo — comissão variável",
    gradient: "linear-gradient(135deg,#16a34a,#059669)", initial: "CA",
  },
  {
    name: "Elayne", role: "SDR",
    cost: 4500, revenueAttr: 4200, roi: "0.93x", trend: "Melhorando", trendColor: "#16a34a",
    output: "9 contas/semana (avg últimas 4 sem.)", note: null,
    gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)", initial: "E",
  },
  {
    name: "Thaina", role: "SDR",
    cost: 4500, revenueAttr: 4200, roi: "0.93x", trend: "Estável", trendColor: "#f59e0b",
    output: "6 contas/semana (avg últimas 4 sem.)", note: null,
    gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)", initial: "T",
  },
  {
    name: "Renan", role: "Gestor",
    cost: 12000, revenueAttr: 8400, roi: "0.70x", trend: "Abaixo", trendColor: "#f59e0b",
    output: "Gestão equipa + 3 parcerias este mês", note: "ROI melhora com escala da equipa",
    gradient: "linear-gradient(135deg,#9e3ffd,#df0af2)", initial: "R",
  },
  {
    name: "Oscar", role: "Parceiro",
    cost: 4000, revenueAttr: 11200, roi: "2.80x", trend: "Melhorando", trendColor: "#16a34a",
    output: "3 parcerias activas · pipeline R$35k", note: "Inclui comissões estimadas",
    gradient: "linear-gradient(135deg,#16a34a,#059669)", initial: "O",
  },
  {
    name: "Alexandre", role: "Ops",
    cost: 8500, revenueAttr: 0, roi: "Indireto", trend: "Estável", trendColor: "#9CA3AF",
    output: "Estabilidade ops · suporte pipeline", note: "ROI indireto via entrega de propostas e suporte ao pipeline",
    gradient: "linear-gradient(135deg,#64748b,#94a3b8)", initial: "A",
  },
  {
    name: "Dev Team", role: "Desenvolvimento",
    cost: 40500, revenueAttr: 0, roi: "Investimento", trend: "Crítico", trendColor: "#dc2626",
    output: "4 milestones entregues (Sales OS, Finance OS…)", note: "Redução para R$20.250 em ~2 meses",
    gradient: "linear-gradient(135deg,#6366f1,#818cf8)", initial: "DT",
  },
];

const TOTAL_COST = 74000;
const TOTAL_MRR = 19900;
const TEAM_ROI = Math.round((TOTAL_MRR / TOTAL_COST) * 100);
const BREAKEVEN_COST = 138100;

function TrendChip({ trend, color }: { trend: string; color: string }) {
  const icon = trend === "Melhorando" ? <TrendingUp size={10} />
    : trend === "Abaixo" || trend === "Crítico" ? <TrendingDown size={10} />
    : <Minus size={10} />;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${color}15`, color }}>
      {icon}{trend}
    </span>
  );
}

export default function Equipa() {
  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Equipa — ROI</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {todayDate}</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              CEO View
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Amber banner */}
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: "#d97706" }}>Ação pendente</div>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                Alexandre precisa adicionar coluna <strong>Source</strong> ao Google Sheets dos clientes
                (valores: Julia / Parceria / Direct / Oscar / Outro). Quando adicionada, todos os cálculos
                de ROI por fonte ficam automáticos.
              </p>
            </div>
          </div>

          {/* Total team cost card */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Custo total da equipa/mês</div>
                <div className="text-2xl font-bold" style={{ color: "#dc2626" }}>R$ {BREAKEVEN_COST.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>fixed headcount</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>MRR hoje</div>
                <div className="text-2xl font-bold" style={{ color: "#9e3ffd" }}>R$ {TOTAL_MRR.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>14% do burn</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Team ROI atual</div>
                <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{TEAM_ROI}%</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>target: 100% (break-even)</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>MRR para break-even</div>
                <div className="text-2xl font-bold" style={{ color: "#16163f" }}>R$ {BREAKEVEN_COST.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#dc2626" }}>faltam R$ {(BREAKEVEN_COST - TOTAL_MRR).toLocaleString("pt-BR")}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: "#9CA3AF" }}>Cobertura do burn</span>
                <span className="font-semibold" style={{ color: "#f59e0b" }}>{TEAM_ROI}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <div className="h-full rounded-full" style={{ width: `${TEAM_ROI}%`, background: "linear-gradient(90deg,#f59e0b,#d97706)" }} />
              </div>
            </div>
          </div>

          {/* Team cards — sorted by ROI */}
          <div className="grid grid-cols-2 gap-4">
            {TEAM.map(m => (
              <div key={m.name} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: m.gradient, color: "#fff" }}>{m.initial}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm truncate" style={{ color: "#16163f" }}>{m.name}</div>
                      <TrendChip trend={m.trend} color={m.trendColor} />
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{m.role}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg p-2.5" style={{ background: "#fef2f2", border: "1px solid #fee2e2" }}>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Custo fixo/mês</div>
                    <div className="text-sm font-bold" style={{ color: "#dc2626" }}>
                      {m.cost > 0 ? `R$ ${m.cost.toLocaleString("pt-BR")}` : "R$ 0 (variável)"}
                    </div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Receita atribuível</div>
                    <div className="text-sm font-bold" style={{ color: "#16a34a" }}>
                      {m.revenueAttr > 0 ? `R$ ${m.revenueAttr.toLocaleString("pt-BR")}` : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>ROI</div>
                    <div className="text-sm font-bold" style={{ color: "#d97706" }}>{m.roi}</div>
                  </div>
                </div>

                <div className="text-xs mb-2" style={{ color: "#374151" }}>
                  <span className="font-medium">Output: </span>{m.output}
                </div>

                {m.note && (
                  <div className="flex items-start gap-1.5 mt-2">
                    <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[11px] italic leading-relaxed" style={{ color: "#9CA3AF" }}>{m.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Source note */}
          <div className="rounded-xl p-4 flex items-start gap-2" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
            <p className="text-[11px] italic" style={{ color: "#9CA3AF" }}>
              Em produção: receita por pessoa calculada automaticamente quando coluna Source for adicionada ao Google Sheets (Alexandre).
            </p>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
