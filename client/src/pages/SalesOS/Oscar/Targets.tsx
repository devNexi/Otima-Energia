// Oscar's prospecting queue — Meus Alvos
// NOTE: Oscar's leads currently live in Google Sheets.
// In production, Meus Alvos will be populated via Google Sheets API read.

import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { mockOscarLeads, OscarLead } from "@/data/mockOscarLeads";
import {
  Search, Zap, ExternalLink, MessageSquare, Mail,
  Building2, MapPin, User, Clock, TrendingUp,
} from "lucide-react";

const STATUS_CFG: Record<OscarLead["status"], {
  color: string; bg: string; border: string; borderLeft: string; order: number;
}> = {
  "Reunião Marcada": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", borderLeft: "#7c3aed", order: 0 },
  "Proposta Enviada": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", borderLeft: "#2563eb", order: 1 },
  "Em contato":      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", borderLeft: "#d97706", order: 2 },
  "Agente Ativo":    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", borderLeft: "#16a34a", order: 3 },
  "Não contatado":   { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", borderLeft: "#d1d5db", order: 4 },
};

const STATUS_FILTERS = [
  "Reunião Marcada", "Proposta Enviada", "Em contato", "Agente Ativo", "Não contatado",
] as OscarLead["status"][];

export default function OscarTargets() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<OscarLead["status"] | "all">("all");
  const [enriching, setEnriching] = useState<Set<string>>(new Set());

  const sorted = [...mockOscarLeads].sort(
    (a, b) => STATUS_CFG[a.status].order - STATUS_CFG[b.status].order
  );
  const filtered = sorted.filter(l => {
    const matchesSearch = !search ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || l.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              <TrendingUp size={12} />
              {mockOscarLeads.filter(l => l.status === "Agente Ativo").length} agente ativo
            </div>
          </div>

          {/* Status filter chips — soft fill style */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveFilter("all")}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeFilter === "all" ? "rgba(158,63,253,0.1)" : "#F8F9FC",
                color: activeFilter === "all" ? "#9e3ffd" : "#6B7280",
                border: `1px solid ${activeFilter === "all" ? "rgba(158,63,253,0.2)" : "#E8EAED"}`,
              }}
            >
              Todos <span className="font-bold">{mockOscarLeads.length}</span>
            </button>
            {STATUS_FILTERS.map(s => {
              const cfg = STATUS_CFG[s];
              const count = statusCounts[s] ?? 0;
              const active = activeFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveFilter(active ? "all" : s)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: active ? cfg.bg : "#F8F9FC",
                    color: active ? cfg.color : "#6B7280",
                    border: `1px solid ${active ? cfg.border : "#E8EAED"}`,
                  }}
                >
                  {s} <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar — matches girls' queue style */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empresa, responsável ou cidade..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
            />
          </div>
        </div>

        {/* Lead cards */}
        <div className="p-4 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-sm" style={{ color: "#9CA3AF" }}>
              Nenhum alvo encontrado.
            </div>
          )}
          {filtered.map((lead, i) => {
            const cfg = STATUS_CFG[lead.status];
            const isEnriching = enriching.has(lead.id);
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl overflow-hidden cursor-pointer transition-shadow"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8EAED",
                  borderLeft: `4px solid ${cfg.borderLeft}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")}
              >
                <div className="px-5 py-4">
                  {/* Row 1: company name + score badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: "#16163f" }}>{lead.company}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(158,63,253,0.07)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.15)" }}>
                      {lead.score}/100
                    </span>
                  </div>

                  {/* Row 2: business type chip + city/state + owner */}
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E8EAED" }}>
                      {lead.businessType}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
                      <MapPin size={10} /> {lead.city}/{lead.state}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
                      <User size={10} /> {lead.ownerName}
                    </span>
                  </div>

                  {/* Row 3: portfolio estimate pill */}
                  <div className="mb-2.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium inline-block"
                      style={{ background: "rgba(22,163,74,0.07)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.15)" }}>
                      Portfólio estimado: {lead.estimatedPortfolio}
                    </span>
                  </div>

                  {/* Row 4: status chip + last contact */}
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {lead.status}
                    </span>
                    {lead.lastContact && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
                        <Clock size={10} /> {lead.lastContact}
                      </span>
                    )}
                  </div>

                  {/* Row 5 (if notes): muted italic preview */}
                  {lead.notes && (
                    <p className="text-xs italic mb-3 leading-relaxed"
                      style={{ color: "#9CA3AF" }}>
                      {lead.notes.slice(0, 110)}{lead.notes.length > 110 ? "…" : ""}
                    </p>
                  )}

                  {/* Row 6: action buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t flex-wrap" style={{ borderColor: "#F3F4F6" }}>
                    <button
                      onClick={e => { e.stopPropagation(); triggerEnrich(lead.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: isEnriching ? "#dcfce7" : "rgba(158,63,253,0.07)",
                        color: isEnriching ? "#16a34a" : "#9e3ffd",
                        border: `1px solid ${isEnriching ? "#bbf7d0" : "rgba(158,63,253,0.2)"}`,
                      }}
                    >
                      <Zap size={11} /> {isEnriching ? "Enriquecendo..." : "Enriquecer"}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/sales-os/oscar/leads/${lead.id}`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "#F8F9FC", color: "#374151", border: "1px solid #E8EAED" }}
                    >
                      <ExternalLink size={11} /> Abrir
                    </button>
                    {lead.whatsapp && (
                      <button
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                      >
                        <MessageSquare size={11} /> WA
                      </button>
                    )}
                    <button
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
                    >
                      <Mail size={11} /> Email
                    </button>
                    <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
                      <Building2 size={10} />
                      <span>{lead.businessType}</span>
                    </div>
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
