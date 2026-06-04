import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { ArrowUp, ArrowDown, Minus, Zap, TrendingUp, AlertTriangle } from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const FUNNEL_STAGES = [
  { label: "Julia leads this week", count: 24, pct: 100, drop: null,  color: "#9e3ffd", bigDrop: false },
  { label: "Qualified",             count: 18, pct:  75, drop:   25,  color: "#7c3aed", bigDrop: false },
  { label: "DM Identified",         count: 14, pct:  78, drop:   22,  color: "#6366f1", bigDrop: false },
  { label: "DM Reached",            count:  8, pct:  57, drop:   43,  color: "#f59e0b", bigDrop: true  },
  { label: "Bill Requested",        count:  5, pct:  63, drop:   37,  color: "#f97316", bigDrop: false },
  { label: "Bill Received",         count:  3, pct:  60, drop:   40,  color: "#ef4444", bigDrop: false },
  { label: "Client Signed",         count:  1, pct:  33, drop:   67,  color: "#dc2626", bigDrop: false },
];

const TREND_DATA = [
  { week: "W1", julia: 18, qualified: 13, dmReached: 6,  billReq: 3, billRecv: 2, signed: 0 },
  { week: "W2", julia: 20, qualified: 15, dmReached: 7,  billReq: 4, billRecv: 2, signed: 0 },
  { week: "W3", julia: 19, qualified: 14, dmReached: 7,  billReq: 4, billRecv: 3, signed: 1 },
  { week: "W4", julia: 22, qualified: 16, dmReached: 8,  billReq: 5, billRecv: 3, signed: 0 },
  { week: "W5", julia: 21, qualified: 16, dmReached: 8,  billReq: 5, billRecv: 3, signed: 1 },
  { week: "W6", julia: 24, qualified: 18, dmReached: 8,  billReq: 5, billRecv: 3, signed: 1 },
];

const STAGE_COLORS: Record<string, string> = {
  julia: "#9e3ffd", qualified: "#6366f1", dmReached: "#f59e0b",
  billReq: "#f97316", billRecv: "#ef4444", signed: "#16a34a",
};
const STAGE_LABELS: Record<string, string> = {
  julia: "Julia Leads", qualified: "Qualified", dmReached: "DM Reached",
  billReq: "Bill Requested", billRecv: "Bill Received", signed: "Signed",
};

export default function Crescimento() {
  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Growth — Funnel</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {todayDate}</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              CEO View
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Funnel */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="font-bold text-sm mb-4" style={{ color: "#16163f" }}>This Week's Funnel</div>
            <div className="space-y-2">
              {FUNNEL_STAGES.map((stage, i) => {
                const barWidth = Math.max(15, stage.count / FUNNEL_STAGES[0].count * 100);
                return (
                  <div key={stage.label}>
                    <div className="flex items-center gap-3">
                      <div className="w-40 text-xs text-right shrink-0" style={{ color: "#6B7280" }}>{stage.label}</div>
                      <div className="flex-1 h-9 rounded-lg flex items-center px-3 relative overflow-hidden"
                        style={{ background: "#F8F9FC" }}>
                        <div className="absolute left-0 top-0 h-full rounded-lg opacity-20"
                          style={{ width: `${barWidth}%`, background: stage.color }} />
                        <span className="relative z-10 font-bold text-sm" style={{ color: stage.color }}>{stage.count}</span>
                        {stage.bigDrop && (
                          <span className="relative z-10 ml-3 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                            Biggest drop here — {stage.drop}% drop-off
                          </span>
                        )}
                      </div>
                      <div className="w-24 shrink-0 flex items-center gap-1">
                        {stage.drop !== null && (
                          <span className="text-xs font-semibold" style={{ color: stage.bigDrop ? "#dc2626" : "#9CA3AF" }}>
                            {stage.pct}% conv.
                          </span>
                        )}
                      </div>
                    </div>
                    {i < FUNNEL_STAGES.length - 1 && (
                      <div className="flex items-center gap-3 my-0.5">
                        <div className="w-40" />
                        <div className="px-3">
                          <div className="h-3 w-px" style={{ background: "#E8EAED" }} />
                          {!stage.bigDrop && stage.drop !== null && (
                            <span className="text-[10px]" style={{ color: "#D1D5DB" }}>↓ {100 - stage.pct}% drop</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6-week trend */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="font-bold text-sm mb-4" style={{ color: "#16163f" }}>6-Week Trend by Stage</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #E8EAED", borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => STAGE_LABELS[value] ?? value} />
                {Object.keys(STAGE_COLORS).map(key => (
                  <Line key={key} type="monotone" dataKey={key}
                    stroke={STAGE_COLORS[key]} strokeWidth={2} dot={{ r: 3, fill: STAGE_COLORS[key] }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} style={{ color: "#9e3ffd" }} />
                <div className="font-bold text-sm" style={{ color: "#16163f" }}>Julia Efficiency</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Leads released",          value: "24",       sub: "this week" },
                  { label: "Cost per qualified lead",  value: "R$ ~280",  sub: "estimated (mock)" },
                  { label: "Quality score",            value: "7.5 / 10", sub: "75% approved" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                    <div className="text-[10px] mb-1" style={{ color: "#9CA3AF" }}>{m.label}</div>
                    <div className="text-sm font-bold" style={{ color: "#16163f" }}>{m.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} style={{ color: "#16a34a" }} />
                <div className="font-bold text-sm" style={{ color: "#16163f" }}>Sales OS Impact</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto font-semibold"
                  style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                  Week 0
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Pre Sales OS (wks 1–2)",   value: "5.2", sub: "bills/week (avg)" },
                  { label: "With Sales OS (wks 3+)",   value: "—",   sub: "still measuring" },
                  { label: "Expected improvement",     value: "+30%", sub: "internal target" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                    <div className="text-[10px] mb-1" style={{ color: "#9CA3AF" }}>{m.label}</div>
                    <div className="text-sm font-bold" style={{ color: "#16163f" }}>{m.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={11} style={{ color: "#d97706" }} />
                  <p className="text-[11px]" style={{ color: "#92400e" }}>
                    Sales OS goes live this week — real data available from week 3 onwards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
