import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronUp, Phone, Mail, MessageSquare, FileText, Zap, AlertCircle } from "lucide-react";
import type { Lead } from "@/data/mockLeads";

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <button
        className="flex items-center justify-between w-full py-2.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "#9e3ffd" }}>{icon}</span>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{title}</span>
        </div>
        {open ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={11} />,
  email: <Mail size={11} />,
  whatsapp: <MessageSquare size={11} />,
  note: <FileText size={11} />,
};

interface Props { lead: Lead }

export function MemoryPanel({ lead }: Props) {
  return (
    <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Brain size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#fff" }}>Memória do Lead</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(158,63,253,0.15)", color: "#c88ff5" }}>
          {lead.activity_timeline.length} entradas
        </span>
      </div>

      <div className="px-4">
        {/* Julia summary */}
        <Section title="Resumo Julia" icon={<Zap size={12} />} defaultOpen>
          <div className="text-xs rounded-lg p-2.5" style={{ background: "rgba(158,63,253,0.07)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(158,63,253,0.15)" }}>
            {lead.rep_call_brief}
          </div>
        </Section>

        {/* Call summaries */}
        <Section title="Histórico de Chamadas" icon={<Phone size={12} />}>
          <div className="space-y-2">
            {lead.activity_timeline.filter(a => a.type === "call").map((e, i) => (
              <div key={i} className="text-xs rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "#9e3ffd" }}>{e.outcome}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{e.timestamp}</span>
                </div>
                {e.note && <div style={{ color: "rgba(255,255,255,0.55)" }}>{e.note}</div>}
              </div>
            ))}
            {lead.activity_timeline.filter(a => a.type === "call").length === 0 && (
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Nenhuma chamada registrada.</div>
            )}
          </div>
        </Section>

        {/* Objections captured */}
        <Section title="Objeções Capturadas" icon={<AlertCircle size={12} />}>
          {lead.activity_timeline.some(a => a.outcome.toLowerCase().includes("objeção")) ? (
            <div className="space-y-1.5">
              {lead.activity_timeline.filter(a => a.outcome.toLowerCase().includes("objeção")).map((e, i) => (
                <div key={i} className="text-xs p-2 rounded-lg" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)", color: "rgba(255,255,255,0.65)" }}>
                  <strong style={{ color: "#f59e0b" }}>{e.outcome}</strong> · {e.timestamp}
                  {e.note && <div className="mt-0.5">{e.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Nenhuma objeção registrada.</div>
          )}
        </Section>

        {/* Messages sent */}
        <Section title="Mensagens Enviadas" icon={<MessageSquare size={12} />}>
          {lead.messages_sent.length > 0 ? (
            <div className="space-y-2">
              {lead.messages_sent.map((m, i) => (
                <div key={i} className="text-xs rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: "#c88ff5" }}>{m.style}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>{m.sent_at}</span>
                  </div>
                  <div>CTA: {m.cta}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)" }}>Contexto: {m.context_used}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Nenhuma mensagem enviada.</div>
          )}
        </Section>

        {/* Agent recs */}
        <Section title="Recomendações do Agente" icon={<Zap size={12} />}>
          <div className="text-xs rounded-lg p-2.5" style={{ background: "rgba(158,63,253,0.07)", border: "1px solid rgba(158,63,253,0.15)", color: "rgba(255,255,255,0.65)" }}>
            <div className="font-semibold mb-1" style={{ color: "#c88ff5" }}>{lead.agent_recommendation.action}</div>
            <div>Confiança: {lead.agent_recommendation.confidence}</div>
            <div className="mt-1">{lead.agent_recommendation.next_step}</div>
          </div>
        </Section>

        {/* Full timeline */}
        <Section title="Timeline Completa" icon={<FileText size={12} />}>
          <div className="space-y-2">
            {lead.activity_timeline.map((e, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(158,63,253,0.15)", color: "#9e3ffd" }}>
                    {typeIcons[e.type]}
                  </div>
                  {i < lead.activity_timeline.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.07)" }} />}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{e.outcome}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{e.timestamp}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)" }}>{e.rep}</div>
                  {e.note && <div className="mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{e.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
