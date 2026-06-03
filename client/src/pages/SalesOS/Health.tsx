import { useState } from "react";
import { motion } from "framer-motion";
import { SalesOSLayout, useViewAs } from "@/components/sales/SalesOSLayout";
import { mockLeads } from "@/data/mockLeads";
import { mockRepStats } from "@/data/mockLeads";
import { mockOscarLeads, OscarLead } from "@/data/mockOscarLeads";
import {
  Activity, TrendingUp, AlertTriangle, Clock, FileText,
  CheckCircle, Users, DollarSign, AlertCircle, Cpu,
  BarChart3, Lock, GitBranch, Zap, Wifi, PhoneCall,
  ArrowUp, ArrowDown, Minus, AlertCircle as SopAlert, ExternalLink,
} from "lucide-react";

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
    rank: 1, company: "Câmara Fria São Paulo Ltda",
    action:     "Chase de proposta urgente",
    actionEn:   "Urgent proposal chase",
    reason:     "Prazo vence em 72h, R$45k bloqueado. Rodrigo Teixeira receptivo mas aguardando decisão dos sócios.",
    reasonEn:   "Deadline in 72h, R$45k blocked. Rodrigo Teixeira receptive but waiting on partners' decision.",
    value: "R$ 45k", color: "#dc2626",
  },
  {
    rank: 2, company: "Hotel Bela Vista",
    action:     "Pedido de conta — decisor alcançado",
    actionEn:   "Bill request — DM reached",
    reason:     "Carlos Andrade confirmou ser decisor há 1d sem pedido de conta. Taxa de conversão cai 80% após 48h.",
    reasonEn:   "Carlos Andrade confirmed as DM 1 day ago, no bill request yet. Conversion rate drops 80% after 48h.",
    value: "R$ 28k", color: "#ea580c",
  },
  {
    rank: 3, company: "Supermercado Mercantil Norte",
    action:     "Callback prometido — atraso de 2 dias",
    actionEn:   "Promised callback — 2 days overdue",
    reason:     "Decisor pediu callback às 14h de ontem. Ligação não realizada. Janela de confiança fechando.",
    reasonEn:   "DM asked for a callback yesterday at 14:00. Call not made. Trust window closing.",
    value: "R$ 22k", color: "#d97706",
  },
  {
    rank: 4, company: "Clínica Médica Horizonte",
    action:     "Resposta humana pendente — SLA 24h",
    actionEn:   "Human reply pending — SLA 24h",
    reason:     "Mensagem recebida ontem às 11h sem resposta. SLA de resposta violado. Risco de perda de interesse.",
    reasonEn:   "Message received yesterday at 11:00 with no reply. Response SLA breached. Risk of losing interest.",
    value: "R$ 18k", color: "#2563eb",
  },
  {
    rank: 5, company: "Indústria Metalúrgica Sorocaba",
    action:     "Reativar lead parado há 5 dias",
    actionEn:   "Reactivate lead stalled for 5 days",
    reason:     "Lead P6 sem ação. Perfil de consumo elegível para ACL Direto. Thaina tem slot disponível hoje.",
    reasonEn:   "P6 lead with no action. Consumption profile eligible for ACL Direct. Thaina has a slot today.",
    value: "R$ 15k", color: "#7c3aed",
  },
];

const PIPELINE_STAGES = [
  { label: "Novo / Julia", labelEn: "New / Julia",       count: mockLeads.filter(l => l.priority === "P7").length, color: "#7c3aed" },
  { label: "Decisor ID",   labelEn: "DM Identified",     count: mockLeads.filter(l => l.priority === "P4" || l.priority === "P5").length, color: "#2563eb" },
  { label: "Decisor Alc.", labelEn: "DM Reached",        count: mockLeads.filter(l => l.dm_status === "Alcançado").length, color: "#d97706" },
  { label: "Conta Ped.",   labelEn: "Bill Requested",    count: mockLeads.filter(l => l.bill_status).length, color: "#ea580c" },
  { label: "Parado 48h+",  labelEn: "Stalled 48h+",     count: mockLeads.filter(l => l.priority === "P6" || l.priority === "P8").length, color: "#9CA3AF" },
];
const maxPipeline = Math.max(...PIPELINE_STAGES.map(s => s.count), 1);

