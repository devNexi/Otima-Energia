import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle, Circle, AlertTriangle, Clock, Code2, GitBranch, TrendingUp, Users } from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const RENAN_COMPLIANCE = [
  { label: "Daily huddle completed",  pct: 70 },
  { label: "EOD report submitted",    pct: 60 },
  { label: "Punctuality",             pct: 75 },
];

const RENAN_BILLS_TREND = [
  { week: "W1", bills: 4 }, { week: "W2", bills: 5 },
  { week: "W3", bills: 6 }, { week: "W4", bills: 5 },
  { week: "W5", bills: 7 }, { week: "W6", bills: 6 },
];

const ELAYNE_BILLS = [{ week: "W1", bills: 6 }, { week: "W2", bills: 7 }, { week: "W3", bills: 8 }, { week: "W4", bills: 9 }];
const THAINA_BILLS = [{ week: "W1", bills: 5 }, { week: "W2", bills: 5 }, { week: "W3", bills: 6 }, { week: "W4", bills: 6 }];

const OSCAR_PARTNERSHIPS = [
  { name: "Construtora Alpha",     status: "Active",          leads: 8, converted: 3, revenue: 11200, roi: "2.8x", statusColor: "#16a34a" },
  { name: "Grupo Beta Industrial", status: "In Conversation", leads: 4, converted: 1, revenue:  3200, roi: "0.8x", statusColor: "#f59e0b" },
  { name: "Imobiliária Delta",     status: "Prospecting",     leads: 1, converted: 0, revenue:     0, roi: "—",    statusColor: "#9CA3AF" },
];

const OSCAR_AGENT_STAGES = [
  { stage: "Prospecting",    count: 8 },
  { stage: "In Conversation", count: 5 },
  { stage: "Meeting",        count: 3 },
  { stage: "Proposal",       count: 2 },
  { stage: "Active",         count: 1 },
];

const PROJECTS = [
  {
    name: "Sales OS", delivery: "This week", status: "In progress", statusColor: "#f59e0b",
    deliverables: [
      { label: "Zoho CRM integration",    done: true  },
      { label: "Call Assist (AI)",        done: false },
      { label: "Queue page",              done: true  },
      { label: "Renan Manager Console",   done: true  },
      { label: "Oscar Partner Portal",    done: false },
      { label: "Finance OS",              done: true  },
    ],
  },
  {
    name: "MT (Mercado Transparente)", delivery: "2 weeks", status: "In progress", statusColor: "#9e3ffd",
    deliverables: [
      { label: "Real-time price listing", done: true  },
      { label: "Supplier comparison",     done: false },
      { label: "Lead capture form",       done: false },
    ],
  },
  {
    name: "SOP Agents", delivery: "3 weeks", status: "In progress", statusColor: "#16a34a",
    deliverables: [
      { label: "12 of 14 agents built",   done: false },
      { label: "Quality testing (QA)",    done: false },
      { label: "Production deploy",       done: false },
    ],
  },
];

