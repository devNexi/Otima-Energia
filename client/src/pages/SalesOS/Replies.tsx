import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { useToast } from "@/hooks/use-toast";
import { mockLeads, priorityConfig } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import {
  MessageSquare, Mail, Clock, AlertTriangle, CheckCircle,
  Phone, ArrowUpCircle, Eye, Copy,
} from "lucide-react";

const replies = mockLeads.filter(l => l.human_response_required && l.reply_snippet);

const replyTypeConfig = {
  logistics: { label: "Logístico", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", left: "#94a3b8" },
  commercial: { label: "Comercial / Nuançado", color: "#d97706", bg: "#fffbeb", border: "#fde68a", left: "#f59e0b" },
  trust: { label: "Confiança / Ceticismo", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", left: "#ef4444" },
  decision: { label: "Decisão / Objeção", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", left: "#ef4444" },
};

const priorityBadge = (priority: string) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    P1: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    P2: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    P3: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    P4: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    P5: { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
    P6: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
    P7: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
    P8: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  };
  return map[priority] ?? { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
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
    if (respondedAt) return;
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
  const pb = priorityBadge(lead.priority);
  const isCallRecommended = lead.reply_type === "trust" || lead.reply_type === "decision";

  if (respondedAt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8EAED",
          borderLeft: "4px solid #16a34a",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle size={15} style={{ color: "#16a34a" }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: "#16163f" }}>
                {lead.dm_name ?? "Decisor"} · {lead.company}
              </div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>
                Respondido às {respondedAt}
              </div>
            </div>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
          >
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
      whileHover={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
      className="rounded-xl overflow-hidden transition-shadow"
      style={{
        background: "#FFFFFF",
        border: slaBreached ? "1px solid #fca5a5" : "1px solid #E8EAED",
        borderLeft: `4px solid ${slaBreached ? "#ef4444" : rtConf.left}`,
        boxShadow: slaBreached ? "0 0 0 3px rgba(239,68,68,0.08)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#E8EAED" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}
              >
                {lead.priority}
              </span>
              <span className="font-bold text-sm" style={{ color: "#16163f" }}>{lead.dm_name ?? "Decisor"}</span>
              <span style={{ color: "#D1D5DB" }}>·</span>
              <span className="text-sm" style={{ color: "#6B7280" }}>{lead.company}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
              >
                {lead.reply_channel === "WhatsApp" ? <MessageSquare size={10} /> : <Mail size={10} />}
                {lead.reply_channel}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: rtConf.bg, color: rtConf.color, border: `1px solid ${rtConf.border}` }}
              >
                {rtConf.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
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
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
              >
                <AlertTriangle size={11} /> SLA VIOLADO
              </motion.div>
            ) : (
              <div
                className="flex items-center gap-1.5 text-sm font-mono font-bold px-2.5 py-1.5 rounded-lg"
                style={{
                  background: isUrgent ? "#fef2f2" : "#fffbeb",
                  color: isUrgent ? "#dc2626" : "#d97706",
                  border: `1px solid ${isUrgent ? "#fecaca" : "#fde68a"}`,
                }}
              >
                <Clock size={12} />
                SLA — {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="text-xs font-medium mb-1.5" style={{ color: "#9CA3AF" }}>{t("salesos.replies.received_msg")}</div>
        <div
          className="text-sm rounded-xl px-4 py-3 mb-4 italic"
          style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
        >
          "{lead.reply_snippet}"
        </div>

        <div className="flex items-center gap-2 text-xs mb-4">
          <span style={{ color: "#9CA3AF" }}>Recomendação:</span>
          <span
            className="font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: isCallRecommended ? "#fef2f2" : "#dcfce7",
              color: isCallRecommended ? "#dc2626" : "#16a34a",
              border: `1px solid ${isCallRecommended ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {isCallRecommended ? "📞 Ligar imediatamente" : "💬 Responder por mensagem"}
          </span>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium mb-1.5" style={{ color: "#9CA3AF" }}>{t("salesos.replies.suggested")}</div>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
            style={{
              background: "#F8F9FC",
              border: "1px solid #E8EAED",
              color: "#374151",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
            onFocus={e => (e.target.style.borderColor = "#9e3ffd")}
            onBlur={e => (e.target.style.borderColor = "#E8EAED")}
          />
          <div className="text-[10px] text-right mt-1" style={{ color: "#D1D5DB" }}>{editText.length} caracteres</div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/sales-os/leads/${lead.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            <Eye size={12} /> {t("salesos.replies.view_lead")}
          </button>
          <button
            onClick={openDialer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "#9e3ffd", color: "#fff", boxShadow: "0 2px 6px rgba(158,63,253,0.25)" }}
          >
            <Phone size={12} /> Ligar Agora
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
          >
            <MessageSquare size={12} /> WhatsApp
          </button>
          <button
            onClick={() => { onMarkResponded(lead.id); toast({ title: "Resposta registrada" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ml-auto"
            style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
          >
            <CheckCircle size={12} /> Marcar como Respondido
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
          >
            <ArrowUpCircle size={12} /> Escalar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
  const slaViolated = 0;

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>{t("salesos.replies.title")}</h1>
              <div className="text-sm" style={{ color: "#9CA3AF" }}>
                {pending.length} {t("salesos.replies.subtitle")} · automações pausadas até resposta manual
              </div>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Respostas Pendentes", value: pending.length, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
              { label: "SLA Violados", value: slaViolated, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { label: "Respondidas Hoje", value: resolved.length, color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
            ].map(chip => (
              <div
                key={chip.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: chip.bg, color: chip.color, border: `1px solid ${chip.border}` }}
                >
                  {chip.value}
                </div>
                <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {pending.length === 0 && resolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-16"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                <CheckCircle size={28} style={{ color: "#16a34a" }} />
              </div>
              <div className="text-lg font-semibold" style={{ color: "#16163f" }}>{t("salesos.replies.empty")}</div>
              <div className="text-sm" style={{ color: "#9CA3AF" }}>{t("salesos.replies.empty_sub")}</div>
            </motion.div>
          )}

          {/* Pending cards */}
          <div className="space-y-4 max-w-3xl mb-8">
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
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: "#9CA3AF" }}
              >
                <CheckCircle size={12} style={{ color: "#16a34a" }} />
                Respondidos — {resolved.length}
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
