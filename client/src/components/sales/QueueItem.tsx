import { motion } from "framer-motion";
import { Phone, MessageCircle, Mail, PauseCircle, MoreHorizontal, Clock, AlertTriangle, User } from "lucide-react";
import { priorityConfig, type Lead } from "@/data/mockLeads";
import { AgentRecommendationCard } from "./AgentRecommendationCard";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

const priorityBadge = (priority: string) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    P1: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    P2: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    P3: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    P4: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    P5: { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
    P6: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
    P7: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
    P8: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  };
  return map[priority] ?? { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
};

const priorityBorderColor: Record<string, string> = {
  P1: "#dc2626",
  P2: "#ea580c",
  P3: "#d97706",
  P4: "#2563eb",
  P5: "#3b82f6",
  P6: "#64748b",
  P7: "#7c3aed",
  P8: "#991b1b",
};

const sourceStyle = {
  Julia: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  Manual: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  Parceiro: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

interface Props {
  lead: Lead;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export function QueueItem({ lead, index, selected, onClick }: Props) {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();

  function openDialer() {
    toast({ title: "Abrindo discador..." });
  }

  const pConf = priorityConfig[lead.priority];
  const pb = priorityBadge(lead.priority);
  const borderColor = priorityBorderColor[lead.priority] ?? "#E8EAED";
  const src = sourceStyle[lead.source] ?? sourceStyle.Manual;
  const attemptPct = Math.min((lead.attempt_count / 20) * 100, 100);
  const attemptColor = lead.attempt_count >= 18 ? "#dc2626" : lead.attempt_count >= 14 ? "#d97706" : "#9e3ffd";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ translateY: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
      onClick={onClick}
      className="rounded-xl cursor-pointer transition-all overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: selected ? `1px solid #9e3ffd` : "1px solid #E8EAED",
        borderLeft: `4px solid ${selected ? "#9e3ffd" : borderColor}`,
        boxShadow: selected ? "0 0 0 3px rgba(158,63,253,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* P1 pulse animation on the border */}
      {lead.priority === "P1" && (
        <style>{`@keyframes p1-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      )}

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: "#16163f" }}>{lead.company}</div>
            <div className="text-xs truncate" style={{ color: "#9CA3AF" }}>{lead.city}, {lead.state}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}
            >
              {lead.priority}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: src.bg, color: src.color, border: `1px solid ${src.border}` }}
            >
              {lead.source}
            </span>
          </div>
        </div>

        {/* Priority label */}
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: pb.color }}>
          {pConf.label}
        </div>

        {/* DM */}
        <div className="flex items-center gap-1.5 mb-3">
          <User size={12} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <div className="text-sm min-w-0">
            {lead.dm_name
              ? <span style={{ color: "#374151" }}><strong style={{ color: "#16163f" }}>{lead.dm_name}</strong> · {lead.dm_role}</span>
              : <em style={{ color: "#9CA3AF", fontSize: 13 }}>{t("salesos.queueitem.dm_unknown")}</em>
            }
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {lead.next_action_overdue ? (
            <span
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              <Clock size={10} /> Atrasado {lead.next_action_overdue_days}d
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
            >
              <Clock size={10} /> {lead.next_action_date}
            </span>
          )}
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            {lead.last_outcome}
          </span>
          <span
            className="ml-auto text-[10px]"
            style={{ color: "#9CA3AF" }}
          >
            {lead.assigned_to.split(" ")[0]}
          </span>
        </div>

        {/* Attempt progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
              Tentativas
            </span>
            <span className="text-[10px] font-bold" style={{ color: attemptColor }}>
              {lead.attempt_count}/20
              {lead.attempt_count >= 15 && <AlertTriangle size={9} className="inline ml-1" />}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${attemptPct}%` }}
              transition={{ delay: index * 0.04 + 0.3, duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: attemptColor }}
            />
          </div>
        </div>

        {/* Agent Recommendation */}
        <div className="mb-3">
          <AgentRecommendationCard
            recommendation={lead.agent_recommendation}
            compact
            onPrimary={() => navigate(`/sales-os/leads/${lead.id}`)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
          <button
            onClick={openDialer}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "#9e3ffd", color: "#fff" }}
          >
            <Phone size={11} /> {t("salesos.common.call")}
          </button>
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
          >
            <MessageCircle size={11} /> WA
          </button>
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            <Mail size={11} /> Email
          </button>
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            <PauseCircle size={11} /> {t("salesos.common.postpone")}
          </button>
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs ml-auto transition-all"
            style={{ background: "#F8F9FC", color: "#9CA3AF", border: "1px solid #E8EAED" }}
          >
            <MoreHorizontal size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
