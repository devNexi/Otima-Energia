import { motion } from "framer-motion";
import { SalesOSLayout, useViewAs } from "@/components/sales/SalesOSLayout";
import { mockRepStats } from "@/data/mockLeads";
import {
  Phone, Users, FileText, FileCheck, Target, TrendingUp, Star,
  AlertTriangle, CheckCircle, Mic, Clock, RotateCcw, Award,
} from "lucide-react";

const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

const ELAYNE_COACHING = {
  qaScore: 82,
  scriptAdherence: 88,
  callTiming: 74,
  followUpRate: 91,
  flags: [
    { type: "warning", text: "Chamadas terminando antes de explorar objeções — média 4 min" },
    { type: "warning", text: "Taxa de identificação de DM baixa nas últimas 3 sessões" },
  ],
  wins: [
    "Melhor taxa de 2ª ligação da equipe — 43%",
    "3 bills coletadas esta semana sem chase manual",
    "Script nova abertura seguido em 91% das chamadas",
  ],
  weeklyGoal: { calls: 120, dms: 45, bills: 20 },
};

const THAINA_COACHING = {
  qaScore: 76,
  scriptAdherence: 79,
  callTiming: 68,
  followUpRate: 83,
  flags: [
    { type: "warning", text: "Taxa de script abaixo de 80% — revisar abertura padrão" },
    { type: "warning", text: "Callbacks perdidos esta semana: 6" },
  ],
  wins: [
    "Bill de Saúde do cliente 009 conseguida em 1ª tentativa",
    "Callback convertido em proposta — Clínica São Lucas",
  ],
  weeklyGoal: { calls: 100, dms: 40, bills: 18 },
};

function MetricBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#374151" }}>
          <span style={{ color }}>{icon}</span>
          {label}
        </div>
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color, sub, pct }: {
  icon: React.ReactNode; value: number; label: string; color: string; sub?: string; pct?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {pct !== undefined && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
            {pct > 0 ? "+" : ""}{pct}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: "#16163f" }}>{value}</div>
      <div className="text-xs" style={{ color: "#9CA3AF" }}>{label}</div>
      {sub && <div className="text-[11px] mt-1 font-medium" style={{ color }}>{sub}</div>}
    </motion.div>
  );
}

function GoalBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <div className="text-xs font-medium w-28 shrink-0" style={{ color: "#374151" }}>{label}</div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="text-xs font-bold shrink-0" style={{ color: "#16163f" }}>{current}<span className="font-normal" style={{ color: "#9CA3AF" }}>/{goal}</span></div>
    </div>
  );
}

