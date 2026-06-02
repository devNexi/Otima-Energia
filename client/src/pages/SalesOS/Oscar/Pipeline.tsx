import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { mockOscarLeads, OscarLead } from "@/data/mockOscarLeads";
import { Building2, MapPin, Clock, User } from "lucide-react";

const COLUMNS: { status: OscarLead["status"]; label: string; color: string; bg: string; border: string }[] = [
  { status: "Não contatado",  label: "Prospecção",             color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
  { status: "Em contato",     label: "Em Conversa",            color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { status: "Reunião Marcada",label: "Reunião",                color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { status: "Proposta Enviada",label: "Proposta Ótima Agente", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { status: "Agente Ativo",   label: "Agente Ativo",           color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
];

export default function OscarPipeline() {
  const total = mockOscarLeads.length;
  const active = mockOscarLeads.filter(l => l.status === "Agente Ativo").length;

  return (
    <SalesOSLayout>
      <div className="h-screen flex flex-col" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b shrink-0" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Pipeline de Agentes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
            {total} alvos em prospecção · {active} agente{active !== 1 ? "s" : ""} ativo{active !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-4 h-full" style={{ minWidth: COLUMNS.length * 244 + 32 }}>
            {COLUMNS.map(col => {
              const leads = mockOscarLeads.filter(l => l.status === col.status);
              return (
                <div
                  key={col.status}
                  className="flex flex-col rounded-xl overflow-hidden shrink-0"
                  style={{ width: 240, background: col.bg, border: `1px solid ${col.border}` }}
                >
                  {/* Column header */}
                  <div className="px-3 py-3 border-b" style={{ borderColor: col.border }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm" style={{ color: col.color }}>{col.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${col.color}20`, color: col.color }}>
                        {leads.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {leads.length === 0 && (
                      <div className="text-center py-8 text-xs" style={{ color: "#9CA3AF" }}>Nenhum alvo</div>
                    )}
                    {leads.map(lead => (
                      <div
                        key={lead.id}
                        className="rounded-lg p-3 cursor-pointer transition-shadow"
                        style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.10)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)")}
                      >
                        <div className="font-semibold text-xs mb-1.5" style={{ color: "#16163f" }}>{lead.company}</div>
                        <div className="space-y-0.5">
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
                        <div className="mt-2 text-[10px] px-2 py-0.5 rounded-full inline-block font-medium"
                          style={{ background: "rgba(158,63,253,0.07)", color: "#9e3ffd" }}>
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
