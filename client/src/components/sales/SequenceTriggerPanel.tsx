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
    color: "#ef4444",
  },
  {
    id: "follow_up",
    name: "Follow-Up Comercial",
    description: "Sequência de follow-up em 5 toques ao longo de 10 dias.",
    steps: ["WhatsApp de valor (imediato)", "Email com caso de uso (D+3)", "Ligação de check-in (D+7)", "WhatsApp de urgência (D+10)", "Ligação final (D+12)"],
    urgency: "medium",
    color: "#f59e0b",
  },
  {
    id: "dm_enrichment",
    name: "Enriquecer Decisor",
    description: "Aciona busca automática de contato direto e WhatsApp do DM.",
    steps: ["Busca em bases abertas (imediato)", "Validação cruzada (1h)", "Resultado disponível no painel"],
    urgency: "low",
    color: "#9e3ffd",
  },
  {
    id: "escalate_renan",
    name: "Escalar para Renan",
    description: "Notifica Renan para revisão estratégica ou aprovação de descarte.",
    steps: ["Notificação push para Renan (imediato)", "Lead aparece no Gerente Console", "Renan recebe resumo do histórico"],
    urgency: "high",
    color: "#f59e0b",
  },
  {
    id: "proposal_chase",
    name: "Chase de Proposta",
    description: "Sequência específica para propostas enviadas sem resposta.",
    steps: ["Email de valor adicional (imediato)", "Ligação de urgência de prazo (48h)", "WhatsApp final (72h)"],
    urgency: "high",
    color: "#ef4444",
  },
];

const urgencyStyle: Record<string, { border: string; badge: string }> = {
  high: { border: "rgba(239,68,68,0.3)", badge: "bg-red-500/20 text-red-400 border border-red-500/30" },
  medium: { border: "rgba(245,158,11,0.3)", badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  low: { border: "rgba(158,63,253,0.3)", badge: "bg-purple-500/20 text-purple-400 border border-purple-500/30" },
};

export function SequenceTriggerPanel() {
  const [triggered, setTriggered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function trigger(id: string) {
    setTriggered(id);
    setTimeout(() => setTriggered(null), 3000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#fff" }}>Acionar Sequência</span>
      </div>

      {SEQUENCES.map(seq => {
        const style = urgencyStyle[seq.urgency];
        const isTriggered = triggered === seq.id;
        const isExpanded = expanded === seq.id;

        return (
          <div
            key={seq.id}
            className="rounded-xl p-3 transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isExpanded ? style.border : "rgba(255,255,255,0.08)"}` }}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setExpanded(isExpanded ? null : seq.id)}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: seq.color }}
                />
                <span className="text-sm font-medium truncate" style={{ color: "#fff" }}>{seq.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                  {seq.urgency === "high" ? "Urgente" : seq.urgency === "medium" ? "Normal" : "Automático"}
                </span>
                <ChevronRight
                  size={13}
                  className="ml-auto shrink-0 transition-transform"
                  style={{ color: "rgba(255,255,255,0.3)", transform: isExpanded ? "rotate(90deg)" : "none" }}
                />
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{seq.description}</p>
                  <div className="space-y-1.5 mb-3">
                    {seq.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "rgba(158,63,253,0.2)", color: "#c88ff5" }}>{i + 1}</div>
                        {step}
                      </div>
                    ))}
                  </div>

                  {isTriggered ? (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg justify-center"
                      style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
                    >
                      <CheckCircle size={14} style={{ color: "#22c55e" }} />
                      <span className="text-sm font-medium" style={{ color: "#22c55e" }}>Sequência acionada!</span>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => trigger(seq.id)}
                      className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: seq.color + "22", color: seq.color, border: `1px solid ${seq.color}44` }}
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

      <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          Sequências acionadas pausam automaticamente ao receber resposta humana. Nenhuma mensagem é enviada sem revisão no protótipo.
        </p>
      </div>
    </div>
  );
}
