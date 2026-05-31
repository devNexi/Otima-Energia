import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Zap, User, MessageSquare, AlertTriangle,
  HelpCircle, FileText, RotateCcw, Copy, ChevronDown, ChevronUp, Phone,
} from "lucide-react";
import type { Lead } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

/* ─── Objection definitions ─────────────────────────────────────── */

const OBJECTIONS = [
  { key: "sem_tempo", label: "Sem tempo" },
  { key: "solar", label: "Já tem solar" },
  { key: "mercado_livre", label: "Mercado livre" },
  { key: "email", label: "Manda por email" },
  { key: "chefe", label: "Chefe não está" },
  { key: "scam", label: "Parece golpe" },
  { key: "sem_interesse", label: "Sem interesse" },
];

const simpleObjectionResponses: Record<string, string> = {
  sem_tempo: "Entendo — eu também não perderia seu tempo à toa. São exatamente 90 segundos. Se eu não agregar nada nesse tempo, nunca mais ligo. Posso?",
  mercado_livre: "O Mercado Livre é uma opção — mas para o seu perfil de consumo, GD tem uma entrada mais simples e sem riscos de exposição ao preço spot. Vale comparar os dois?",
  email: "Claro — mas por email leva dias para o seu caso chegar à análise certa. São 3 minutos agora e você já sai com o número de economia estimada. O que você prefere?",
  chefe: "Sem problema. Para quando o [nome do chefe] volta? Assim eu ligo direto com ele no horário certo.",
  scam: "Completamente legítimo — entendo a desconfiança. Posso mandar nosso site e CNPJ agora mesmo. Mas só para você ter um ponto de referência: você já ouviu falar da Ótima Energia?",
  sem_interesse: "Respeito isso. Mas me permite uma pergunta antes: você já sabe quanto a empresa paga por mês de energia? Porque quem diz que não tem interesse normalmente ainda não viu o número.",
};

const SOLAR_STEP1 = "Ótimo — a placa cobre 100% do consumo ou ainda recebem fatura de energia?";
const SOLAR_BRANCHES = [
  {
    label: "Ramo A — Se ainda tem fatura",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    text: "Perfeito, é exatamente essa situação com que trabalhamos. O caminho mais simples é a conta — pode me mandar agora pelo WhatsApp?",
    tag: null,
  },
  {
    label: "Ramo B — 100% coberto, empresa grande",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    text: "Entendido. Qual é mais ou menos o gasto mensal de energia? Pode haver um programa separado que vale a pena ver e que a placa solar não substitui.",
    tag: "ACL — sinalizar ao Renan",
  },
  {
    label: "Ramo C — 100% coberto, empresa pequena",
    color: "rgba(255,255,255,0.4)",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.12)",
    text: "Entendido, parece que estão bem servidos. Obrigada pelo tempo.",
    tag: "DNC genuíno",
  },
];

/* ─── Copy hook ─────────────────────────────────────────────────── */

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }
  return { copiedKey, copy };
}

/* ─── Component ─────────────────────────────────────────────────── */

interface Props {
  lead: Lead;
  compact?: boolean;
  onScriptViewed?: () => void;
  scriptViewed?: boolean;
}

