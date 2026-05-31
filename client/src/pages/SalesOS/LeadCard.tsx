import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { CallAssistPanel } from "@/components/sales/CallAssistPanel";
import { MessageComposer } from "@/components/sales/MessageComposer";
import { AgentRecommendationCard } from "@/components/sales/AgentRecommendationCard";
import { DMEnrichmentPanel } from "@/components/sales/DMEnrichmentPanel";
import { MemoryPanel } from "@/components/sales/MemoryPanel";
import { SequenceTriggerPanel } from "@/components/sales/SequenceTriggerPanel";
import { getLeadById, priorityConfig } from "@/data/mockLeads";
import {
  Phone, MessageCircle, Mail, RotateCcw, Search, ArrowUpCircle,
  Calendar, XCircle, Save, Copy, AlertTriangle, CheckCircle,
  Clock, FileText, ChevronRight, Zap,
} from "lucide-react";

type CenterTab = "assistencia" | "whatsapp" | "email" | "cobranca" | "interrupcao";
type MsgTab = "whatsapp" | "email" | "cobranca" | "interrupcao";

const CENTER_TABS: { key: CenterTab; label: string }[] = [
  { key: "assistencia", label: "Assistência de Chamada" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "cobranca", label: "Cobrar Conta" },
  { key: "interrupcao", label: "Interrupção de Padrão" },
];

