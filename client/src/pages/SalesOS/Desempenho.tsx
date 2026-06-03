import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, CheckCircle, Circle, AlertTriangle,
  DollarSign, Users, GitBranch, Code2, Clock,
} from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const RENAN_COMPLIANCE = [
  { label: "Huddle diário realizado", pct: 70 },
  { label: "EOD report enviado",      pct: 60 },
  { label: "Pontualidade",            pct: 75 },
];

const RENAN_BILLS_TREND = [
  { week: "S1", contas: 4 }, { week: "S2", contas: 5 },
  { week: "S3", contas: 6 }, { week: "S4", contas: 5 },
  { week: "S5", contas: 7 }, { week: "S6", contas: 6 },
];

const ELAYNE_BILLS = [
  { week: "S1", contas: 6 }, { week: "S2", contas: 7 },
  { week: "S3", contas: 8 }, { week: "S4", contas: 9 },
];
const THAINA_BILLS = [
  { week: "S1", contas: 5 }, { week: "S2", contas: 5 },
  { week: "S3", contas: 6 }, { week: "S4", contas: 6 },
];

const OSCAR_PARTNERSHIPS = [
  { name: "Construtora Alpha",       status: "Ativo",       leads: 8, converted: 3, revenue: 11200, roi: "2.8x", statusColor: "#16a34a" },
  { name: "Grupo Beta Industrial",   status: "Em Conversa", leads: 4, converted: 1, revenue:  3200, roi: "0.8x", statusColor: "#f59e0b" },
  { name: "Imobiliária Delta",       status: "Prospecção",  leads: 1, converted: 0, revenue:     0, roi: "—",    statusColor: "#9CA3AF" },
];

const OSCAR_AGENT_STAGES = [
  { stage: "Prospecção",  count: 8 },
  { stage: "Em Conversa", count: 5 },
  { stage: "Reunião",     count: 3 },
  { stage: "Proposta",    count: 2 },
  { stage: "Ativo",       count: 1 },
];

