import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { QueueItem } from "@/components/sales/QueueItem";
import { mockLeads, priorityConfig, mockRepStats, type Lead } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import {
  Phone, Users, FileText, FileCheck, Clock, AlertTriangle, CheckCircle,
  Building2, Search, List, LayoutGrid, Calendar, ChevronDown, Plus, SlidersHorizontal,
} from "lucide-react";

const PRIORITIES: Lead["priority"][] = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

const allStats = {
  calls: Object.values(mockRepStats).reduce((a, r) => a + r.calls, 0),
  dms: Object.values(mockRepStats).reduce((a, r) => a + r.dmsReached, 0),
  requested: Object.values(mockRepStats).reduce((a, r) => a + r.billsRequested, 0),
  received: Object.values(mockRepStats).reduce((a, r) => a + r.billsReceived, 0),
  callbacks: Object.values(mockRepStats).reduce((a, r) => a + r.callbacksPending, 0),
};

const sortedLeads = [...mockLeads].sort((a, b) => {
  const pa = parseInt(a.priority.slice(1));
  const pb = parseInt(b.priority.slice(1));
  return pa !== pb ? pa - pb : b.priority_score - a.priority_score;
});

const highPriorityClear = !sortedLeads.some(l => ["P1", "P2", "P3"].includes(l.priority));

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

function StatChip({ icon, value, label, color, trend }: { icon: React.ReactNode; value: number; label: string; color: string; trend?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minWidth: 140 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <motion.div
          className="text-xl font-bold leading-none mb-0.5"
          style={{ color: "#16163f" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {value}
        </motion.div>
        <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{label}</div>
      </div>
      {trend && (
        <div className="ml-auto text-[10px] font-semibold" style={{ color: "#16a34a" }}>
          {trend}
        </div>
      )}
    </motion.div>
  );
}

function PreviewPanel({ lead }: { lead: Lead | null }) {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  if (!lead) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
        <Building2 size={24} style={{ color: "#D1D5DB" }} />
      </div>
      <div className="text-sm font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.select_lead")}</div>
      <div className="text-xs" style={{ color: "#D1D5DB" }}>Selecione um lead para ver o resumo</div>
    </div>
  );

  const pConf = priorityConfig[lead.priority];
  const pb = priorityBadge(lead.priority);

  return (
    <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold" style={{ color: "#16163f" }}>{lead.company}</h3>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}
          >
            {lead.priority}
          </span>
        </div>
        <div className="text-xs" style={{ color: "#9CA3AF" }}>{lead.industry_segment} · {lead.city}/{lead.state}</div>
      </div>

      <div className="rounded-xl p-3" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
        <div className="text-[10px] uppercase tracking-wide mb-1.5 font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.common.dm")}</div>
        {lead.dm_name ? (
          <div>
            <div className="text-sm font-semibold" style={{ color: "#16163f" }}>{lead.dm_name}</div>
            <div className="text-xs" style={{ color: "#6B7280" }}>{lead.dm_role}</div>
          </div>
        ) : (
          <em className="text-xs" style={{ color: "#9CA3AF" }}>{t("salesos.queue.dm_unknown")}</em>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide mb-1 font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.priority")}</div>
          <span className="text-xs font-semibold" style={{ color: pb.color }}>{pConf.label}</span>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide mb-1 font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.status")}</div>
          <div className="text-xs" style={{ color: "#374151" }}>{lead.lead_status}</div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide mb-1 font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.last_outcome")}</div>
          <div
            className="text-xs px-2 py-1 rounded-lg inline-block"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            {lead.last_outcome}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide mb-1 font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.next_action")}</div>
          <div
            className="text-xs font-medium"
            style={{ color: lead.next_action_overdue ? "#dc2626" : "#374151" }}
          >
            {lead.next_action_overdue && "⏰ "}{lead.next_action_date}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{lead.next_action}</div>
        </div>

        <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "rgba(158,63,253,0.06)", border: "1px solid rgba(158,63,253,0.15)" }}>
          <div className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.priority_score")}</div>
          <div className="text-lg font-bold" style={{ color: "#9e3ffd" }}>{lead.priority_score}<span className="text-xs font-normal" style={{ color: "#9CA3AF" }}>/100</span></div>
        </div>
      </div>

      <button
        onClick={() => navigate(`/sales-os/leads/${lead.id}`)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: "#9e3ffd", color: "#fff", boxShadow: "0 2px 8px rgba(158,63,253,0.3)" }}
      >
        {t("salesos.queue.open_lead")} →
      </button>
    </motion.div>
  );
}

