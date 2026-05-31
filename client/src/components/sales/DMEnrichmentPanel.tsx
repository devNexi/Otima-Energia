import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Phone, MessageCircle, CheckCircle, AlertCircle,
  Loader2, Save, Flag, ArrowUpCircle, Copy,
} from "lucide-react";
import type { Lead } from "@/data/mockLeads";

type EnrichState = "access_problem" | "loading" | "found" | "not_found" | "idle";

const ENRICHMENT_FINDS_RESULT = new Set(["lead-002", "lead-011"]);

const SIMULATED_NUMBERS: Record<string, { phone: string; confidence: number; type: string }> = {
  "lead-002": { phone: "+55 19 99234-8876", confidence: 74, type: "Provável Celular" },
  "lead-011": { phone: "+55 21 99701-4432", confidence: 81, type: "Celular Direto" },
};

function getInitialState(lead: Lead): EnrichState {
  if (lead.dm_direct_phone_best) return "found";
  if (lead.dm_name && !lead.dm_direct_phone_best) return "access_problem";
  return "idle";
}

interface Props { lead: Lead }

export function DMEnrichmentPanel({ lead }: Props) {
  const [state, setState] = useState<EnrichState>(getInitialState(lead));
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulatedResult, setSimulatedResult] = useState<typeof SIMULATED_NUMBERS[string] | null>(null);

  function findRoute() {
    setState("loading");
    setTimeout(() => {
      if (ENRICHMENT_FINDS_RESULT.has(lead.id) || lead.dm_direct_phone_best) {
        setSimulatedResult(SIMULATED_NUMBERS[lead.id] ?? null);
        setState("found");
      } else {
        setState("not_found");
      }
    }, 2000);
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const phone = lead.dm_direct_phone_best ?? simulatedResult?.phone;
  const confidence = lead.dm_direct_phone_confidence ?? simulatedResult?.confidence;
  const phoneType = lead.dm_direct_phone_type
    ? ({
        direct_mobile: "Celular Direto",
        likely_mobile: "Provável Celular",
        office_direct: "Ramal Direto",
        assistant_route: "Rota via Assistente",
      }[lead.dm_direct_phone_type] ?? "Desconhecido")
    : simulatedResult?.type ?? "Desconhecido";

  const confColor =
    (confidence ?? 0) >= 80 ? "#22c55e"
    : (confidence ?? 0) >= 60 ? "#f59e0b"
    : "#ef4444";

  const routeChipStyle =
    lead.dm_direct_phone_type === "direct_mobile" || simulatedResult?.type === "Celular Direto"
      ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }
      : lead.dm_direct_phone_type === "likely_mobile" || simulatedResult?.type === "Provável Celular"
      ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }
      : { background: "rgba(148,163,184,0.12)", color: "rgba(148,163,184,0.8)", border: "1px solid rgba(148,163,184,0.2)" };

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Search size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#fff" }}>Enriquecimento de Decisor</span>
      </div>

      {lead.dm_name && (
        <div className="mb-3 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Alvo: <strong style={{ color: "#c88ff5" }}>{lead.dm_name}</strong> · {lead.dm_role}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STATE A — DM known, no phone */}
        {state === "access_problem" && (
          <motion.div key="access_problem" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              className="flex items-start gap-2 rounded-lg p-3 mb-4"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
              <div className="text-xs leading-relaxed" style={{ color: "#fcd34d" }}>
                ⚠ Problema de acesso: <strong>{lead.dm_name}</strong> identificado sem rota direta.
                Nenhum número confirmado disponível.
              </div>
            </div>
            <button
              onClick={findRoute}
              className="w-full py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#9e3ffd", color: "#fff" }}
            >
              Encontrar Melhor Rota
            </button>
          </motion.div>
        )}

        {/* LOADING */}
        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={22} className="animate-spin" style={{ color: "#9e3ffd" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Buscando rota para {lead.dm_name || "decisor"}...</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Verificando LinkedIn · Registros · Parceiros</span>
          </motion.div>
        )}

        {/* STATE B — Phone found */}
        {state === "found" && phone && (
          <motion.div key="found" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Confidence */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Confiança na rota</span>
              <span className="text-sm font-bold" style={{ color: confColor }}>{confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: confColor }}
              />
            </div>

            {/* Phone display */}
            <div
              className="rounded-xl p-3 mb-3"
              style={{ background: `${confColor}0d`, border: `1px solid ${confColor}30` }}
            >
              <div className="text-xl font-bold font-mono mb-1.5" style={{ color: "#fff" }}>{phone}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={routeChipStyle}>
                  {phoneType}
                </span>
                {lead.dm_whatsapp_likely === true && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#25D366" }}>
                    <MessageCircle size={11} /> WhatsApp provável ✓
                  </span>
                )}
                {lead.dm_whatsapp_likely === false && (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>WhatsApp improvável</span>
                )}
                {lead.dm_whatsapp_likely === "unknown" && (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>? WhatsApp não confirmado</span>
                )}
              </div>
              {/* Alternative route */}
              {!lead.dm_direct_phone_best && simulatedResult && (
                <div className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Rota alternativa: via gatekeeper do escritório
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button className="py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
                <Phone size={11} className="inline mr-1" /> Usar Este Número
              </button>
              <button
                onClick={() => copyText(`https://wa.me/${phone?.replace(/\D/g, "")}`)}
                className="py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}
              >
                <MessageCircle size={11} className="inline mr-1" />
                {copied ? "Copiado!" : "Copiar WhatsApp"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className="py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: saved ? "#22c55e" : "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Save size={11} className="inline mr-1" /> {saved ? "Salvo!" : "Salvar no Zoho"}
              </button>
              <button
                onClick={findRoute}
                className="py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Search size={11} className="inline mr-1" /> Busca Mais Profunda
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <ArrowUpCircle size={11} className="inline mr-1" /> Solicitar Busca Profunda
              </button>
              <button
                className="py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <Flag size={11} className="inline mr-1" /> Marcar Não Confiável
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE C — No reliable route */}
        {state === "not_found" && (
          <motion.div key="not_found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              className="rounded-lg p-3 mb-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Search size={20} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.25)" }} />
              <div className="text-sm font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Nenhuma rota direta confiável encontrada
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                para {lead.dm_name || "o decisor"}
              </div>
            </div>

            {/* Gatekeeper script */}
            <div className="mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Script para Gatekeeper
              </div>
              <div
                className="text-xs rounded-lg px-3 py-2.5 mb-2 italic"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}
              >
                "Entendo. Só preciso confirmar com quem cuida da conta de energia — você sabe quem seria a melhor pessoa?"
              </div>
              <button
                onClick={() => copyText("Entendo. Só preciso confirmar com quem cuida da conta de energia — você sabe quem seria a melhor pessoa?")}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                  color: copied ? "#22c55e" : "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Copy size={10} />{copied ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <button
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <ArrowUpCircle size={12} /> Solicitar Busca Mais Profunda
            </button>
          </motion.div>
        )}

        {/* IDLE */}
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
              Nenhuma busca realizada. Clique para localizar o contato direto do decisor.
            </p>
            <button onClick={findRoute} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
              Enriquecer Decisor
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
