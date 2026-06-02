import { useState } from "react";
import { motion } from "framer-motion";
import { SalesOSLayout, useViewAs } from "@/components/sales/SalesOSLayout";
import { mockLeads } from "@/data/mockLeads";
import { mockRepStats } from "@/data/mockLeads";
import {
  Activity, TrendingUp, AlertTriangle, Clock, FileText,
  CheckCircle, Users, DollarSign, AlertCircle, Cpu,
  BarChart3, Lock,
} from "lucide-react";

const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

function ProgressRing({ pct, size = 56, stroke = 5, color = "#9e3ffd" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EAED" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}

function MetricCard({ icon, title, main, sub, color, ring, alert }: {
  icon: React.ReactNode; title: string; main: string; sub?: string; color: string;
  ring?: number; alert?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{
        background: "#FFFFFF",
        border: alert ? "1px solid #fecaca" : "1px solid #E8EAED",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {ring !== undefined && (
          <div className="relative flex items-center justify-center">
            <ProgressRing pct={ring} size={48} stroke={4} color={color} />
            <span className="absolute text-[10px] font-bold" style={{ color }}>{ring}%</span>
          </div>
        )}
        {alert && <AlertTriangle size={14} style={{ color: "#dc2626" }} />}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: "#16163f" }}>{main}</div>
      <div className="text-xs font-medium" style={{ color: "#6B7280" }}>{title}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color }}>{sub}</div>}
    </motion.div>
  );
}

const noNextAction = mockLeads.filter(l => !l.next_action || l.next_action_overdue);
const overdue = mockLeads.filter(l => l.next_action_overdue);
const dmNoRequest = mockLeads.filter(l => l.dm_status === "Alcançado" && !l.bill_status);
const humanReplies = mockLeads.filter(l => l.human_response_required);
const p1p3 = mockLeads.filter(l => ["P1","P2","P3"].includes(l.priority));
const p1p3Actioned = p1p3.filter(l => !l.next_action_overdue).length;
const queueHealth = p1p3.length > 0 ? Math.round((p1p3Actioned / p1p3.length) * 100) : 100;

const elayne = mockRepStats["Elayne Nunes"];
const thaina  = mockRepStats["Thaina Domet"];
const teamCalls = elayne.calls + thaina.calls;
const teamDMs   = elayne.dmsReached + thaina.dmsReached;
const teamBills = elayne.billsRequested + thaina.billsRequested;

const TOP5_ACTIONS = [
  {
    rank: 1,
    company: "Câmara Fria São Paulo Ltda",
    action: "Chase de proposta urgente",
    reason: "Prazo vence em 72h, R$45k bloqueado. Rodrigo Teixeira receptivo mas aguardando decisão dos sócios.",
    value: "R$ 45k",
    color: "#dc2626",
  },
  {
    rank: 2,
    company: "Hotel Bela Vista",
    action: "Pedido de conta — decisor alcançado",
    reason: "Carlos Andrade confirmou ser decisor há 1d sem pedido de conta. Taxa de conversão cai 80% após 48h.",
    value: "R$ 28k",
    color: "#ea580c",
  },
  {
    rank: 3,
    company: "Supermercado Mercantil Norte",
    action: "Callback prometido — atraso de 2 dias",
    reason: "Decisor pediu callback às 14h de ontem. Ligação não realizada. Janela de confiança fechando.",
    value: "R$ 22k",
    color: "#d97706",
  },
  {
    rank: 4,
    company: "Clínica Médica Horizonte",
    action: "Resposta humana pendente — SLA 24h",
    reason: "Mensagem recebida ontem às 11h sem resposta. SLA de resposta violado. Risco de perda de interesse.",
    value: "R$ 18k",
    color: "#2563eb",
  },
  {
    rank: 5,
    company: "Indústria Metalúrgica Sorocaba",
    action: "Reativar lead parado há 5 dias",
    reason: "Lead P6 sem ação. Perfil de consumo elegível para ACL Direto. Thaina tem slot disponível hoje.",
    value: "R$ 15k",
    color: "#7c3aed",
  },
];

const PIPELINE_STAGES = [
  { label: "Novo / Julia", count: mockLeads.filter(l => l.priority === "P7").length, color: "#7c3aed" },
  { label: "Decisor ID",   count: mockLeads.filter(l => l.priority === "P4" || l.priority === "P5").length, color: "#2563eb" },
  { label: "Decisor Alc.", count: mockLeads.filter(l => l.dm_status === "Alcançado").length, color: "#d97706" },
  { label: "Conta Ped.",   count: mockLeads.filter(l => l.bill_status).length, color: "#ea580c" },
  { label: "Parado 48h+",  count: mockLeads.filter(l => l.priority === "P6" || l.priority === "P8").length, color: "#9CA3AF" },
];
const maxPipeline = Math.max(...PIPELINE_STAGES.map(s => s.count), 1);

