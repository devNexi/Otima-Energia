import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle, XCircle, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import type { AgentRecommendation } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";

const confidenceColors = {
  Alta: { border: "#16a34a", badge: "#dcfce7", badgeText: "#16a34a", badgeBorder: "#bbf7d0" },
  Média: { border: "#d97706", badge: "#fef3c7", badgeText: "#d97706", badgeBorder: "#fde68a" },
  Baixa: { border: "#dc2626", badge: "#fef2f2", badgeText: "#dc2626", badgeBorder: "#fecaca" },
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
        className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl"
        style={{ background: "rgba(158,63,253,0.06)", border: "1px solid rgba(158,63,253,0.15)" }}
      >
        <Sparkles size={12} style={{ color: "#df0af2", flexShrink: 0 }} />
        <span style={{ color: "#6B7280" }}>
          {t("salesos.agent.recommendation")}: <strong style={{ color: "#16163f" }}>{recommendation.action}</strong>
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
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-all"
            style={{
              background: allMet ? "#9e3ffd" : "#E8EAED",
              color: allMet ? "#fff" : "#9CA3AF",
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
        background: "#FFFFFF",
        border: `1px solid #E8EAED`,
        borderLeft: `4px solid ${conf.border}`,
        boxShadow: `0 1px 4px rgba(0,0,0,0.06), 0 0 0 0 ${conf.border}20`,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={11} style={{ color: "#df0af2" }} />
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: conf.border }}>
            Ação Recomendada pelo Agente
          </div>
        </div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: conf.border, flexShrink: 0 }} />
            <span className="font-bold text-sm leading-tight" style={{ color: "#16163f" }}>
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

        {recommendation.reason && (
          <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
            {recommendation.reason}
          </div>
        )}
      </div>

      {/* Preconditions */}
      <div className="px-4 pb-3 space-y-1.5">
        {recommendation.preconditions.map((p, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            {p.met
              ? <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
              : <XCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#dc2626" }} />}
            <span style={{ color: p.met ? "#374151" : "#9CA3AF" }}>
              {p.label}
              {!p.met && (
                <span style={{ color: "#dc2626" }}> — resolva antes de iniciar</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* O que acontece a seguir */}
      {recommendation.what_happens_next && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowNext(v => !v)}
            className="flex items-center gap-1.5 text-xs w-full text-left transition-colors"
            style={{ color: "#9CA3AF" }}
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
                style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#6B7280" }}
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
                background: allMet ? "#9e3ffd" : "#F3F4F6",
                color: allMet ? "#fff" : "#9CA3AF",
                cursor: allMet ? "pointer" : "not-allowed",
                border: allMet ? "none" : "1px solid #E8EAED",
              }}
              title={!allMet ? `Pré-condições não atendidas: ${blockedPreconditions.map(p => p.label).join(", ")}` : undefined}
            >
              {allMet ? recommendation.action : "Pré-condições não atendidas"}
            </button>
            <button
              onClick={() => setShowOverride(true)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
            >
              Substituir
            </button>
          </div>
        ) : overrideSubmitted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs rounded-lg px-3 py-2.5"
            style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#16a34a" }}
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
              <span style={{ color: "#6B7280" }}>Motivo da substituição (obrigatório)</span>
              <button onClick={() => setShowOverride(false)} style={{ color: "#9CA3AF" }}>
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
                background: "#F8F9FC",
                border: "1px solid #E8EAED",
                color: "#374151",
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
                  background: overrideText.trim().length >= 10 ? "#fef3c7" : "#F3F4F6",
                  color: overrideText.trim().length >= 10 ? "#d97706" : "#9CA3AF",
                  border: `1px solid ${overrideText.trim().length >= 10 ? "#fde68a" : "#E8EAED"}`,
                  cursor: overrideText.trim().length >= 10 ? "pointer" : "not-allowed",
                }}
              >
                Confirmar Substituição
              </button>
              <button
                onClick={() => setShowOverride(false)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
              >
                Cancelar
              </button>
            </div>
            {overrideText.trim().length > 0 && overrideText.trim().length < 10 && (
              <div className="text-[11px]" style={{ color: "#d97706" }}>
                Mínimo de 10 caracteres necessário
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