const fastAccessConfig = {
  fast_access: { label: "Acesso Rápido", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)" },
  slow_burn: { label: "Queima Lenta", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
  strategic: { label: "Estratégico", color: "#9e3ffd", bg: "rgba(158,63,253,0.12)", border: "rgba(158,63,253,0.25)" },
};

const sourceColors = {
  Julia: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  Manual: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  Parceiro: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
};

const dmStatusConfig = {
  "Identificado": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  "Alcançado": { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)" },
  "Não identificado": { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
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
      {label && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>}
      <span className="font-mono text-sm" style={{ color: "#c88ff5" }}>{value}</span>
      <span className="transition-opacity opacity-0 group-hover:opacity-100 ml-1">
        {copied
          ? <CheckCircle size={12} style={{ color: "#22c55e" }} />
          : <Copy size={12} style={{ color: "rgba(255,255,255,0.4)" }} />}
      </span>
    </button>
  );
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={12} />,
  email: <Mail size={12} />,
  whatsapp: <MessageCircle size={12} />,
  note: <FileText size={12} />,
};

export default function LeadCard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [centerTab, setCenterTab] = useState<CenterTab>("assistencia");
  const [scriptViewed, setScriptViewed] = useState(false);
  const [saved, setSaved] = useState(false);

  const lead = getLeadById(id ?? "");
  if (!lead) {
    return (
      <SalesOSLayout>
        <div className="flex items-center justify-center h-full" style={{ color: "rgba(255,255,255,0.4)" }}>
          Lead não encontrado. <button onClick={() => navigate("/sales-os/queue")} className="ml-2 underline" style={{ color: "#9e3ffd" }}>Voltar à fila</button>
        </div>
      </SalesOSLayout>
    );
  }

  const pConf = priorityConfig[lead.priority];
  const faConf = fastAccessConfig[lead.fast_access_vs_slow_burn];
  const dmConf = dmStatusConfig[lead.dm_status];

  return (
    <SalesOSLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Page top bar */}
        <div className="shrink-0 px-6 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
          <button onClick={() => navigate("/sales-os/queue")} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
            ← Minha Fila
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded text-white ${pConf.color}`}>{lead.priority}</span>
            <span className="font-semibold text-sm" style={{ color: "#fff" }}>{lead.company}</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{lead.city}/{lead.state}</span>
          </div>
          <button
            onClick={() => navigate("/sales-os/dialer")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}
          >
            <Phone size={14} /> Discar Agora
          </button>
        </div>

        {/* Three columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT COLUMN */}
          <div className="overflow-y-auto p-5 space-y-4" style={{ width: 260, minWidth: 240, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Company title */}
            <div>
              <h1 className="text-xl font-bold mb-0.5" style={{ color: "#fff" }}>{lead.company}</h1>
              <div className="mb-2">
                <CopyableField value={lead.cnpj} label="CNPJ:" />
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.city}, {lead.state}</div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {lead.industry_segment}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold text-white ${pConf.color}`}>{lead.priority}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: faConf.bg, color: faConf.color, border: `1px solid ${faConf.border}` }}>
                {faConf.label}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${sourceColors[lead.source]}`}>{lead.source}</span>
            </div>

            {/* DM section */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>Decisor</div>
              {lead.dm_name ? (
                <>
                  <div className="font-bold text-sm" style={{ color: "#fff" }}>{lead.dm_name}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{lead.dm_role}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: dmConf.bg, color: dmConf.color, border: `1px solid ${dmConf.border}` }}>
                    {lead.dm_status}
                  </span>
                  {!lead.has_direct_dm_route && (
                    <div className="flex items-start gap-1.5 rounded-lg p-2 mt-1" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                      <span className="text-[11px]" style={{ color: "#fcd34d" }}>
                        Sem rota direta para {lead.dm_name.split(" ")[0]}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <em className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Não identificado</em>
              )}
            </div>

            {/* Phone */}
            {lead.dm_direct_phone_best && (
              <div>
                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Melhor Contato</div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono" style={{ color: "#fff" }}>{lead.dm_direct_phone_best}</span>
                  {lead.dm_whatsapp_likely === true && (
                    <span style={{ color: "#25D366", fontSize: 11 }}>✓ WA</span>
                  )}
                  {lead.dm_whatsapp_likely === "unknown" && (
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>? WA</span>
                  )}
                </div>
                {lead.dm_direct_phone_confidence && (
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Confiança: {lead.dm_direct_phone_confidence}%</div>
                )}
              </div>
            )}

            {/* Bill status */}
            <div>
              <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Status da Conta</div>
              {lead.bill_status ? (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                  {lead.bill_status} {lead.bill_status_date && `· ${lead.bill_status_date}`}
                </span>
              ) : (
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Não recebida</span>
              )}
            </div>

            {/* Attempt count */}
            <div>
              <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Tentativas</div>
              <div className={`text-sm font-semibold flex items-center gap-1 ${lead.attempt_count >= 19 ? "text-red-400" : lead.attempt_count >= 15 ? "text-amber-400" : ""}`} style={lead.attempt_count < 15 ? { color: "rgba(255,255,255,0.7)" } : {}}>
                {lead.attempt_count >= 19 && "🚨 "}
                {lead.attempt_count >= 15 && lead.attempt_count < 19 && <AlertTriangle size={13} />}
                {lead.attempt_count} tentativas
              </div>
            </div>

            {/* Last touch */}
            {lead.last_contact && (
              <div>
                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Último Contato</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{lead.last_contact}</div>
              </div>
            )}

            {/* Blocker */}
            {lead.blocker && (
              <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#f59e0b" }}>Bloqueio Atual</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{lead.blocker}</div>
              </div>
            )}

            {/* Priority score */}
            <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Score</span>
              <span className="text-lg font-bold" style={{ color: "#c88ff5" }}>{lead.priority_score}<span className="text-xs font-normal opacity-50">/100</span></span>
            </div>

            {/* Agent rec (full) */}
            <AgentRecommendationCard
              recommendation={lead.agent_recommendation}
              onPrimary={() => navigate("/sales-os/dialer")}
              onOverride={() => {}}
            />
          </div>

          {/* CENTER COLUMN */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="shrink-0 flex border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {CENTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCenterTab(tab.key)}
                  className="px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  style={{
                    color: centerTab === tab.key ? "#c88ff5" : "rgba(255,255,255,0.4)",
                    borderBottom: centerTab === tab.key ? "2px solid #9e3ffd" : "2px solid transparent",
                    background: centerTab === tab.key ? "rgba(158,63,253,0.07)" : "transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {centerTab === "assistencia" && (
                <CallAssistPanel
                  lead={lead}
                  scriptViewed={scriptViewed}
                  onScriptViewed={() => setScriptViewed(true)}
                />
              )}
              {(centerTab === "whatsapp" || centerTab === "email" || centerTab === "cobranca" || centerTab === "interrupcao") && (
                <MessageComposer lead={lead} activeTab={centerTab as MsgTab} />
              )}
            </div>

            {/* Action bar */}
            <div className="shrink-0 px-4 py-3 border-t flex gap-2 flex-wrap" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
              <button onClick={() => navigate("/sales-os/dialer")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#9e3ffd", color: "#fff" }}>
                <Phone size={12} /> Ligar Agora
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                <MessageCircle size={12} /> WhatsApp
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Mail size={12} /> Email
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <RotateCcw size={12} /> Bill Chase
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Search size={12} /> Enriquecer
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                <ArrowUpCircle size={12} /> Escalar Renan
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Calendar size={12} /> Callback
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                <XCircle size={12} /> Perdido
              </button>
              <button
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs ml-auto"
                style={{ background: saved ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", color: saved ? "#22c55e" : "rgba(255,255,255,0.55)", border: `1px solid ${saved ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}` }}
              >
                <Save size={12} /> {saved ? "Salvo!" : "Salvar no Zoho"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="overflow-y-auto p-4 space-y-4" style={{ width: 280, minWidth: 260, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Activity timeline */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: "#9e3ffd" }} />
                <span className="text-sm font-semibold" style={{ color: "#fff" }}>Timeline</span>
              </div>
              <div className="space-y-0">
                {lead.activity_timeline.map((entry, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(158,63,253,0.15)", color: "#9e3ffd" }}>
                        {typeIcons[entry.type]}
                      </div>
                      {i < lead.activity_timeline.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ background: "rgba(255,255,255,0.07)", minHeight: 12 }} />
                      )}
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{entry.outcome}</span>
                        <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{entry.timestamp}</span>
                      </div>
                      <div className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.rep}</div>
                      {entry.note && <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{entry.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DM Enrichment */}
            <DMEnrichmentPanel lead={lead} />

            {/* SOP Agent Activity */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={13} style={{ color: "#9e3ffd" }} />
                <span className="text-sm font-semibold" style={{ color: "#fff" }}>SOP Agents</span>
              </div>
              <div className="space-y-2">
                {lead.sop_agent_statuses.map((sop, i) => {
                  const statusColor = { Concluído: "#22c55e", Executando: "#f59e0b", Pendente: "rgba(255,255,255,0.4)", Erro: "#ef4444" }[sop.status];
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span style={{ color: "rgba(255,255,255,0.65)" }}>{sop.sop}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] shrink-0" style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                          {sop.status}
                        </span>
                      </div>
                      {sop.output_summary && (
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>{sop.output_summary}</div>
                      )}
                      {sop.last_run && (
                        <div style={{ color: "rgba(255,255,255,0.3)" }}>{sop.last_run}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sequence triggers */}
            <SequenceTriggerPanel />

            {/* Memory */}
            <MemoryPanel lead={lead} />
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
