import { useState } from "react";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  TOTAL_BURN, calcMRR, calcAvgTicket, calcClientsForBreakEven,
  calcMonthlyDeficit, calcRunwayMonths,
} from "@/data/financialConfig";
import { mockOscarLeads } from "@/data/mockOscarLeads";
import {
  CheckCircle, AlertTriangle, TrendingUp, Users, Zap,
  Volume2, Target, ExternalLink, X, Info,
} from "lucide-react";

const fmtBRL = (n: number) =>
  "R$\u00A0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MRR      = calcMRR();
const avg      = calcAvgTicket();
const deficit  = calcMonthlyDeficit();
const runway   = calcRunwayMonths();
const needed   = calcClientsForBreakEven();
const pctBurn  = Math.round((MRR / TOTAL_BURN) * 100);
const devPct   = Math.round((40500 / TOTAL_BURN) * 100);
const activeClients = 6;

const meetingLeads = mockOscarLeads.filter(l => l.status === "Reunião Marcada");
const combinedPortfolio = meetingLeads.reduce((sum, l) => {
  const m = l.estimatedPortfolio.match(/(\d[\d.]+)/);
  return sum + (m ? parseInt(m[1].replace(/\./g,"")) : 0);
}, 0);

const highValueReplacement = Math.round(30000 / avg * 0.11);

const CARDS: {
  id: string;
  urgency: "green" | "amber" | "red";
  icon: React.ReactNode;
  title: string;
  trigger: string;
  body: string;
  action: string;
  actionPath?: string;
  dismissLabel?: string;
}[] = [
  {
    id: "runway",
    urgency: "green",
    icon: <CheckCircle size={16} />,
    title: "Runway is Healthy",
    trigger: `Calculated runway: ${runway} months with ${fmtBRL(1269000)} available`,
    body: `With the confirmed investment, runway is ${runway} months at the current burn rate. Enough time for the plan to work if execution is strong. The focus now is accelerating lead conversion before this buffer runs out.`,
    action: "View Detailed Forecast",
    actionPath: "/sales-os/finance/previsao",
  },
  {
    id: "mrr-gap",
    urgency: "red",
    icon: <AlertTriangle size={16} />,
    title: "MRR Gap vs Break-Even",
    trigger: `Current MRR ${fmtBRL(MRR)} = ${pctBurn}% of monthly burn`,
    body: `Current MRR of ${fmtBRL(MRR)} covers ${pctBurn}% of the monthly burn. ${needed} clients are needed at the current avg. ticket of ${fmtBRL(Math.round(avg))} to break even. ${needed - activeClients} more clients to go. Every week of strong execution shortens that number.`,
    action: "View Conversion Pipeline",
    actionPath: "/sales-os/health",
  },
  {
    id: "team-decision",
    urgency: "amber",
    icon: <Users size={16} />,
    title: "Team Decision Pending",
    trigger: "Rep performance below target for 2+ weeks",
    body: `Elayne and Thaina cost ${fmtBRL(9000)}/month fixed + commissions. Sales OS goes live this week. Give the system 3 full weeks of operation before making any decision. Clear threshold: 1.5 bills/day each with Sales OS running.`,
    action: "View Rep Performance",
    actionPath: "/sales-os/performance",
    dismissLabel: "Postpone 3 weeks",
  },
  {
    id: "dev-milestone",
    urgency: "amber",
    icon: <Zap size={16} />,
    title: "Dev Team Milestone",
    trigger: `Dev Team = ${devPct}% of total burn (${fmtBRL(40500)}/month)`,
    body: `${fmtBRL(40500)}/month in dev represents ${devPct}% of total burn. Reduction to ${fmtBRL(20250)} expected in ~2 months after Sales OS and MT delivery. Validate the delivery timeline this week to confirm the runway projection.`,
    action: "Confirm Timeline",
    dismissLabel: "Postpone 2 weeks",
  },
  {
    id: "oscar-pipeline",
    urgency: "green",
    icon: <Target size={16} />,
    title: "Oscar Pipeline Has Traction",
    trigger: `${meetingLeads.length} meetings scheduled with potential agents`,
    body: `${meetingLeads.length} meetings scheduled with potential agents. Combined estimated portfolio: ~${combinedPortfolio.toLocaleString("en-GB")} business clients. First active agent = recurring revenue with near-zero marginal cost. High priority this week.`,
    action: "View Oscar Pipeline",
    actionPath: "/sales-os/oscar/pipeline",
  },
  {
    id: "publicidade",
    urgency: "green",
    icon: <Volume2 size={16} />,
    title: "Advertising Correctly Paused",
    trigger: "Advertising: R$8,000/month — inactive",
    body: `${fmtBRL(8000)}/month correctly paused. Don't activate before proven conversion with Sales OS. Suggested test: ${fmtBRL(2000)}/month when reps consistently hit 1.5 bills/day for 2 weeks straight.`,
    action: "Remind in 30 days",
  },
  {
    id: "alto-valor",
    urgency: "amber",
    icon: <TrendingUp size={16} />,
    title: "Focus on High-Value Clients",
    trigger: `Current avg. ticket: ${fmtBRL(Math.round(avg))}/client/month`,
    body: `Current avg. ticket: ${fmtBRL(Math.round(avg))}/client/month. To accelerate break-even, prioritise prospects with monthly consumption above ${fmtBRL(30000)}. Each high-consumption client replaces up to ${highValueReplacement} avg-ticket clients — ${highValueReplacement}× the runway impact.`,
    action: "View High-Value Leads",
    actionPath: "/sales-os/queue",
  },
];