// ── Board view helpers ────────────────────────────────────────────────────────
const BOARD_COLUMNS: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: "novo",            label: "Novo",            color: "#9CA3AF", bg: "#F8F9FC",              border: "#E8EAED" },
  { key: "em_contato",      label: "Em Prospecção",   color: "#2563eb", bg: "#eff6ff",              border: "#bfdbfe" },
  { key: "dm_alcancado",    label: "DM Alcançado",    color: "#16a34a", bg: "#f0fdf4",              border: "#bbf7d0" },
  { key: "aguardando_conta",label: "Aguardando Conta",color: "#d97706", bg: "#fffbeb",              border: "#fde68a" },
  { key: "proposta",        label: "Proposta Enviada",color: "#7c3aed", bg: "rgba(158,63,253,0.05)",border: "rgba(158,63,253,0.18)" },
  { key: "bloqueado",       label: "Bloqueado",       color: "#dc2626", bg: "#fef2f2",              border: "#fecaca" },
];

function getBoardColumn(lead: Lead): string {
  if (lead.blocker) return "bloqueado";
  const ls = (lead.lead_status ?? "").toLowerCase();
  if (ls.includes("proposta")) return "proposta";
  if (ls.includes("aguardando") || (lead.dialer_queue_type ?? "").includes("bill_chase")) return "aguardando_conta";
  if (lead.dm_status === "Alcançado") return "dm_alcancado";
  if (lead.attempt_count > 0) return "em_contato";
  return "novo";
}