export function CallAssistPanel({ lead, compact = false }: Props) {
  const [openObjection, setOpenObjection] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();
  const { copiedKey, copy } = useCopy();

  function openDialer() {
    toast({ title: "Abrindo discador..." });
  }

  const items = [
    {
      emoji: "🎯",
      label: "Objetivo da Chamada",
      content: lead.call_objective,
      copyable: false,
      variant: "normal" as const,
    },
    {
      emoji: "⚡",
      label: "Por Que Agora",
      content: lead.call_why_now_angle,
      copyable: false,
      variant: "normal" as const,
    },
    {
      emoji: "👤",
      label: "Alvo",
      content: lead.dm_name
        ? `${lead.dm_name} · ${lead.dm_role}${lead.dm_direct_phone_best ? ` · ${lead.dm_direct_phone_best}` : " · Buscar número"}`
        : "Decisor não identificado",
      copyable: false,
      variant: "normal" as const,
    },
    {
      emoji: "🗣",
      label: "Diga Isso Primeiro",
      content: lead.suggested_opening_angle,
      copyable: true,
      copyKey: "opening",
      variant: "normal" as const,
    },
    {
      emoji: "⚠",
      label: "Aviso de Confiança",
      content: lead.call_trust_warning,
      copyable: false,
      variant: "amber" as const,
    },
    {
      emoji: "❓",
      label: "Primeira Pergunta",
      content: lead.suggested_first_question,
      copyable: true,
      copyKey: "first_q",
      variant: "normal" as const,
    },
    {
      emoji: "💡",
      label: "Ângulo do Pedido de Conta",
      content: lead.suggested_bill_ask_angle,
      copyable: true,
      copyKey: "bill_ask",
      variant: "normal" as const,
    },
    {
      emoji: "🔄",
      label: "Script para Gatekeeper",
      content: lead.gatekeeper_script,
      copyable: true,
      copyKey: "gatekeeper",
      variant: "normal" as const,
    },
  ];

  const lastEntry = lead.activity_timeline[0];

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3"}>
      {items.map((item, i) => {
        if (compact && i > 4) return null;
        const isAmber = item.variant === "amber";
        return (
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base leading-none" style={{ lineHeight: 1 }}>{item.emoji}</span>
              <span
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: isAmber ? "#f59e0b" : "rgba(255,255,255,0.4)" }}
              >
                {item.label}
              </span>
            </div>
            <div
              className="text-sm rounded-lg px-3 py-2.5"
              style={{
                background: isAmber ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)",
                border: isAmber ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.07)",
                color: isAmber ? "#fcd34d" : "rgba(255,255,255,0.75)",
              }}
            >
              {item.content}
              {item.copyable && item.copyKey && (
                <div className="mt-2">
                  <button
                    onClick={() => copy(item.content, item.copyKey!)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                    style={{
                      background: copiedKey === item.copyKey ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                      color: copiedKey === item.copyKey ? "#22c55e" : "rgba(255,255,255,0.45)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Copy size={10} />{copiedKey === item.copyKey ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Last interaction summary */}
      {!compact && (
        <div>
          <button
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setShowSummary(v => !v)}
          >
            <span className="text-base leading-none">📋</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
              Resumo da Última Interação
            </span>
            {showSummary
              ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto" }} />
              : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto" }} />}
          </button>
          <AnimatePresence>
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm rounded-lg px-3 py-2.5 mt-1 space-y-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
              >
                {lastEntry && (
                  <div className="flex items-center gap-2 text-[11px] mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ color: "#9e3ffd" }}>{lastEntry.timestamp}</span>
                    <span>·</span>
                    <span>{lastEntry.outcome}</span>
                    <span>·</span>
                    <span>{lastEntry.rep}</span>
                  </div>
                )}
                {lead.last_interaction_summary}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Objections */}
      {!compact && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base leading-none">🤔</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
              Objeções Rápidas
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OBJECTIONS.map(obj => (
              <button
                key={obj.key}
                onClick={() => setOpenObjection(openObjection === obj.key ? null : obj.key)}
                className="px-2.5 py-1 rounded-full text-xs transition-all"
                style={{
                  background: openObjection === obj.key ? "rgba(158,63,253,0.2)" : "rgba(255,255,255,0.06)",
                  border: openObjection === obj.key ? "1px solid rgba(158,63,253,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  color: openObjection === obj.key ? "#c88ff5" : "rgba(255,255,255,0.55)",
                }}
              >
                {obj.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {openObjection && openObjection !== "solar" && (
              <motion.div
                key={openObjection}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg p-3 mt-2"
                style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}
              >
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Resposta sugerida (Voss):</div>
                <div className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {simpleObjectionResponses[openObjection]}
                </div>
                <button
                  onClick={() => copy(simpleObjectionResponses[openObjection], openObjection)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                  style={{
                    background: copiedKey === openObjection ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                    color: copiedKey === openObjection ? "#22c55e" : "rgba(255,255,255,0.45)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Copy size={10} />{copiedKey === openObjection ? "Copiado!" : "Copiar"}
                </button>
              </motion.div>
            )}

            {openObjection === "solar" && (
              <motion.div
                key="solar"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg p-3 mt-2 space-y-3"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#f59e0b" }}>
                    🌱 Diagnóstico Solar — 3 Ramos
                  </div>
                  {/* Step 1 */}
                  <div className="text-xs rounded-lg px-3 py-2.5 mb-3" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" }}>
                    <div className="font-semibold mb-0.5 text-[11px] uppercase tracking-wide" style={{ color: "#f59e0b" }}>Passo 1 — Pergunta diagnóstica:</div>
                    "{SOLAR_STEP1}"
                    <div className="mt-2">
                      <button
                        onClick={() => copy(SOLAR_STEP1, "solar_step1")}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                        style={{
                          background: copiedKey === "solar_step1" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                          color: copiedKey === "solar_step1" ? "#22c55e" : "rgba(255,255,255,0.45)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Copy size={10} />{copiedKey === "solar_step1" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  {/* Branches */}
                  {SOLAR_BRANCHES.map((branch, bi) => (
                    <div key={bi} className="rounded-lg px-3 py-2.5 mb-2" style={{ background: branch.bg, border: `1px solid ${branch.border}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: branch.color }}>↳ {branch.label}</span>
                        {branch.tag && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" }}>
                            {branch.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                        "{branch.text}"
                      </div>
                      <button
                        onClick={() => copy(branch.text, `solar_branch_${bi}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                        style={{
                          background: copiedKey === `solar_branch_${bi}` ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                          color: copiedKey === `solar_branch_${bi}` ? "#22c55e" : "rgba(255,255,255,0.45)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Copy size={10} />{copiedKey === `solar_branch_${bi}` ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Iniciar Chamada — always shown, no gate */}
      <motion.button
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={openDialer}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}
      >
        <Phone size={15} /> Iniciar Chamada
      </motion.button>
    </div>
  );
}
