import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { CheckCircle, Circle, AlertTriangle, Clock, DollarSign, TrendingDown } from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const MONTHLY_COST = 40500;
const REDUCED_COST = 20250;

const PROJECTS = [
  {
    name: "Sales OS",
    desc: "Plataforma operacional para gestão da equipa de vendas",
    delivery: "Esta semana",
    status: "Em progresso",
    statusColor: "#f59e0b",
    progress: 72,
    costToDate: 162000,
    deliveryDate: "2026-06-10",
    deliverables: [
      { label: "Zoho CRM integration",        done: true  },
      { label: "Call Assist (IA)",             done: false },
      { label: "Queue page",                   done: true  },
      { label: "Renan Manager Console",        done: true  },
      { label: "Oscar Partner Portal",         done: false },
      { label: "Finance OS",                   done: true  },
    ],
    blockers: ["Call Assist aguarda decisão de UX"],
  },
  {
    name: "MT (Mercado Transparente)",
    desc: "Plataforma de comparação de preços de energia para empresas",
    delivery: "2 semanas",
    status: "Em progresso",
    statusColor: "#9e3ffd",
    progress: 45,
    costToDate: 81000,
    deliveryDate: "2026-06-20",
    deliverables: [
      { label: "Listagem de preços em tempo real", done: true  },
      { label: "Comparativo de fornecedores",      done: false },
      { label: "Lead capture form",                done: false },
      { label: "SEO pages",                        done: false },
    ],
    blockers: [],
  },
  {
    name: "SOP Agents",
    desc: "Agentes de IA para execução de SOPs operacionais",
    delivery: "3 semanas",
    status: "Em progresso",
    statusColor: "#16a34a",
    progress: 30,
    costToDate: 40500,
    deliveryDate: "2026-06-30",
    deliverables: [
      { label: "12 de 14 agentes construídos",  done: false },
      { label: "Testes de qualidade (QA pass)", done: false },
      { label: "Deploy em produção",            done: false },
    ],
    blockers: ["SOP 7 e SOP 11 com erros de lógica"],
  },
];

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Produto() {
  const totalSpent = PROJECTS.reduce((s, p) => s + p.costToDate, 0);
  const costPerMilestone = Math.round(MONTHLY_COST / 6);
  const overdue = PROJECTS.filter(p => {
    const d = new Date(p.deliveryDate);
    return d < new Date() && p.status !== "Entregue";
  });

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Produto</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {todayDate}</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              CEO View
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Dev cost card */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={15} style={{ color: "#9e3ffd" }} />
              <div className="font-bold text-sm" style={{ color: "#16163f" }}>Custo Dev Team</div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Custo mensal atual",    value: `R$ ${MONTHLY_COST.toLocaleString("pt-BR")}`,  color: "#dc2626" },
                { label: "Após redução (~2 meses)", value: `R$ ${REDUCED_COST.toLocaleString("pt-BR")}`, color: "#16a34a" },
                { label: "Poupança mensal",        value: `R$ ${(MONTHLY_COST - REDUCED_COST).toLocaleString("pt-BR")}`, color: "#f59e0b" },
                { label: "Total investido até hoje", value: `R$ ${totalSpent.toLocaleString("pt-BR")}`,  color: "#374151" },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="text-[10px] mb-1" style={{ color: "#9CA3AF" }}>{k.label}</div>
                  <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Project cards */}
          <div className="grid grid-cols-3 gap-4">
            {PROJECTS.map(p => (
              <div key={p.name} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-sm" style={{ color: "#16163f" }}>{p.name}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2 shrink-0"
                    style={{ background: `${p.statusColor}15`, color: p.statusColor }}>
                    {p.status}
                  </span>
                </div>
                <div className="text-xs mb-3 leading-relaxed" style={{ color: "#6B7280" }}>{p.desc}</div>

                <div className="flex items-center gap-1.5 mb-3 text-[11px]" style={{ color: "#9CA3AF" }}>
                  <Clock size={11} />
                  <span>Entrega: {p.delivery}</span>
                </div>

                <div className="mb-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span style={{ color: "#9CA3AF" }}>Progresso</span>
                    <span className="font-semibold" style={{ color: p.statusColor }}>{p.progress}%</span>
                  </div>
                  <ProgressBar pct={p.progress} color={p.statusColor} />
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#C4C8D4" }}>Milestones</div>
                  {p.deliverables.map(d => (
                    <div key={d.label} className="flex items-start gap-2 text-xs">
                      {d.done
                        ? <CheckCircle size={13} style={{ color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
                        : <Circle size={13} style={{ color: "#D1D5DB", flexShrink: 0, marginTop: 1 }} />}
                      <span style={{ color: d.done ? "#374151" : "#9CA3AF" }}>{d.label}</span>
                    </div>
                  ))}
                </div>

                {p.blockers.length > 0 && (
                  <div className="mt-4 rounded-lg p-2.5" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={11} style={{ color: "#dc2626" }} />
                      <span className="text-[10px] font-bold" style={{ color: "#dc2626" }}>Blocker</span>
                    </div>
                    {p.blockers.map(b => (
                      <div key={b} className="text-[11px]" style={{ color: "#991b1b" }}>{b}</div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Custo investido</div>
                  <div className="text-xs font-bold" style={{ color: "#374151" }}>R$ {p.costToDate.toLocaleString("pt-BR")}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="font-bold text-sm mb-4" style={{ color: "#16163f" }}>Timeline de Entrega</div>
            <div className="space-y-3">
              {PROJECTS.map(p => {
                const weeks = ["S1 (esta semana)", "S2", "S3", "S4", "S5", "S6"];
                const endIdx = p.name === "Sales OS" ? 0 : p.name.includes("MT") ? 1 : 2;
                return (
                  <div key={p.name} className="flex items-center gap-4">
                    <div className="w-48 text-xs font-semibold shrink-0" style={{ color: "#374151" }}>{p.name}</div>
                    <div className="flex-1 relative h-8 flex items-center">
                      {weeks.map((w, i) => (
                        <div key={w} className="flex-1 h-8 flex items-center justify-center relative"
                          style={{ borderLeft: i === 0 ? "none" : "1px dashed #E8EAED" }}>
                          {i === 0 && (
                            <div className="absolute text-[9px]" style={{ color: "#9CA3AF", top: -14 }}>Hoje</div>
                          )}
                          {i <= endIdx && (
                            <div className="w-full h-5 rounded"
                              style={{
                                background: `${p.statusColor}${i === endIdx ? "40" : "20"}`,
                                borderRight: i === endIdx ? `2px solid ${p.statusColor}` : "none",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="w-28 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${p.statusColor}15`, color: p.statusColor }}>
                        {p.delivery}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk flags */}
          {overdue.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} style={{ color: "#dc2626" }} />
                <div className="font-bold text-sm" style={{ color: "#dc2626" }}>Projetos em atraso</div>
              </div>
              {overdue.map(p => (
                <div key={p.name} className="text-xs" style={{ color: "#991b1b" }}>
                  {p.name} — entrega prevista {p.delivery} ultrapassada
                </div>
              ))}
            </div>
          )}

          {/* Cost efficiency */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="font-bold text-sm mb-4" style={{ color: "#16163f" }}>Eficiência de Custo</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                <div className="text-[10px] mb-1" style={{ color: "#9CA3AF" }}>Custo por milestone</div>
                <div className="text-xl font-bold" style={{ color: "#374151" }}>R$ {costPerMilestone.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>6 milestones esperados/mês</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                <div className="text-[10px] mb-1" style={{ color: "#9CA3AF" }}>Milestones entregues</div>
                <div className="text-xl font-bold" style={{ color: "#f59e0b" }}>4 de 12</div>
                <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>neste ciclo</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown size={11} style={{ color: "#dc2626" }} />
                  <div className="text-[10px]" style={{ color: "#dc2626" }}>Velocidade abaixo do plano</div>
                </div>
                <div className="text-xl font-bold" style={{ color: "#dc2626" }}>33%</div>
                <div className="text-[10px] mt-1" style={{ color: "#dc2626" }}>vs 100% planejado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
