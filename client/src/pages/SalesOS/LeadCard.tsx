import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { CallAssistPanel } from "@/components/sales/CallAssistPanel";
import { MessageComposer } from "@/components/sales/MessageComposer";
import { AgentRecommendationCard } from "@/components/sales/AgentRecommendationCard";
import { DMEnrichmentPanel } from "@/components/sales/DMEnrichmentPanel";
import { MemoryPanel } from "@/components/sales/MemoryPanel";
import { SOPAgentPanel } from "@/components/sales/SOPAgentPanel";
import { SequenceTriggerPanel } from "@/components/sales/SequenceTriggerPanel";
import { getLeadById, priorityConfig } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import {
  Phone, MessageCircle, Mail, RotateCcw, Search, ArrowUpCircle,
  Calendar, XCircle, Save, Copy, AlertTriangle, CheckCircle,
  Clock, FileText, ChevronLeft, User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CenterTab = "assistencia" | "whatsapp" | "email" | "cobranca" | "interrupcao";
type MsgTab = "whatsapp" | "email" | "cobranca" | "interrupcao";

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

const sourceStyle = {
  Julia: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  Manual: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  Parceiro: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

const dmStatusConfig = {
  "Identificado": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Alcançado": { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  "Não identificado": { color: "#9CA3AF", bg: "#F8F9FC", border: "#E8EAED" },
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
        {copied
          ? <CheckCircle size={12} style={{ color: "#16a34a" }} />
          : <Copy size={12} style={{ color: "#D1D5DB" }} />}
      </span>
    </button>
  );
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={11} />,
  email: <Mail size={11} />,
  whatsapp: <MessageCircle size={11} />,
  note: <FileText size={11} />,
};

const typeIconColor: Record<string, string> = {
  call: "#9e3ffd",
  email: "#2563eb",
  whatsapp: "#16a34a",
  note: "#6B7280",
};

export default function LeadCard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [centerTab, setCenterTab] = useState<CenterTab>("assistencia");
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();

  const CENTER_TABS: { key: CenterTab; label: string }[] = [
    { key: "assistencia", label: t("salesos.lead.tab_call") },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "Email" },
    { key: "cobranca", label: t("salesos.lead.tab_bill") },
    { key: "interrupcao", label: t("salesos.lead.tab_pattern") },
  ];

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

  const pConf = priorityConfig[lead.priority];
  const pb = priorityBadge(lead.priority);
  const faConf = fastAccessConfig[lead.fast_access_vs_slow_burn];
  const dmConf = dmStatusConfig[lead.dm_status];
  const src = sourceStyle[lead.source] ?? sourceStyle.Manual;
  const attemptPct = Math.min((lead.attempt_count / 20) * 100, 100);
  const attemptColor = lead.attempt_count >= 18 ? "#dc2626" : lead.attempt_count >= 14 ? "#d97706" : "#9e3ffd";

  return (
    <SalesOSLayout>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#F8F9FC" }}>
        {/* Top bar */}
        <div
          className="shrink-0 px-6 py-3 border-b flex items-center justify-between gap-3"
          style={{ borderColor: "#E8EAED", background: "#FFFFFF" }}
        >
          <button
            onClick={() => navigate("/sales-os/queue")}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "#9CA3AF" }}
          >
            <ChevronLeft size={14} /> {t("salesos.lead.back")}
          </button>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded"
              style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}
            >
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

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT COLUMN */}
          <div
            className="overflow-y-auto p-4 space-y-4"
            style={{ width: 260, minWidth: 240, borderRight: "1px solid #E8EAED", background: "#FFFFFF" }}
          >
            {/* Company card */}
            <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
              <h1 className="text-lg font-bold mb-1" style={{ color: "#16163f" }}>{lead.company}</h1>
              <div className="mb-2">
                <CopyableField value={lead.cnpj} label="CNPJ:" />
              </div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>{lead.city}, {lead.state}</div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
              >
                {lead.industry_segment}
              </span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}
              >
                {lead.priority}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: faConf.bg, color: faConf.color, border: `1px solid ${faConf.border}` }}
              >
                {faConf.label}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: src.bg, color: src.color, border: `1px solid ${src.border}` }}
              >
                {lead.source}
              </span>
            </div>

            {/* DM card */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: "#FFFFFF", border: "1px solid #E8EAED", borderLeft: "3px solid #c88ff5" }}
            >
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
                  <span
                    className="text-xs px-2 py-0.5 rounded-full inline-block font-medium"
                    style={{ background: dmConf.bg, color: dmConf.color, border: `1px solid ${dmConf.border}` }}
                  >
                    {lead.dm_status}
                  </span>
                  {!lead.has_direct_dm_route && (
                    <div
                      className="flex items-start gap-1.5 rounded-lg p-2 mt-1"
                      style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                    >
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

            {/* Phone */}
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
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
                >
                  {lead.bill_status} {lead.bill_status_date && `· ${lead.bill_status_date}`}
                </span>
              ) : (
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{t("salesos.lead.not_received")}</span>
              )}
            </div>

            {/* Attempt progress bar */}
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
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: "rgba(158,63,253,0.06)", border: "1px solid rgba(158,63,253,0.15)" }}
            >
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

          {/* CENTER COLUMN */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#FFFFFF" }}>
            {/* Tab bar */}
            <div className="shrink-0 flex border-b overflow-x-auto px-2" style={{ borderColor: "#E8EAED" }}>
              {CENTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCenterTab(tab.key)}
                  className="px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  style={{
                    color: centerTab === tab.key ? "#9e3ffd" : "#9CA3AF",
                    borderBottom: centerTab === tab.key ? "2px solid #9e3ffd" : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5" style={{ background: "#F8F9FC" }}>
              {centerTab === "assistencia" && <CallAssistPanel lead={lead} />}
              {(centerTab === "whatsapp" || centerTab === "email" || centerTab === "cobranca" || centerTab === "interrupcao") && (
                <MessageComposer lead={lead} activeTab={centerTab as MsgTab} />
              )}
            </div>

            {/* Action bar */}
            <div
              className="shrink-0 px-4 py-3 border-t flex gap-2 flex-wrap"
              style={{ borderColor: "#E8EAED", background: "#FFFFFF" }}
            >
              <button
                onClick={openDialer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "#9e3ffd", color: "#fff" }}
              >
                <Phone size={12} /> {t("salesos.common.call_now")}
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
              >
                <MessageCircle size={12} /> WhatsApp
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
              >
                <Mail size={12} /> Email
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
              >
                <RotateCcw size={12} /> {t("salesos.lead.bill_chase")}
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
              >
                <Search size={12} /> {t("salesos.lead.enrich")}
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
              >
                <ArrowUpCircle size={12} /> {t("salesos.lead.escalate_renan")}
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
              >
                <Calendar size={12} /> {t("salesos.lead.callback")}
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
              >
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
          </div>

          {/* RIGHT COLUMN */}
          <div
            className="overflow-y-auto p-4 space-y-4"
            style={{ width: 280, minWidth: 260, borderLeft: "1px solid #E8EAED", background: "#FFFFFF" }}
          >
            {/* Timeline */}
            <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: "#9e3ffd" }} />
                <span className="text-sm font-semibold" style={{ color: "#16163f" }}>{t("salesos.lead.timeline")}</span>
              </div>
              <div className="space-y-0">
                {lead.activity_timeline.map((entry, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${typeIconColor[entry.type] ?? "#9CA3AF"}15`, color: typeIconColor[entry.type] ?? "#9CA3AF" }}
                      >
                        {typeIcons[entry.type]}
                      </div>
                      {i < lead.activity_timeline.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ background: "#E8EAED", minHeight: 12 }} />
                      )}
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-medium" style={{ color: "#374151" }}>{entry.outcome}</span>
                        <span className="text-[10px] shrink-0" style={{ color: "#9CA3AF" }}>{entry.timestamp}</span>
                      </div>
                      <div className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>{entry.rep}</div>
                      {entry.note && <div className="text-[11px]" style={{ color: "#6B7280" }}>{entry.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DMEnrichmentPanel lead={lead} />
            <SOPAgentPanel lead={lead} />
            <SequenceTriggerPanel />
            <MemoryPanel lead={lead} />
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
