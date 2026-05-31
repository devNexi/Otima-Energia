import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Zap, User, MessageSquare, AlertTriangle,
  HelpCircle, FileText, RotateCcw, Copy, ChevronDown, ChevronUp, Phone,
} from "lucide-react";
import type { Lead } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

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
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#bbf7d0",
    text: "Perfeito, é exatamente essa situação com que trabalhamos. O caminho mais simples é a conta — pode me mandar agora pelo WhatsApp?",
    tag: null,
  },
  {
    label: "Ramo B — 100% coberto, empresa grande",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    text: "Entendido. Qual é mais ou menos o gasto mensal de energia? Pode haver um programa separado que vale a pena ver e que a placa solar não substitui.",
    tag: "ACL — sinalizar ao Renan",
  },
  {
    label: "Ramo C — 100% coberto, empresa pequena",
    color: "#9CA3AF",
    bg: "#F8F9FC",
    border: "#E8EAED",
    text: "Entendido, parece que estão bem servidos. Obrigada pelo tempo.",
    tag: "DNC genuíno",
  },
];

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }
  return { copiedKey, copy };
}

interface Props {
  lead: Lead;
  compact?: boolean;
  onScriptViewed?: () => void;
  scriptViewed?: boolean;
}

function CopyButton({ text, copyKey, copiedKey, copy }: { text: string; copyKey: string; copiedKey: string | null; copy: (t: string, k: string) => void }) {
  const done = copiedKey === copyKey;
  return (
    <button
      onClick={() => copy(text, copyKey)}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all mt-2"
      style={{
        background: done ? "#dcfce7" : "#F8F9FC",
        color: done ? "#16a34a" : "#6B7280",
        border: `1px solid ${done ? "#bbf7d0" : "#E8EAED"}`,
      }}
    >
      <Copy size={10} />{done ? "Copiado!" : "Copiar"}
    </button>
  );
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
    { emoji: "🎯", label: "Objetivo da Chamada", content: lead.call_objective, copyable: false, copyKey: "", variant: "normal" as const },
    { emoji: "⚡", label: "Por Que Agora", content: lead.call_why_now_angle, copyable: false, copyKey: "", variant: "normal" as const },
    { emoji: "👤", label: "Alvo", content: lead.dm_name ? `${lead.dm_name} · ${lead.dm_role}${lead.dm_direct_phone_best ? ` · ${lead.dm_direct_phone_best}` : " · Buscar número"}` : "Decisor não identificado", copyable: false, copyKey: "", variant: "normal" as const },
    { emoji: "🗣", label: "Diga Isso Primeiro", content: lead.suggested_opening_angle, copyable: true, copyKey: "opening", variant: "normal" as const },
    { emoji: "⚠", label: "Aviso de Confiança", content: lead.call_trust_warning, copyable: false, copyKey: "", variant: "amber" as const },
    { emoji: "❓", label: "Primeira Pergunta", content: lead.suggested_first_question, copyable: true, copyKey: "first_q", variant: "normal" as const },
    { emoji: "💡", label: "Ângulo do Pedido de Conta", content: lead.suggested_bill_ask_angle, copyable: true, copyKey: "bill_ask", variant: "normal" as const },
    { emoji: "🔄", label: "Script para Gatekeeper", content: lead.gatekeeper_script, copyable: true, copyKey: "gatekeeper", variant: "normal" as const },
  ];

  const lastEntry = lead.activity_timeline[0];

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3"}>
      {items.map((item, i) => {
        if (compact && i > 4) return null;
        const isAmber = item.variant === "amber";
        return (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: isAmber ? "1px solid #fde68a" : "1px solid #E8EAED" }}>
            <div
              className="px-3 py-2 flex items-center gap-2 border-b"
              style={{
                background: isAmber ? "#fffbeb" : "#F8F9FC",
                borderColor: isAmber ? "#fde68a" : "#E8EAED",
              }}
            >
              <span className="text-sm leading-none">{item.emoji}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isAmber ? "#d97706" : "#9CA3AF" }}
              >
                {item.label}
              </span>
            </div>
            <div
              className="px-3 py-2.5 text-sm"
              style={{
                background: "#FFFFFF",
                color: isAmber ? "#92400e" : "#374151",
              }}
            >
              {item.content}
              {item.copyable && item.copyKey && (
                <CopyButton text={item.content} copyKey={item.copyKey} copiedKey={copiedKey} copy={copy} />
              )}
            </div>
          </div>
        );
      })}

      {/* Last interaction summary */}
      {!compact && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAED" }}>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-left"
            style={{ background: "#F8F9FC", borderBottom: showSummary ? "1px solid #E8EAED" : "none" }}
            onClick={() => setShowSummary(v => !v)}
          >
            <span className="text-sm leading-none">📋</span>
            <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: "#9CA3AF" }}>
              Resumo da Última Interação
            </span>
            {showSummary
              ? <ChevronUp size={12} style={{ color: "#9CA3AF" }} />
              : <ChevronDown size={12} style={{ color: "#9CA3AF" }} />}
          </button>
          <AnimatePresence>
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-2.5 text-sm"
                style={{ background: "#FFFFFF", color: "#6B7280" }}
              >
                {lastEntry && (
                  <div className="flex items-center gap-2 text-[11px] mb-1.5" style={{ color: "#9CA3AF" }}>
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
            <span className="text-sm leading-none">🤔</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              Objeções Rápidas
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OBJECTIONS.map(obj => (
              <button
                key={obj.key}
                onClick={() => setOpenObjection(openObjection === obj.key ? null : obj.key)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: openObjection === obj.key ? "rgba(158,63,253,0.08)" : "#F8F9FC",
                  border: openObjection === obj.key ? "1px solid rgba(158,63,253,0.3)" : "1px solid #E8EAED",
                  color: openObjection === obj.key ? "#9e3ffd" : "#6B7280",
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
                className="rounded-xl overflow-hidden mt-2"
                style={{ border: "1px solid rgba(158,63,253,0.2)" }}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(158,63,253,0.06)", color: "#9e3ffd", borderBottom: "1px solid rgba(158,63,253,0.15)" }}>
                  Resposta sugerida (Voss)
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-sm mb-2.5" style={{ color: "#374151" }}>{simpleObjectionResponses[openObjection]}</div>
                  <CopyButton text={simpleObjectionResponses[openObjection]} copyKey={openObjection} copiedKey={copiedKey} copy={copy} />
                </div>
              </motion.div>
            )}

            {openObjection === "solar" && (
              <motion.div
                key="solar"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl overflow-hidden mt-2 space-y-2"
                style={{ border: "1px solid #fde68a" }}
              >
                <div className="px-3 py-1.5" style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>
                    🌱 Diagnóstico Solar — 3 Ramos
                  </div>
                </div>
                <div className="px-3 pb-3 space-y-3">
                  <div className="rounded-xl p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#d97706" }}>Passo 1 — Pergunta diagnóstica:</div>
                    <div className="text-sm" style={{ color: "#92400e" }}>"{SOLAR_STEP1}"</div>
                    <CopyButton text={SOLAR_STEP1} copyKey="solar_step1" copiedKey={copiedKey} copy={copy} />
                  </div>
                  {SOLAR_BRANCHES.map((branch, bi) => (
                    <div key={bi} className="rounded-xl p-3" style={{ background: branch.bg, border: `1px solid ${branch.border}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: branch.color }}>↳ {branch.label}</span>
                        {branch.tag && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}>
                            {branch.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: "#374151" }}>"{branch.text}"</div>
                      <CopyButton text={branch.text} copyKey={`solar_branch_${bi}`} copiedKey={copiedKey} copy={copy} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Call CTA */}
      <motion.button
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={openDialer}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style={{
          background: "linear-gradient(135deg,#9e3ffd,#df0af2)",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(158,63,253,0.3)",
        }}
      >
        <Phone size={15} /> Iniciar Chamada
      </motion.button>
    </div>
  );
}
