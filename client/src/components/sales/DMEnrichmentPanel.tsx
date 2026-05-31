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
    (confidence ?? 0) >= 80 ? "#16a34a"
    : (confidence ?? 0) >= 60 ? "#d97706"
    : "#dc2626";

  const routeChipStyle =
    phoneType === "Celular Direto"
      ? { background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }
      : phoneType === "Provável Celular"
      ? { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }
      : { background: "#F8F9FC", color: "#9CA3AF", border: "1px solid #E8EAED" };

  return (
    <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Search size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Enriquecimento de Decisor</span>
      </div>

      {lead.dm_name && (
        <div className="mb-3 text-xs" style={{ color: "#6B7280" }}>
          Alvo: <strong style={{ color: "#9e3ffd" }}>{lead.dm_name}</strong> · {lead.dm_role}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STATE A — DM known, no phone */}
        {state === "access_problem" && (
          <motion.div key="access_problem" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-start gap-2 rounded-xl p-3 mb-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
              <div className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                ⚠ Problema de acesso: <strong>{lead.dm_name}</strong> identificado sem rota direta.
                Nenhum número confirmado disponível.
              </div>
            </div>
            <button onClick={findRoute} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
              Encontrar Melhor Rota
            </button>
          </motion.div>
        )}

        {/* LOADING */}
        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={22} className="animate-spin" style={{ color: "#9e3ffd" }} />
            <span className="text-sm" style={{ color: "#6B7280" }}>Buscando rota para {lead.dm_name || "decisor"}...</span>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Verificando LinkedIn · Registros · Parceiros</span>
          </motion.div>
        )}

        {/* STATE B — Phone found */}
        {state === "found" && phone && (
          <motion.div key="found" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Confiança na rota</span>
              <span className="text-sm font-bold" style={{ color: confColor }}>{confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: "#E8EAED" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: confColor }}
              />
            </div>

            <div className="rounded-xl p-3 mb-3" style={{ background: `${confColor}10`, border: `1px solid ${confColor}30` }}>
              <div className="text-xl font-bold font-mono mb-1.5" style={{ color: "#16163f" }}>{phone}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={routeChipStyle}>
                  {phoneType}
                </span>
                {lead.dm_whatsapp_likely === true && (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#16a34a" }}>
                    <MessageCircle size={11} /> WhatsApp provável ✓
                  </span>
                )}
                {lead.dm_whatsapp_likely === false && (
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>WhatsApp improvável</span>
                )}
                {lead.dm_whatsapp_likely === "unknown" && (
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>? WhatsApp não confirmado</span>
                )}
              </div>
              {!lead.dm_direct_phone_best && simulatedResult && (
                <div className="mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>
                  Rota alternativa: via gatekeeper do escritório
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button className="py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
                <Phone size={11} className="inline mr-1" /> Usar Este Número
              </button>
              <button
                onClick={() => copyText(`https://wa.me/${phone?.replace(/\D/g, "")}`)}
                className="py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
              >
                <MessageCircle size={11} className="inline mr-1" />
                {copied ? "Copiado!" : "Copiar WhatsApp"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className="py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: saved ? "#dcfce7" : "#F8F9FC",
                  color: saved ? "#16a34a" : "#6B7280",
                  border: `1px solid ${saved ? "#bbf7d0" : "#E8EAED"}`,
                }}
              >
                <Save size={11} className="inline mr-1" /> {saved ? "Salvo!" : "Salvar no Zoho"}
              </button>
              <button
                onClick={findRoute}
                className="py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
              >
                <Search size={11} className="inline mr-1" /> Busca Mais Profunda
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-1.5 rounded-lg text-xs font-medium" style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                <ArrowUpCircle size={11} className="inline mr-1" /> Solicitar Busca Profunda
              </button>
              <button className="py-1.5 rounded-lg text-xs font-medium" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                <Flag size={11} className="inline mr-1" /> Marcar Não Confiável
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE C — Not found */}
        {state === "not_found" && (
          <motion.div key="not_found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-xl p-4 mb-3 text-center" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
              <Search size={20} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <div className="text-sm font-medium mb-0.5" style={{ color: "#374151" }}>
                Nenhuma rota direta confiável encontrada
              </div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>
                para {lead.dm_name || "o decisor"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9CA3AF" }}>
                Script para Gatekeeper
              </div>
              <div className="text-xs rounded-xl px-3 py-2.5 mb-2 italic" style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#6B7280" }}>
                "Entendo. Só preciso confirmar com quem cuida da conta de energia — você sabe quem seria a melhor pessoa?"
              </div>
              <button
                onClick={() => copyText("Entendo. Só preciso confirmar com quem cuida da conta de energia — você sabe quem seria a melhor pessoa?")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: copied ? "#dcfce7" : "#F8F9FC", color: copied ? "#16a34a" : "#6B7280", border: `1px solid ${copied ? "#bbf7d0" : "#E8EAED"}` }}
              >
                <Copy size={10} />{copied ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <button
              className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
            >
              <ArrowUpCircle size={12} /> Solicitar Busca Mais Profunda
            </button>
          </motion.div>
        )}

        {/* IDLE */}
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
              Nenhuma busca realizada. Clique para localizar o contato direto do decisor.
            </p>
            <button onClick={findRoute} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
              Enriquecer Decisor
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
