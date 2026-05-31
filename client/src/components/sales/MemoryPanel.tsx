import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronDown, ChevronUp, Phone, Mail, MessageSquare,
  FileText, Zap, Bot, AlertCircle, RotateCcw,
} from "lucide-react";
import type { Lead } from "@/data/mockLeads";

/* ── Collapsible section ────────────────────────────────────────── */

function Section({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
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
        {open
          ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
          : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Type config ────────────────────────────────────────────────── */

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  call: { icon: <Phone size={10} />, color: "#9e3ffd" },
  email: { icon: <Mail size={10} />, color: "#3b82f6" },
  whatsapp: { icon: <MessageSquare size={10} />, color: "#25D366" },
  note: { icon: <FileText size={10} />, color: "rgba(255,255,255,0.4)" },
};

/* ── Main component ─────────────────────────────────────────────── */

interface Props { lead: Lead }

export function MemoryPanel({ lead }: Props) {
  // Julia's qualification note (first "note" type entry from Julia)
  const juliaEntry = lead.activity_timeline.find(e => e.rep === "Julia" || e.outcome.toLowerCase().includes("criado"));

  // Chronological entries (newest first = index 0 is newest in mock)
  const allEntries = [...lead.activity_timeline].reverse(); // oldest first for timeline

  // Messages sent with style/CTA
  const messageEntries = lead.messages_sent;

  return (
    <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Brain size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#fff" }}>Memória do Lead</span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(158,63,253,0.15)", color: "#c88ff5" }}
        >
          {lead.activity_timeline.length} entradas
        </span>
      </div>

      <div className="px-4">
        {/* Julia summary — always first, always open */}
        <Section title="Resumo de Qualificação — Julia" icon={<Zap size={12} />} defaultOpen>
          <div className="rounded-lg p-2.5" style={{ background: "rgba(158,63,253,0.07)", border: "1px solid rgba(158,63,253,0.15)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(158,63,253,0.25)", color: "#c88ff5", border: "1px solid rgba(158,63,253,0.4)" }}>
                Julia
              </span>
              {juliaEntry && (
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{juliaEntry.timestamp}</span>
              )}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              {lead.rep_call_brief}
            </div>
            {juliaEntry?.note && (
              <div className="mt-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {juliaEntry.note}
              </div>
            )}
          </div>
        </Section>

        {/* Chronological activity */}
        <Section title="Histórico de Interações" icon={<Phone size={12} />} defaultOpen>
          <div className="space-y-0">
            {allEntries.map((entry, i) => {
              const tc = typeConfig[entry.type] ?? typeConfig.note;
              return (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${tc.color}18`, color: tc.color }}
                    >
                      {tc.icon}
                    </div>
                    {i < allEntries.length - 1 && (
                      <div className="w-px flex-1 my-0.5" style={{ background: "rgba(255,255,255,0.06)", minHeight: 10 }} />
                    )}
                  </div>
                  <div className="pb-2.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{entry.outcome}</span>
                      <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{entry.timestamp}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.rep}</div>
                    {entry.note && (
                      <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>{entry.note}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Messages with style/CTA */}
        {messageEntries.length > 0 && (
          <Section title="Mensagens Enviadas" icon={<MessageSquare size={12} />}>
            <div className="space-y-2">
              {messageEntries.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg p-2.5 text-xs"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "rgba(158,63,253,0.15)", color: "#c88ff5" }}
                    >
                      Estilo: {m.style}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>{m.sent_at}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)" }}>CTA: {m.cta}</div>
                  <div className="mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Contexto: {m.context_used}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Agent SOP history */}
        <Section title="Histórico de Agentes" icon={<Bot size={12} />}>
          <div className="space-y-1.5">
            {lead.sop_agent_statuses.map((sop, i) => {
              const statusColor = { Concluído: "#22c55e", Executando: "#f59e0b", Pendente: "rgba(255,255,255,0.35)", Erro: "#ef4444" }[sop.status];
              return (
                <div key={i} className="rounded-lg px-2.5 py-2 text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ color: "rgba(255,255,255,0.65)" }}>{sop.sop}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                      {sop.status}
                    </span>
                  </div>
                  {sop.output_summary && (
                    <div style={{ color: "rgba(255,255,255,0.4)" }}>{sop.output_summary}</div>
                  )}
                  {sop.last_run && (
                    <div style={{ color: "rgba(255,255,255,0.3)" }}>Última execução: {sop.last_run}</div>
                  )}
                </div>
              );
            })}
            {lead.sop_agent_statuses.length === 0 && (
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Nenhum agente executado ainda.</div>
            )}
          </div>
        </Section>

        {/* Overrides by rep */}
        <Section title="Substituições pelo Representante" icon={<RotateCcw size={12} />}>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Nenhuma substituição registrada neste ciclo.
          </div>
        </Section>
      </div>
    </div>
  );
}