function BoardView({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const grouped: Record<string, Lead[]> = {};
  BOARD_COLUMNS.forEach(c => { grouped[c.key] = []; });
  leads.forEach(l => { const col = getBoardColumn(l); if (grouped[col]) grouped[col].push(l); });

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 p-4 h-full" style={{ minWidth: BOARD_COLUMNS.length * 220 + 32 }}>
        {BOARD_COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col shrink-0" style={{ width: 220 }}>
            {/* Column header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
              style={{ background: col.bg, border: `1px solid ${col.border}` }}
            >
              <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
              <span
                className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: col.color + "20", color: col.color }}
              >
                {grouped[col.key].length}
              </span>
            </div>
            {/* Cards */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {grouped[col.key].map(lead => {
                const pb = priorityBadge(lead.priority);
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onOpen(lead.id)}
                    className="rounded-xl p-3 cursor-pointer transition-all hover:shadow-md"
                    style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="text-xs font-semibold leading-tight" style={{ color: "#16163f" }}>{lead.company}</div>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0" style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>{lead.priority}</span>
                    </div>
                    {lead.dm_name && (
                      <div className="text-[10px] mb-2" style={{ color: "#6B7280" }}>{lead.dm_name}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{lead.attempt_count} tentativas</div>
                      <div className="text-[10px] font-semibold" style={{ color: "#9e3ffd" }}>{lead.priority_score}</div>
                    </div>
                  </motion.div>
                );
              })}
              {grouped[col.key].length === 0 && (
                <div className="flex items-center justify-center h-20 rounded-xl" style={{ border: "1px dashed #E8EAED", color: "#D1D5DB" }}>
                  <span className="text-xs">Vazio</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline view helpers ──────────────────────────────────────────────────────
const TIMELINE_SECTIONS: { key: string; label: string; color: string; icon: string }[] = [
  { key: "vencido",      label: "Vencido",      color: "#dc2626", icon: "⏰" },
  { key: "hoje",         label: "Hoje",          color: "#9e3ffd", icon: "📅" },
  { key: "amanha",       label: "Amanhã",        color: "#2563eb", icon: "🗓" },
  { key: "esta_semana",  label: "Esta Semana",   color: "#d97706", icon: "📆" },
  { key: "proxima",      label: "Próxima Semana",color: "#6B7280", icon: "🔜" },
];

function getTimelineSection(lead: Lead): string {
  if (lead.next_action_overdue) return "vencido";
  const d = (lead.next_action_date ?? "").toLowerCase();
  if (d.includes("ontem")) return "vencido";
  if (d.includes("hoje")) return "hoje";
  if (d.includes("amanhã") || d.includes("amanha")) return "amanha";
  // Specific dates — check if within 7 days
  const match = d.match(/(\d{2})\/(\d{2})/);
  if (match) {
    const day = parseInt(match[1]);
    const now = new Date().getDate();
    if (day <= now + 7) return "esta_semana";
    return "proxima";
  }
  return "esta_semana";
}

function TimelineView({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const grouped: Record<string, Lead[]> = {};
  TIMELINE_SECTIONS.forEach(s => { grouped[s.key] = []; });
  leads.forEach(l => { const sec = getTimelineSection(l); if (grouped[sec]) grouped[sec].push(l); });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {TIMELINE_SECTIONS.filter(s => grouped[s.key].length > 0).map(sec => (
        <div key={sec.key}>
          {/* Section header */}
          <div className="flex items-center gap-2 mb-2">
            <span>{sec.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sec.color }}>{sec.label}</span>
            <div className="flex-1 h-px ml-1" style={{ background: sec.color + "30" }} />
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sec.color + "15", color: sec.color }}>
              {grouped[sec.key].length}
            </span>
          </div>
          <div className="space-y-2">
            {grouped[sec.key].map(lead => {
              const pb = priorityBadge(lead.priority);
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onOpen(lead.id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  whileHover={{ x: 3 }}
                >
                  {/* Timeline dot */}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sec.color }} />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold truncate" style={{ color: "#16163f" }}>{lead.company}</span>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0" style={{ background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>{lead.priority}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{lead.next_action}</div>
                  </div>
                  {/* Time */}
                  <div className="text-[10px] font-medium shrink-0" style={{ color: sec.color }}>
                    {lead.next_action_date}
                  </div>
                  {/* Score */}
                  <div className="text-xs font-bold shrink-0" style={{ color: "#9e3ffd" }}>{lead.priority_score}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

type ViewMode = "list" | "board" | "timeline";

export default function Queue() {
  const [selectedId, setSelectedId] = useState<string | null>(sortedLeads[0]?.id ?? null);
  const [filter, setFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const { t } = useI18n();

  const STAT_CHIPS = [
    { label: t("salesos.queue.stat_calls"), value: allStats.calls, icon: <Phone size={16} />, color: "#9e3ffd", trend: "↑ 12%" },
    { label: t("salesos.queue.stat_dms"), value: allStats.dms, icon: <Users size={16} />, color: "#16a34a", trend: "↑ 7%" },
    { label: t("salesos.queue.stat_requested"), value: allStats.requested, icon: <FileText size={16} />, color: "#d97706" },
    { label: t("salesos.queue.stat_received"), value: allStats.received, icon: <FileCheck size={16} />, color: "#2563eb" },
    { label: t("salesos.queue.stat_callbacks"), value: allStats.callbacks, icon: <Clock size={16} />, color: "#dc2626" },
  ];

  const filtered = (filter === "all" ? sortedLeads : sortedLeads.filter(l => l.assigned_to === filter))
    .filter(l => !search || l.company.toLowerCase().includes(search.toLowerCase()) || (l.dm_name ?? "").toLowerCase().includes(search.toLowerCase()));

  const selectedLead = filtered.find(l => l.id === selectedId) ?? null;

  return (
    <SalesOSLayout>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div
          className="shrink-0 px-6 py-4 border-b"
          style={{ borderColor: "#E8EAED", background: "#FFFFFF" }}
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>{t("salesos.queue.title")}</h1>
              <div className="text-sm" style={{ color: "#9CA3AF" }}>{filtered.length} {t("salesos.queue.subtitle")}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Owner filter */}
              {["all", "Elayne Nunes", "Thaina Domet"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filter === f ? "rgba(158,63,253,0.08)" : "#F8F9FC",
                    color: filter === f ? "#9e3ffd" : "#6B7280",
                    border: filter === f ? "1px solid rgba(158,63,253,0.25)" : "1px solid #E8EAED",
                  }}
                >
                  {f === "all" ? t("salesos.common.all") : f.split(" ")[0]}
                </button>
              ))}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-2"
                style={{ background: "#9e3ffd", color: "#fff", boxShadow: "0 2px 8px rgba(158,63,253,0.25)" }}
              >
                <Plus size={12} /> Criar Lead
              </button>
            </div>
          </div>

          {/* Stat chips — Salezy style */}
          <div className="flex gap-3 flex-wrap">
            {STAT_CHIPS.map((chip, i) => (
              <StatChip key={chip.label} {...chip} />
            ))}
          </div>
        </div>

        {/* Clear banner */}
        <AnimatePresence>
          {highPriorityClear && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-6 py-3"
              style={{ background: "#dcfce7", borderBottom: "1px solid #bbf7d0" }}
            >
              <CheckCircle size={16} style={{ color: "#16a34a" }} />
              <span className="text-sm font-medium" style={{ color: "#16a34a" }}>{t("salesos.queue.clear_banner")}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + view toggle toolbar */}
        <div
          className="shrink-0 flex items-center gap-3 px-6 py-3 border-b"
          style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-xl" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <Search size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar na fila..."
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "#374151" }}
            />
          </div>

          {/* Filter chips */}
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            <SlidersHorizontal size={12} /> Filtros <ChevronDown size={10} />
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-xl overflow-hidden ml-auto" style={{ border: "1px solid #E8EAED" }}>
            {([
              { mode: "list" as ViewMode, icon: <List size={13} />, label: "Lista" },
              { mode: "board" as ViewMode, icon: <LayoutGrid size={13} />, label: "Board" },
              { mode: "timeline" as ViewMode, icon: <Calendar size={13} />, label: "Timeline" },
            ] as const).map(v => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: viewMode === v.mode ? "#9e3ffd" : "#FFFFFF",
                  color: viewMode === v.mode ? "#fff" : "#6B7280",
                }}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content — switches by viewMode */}
        {viewMode === "board" && <BoardView leads={filtered} onOpen={id => navigate(`/sales-os/leads/${id}`)} />}
        {viewMode === "timeline" && <TimelineView leads={filtered} onOpen={id => navigate(`/sales-os/leads/${id}`)} />}
        {viewMode === "list" && (
          <div className="flex flex-1 overflow-hidden">
            {/* List */}
            <div
              className="overflow-y-auto p-4 space-y-3"
              style={{ width: "62%", borderRight: "1px solid #E8EAED" }}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                    <AlertTriangle size={24} style={{ color: "#D1D5DB" }} />
                  </div>
                  <div className="text-sm font-medium" style={{ color: "#9CA3AF" }}>{t("salesos.queue.no_leads")}</div>
                </div>
              ) : (
                filtered.map((lead, i) => (
                  <QueueItem
                    key={lead.id}
                    lead={lead}
                    index={i}
                    selected={lead.id === selectedId}
                    onClick={() => setSelectedId(lead.id)}
                  />
                ))
              )}
            </div>

            {/* Preview panel — minimal, no internal scroll */}
            <div
              className="shrink-0"
              style={{ width: "38%", background: "#FFFFFF", overflowY: "hidden" }}
            >
              <PreviewPanel lead={selectedLead} />
            </div>
          </div>
        )}
      </div>
    </SalesOSLayout>
  );
}
