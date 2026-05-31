import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { QueueItem } from "@/components/sales/QueueItem";
import { mockLeads, priorityConfig, mockRepStats, type Lead } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import { Phone, Users, FileText, FileCheck, Clock, AlertTriangle, CheckCircle, Building2 } from "lucide-react";

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

function PreviewPanel({ lead }: { lead: Lead | null }) {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  if (!lead) return (
    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "rgba(255,255,255,0.2)" }}>
      <Building2 size={32} />
      <span className="text-sm">{t("salesos.queue.select_lead")}</span>
    </div>
  );

  const pConf = priorityConfig[lead.priority];
  return (
    <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold" style={{ color: "#fff" }}>{lead.company}</h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 text-white ${pConf.color}`}>{lead.priority}</span>
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.industry_segment} · {lead.city}/{lead.state}</div>
      </div>

      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{t("salesos.common.dm")}</div>
        {lead.dm_name ? (
          <div>
            <div className="text-sm font-semibold" style={{ color: "#fff" }}>{lead.dm_name}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.dm_role}</div>
          </div>
        ) : (
          <em className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{t("salesos.queue.dm_unknown")}</em>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("salesos.queue.priority")}</div>
        <span className={`text-xs font-semibold uppercase ${pConf.textColor}`}>{pConf.label}</span>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("salesos.queue.status")}</div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{lead.lead_status}</div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("salesos.queue.last_outcome")}</div>
        <div className="text-xs px-2 py-1 rounded inline-block" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>{lead.last_outcome}</div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("salesos.queue.next_action")}</div>
        <div className="text-xs" style={{ color: lead.next_action_overdue ? "#ef4444" : "rgba(255,255,255,0.65)" }}>
          {lead.next_action_overdue && "⏰ "}{lead.next_action_date}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{lead.next_action}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{t("salesos.queue.priority_score")}</div>
        <div className="text-sm font-bold" style={{ color: "#c88ff5" }}>{lead.priority_score}/100</div>
      </div>

      <button
        onClick={() => navigate(`/sales-os/leads/${lead.id}`)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "#9e3ffd", color: "#fff" }}
      >
        {t("salesos.queue.open_lead")}
      </button>
    </motion.div>
  );
}

export default function Queue() {
  const [selectedId, setSelectedId] = useState<string | null>(sortedLeads[0]?.id ?? null);
  const [filter, setFilter] = useState<string>("all");
  const { t } = useI18n();

  const STAT_CHIPS = [
    { key: "calls", label: t("salesos.queue.stat_calls"), value: allStats.calls, icon: <Phone size={13} />, color: "#9e3ffd" },
    { key: "dms", label: t("salesos.queue.stat_dms"), value: allStats.dms, icon: <Users size={13} />, color: "#22c55e" },
    { key: "req", label: t("salesos.queue.stat_requested"), value: allStats.requested, icon: <FileText size={13} />, color: "#f59e0b" },
    { key: "rec", label: t("salesos.queue.stat_received"), value: allStats.received, icon: <FileCheck size={13} />, color: "#3b82f6" },
    { key: "cb", label: t("salesos.queue.stat_callbacks"), value: allStats.callbacks, icon: <Clock size={13} />, color: "#ef4444" },
  ];

  const filtered = filter === "all" ? sortedLeads : sortedLeads.filter(l => l.assigned_to === filter);
  const selectedLead = filtered.find(l => l.id === selectedId) ?? null;

  return (
    <SalesOSLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="shrink-0 px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#fff" }}>{t("salesos.queue.title")}</h1>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{filtered.length} {t("salesos.queue.subtitle")}</div>
            </div>
            <div className="flex gap-2">
              {["all", "Elayne Nunes", "Thaina Domet"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filter === f ? "rgba(158,63,253,0.2)" : "rgba(255,255,255,0.05)",
                    color: filter === f ? "#c88ff5" : "rgba(255,255,255,0.45)",
                    border: filter === f ? "1px solid rgba(158,63,253,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {f === "all" ? t("salesos.common.all") : f.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {STAT_CHIPS.map(chip => (
              <div key={chip.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ color: chip.color }}>{chip.icon}</span>
                <span className="text-xs font-bold" style={{ color: "#fff" }}>{chip.value}</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {highPriorityClear && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-6 py-3"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={16} style={{ color: "#22c55e" }} />
              <span className="text-sm" style={{ color: "#86efac" }}>{t("salesos.queue.clear_banner")}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-1 overflow-hidden">
          <div className="overflow-y-auto p-4 space-y-3" style={{ width: "65%", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                <AlertTriangle size={28} />
                <div className="text-sm">{t("salesos.queue.no_leads")}</div>
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

          <div className="overflow-y-auto shrink-0" style={{ width: "35%" }}>
            <PreviewPanel lead={selectedLead} />
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