function ComplianceBar({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 90 ? "#16a34a" : pct >= 70 ? "#f59e0b" : "#dc2626";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "#374151" }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Target 100%</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, color = "#9e3ffd" }: {
  title: string; icon: React.ElementType; children: React.ReactNode; color?: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} style={{ color }} />
        <h2 className="font-bold text-sm" style={{ color: "#16163f" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function VerdictCard({ text, color = "#9e3ffd" }: { text: string; color?: string }) {
  return (
    <div className="rounded-xl p-3 mt-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>Agent Assessment</div>
      <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{text}</p>
    </div>
  );
}

function MiniMetric({ label, value, sub, color = "#374151" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
      <div className="text-xs font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>}
    </div>
  );
}

export default function Desempenho() {
  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Team Performance</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {todayDate}</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              CEO View
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Section 1: Renan ── */}
          <SectionCard title="Renan — Manager" icon={Users} color="#9e3ffd">
            <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}>R</div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Renan</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>Manager · 8 months in role</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm" style={{ color: "#16163f" }}>R$ 12,000</div>
                <div className="text-[10px]" style={{ color: "#9CA3AF" }}>monthly cost</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#C4C8D4" }}>Management Compliance</div>
                <div className="space-y-3">
                  {RENAN_COMPLIANCE.map(c => <ComplianceBar key={c.label} {...c} />)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#C4C8D4" }}>Team Bills / Week</div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={RENAN_BILLS_TREND} barSize={14}>
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #E8EAED", borderRadius: 8 }} />
                    <Bar dataKey="bills" fill="#9e3ffd" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4">
              <MiniMetric label="Lost approvals actioned" value="85%" sub="within 24h" color="#16a34a" />
              <MiniMetric label="Partnership meetings" value="3" sub="this month" />
              <MiniMetric label="Oscar check-ins" value="2 / 4" sub="this month" color="#f59e0b" />
              <MiniMetric label="QA ratio (resolved/created)" value="0.8x" sub="target ≥1x" color="#dc2626" />
            </div>

            <VerdictCard
              text="Management developing — operational compliance below expectations but commercial output (partnerships) is the strongest point. Focus: report discipline."
              color="#9e3ffd"
            />
          </SectionCard>

          {/* ── Section 2: Elayne & Thaina ── */}
          <SectionCard title="Sales — Elayne and Thaina" icon={TrendingUp} color="#3b82f6">
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  name: "Elayne", initial: "E", weeks: 6, cost: 4500,
                  bills: ELAYNE_BILLS, dms: 18, conversion: "50%",
                  qa: 7.2, briefing: "68%", callbacks: 1,
                  verdict: "Improving — bill requests more consistent. Briefing usage still below target.",
                  verdictColor: "#16a34a",
                },
                {
                  name: "Thaina", initial: "T", weeks: 6, cost: 4500,
                  bills: THAINA_BILLS, dms: 15, conversion: "40%",
                  qa: 6.8, briefing: "55%", callbacks: 3,
                  verdict: "Stable but below target. Pattern of missed callbacks persists.",
                  verdictColor: "#f59e0b",
                },
              ].map(rep => (
                <div key={rep.name} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff" }}>{rep.initial}</div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "#16163f" }}>{rep.name}</div>
                      <div className="text-[10px]" style={{ color: "#9CA3AF" }}>SDR · {rep.weeks} weeks · R$ {rep.cost.toLocaleString("en-GB")}/month</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#C4C8D4" }}>Bills/week (last 4 weeks)</div>
                    <ResponsiveContainer width="100%" height={70}>
                      <BarChart data={rep.bills} barSize={12}>
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #E8EAED", borderRadius: 8 }} />
                        <Bar dataKey="bills" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "DMs/week",          v: rep.dms.toString() },
                      { l: "DM→Bill rate",      v: rep.conversion },
                      { l: "Avg QA score",       v: rep.qa.toFixed(1) + " / 10" },
                      { l: "Briefing usage",     v: rep.briefing },
                      { l: "Missed callbacks",   v: rep.callbacks.toString(), alert: rep.callbacks > 2 },
                    ].map(m => (
                      <div key={m.l} className="rounded-lg px-2.5 py-2" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6" }}>
                        <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{m.l}</div>
                        <div className="text-xs font-bold" style={{ color: (m as any).alert ? "#dc2626" : "#16163f" }}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg p-2.5" style={{ background: `${rep.verdictColor}08`, border: `1px solid ${rep.verdictColor}20` }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#374151" }}>{rep.verdict}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <MiniMetric label="Total MRR from reps" value="R$ 8,400" sub="bills from Elayne + Thaina" color="#3b82f6" />
              <MiniMetric label="Revenue per R$ of salary" value="0.93x" sub="target ≥1x for break-even" color="#f59e0b" />
              <MiniMetric label="4-week trend" value="↗ Improving" sub="+12% bills vs last month" color="#16a34a" />
            </div>

            <div className="mt-4 rounded-xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} style={{ color: "#d97706" }} />
                <div className="text-xs font-bold" style={{ color: "#d97706" }}>Firing Threshold Tracker</div>
              </div>
              <p className="text-xs" style={{ color: "#374151" }}>
                Threshold: 1.5 bills/day with Sales OS active for 3 consecutive weeks.
                Sales OS goes live this week. <strong>Week 0 of 3.</strong>
              </p>
            </div>
          </SectionCard>

          {/* ── Section 3: Oscar ── */}
          <SectionCard title="Oscar — Partnerships & Agents" icon={GitBranch} color="#16a34a">
            <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)", color: "#fff" }}>O</div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Oscar</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>Partner · R$ 4,000/month + commissions</div>
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#C4C8D4" }}>Partnership Pipeline</div>
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E8EAED" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#F8F9FC", borderBottom: "1px solid #E8EAED" }}>
                    {["Partner", "Status", "Leads", "Converted", "MRR Generated", "ROI"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OSCAR_PARTNERSHIPS.map((p, i) => (
                    <tr key={p.name} style={{ borderBottom: i < OSCAR_PARTNERSHIPS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-3 py-2.5 font-medium" style={{ color: "#16163f" }}>{p.name}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `${p.statusColor}15`, color: p.statusColor }}>{p.status}</span>
                      </td>
                      <td className="px-3 py-2.5" style={{ color: "#374151" }}>{p.leads}</td>
                      <td className="px-3 py-2.5" style={{ color: "#374151" }}>{p.converted}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: "#16163f" }}>
                        {p.revenue > 0 ? `R$ ${p.revenue.toLocaleString("en-GB")}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: p.roi === "—" ? "#9CA3AF" : p.roi.startsWith("2") ? "#16a34a" : "#f59e0b" }}>{p.roi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] mb-4 italic" style={{ color: "#9CA3AF" }}>
              In production: will be cross-referenced with Source column in Google Sheets when Alexandre adds it.
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#C4C8D4" }}>Agent Pipeline</div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {OSCAR_AGENT_STAGES.map(s => (
                <div key={s.stage} className="rounded-xl p-3 text-center" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="text-lg font-bold" style={{ color: "#16163f" }}>{s.count}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{s.stage}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="text-xs font-bold mb-1" style={{ color: "#16a34a" }}>ROI Projection — First Active Agent</div>
              <p className="text-xs" style={{ color: "#374151" }}>
                If first agent activates with avg portfolio of 50 clients: <strong>+R$ 17,500 estimated revenue/month</strong>.
                Oscar cost payback in <strong>3 months</strong>.
              </p>
              <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Expected activation: next 3 weeks (Construtora Alpha)</div>
            </div>
          </SectionCard>

          {/* ── Section 4: Dev Team ── */}
          <SectionCard title="Dev Team — Milestones" icon={Code2} color="#6366f1">
            <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Dev Team</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>R$ 40,500/month → reduction to R$ 20,250 in ~2 months</div>
              </div>
              <div className="rounded-lg px-3 py-1.5" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
                <div className="text-xs font-bold" style={{ color: "#d97706" }}>Planned reduction</div>
                <div className="text-[10px]" style={{ color: "#92400e" }}>R$ 20,250 saved/month</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {PROJECTS.map(p => (
                <div key={p.name} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-sm" style={{ color: "#16163f" }}>{p.name}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${p.statusColor}15`, color: p.statusColor }}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3 text-[11px]" style={{ color: "#9CA3AF" }}>
                    <Clock size={11} />
                    <span>Delivery: {p.delivery}</span>
                  </div>
                  <div className="space-y-2">
                    {p.deliverables.map(d => (
                      <div key={d.label} className="flex items-center gap-2 text-xs">
                        {d.done
                          ? <CheckCircle size={13} style={{ color: "#16a34a", flexShrink: 0 }} />
                          : <Circle size={13} style={{ color: "#D1D5DB", flexShrink: 0 }} />}
                        <span style={{ color: d.done ? "#374151" : "#9CA3AF" }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <MiniMetric label="Est. cost per milestone" value="R$ 6,750" sub="6 milestones/month expected" />
              <MiniMetric label="Delivered this month" value="4 of 12" sub="Sales OS + Finance OS" color="#f59e0b" />
              <MiniMetric label="Delivery speed" value="33%" sub="below plan — monitor" color="#dc2626" />
            </div>
          </SectionCard>
        </div>
      </div>
    </SalesOSLayout>
  );
}
