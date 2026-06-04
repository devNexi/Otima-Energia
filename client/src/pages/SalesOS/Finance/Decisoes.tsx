import { useState } from "react";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  TOTAL_BURN, calcMRR, calcAvgTicket, calcClientsForBreakEven,
  calcMonthlyDeficit, calcRunwayMonths,
} from "@/data/financialConfig";
import { mockOscarLeads } from "@/data/mockOscarLeads";
import {
  CheckCircle, AlertTriangle, TrendingUp, Users, Zap,
  Volume2, Target, ExternalLink, X, Info,
} from "lucide-react";

const fmtBRL = (n: number) =>
  "R$\u00A0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MRR      = calcMRR();
const avg      = calcAvgTicket();
const deficit  = calcMonthlyDeficit();
const runway   = calcRunwayMonths();
const needed   = calcClientsForBreakEven();
const pctBurn  = Math.round((MRR / TOTAL_BURN) * 100);
const devPct   = Math.round((40500 / TOTAL_BURN) * 100);
const activeClients = 6;

const meetingLeads = mockOscarLeads.filter(l => l.status === "Reunião Marcada");
const combinedPortfolio = meetingLeads.reduce((sum, l) => {
  const m = l.estimatedPortfolio.match(/(\d[\d.]+)/);
  return sum + (m ? parseInt(m[1].replace(/\./g,"")) : 0);
}, 0);

const highValueReplacement = Math.round(30000 / avg * 0.11);

const CARDS: {
  id: string;
  urgency: "green" | "amber" | "red";
  icon: React.ReactNode;
  title: string;
  trigger: string;
  body: string;
  action: string;
  actionPath?: string;
  dismissLabel?: string;
}[] = [
  {
    id: "runway",
    urgency: "green",
    icon: <CheckCircle size={16} />,
    title: "Runway Saudável",
    trigger: `Runway calculado: ${runway} meses com ${fmtBRL(1269000)} disponível`,
    body: `Com o investimento confirmado, o runway é de ${runway} meses à taxa de queima atual. Tempo suficiente para o plano funcionar se a execução for forte. O foco agora é acelerar a conversão de leads antes que este prazo acabe.`,
    action: "Ver Previsão Detalhada",
    actionPath: "/sales-os/finance/previsao",
  },
  {
    id: "mrr-gap",
    urgency: "red",
    icon: <AlertTriangle size={16} />,
    title: "Gap MRR vs Break-Even",
    trigger: `MRR atual ${fmtBRL(MRR)} = ${pctBurn}% da queima mensal`,
    body: `MRR atual de ${fmtBRL(MRR)} cobre ${pctBurn}% da queima mensal. São necessários ${needed} clientes ao ticket médio atual de ${fmtBRL(Math.round(avg))} para atingir o break-even. Faltam ${needed - activeClients} clientes. Cada semana de boa execução reduz esse número.`,
    action: "Ver Pipeline de Conversão",
    actionPath: "/sales-os/health",
  },
  {
    id: "team-decision",
    urgency: "amber",
    icon: <Users size={16} />,
    title: "Decisão de Equipa Pendente",
    trigger: "Desempenho das reps abaixo da meta há 2+ semanas",
    body: `Elayne e Thaina custam ${fmtBRL(9000)}/mês fixo + comissões. O Sales OS entra em produção esta semana. Dê ao sistema 3 semanas completas de operação antes de tomar qualquer decisão. Critério claro: 1,5 contas/dia cada uma com o Sales OS ativo.`,
    action: "Ver Desempenho das Reps",
    actionPath: "/sales-os/performance",
    dismissLabel: "Adiar 3 semanas",
  },
  {
    id: "dev-milestone",
    urgency: "amber",
    icon: <Zap size={16} />,
    title: "Dev Team Milestone",
    trigger: `Dev Team = ${devPct}% da queima total (${fmtBRL(40500)}/mês)`,
    body: `${fmtBRL(40500)}/mês em dev representa ${devPct}% da queima total. Redução para ${fmtBRL(20250)} prevista em ~2 meses após entrega do Sales OS e MT. Valide o cronograma de entrega esta semana para confirmar a projeção de runway.`,
    action: "Confirmar Cronograma",
    dismissLabel: "Adiar 2 semanas",
  },
  {
    id: "oscar-pipeline",
    urgency: "green",
    icon: <Target size={16} />,
    title: "Pipeline Oscar com Tração",
    trigger: `${meetingLeads.length} reuniões agendadas com potenciais agentes`,
    body: `${meetingLeads.length} reuniões agendadas com potenciais agentes. Portfólio combinado estimado: ~${combinedPortfolio.toLocaleString("pt-BR")} clientes empresariais. Primeiro agente ativo = receita recorrente com custo marginal quase zero. Alta prioridade esta semana.`,
    action: "Ver Pipeline do Oscar",
    actionPath: "/sales-os/oscar/pipeline",
  },
  {
    id: "publicidade",
    urgency: "green",
    icon: <Volume2 size={16} />,
    title: "Publicidade Pausada Corretamente",
    trigger: "Publicidade: R$8.000/mês — inativa",
    body: `${fmtBRL(8000)}/mês corretamente pausado. Não ativar antes de conversão comprovada com o Sales OS. Teste sugerido: ${fmtBRL(2000)}/mês quando as reps atingirem 1,5 contas/dia por 2 semanas consecutivas.`,
    action: "Lembrar em 30 dias",
  },
  {
    id: "alto-valor",
    urgency: "amber",
    icon: <TrendingUp size={16} />,
    title: "Foco em Clientes de Alto Valor",
    trigger: `Ticket médio atual: ${fmtBRL(Math.round(avg))}/cliente/mês`,
    body: `Ticket médio atual: ${fmtBRL(Math.round(avg))}/cliente/mês. Para acelerar o break-even, priorize prospectos com consumo mensal acima de ${fmtBRL(30000)}. Cada cliente de alto consumo substitui até ${highValueReplacement} clientes de ticket médio — ${highValueReplacement}× o impacto no runway.`,
    action: "Ver Leads de Alto Valor",
    actionPath: "/sales-os/queue",
  },
];