export default function Performance() {
  const { viewAs, isRep } = useViewAs();

  const repName = viewAs === "Elayne" ? "Elayne Nunes" : viewAs === "Thaina" ? "Thaina Domet" : "—";
  const stats = mockRepStats[viewAs === "Elayne" ? "Elayne Nunes" : viewAs === "Thaina" ? "Thaina Domet" : "Elayne Nunes"];
  const coaching = viewAs === "Thaina" ? THAINA_COACHING : ELAYNE_COACHING;

  if (!isRep) {
    const elayne = mockRepStats["Elayne Nunes"];
    const thaina  = mockRepStats["Thaina Domet"];
    const teamCalls = elayne.calls + thaina.calls;
    const teamDMs   = elayne.dmsReached + thaina.dmsReached;
    const teamBills = elayne.billsRequested + thaina.billsRequested;
    const teamRcvd  = elayne.billsReceived + thaina.billsReceived;
    const teamQA    = Math.round((82 + 76) / 2);
    const teamGoal  = { calls: 220, dms: 85, bills: 38 };
    const callPct = Math.min(Math.round((teamCalls / teamGoal.calls) * 100), 100);
    return (
      <SalesOSLayout>
        <div className="h-full overflow-y-auto" style={{ background: "#F8F9FC" }}>
          <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Meu Desempenho</h1>
                <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Renan · Equipe · {today}</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}>
                <Award size={14} /> QA Médio: {teamQA}/100
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6 max-w-4xl">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Equipe — Esta Semana</div>
              <div className="grid grid-cols-4 gap-3">
                <StatCard icon={<Phone size={16} />} value={teamCalls} label="Chamadas (equipe)" color="#9e3ffd" pct={12} />
                <StatCard icon={<Users size={16} />} value={teamDMs}   label="DMs alcançados" color="#16a34a" pct={7} />
                <StatCard icon={<FileText size={16} />} value={teamBills} label="Contas solicitadas" color="#d97706" />
                <StatCard icon={<FileCheck size={16} />} value={teamRcvd} label="Contas recebidas" color="#2563eb"
                  sub={`${teamBills > 0 ? Math.round((teamRcvd / teamBills) * 100) : 0}% taxa`} />
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 mb-4">
                <Target size={15} style={{ color: "#9e3ffd" }} />
                <span className="text-sm font-semibold" style={{ color: "#16163f" }}>Meta Semanal da Equipe</span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: callPct >= 80 ? "#dcfce7" : callPct >= 60 ? "#fffbeb" : "#fef2f2", color: callPct >= 80 ? "#16a34a" : callPct >= 60 ? "#d97706" : "#dc2626" }}>
                  {callPct}% atingido
                </span>
              </div>
              <div className="space-y-4">
                <GoalBar label="Chamadas" current={teamCalls} goal={teamGoal.calls} color="#9e3ffd" />
                <GoalBar label="DMs Alcançados" current={teamDMs} goal={teamGoal.dms} color="#16a34a" />
                <GoalBar label="Contas Coletadas" current={teamRcvd} goal={teamGoal.bills} color="#2563eb" />
              </div>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[
                { name: "Elayne Nunes", s: elayne, coaching: ELAYNE_COACHING, color: "#9e3ffd" },
                { name: "Thaina Domet", s: thaina, coaching: THAINA_COACHING, color: "#2563eb" },
              ].map(rep => (
                <div key={rep.name} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: `${rep.color}20`, color: rep.color }}>
                      {rep.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: "#16163f" }}>{rep.name}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>QA: {rep.coaching.qaScore}/100</div>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Lig.", value: rep.s.calls, c: rep.color },
                        { label: "DMs",  value: rep.s.dmsReached, c: "#16a34a" },
                        { label: "Contas", value: rep.s.billsRequested, c: "#d97706" },
                        { label: "Rcvd", value: rep.s.billsReceived, c: "#2563eb" },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl p-2 text-center" style={{ background: "#F8F9FC" }}>
                          <div className="text-base font-bold" style={{ color: stat.c }}>{stat.value}</div>
                          <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {rep.coaching.flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs rounded-lg px-2.5 py-2"
                        style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                        <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                        <span style={{ color: "#374151" }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SalesOSLayout>
    );
  }

  const goalPctCalls = Math.round((stats.calls / coaching.weeklyGoal.calls) * 100);

  return (
    <SalesOSLayout>
      <div className="h-full overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Meu Desempenho</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                {repName} · {today}
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
            >
              <Award size={14} />
              QA Score: {coaching.qaScore}/100
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-4xl">

          {/* KPI Cards */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
              Esta Semana
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<Phone size={16} />} value={stats.calls} label="Chamadas realizadas" color="#9e3ffd" pct={12} />
              <StatCard icon={<Users size={16} />} value={stats.dmsReached} label="DMs alcançados" color="#16a34a" pct={7} />
              <StatCard icon={<FileText size={16} />} value={stats.billsRequested} label="Contas solicitadas" color="#d97706" />
              <StatCard icon={<FileCheck size={16} />} value={stats.billsReceived} label="Contas recebidas" color="#2563eb" sub={`${Math.round((stats.billsReceived / stats.billsRequested) * 100)}% taxa`} />
            </div>
          </div>

          {/* Weekly Goal Progress */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target size={15} style={{ color: "#9e3ffd" }} />
              <span className="text-sm font-semibold" style={{ color: "#16163f" }}>Meta Semanal</span>
              <span
                className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: goalPctCalls >= 80 ? "#dcfce7" : goalPctCalls >= 60 ? "#fffbeb" : "#fef2f2",
                  color: goalPctCalls >= 80 ? "#16a34a" : goalPctCalls >= 60 ? "#d97706" : "#dc2626",
                }}
              >
                {goalPctCalls}% atingido
              </span>
            </div>
            <div className="space-y-4">
              <GoalBar label="Chamadas" current={stats.calls} goal={coaching.weeklyGoal.calls} color="#9e3ffd" />
              <GoalBar label="DMs Alcançados" current={stats.dmsReached} goal={coaching.weeklyGoal.dms} color="#16a34a" />
              <GoalBar label="Contas Coletadas" current={stats.billsReceived} goal={coaching.weeklyGoal.bills} color="#2563eb" />
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Discipline Metrics */}
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 mb-4">
                <Star size={15} style={{ color: "#d97706" }} />
                <span className="text-sm font-semibold" style={{ color: "#16163f" }}>Disciplina de Vendas</span>
              </div>
              <div className="space-y-4">
                <MetricBar label="Aderência ao Script" value={coaching.scriptAdherence} color="#9e3ffd" icon={<Mic size={12} />} />
                <MetricBar label="Timing de Chamada" value={coaching.callTiming} color="#d97706" icon={<Clock size={12} />} />
                <MetricBar label="Taxa de Follow-up" value={coaching.followUpRate} color="#16a34a" icon={<RotateCcw size={12} />} />
              </div>
            </div>

            {/* Wins & Flags */}
            <div className="space-y-3">
              {/* Coaching Flags */}
              {coaching.flags.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} style={{ color: "#d97706" }} />
                    <span className="text-xs font-semibold" style={{ color: "#d97706" }}>Pontos de Atenção</span>
                  </div>
                  <div className="space-y-2">
                    {coaching.flags.map((f, i) => (
                      <div key={i} className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                        • {f.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wins */}
              <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} style={{ color: "#16a34a" }} />
                  <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>Destaques Positivos</span>
                </div>
                <div className="space-y-2">
                  {coaching.wins.map((w, i) => (
                    <div key={i} className="text-xs leading-relaxed" style={{ color: "#166534" }}>
                      • {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Callbacks Pending */}
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fee2e2" }}>
              <Clock size={16} style={{ color: "#dc2626" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#991b1b" }}>
                {stats.callbacksPending} {stats.callbacksPending === 1 ? "callback pendente" : "callbacks pendentes"}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#dc2626" }}>
                Priorize antes das 11h para não perder janela de contato
              </div>
            </div>
            <div
              className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#FFFFFF", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              Ver na Fila →
            </div>
          </div>

        </div>
      </div>
    </SalesOSLayout>
  );
}
