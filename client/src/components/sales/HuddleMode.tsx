import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChevronRight, Trophy, AlertTriangle, Target, CheckCircle } from "lucide-react";
import { mockLeads } from "@/data/mockLeads";

const REPS = ["Elayne Nunes", "Thaina Domet"];

const SECTIONS = [
  { key: "scoreboard", title: "1. Placar de Ontem", icon: <Trophy size={16} /> },
  { key: "acoes", title: "2. Ações em Falta", icon: <AlertTriangle size={16} /> },
  { key: "coaching", title: "3. Foco de Coaching do Dia", icon: <Target size={16} /> },
  { key: "compromissos", title: "4. Compromissos do Dia", icon: <CheckCircle size={16} /> },
];

const COACHING_FLAGS = [
  "Elayne: 6 leads com decisor alcançado sem pedido de conta.",
  "Thaina: 3 chamadas encerradas em menos de 2 minutos — script incompleto.",
  "Elayne: Solar aceito como objeção definitiva sem diagnóstico de consumo.",
  "Thaina: Gatekeeper fechado como Perdido sem tentativa de rota alternativa.",
];

interface Props { onClose: () => void }

export function HuddleMode({ onClose }: Props) {
  const [section, setSection] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [commitments, setCommitments] = useState<Record<string, { calls: string; priority: string; change: string }>>({
    "Elayne Nunes": { calls: "", priority: "", change: "" },
    "Thaina Domet": { calls: "", priority: "", change: "" },
  });

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 120 ? "#ef4444" : timeLeft < 300 ? "#f59e0b" : "#22c55e";

  const overdueByRep = (rep: string) => mockLeads.filter(l =>
    l.assigned_to === rep && l.next_action_overdue
  );

  const canAdvance = section < SECTIONS.length - 1;
  const isLast = section === SECTIONS.length - 1;
  const commitmentFilled = (rep: string) =>
    commitments[rep].calls.length > 0 && commitments[rep].priority.length > 0 && commitments[rep].change.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: "#16163f", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
            <span className="font-bold" style={{ color: "#fff" }}>Huddle das 9h — Ótima Energia</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-lg font-bold" style={{ color: timerColor }}>
              <Clock size={16} />
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {SECTIONS.map((s, i) => (
            <div
              key={s.key}
              className="flex-1 px-2 py-2.5 text-center text-[11px] font-medium transition-colors"
              style={{
                background: i === section ? "rgba(158,63,253,0.15)" : "transparent",
                color: i === section ? "#c88ff5" : i < section ? "#9e3ffd" : "rgba(255,255,255,0.3)",
                borderBottom: i === section ? "2px solid #9e3ffd" : "2px solid transparent",
              }}
            >
              {i < section ? "✓ " : ""}{s.title.split(". ")[1]}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {section === 0 && (
              <motion.div key="scoreboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: "#fff" }}>Placar de Ontem</h3>
                <div className="grid grid-cols-2 gap-4">
                  {REPS.map(rep => {
                    const leads = mockLeads.filter(l => l.assigned_to === rep);
                    return (
                      <div key={rep} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="font-semibold mb-3" style={{ color: "#fff" }}>{rep.split(" ")[0]}</div>
                        <div className="space-y-2">
                          {[
                            { label: "Chamadas", value: rep === "Elayne Nunes" ? 12 : 9 },
                            { label: "DMs Alcançados", value: rep === "Elayne Nunes" ? 4 : 3 },
                            { label: "Contas Pedidas", value: rep === "Elayne Nunes" ? 3 : 2 },
                            { label: "Contas Recebidas", value: rep === "Elayne Nunes" ? 1 : 1 },
                            { label: "Leads Ativos", value: leads.length },
                          ].map(stat => (
                            <div key={stat.label} className="flex items-center justify-between text-sm">
                              <span style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</span>
                              <span className="font-bold" style={{ color: "#c88ff5" }}>{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {section === 1 && (
              <motion.div key="acoes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: "#fff" }}>Ações em Falta</h3>
                <div className="space-y-4">
                  {REPS.map(rep => {
                    const overdue = overdueByRep(rep);
                    return (
                      <div key={rep} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold" style={{ color: "#fff" }}>{rep}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: overdue.length > 3 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", color: overdue.length > 3 ? "#ef4444" : "#f59e0b" }}>
                            {overdue.length} atrasados
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {overdue.slice(0, 3).map(lead => (
                            <div key={lead.id} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#ef4444" }} />
                              <span className="font-medium" style={{ color: "#fff" }}>{lead.company}</span>
                              <span>·</span>
                              <span>{lead.next_action}</span>
                              <span className="ml-auto" style={{ color: "#ef4444" }}>+{lead.next_action_overdue_days}d</span>
                            </div>
                          ))}
                        </div>
                        {overdue.length > 3 && (
                          <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>+ {overdue.length - 3} mais...</div>
                        )}
                      </div>
                    );
                  })}
                  {/* Agent pattern note */}
                  <div className="rounded-xl p-3 flex gap-2" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}>
                    <span className="text-purple-400 shrink-0">🤖</span>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <strong style={{ color: "#c88ff5" }}>Padrão detectado pelo agente:</strong> Elayne tem 6 leads com decisor alcançado sem pedido de conta — possível hesitação no momento do bill ask.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {section === 2 && (
              <motion.div key="coaching" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: "#fff" }}>Foco de Coaching do Dia</h3>
                <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.25)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9e3ffd" }}>SOP-09 — QA Flags de Ontem</div>
                  <div className="space-y-2">
                    {COACHING_FLAGS.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#22c55e" }}>Roleplay Sugerido pelo Agente</div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <strong style={{ color: "#fff" }}>Cenário:</strong> DM acabou de atender. Pausa de 3 segundos. O que você diz primeiro?<br /><br />
                    Praticar o bill ask no momento de silêncio pós-atendimento. Rep A pergunta, Rep B responde como DM cético.
                  </div>
                </div>
              </motion.div>
            )}

            {section === 3 && (
              <motion.div key="compromissos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: "#fff" }}>Compromissos do Dia</h3>
                <div className="space-y-4">
                  {REPS.map(rep => (
                    <div key={rep} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="font-semibold mb-3" style={{ color: "#fff" }}>{rep}</div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>Meta de chamadas hoje</label>
                          <input
                            value={commitments[rep].calls}
                            onChange={e => setCommitments(c => ({ ...c, [rep]: { ...c[rep], calls: e.target.value } }))}
                            placeholder="Ex: 15 chamadas"
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>Contato prioritário do dia</label>
                          <input
                            value={commitments[rep].priority}
                            onChange={e => setCommitments(c => ({ ...c, [rep]: { ...c[rep], priority: e.target.value } }))}
                            placeholder="Ex: Carlos Andrade — Hotel Bela Vista"
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>Mudança específica de hoje</label>
                          <input
                            value={commitments[rep].change}
                            onChange={e => setCommitments(c => ({ ...c, [rep]: { ...c[rep], change: e.target.value } }))}
                            placeholder="Ex: Pedir a conta sempre após o rapport"
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                          />
                        </div>
                        {commitmentFilled(rep) && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
                            <CheckCircle size={12} /> Compromisso registrado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setSection(s => Math.max(0, s - 1))}
            disabled={section === 0}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: section === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}
          >
            Anterior
          </button>

          <div className="flex gap-1.5">
            {SECTIONS.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === section ? "#9e3ffd" : i < section ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              disabled={!REPS.every(r => commitmentFilled(r))}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: REPS.every(r => commitmentFilled(r)) ? "#9e3ffd" : "rgba(255,255,255,0.08)",
                color: REPS.every(r => commitmentFilled(r)) ? "#fff" : "rgba(255,255,255,0.3)",
              }}
            >
              Iniciar o Dia 🚀
            </button>
          ) : (
            <button
              onClick={() => setSection(s => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#9e3ffd", color: "#fff" }}
            >
              Próximo <ChevronRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
