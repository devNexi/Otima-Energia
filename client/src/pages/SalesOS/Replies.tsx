import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { useToast } from "@/hooks/use-toast";
import { mockLeads, priorityConfig } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import { MessageSquare, Mail, Clock, AlertTriangle, CheckCircle, Phone, ArrowUpCircle, Eye, Copy } from "lucide-react";

const replies = mockLeads.filter(l => l.human_response_required && l.reply_snippet);

const replyTypeConfig = {
  logistics: { label: "Logístico", color: "rgba(148,163,184,0.8)", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)" },
  commercial: { label: "Comercial / Nuançado", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  trust: { label: "Confiança / Ceticismo", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  decision: { label: "Decisão / Objeção", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
};

const suggestedResponses: Record<string, string> = {
  "lead-001": `Carlos, boa notícia! Conseguimos receber contas diretamente da contabilidade — basta me passar o contato deles que cuido de tudo sem precisar do seu tempo.

Qual é o melhor contato do seu financeiro ou contador?`,

  "lead-004": `Dr. Figueiredo, com certeza! Explico em 2 minutos e você decide se faz sentido.

Trabalhamos com clínicas de diagnóstico que estão pagando mais do que precisariam de energia. Nosso processo: você nos envia uma conta de luz, analisamos em 24h e apresentamos o resultado — sem custo e sem compromisso.

Posso ligar amanhã cedo para detalhar?`,

  "lead-010": `Dra. Luciana, sem problema! Posso entrar em contato diretamente com a contabilidade para facilitar.

Poderia me passar o nome e telefone do responsável? Prometo não tomar mais de 5 minutos do tempo deles — e já consigo montar a análise antes da sua aprovação.`,
};

/* ── Per-card SLA countdown ─────────────────────────────────────── */
interface SlaCardProps {
  lead: (typeof replies)[number];
  onMarkResponded: (id: string) => void;
  respondedAt?: string;
}

function ReplyCard({ lead, onMarkResponded, respondedAt }: SlaCardProps) {
  const [, navigate] = useLocation();
  const [slaSeconds, setSlaSeconds] = useState((lead.reply_sla_minutes ?? 60) * 60);
  const [editText, setEditText] = useState(suggestedResponses[lead.id] ?? "Resposta sugerida não disponível para este contato.");
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function openDialer() {
    toast({ title: "Abrindo discador..." });
  }

  useEffect(() => {
    if (respondedAt) return; // don't tick if resolved
    timerRef.current = setInterval(() => {
      setSlaSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [respondedAt]);

  const slaBreached = slaSeconds === 0;
  const isUrgent = slaSeconds < 30 * 60 && slaSeconds > 0;
  const mins = Math.floor(slaSeconds / 60);
  const secs = slaSeconds % 60;

  const rtConf = replyTypeConfig[lead.reply_type ?? "logistics"];
  const pConf = priorityConfig[lead.priority];
  const isCallRecommended = lead.reply_type === "trust" || lead.reply_type === "decision";

  if (respondedAt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.04)" }}
      >
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle size={16} style={{ color: "#22c55e" }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: "#fff" }}>
                {lead.dm_name ?? "Decisor"} · {lead.company}
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Respondido às {respondedAt}
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
            Resolvido
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: slaBreached
          ? "1px solid rgba(239,68,68,0.5)"
          : isUrgent
          ? "1px solid rgba(239,68,68,0.35)"
          : "1px solid rgba(255,255,255,0.09)",
        background: "rgba(255,255,255,0.03)",
        boxShadow: slaBreached ? "0 0 0 1px rgba(239,68,68,0.2)" : "none",
        animation: slaBreached ? "pulse-border 1.5s infinite" : "none",
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${pConf.color}`}>{lead.priority}</span>
              <span className="font-bold text-sm" style={{ color: "#fff" }}>{lead.dm_name ?? "Decisor"}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>·</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{lead.company}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}
              >
                {lead.reply_channel === "WhatsApp" ? <MessageSquare size={10} /> : <Mail size={10} />}
                {lead.reply_channel}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: rtConf.bg, color: rtConf.color, border: `1px solid ${rtConf.border}` }}
              >
                {rtConf.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                Automação pausada
              </span>
            </div>
          </div>

          {/* Live SLA countdown */}
          <div className="shrink-0">
            {slaBreached ? (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <AlertTriangle size={11} /> SLA VIOLADO
              </motion.div>
            ) : (
              <div
                className="flex items-center gap-1.5 text-xs font-mono font-semibold"
                style={{ color: isUrgent ? "#ef4444" : "#f59e0b" }}
              >
                <Clock size={12} />
                {isUrgent ? `Urgente — ` : `SLA — `}
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{t("salesos.replies.received_msg")}</div>
        <div
          className="text-sm rounded-xl px-4 py-3 mb-4 italic"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }}
        >
          "{lead.reply_snippet}"
        </div>

        <div className="flex items-center gap-2 text-xs mb-3">
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Recomendação:</span>
          <span className="font-semibold" style={{ color: isCallRecommended ? "#ef4444" : "#22c55e" }}>
            {isCallRecommended ? "📞 Ligar imediatamente" : "💬 Responder por mensagem"}
          </span>
        </div>

        <div className="mb-4">
          <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{t("salesos.replies.suggested")}</div>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/sales-os/leads/${lead.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Eye size={12} /> {t("salesos.replies.view_lead")}
          </button>
          <button
            onClick={openDialer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "#9e3ffd", color: "#fff" }}
          >
            <Phone size={12} /> Ligar Agora
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}
          >
            <MessageSquare size={12} /> WhatsApp
          </button>
          <button
            onClick={() => {
              const now = new Date();
              onMarkResponded(lead.id);
              toast({ title: "Resposta registrada" });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ml-auto"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <CheckCircle size={12} /> Marcar como Respondido
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <ArrowUpCircle size={12} /> Escalar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */

export default function Replies() {
  const [respondedMap, setRespondedMap] = useState<Record<string, string>>({});
  const { t } = useI18n();

  function markResponded(id: string) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setRespondedMap(prev => ({ ...prev, [id]: time }));
  }

  const pending = replies.filter(l => !respondedMap[l.id]);
  const resolved = replies.filter(l => !!respondedMap[l.id]);

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto">
        <div className="px-6 py-5">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1" style={{ color: "#fff" }}>{t("salesos.replies.title")}</h1>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {pending.length} {t("salesos.replies.subtitle")}
            </div>
          </div>

          {pending.length === 0 && resolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-16"
            >
              <CheckCircle size={40} style={{ color: "#22c55e" }} />
              <div className="text-lg font-semibold" style={{ color: "#fff" }}>{t("salesos.replies.empty")}</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{t("salesos.replies.empty_sub")}</div>
            </motion.div>
          )}

          {/* Pending cards */}
          <div className="space-y-5 max-w-3xl mb-8">
            <AnimatePresence>
              {pending.map(lead => (
                <ReplyCard
                  key={lead.id}
                  lead={lead}
                  onMarkResponded={markResponded}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Resolved section */}
          {resolved.length > 0 && (
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                ✓ Respondidos — {resolved.length}
              </div>
              <div className="space-y-2">
                {resolved.map(lead => (
                  <ReplyCard
                    key={lead.id}
                    lead={lead}
                    onMarkResponded={markResponded}
                    respondedAt={respondedMap[lead.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SalesOSLayout>
  );
}
