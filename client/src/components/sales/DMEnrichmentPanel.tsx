import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, MessageCircle, CheckCircle, AlertCircle, Loader2, Save, Flag, ArrowUpCircle } from "lucide-react";
import type { Lead } from "@/data/mockLeads";

type EnrichState = "idle" | "loading" | "high" | "medium" | "none" | "escalate";

interface Props {
  lead: Lead;
}

export function DMEnrichmentPanel({ lead }: Props) {
  const [state, setState] = useState<EnrichState>(
    lead.dm_direct_phone_confidence && lead.dm_direct_phone_confidence >= 80 ? "high"
    : lead.dm_direct_phone_confidence && lead.dm_direct_phone_confidence >= 60 ? "medium"
    : lead.dm_direct_phone_best === null && lead.dm_name ? "none"
    : "idle"
  );
  const [saved, setSaved] = useState(false);

  function runEnrichment() {
    setState("loading");
    setTimeout(() => {
      setState(lead.dm_name ? (lead.dm_direct_phone_confidence && lead.dm_direct_phone_confidence >= 80 ? "high" : "medium") : "none");
    }, 2200);
  }

  const confColor = state === "high" ? "#22c55e" : state === "medium" ? "#f59e0b" : "#ef4444";

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Search size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#fff" }}>Enriquecimento de Decisor</span>
      </div>

      {/* DM Name display */}
      {lead.dm_name && (
        <div className="mb-3 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Alvo: <strong style={{ color: "#c88ff5" }}>{lead.dm_name}</strong> · {lead.dm_role}
        </div>
      )}

      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
              Nenhuma busca realizada. Clique para localizar o contato direto do decisor.
            </p>
            <button onClick={runEnrichment} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
              Enriquecer Decisor
            </button>
          </motion.div>
        )}

        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3 py-6">
            <Loader2 size={20} className="animate-spin" style={{ color: "#9e3ffd" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Buscando rota para {lead.dm_name || "decisor"}...</span>
          </motion.div>
        )}

        {(state === "high" || state === "medium") && (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Confidence bar */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Confiança na rota</span>
              <span className="text-sm font-bold" style={{ color: confColor }}>
                {lead.dm_direct_phone_confidence}%
              </span>
            </div>
            <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lead.dm_direct_phone_confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: confColor }}
              />
            </div>

            {/* Best route */}
            <div className="rounded-lg p-3 mb-3" style={{ background: `${confColor}12`, border: `1px solid ${confColor}30` }}>
              <div className="flex items-center gap-2 mb-1">
                {state === "high" ? <CheckCircle size={14} style={{ color: confColor }} /> : <AlertCircle size={14} style={{ color: confColor }} />}
                <span className="text-xs font-semibold" style={{ color: confColor }}>
                  {state === "high" ? "Rota de alta confiança encontrada" : "Rota provável encontrada"}
                </span>
              </div>
              <div className="text-base font-bold mb-1" style={{ color: "#fff" }}>
                {lead.dm_direct_phone_best || "+55 11 9XXXX-XXXX"}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                  {lead.dm_direct_phone_type === "direct_mobile" ? "Celular Direto"
                   : lead.dm_direct_phone_type === "likely_mobile" ? "Provável Celular"
                   : lead.dm_direct_phone_type === "office_direct" ? "Ramal Direto"
                   : "Via Assistente"}
                </span>
                {lead.dm_whatsapp_likely === true && (
                  <span className="flex items-center gap-1" style={{ color: "#25D366" }}>
                    <MessageCircle size={11} /> WhatsApp provável
                  </span>
                )}
                {lead.dm_whatsapp_likely === false && (
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>WhatsApp improvável</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button className="py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
                <Phone size={11} className="inline mr-1" /> Usar Este Número
              </button>
              <button className="py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}>
                <MessageCircle size={11} className="inline mr-1" /> Copiar WhatsApp
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className="py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", color: saved ? "#22c55e" : "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Save size={11} className="inline mr-1" /> {saved ? "Salvo!" : "Salvar no Zoho"}
              </button>
              <button
                onClick={() => setState("loading")}
                className="py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Busca Mais Profunda
              </button>
            </div>
          </motion.div>
        )}

        {state === "none" && (
          <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                Nenhuma rota confiável encontrada para <strong style={{ color: "#c88ff5" }}>{lead.dm_name}</strong>. Escalação recomendada.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runEnrichment}
                className="py-2 rounded-lg text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Marcar Não Confiável
              </button>
              <button
                onClick={() => setState("escalate")}
                className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <ArrowUpCircle size={12} /> Escalar para Renan
              </button>
            </div>
          </motion.div>
        )}

        {state === "escalate" && (
          <motion.div key="escalate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <CheckCircle size={24} className="mx-auto mb-2" style={{ color: "#22c55e" }} />
            <div className="text-sm font-semibold mb-1" style={{ color: "#fff" }}>Escalado para Renan</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Renan será notificado para aprovação manual ou nova abordagem.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
