import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout, useViewAs } from "@/components/sales/SalesOSLayout";
import { HuddleMode } from "@/components/sales/HuddleMode";
import { mockLeads, priorityConfig } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import {
  AlertTriangle, Phone, Clock, Users, FileText, TrendingUp,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, CheckCircle,
  MessageSquare, BarChart3, Play, User,
  GraduationCap, Copy, Star,
} from "lucide-react";

const REPS = ["Elayne Nunes", "Thaina Domet"];

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

interface SectionProps {
  title: string;
  color: string;
  leads: typeof mockLeads;
  defaultOpen?: boolean;
  issueLabel: (lead: typeof mockLeads[0]) => string;
  onOpen: (id: string) => void;
  showApprove?: boolean;
  labels: { open: string; reassign: string; approveLoss: string; coachingPlaceholder: string; send: string; sent: string; noItems: string };
}

function ManagerSection({ title, color, leads, defaultOpen = false, issueLabel, onOpen, showApprove, labels }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [coaching, setCoaching] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Set<string>>(new Set());

  function sendNote(id: string) {
    setSent(prev => new Set([...prev, id]));
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3.5 transition-colors"
        style={{ background: open ? "#F8F9FC" : "#FFFFFF" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{title}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
          >
            {leads.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} />
          : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
              {leads.length === 0 && (
                <div className="px-5 py-4 text-sm" style={{ color: "#9CA3AF" }}>{labels.noItems}</div>
              )}
              {leads.map(lead => {
                const pb = priorityBadge(lead.priority);
                return (
                  <div key={lead.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}
                          >
                            {lead.priority}
                          </span>
                          <span className="text-sm font-semibold truncate" style={{ color: "#16163f" }}>{lead.dm_name ?? "—"}</span>
                          <span className="text-xs truncate" style={{ color: "#9CA3AF" }}>· {lead.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span style={{ color: "#9CA3AF" }}>{lead.assigned_to.split(" ")[0]}</span>
                          <span style={{ color: "#D1D5DB" }}>·</span>
                          <span className="flex items-center gap-1" style={{ color }}>
                            <AlertTriangle size={10} /> {issueLabel(lead)}
                          </span>
                          {lead.last_contact && (
                            <span style={{ color: "#9CA3AF" }}>· {lead.last_contact}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onOpen(lead.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
                        >
                          <ExternalLink size={10} /> {labels.open}
                        </button>
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
                        >
                          <RefreshCw size={10} /> {labels.reassign}
                        </button>
                        {showApprove && (
                          <button
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
                          >
                            <CheckCircle size={10} /> {labels.approveLoss}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        value={coaching[lead.id] ?? ""}
                        onChange={e => setCoaching(c => ({ ...c, [lead.id]: e.target.value }))}
                        placeholder={labels.coachingPlaceholder}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
                        onFocus={e => (e.target.style.borderColor = "#9e3ffd")}
                        onBlur={e => (e.target.style.borderColor = "#E8EAED")}
                      />
                      <button
                        onClick={() => sendNote(lead.id)}
                        disabled={!coaching[lead.id]?.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all"
                        style={{
                          background: sent.has(lead.id) ? "#dcfce7" : "rgba(158,63,253,0.08)",
                          color: sent.has(lead.id) ? "#16a34a" : "#9e3ffd",
                          border: `1px solid ${sent.has(lead.id) ? "#bbf7d0" : "rgba(158,63,253,0.2)"}`,
                        }}
                      >
                        {sent.has(lead.id) ? labels.sent : labels.send}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RepPerformanceCard({ rep, labels }: { rep: string; labels: { qaFlags: string; renanAction: string; overdue: string; sendNote: string; sent: string } }) {
  const leads = mockLeads.filter(l => l.assigned_to === rep);
  const overdue = leads.filter(l => l.next_action_overdue);
  const [coaching, setCoaching] = useState("");
  const [sent, setSent] = useState(false);

  const isElayne = rep === "Elayne Nunes";
  const stats = isElayne
    ? { calls: 12, dms: 4, bills: 3, received: 1, conversion: "33%" }
    : { calls: 9, dms: 3, bills: 2, received: 1, conversion: "50%" };

  const sopFlags = isElayne ? [
    "Não usou briefing em 4 chamadas hoje",
    "6 leads com decisor alcançado sem pedido de conta",
    "Solar aceito como objeção definitiva sem diagnóstico",
  ] : [
    "3 chamadas encerradas em menos de 2 minutos",
    "Gatekeeper fechado como Perdido sem tentativa alternativa",
  ];

  const renanAction = isElayne
    ? "Fazer roleplay de bill ask com Elayne — praticar o pedido após rapport de 60 segundos."
    : "Ouvir a gravação da chamada com o Hotel Executivo Paulistano — identificar ponto de saída precoce.";

  const statLabels: Record<string, string> = {
    calls: "Chamadas", dms: "DMs", bills: "Contas", received: "Recebidas", conversion: "Conversão"
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}
          >
            {rep.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#16163f" }}>{rep}</div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              {leads.length} leads ·{" "}
              {overdue.length > 0
                ? <span style={{ color: "#dc2626" }}>{overdue.length} {labels.overdue}</span>
                : <span style={{ color: "#16a34a" }}>Em dia</span>}
            </div>
          </div>
        </div>
        <BarChart3 size={14} style={{ color: "#9e3ffd" }} />
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats mini-grid */}
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(stats).map(([k, v]) => {
            const pct = typeof v === "number" ? Math.min((v / (k === "calls" ? 20 : k === "dms" ? 8 : k === "bills" ? 6 : k === "received" ? 4 : 10)) * 100, 100) : null;
            return (
              <div key={k} className="rounded-xl p-2.5 text-center" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                <div className="text-base font-bold mb-0.5" style={{ color: "#9e3ffd" }}>{v}</div>
                <div className="text-[10px] capitalize" style={{ color: "#9CA3AF" }}>{statLabels[k] ?? k}</div>
                {pct !== null && (
                  <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "#E8EAED" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#9e3ffd" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* QA Flags */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>{labels.qaFlags}</div>
          <div className="space-y-1.5">
            {sopFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs rounded-lg px-2.5 py-2" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                <span style={{ color: "#374151" }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Renan action */}
        <div className="rounded-xl p-3" style={{ background: "rgba(158,63,253,0.05)", border: "1px solid rgba(158,63,253,0.15)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "#9e3ffd" }}>{labels.renanAction}</div>
          <div className="text-xs" style={{ color: "#374151" }}>{renanAction}</div>
        </div>

        {/* Coaching note */}
        <div className="flex gap-2">
          <input
            value={coaching}
            onChange={e => setCoaching(e.target.value)}
            placeholder={`Nota de coaching para ${rep.split(" ")[0]}...`}
            className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
            onFocus={e => (e.target.style.borderColor = "#9e3ffd")}
            onBlur={e => (e.target.style.borderColor = "#E8EAED")}
          />
          <button
            onClick={() => { setSent(true); setCoaching(""); setTimeout(() => setSent(false), 2500); }}
            disabled={!coaching.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all"
            style={{
              background: sent ? "#dcfce7" : "rgba(158,63,253,0.08)",
              color: sent ? "#16a34a" : "#9e3ffd",
              border: `1px solid ${sent ? "#bbf7d0" : "rgba(158,63,253,0.2)"}`,
            }}
          >
            {sent ? labels.sent : labels.sendNote}
          </button>
        </div>
      </div>
    </div>
  );
}

function RepDashboard({ viewAs }: { viewAs: string }) {
  const [, navigate] = useLocation();
  const repName = viewAs === "Elayne" ? "Elayne Nunes" : "Thaina Domet";
  const myLeads = mockLeads.filter(l => l.assigned_to === repName);
  const p1p2 = myLeads.filter(l => l.priority === "P1" || l.priority === "P2");
  const dirty = myLeads.filter(l => !l.next_action || l.next_action_overdue);
  const overdue = myLeads.filter(l => l.next_action_overdue);

  const stats = viewAs === "Elayne"
    ? { calls: 12, dms: 4, bills: 3, received: 1 }
    : { calls: 9, dms: 3, bills: 2, received: 1 };

  function openLead(id: string) { navigate(`/sales-os/leads/${id}`); }
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Meu Painel</h1>
          <div className="text-sm" style={{ color: "#9CA3AF" }}>{viewAs} · {today}</div>
        </div>
        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Chamadas hoje", value: stats.calls, color: "#9e3ffd" },
            { label: "DMs alcançados", value: stats.dms, color: "#16a34a" },
            { label: "Contas pedidas", value: stats.bills, color: "#d97706" },
            { label: "Contas recebidas", value: stats.received, color: "#2563eb" },
            { label: "Meus leads", value: myLeads.length, color: "#7c3aed" },
            { label: "Em atraso", value: overdue.length, color: overdue.length > 0 ? "#dc2626" : "#16a34a" },
          ].map(chip => (
            <div
              key={chip.label}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${chip.color}15` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: chip.color }} />
              </div>
              <span className="text-lg font-bold" style={{ color: "#16163f" }}>{chip.value}</span>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* P1/P2 — my priority leads */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "#F8F9FC" }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#dc2626" }} />
            <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Meus P1 / P2 — Ação Urgente</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#fef2f220", color: "#dc2626", border: "1px solid #fecaca" }}>
              {p1p2.length}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {p1p2.length === 0 && (
              <div className="px-5 py-4 text-sm" style={{ color: "#9CA3AF" }}>Nenhum lead P1/P2 no momento.</div>
            )}
            {p1p2.map(lead => {
              const pb = priorityBadge(lead.priority);
              return (
                <div key={lead.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>
                        {lead.priority}
                      </span>
                      <span className="text-sm font-semibold truncate" style={{ color: "#16163f" }}>{lead.dm_name ?? "—"}</span>
                      <span className="text-xs truncate" style={{ color: "#9CA3AF" }}>· {lead.company}</span>
                    </div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>
                      {lead.next_action ? lead.next_action : "Sem próxima ação definida"}
                      {lead.last_contact && ` · ${lead.last_contact}`}
                    </div>
                  </div>
                  <button
                    onClick={() => openLead(lead.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                    style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
                  >
                    Abrir
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dirty queue — no next action */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "#F8F9FC" }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ea580c" }} />
            <span className="font-semibold text-sm" style={{ color: "#16163f" }}>Sem Próxima Ação</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>
              {dirty.length}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {dirty.length === 0 && (
              <div className="px-5 py-4 text-sm" style={{ color: "#16a34a" }}>✓ Todos os leads têm próxima ação definida.</div>
            )}
            {dirty.slice(0, 5).map(lead => {
              const pb = priorityBadge(lead.priority);
              return (
                <div key={lead.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>
                        {lead.priority}
                      </span>
                      <span className="text-sm font-semibold truncate" style={{ color: "#16163f" }}>{lead.dm_name ?? "—"}</span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>· {lead.company}</span>
                    </div>
                    <div className="text-xs" style={{ color: "#ea580c" }}>
                      {lead.next_action_overdue ? `Ação atrasada ${lead.next_action_overdue_days ?? "?"}d` : "Sem próxima ação"}
                    </div>
                  </div>
                  <button
                    onClick={() => openLead(lead.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                    style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
                  >
                    Abrir
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Manager() {
  const [, navigate] = useLocation();
  const [huddleOpen, setHuddleOpen] = useState(false);
  const [report4pm, setReport4pm] = useState(false);
  const [reportEod, setReportEod] = useState(false);
  const [copiedEod, setCopiedEod] = useState(false);
  const { t } = useI18n();
  const { viewAs, isRep } = useViewAs();

  const STAT_CHIPS = [
    { label: t("salesos.manager.stat_calls"), value: 21, color: "#9e3ffd", icon: <Phone size={14} /> },
    { label: t("salesos.manager.stat_dms"), value: 7, color: "#16a34a", icon: <Users size={14} /> },
    { label: t("salesos.manager.stat_requested"), value: 5, color: "#d97706", icon: <FileText size={14} /> },
    { label: t("salesos.manager.stat_received"), value: 2, color: "#2563eb", icon: <FileText size={14} /> },
    { label: t("salesos.manager.stat_proposals"), value: 2, color: "#dc2626", icon: <TrendingUp size={14} /> },
    { label: t("salesos.manager.stat_active"), value: mockLeads.length, color: "#7c3aed", icon: <Users size={14} /> },
    { label: t("salesos.manager.stat_callbacks"), value: 7, color: "#d97706", icon: <Clock size={14} /> },
    { label: t("salesos.manager.stat_replies"), value: mockLeads.filter(l => l.human_response_required).length, color: "#dc2626", icon: <MessageSquare size={14} /> },
  ];

  const sectionLabels = {
    open: t("salesos.manager.open"),
    reassign: t("salesos.manager.reassign"),
    approveLoss: t("salesos.manager.approve_loss"),
    coachingPlaceholder: t("salesos.manager.coaching_placeholder"),
    send: t("salesos.common.send"),
    sent: t("salesos.manager.sent"),
    noItems: t("salesos.manager.no_items"),
  };

  const repLabels = {
    qaFlags: t("salesos.manager.qa_flags"),
    renanAction: t("salesos.manager.renan_action"),
    overdue: t("salesos.manager.leads_overdue"),
    sendNote: t("salesos.manager.send_note"),
    sent: t("salesos.manager.sent"),
  };

  function openLead(id: string) { navigate(`/sales-os/leads/${id}`); }

  const noNextAction = mockLeads.filter(l => !l.next_action || l.next_action_overdue);
  const lostCallbacks = mockLeads.filter(l => l.next_action_overdue && l.priority === "P1");
  const dmNoRequest = mockLeads.filter(l => l.dm_status === "Alcançado" && !l.bill_status);
  const stale48h = mockLeads.filter(l => l.priority === "P6" || l.priority === "P8");
  const humanReplies = mockLeads.filter(l => l.human_response_required);

  if (isRep) {
    return (
      <SalesOSLayout>
        <RepDashboard viewAs={viewAs} />
      </SalesOSLayout>
    );
  }

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        <AnimatePresence>
          {huddleOpen && <HuddleMode onClose={() => setHuddleOpen(false)} />}
        </AnimatePresence>

        {/* Page header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>{t("salesos.manager.title")}</h1>
              <div className="text-sm" style={{ color: "#9CA3AF" }}>
                {t("salesos.manager.overview")} · Renan · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setHuddleOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff", boxShadow: "0 2px 10px rgba(158,63,253,0.3)" }}
              >
                <Play size={13} /> {t("salesos.manager.huddle")}
              </button>
              <button
                onClick={() => { setReport4pm(p => !p); setReportEod(false); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: report4pm ? "rgba(158,63,253,0.08)" : "#F8F9FC", color: report4pm ? "#9e3ffd" : "#6B7280", border: `1px solid ${report4pm ? "rgba(158,63,253,0.2)" : "#E8EAED"}` }}
              >
                {t("salesos.manager.report_4pm")}
              </button>
              <button
                onClick={() => { setReportEod(p => !p); setReport4pm(false); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: reportEod ? "rgba(158,63,253,0.08)" : "#F8F9FC", color: reportEod ? "#9e3ffd" : "#6B7280", border: `1px solid ${reportEod ? "rgba(158,63,253,0.2)" : "#E8EAED"}` }}
              >
                {t("salesos.manager.report_eod")}
              </button>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3">
            {STAT_CHIPS.map(chip => (
              <div
                key={chip.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: `${chip.color}15` }}
                >
                  <span style={{ color: chip.color }}>{chip.icon}</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "#16163f" }}>{chip.value}</span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Report panels — toggled from header buttons */}
        <AnimatePresence>
          {(report4pm || reportEod) && (
            <motion.div
              key="report-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              style={{ background: "#FFFFFF", borderBottom: "1px solid #E8EAED" }}
            >
              <div className="px-6 py-5">
                {report4pm && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={14} style={{ color: "#9e3ffd" }} />
                      <h3 className="font-bold text-sm" style={{ color: "#16163f" }}>
                        Relatório das 16h — {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                      </h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Fila ainda suja", value: noNextAction.length, color: "#dc2626" },
                        { label: "Decisores sem conta", value: dmNoRequest.length, color: "#d97706" },
                        { label: "Callbacks em atraso", value: lostCallbacks.length, color: "#ea580c" },
                        { label: "Respostas pendentes", value: humanReplies.length, color: "#7c3aed" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3 text-center"
                          style={{ background: "#F8F9FC", border: `1px solid ${s.color}25` }}>
                          <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-xs" style={{ color: "#9CA3AF" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: "#d97706" }}>Reps abaixo da meta das 16h</div>
                      <div className="text-sm" style={{ color: "#374151" }}>
                        <strong>Thaina</strong> — 9 chamadas realizadas / meta: 20 · Prioridade: fechar 3 callbacks pendentes antes das 17h.
                      </div>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>Chamadas urgentes para as próximas 2h</div>
                      <div className="space-y-1.5">
                        {noNextAction.slice(0, 4).map(l => (
                          <div key={l.id} className="flex items-center justify-between text-xs py-1">
                            <span style={{ color: "#374151" }}>{l.company_name}</span>
                            <span className="px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#fef2f2", color: "#dc2626" }}>Urgente</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {reportEod && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Star size={14} style={{ color: "#9e3ffd" }} />
                        <h3 className="font-bold text-sm" style={{ color: "#16163f" }}>
                          Relatório EOD — {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const txt = `*Relatório EOD — Ótima Energia*\n\n*Equipe*\nElayne: 12 lig · 4 DMs · 3 contas\nThaina: 9 lig · 3 DMs · 2 contas\n\n*Fila suja restante:* ${noNextAction.length} leads\n*Callbacks perdidos:* ${lostCallbacks.length}\n\n*Coaching amanhã:*\n• Thaina — revisão de abertura de script\n• Elayne — trabalhar objeções de custo`;
                          navigator.clipboard.writeText(txt).then(() => { setCopiedEod(true); setTimeout(() => setCopiedEod(false), 2000); });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: copiedEod ? "#dcfce7" : "rgba(158,63,253,0.07)", color: copiedEod ? "#16a34a" : "#9e3ffd", border: `1px solid ${copiedEod ? "#bbf7d0" : "rgba(158,63,253,0.2)"}` }}
                      >
                        <Copy size={11} /> {copiedEod ? "Copiado!" : "Copiar para WA"}
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAED" }}>
                      <table className="w-full text-xs">
                        <thead style={{ background: "#F8F9FC" }}>
                          <tr>
                            {["Rep", "Ligações", "DMs", "Contas Ped.", "Contas Rcvd."].map(h => (
                              <th key={h} className="px-4 py-2.5 font-semibold text-left first:text-left text-center"
                                style={{ color: "#9CA3AF" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[{ n: "Elayne", c: 12, d: 4, req: 3, rcvd: 1 }, { n: "Thaina", c: 9, d: 3, req: 2, rcvd: 1 }].map(r => (
                            <tr key={r.n} style={{ borderTop: "1px solid #F3F4F6" }}>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "#374151" }}>{r.n}</td>
                              <td className="text-center px-4 py-2.5 font-bold" style={{ color: "#9e3ffd" }}>{r.c}</td>
                              <td className="text-center px-4 py-2.5 font-bold" style={{ color: "#16a34a" }}>{r.d}</td>
                              <td className="text-center px-4 py-2.5 font-bold" style={{ color: "#d97706" }}>{r.req}</td>
                              <td className="text-center px-4 py-2.5 font-bold" style={{ color: "#2563eb" }}>{r.rcvd}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Fila suja restante", value: noNextAction.length, color: "#dc2626" },
                        { label: "Callbacks perdidos", value: lostCallbacks.length, color: "#ea580c" },
                        { label: "Respostas pendentes", value: humanReplies.length, color: "#7c3aed" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3 text-center"
                          style={{ background: "#F8F9FC", border: `1px solid ${s.color}25` }}>
                          <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-xs" style={{ color: "#9CA3AF" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: "#7c3aed" }}>Coaching de amanhã</div>
                      <div className="space-y-1 text-xs" style={{ color: "#374151" }}>
                        <div>• <strong>Thaina</strong> — revisão de abertura de script padrão (SOP 2)</div>
                        <div>• <strong>Elayne</strong> — técnica de aprofundamento de objeção de custo</div>
                        <div>• Ambas — role-play de pedido de conta em 1ª ligação</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 py-5 space-y-5">
          {/* Sections */}
          <ManagerSection
            title={t("salesos.manager.section_dirty")}
            color="#dc2626"
            leads={noNextAction.slice(0, 4)}
            defaultOpen
            issueLabel={l => `Próxima ação atrasada ${l.next_action_overdue_days ?? "?"}d — sem data`}
            onOpen={openLead}
            labels={sectionLabels}
          />
          <ManagerSection
            title={t("salesos.manager.section_callbacks")}
            color="#ea580c"
            leads={lostCallbacks}
            issueLabel={l => `Callback prometido — ${l.next_action_date}`}
            onOpen={openLead}
            labels={sectionLabels}
          />
          <ManagerSection
            title={t("salesos.manager.section_nodm")}
            color="#d97706"
            leads={dmNoRequest}
            issueLabel={l => `DM ${l.dm_status} há ${l.last_contact ?? "?"} sem conta solicitada`}
            onOpen={openLead}
            labels={sectionLabels}
          />
          {/* Pattern-of-loss note */}
          <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
              Este é o padrão de conversão perdida mais comum. Cada decisor alcançado sem pedido de conta é uma oportunidade desperdiçada — a janela de receptividade fecha em média em 48h.
            </p>
          </div>
          <ManagerSection
            title={t("salesos.manager.section_lost")}
            color="#ca8a04"
            leads={mockLeads.filter(l => l.priority === "P8")}
            issueLabel={() => "20+ tentativas — aguardando decisão estratégica"}
            onOpen={openLead}
            showApprove
            labels={sectionLabels}
          />
          <ManagerSection
            title={t("salesos.manager.section_stale")}
            color="#2563eb"
            leads={stale48h}
            issueLabel={l => `Parado ${l.last_contact ?? "?"} sem ação`}
            onOpen={openLead}
            labels={sectionLabels}
          />
          <ManagerSection
            title="Respostas Humanas Pendentes"
            color="#7c3aed"
            leads={humanReplies}
            issueLabel={l => `Mensagem recebida ${l.last_contact ?? "?"} — aguardando resposta humana`}
            onOpen={openLead}
            labels={sectionLabels}
          />

          {/* Rep performance */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} style={{ color: "#9e3ffd" }} />
              <h2 className="font-bold text-base" style={{ color: "#16163f" }}>{t("salesos.manager.perf_title")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {REPS.map(rep => <RepPerformanceCard key={rep} rep={rep} labels={repLabels} />)}
            </div>
          </div>

          {/* Coaching overview */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} style={{ color: "#9e3ffd" }} />
              <h2 className="font-bold text-base" style={{ color: "#16163f" }}>Visão de Coaching da Equipa</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "Elayne Nunes", initial: "E", color: "#9e3ffd", qa: 82,
                  flags: [
                    "Chamadas terminando antes de explorar objeções — média 4 min",
                    "Taxa de identificação de DM baixa nas últimas 3 sessões",
                  ],
                  action: [
                    "Escutar gravação de hoje — abandona objeção prematuramente no 3º min",
                    "Dar feedback de role-play no coaching das 17h",
                  ],
                },
                {
                  name: "Thaina Domet", initial: "T", color: "#2563eb", qa: 76,
                  flags: [
                    "Taxa de script abaixo de 80% — revisar abertura padrão",
                    "6 callbacks perdidos esta semana",
                  ],
                  action: [
                    "Revisão de abertura de script amanhã cedo (15 min 1:1)",
                    "Verificar motivo dos callbacks perdidos — ver fila P1",
                  ],
                },
              ].map(rep => (
                <div key={rep.name} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: `${rep.color}20`, color: rep.color }}>
                      {rep.initial}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: "#16163f" }}>{rep.name}</div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                      style={{ background: rep.qa >= 80 ? "#dcfce7" : "#fef2f2", color: rep.qa >= 80 ? "#16a34a" : "#dc2626" }}>
                      <Star size={10} /> QA {rep.qa}
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Pontos de atenção</div>
                      <div className="space-y-1.5">
                        {rep.flags.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs rounded-lg px-2.5 py-2"
                            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                            <AlertTriangle size={10} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                            <span style={{ color: "#374151" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(158,63,253,0.05)", border: "1px solid rgba(158,63,253,0.15)" }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9e3ffd" }}>
                        Renan deve fazer agora
                      </div>
                      <div className="space-y-1">
                        {rep.action.map((a, i) => (
                          <div key={i} className="text-xs" style={{ color: "#374151" }}>→ {a}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
