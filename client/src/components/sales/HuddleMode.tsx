import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChevronRight, Trophy, AlertTriangle, Target, CheckCircle, Copy } from "lucide-react";
import { mockLeads } from "@/data/mockLeads";

const REPS = ["Elayne Nunes", "Thaina Domet"];

const SECTIONS = [
  { key: "scoreboard", title: "1. Placar de Ontem", icon: <Trophy size={16} /> },
  { key: "acoes", title: "2. Ações em Falta", icon: <AlertTriangle size={16} /> },
  { key: "coaching", title: "3. Foco de Coaching", icon: <Target size={16} /> },
  { key: "compromissos", title: "4. Compromissos", icon: <CheckCircle size={16} /> },
];

const COACHING_FLAGS = [
  { rep: "Elayne", text: "6 leads com decisor alcançado sem pedido de conta — possível hesitação no bill ask." },
  { rep: "Thaina", text: "3 chamadas encerradas em menos de 2 minutos — script incompleto." },
  { rep: "Elayne", text: "Objeção solar aceita como definitiva sem diagnóstico de consumo." },
  { rep: "Thaina", text: "Gatekeeper fechado como Perdido sem tentativa de rota alternativa." },
];

interface Props { onClose: () => void }

export function HuddleMode({ onClose }: Props) {
  const [section, setSection] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [interacted, setInteracted] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });
  const [commitments, setCommitments] = useState<Record<string, { calls: string; priority: string; change: string }>>({
    "Elayne Nunes": { calls: "", priority: "", change: "" },
    "Thaina Domet": { calls: "", priority: "", change: "" },
  });
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 120 ? "#dc2626" : timeLeft < 300 ? "#d97706" : "#16a34a";

  const overdueByRep = (rep: string) =>
    mockLeads.filter(l => l.assigned_to === rep && l.next_action_overdue);

  const commitmentFilled = (rep: string) =>
    commitments[rep].calls.length > 0 &&
    commitments[rep].priority.length > 0 &&
    commitments[rep].change.length > 0;

  const allFilled = REPS.every(commitmentFilled);
  const canAdvance = section < 3 ? interacted[section] : false;

  function markInteracted() {
    setInteracted(p => ({ ...p, [section]: true }));
  }

  function buildSummary() {
    const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const lines = REPS.map(rep => {
      const c = commitments[rep];
      return `${rep.split(" ")[0]}: ${c.calls} chamadas | Foco: ${c.priority} | Mudança: ${c.change}`;
    });
    return `🎯 Huddle Ótima Energia — ${date}\n\n${lines.join("\n")}\n\nBom trabalho! 🚀`;
  }

  function copyAndClose() {
    navigator.clipboard.writeText(buildSummary()).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(22,22,63,0.6)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8EAED",
          boxShadow: "0 20px 60px rgba(22,22,63,0.2), 0 4px 16px rgba(0,0,0,0.08)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E8EAED" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#16a34a" }} />
            <span className="font-bold text-sm" style={{ color: "#16163f" }}>Huddle das 9h — Ótima Energia</span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1.5 font-mono text-2xl font-bold"
              style={{ color: timerColor }}
            >
              <Clock size={18} style={{ color: timerColor }} />
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "#F8F9FC", color: "#9CA3AF" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#E8EAED")}
              onMouseLeave={e => (e.currentTarget.style.background = "#F8F9FC")}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex border-b" style={{ borderColor: "#E8EAED" }}>
          {SECTIONS.map((s, i) => (
            <div
              key={s.key}
              className="flex-1 px-2 py-3 text-center text-[11px] font-medium transition-colors"
              style={{
                background: i === section ? "rgba(158,63,253,0.05)" : "transparent",
                color: i === section ? "#9e3ffd" : i < section ? "#16a34a" : "#9CA3AF",
                borderBottom: i === section ? "2px solid #9e3ffd" : i < section ? "2px solid #16a34a" : "2px solid transparent",
              }}
            >
              {i < section ? "✓ " : ""}{s.title.split(". ")[1]}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Section 0 — Placar */}
            {section === 0 && (
              <motion.div key="scoreboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-1" style={{ color: "#16163f" }}>Placar de Ontem</h3>
                <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                  Clique em qualquer métrica para continuar
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {REPS.map(rep => {
                    const leads = mockLeads.filter(l => l.assigned_to === rep);
                    return (
                      <div key={rep} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}>
                            {rep.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{rep.split(" ")[0]}</span>
                        </div>
                        <div className="space-y-1">
                          {[
                            { label: "Chamadas", value: rep === "Elayne Nunes" ? 12 : 9 },
                            { label: "DMs Alcançados", value: rep === "Elayne Nunes" ? 4 : 3 },
                            { label: "Contas Pedidas", value: rep === "Elayne Nunes" ? 3 : 2 },
                            { label: "Contas Recebidas", value: rep === "Elayne Nunes" ? 1 : 1 },
                            { label: "Leads Ativos", value: leads.length },
                          ].map(stat => (
                            <button
                              key={stat.label}
                              onClick={markInteracted}
                              className="flex items-center justify-between text-sm w-full rounded-lg px-2.5 py-1.5 transition-all"
                              style={{ background: "transparent" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#FFFFFF")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <span style={{ color: "#6B7280" }}>{stat.label}</span>
                              <span className="font-bold" style={{ color: "#9e3ffd" }}>{stat.value}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!interacted[0] && (
                  <div className="mt-3 text-xs text-center" style={{ color: "#9CA3AF" }}>
                    Clique em uma métrica para desbloquear o próximo passo
                  </div>
                )}
              </motion.div>
            )}

            {/* Section 1 — Ações em Falta */}
            {section === 1 && (
              <motion.div key="acoes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-1" style={{ color: "#16163f" }}>Ações em Falta</h3>
                <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                  Clique em um lead em atraso para confirmar que tomou nota
                </p>
                <div className="space-y-4">
                  {REPS.map(rep => {
                    const overdue = overdueByRep(rep);
                    return (
                      <div key={rep} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{rep}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: overdue.length > 3 ? "#fef2f2" : "#fffbeb",
                              color: overdue.length > 3 ? "#dc2626" : "#d97706",
                              border: `1px solid ${overdue.length > 3 ? "#fecaca" : "#fde68a"}`,
                            }}
                          >
                            {overdue.length} atrasados
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {overdue.slice(0, 4).map(lead => (
                            <button
                              key={lead.id}
                              onClick={markInteracted}
                              className="flex items-center gap-2 text-xs w-full rounded-lg px-2.5 py-2 transition-all text-left"
                              style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = "#9e3ffd")}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = "#E8EAED")}
                            >
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#dc2626" }} />
                              <span className="font-medium" style={{ color: "#16163f" }}>{lead.company}</span>
                              <span style={{ color: "#9CA3AF" }}>·</span>
                              <span style={{ color: "#6B7280" }}>{lead.next_action}</span>
                              <span className="ml-auto shrink-0 font-semibold" style={{ color: "#dc2626" }}>+{lead.next_action_overdue_days}d</span>
                            </button>
                          ))}
                        </div>
                        {overdue.length > 4 && (
                          <div className="text-xs mt-2" style={{ color: "#9CA3AF" }}>+ {overdue.length - 4} mais...</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="rounded-xl p-3 flex gap-2" style={{ background: "rgba(158,63,253,0.06)", border: "1px solid rgba(158,63,253,0.15)" }}>
                    <span className="shrink-0">🤖</span>
                    <div className="text-xs" style={{ color: "#374151" }}>
                      <strong style={{ color: "#9e3ffd" }}>Padrão detectado pelo agente:</strong> Elayne tem 6 leads com decisor alcançado sem pedido de conta — possível hesitação no momento do bill ask.
                    </div>
                  </div>
                </div>
                {!interacted[1] && (
                  <div className="mt-3 text-xs text-center" style={{ color: "#9CA3AF" }}>
                    Clique em um lead para desbloquear
                  </div>
                )}
              </motion.div>
            )}

            {/* Section 2 — Coaching */}
            {section === 2 && (
              <motion.div key="coaching" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-1" style={{ color: "#16163f" }}>Foco de Coaching do Dia</h3>
                <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                  Clique em um flag para confirmar discussão
                </p>
                <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(158,63,253,0.05)", border: "1px solid rgba(158,63,253,0.2)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9e3ffd" }}>SOP-09 — QA Flags de Ontem</div>
                  <div className="space-y-2">
                    {COACHING_FLAGS.map((flag, i) => (
                      <button
                        key={i}
                        onClick={markInteracted}
                        className="flex items-start gap-2 text-sm w-full rounded-xl px-3 py-2.5 transition-all text-left"
                        style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#d97706")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#fde68a")}
                      >
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                        <span style={{ color: "#374151" }}>
                          <strong style={{ color: "#9e3ffd" }}>{flag.rep}:</strong> {flag.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#16a34a" }}>Roleplay Sugerido</div>
                  <div className="text-sm" style={{ color: "#374151" }}>
                    <strong style={{ color: "#16163f" }}>Cenário:</strong> DM acabou de atender. Pausa de 3 segundos. O que você diz primeiro?
                    <br /><br />
                    Rep A pergunta o bill ask, Rep B responde como DM cético. Trocar papéis após 2 minutos.
                  </div>
                </div>
                {!interacted[2] && (
                  <div className="mt-3 text-xs text-center" style={{ color: "#9CA3AF" }}>
                    Clique em um flag de coaching para desbloquear
                  </div>
                )}
              </motion.div>
            )}

            {/* Section 3 — Compromissos */}
            {section === 3 && !showSummary && (
              <motion.div key="compromissos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: "#16163f" }}>Compromissos do Dia</h3>
                <div className="space-y-4">
                  {REPS.map(rep => (
                    <div key={rep} className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}>
                          {rep.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{rep}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs mb-1 block font-medium" style={{ color: "#6B7280" }}>Meta de chamadas hoje *</label>
                          <input
                            value={commitments[rep].calls}
                            onChange={e => setCommitments(c => ({ ...c, [rep]: { ...c[rep], calls: e.target.value } }))}
                            placeholder="Ex: 15 chamadas"
                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                            style={{
                              background: "#FFFFFF",
                              border: `1px solid ${commitments[rep].calls ? "#bbf7d0" : "#E8EAED"}`,
                              color: "#16163f",
                            }}
                            onFocus={e => (e.target.style.borderColor = "#9e3ffd")}
                            onBlur={e => (e.target.style.borderColor = commitments[rep].calls ? "#bbf7d0" : "#E8EAED")}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block font-medium" style={{ color: "#6B7280" }}>Lead prioritário *</label>
                          <input
                            value={commitments[rep].priority}
                            onChange={e => setCommitments(c => ({ ...c, [rep]: { ...c[rep], priority: e.target.value } }))}
                            placeholder="Ex: Carlos Andrade — Hotel Bela Vista"
                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                            style={{
                              background: "#FFFFFF",
                              border: `1px solid ${commitments[rep].priority ? "#bbf7d0" : "#E8EAED"}`,
                              color: "#16163f",
                            }}
                            onFocus={e => (e.target.style.borderColor = "#9e3ffd")}
                            onBlur={e => (e.target.style.borderColor = commitments[rep].priority ? "#bbf7d0" : "#E8EAED")}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block font-medium" style={{ color: "#6B7280" }}>O que farei diferente hoje *</label>
                          <input
                            value={commitments[rep].change}
                            onChange={e => setCommitments(c => ({ ...c, [rep]: { ...c[rep], change: e.target.value } }))}
                            placeholder="Ex: Pedir a conta sempre após o rapport"
                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                            style={{
                              background: "#FFFFFF",
                              border: `1px solid ${commitments[rep].change ? "#bbf7d0" : "#E8EAED"}`,
                              color: "#16163f",
                            }}
                            onFocus={e => (e.target.style.borderColor = "#9e3ffd")}
                            onBlur={e => (e.target.style.borderColor = commitments[rep].change ? "#bbf7d0" : "#E8EAED")}
                          />
                        </div>
                        {commitmentFilled(rep) && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#16a34a" }}>
                            <CheckCircle size={12} /> Compromisso registrado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Summary */}
            {section === 3 && showSummary && (
              <motion.div key="summary" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(158,63,253,0.1)" }}>
                    <span className="text-xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "#16163f" }}>Resumo do Huddle</h3>
                </div>
                <div className="rounded-xl p-4 mb-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
                  {REPS.map(rep => (
                    <div key={rep} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0" style={{ borderColor: "#E8EAED" }}>
                      <div className="font-semibold text-sm mb-2" style={{ color: "#9e3ffd" }}>{rep.split(" ")[0]}</div>
                      <div className="text-xs space-y-1" style={{ color: "#6B7280" }}>
                        <div className="flex items-center gap-2">
                          <span>📞</span>
                          <span>Meta: <strong style={{ color: "#16163f" }}>{commitments[rep].calls}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🎯</span>
                          <span>Foco: <strong style={{ color: "#16163f" }}>{commitments[rep].priority}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>💡</span>
                          <span>Mudança: <strong style={{ color: "#16163f" }}>{commitments[rep].change}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={copyAndClose}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: copied ? "#dcfce7" : "#25D366",
                    color: "#fff",
                    boxShadow: copied ? "none" : "0 4px 12px rgba(37,211,102,0.3)",
                  }}
                >
                  <Copy size={14} />
                  {copied ? "Copiado! Encerrando..." : "Copiar para WhatsApp"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "#E8EAED", background: "#F8F9FC" }}>
          <button
            onClick={() => setSection(s => Math.max(0, s - 1))}
            disabled={section === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "#FFFFFF",
              color: section === 0 ? "#D1D5DB" : "#6B7280",
              border: "1px solid #E8EAED",
              cursor: section === 0 ? "not-allowed" : "pointer",
            }}
          >
            Anterior
          </button>

          {/* Progress dots */}
          <div className="flex gap-2">
            {SECTIONS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === section ? 20 : 8,
                  height: 8,
                  background: i === section ? "#9e3ffd" : i < section ? "#16a34a" : "#E8EAED",
                }}
              />
            ))}
          </div>

          {section < 3 ? (
            <button
              onClick={() => canAdvance && setSection(s => s + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: canAdvance ? "#9e3ffd" : "#F3F4F6",
                color: canAdvance ? "#fff" : "#9CA3AF",
                cursor: canAdvance ? "pointer" : "not-allowed",
                boxShadow: canAdvance ? "0 2px 8px rgba(158,63,253,0.3)" : "none",
              }}
            >
              Próxima <ChevronRight size={14} />
            </button>
          ) : !showSummary ? (
            <button
              onClick={() => allFilled && setShowSummary(true)}
              disabled={!allFilled}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: allFilled ? "#9e3ffd" : "#F3F4F6",
                color: allFilled ? "#fff" : "#9CA3AF",
                cursor: allFilled ? "pointer" : "not-allowed",
                boxShadow: allFilled ? "0 2px 8px rgba(158,63,253,0.3)" : "none",
              }}
            >
              Encerrar Huddle
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
            >
              Fechar
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