export default function Health() {
  const { isRep } = useViewAs();
  const [tab] = useState("health");

  if (isRep) {
    return (
      <SalesOSLayout>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Lock size={28} style={{ color: "#E8EAED" }} />
          <p className="text-sm" style={{ color: "#9CA3AF" }}>Acesso restrito ao Fundador.</p>
        </div>
      </SalesOSLayout>
    );
  }

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Saúde do Sistema</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Renan · {today}</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: queueHealth >= 80 ? "#f0fdf4" : "#fef2f2", color: queueHealth >= 80 ? "#16a34a" : "#dc2626", border: `1px solid ${queueHealth >= 80 ? "#bbf7d0" : "#fecaca"}` }}>
              <Activity size={14} />
              Fila {queueHealth}% saudável
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 10 metric cards — 2×5 grid */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
              Métricas de Hoje
            </div>
            <div className="grid grid-cols-5 gap-3">
              <MetricCard
                icon={<Activity size={15} />} color="#9e3ffd"
                title="Saúde da Fila"
                main={`${queueHealth}%`}
                sub={`${p1p3Actioned}/${p1p3.length} P1-P3 accionados`}
                ring={queueHealth}
              />
              <MetricCard
                icon={<TrendingUp size={15} />} color="#7c3aed"
                title="Pipeline Julia"
                main={String(mockLeads.filter(l => l.priority === "P7").length)}
                sub="novos esta semana"
              />
              <MetricCard
                icon={<AlertTriangle size={15} />} color="#dc2626"
                title="Leads Parados"
                main={String(noNextAction.length)}
                sub="sem ação 48h+"
                alert={noNextAction.length > 10}
              />
              <MetricCard
                icon={<Clock size={15} />} color="#ea580c"
                title="Callbacks em Atraso"
                main={String(overdue.length)}
                sub="no total da equipe"
                alert={overdue.length > 5}
              />
              <MetricCard
                icon={<FileText size={15} />} color="#d97706"
                title="Contas Solicitadas"
                main={String(teamBills)}
                sub="hoje / esta semana"
              />
              <MetricCard
                icon={<CheckCircle size={15} />} color="#16a34a"
                title="Contas Recebidas"
                main={String(elayne.billsReceived + thaina.billsReceived)}
                sub={`${Math.round(((elayne.billsReceived + thaina.billsReceived) / Math.max(teamBills,1)) * 100)}% taxa de conversão`}
              />
              <MetricCard
                icon={<Users size={15} />} color="#2563eb"
                title="Decisores Alcançados"
                main={String(teamDMs)}
                sub="hoje / esta semana"
              />
              <MetricCard
                icon={<DollarSign size={15} />} color="#7c3aed"
                title="Valor Bloqueado"
                main="R$ 128k"
                sub="em Conta Solicitada sem resposta"
              />
              <MetricCard
                icon={<AlertCircle size={15} />} color="#dc2626"
                title="SLA de Respostas"
                main={String(humanReplies.length)}
                sub="violados esta semana"
                alert={humanReplies.length > 2}
              />
              <MetricCard
                icon={<Cpu size={15} />} color="#16a34a"
                title="Agentes SOP"
                main="12 de 14"
                sub="2 com erros — verificar"
              />
            </div>
          </div>

          {/* Top 5 revenue actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={15} style={{ color: "#9e3ffd" }} />
              <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>Top 5 Ações de Receita</h2>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              {TOP5_ACTIONS.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-5 py-4 border-b last:border-b-0"
                  style={{ borderColor: "#F3F4F6" }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: `${action.color}15`, color: action.color }}>
                    {action.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "#16163f" }}>{action.company}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${action.color}15`, color: action.color }}>
                        {action.action}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{action.reason}</p>
                  </div>
                  <div className="shrink-0 text-sm font-bold" style={{ color: action.color }}>{action.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rep performance + pipeline health */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rep performance summary */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <Users size={14} style={{ color: "#9e3ffd" }} />
                <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Desempenho das Reps — Esta Semana</span>
              </div>
              <div className="px-5 py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>Rep</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>Lig.</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>DMs</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>Contas</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>Receb.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Elayne", s: elayne, color: "#9e3ffd" },
                      { name: "Thaina", s: thaina, color: "#2563eb" },
                    ].map(r => (
                      <tr key={r.name}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: `${r.color}20`, color: r.color }}>
                              {r.name[0]}
                            </div>
                            <span style={{ color: "#16163f" }}>{r.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-2 font-bold" style={{ color: "#16163f" }}>{r.s.calls}</td>
                        <td className="text-center py-2 font-bold" style={{ color: "#16163f" }}>{r.s.dmsReached}</td>
                        <td className="text-center py-2 font-bold" style={{ color: "#16163f" }}>{r.s.billsRequested}</td>
                        <td className="text-center py-2 font-bold" style={{ color: "#16163f" }}>{r.s.billsReceived}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "1px solid #E8EAED" }}>
                      <td className="pt-2 font-bold text-xs" style={{ color: "#9CA3AF" }}>Total equipe</td>
                      <td className="text-center pt-2 font-bold" style={{ color: "#9e3ffd" }}>{teamCalls}</td>
                      <td className="text-center pt-2 font-bold" style={{ color: "#9e3ffd" }}>{teamDMs}</td>
                      <td className="text-center pt-2 font-bold" style={{ color: "#9e3ffd" }}>{teamBills}</td>
                      <td className="text-center pt-2 font-bold" style={{ color: "#9e3ffd" }}>{elayne.billsReceived + thaina.billsReceived}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pipeline health */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <BarChart3 size={14} style={{ color: "#9e3ffd" }} />
                <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Saúde do Pipeline por Etapa</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {PIPELINE_STAGES.map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="text-xs w-24 shrink-0" style={{ color: "#6B7280" }}>{s.label}</div>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: s.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / maxPipeline) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-xs font-bold w-6 text-right" style={{ color: "#16163f" }}>{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