const PROJECTS = [
  {
    name: "Sales OS", delivery: "Esta semana", status: "Em progresso", statusColor: "#f59e0b",
    deliverables: [
      { label: "Zoho integration",   done: true  },
      { label: "Call Assist",        done: false },
      { label: "Queue page",         done: true  },
      { label: "Renan console",      done: true  },
      { label: "Oscar portal",       done: false },
      { label: "Finance OS",         done: true  },
    ],
  },
  {
    name: "MT (Mercado Transparente)", delivery: "2 semanas", status: "Em progresso", statusColor: "#9e3ffd",
    deliverables: [
      { label: "Listagem de preços", done: true  },
      { label: "Comparativo",        done: false },
      { label: "Lead capture",       done: false },
    ],
  },
  {
    name: "SOP Agents", delivery: "3 semanas", status: "Em progresso", statusColor: "#16a34a",
    deliverables: [
      { label: "12 de 14 agentes construídos", done: false },
      { label: "Testes de qualidade",          done: false },
      { label: "Deploy produção",              done: false },
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
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
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
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>Avaliação do Agente</div>
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
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Desempenho da Equipa</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>Callum · {todayDate}</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(217,119,6,0.08)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              CEO View
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Section 1: Renan ─────────────────────────────────────────── */}
          <SectionCard title="Renan — Gestor" icon={Users} color="#9e3ffd">
            {/* Header row */}
            <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}>R</div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Renan</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>Gerente · 8 meses no cargo</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm" style={{ color: "#16163f" }}>R$ 12.000</div>
                <div className="text-[10px]" style={{ color: "#9CA3AF" }}>custo mensal</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Compliance */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#C4C8D4" }}>Compliance Operacional</div>
                <div className="space-y-3">
                  {RENAN_COMPLIANCE.map(c => <ComplianceBar key={c.label} {...c} />)}
                </div>
              </div>

              {/* Bills trend chart */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#C4C8D4" }}>Contas da Equipa / Semana</div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={RENAN_BILLS_TREND} barSize={14}>
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #E8EAED", borderRadius: 8 }} />
                    <Bar dataKey="contas" fill="#9e3ffd" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Management output */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <MiniMetric label="Aprovações perdidas accionadas" value="85%" sub="dentro de 24h" color="#16a34a" />
              <MiniMetric label="Reuniões de parcerias" value="3" sub="este mês" />
              <MiniMetric label="Check-ins Oscar" value="2 / 4" sub="este mês" color="#f59e0b" />
              <MiniMetric label="Ratio QA (resolvidos/criados)" value="0.8x" sub="target ≥1x" color="#dc2626" />
            </div>

            <VerdictCard
              text="Gestão em desenvolvimento — compliance operacional abaixo do esperado mas output comercial (parcerias) é o ponto mais forte. Foco: disciplina de relatórios."
              color="#9e3ffd"
            />
          </SectionCard>

          {/* ── Section 2: Elayne & Thaina ───────────────────────────────── */}
          <SectionCard title="Vendas — Elayne e Thaina" icon={TrendingUp} color="#3b82f6">
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  name: "Elayne", initial: "E", weeks: 6, cost: 4500,
                  bills: ELAYNE_BILLS, dms: 18, conversion: "50%",
                  qa: 7.2, briefing: "68%", callbacks: 1,
                  verdict: "Melhorando — pedido de conta mais consistente. Uso do briefing ainda abaixo da meta.",
                  verdictColor: "#16a34a",
                },
                {
                  name: "Thaina", initial: "T", weeks: 6, cost: 4500,
                  bills: THAINA_BILLS, dms: 15, conversion: "40%",
                  qa: 6.8, briefing: "55%", callbacks: 3,
                  verdict: "Estável mas abaixo da meta. Padrão de callbacks perdidos persiste.",
                  verdictColor: "#f59e0b",
                },
              ].map(rep => (
                <div key={rep.name} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff" }}>{rep.initial}</div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "#16163f" }}>{rep.name}</div>
                      <div className="text-[10px]" style={{ color: "#9CA3AF" }}>SDR · {rep.weeks} semanas · R$ {rep.cost.toLocaleString("pt-BR")}/mês</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#C4C8D4" }}>Contas/semana (4 semanas)</div>
                    <ResponsiveContainer width="100%" height={70}>
                      <BarChart data={rep.bills} barSize={12}>
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #E8EAED", borderRadius: 8 }} />
                        <Bar dataKey="contas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "DMs/semana",      v: rep.dms.toString() },
                      { l: "Taxa DM→Conta",   v: rep.conversion },
                      { l: "Score QA médio",  v: rep.qa.toFixed(1) + " / 10" },
                      { l: "Uso do briefing", v: rep.briefing },
                      { l: "Callbacks perdidos", v: rep.callbacks.toString(), alert: rep.callbacks > 2 },
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

            {/* Combined + Firing threshold */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <MiniMetric label="MRR total gerado pelas reps" value="R$ 8.400" sub="contas de Elayne + Thaina" color="#3b82f6" />
              <MiniMetric label="Receita por R$ de salário" value="0.93x" sub="target ≥1x para break-even" color="#f59e0b" />
              <MiniMetric label="Tendência (4 semanas)" value="↗ Melhorando" sub="+12% contas vs mês anterior" color="#16a34a" />
            </div>

            {/* Firing threshold */}
            <div className="mt-4 rounded-xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} style={{ color: "#d97706" }} />
                <div className="text-xs font-bold" style={{ color: "#d97706" }}>Firing Threshold Tracker</div>
              </div>
              <p className="text-xs" style={{ color: "#374151" }}>
                Threshold: 1,5 contas/dia com Sales OS ativo por 3 semanas consecutivas.
                Sales OS entra em produção esta semana. <strong>Semana 0 de 3.</strong>
              </p>
            </div>
          </SectionCard>

          {/* ── Section 3: Oscar ─────────────────────────────────────────── */}
          <SectionCard title="Oscar — Parcerias e Agentes" icon={GitBranch} color="#16a34a">
            <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)", color: "#fff" }}>O</div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Oscar</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>Parceiro · R$ 4.000/mês + comissões</div>
              </div>
            </div>

            {/* Partnership table */}
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#C4C8D4" }}>Pipeline de Parcerias</div>
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E8EAED" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#F8F9FC", borderBottom: "1px solid #E8EAED" }}>
                    {["Parceiro", "Status", "Leads", "Convertidos", "MRR Gerado", "ROI"].map(h => (
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
                          style={{ background: `${p.statusColor}15`, color: p.statusColor }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5" style={{ color: "#374151" }}>{p.leads}</td>
                      <td className="px-3 py-2.5" style={{ color: "#374151" }}>{p.converted}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: "#16163f" }}>
                        {p.revenue > 0 ? `R$ ${p.revenue.toLocaleString("pt-BR")}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: p.roi === "—" ? "#9CA3AF" : p.roi.startsWith("2") ? "#16a34a" : "#f59e0b" }}>{p.roi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] mb-4 italic" style={{ color: "#9CA3AF" }}>
              Em produção: cruzado com coluna Source do Google Sheets quando Alexandre adicionar.
            </div>

            {/* Agent pipeline */}
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#C4C8D4" }}>Pipeline de Agentes</div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {OSCAR_AGENT_STAGES.map(s => (
                <div key={s.stage} className="rounded-xl p-3 text-center" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="text-lg font-bold" style={{ color: "#16163f" }}>{s.count}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{s.stage}</div>
                </div>
              ))}
            </div>

            {/* ROI card */}
            <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="text-xs font-bold mb-1" style={{ color: "#16a34a" }}>Projeção ROI — Primeiro Agente Ativo</div>
              <p className="text-xs" style={{ color: "#374151" }}>
                Se primeiro agente activar com portfólio médio de 50 clientes: <strong>+R$ 17.500 receita estimada/mês</strong>.
                Payback do custo Oscar em <strong>3 meses</strong>.
              </p>
              <div className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Activação esperada: próximas 3 semanas (Construtora Alpha)</div>
            </div>
          </SectionCard>

          {/* ── Section 4: Dev Team ──────────────────────────────────────── */}
          <SectionCard title="Dev Team — Milestones" icon={Code2} color="#6366f1">
            <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>Dev Team</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>R$ 40.500/mês → redução para R$ 20.250 em ~2 meses</div>
              </div>
              <div className="rounded-lg px-3 py-1.5" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
                <div className="text-xs font-bold" style={{ color: "#d97706" }}>Redução prevista</div>
                <div className="text-[10px]" style={{ color: "#92400e" }}>R$ 20.250 poupados/mês</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {PROJECTS.map(p => (
                <div key={p.name} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-sm" style={{ color: "#16163f" }}>{p.name}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${p.statusColor}15`, color: p.statusColor }}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-3 text-[11px]" style={{ color: "#9CA3AF" }}>
                    <Clock size={11} />
                    <span>Entrega: {p.delivery}</span>
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

            {/* Cost efficiency */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <MiniMetric label="Custo por milestone (estimado)" value="R$ 6.750" sub="6 milestones/mês esperados" />
              <MiniMetric label="Entregues este mês" value="4 de 12" sub="Sales OS + Finance OS" color="#f59e0b" />
              <MiniMetric label="Velocidade de entrega" value="33%" sub="abaixo do planejado — monitorar" color="#dc2626" />
            </div>
          </SectionCard>
        </div>
      </div>
    </SalesOSLayout>
  );
}
