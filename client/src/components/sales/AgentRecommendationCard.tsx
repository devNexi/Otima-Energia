import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle, XCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import type { AgentRecommendation } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";

const confidenceColors = {
  Alta: { border: "#22c55e", badge: "rgba(34,197,94,0.2)", badgeText: "#22c55e", badgeBorder: "rgba(34,197,94,0.3)" },
  Média: { border: "#f59e0b", badge: "rgba(245,158,11,0.2)", badgeText: "#f59e0b", badgeBorder: "rgba(245,158,11,0.3)" },
  Baixa: { border: "#ef4444", badge: "rgba(239,68,68,0.2)", badgeText: "#ef4444", badgeBorder: "rgba(239,68,68,0.3)" },
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
  const [showNext, setShowNext] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideText, setOverrideText] = useState("");
  const [overrideSubmitted, setOverrideSubmitted] = useState(false);

  const allMet = recommendation.preconditions.every(p => p.met);
  const blockedPreconditions = recommendation.preconditions.filter(p => !p.met);

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg"
        style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}
      >
        <Zap size={12} style={{ color: "#9e3ffd", flexShrink: 0 }} />
        <span style={{ color: "rgba(255,255,255,0.7)" }}>
          {t("salesos.agent.recommendation")}: <strong style={{ color: "#c88ff5" }}>{recommendation.action}</strong>
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold ml-auto shrink-0"
          style={{ background: conf.badge, color: conf.badgeText, border: `1px solid ${conf.badgeBorder}` }}
        >
          {recommendation.confidence}
        </span>
        {onPrimary && (
          <button
            onClick={allMet ? onPrimary : undefined}
            disabled={!allMet}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-opacity"
            style={{
              background: allMet ? "#9e3ffd" : "rgba(255,255,255,0.08)",
              color: allMet ? "#fff" : "rgba(255,255,255,0.3)",
              cursor: allMet ? "pointer" : "not-allowed",
            }}
          >
            {t("salesos.agent.execute")}
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        borderLeft: `4px solid ${conf.border}`,
        border: `1px solid ${conf.border}40`,
        borderLeftWidth: 4,
        background: `${conf.border}08`,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: conf.border }}>
          Ação Recomendada pelo Agente
        </div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Zap size={15} style={{ color: conf.border, flexShrink: 0 }} />
            <span className="font-bold text-sm leading-tight" style={{ color: "#fff" }}>
              {recommendation.action}
            </span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
            style={{ background: conf.badge, color: conf.badgeText, border: `1px solid ${conf.badgeBorder}` }}
          >
            {recommendation.confidence}
          </span>
        </div>

        {/* Reason paragraph */}
        {recommendation.reason && (
          <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            {recommendation.reason}
          </div>
        )}
      </div>

      {/* Preconditions */}
      <div className="px-4 pb-3 space-y-1.5">
        {recommendation.preconditions.map((p, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            {p.met
              ? <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
              : <XCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />}
            <span style={{ color: p.met ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)" }}>
              {p.label}
              {!p.met && (
                <span style={{ color: "#ef4444" }}> — resolva antes de iniciar</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* O que acontece a seguir — expandable */}
      {recommendation.what_happens_next && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowNext(v => !v)}
            className="flex items-center gap-1.5 text-xs w-full text-left"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <span>O que acontece a seguir</span>
            {showNext ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <AnimatePresence>
            {showNext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs rounded-lg px-3 py-2.5 mt-1.5 leading-relaxed"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
              >
                {recommendation.what_happens_next}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Buttons */}
      <div className="px-4 pb-4">
        {!showOverride ? (
          <div className="flex gap-2">
            <button
              onClick={allMet ? onPrimary : undefined}
              disabled={!allMet}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: allMet ? "#9e3ffd" : "rgba(255,255,255,0.07)",
                color: allMet ? "#fff" : "rgba(255,255,255,0.3)",
                cursor: allMet ? "pointer" : "not-allowed",
                border: allMet ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
              title={!allMet ? `Pré-condições não atendidas: ${blockedPreconditions.map(p => p.label).join(", ")}` : undefined}
            >
              {allMet ? recommendation.action : "Pré-condições não atendidas"}
            </button>
            <button
              onClick={() => setShowOverride(true)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Substituir com Motivo
            </button>
          </div>
        ) : overrideSubmitted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
          >
            <CheckCircle size={12} /> Substituição registrada — motivo salvo
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Motivo da substituição (obrigatório)</span>
              <button onClick={() => setShowOverride(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
                <X size={12} />
              </button>
            </div>
            <textarea
              value={overrideText}
              onChange={e => setOverrideText(e.target.value)}
              placeholder="Descreva por que está substituindo a recomendação do agente..."
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-xs resize-none outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
            <div className="flex gap-2">
              <button
                disabled={overrideText.trim().length < 10}
                onClick={() => {
                  if (overrideText.trim().length >= 10) {
                    setOverrideSubmitted(true);
                    onOverride?.();
                  }
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: overrideText.trim().length >= 10 ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
                  color: overrideText.trim().length >= 10 ? "#f59e0b" : "rgba(255,255,255,0.25)",
                  border: `1px solid ${overrideText.trim().length >= 10 ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`,
                  cursor: overrideText.trim().length >= 10 ? "pointer" : "not-allowed",
                }}
              >
                Confirmar Substituição
              </button>
              <button
                onClick={() => setShowOverride(false)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Cancelar
              </button>
            </div>
            {overrideText.trim().length > 0 && overrideText.trim().length < 10 && (
              <div className="text-[11px]" style={{ color: "rgba(245,158,11,0.7)" }}>
                Mínimo de 10 caracteres necessário
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
