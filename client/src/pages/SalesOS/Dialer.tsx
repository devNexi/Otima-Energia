import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { CallAssistPanel } from "@/components/sales/CallAssistPanel";
import { mockLeads, priorityConfig } from "@/data/mockLeads";
import {
  Phone, PhoneOff, Mic, MicOff, Clock, SkipForward,
  X, ChevronDown, CheckCircle, AlertTriangle,
} from "lucide-react";

type CallState = "pre_call" | "in_call" | "post_call";

const OUTCOMES = [
  "Decisor Alcançado", "Gatekeeper", "Não Atendeu", "Caixa Postal",
  "Número Errado", "Ocupado", "Recusou Conversar",
];
const NEXT_ACTIONS = [
  "Ligar novamente", "Enviar WhatsApp", "Enviar Email",
  "Acionar Bill Chase", "Agendar Callback", "Escalar para Renan", "Encerrar",
];
const TIME_WINDOWS = ["Manhã", "Meio-dia", "Tarde", "Fim do Dia"];

const QUEUE = mockLeads.filter(l => ["P1", "P2", "P3"].includes(l.priority)).slice(0, 5);
const activeLead = QUEUE[0];

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface OutcomeForm {
  outcome: string;
  nextAction: string;
  nextDate: string;
  nextObjective: string;
  timeWindow: string;
  notes: string;
  usedBriefing: boolean;
  pedidoConta: boolean;
  nextStepDefined: boolean;
  billChase: boolean;
  followUp: boolean;
  enrich: boolean;
  escalate: boolean;
}

const defaultForm: OutcomeForm = {
  outcome: "", nextAction: "", nextDate: "", nextObjective: "", timeWindow: "", notes: "",
  usedBriefing: false, pedidoConta: false, nextStepDefined: false,
  billChase: false, followUp: false, enrich: false, escalate: false,
};

function formValid(f: OutcomeForm) {
  return f.outcome && f.nextAction && f.nextDate && f.nextObjective && f.timeWindow;
}