// ── Founder-only data ──────────────────────────────────────────────────────

const OSCAR_STAGES: { status: OscarLead["status"]; label: string; labelEn: string; color: string }[] = [
  { status: "Não contatado",   label: "Prospecção",            labelEn: "Prospecting",     color: "#6b7280" },
  { status: "Em contato",      label: "Em Conversa",           labelEn: "In Conversation",  color: "#d97706" },
  { status: "Reunião Marcada", label: "Reunião",               labelEn: "Meeting Scheduled",color: "#7c3aed" },
  { status: "Proposta Enviada",label: "Proposta Ótima Agente", labelEn: "Proposal Sent",    color: "#2563eb" },
  { status: "Agente Ativo",    label: "Agente Ativo",          labelEn: "Active Agent",     color: "#16a34a" },
];

const WEEKLY_TRENDS = {
  Elayne: { initial: "E", color: "#9e3ffd", tw: { calls: 12, dms: 4, bills: 3, rcvd: 1 }, lw: { calls: 9, dms: 2, bills: 2, rcvd: 1 } },
  Thaina: { initial: "T", color: "#2563eb", tw: { calls:  9, dms: 3, bills: 2, rcvd: 1 }, lw: { calls: 14, dms: 5, bills: 4, rcvd: 2 } },
};

const CALLUM_DECISIONS = [
  { id: "d1", title: "Câmara Fria São Paulo — proposal expires in 72h", desc: "R$45k blocked. Rodrigo Teixeira is receptive but waiting on partners' decision. At risk without action.", value: "R$ 45k", color: "#dc2626", type: "deal" },
  { id: "d2", title: "Hotel Bela Vista — decision-maker reached, no bill request yet", desc: "R$28k. Receptivity window closes in 48h. Elayne or Renan must act today.", value: "R$ 28k", color: "#ea580c", type: "deal" },
  { id: "d3", title: "Supermercado Mercantil Norte — promised callback 2 days overdue", desc: "R$22k. Decision-maker expected a call back yesterday at 14:00. Call not made.", value: "R$ 22k", color: "#d97706", type: "deal" },
  { id: "d4", title: "SOP 7 (Enrichment) — recurring timeout 3× in 24h", desc: "Affects enrichment of leads entering the queue. API responding slowly. Check quota.", value: null, color: "#7c3aed", type: "sop" },
  { id: "d5", title: "SOP 11 (ECOS) — configuration error", desc: "ECOS generation failing for leads above R$50k/year. Last error: PRC config not found.", value: null, color: "#7c3aed", type: "sop" },
];

function TrendBadge({ now, prev }: { now: number; prev: number }) {
  const diff = now - prev;
  if (diff > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "#16a34a" }}>
      <ArrowUp size={8} />+{diff}
    </span>
  );
  if (diff < 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "#dc2626" }}>
      <ArrowDown size={8} />{diff}
    </span>
  );
  return <span style={{ color: "#9CA3AF" }}><Minus size={8} /></span>;
}

export default function Health() {
  return <SalesOSLayout><HealthContent /></SalesOSLayout>;
}

