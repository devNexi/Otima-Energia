import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { HuddleMode } from "@/components/sales/HuddleMode";
import { mockLeads, priorityConfig } from "@/data/mockLeads";
import {
  AlertTriangle, Phone, Clock, Users, FileText, TrendingUp,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, CheckCircle,
  MessageSquare, BarChart3, Play,
} from "lucide-react";

const REPS = ["Elayne Nunes", "Thaina Domet"];

const STAT_CHIPS = [
  { label: "Chamadas Hoje", value: 21, color: "#9e3ffd", icon: <Phone size={12} /> },
  { label: "DMs Alcançados", value: 7, color: "#22c55e", icon: <Users size={12} /> },
  { label: "Contas Solicitadas", value: 5, color: "#f59e0b", icon: <FileText size={12} /> },
  { label: "Contas Recebidas", value: 2, color: "#3b82f6", icon: <FileText size={12} /> },
  { label: "Propostas em Chase", value: 2, color: "#ef4444", icon: <TrendingUp size={12} /> },
  { label: "Leads Ativos", value: mockLeads.length, color: "#c88ff5", icon: <Users size={12} /> },
  { label: "Callbacks Pendentes", value: 7, color: "#f59e0b", icon: <Clock size={12} /> },
  { label: "Respostas Humanas", value: mockLeads.filter(l => l.human_response_required).length, color: "#ef4444", icon: <MessageSquare size={12} /> },
];

interface SectionProps {
  title: string;
  color: string;
  leads: typeof mockLeads;
  defaultOpen?: boolean;
  issueLabel: (lead: typeof mockLeads[0]) => string;
  onOpen: (id: string) => void;
  showApprove?: boolean;
}