export default function Dialer() {
  const [, navigate] = useLocation();
  const [callState, setCallState] = useState<CallState>("pre_call");
  const [scriptViewed, setScriptViewed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [form, setForm] = useState<OutcomeForm>(defaultForm);
  const [submitted, setSubmitted] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showSkip, setShowSkip] = useState(false);

  const timer = useTimer(callState === "in_call");
  const lead = activeLead;
  const pConf = priorityConfig[lead.priority];

  const queueTypeLabels: Record<string, { label: string; color: string }> = {
    bill_chase_priority: { label: "COBRAR CONTA", color: "#ef4444" },
    exact_callback: { label: "CALLBACK ATRASADO", color: "#f59e0b" },
    dm_reached_no_bill: { label: "DECISOR SEM CONTA", color: "#f97316" },
    dm_identified_first_contact: { label: "PRIMEIRO CONTATO", color: "#3b82f6" },
    new_julia_lead: { label: "NOVO LEAD JULIA", color: "#9e3ffd" },
    follow_up_pending: { label: "FOLLOW-UP PENDENTE", color: "#f59e0b" },
    gatekeeper_penetration: { label: "PENETRAR GATEKEEPER", color: "#3b82f6" },
    stale_lead_reactivation: { label: "REATIVAR LEAD", color: "#64748b" },
    proposal_chase: { label: "CHASE DE PROPOSTA", color: "#ef4444" },
    review_20_attempts: { label: "REVISÃO 20 TENTATIVAS", color: "#7f1d1d" },
    bill_chase_stale: { label: "COBRAR CONTA — PARADO", color: "#dc2626" },
  };
  const queueConf = queueTypeLabels[lead.dialer_queue_type] ?? { label: lead.dialer_queue_type, color: "#9e3ffd" };

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="text-xs mb-1.5 block font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label} <span style={{ color: "#ef4444" }}>*</span></label>
        {children}
      </div>
    );
  }

  return (
    <SalesOSLayout>
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0f0e2a" }}>
        {/* Header strip */}
        <div className="shrink-0 px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
          <button onClick={() => navigate("/sales-os/queue")} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            ← Fila
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {QUEUE.map((l, i) => (
                <div key={l.id} className="w-2 h-2 rounded-full" style={{ background: i === 0 ? "#9e3ffd" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{QUEUE.length} na fila</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold" style={{ color: callState === "in_call" ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
            <Clock size={14} />
            {timer}
          </div>
        </div>

        {/* Two panels */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Who you're calling */}
          <div className="overflow-y-auto p-8 flex flex-col gap-6" style={{ width: "45%", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Who */}
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Você está ligando para</div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#fff" }}>{lead.company}</h1>
              {lead.dm_name && (
                <div className="text-lg mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>{lead.dm_name} · <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>{lead.dm_role}</span></div>
              )}
              {lead.dm_direct_phone_best && (
                <div className="text-xl font-bold font-mono mb-4" style={{ color: "#c88ff5", letterSpacing: 1 }}>{lead.dm_direct_phone_best}</div>
              )}
            </div>

            {/* Why this call */}
            <div className="rounded-2xl p-4" style={{ background: `${queueConf.color}14`, border: `1px solid ${queueConf.color}33` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide" style={{ background: `${queueConf.color}22`, color: queueConf.color }}>
                  {queueConf.label}
                </span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded text-white ${pConf.color}`}>{lead.priority}</span>
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{lead.call_why_now_angle}</div>
            </div>

            {/* Attempt + Last window */}
            <div className="flex gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Tentativas</div>
                <div className="font-bold text-lg" style={{ color: lead.attempt_count >= 15 ? "#f59e0b" : "rgba(255,255,255,0.7)" }}>
                  {lead.attempt_count}
                  {lead.attempt_count >= 15 && <AlertTriangle size={14} className="inline ml-1" style={{ color: "#f59e0b" }} />}
                </div>
              </div>
              {lead.last_time_window && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Melhor Janela</div>
                  <div className="text-sm px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}>{lead.last_time_window}</div>
                </div>
              )}
            </div>

            {/* Last interaction */}
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Última Interação</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{lead.last_interaction_summary}</div>
            </div>

            {/* Call controls */}
            <div className="flex flex-col gap-3">
              {callState === "pre_call" && (
                <>
                  {!scriptViewed ? (
                    <button
                      onClick={() => setScriptViewed(true)}
                      className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      ✓ Marcar script visualizado
                    </button>
                  ) : (
                    <motion.button
                      initial={{ scale: 0.97 }}
                      animate={{ scale: 1 }}
                      onClick={() => setCallState("in_call")}
                      className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", boxShadow: "0 8px 32px rgba(34,197,94,0.3)" }}
                    >
                      <Phone size={20} /> Iniciar Chamada
                    </motion.button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSkip(!showSkip)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <SkipForward size={14} className="inline mr-1.5" /> Pular com Motivo
                    </button>
                    <button
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <Clock size={14} className="inline mr-1.5" /> Adiar 15 min
                    </button>
                  </div>
                  <AnimatePresence>
                    {showSkip && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <input
                          value={skipReason}
                          onChange={e => setSkipReason(e.target.value)}
                          placeholder="Motivo para pular..."
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                        />
                        <button
                          onClick={() => navigate("/sales-os/queue")}
                          disabled={!skipReason.trim()}
                          className="w-full py-2 rounded-xl text-sm font-semibold"
                          style={{ background: skipReason.trim() ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: skipReason.trim() ? "#f59e0b" : "rgba(255,255,255,0.3)", border: `1px solid ${skipReason.trim() ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}` }}
                        >
                          Confirmar Pulo
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {callState === "in_call" && (
                <div className="flex flex-col gap-3">
                  <div className="text-center font-mono text-3xl font-bold mb-2" style={{ color: "#22c55e" }}>
                    {timer}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMuted(!muted)}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: muted ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)", color: muted ? "#fca5a5" : "rgba(255,255,255,0.65)", border: muted ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {muted ? <MicOff size={16} /> : <Mic size={16} />}
                      {muted ? "Mudo" : "Mudo"}
                    </button>
                    <button
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      Em Espera
                    </button>
                    <button
                      onClick={() => setCallState("post_call")}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      <PhoneOff size={16} /> Encerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Call Assist (compact) */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Assistência de Chamada
            </div>
            <CallAssistPanel
              lead={lead}
              compact
              scriptViewed={scriptViewed}
              onScriptViewed={() => setScriptViewed(true)}
            />
          </div>
        </div>

        {/* POST-CALL OUTCOME MODAL */}
        <AnimatePresence>
          {callState === "post_call" && !submitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: "#16163f", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}
              >
                <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
                  <h2 className="text-lg font-bold" style={{ color: "#fff" }}>Como foi a chamada?</h2>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.company} · {lead.dm_name}</div>
                </div>

                <div className="p-6 space-y-4">
                  <Field label="Resultado">
                    <div className="relative">
                      <select
                        value={form.outcome}
                        onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: form.outcome ? "#fff" : "rgba(255,255,255,0.4)" }}
                      >
                        <option value="">Selecionar resultado...</option>
                        {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </div>
                  </Field>

                  <Field label="Próxima Ação">
                    <div className="relative">
                      <select
                        value={form.nextAction}
                        onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: form.nextAction ? "#fff" : "rgba(255,255,255,0.4)" }}
                      >
                        <option value="">Selecionar próxima ação...</option>
                        {NEXT_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </div>
                  </Field>

                  <Field label="Data/Hora Próxima Ação">
                    <input
                      type="datetime-local"
                      value={form.nextDate}
                      onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", colorScheme: "dark" }}
                    />
                  </Field>

                  <Field label="Objetivo da Próxima Ação">
                    <input
                      value={form.nextObjective}
                      onChange={e => setForm(f => ({ ...f, nextObjective: e.target.value.slice(0, 100) }))}
                      placeholder="Descreva o objetivo em até 100 caracteres..."
                      maxLength={100}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                    <div className="text-[10px] text-right mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{form.nextObjective.length}/100</div>
                  </Field>

                  <Field label="Janela de Horário da Chamada">
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_WINDOWS.map(w => (
                        <button
                          key={w}
                          onClick={() => setForm(f => ({ ...f, timeWindow: w }))}
                          className="py-2 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: form.timeWindow === w ? "rgba(158,63,253,0.2)" : "rgba(255,255,255,0.05)",
                            color: form.timeWindow === w ? "#c88ff5" : "rgba(255,255,255,0.5)",
                            border: form.timeWindow === w ? "1px solid rgba(158,63,253,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >{w}</button>
                      ))}
                    </div>
                  </Field>

                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Notas (opcional)</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      placeholder="Observações da chamada..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </div>

                  {/* Compliance */}
                  <div>
                    <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Compliance (opcional)</div>
                    <div className="space-y-1.5">
                      {[
                        { key: "usedBriefing", label: "Usei o briefing" },
                        { key: "pedidoConta", label: "Pedi a conta" },
                        { key: "nextStepDefined", label: "Defini próximo passo" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                          <input
                            type="checkbox"
                            checked={form[key as keyof OutcomeForm] as boolean}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                            className="accent-purple-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sequences */}
                  <div>
                    <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Acionar sequência (opcional)</div>
                    <div className="space-y-1.5">
                      {[
                        { key: "billChase", label: "Iniciar Bill Chase" },
                        { key: "followUp", label: "Follow-Up Comercial" },
                        { key: "enrich", label: "Enriquecer Decisor" },
                        { key: "escalate", label: "Escalar para Renan" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                          <input
                            type="checkbox"
                            checked={form[key as keyof OutcomeForm] as boolean}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                            className="accent-purple-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => { setCallState("pre_call"); setScriptViewed(false); setForm(defaultForm); setMuted(false); }}
                    className="px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => { if (formValid(form)) setSubmitted(true); }}
                    disabled={!formValid(form)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: formValid(form) ? "linear-gradient(135deg,#9e3ffd,#df0af2)" : "rgba(255,255,255,0.08)",
                      color: formValid(form) ? "#fff" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    Salvar e Próxima Chamada →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submitted confirmation */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <div className="text-center">
                <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
                <div className="text-xl font-bold mb-2" style={{ color: "#fff" }}>Chamada registrada!</div>
                <div className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Próxima chamada carregando...</div>
                <button
                  onClick={() => { setSubmitted(false); setCallState("pre_call"); setScriptViewed(false); setForm(defaultForm); setMuted(false); }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "#9e3ffd", color: "#fff" }}
                >
                  Próxima Chamada →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SalesOSLayout>
  );
}
