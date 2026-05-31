import { motion } from "framer-motion";
import { Zap, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import type { AgentRecommendation } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";

const confidenceColors = {
  Alta: { border: "#22c55e", badge: "bg-green-500/20 text-green-400 border border-green-500/30" },
  Média: { border: "#f59e0b", badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  Baixa: { border: "#ef4444", badge: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

interface Props {
  recommendation: AgentRecommendation;
  compact?: boolean;
  onPrimary?: () => void;
  onOverride?: () => void;
}

export function AgentRecommendationCard({ recommendation, compact = false, onPrimary, onOverride }: Props) {
  const conf = confidenceColors[recommendation.confidence];
  const { t } = useI18n();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}>
        <Zap size={12} style={{ color: "#9e3ffd", flexShrink: 0 }} />
        <span style={{ color: "rgba(255,255,255,0.7)" }}>
          {t("salesos.agent.recommendation")}: <strong style={{ color: "#c88ff5" }}>{recommendation.action}</strong>
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ml-auto ${conf.badge}`}>
          {recommendation.confidence}
        </span>
        {onPrimary && (
          <button
            onClick={onPrimary}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold shrink-0"
            style={{ background: "#9e3ffd", color: "#fff" }}
          >
            {t("salesos.agent.execute")} <ChevronRight size={10} />
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{ border: `1.5px solid ${conf.border}`, background: `${conf.border}0d` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: conf.border, flexShrink: 0 }} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: conf.border }}>
              {t("salesos.agent.full_title")}
            </div>
            <div className="font-bold" style={{ color: "#fff", fontSize: 15 }}>{recommendation.action}</div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold shrink-0 ${conf.badge}`}>
          {recommendation.confidence}
        </span>
      </div>

      <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
        {t("salesos.agent.style")} <span style={{ color: "rgba(255,255,255,0.7)" }}>{recommendation.style}</span>
      </div>

      <div className="space-y-1.5 mb-4">
        {recommendation.preconditions.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {p.met
              ? <CheckCircle size={13} className="shrink-0" style={{ color: "#22c55e" }} />
              : <XCircle size={13} className="shrink-0" style={{ color: "#ef4444" }} />}
            <span style={{ color: p.met ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)" }}>{p.label}</span>
          </div>
        ))}
      </div>

      <div className="text-xs rounded-lg p-3 mb-4" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", marginRight: 4 }}>{t("salesos.agent.next_step")}</span>
        {recommendation.next_step}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPrimary}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#9e3ffd", color: "#fff" }}
        >
          {recommendation.action}
        </button>
        <button
          onClick={onOverride}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {t("salesos.agent.override")}
        </button>
      </div>
    </motion.div>
  );
}