const URGENCY_CFG = {
  green: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", borderLeft: "#16a34a", tagBg: "#dcfce7" },
  amber: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", borderLeft: "#f59e0b", tagBg: "#fef3c7" },
  red:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", borderLeft: "#dc2626", tagBg: "#fee2e2" },
};

export default function Decisoes() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = CARDS.filter(c => !dismissed.has(c.id));

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Decisões — Inteligência Financeira</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                Recomendações geradas automaticamente a partir de dados reais da empresa.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                <AlertTriangle size={11} />
                {CARDS.filter(c => c.urgency === "red").length} crítico
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                <AlertTriangle size={11} />
                {CARDS.filter(c => c.urgency === "amber").length} atenção
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                <CheckCircle size={11} />
                {CARDS.filter(c => c.urgency === "green").length} positivo
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {dismissed.size > 0 && (
            <div className="text-xs text-center py-2" style={{ color: "#9CA3AF" }}>
              {dismissed.size} card{dismissed.size > 1 ? "s" : ""} archived.{" "}
              <button onClick={() => setDismissed(new Set())} style={{ color: "#9e3ffd" }}>Restaurar todos</button>
            </div>
          )}

          {visible.map(card => {
            const cfg = URGENCY_CFG[card.urgency];
            return (
              <div key={card.id} className="rounded-xl overflow-hidden"
                style={{ background: "#FFFFFF", border: "1px solid #E8EAED", borderLeft: `4px solid ${cfg.borderLeft}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}>
                    <span style={{ color: cfg.color }}>{card.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "#16163f" }}>{card.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                        style={{ background: cfg.tagBg, color: cfg.color }}>
                        {card.urgency === "green" ? "Positivo" : card.urgency === "amber" ? "Atenção" : "Crítico"}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 mb-2">
                      <Info size={11} className="shrink-0 mt-0.5" style={{ color: "#9CA3AF" }} />
                      <span className="text-[11px] italic" style={{ color: "#9CA3AF" }}>{card.trigger}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{card.body}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => card.actionPath && navigate(card.actionPath)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                      <ExternalLink size={11} />
                      {card.action}
                    </button>
                    <button
                      onClick={() => setDismissed(d => new Set([...d, card.id]))}
                      className="flex items-center gap-1 text-[10px] font-medium"
                      style={{ color: "#9CA3AF" }}
                    >
                      <X size={10} /> {card.dismissLabel ?? "Arquivar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="text-center pt-2">
            <button className="text-xs underline" style={{ color: "#9CA3AF" }}>
              Configurações Financeiras — atualizar custos, cronograma de investimento e premissas dos cenários
            </button>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
