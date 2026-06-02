// Oscar's prospecting queue — Meus Alvos
// NOTE: Oscar's leads currently live in Google Sheets.
// In production, Meus Alvos will be populated via Google Sheets API read.
// The mock data structure mirrors what the Sheets columns will contain.
// Enrichment triggers SOP 1 and SOP 13 against the lead record.
// Results write back to the Sheets row via API.

import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { mockOscarLeads, OscarLead } from "@/data/mockOscarLeads";
import { Search, Zap, ExternalLink, MessageSquare, Mail, Building2, MapPin, User, Clock, TrendingUp } from "lucide-react";

const STATUS_CFG: Record<OscarLead["status"], { color: string; bg: string; border: string; order: number }> = {
  "Reunião Marcada": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", order: 0 },
  "Proposta Enviada": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", order: 1 },
  "Em contato":      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", order: 2 },
  "Agente Ativo":    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", order: 3 },
  "Não contatado":   { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", order: 4 },
};

export default function OscarTargets() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [enriching, setEnriching] = useState<Set<string>>(new Set());

  const sorted = [...mockOscarLeads].sort(
    (a, b) => STATUS_CFG[a.status].order - STATUS_CFG[b.status].order
  );
  const filtered = sorted.filter(l =>
    !search ||
    l.company.toLowerCase().includes(search.toLowerCase()) ||
    l.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    l.city.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = mockOscarLeads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function triggerEnrich(id: string) {
    setEnriching(e => new Set([...e, id]));
    setTimeout(() => setEnriching(e => { const n = new Set(e); n.delete(id); return n; }), 2800);
  }

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Meus Alvos</h1>
              <div className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                {mockOscarLeads.length} potenciais agentes · ordenados por status
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
              <TrendingUp size={13} />
              <span>{mockOscarLeads.filter(l => l.status === "Agente Ativo").length} agente ativo</span>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["Reunião Marcada", "Proposta Enviada", "Em contato", "Agente Ativo", "Não contatado"] as OscarLead["status"][]).map(s => {
              const cfg = STATUS_CFG[s];
              const count = statusCounts[s] ?? 0;
              return (
                <div key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {s} <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empresa, responsável ou cidade..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
            />
          </div>
        </div>

        {/* Cards */}
        <div className="p-4 space-y-3">
          {filtered.map((lead, i) => {
            const cfg = STATUS_CFG[lead.status];
            const isEnriching = enriching.has(lead.id);
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl overflow-hidden"
                style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: "#16163f" }}>{lead.company}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {lead.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: "rgba(158,63,253,0.07)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.15)" }}>
                          {lead.score}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "#6B7280" }}>
                        <span className="flex items-center gap-1"><Building2 size={11} /> {lead.businessType}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {lead.city}/{lead.state}</span>
                        <span className="flex items-center gap-1"><User size={11} /> {lead.ownerName}</span>
                        {lead.lastContact && (
                          <span className="flex items-center gap-1"><Clock size={11} /> {lead.lastContact}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button
                        onClick={() => triggerEnrich(lead.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isEnriching ? "#dcfce7" : "rgba(158,63,253,0.07)",
                          color: isEnriching ? "#16a34a" : "#9e3ffd",
                          border: `1px solid ${isEnriching ? "#bbf7d0" : "rgba(158,63,253,0.2)"}`,
                        }}
                      >
                        <Zap size={10} /> {isEnriching ? "Enriquecendo..." : "Enriquecer"}
                      </button>
                      <button
                        onClick={() => navigate(`/sales-os/oscar/leads/${lead.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "#F8F9FC", color: "#374151", border: "1px solid #E8EAED" }}
                      >
                        <ExternalLink size={10} /> Abrir
                      </button>
                      {lead.whatsapp && (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                          <MessageSquare size={10} /> WA
                        </button>
                      )}
                      <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                        style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}>
                        <Mail size={10} /> Email
                      </button>
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: "#F8F9FC", color: "#6B7280" }}>
                      {lead.notes.slice(0, 130)}{lead.notes.length > 130 ? "…" : ""}
                    </div>
                  )}

                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    Portfólio estimado: <strong style={{ color: "#374151" }}>{lead.estimatedPortfolio}</strong>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SalesOSLayout>
  );
}