function ManagerSection({ title, color, leads, defaultOpen = false, issueLabel, onOpen, showApprove }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [coaching, setCoaching] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Set<string>>(new Set());

  function sendNote(id: string) {
    setSent(prev => new Set([...prev, id]));
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4"
        style={{ background: "rgba(0,0,0,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="font-semibold text-sm" style={{ color: "#fff" }}>{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
            {leads.length}
          </span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.4)" }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {leads.length === 0 && (
                <div className="px-5 py-4 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Nenhum item nesta categoria.</div>
              )}
              {leads.map(lead => {
                const pConf = priorityConfig[lead.priority];
                return (
                  <div key={lead.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 ${pConf.color}`}>{lead.priority}</span>
                          <span className="text-sm font-semibold truncate" style={{ color: "#fff" }}>{lead.dm_name ?? "—"}</span>
                          <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>· {lead.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>{lead.assigned_to.split(" ")[0]}</span>
                          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                          <span style={{ color }}>⚠ {issueLabel(lead)}</span>
                          {lead.last_contact && (
                            <span style={{ color: "rgba(255,255,255,0.35)" }}>· {lead.last_contact}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => onOpen(lead.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(158,63,253,0.15)", color: "#c88ff5", border: "1px solid rgba(158,63,253,0.25)" }}>
                          <ExternalLink size={10} /> Abrir
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <RefreshCw size={10} /> Reatribuir
                        </button>
                        {showApprove && (
                          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                            <CheckCircle size={10} /> Aprovar Perda
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Coaching note */}
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        value={coaching[lead.id] ?? ""}
                        onChange={e => setCoaching(c => ({ ...c, [lead.id]: e.target.value }))}
                        placeholder="Enviar nota de coaching para o rep..."
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                      />
                      <button
                        onClick={() => sendNote(lead.id)}
                        disabled={!coaching[lead.id]?.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all"
                        style={{
                          background: sent.has(lead.id) ? "rgba(34,197,94,0.15)" : "rgba(158,63,253,0.15)",
                          color: sent.has(lead.id) ? "#22c55e" : "#c88ff5",
                          border: `1px solid ${sent.has(lead.id) ? "rgba(34,197,94,0.25)" : "rgba(158,63,253,0.25)"}`,
                        }}
                      >
                        {sent.has(lead.id) ? "✓ Enviado" : "Enviar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RepPerformanceCard({ rep }: { rep: string }) {
  const leads = mockLeads.filter(l => l.assigned_to === rep);
  const overdue = leads.filter(l => l.next_action_overdue);
  const [coaching, setCoaching] = useState("");
  const [sent, setSent] = useState(false);

  const isElayne = rep === "Elayne Nunes";
  const stats = isElayne
    ? { calls: 12, dms: 4, bills: 3, received: 1, conversion: "33%" }
    : { calls: 9, dms: 3, bills: 2, received: 1, conversion: "50%" };

  const sopFlags = isElayne ? [
    "Não usou briefing em 4 chamadas hoje",
    "6 leads com decisor alcançado sem pedido de conta",
    "Solar aceito como objeção definitiva sem diagnóstico",
  ] : [
    "3 chamadas encerradas em menos de 2 minutos",
    "Gatekeeper fechado como Perdido sem tentativa alternativa",
  ];

  const renanAction = isElayne
    ? "Fazer roleplay de bill ask com Elayne — praticar o pedido após rapport de 60 segundos."
    : "Ouvir a gravação da chamada com o Hotel Executivo Paulistano — identificar ponto de saída precoce.";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}>
            {rep.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#fff" }}>{rep}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{leads.length} leads · {overdue.length} atrasados</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 size={14} style={{ color: "#9e3ffd" }} />
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="text-center rounded-lg py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="text-base font-bold" style={{ color: "#c88ff5" }}>{v}</div>
              <div className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>{k}</div>
            </div>
          ))}
        </div>

        {/* SOP QA flags */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>QA Flags de Hoje — SOP-09</div>
          <div className="space-y-1.5">
            {sopFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                {flag}
              </div>
            ))}
          </div>
        </div>

        {/* Renan action */}
        <div className="rounded-xl p-3" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "#9e3ffd" }}>Renan deve fazer isso agora:</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{renanAction}</div>
        </div>

        {/* Send note */}
        <div className="flex gap-2">
          <input
            value={coaching}
            onChange={e => setCoaching(e.target.value)}
            placeholder={`Nota de coaching para ${rep.split(" ")[0]}...`}
            className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
          />
          <button
            onClick={() => { setSent(true); setCoaching(""); setTimeout(() => setSent(false), 2500); }}
            disabled={!coaching.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all"
            style={{ background: sent ? "rgba(34,197,94,0.15)" : "rgba(158,63,253,0.2)", color: sent ? "#22c55e" : "#c88ff5" }}
          >
            {sent ? "✓ Enviado" : "Enviar Nota"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Manager() {
  const [, navigate] = useLocation();
  const [huddleOpen, setHuddleOpen] = useState(false);

  function openLead(id: string) { navigate(`/sales-os/leads/${id}`); }

  const noNextAction = mockLeads.filter(l => !l.next_action || l.next_action_overdue);
  const lostCallbacks = mockLeads.filter(l => l.next_action_overdue && l.priority === "P1");
  const dmNoRequest = mockLeads.filter(l => l.dm_status === "Alcançado" && !l.bill_status);
  const stale48h = mockLeads.filter(l => l.priority === "P6" || l.priority === "P8");

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto">
        <AnimatePresence>
          {huddleOpen && <HuddleMode onClose={() => setHuddleOpen(false)} />}
        </AnimatePresence>

        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#fff" }}>Gerente Console</h1>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Visão geral · Renan · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setHuddleOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}
              >
                <Play size={13} /> Iniciar Huddle das 9h
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Relatório das 16h
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Relatório EOD
              </button>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {STAT_CHIPS.map(chip => (
              <div key={chip.label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ color: chip.color }}>{chip.icon}</span>
                <span className="text-base font-bold" style={{ color: "#fff" }}>{chip.value}</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{chip.label}</span>
              </div>
            ))}
          </div>

          {/* Main sections */}
          <div className="space-y-4 mb-8">
            <ManagerSection
              title="🔴 Fila Suja — Sem Próxima Ação"
              color="#ef4444"
              leads={noNextAction.slice(0, 4)}
              defaultOpen
              issueLabel={l => `Próxima ação atrasada ${l.next_action_overdue_days ?? "?"}d — sem data`}
              onOpen={openLead}
            />
            <ManagerSection
              title="🟠 Callbacks Perdidos"
              color="#f97316"
              leads={lostCallbacks}
              issueLabel={l => `Callback prometido — ${l.next_action_date}`}
              onOpen={openLead}
            />
            <ManagerSection
              title="🟠 Decisores Alcançados Sem Pedido de Conta"
              color="#f59e0b"
              leads={dmNoRequest}
              issueLabel={l => `DM ${l.dm_status} há ${l.last_contact ?? "?"} sem conta solicitada`}
              onOpen={openLead}
            />
            <ManagerSection
              title="🟡 Perdidos Aguardando Aprovação Renan"
              color="#eab308"
              leads={mockLeads.filter(l => l.priority === "P8")}
              issueLabel={() => "20+ tentativas — aguardando decisão estratégica"}
              onOpen={openLead}
              showApprove
            />
            <ManagerSection
              title="🔵 Leads Parados 48h+"
              color="#3b82f6"
              leads={stale48h}
              issueLabel={l => `Parado ${l.last_contact ?? "?"} sem ação`}
              onOpen={openLead}
            />
          </div>

          {/* Rep performance */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} style={{ color: "#9e3ffd" }} />
              <h2 className="font-bold" style={{ color: "#fff" }}>📊 Desempenho de Hoje por Rep</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {REPS.map(rep => <RepPerformanceCard key={rep} rep={rep} />)}
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
