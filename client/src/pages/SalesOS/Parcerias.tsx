import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { AlertTriangle, TrendingUp, Star, Info } from "lucide-react";

const todayDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const PARTNERSHIPS = [
  {
    name: "Construtora Alpha",
    type: "Co-venda",
    leadsSent: 12, leadsQual: 8, leadsConv: 3,
    mrrGerado: 11200, pipeline: 22400,
    roi: "2.8x", status: "Ativo", statusColor: "#16a34a",
    barColor: "#16a34a",
  },
  {
    name: "Grupo Beta Industrial",
    type: "Indicação",
    leadsSent: 6, leadsQual: 4, leadsConv: 1,
    mrrGerado: 3200, pipeline: 9600,
    roi: "0.8x", status: "Em Conversa", statusColor: "#f59e0b",
    barColor: "#f59e0b",
  },
  {
    name: "Imobiliária Delta",
    type: "Agente",
    leadsSent: 2, leadsQual: 1, leadsConv: 0,
    mrrGerado: 0, pipeline: 3200,
    roi: "—", status: "A iniciar", statusColor: "#9e3ffd",
    barColor: "#9e3ffd",
  },
  {
    name: "Rede Comercial Omega",
    type: "Indicação",
    leadsSent: 1, leadsQual: 0, leadsConv: 0,
    mrrGerado: 0, pipeline: 0,
    roi: "—", status: "Inativo", statusColor: "#9CA3AF",
    barColor: "#E8EAED",
  },
];

const totalMrr = PARTNERSHIPS.reduce((s, p) => s + p.mrrGerado, 0);
const totalLeads = PARTNERSHIPS.reduce((s, p) => s + p.leadsSent, 0);
const totalConv = PARTNERSHIPS.reduce((s, p) => s + p.leadsConv, 0);
const pctMrr = Math.round((totalMrr / 19900) * 100);

const chartData = PARTNERSHIPS.map(p => ({ name: p.name.split(" ")[0], mrr: p.mrrGerado, color: p.barColor }));

export default function Parcerias() {
  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Parcerias</h1>
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
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: "#d97706" }}>Ação pendente</div>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                Alexandre precisa adicionar coluna <strong>Source</strong> ao Google Sheets dos clientes
                (valores: Julia / Parceria / Direct / Oscar / Outro). Quando adicionada, todos os cálculos
                de ROI por fonte ficam automáticos.
              </p>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Parcerias activas", value: PARTNERSHIPS.filter(p => p.status === "Ativo").length.toString(), sub: "de 4 total", color: "#16a34a" },
              { label: "MRR gerado via parcerias", value: `R$ ${totalMrr.toLocaleString("pt-BR")}`, sub: `${pctMrr}% do MRR total`, color: "#9e3ffd" },
              { label: "Leads recebidos", value: totalLeads.toString(), sub: `${totalConv} convertidos (${Math.round(totalConv/totalLeads*100)}%)`, color: "#3b82f6" },
              { label: "Melhor ROI", value: "2.8x", sub: "Construtora Alpha", color: "#d97706" },
            ].map(k => (
              <div key={k.label} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{k.label}</div>
                <div className="text-2xl font-bold mb-0.5" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Partnership table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F3F4F6" }}>
              <span className="font-bold text-sm" style={{ color: "#16163f" }}>Tabela de Parcerias</span>
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Ordenado por ROI ↓</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "#F8F9FC", borderBottom: "1px solid #E8EAED" }}>
                  {["Parceiro", "Tipo", "Leads Enviados", "Qualificados", "Convertidos", "MRR Gerado", "Pipeline", "ROI", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PARTNERSHIPS.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: i < PARTNERSHIPS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#16163f" }}>{p.name}</td>
                    <td className="px-4 py-3" style={{ color: "#6B7280" }}>{p.type}</td>
                    <td className="px-4 py-3 text-center" style={{ color: "#374151" }}>{p.leadsSent}</td>
                    <td className="px-4 py-3 text-center" style={{ color: "#374151" }}>{p.leadsQual}</td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: p.leadsConv > 0 ? "#16a34a" : "#9CA3AF" }}>{p.leadsConv}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: p.mrrGerado > 0 ? "#16163f" : "#9CA3AF" }}>
                      {p.mrrGerado > 0 ? `R$ ${p.mrrGerado.toLocaleString("pt-BR")}` : "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: p.pipeline > 0 ? "#374151" : "#9CA3AF" }}>
                      {p.pipeline > 0 ? `R$ ${p.pipeline.toLocaleString("pt-BR")}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: p.roi === "—" ? "#9CA3AF" : p.roi.startsWith("2") ? "#16a34a" : "#f59e0b" }}>{p.roi}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: `${p.statusColor}15`, color: p.statusColor }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 flex items-center gap-1.5" style={{ borderTop: "1px solid #F3F4F6", background: "#F8F9FC" }}>
              <Info size={11} style={{ color: "#9CA3AF" }} />
              <span className="text-[10px] italic" style={{ color: "#9CA3AF" }}>
                Em produção: dados cruzados automaticamente com coluna Source do Google Sheets (a ser adicionada por Alexandre).
              </span>
            </div>
          </div>

          {/* Chart + Best partnership */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="font-bold text-sm mb-4" style={{ color: "#16163f" }}>Contribuição de MRR por Parceiro</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                    tickFormatter={v => v === 0 ? "0" : `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "MRR"]}
                    contentStyle={{ fontSize: 11, border: "1px solid #E8EAED", borderRadius: 8 }}
                  />
                  <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl p-5 flex flex-col" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} style={{ color: "#d97706" }} />
                <div className="font-bold text-sm" style={{ color: "#16163f" }}>Parceria mais rentável</div>
              </div>
              <div className="text-lg font-bold mb-1" style={{ color: "#16163f" }}>Construtora Alpha</div>
              <div className="flex-1 space-y-2">
                <div className="rounded-lg p-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div className="text-[10px]" style={{ color: "#16a34a" }}>MRR gerado</div>
                  <div className="text-sm font-bold" style={{ color: "#16a34a" }}>R$ 11.200</div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Custo de aquisição (estimado)</div>
                  <div className="text-sm font-bold" style={{ color: "#374151" }}>R$ 4.000</div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
                  <div className="text-[10px]" style={{ color: "#d97706" }}>ROI</div>
                  <div className="text-xl font-bold" style={{ color: "#d97706" }}>2.8x</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