function HealthContent() {
  const { isRep, isFounder } = useViewAs();
  const [tab] = useState("health");

  const todayDate = isFounder
    ? new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  if (isRep) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Lock size={28} style={{ color: "#E8EAED" }} />
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Acesso restrito ao Fundador.</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>{isFounder ? "System Health" : "Saúde do Sistema"}</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>{isFounder ? "Callum" : "Renan"} · {todayDate}</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: queueHealth >= 80 ? "#f0fdf4" : "#fef2f2", color: queueHealth >= 80 ? "#16a34a" : "#dc2626", border: `1px solid ${queueHealth >= 80 ? "#bbf7d0" : "#fecaca"}` }}>
              <Activity size={14} />
              {isFounder ? `Queue ${queueHealth}% healthy` : `Fila ${queueHealth}% saudável`}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 10 metric cards — 2×5 grid */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
              {isFounder ? "Today's Metrics" : "Métricas de Hoje"}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <MetricCard
                icon={<Activity size={15} />} color="#9e3ffd"
                title={isFounder ? "Queue Health" : "Saúde da Fila"}
                main={`${queueHealth}%`}
                sub={isFounder ? `${p1p3Actioned}/${p1p3.length} P1-P3 actioned` : `${p1p3Actioned}/${p1p3.length} P1-P3 accionados`}
                ring={queueHealth}
              />
              <MetricCard
                icon={<TrendingUp size={15} />} color="#7c3aed"
                title={isFounder ? "Julia Pipeline" : "Pipeline Julia"}
                main={String(mockLeads.filter(l => l.priority === "P7").length)}
                sub={isFounder ? "new this week" : "novos esta semana"}
              />
              <MetricCard
                icon={<AlertTriangle size={15} />} color="#dc2626"
                title={isFounder ? "Stalled Leads" : "Leads Parados"}
                main={String(noNextAction.length)}
                sub={isFounder ? "no action 48h+" : "sem ação 48h+"}
                alert={noNextAction.length > 10}
              />
              <MetricCard
                icon={<Clock size={15} />} color="#ea580c"
                title={isFounder ? "Overdue Callbacks" : "Callbacks em Atraso"}
                main={String(overdue.length)}
                sub={isFounder ? "team total" : "no total da equipe"}
                alert={overdue.length > 5}
              />
              <MetricCard
                icon={<FileText size={15} />} color="#d97706"
                title={isFounder ? "Bills Requested" : "Contas Solicitadas"}
                main={String(teamBills)}
                sub={isFounder ? "today / this week" : "hoje / esta semana"}
              />
              <MetricCard
                icon={<CheckCircle size={15} />} color="#16a34a"
                title={isFounder ? "Bills Received" : "Contas Recebidas"}
                main={String(elayne.billsReceived + thaina.billsReceived)}
                sub={isFounder
                  ? `${Math.round(((elayne.billsReceived + thaina.billsReceived) / Math.max(teamBills,1)) * 100)}% conversion rate`
                  : `${Math.round(((elayne.billsReceived + thaina.billsReceived) / Math.max(teamBills,1)) * 100)}% taxa de conversão`}
              />
              <MetricCard
                icon={<Users size={15} />} color="#2563eb"
                title={isFounder ? "DMs Reached" : "Decisores Alcançados"}
                main={String(teamDMs)}
                sub={isFounder ? "today / this week" : "hoje / esta semana"}
              />
              <MetricCard
                icon={<DollarSign size={15} />} color="#7c3aed"
                title={isFounder ? "Blocked Value" : "Valor Bloqueado"}
                main="R$ 128k"
                sub={isFounder ? "in Bill Requested with no response" : "em Conta Solicitada sem resposta"}
              />
              <MetricCard
                icon={<AlertCircle size={15} />} color="#dc2626"
                title={isFounder ? "Reply SLA" : "SLA de Respostas"}
                main={String(humanReplies.length)}
                sub={isFounder ? "breached this week" : "violados esta semana"}
                alert={humanReplies.length > 2}
              />
              <MetricCard
                icon={<Cpu size={15} />} color="#16a34a"
                title={isFounder ? "SOP Agents" : "Agentes SOP"}
                main={isFounder ? "12 of 14" : "12 de 14"}
                sub={isFounder ? "2 with errors — check" : "2 com erros — verificar"}
              />
            </div>
          </div>

          {/* Top 5 revenue actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={15} style={{ color: "#9e3ffd" }} />
              <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>{isFounder ? "Top 5 Revenue Actions" : "Top 5 Ações de Receita"}</h2>
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
                        {isFounder ? action.actionEn : action.action}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{isFounder ? action.reasonEn : action.reason}</p>
                  </div>
                  <div className="shrink-0 text-sm font-bold" style={{ color: action.color }}>{action.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rep performance + pipeline health (always visible) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rep performance summary */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <Users size={14} style={{ color: "#9e3ffd" }} />
                <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{isFounder ? "Rep Performance — This Week" : "Desempenho das Reps — Esta Semana"}</span>
              </div>
              <div className="px-5 py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>Rep</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>{isFounder ? "Calls" : "Lig."}</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>DMs</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>{isFounder ? "Bills" : "Contas"}</th>
                      <th className="text-center pb-2" style={{ color: "#9CA3AF", fontWeight: 600 }}>{isFounder ? "Rcvd." : "Receb."}</th>
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
                      <td className="pt-2 font-bold text-xs" style={{ color: "#9CA3AF" }}>{isFounder ? "Team Total" : "Total equipe"}</td>
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
                <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{isFounder ? "Pipeline Health by Stage" : "Saúde do Pipeline por Etapa"}</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {PIPELINE_STAGES.map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="text-xs w-24 shrink-0" style={{ color: "#6B7280" }}>{isFounder ? s.labelEn : s.label}</div>
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

          {/* ── FOUNDER-ONLY SECTIONS ─────────────────────────────────── */}
          {isFounder && (
            <>
              {/* 1. Team Overview — week-over-week trends */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={15} style={{ color: "#9e3ffd" }} />
                  <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>Team Overview</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
                    style={{ background: "rgba(158,63,253,0.07)", color: "#9e3ffd" }}>
                    vs. last week
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: "#9CA3AF" }}>Rep</th>
                        {["Calls", "DMs", "Bills Req.", "Bills Rcvd."].map(h => (
                          <th key={h} className="text-center px-3 py-3 font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(["Elayne", "Thaina"] as const).map(name => {
                        const r = WEEKLY_TRENDS[name];
                        return (
                          <tr key={name} style={{ borderBottom: "1px solid #F9FAFB" }}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                                  style={{ background: `${r.color}20`, color: r.color }}>
                                  {r.initial}
                                </div>
                                <span className="font-semibold" style={{ color: "#16163f" }}>{name}</span>
                              </div>
                            </td>
                            {[
                              { tw: r.tw.calls,  lw: r.lw.calls  },
                              { tw: r.tw.dms,   lw: r.lw.dms   },
                              { tw: r.tw.bills, lw: r.lw.bills  },
                              { tw: r.tw.rcvd,  lw: r.lw.rcvd   },
                            ].map((cell, ci) => (
                              <td key={ci} className="text-center px-3 py-3">
                                <div className="font-bold" style={{ color: "#16163f" }}>{cell.tw}</div>
                                <TrendBadge now={cell.tw} prev={cell.lw} />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      <tr>
                        <td className="px-5 py-3 font-bold text-xs" style={{ color: "#9CA3AF" }}>Total</td>
                        {[
                          { tw: WEEKLY_TRENDS.Elayne.tw.calls  + WEEKLY_TRENDS.Thaina.tw.calls,  lw: WEEKLY_TRENDS.Elayne.lw.calls  + WEEKLY_TRENDS.Thaina.lw.calls  },
                          { tw: WEEKLY_TRENDS.Elayne.tw.dms    + WEEKLY_TRENDS.Thaina.tw.dms,    lw: WEEKLY_TRENDS.Elayne.lw.dms    + WEEKLY_TRENDS.Thaina.lw.dms    },
                          { tw: WEEKLY_TRENDS.Elayne.tw.bills  + WEEKLY_TRENDS.Thaina.tw.bills,  lw: WEEKLY_TRENDS.Elayne.lw.bills  + WEEKLY_TRENDS.Thaina.lw.bills  },
                          { tw: WEEKLY_TRENDS.Elayne.tw.rcvd   + WEEKLY_TRENDS.Thaina.tw.rcvd,   lw: WEEKLY_TRENDS.Elayne.lw.rcvd   + WEEKLY_TRENDS.Thaina.lw.rcvd   },
                        ].map((cell, ci) => (
                          <td key={ci} className="text-center px-3 py-3">
                            <div className="font-bold" style={{ color: "#9e3ffd" }}>{cell.tw}</div>
                            <TrendBadge now={cell.tw} prev={cell.lw} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Oscar Agent Pipeline — compact funnel */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch size={15} style={{ color: "#16a34a" }} />
                  <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>Oscar Agent Pipeline</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full ml-auto font-medium"
                    style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                    {mockOscarLeads.filter(l => l.status === "Agente Ativo").length} active
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                  {OSCAR_STAGES.map((stage, i) => {
                    const count = mockOscarLeads.filter(l => l.status === stage.status).length;
                    const maxCount = Math.max(...OSCAR_STAGES.map(s => mockOscarLeads.filter(l => l.status === s.status).length), 1);
                    return (
                      <div
                        key={stage.status}
                        className="flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0"
                        style={{ borderColor: "#F3F4F6" }}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />
                        <div className="text-xs font-medium w-40 shrink-0" style={{ color: "#374151" }}>{stage.labelEn}</div>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: stage.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxCount) * 100}%` }}
                            transition={{ duration: 0.7, delay: i * 0.08 }}
                          />
                        </div>
                        <div className="text-xs font-bold w-5 text-right" style={{ color: stage.color }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. System Health */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={15} style={{ color: "#9e3ffd" }} />
                  <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>System Health</h2>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      name: "Julia (Triage)",
                      icon: <Zap size={14} />,
                      status: "Operational",
                      detail: "2 leads triaged this week",
                      ok: true,
                      color: "#16a34a",
                    },
                    {
                      name: "SOP Agents",
                      icon: <Cpu size={14} />,
                      status: "12 of 14 OK",
                      detail: "SOPs 7 and 11 with errors",
                      ok: false,
                      color: "#dc2626",
                    },
                    {
                      name: "Zoho CRM Sync",
                      icon: <Wifi size={14} />,
                      status: "Synced",
                      detail: "Last sync 4 min ago",
                      ok: true,
                      color: "#16a34a",
                    },
                    {
                      name: "PABX Dialler",
                      icon: <PhoneCall size={14} />,
                      status: "Operational",
                      detail: "Latency 42ms",
                      ok: true,
                      color: "#16a34a",
                    },
                  ].map(sys => (
                    <div
                      key={sys.name}
                      className="rounded-xl p-4"
                      style={{
                        background: "#FFFFFF",
                        border: sys.ok ? "1px solid #E8EAED" : "1px solid #fecaca",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: `${sys.color}15` }}>
                          <span style={{ color: sys.color }}>{sys.icon}</span>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${sys.color}15`, color: sys.color }}
                        >
                          {sys.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs mb-0.5" style={{ color: "#16163f" }}>{sys.name}</div>
                      <div className="text-[10px]" style={{ color: sys.ok ? "#9CA3AF" : "#dc2626" }}>{sys.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Pending Decisions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SopAlert size={15} style={{ color: "#dc2626" }} />
                  <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>Pending Decisions</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    {CALLUM_DECISIONS.length} items
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                  {CALLUM_DECISIONS.map((d, i) => (
                    <div
                      key={d.id}
                      className="flex items-start gap-4 px-5 py-4 border-b last:border-b-0"
                      style={{ borderColor: "#F3F4F6", borderLeft: `4px solid ${d.color}` }}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                        style={{ background: `${d.color}15`, color: d.color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-bold text-xs" style={{ color: "#16163f" }}>{d.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: `${d.color}12`, color: d.color }}>
                            {d.type === "deal" ? "Deal" : "SOP"}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{d.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {d.value && (
                          <span className="text-sm font-bold" style={{ color: d.color }}>{d.value}</span>
                        )}
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: `${d.color}12`, color: d.color, border: `1px solid ${d.color}30` }}
                        >
                          <ExternalLink size={10} /> {d.type === "deal" ? "View deal" : "Check"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  );
}