const URGENCY_CFG = {
  green: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", borderLeft: "#16a34a", tagBg: "#dcfce7" },
  amber: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", borderLeft: "#f59e0b", tagBg: "#fef3c7" },
  red:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", borderLeft: "#dc2626", tagBg: "#fee2e2" },
};

export default function Decisoes() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = CARDS.filter(c => !dismissed.has(c.id));

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Decisions — Financial Intelligence</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                Recommendations generated automatically from real company data.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                <AlertTriangle size={11} />
                {CARDS.filter(c => c.urgency === "red").length} critical
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                <AlertTriangle size={11} />
                {CARDS.filter(c => c.urgency === "amber").length} watch
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                <CheckCircle size={11} />
                {CARDS.filter(c => c.urgency === "green").length} positive
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {dismissed.size > 0 && (
            <div className="text-xs text-center py-2" style={{ color: "#9CA3AF" }}>
              {dismissed.size} card{dismissed.size > 1 ? "s" : ""} archived.{" "}
              <button onClick={() => setDismissed(new Set())} style={{ color: "#9e3ffd" }}>Restore all</button>
            </div>
          )}

          {visible.map(card => {
            const cfg = URGENCY_CFG[card.urgency];
            return (
              <div key={card.id} className="rounded-xl overflow-hidden"
                style={{ background: "#FFFFFF", border: "1px solid #E8EAED", borderLeft: `4px solid ${cfg.borderLeft}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}>
                    <span style={{ color: cfg.color }}>{card.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "#16163f" }}>{card.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                        style={{ background: cfg.tagBg, color: cfg.color }}>
                        {card.urgency === "green" ? "Positive" : card.urgency === "amber" ? "Watch" : "Critical"}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 mb-2">
                      <Info size={11} className="shrink-0 mt-0.5" style={{ color: "#9CA3AF" }} />
                      <span className="text-[11px] italic" style={{ color: "#9CA3AF" }}>{card.trigger}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{card.body}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => card.actionPath && navigate(card.actionPath)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                      <ExternalLink size={11} />
                      {card.action}
                    </button>
                    <button
                      onClick={() => setDismissed(d => new Set([...d, card.id]))}
                      className="flex items-center gap-1 text-[10px] font-medium"
                      style={{ color: "#9CA3AF" }}
                    >
                      <X size={10} /> {card.dismissLabel ?? "Archive"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="text-center pt-2">
            <button className="text-xs underline" style={{ color: "#9CA3AF" }}>
              Financial Settings — update costs, investment timeline, and scenario assumptions
            </button>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
