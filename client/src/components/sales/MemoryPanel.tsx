import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronDown, ChevronUp, Phone, Mail, MessageSquare,
  FileText, Zap, Bot, AlertCircle, RotateCcw,
} from "lucide-react";
import type { Lead } from "@/data/mockLeads";

function Section({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: "#E8EAED" }}>
      <button
        className="flex items-center justify-between w-full py-2.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "#9e3ffd" }}>{icon}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{title}</span>
        </div>
        {open
          ? <ChevronUp size={12} style={{ color: "#9CA3AF" }} />
          : <ChevronDown size={12} style={{ color: "#9CA3AF" }} />}
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

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  call: { icon: <Phone size={10} />, color: "#9e3ffd" },
  email: { icon: <Mail size={10} />, color: "#2563eb" },
  whatsapp: { icon: <MessageSquare size={10} />, color: "#16a34a" },
  note: { icon: <FileText size={10} />, color: "#6B7280" },
};

interface Props { lead: Lead }

export function MemoryPanel({ lead }: Props) {
  const juliaEntry = lead.activity_timeline.find(e => e.rep === "Julia" || e.outcome.toLowerCase().includes("criado"));
  const allEntries = [...lead.activity_timeline].reverse();
  const messageEntries = lead.messages_sent;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: "#E8EAED" }}>
        <Brain size={15} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Memória do Lead</span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
        >
          {lead.activity_timeline.length} entradas
        </span>
      </div>

      <div className="px-4">
        {/* Julia summary */}
        <Section title="Resumo de Qualificação — Julia" icon={<Zap size={12} />} defaultOpen>
          <div className="rounded-xl p-3" style={{ background: "rgba(158,63,253,0.05)", border: "1px solid rgba(158,63,253,0.15)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(158,63,253,0.1)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.25)" }}>
                Julia
              </span>
              {juliaEntry && (
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{juliaEntry.timestamp}</span>
              )}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
              {lead.rep_call_brief}
            </div>
            {juliaEntry?.note && (
              <div className="mt-1.5 text-[11px]" style={{ color: "#9CA3AF" }}>
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
                      style={{ background: `${tc.color}15`, color: tc.color }}
                    >
                      {tc.icon}
                    </div>
                    {i < allEntries.length - 1 && (
                      <div className="w-px flex-1 my-0.5" style={{ background: "#E8EAED", minHeight: 10 }} />
                    )}
                  </div>
                  <div className="pb-2.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium" style={{ color: "#374151" }}>{entry.outcome}</span>
                      <span className="text-[10px] shrink-0" style={{ color: "#9CA3AF" }}>{entry.timestamp}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{entry.rep}</div>
                    {entry.note && (
                      <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "#6B7280" }}>{entry.note}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Messages */}
        {messageEntries.length > 0 && (
          <Section title="Mensagens Enviadas" icon={<MessageSquare size={12} />}>
            <div className="space-y-2">
              {messageEntries.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl p-2.5 text-xs"
                  style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd" }}>
                      Estilo: {m.style}
                    </span>
                    <span style={{ color: "#9CA3AF" }}>{m.sent_at}</span>
                  </div>
                  <div style={{ color: "#6B7280" }}>CTA: {m.cta}</div>
                  <div className="mt-0.5" style={{ color: "#9CA3AF" }}>Contexto: {m.context_used}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Agent SOP history */}
        <Section title="Histórico de Agentes" icon={<Bot size={12} />}>
          <div className="space-y-1.5">
            {lead.sop_agent_statuses.map((sop, i) => {
              const statusColorMap: Record<string, string> = {
                "Concluído": "#16a34a",
                "Executando": "#d97706",
                "Pendente": "#9CA3AF",
                "Erro": "#dc2626",
              };
              const statusColor = statusColorMap[sop.status] ?? "#9CA3AF";
              const statusBgMap: Record<string, string> = {
                "Concluído": "#dcfce7",
                "Executando": "#fffbeb",
                "Pendente": "#F8F9FC",
                "Erro": "#fef2f2",
              };
              const statusBorderMap: Record<string, string> = {
                "Concluído": "#bbf7d0",
                "Executando": "#fde68a",
                "Pendente": "#E8EAED",
                "Erro": "#fecaca",
              };
              return (
                <div key={i} className="rounded-xl px-2.5 py-2 text-xs" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ color: "#374151" }}>{sop.sop}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: statusBgMap[sop.status] ?? "#F8F9FC", color: statusColor, border: `1px solid ${statusBorderMap[sop.status] ?? "#E8EAED"}` }}
                    >
                      {sop.status}
                    </span>
                  </div>
                  {sop.output_summary && <div style={{ color: "#6B7280" }}>{sop.output_summary}</div>}
                  {sop.last_run && <div style={{ color: "#9CA3AF" }}>Última execução: {sop.last_run}</div>}
                </div>
              );
            })}
            {lead.sop_agent_statuses.length === 0 && (
              <div className="text-xs" style={{ color: "#9CA3AF" }}>Nenhum agente executado ainda.</div>
            )}
          </div>
        </Section>

        {/* Overrides */}
        <Section title="Substituições pelo Representante" icon={<RotateCcw size={12} />}>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>
            Nenhuma substituição registrada neste ciclo.
          </div>
        </Section>
      </div>
    </div>
  );
}
