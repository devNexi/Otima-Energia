import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const TEAM = [
  {
    name: "Construtora Alpha (via Oscar)", role: "Partnership — top performer",
    cost: 0, revenueAttr: 11200, roi: "∞", trend: "Improving", trendColor: "#16a34a",
    output: "8 leads → 3 clients", note: "No fixed cost — variable commission",
    gradient: "linear-gradient(135deg,#16a34a,#059669)", initial: "CA",
  },
  {
    name: "Elayne", role: "SDR",
    cost: 4500, revenueAttr: 4200, roi: "0.93x", trend: "Improving", trendColor: "#16a34a",
    output: "9 bills/week (avg last 4 weeks)", note: null,
    gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)", initial: "E",
  },
  {
    name: "Thaina", role: "SDR",
    cost: 4500, revenueAttr: 4200, roi: "0.93x", trend: "Stable", trendColor: "#f59e0b",
    output: "6 bills/week (avg last 4 weeks)", note: null,
    gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)", initial: "T",
  },
  {
    name: "Renan", role: "Manager",
    cost: 12000, revenueAttr: 8400, roi: "0.70x", trend: "Below target", trendColor: "#f59e0b",
    output: "Team management + 3 partnerships this month", note: "ROI improves with team scale",
    gradient: "linear-gradient(135deg,#9e3ffd,#df0af2)", initial: "R",
  },
  {
    name: "Oscar", role: "Partner",
    cost: 4000, revenueAttr: 11200, roi: "2.80x", trend: "Improving", trendColor: "#16a34a",
    output: "3 active partnerships · R$ 35k pipeline", note: "Includes estimated commissions",
    gradient: "linear-gradient(135deg,#16a34a,#059669)", initial: "O",
  },
  {
    name: "Alexandre", role: "Ops",
    cost: 8500, revenueAttr: 0, roi: "Indirect", trend: "Stable", trendColor: "#9CA3AF",
    output: "Ops stability · pipeline support", note: "Indirect ROI via proposal delivery and pipeline support",
    gradient: "linear-gradient(135deg,#64748b,#94a3b8)", initial: "A",
  },
  {
    name: "Dev Team", role: "Development",
    cost: 40500, revenueAttr: 0, roi: "Investment", trend: "Critical", trendColor: "#dc2626",
    output: "4 milestones delivered (Sales OS, Finance OS…)", note: "Reduction to R$20,250 in ~2 months",
    gradient: "linear-gradient(135deg,#6366f1,#818cf8)", initial: "DT",
  },
];

const TOTAL_MRR    = 19900;
const BREAKEVEN    = 138100;
const TEAM_ROI_PCT = Math.round((TOTAL_MRR / BREAKEVEN) * 100);

function TrendChip({ trend, color }: { trend: string; color: string }) {
  const icon = trend === "Improving" ? <TrendingUp size={10} />
    : trend === "Below target" || trend === "Critical" ? <TrendingDown size={10} />
    : <Minus size={10} />;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${color}15`, color }}>
      {icon}{trend}
    </span>
  );
}

export default function Equipa() {
  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Team — ROI</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {todayDate}</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              CEO View
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Amber banner */}
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: "#d97706" }}>Pending action</div>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                Alexandre needs to add a <strong>Source</strong> column to the client Google Sheet
                (values: Julia / Partnership / Direct / Oscar / Other). Once added, all ROI calculations
                by source become automatic.
              </p>
            </div>
          </div>

          {/* Total team cost card */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Total team cost/month</div>
                <div className="text-2xl font-bold" style={{ color: "#dc2626" }}>R$ {BREAKEVEN.toLocaleString("en-GB")}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>fixed headcount</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>MRR today</div>
                <div className="text-2xl font-bold" style={{ color: "#9e3ffd" }}>R$ {TOTAL_MRR.toLocaleString("en-GB")}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>14% of burn</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Current team ROI</div>
                <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{TEAM_ROI_PCT}%</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>target: 100% (break-even)</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>MRR for break-even</div>
                <div className="text-2xl font-bold" style={{ color: "#16163f" }}>R$ {BREAKEVEN.toLocaleString("en-GB")}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#dc2626" }}>R$ {(BREAKEVEN - TOTAL_MRR).toLocaleString("en-GB")} remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: "#9CA3AF" }}>Burn coverage</span>
                <span className="font-semibold" style={{ color: "#f59e0b" }}>{TEAM_ROI_PCT}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <div className="h-full rounded-full" style={{ width: `${TEAM_ROI_PCT}%`, background: "linear-gradient(90deg,#f59e0b,#d97706)" }} />
              </div>
            </div>
          </div>

          {/* Team cards */}
          <div className="grid grid-cols-2 gap-4">
            {TEAM.map(m => (
              <div key={m.name} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: m.gradient, color: "#fff" }}>{m.initial}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm truncate" style={{ color: "#16163f" }}>{m.name}</div>
                      <TrendChip trend={m.trend} color={m.trendColor} />
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{m.role}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg p-2.5" style={{ background: "#fef2f2", border: "1px solid #fee2e2" }}>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Fixed cost/month</div>
                    <div className="text-sm font-bold" style={{ color: "#dc2626" }}>
                      {m.cost > 0 ? `R$ ${m.cost.toLocaleString("en-GB")}` : "R$ 0 (variable)"}
                    </div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Attributable revenue</div>
                    <div className="text-sm font-bold" style={{ color: "#16a34a" }}>
                      {m.revenueAttr > 0 ? `R$ ${m.revenueAttr.toLocaleString("en-GB")}` : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>ROI</div>
                    <div className="text-sm font-bold" style={{ color: "#d97706" }}>{m.roi}</div>
                  </div>
                </div>

                <div className="text-xs mb-2" style={{ color: "#374151" }}>
                  <span className="font-medium">Output: </span>{m.output}
                </div>
                {m.note && (
                  <div className="flex items-start gap-1.5 mt-2">
                    <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[11px] italic leading-relaxed" style={{ color: "#9CA3AF" }}>{m.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4 flex items-start gap-2" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
            <p className="text-[11px] italic" style={{ color: "#9CA3AF" }}>
              In production: revenue per person calculated automatically when the Source column is added to Google Sheets by Alexandre.
            </p>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
