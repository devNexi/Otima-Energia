import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { SalesOSLayout, useViewAs } from "@/components/sales/SalesOSLayout";
import { MessageComposer } from "@/components/sales/MessageComposer";
import { AgentRecommendationCard } from "@/components/sales/AgentRecommendationCard";
import { LeadIntelligenceCard } from "@/components/sales/LeadIntelligenceCard";
import { DMEnrichmentPanel } from "@/components/sales/DMEnrichmentPanel";
import { MemoryPanel } from "@/components/sales/MemoryPanel";
import { SOPAgentPanel } from "@/components/sales/SOPAgentPanel";
import { SequenceTriggerPanel } from "@/components/sales/SequenceTriggerPanel";
import { getLeadById, priorityConfig } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import {
  Phone, MessageCircle, Mail, RotateCcw, Search, ArrowUpCircle,
  Calendar, XCircle, Save, Copy, AlertTriangle, CheckCircle,
  Clock, FileText, ChevronLeft, User, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/data/mockLeads";

type MsgTab = "whatsapp" | "email" | "cobranca" | "interrupcao";
type BottomTab = "sequencias" | "dm" | "sop" | "memoria" | "historico";

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

const fastAccessConfig = {
  fast_access: { label: "Acesso Rápido", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  slow_burn: { label: "Queima Lenta", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  strategic: { label: "Estratégico", color: "#9e3ffd", bg: "rgba(158,63,253,0.08)", border: "rgba(158,63,253,0.2)" },
};

const sourceStyle: Record<string, { bg: string; color: string; border: string }> = {
  Julia: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  Manual: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  Parceiro: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

const dmStatusConfig: Record<string, { color: string; bg: string; border: string }> = {
  "Identificado": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Alcançado": { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  "Não identificado": { color: "#9CA3AF", bg: "#F8F9FC", border: "#E8EAED" },
};

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={11} />,
  email: <Mail size={11} />,
  whatsapp: <MessageCircle size={11} />,
  note: <FileText size={11} />,
};
const typeIconColor: Record<string, string> = {
  call: "#9e3ffd", email: "#2563eb", whatsapp: "#16a34a", note: "#6B7280",
};

function CopyableField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button onClick={doCopy} className="flex items-center gap-2 group text-left">
      {label && <span className="text-xs" style={{ color: "#9CA3AF" }}>{label}</span>}
      <span className="font-mono text-sm font-medium" style={{ color: "#9e3ffd" }}>{value}</span>
      <span className="transition-opacity opacity-0 group-hover:opacity-100 ml-1">
        {copied ? <CheckCircle size={12} style={{ color: "#16a34a" }} /> : <Copy size={12} style={{ color: "#D1D5DB" }} />}
      </span>
    </button>
  );
}

const OBJECTIONS = [
  { key: "sem_tempo", label: "Sem tempo" },
  { key: "solar", label: "Já tem solar" },
  { key: "mercado_livre", label: "Mercado livre" },
  { key: "email", label: "Manda por email" },
  { key: "chefe", label: "Chefe não está" },
  { key: "scam", label: "Parece golpe" },
  { key: "sem_interesse", label: "Sem interesse" },
];

const simpleObjectionResponses: Record<string, string> = {
  sem_tempo: "Entendo — eu também não perderia seu tempo à toa. São exatamente 90 segundos. Se eu não agregar nada nesse tempo, nunca mais ligo. Posso?",
  mercado_livre: "O Mercado Livre é uma opção — mas para o seu perfil de consumo, GD tem uma entrada mais simples e sem riscos de exposição ao preço spot. Vale comparar os dois?",
  email: "Claro — mas por email leva dias para o seu caso chegar à análise certa. São 3 minutos agora e você já sai com o número de economia estimada. O que você prefere?",
  chefe: "Sem problema. Para quando o gerente volta? Assim eu ligo direto com ele no horário certo.",
  scam: "Completamente legítimo — entendo a desconfiança. Posso mandar nosso site e CNPJ agora mesmo. Mas só para você ter um ponto de referência: você já ouviu falar da Ótima Energia?",
  sem_interesse: "Respeito isso. Mas me permite uma pergunta antes: você já sabe quanto a empresa paga por mês de energia? Porque quem diz que não tem interesse normalmente ainda não viu o número.",
};

const SOLAR_STEP1 = "Ótimo — a placa cobre 100% do consumo ou ainda recebem fatura de energia?";
const SOLAR_BRANCHES = [
  { label: "Ramo A — Se ainda tem fatura", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", text: "Perfeito, é exatamente essa situação com que trabalhamos. O caminho mais simples é a conta — pode me mandar agora pelo WhatsApp?" },
  { label: "Ramo B — 100% coberto, empresa grande", color: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "Entendido. Qual é mais ou menos o gasto mensal de energia? Pode haver um programa separado que vale a pena ver e que a placa solar não substitui.", tag: "ACL — sinalizar ao Renan" },
  { label: "Ramo C — 100% coberto, empresa pequena", color: "#9CA3AF", bg: "#F8F9FC", border: "#E8EAED", text: "Entendido, parece que estão bem servidos. Obrigada pelo tempo.", tag: "DNC genuíno" },
];

function InlineCopyBtn({ text, copyKey, copiedKey, onCopy }: { text: string; copyKey: string; copiedKey: string | null; onCopy: (t: string, k: string) => void }) {
  const done = copiedKey === copyKey;
  return (
    <button
      onClick={() => onCopy(text, copyKey)}
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-all"
      style={{
        background: done ? "#dcfce7" : "#F3F4F6",
        color: done ? "#16a34a" : "#9CA3AF",
        border: `1px solid ${done ? "#bbf7d0" : "#E8EAED"}`,
      }}
    >
      {done ? <CheckCircle size={9} /> : <Copy size={9} />}
      {done ? "Copiado" : "Copiar"}
    </button>
  );
}

function CallAssistGrid({ lead }: { lead: Lead }) {
  const [openObj, setOpenObj] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  const lastNote = lead.activity_timeline?.[0]?.note ?? null;

  return (
    <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E8EAED" }}>
      <div className="px-5 pt-4 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Assistência de Chamada</span>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {/* Row 1 — Objetivo da Chamada */}
        <div className="rounded-lg px-3 py-2" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
          <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#9CA3AF" }}>🎯 OBJETIVO DA CHAMADA</div>
          <div className="text-sm font-semibold" style={{ color: "#16163f" }}>{lead.call_objective}</div>
        </div>

        {/* Row 2 — Por Que Agora */}
        <div className="rounded-lg px-3 py-2" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#d97706" }}>⚡ POR QUE AGORA</div>
          <div className="text-xs leading-snug" style={{ color: "#92400e" }}>{lead.call_why_now_angle}</div>
        </div>

        {/* Row 3 — Diga Isso Primeiro | Aviso de Confiança */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#9CA3AF" }}>🗣 DIGA ISSO PRIMEIRO</div>
            <div className="text-xs leading-snug mb-1.5" style={{ color: "#374151" }}>{lead.suggested_opening_angle}</div>
            <InlineCopyBtn text={lead.suggested_opening_angle} copyKey="opening" copiedKey={copiedKey} onCopy={copy} />
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#d97706" }}>⚠ AVISO DE CONFIANÇA</div>
            <div className="text-xs leading-snug" style={{ color: "#92400e" }}>{lead.call_trust_warning}</div>
          </div>
        </div>

        {/* Row 4 — Primeira Pergunta | Ângulo do Pedido de Conta */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#9CA3AF" }}>❓ PRIMEIRA PERGUNTA</div>
            <div className="text-xs leading-snug mb-1.5" style={{ color: "#374151" }}>{lead.suggested_first_question}</div>
            <InlineCopyBtn text={lead.suggested_first_question} copyKey="q1" copiedKey={copiedKey} onCopy={copy} />
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#9CA3AF" }}>💡 ÂNGULO DO PEDIDO DE CONTA</div>
            <div className="text-xs leading-snug mb-1.5" style={{ color: "#374151" }}>{lead.suggested_bill_ask_angle}</div>
            <InlineCopyBtn text={lead.suggested_bill_ask_angle} copyKey="bill_ask" copiedKey={copiedKey} onCopy={copy} />
          </div>
        </div>

        {/* Row 5 — Objeções Rápidas */}
        <div>
          <div className="text-[9px] uppercase tracking-widest font-bold mb-1.5" style={{ color: "#9CA3AF" }}>🤔 OBJEÇÕES RÁPIDAS</div>
          <div className="flex flex-wrap gap-1.5">
            {OBJECTIONS.map(obj => (
              <button
                key={obj.key}
                onClick={() => setOpenObj(openObj === obj.key ? null : obj.key)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: openObj === obj.key ? "#9e3ffd" : "#F8F9FC",
                  color: openObj === obj.key ? "#fff" : "#6B7280",
                  border: `1px solid ${openObj === obj.key ? "#9e3ffd" : "#E8EAED"}`,
                }}
              >
                {obj.label}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {openObj && (
              <motion.div
                key={openObj}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="rounded-lg p-3" style={{ background: "rgba(158,63,253,0.06)", border: "1px solid rgba(158,63,253,0.15)" }}>
                  {openObj === "solar" ? (
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: "#16163f" }}>{SOLAR_STEP1}</div>
                      <div className="space-y-1.5">
                        {SOLAR_BRANCHES.map(b => (
                          <div key={b.label} className="rounded p-2" style={{ background: b.bg, border: `1px solid ${b.border}` }}>
                            <div className="text-[10px] font-bold mb-0.5" style={{ color: b.color }}>{b.label}{b.tag && <span className="ml-2 opacity-60">{b.tag}</span>}</div>
                            <div className="text-[11px]" style={{ color: "#374151" }}>{b.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs leading-relaxed flex-1" style={{ color: "#374151" }}>{simpleObjectionResponses[openObj]}</div>
                      <InlineCopyBtn text={simpleObjectionResponses[openObj] ?? ""} copyKey={`obj_${openObj}`} copiedKey={copiedKey} onCopy={copy} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 6 — Resumo da Última Interação */}
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors"
          style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}
        >
          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>📋 Resumo da Última Interação</span>
          {showSummary ? <ChevronUp size={12} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={12} style={{ color: "#9CA3AF" }} />}
        </button>
        <AnimatePresence>
          {showSummary && lastNote && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#6B7280" }}>
                {lastNote}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Timeline({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-0">
      {lead.activity_timeline.map((entry, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${typeIconColor[entry.type] ?? "#9CA3AF"}18`, color: typeIconColor[entry.type] ?? "#9CA3AF" }}
            >
              {typeIcons[entry.type]}
            </div>
            {i < lead.activity_timeline.length - 1 && (
              <div className="w-px flex-1 my-1" style={{ background: "#E8EAED", minHeight: 12 }} />
            )}
          </div>
          <div className="pb-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium" style={{ color: "#374151" }}>{entry.outcome}</span>
              <span className="text-[10px] shrink-0" style={{ color: "#9CA3AF" }}>{entry.timestamp}</span>
            </div>
            <div className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>{entry.rep}</div>
            {entry.note && <div className="text-[11px]" style={{ color: "#6B7280" }}>{entry.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}


export default function LeadCard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [msgTab, setMsgTab] = useState<MsgTab>("whatsapp");
  const [bottomTab, setBottomTab] = useState<BottomTab>("sequencias");
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();
  const { viewAs, isRep } = useViewAs();

  function openDialer() {
    toast({ title: "Abrindo discador..." });
  }

  const lead = getLeadById(id ?? "");
  if (!lead) {
    return (
      <SalesOSLayout>
        <div className="flex items-center justify-center h-full" style={{ color: "#9CA3AF" }}>
          {t("salesos.lead.not_found")}
          <button onClick={() => navigate("/sales-os/queue")} className="ml-2 underline" style={{ color: "#9e3ffd" }}>
            {t("salesos.lead.back_queue")}
          </button>
        </div>
      </SalesOSLayout>
    );
  }

  const pb = priorityBadge(lead.priority);
  const faConf = fastAccessConfig[lead.fast_access_vs_slow_burn] ?? fastAccessConfig.strategic;
  const dmConf = dmStatusConfig[lead.dm_status] ?? dmStatusConfig["Não identificado"];
  const src = sourceStyle[lead.source] ?? sourceStyle.Manual;
  const attemptPct = Math.min((lead.attempt_count / 20) * 100, 100);
  const attemptColor = lead.attempt_count >= 18 ? "#dc2626" : lead.attempt_count >= 14 ? "#d97706" : "#9e3ffd";

  const MSG_TABS: { key: MsgTab; label: string }[] = [
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "Email" },
    { key: "cobranca", label: t("salesos.lead.tab_bill") },
    { key: "interrupcao", label: t("salesos.lead.tab_pattern") },
  ];

  const BOTTOM_TABS: { key: BottomTab; label: string }[] = [
    { key: "sequencias", label: "Sequências" },
    { key: "dm", label: "Enriquecimento DM" },
    ...(!isRep ? [{ key: "sop" as BottomTab, label: "Agentes SOP" }] : []),
    { key: "memoria", label: "Memória" },
    { key: "historico", label: "Histórico" },
  ];

  return (
    <SalesOSLayout>
      <>
        {/* ── HEADER — sticky to viewport top ───────────────────────── */}
        <div
          className="px-6 py-3 border-b flex items-center justify-between gap-3"
          style={{ position: "sticky", top: 0, zIndex: 30, borderColor: "#E8EAED", background: "#FFFFFF" }}
        >
          <button
            onClick={() => navigate("/sales-os/queue")}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "#9CA3AF" }}
          >
            <ChevronLeft size={14} /> {t("salesos.lead.back")}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>
              {lead.priority}
            </span>
            <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{lead.company}</span>
            <span style={{ color: "#D1D5DB" }}>·</span>
            <span className="text-sm" style={{ color: "#9CA3AF" }}>{lead.city}/{lead.state}</span>
          </div>
          <button
            onClick={openDialer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff", boxShadow: "0 2px 8px rgba(158,63,253,0.3)" }}
          >
            <Phone size={14} /> {t("salesos.lead.dial_now")}
          </button>
        </div>

        {/* ── TWO-ZONE CONTENT ──────────────────────────────────────── */}
        <div className="flex">

          {/* LEFT SIDEBAR — flows with page, no independent scroll */}
          <div
            className="p-4 space-y-3 shrink-0"
            style={{
              width: 320,
              background: "#FFFFFF",
              borderRight: "1px solid #E8EAED",
            }}
          >
            {/* Company info */}
            <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
              <h1 className="text-base font-bold mb-1" style={{ color: "#16163f" }}>{lead.company}</h1>
              <div className="mb-1.5"><CopyableField value={lead.cnpj} label="CNPJ:" /></div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>{lead.city}, {lead.state}</div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}>
                {lead.industry_segment}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>
                {lead.priority}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: faConf.bg, color: faConf.color, border: `1px solid ${faConf.border}` }}>
                {faConf.label}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: src.bg, color: src.color, border: `1px solid ${src.border}` }}>
                {lead.source}
              </span>
            </div>

            {/* DM card */}
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED", borderLeft: "3px solid #c88ff5" }}>
              <div className="flex items-center gap-1.5">
                <User size={11} style={{ color: "#9CA3AF" }} />
                <div className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#9CA3AF" }}>
                  {t("salesos.common.dm")}
                </div>
              </div>
              {lead.dm_name ? (
                <>
                  <div className="font-bold text-sm" style={{ color: "#16163f" }}>{lead.dm_name}</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}>{lead.dm_role}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full inline-block font-medium" style={{ background: dmConf.bg, color: dmConf.color, border: `1px solid ${dmConf.border}` }}>
                    {lead.dm_status}
                  </span>
                  {!lead.has_direct_dm_route && (
                    <div className="flex items-start gap-1.5 rounded-lg p-2 mt-1" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                      <span className="text-[11px]" style={{ color: "#92400e" }}>
                        {t("salesos.lead.no_direct_route")} {lead.dm_name.split(" ")[0]}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <em className="text-xs" style={{ color: "#9CA3AF" }}>{t("salesos.lead.not_identified")}</em>
              )}
            </div>

            {/* Best contact */}
            {lead.dm_direct_phone_best && (
              <div className="rounded-xl p-3" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                <div className="text-[10px] uppercase tracking-wide mb-1.5 font-medium" style={{ color: "#9CA3AF" }}>
                  {t("salesos.lead.best_contact")}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono" style={{ color: "#16163f" }}>{lead.dm_direct_phone_best}</span>
                  {lead.dm_whatsapp_likely === true && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>✓ WA</span>
                  )}
                  {lead.dm_whatsapp_likely === "unknown" && (
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>? WA</span>
                  )}
                </div>
                {lead.dm_direct_phone_confidence && (
                  <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    {t("salesos.lead.confidence")}: {lead.dm_direct_phone_confidence}%
                  </div>
                )}
              </div>
            )}

            {/* Bill status */}
            <div>
              <div className="text-[10px] uppercase tracking-wide mb-1.5 font-medium" style={{ color: "#9CA3AF" }}>
                {t("salesos.lead.bill_status")}
              </div>
              {lead.bill_status ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                  {lead.bill_status} {lead.bill_status_date && `· ${lead.bill_status_date}`}
                </span>
              ) : (
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{t("salesos.lead.not_received")}</span>
              )}
            </div>

            {/* Attempts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#9CA3AF" }}>
                  {t("salesos.lead.attempts")}
                </div>
                <span className="text-xs font-bold" style={{ color: attemptColor }}>
                  {lead.attempt_count}/20
                  {lead.attempt_count >= 15 && <AlertTriangle size={10} className="inline ml-1" />}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${attemptPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: attemptColor }}
                />
              </div>
            </div>

            {/* Last contact */}
            {lead.last_contact && (
              <div>
                <div className="text-[10px] uppercase tracking-wide mb-1 font-medium" style={{ color: "#9CA3AF" }}>
                  {t("salesos.lead.last_contact")}
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{lead.last_contact}</div>
              </div>
            )}

            {/* Blocker */}
            {lead.blocker && (
              <div className="rounded-xl p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div className="text-[10px] uppercase tracking-wide mb-1 font-medium" style={{ color: "#d97706" }}>
                  {t("salesos.lead.blocker")}
                </div>
                <div className="text-xs" style={{ color: "#92400e" }}>{lead.blocker}</div>
              </div>
            )}

            {/* Score */}
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "rgba(158,63,253,0.06)", border: "1px solid rgba(158,63,253,0.15)" }}>
              <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.common.score")}</span>
              <span className="text-lg font-bold" style={{ color: "#9e3ffd" }}>
                {lead.priority_score}<span className="text-xs font-normal" style={{ color: "#9CA3AF" }}>/100</span>
              </span>
            </div>

            <AgentRecommendationCard
              recommendation={lead.agent_recommendation}
              onPrimary={openDialer}
              onOverride={() => {}}
            />
          </div>

          {/* MAIN AREA — no internal scroll, page scrolls naturally */}
          <div className="flex-1" style={{ background: "#F8F9FC", paddingBottom: 52 }}>

            {/* ── LEAD INTELLIGENCE ────────────────────────────────── */}
            <LeadIntelligenceCard lead={lead} />

            {/* ── CALL ASSIST GRID ─────────────────────────────────── */}
            <CallAssistGrid lead={lead} />

            {/* ── MESSAGE COMPOSER ─────────────────────────────────── */}
            <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E8EAED" }}>
              <div className="flex border-b px-4" style={{ borderColor: "#F3F4F6" }}>
                {MSG_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMsgTab(tab.key)}
                    className="px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
                    style={{
                      color: msgTab === tab.key ? "#9e3ffd" : "#9CA3AF",
                      borderBottom: msgTab === tab.key ? "2px solid #9e3ffd" : "2px solid transparent",
                      background: "transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                <MessageComposer lead={lead} activeTab={msgTab} />
              </div>
            </div>

            {/* ── BOTTOM TABBED PANELS ─────────────────────────────── */}
            <div style={{ background: "#FFFFFF" }}>
              <div className="flex border-b px-4" style={{ borderColor: "#E8EAED" }}>
                {BOTTOM_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setBottomTab(tab.key)}
                    className="px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
                    style={{
                      color: bottomTab === tab.key ? "#9e3ffd" : "#9CA3AF",
                      borderBottom: bottomTab === tab.key ? "2px solid #9e3ffd" : "2px solid transparent",
                      background: "transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {bottomTab === "sequencias" && <SequenceTriggerPanel />}
                {bottomTab === "dm" && <DMEnrichmentPanel lead={lead} />}
                {bottomTab === "sop" && <SOPAgentPanel lead={lead} />}
                {bottomTab === "memoria" && <MemoryPanel lead={lead} />}
                {bottomTab === "historico" && <Timeline lead={lead} />}
              </div>
            </div>

          </div>
        </div>

        {/* ── STICKY ACTION BAR — fixed to viewport bottom ─────────── */}
        <div
          className="px-5 py-3 flex items-center gap-2 flex-wrap border-t"
          style={{
            position: "fixed", bottom: 0, left: 220, right: 0, zIndex: 50,
            background: "#FFFFFF", borderColor: "#E8EAED", boxShadow: "0 -2px 8px rgba(0,0,0,0.07)",
          }}
        >
          <button
            onClick={openDialer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "#9e3ffd", color: "#fff" }}
          >
            <Phone size={12} /> {t("salesos.common.call_now")}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
            <MessageCircle size={12} /> WhatsApp
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
            <Mail size={12} /> Email
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}>
            <RotateCcw size={12} /> {t("salesos.lead.bill_chase")}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}>
            <Search size={12} /> {t("salesos.lead.enrich")}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
            <ArrowUpCircle size={12} /> {t("salesos.lead.escalate_renan")}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}>
            <Calendar size={12} /> {t("salesos.lead.callback")}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
            <XCircle size={12} /> {t("salesos.lead.lost")}
          </button>
          <button
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs ml-auto transition-all"
            style={{
              background: saved ? "#dcfce7" : "#F8F9FC",
              color: saved ? "#16a34a" : "#6B7280",
              border: `1px solid ${saved ? "#bbf7d0" : "#E8EAED"}`,
            }}
          >
            <Save size={12} /> {saved ? t("salesos.lead.saved") : t("salesos.lead.save_zoho")}
          </button>
        </div>

      </>
    </SalesOSLayout>
  );
}
