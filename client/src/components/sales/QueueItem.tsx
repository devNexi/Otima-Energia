import { motion } from "framer-motion";
import { Phone, MessageCircle, Mail, PauseCircle, MoreHorizontal, Clock, AlertTriangle } from "lucide-react";
import { priorityConfig, type Lead } from "@/data/mockLeads";
import { AgentRecommendationCard } from "./AgentRecommendationCard";
import { useLocation } from "wouter";

const sourceColors = {
  Julia: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  Manual: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  Parceiro: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
};

const fastAccessColors = {
  fast_access: "bg-green-500/20 text-green-300 border border-green-500/30",
  slow_burn: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  strategic: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

const fastAccessLabels = {
  fast_access: "Acesso Rápido",
  slow_burn: "Queima Lenta",
  strategic: "Estratégico",
};

interface Props {
  lead: Lead;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export function QueueItem({ lead, index, selected, onClick }: Props) {
  const [, navigate] = useLocation();
  const pConf = priorityConfig[lead.priority];
  const attemptWarning = lead.attempt_count >= 15;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        background: selected ? "rgba(158,63,253,0.12)" : "rgba(255,255,255,0.04)",
        border: selected ? "1px solid rgba(158,63,253,0.4)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Priority badge */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 text-white ${pConf.color}`}>
            {lead.priority}
          </span>
          <div className="min-w-0">
            <div className="font-bold truncate" style={{ color: "#fff", fontSize: 14 }}>{lead.company}</div>
            <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.city}/{lead.state}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceColors[lead.source]}`}>{lead.source}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${fastAccessColors[lead.fast_access_vs_slow_burn]}`}>
            {fastAccessLabels[lead.fast_access_vs_slow_burn]}
          </span>
        </div>
      </div>

      {/* Priority label */}
      <div className="mb-2">
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${pConf.textColor}`}>
          {pConf.label}
        </span>
      </div>

      {/* DM row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-sm" style={{ color: lead.dm_name ? "rgba(255,255,255,0.75)" : undefined }}>
          {lead.dm_name
            ? <span><strong>{lead.dm_name}</strong> · {lead.dm_role}</span>
            : <em style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Decisor não identificado</em>
          }
        </div>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        {/* Next action timing */}
        {lead.next_action_overdue ? (
          <span className="flex items-center gap-1" style={{ color: "#ef4444" }}>
            <Clock size={11} />
            ⏰ Atrasado {lead.next_action_overdue_days}d
          </span>
        ) : (
          <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
            <Clock size={11} />
            📅 {lead.next_action_date}
          </span>
        )}

        {/* Last outcome */}
        <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
          {lead.last_outcome}
        </span>

        {/* Attempt count */}
        <span className={`flex items-center gap-1 ${attemptWarning ? "text-amber-400" : ""}`} style={!attemptWarning ? { color: "rgba(255,255,255,0.4)" } : {}}>
          {attemptWarning && <AlertTriangle size={11} />}
          {lead.attempt_count} tentativas
        </span>
      </div>

      {/* Agent recommendation */}
      <div className="mb-3">
        <AgentRecommendationCard
          recommendation={lead.agent_recommendation}
          compact
          onPrimary={() => navigate(`/sales-os/leads/${lead.id}`)}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => navigate(`/sales-os/dialer`)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
          style={{ background: "#9e3ffd", color: "#fff" }}
        >
          <Phone size={12} /> Ligar
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}>
          <MessageCircle size={12} /> WhatsApp
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Mail size={12} /> Email
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <PauseCircle size={12} /> Adiar
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ml-auto" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
          <MoreHorizontal size={12} />
        </button>
      </div>
    </motion.div>
  );
}
