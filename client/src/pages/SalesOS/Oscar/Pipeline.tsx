import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { mockOscarLeads, OscarLead } from "@/data/mockOscarLeads";
import { Building2, MapPin, User, Clock, Star } from "lucide-react";

const COLUMNS: {
  status: OscarLead["status"];
  label: string;
  color: string;
  bg: string;
  border: string;
  headerBg: string;
}[] = [
  { status: "Não contatado",   label: "Prospecção",             color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", headerBg: "#f3f4f6" },
  { status: "Em contato",      label: "Em Conversa",            color: "#d97706", bg: "#fffbeb", border: "#fde68a", headerBg: "#fef9ee" },
  { status: "Reunião Marcada", label: "Reunião",                color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", headerBg: "#f5f3ff" },
  { status: "Proposta Enviada",label: "Proposta Ótima Agente",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", headerBg: "#eff6ff" },
  { status: "Agente Ativo",    label: "Agente Ativo",           color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", headerBg: "#f0fdf4" },
];

export default function OscarPipeline() {
  const [, navigate] = useLocation();
  const total  = mockOscarLeads.length;
  const active = mockOscarLeads.filter(l => l.status === "Agente Ativo").length;

  return (
    <SalesOSLayout>
      <div className="h-screen flex flex-col" style={{ background: "#F8F9FC" }}>

        {/* Header */}
        <div className="px-6 py-5 border-b shrink-0" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Pipeline de Agentes</h1>
              <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                {total} alvos em prospecção
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              <Star size={11} fill="#16a34a" />
              {active} agente{active !== 1 ? "s" : ""} ativo{active !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-3 h-full" style={{ minWidth: COLUMNS.length * 256 + 32 }}>
            {COLUMNS.map(col => {
              const leads = mockOscarLeads.filter(l => l.status === col.status);
              return (
                <div
                  key={col.status}
                  className="flex flex-col rounded-2xl overflow-hidden shrink-0"
                  style={{ width: 252, background: "#FFFFFF", border: "1px solid #E8EAED" }}
                >
                  {/* Column header */}
                  <div
                    className="px-4 py-3 border-b"
                    style={{ background: col.headerBg, borderColor: col.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        <span className="font-semibold text-sm" style={{ color: col.color }}>{col.label}</span>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${col.color}18`, color: col.color }}
                      >
                        {leads.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {leads.length === 0 && (
                      <div className="text-center py-8 text-xs" style={{ color: "#C4C8D4" }}>
                        Nenhum alvo nesta etapa
                      </div>
                    )}
                    {leads.map(lead => (
                      <div
                        key={lead.id}
                        className="rounded-xl p-3 cursor-pointer transition-shadow"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #F3F4F6",
                          borderLeft: `3px solid ${col.color}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.10)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)")}
                        onClick={() => navigate(`/sales-os/oscar/leads/${lead.id}`)}
                      >
                        {/* Company + score */}
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div className="font-semibold text-xs leading-snug" style={{ color: "#16163f" }}>
                            {lead.company}
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                            style={{ background: "rgba(158,63,253,0.07)", color: "#9e3ffd" }}>
                            {lead.score}
                          </span>
                        </div>

                        {/* Meta info */}
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#9CA3AF" }}>
                            <Building2 size={9} /> {lead.businessType}
                          </div>
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#9CA3AF" }}>
                            <User size={9} /> {lead.ownerName}
                          </div>
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#9CA3AF" }}>
                            <MapPin size={9} /> {lead.city}/{lead.state}
                          </div>
                          {lead.lastContact && (
                            <div className="flex items-center gap-1 text-[10px]" style={{ color: "#9CA3AF" }}>
                              <Clock size={9} /> {lead.lastContact}
                            </div>
                          )}
                        </div>

                        {/* Portfolio pill */}
                        <div className="text-[10px] px-2 py-0.5 rounded-full inline-block font-medium"
                          style={{ background: "rgba(22,163,74,0.07)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.15)" }}>
                          {lead.estimatedPortfolio}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
