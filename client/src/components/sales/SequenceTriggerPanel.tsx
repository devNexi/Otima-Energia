import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle, ChevronRight, AlertTriangle } from "lucide-react";

const SEQUENCES = [
  {
    id: "bill_chase",
    name: "Bill Chase",
    description: "Sequência de cobrança de conta em 3 toques (24h, 48h, 72h). WhatsApp + Email + Ligação.",
    steps: ["WhatsApp amigável (imediato)", "Email com link de upload (24h)", "Ligação direta (48h)"],
    urgency: "high",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    badge: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    label: "Urgente",
  },
  {
    id: "follow_up",
    name: "Follow-Up Comercial",
    description: "Sequência de follow-up em 5 toques ao longo de 10 dias.",
    steps: ["WhatsApp de valor (imediato)", "Email com caso de uso (D+3)", "Ligação de check-in (D+7)", "WhatsApp de urgência (D+10)", "Ligação final (D+12)"],
    urgency: "medium",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    badge: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    label: "Normal",
  },
  {
    id: "dm_enrichment",
    name: "Enriquecer Decisor",
    description: "Aciona busca automática de contato direto e WhatsApp do DM.",
    steps: ["Busca em bases abertas (imediato)", "Validação cruzada (1h)", "Resultado disponível no painel"],
    urgency: "low",
    color: "#9e3ffd",
    bg: "rgba(158,63,253,0.06)",
    border: "rgba(158,63,253,0.2)",
    badge: { bg: "rgba(158,63,253,0.06)", color: "#9e3ffd", border: "rgba(158,63,253,0.2)" },
    label: "Automático",
  },
  {
    id: "escalate_renan",
    name: "Escalar para Renan",
    description: "Notifica Renan para revisão estratégica ou aprovação de descarte.",
    steps: ["Notificação push para Renan (imediato)", "Lead aparece no Gerente Console", "Renan recebe resumo do histórico"],
    urgency: "high",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    badge: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    label: "Urgente",
  },
  {
    id: "proposal_chase",
    name: "Chase de Proposta",
    description: "Sequência específica para propostas enviadas sem resposta.",
    steps: ["Email de valor adicional (imediato)", "Ligação de urgência de prazo (48h)", "WhatsApp final (72h)"],
    urgency: "high",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    badge: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    label: "Urgente",
  },
];

export function SequenceTriggerPanel() {
  const [triggered, setTriggered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function trigger(id: string) {
    setTriggered(id);
    setTimeout(() => setTriggered(null), 3000);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={14} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Acionar Sequência</span>
      </div>

      {SEQUENCES.map(seq => {
        const isTriggered = triggered === seq.id;
        const isExpanded = expanded === seq.id;

        return (
          <div
            key={seq.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${isExpanded ? seq.border : "#E8EAED"}`,
              boxShadow: isExpanded ? `0 0 0 3px ${seq.color}10` : "none",
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <button
                onClick={() => setExpanded(isExpanded ? null : seq.id)}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seq.color }} />
                <span className="text-sm font-medium truncate" style={{ color: "#16163f" }}>{seq.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                  style={{ background: seq.badge.bg, color: seq.badge.color, border: `1px solid ${seq.badge.border}` }}
                >
                  {seq.label}
                </span>
                <ChevronRight
                  size={13}
                  className="ml-auto shrink-0 transition-transform"
                  style={{ color: "#9CA3AF", transform: isExpanded ? "rotate(90deg)" : "none" }}
                />
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pb-3 border-t"
                  style={{ borderColor: "#E8EAED" }}
                >
                  <p className="text-xs my-2.5" style={{ color: "#6B7280" }}>{seq.description}</p>
                  <div className="space-y-1.5 mb-3">
                    {seq.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#374151" }}>
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: "rgba(158,63,253,0.1)", color: "#9e3ffd" }}
                        >
                          {i + 1}
                        </div>
                        {step}
                      </div>
                    ))}
                  </div>

                  {isTriggered ? (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 py-2 px-3 rounded-xl justify-center"
                      style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}
                    >
                      <CheckCircle size={14} style={{ color: "#16a34a" }} />
                      <span className="text-sm font-semibold" style={{ color: "#16a34a" }}>Sequência acionada!</span>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => trigger(seq.id)}
                      className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: seq.bg, color: seq.color, border: `1px solid ${seq.border}` }}
                    >
                      <Zap size={13} /> Acionar {seq.name}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
        <p className="text-[11px]" style={{ color: "#92400e" }}>
          Sequências acionadas pausam automaticamente ao receber resposta humana. Nenhuma mensagem é enviada sem revisão no protótipo.
        </p>
      </div>
    </div>
  );
}
