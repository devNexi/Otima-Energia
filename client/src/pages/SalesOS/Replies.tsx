import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { mockLeads, priorityConfig } from "@/data/mockLeads";
import { MessageSquare, Mail, Clock, AlertTriangle, CheckCircle, Phone, ArrowUpCircle, Eye } from "lucide-react";

const replies = mockLeads.filter(l => l.human_response_required && l.reply_snippet);

const replyTypeConfig = {
  logistics: { label: "Logístico", color: "rgba(148,163,184,0.8)", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)" },
  commercial: { label: "Comercial / Nuançado", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  trust: { label: "Confiança / Ceticismo", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  decision: { label: "Decisão / Objeção", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
};

const suggestedResponses: Record<string, string> = {
  "lead-001": `Carlos, boa notícia! Conseguimos receber contas diretamente da contabilidade — basta me passar o contato deles que eu cuido de tudo sem precisar do seu tempo.

Qual é o melhor contato do seu financeiro?`,
  "lead-004": `Dr. Figueiredo, com certeza! Vou te explicar em 2 minutos e você decide se faz sentido.

Trabalhamos com empresas como clínicas de diagnóstico que estão pagando mais do que precisariam de energia. Nosso processo: você nos envia uma conta de luz, analisamos em 24h e apresentamos o resultado — sem custo e sem compromisso.

Posso ligar amanhã às 8h para detalhar?`,
  "lead-010": `Dra. Luciana, sem problema! Vou entrar em contato diretamente com a contabilidade para facilitar.

Poderia me passar o nome e telefone do responsável? Prometo não tomar mais do que 5 minutos do tempo deles.`,
};

function SlaCountdown({ minutes }: { minutes: number }) {
  const isUrgent = minutes < 30;
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: isUrgent ? "#ef4444" : "#f59e0b" }}>
      <Clock size={12} />
      {isUrgent ? `⚠ Resposta necessária em ${minutes} min` : `Resposta necessária em ${minutes} min`}
    </div>
  );
}

export default function Replies() {
  const [, navigate] = useLocation();
  const [responded, setResponded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Record<string, string>>({});
  const hasSlaBreached = replies.some(l => (l.reply_sla_minutes ?? 60) < 30 && !responded.has(l.id));

  function getEditText(lead: typeof replies[0]) {
    return editing[lead.id] ?? suggestedResponses[lead.id] ?? "Resposta sugerida não disponível para este contato.";
  }

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto">
        {/* Header banner */}
        <AnimatePresence>
          {hasSlaBreached && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-6 py-3"
              style={{ background: "rgba(239,68,68,0.15)", borderBottom: "1px solid rgba(239,68,68,0.3)" }}
            >
              <AlertTriangle size={16} style={{ color: "#ef4444" }} />
              <span className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
                Respostas urgentes — SLA próximo do limite. Atenda agora.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 py-5">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1" style={{ color: "#fff" }}>Respostas Humanas Necessárias</h1>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {replies.filter(l => !responded.has(l.id)).length} pendentes · automações pausadas até resposta manual
            </div>
          </div>

          {/* Empty state */}
          {replies.every(l => responded.has(l.id)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-24"
            >
              <CheckCircle size={40} style={{ color: "#22c55e" }} />
              <div className="text-lg font-semibold" style={{ color: "#fff" }}>Nenhuma resposta pendente</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>✓ Automações ativas. Ótimo trabalho!</div>
            </motion.div>
          )}

          {/* Reply cards */}
          <div className="space-y-5 max-w-3xl">
            {replies.map(lead => {
              if (responded.has(lead.id)) return null;
              const rtConf = replyTypeConfig[lead.reply_type ?? "logistics"];
              const pConf = priorityConfig[lead.priority];
              const isCallRecommended = lead.reply_type === "trust" || lead.reply_type === "decision";
              const sla = lead.reply_sla_minutes ?? 60;

              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12, height: 0 }}
                  layout
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${sla < 30 ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.09)"}`, background: "rgba(255,255,255,0.03)" }}
                >
                  {/* Card header */}
                  <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${pConf.color}`}>{lead.priority}</span>
                          <span className="font-bold text-sm" style={{ color: "#fff" }}>{lead.dm_name ?? "Decisor"}</span>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>·</span>
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{lead.company}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Channel */}
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                            {lead.reply_channel === "WhatsApp" ? <MessageSquare size={10} /> : <Mail size={10} />}
                            {lead.reply_channel}
                          </span>
                          {/* Type */}
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: rtConf.bg, color: rtConf.color, border: `1px solid ${rtConf.border}` }}>
                            {rtConf.label}
                          </span>
                          {/* Automação pausada */}
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                            Automação pausada
                          </span>
                        </div>
                      </div>
                      <SlaCountdown minutes={sla} />
                    </div>
                  </div>

                  {/* Reply snippet */}
                  <div className="px-5 py-4">
                    <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Mensagem recebida:</div>
                    <div className="text-sm rounded-xl px-4 py-3 mb-4 italic" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }}>
                      "{lead.reply_snippet}"
                    </div>

                    {/* Recommended action */}
                    <div className="flex items-center gap-2 text-xs mb-3">
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>Recomendação:</span>
                      <span className="font-semibold" style={{ color: isCallRecommended ? "#ef4444" : "#22c55e" }}>
                        {isCallRecommended ? "📞 Ligar" : "💬 Responder por mensagem"}
                      </span>
                    </div>

                    {/* Suggested response */}
                    <div className="mb-4">
                      <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Resposta sugerida (editável):</div>
                      <textarea
                        value={getEditText(lead)}
                        onChange={e => setEditing(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        rows={4}
                        className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "inherit", lineHeight: 1.6 }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/sales-os/leads/${lead.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <Eye size={12} /> Ver Lead
                      </button>
                      <button
                        onClick={() => navigate("/sales-os/dialer")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: "#9e3ffd", color: "#fff" }}
                      >
                        <Phone size={12} /> Ligar Agora
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                        <MessageSquare size={12} /> WhatsApp
                      </button>
                      <button
                        onClick={() => setResponded(prev => new Set([...prev, lead.id]))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ml-auto"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
                      >
                        <CheckCircle size={12} /> Marcar Respondido
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <ArrowUpCircle size={12} /> Escalar
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
