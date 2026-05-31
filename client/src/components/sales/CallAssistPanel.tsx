import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, User, MessageSquare, AlertTriangle, HelpCircle, FileText, RotateCcw, Copy, ChevronDown, ChevronUp, CheckCircle, Phone } from "lucide-react";
import type { Lead } from "@/data/mockLeads";
import { useI18n } from "@/lib/i18n";

const OBJECTIONS = [
  { key: "sem_tempo", label: "Sem tempo" },
  { key: "solar", label: "Já tem solar" },
  { key: "mercado_livre", label: "Mercado livre" },
  { key: "email", label: "Manda por email" },
  { key: "chefe", label: "Chefe não está" },
  { key: "scam", label: "Parece golpe" },
  { key: "sem_interesse", label: "Sem interesse" },
];

const objectionResponses: Record<string, string> = {
  sem_tempo: "Entendo — eu também não perderia seu tempo à toa. São exatamente 90 segundos. Se eu não agregar nada nesse tempo, nunca mais ligo. Posso?",
  solar: "Faz sentido você ter explorado isso. Solar e GD funcionam de formas diferentes — solar gera de dia, GD garante o noturno. Você já sabe qual parte do consumo o solar está cobrindo?",
  mercado_livre: "O Mercado Livre é uma opção — mas para o seu perfil de consumo, GD tem uma entrada mais simples e sem riscos de exposição ao preço spot. Vale comparar os dois?",
  email: "Claro — mas por email leva dias para o seu caso chegar à análise certa. São 3 minutos agora e você já sai com o número de economia estimada. O que você prefere?",
  chefe: "Sem problema. Para quando o [nome do chefe] volta? Assim eu ligo direto com ele no horário certo.",
  scam: "Completamente legítimo — entendo a desconfiança. Posso mandar nosso site e CNPJ agora mesmo. Mas só para você ter um ponto de referência: você já ouviu falar da Ótima Energia?",
  sem_interesse: "Respeito isso. Mas me permite uma pergunta antes: você já sabe quanto a empresa paga por mês de energia? Porque quem diz que não tem interesse normalmente ainda não viu o número.",
};

interface Props {
  lead: Lead;
  compact?: boolean;
  onScriptViewed?: () => void;
  scriptViewed?: boolean;
}

export function CallAssistPanel({ lead, compact = false, onScriptViewed, scriptViewed = false }: Props) {
  const [openObjection, setOpenObjection] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedObj, setCopiedObj] = useState(false);
  const { t } = useI18n();

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  function copyObj(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedObj(true);
    setTimeout(() => setCopiedObj(false), 1800);
  }

  const items = [
    { icon: <Target size={14} />, label: t("salesos.callassist.call_objective"), content: lead.call_objective },
    { icon: <Zap size={14} />, label: t("salesos.callassist.why_now"), content: lead.call_why_now_angle },
    { icon: <User size={14} />, label: t("salesos.callassist.target"), content: lead.dm_name ? `${lead.dm_name} · ${lead.dm_role} · ${lead.dm_direct_phone_best || "Buscar número"}` : t("salesos.callassist.dm_not_found") },
    { icon: <MessageSquare size={14} />, label: t("salesos.callassist.say_first"), content: lead.suggested_opening_angle, copyable: true },
    { icon: <AlertTriangle size={14} />, label: t("salesos.callassist.trust_warning"), content: lead.call_trust_warning, variant: "amber" as const },
    { icon: <HelpCircle size={14} />, label: t("salesos.callassist.first_question"), content: lead.suggested_first_question, copyable: true },
    { icon: <FileText size={14} />, label: t("salesos.callassist.bill_ask"), content: lead.suggested_bill_ask_angle, copyable: true },
    { icon: <RotateCcw size={14} />, label: t("salesos.callassist.gatekeeper"), content: lead.gatekeeper_script, copyable: true },
  ];

  return (
    <div className={compact ? "space-y-3" : "space-y-3"}>
      {items.map((item, i) => {
        if (compact && i > 5) return null;
        return (
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: item.variant === "amber" ? "#f59e0b" : "#9e3ffd" }}>{item.icon}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
            </div>
            <div
              className="text-sm rounded-lg px-3 py-2.5 relative"
              style={{
                background: item.variant === "amber" ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)",
                border: item.variant === "amber" ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.07)",
                color: item.variant === "amber" ? "#fcd34d" : "rgba(255,255,255,0.75)",
              }}
            >
              {item.content}
              {item.copyable && (
                <div className="mt-1.5">
                  <button
                    onClick={() => copyText(item.content, i)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                    style={{ background: copiedIdx === i ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copiedIdx === i ? "#22c55e" : "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Copy size={10} />{copiedIdx === i ? t("salesos.callassist.copied") : t("salesos.callassist.copy")}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!compact && (
        <div>
          <button
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setShowSummary(!showSummary)}
          >
            <span style={{ color: "#9e3ffd" }}><FileText size={14} /></span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>{t("salesos.callassist.last_summary")}</span>
            {showSummary ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto" }} /> : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto" }} />}
          </button>
          <AnimatePresence>
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm rounded-lg px-3 py-2.5 mt-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
              >
                {lead.last_interaction_summary}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!compact && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t("salesos.callassist.objections")}
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
            {openObjection && (
              <motion.div
                key={openObjection}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg p-3 mt-2"
                style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}
              >
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{t("salesos.callassist.suggested_voss")}</div>
                <div className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>{objectionResponses[openObjection]}</div>
                <button
                  onClick={() => copyObj(objectionResponses[openObjection])}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all"
                  style={{ background: copiedObj ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copiedObj ? "#22c55e" : "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Copy size={10} />{copiedObj ? t("salesos.callassist.copied") : t("salesos.callassist.copy")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!scriptViewed ? (
        <button
          onClick={onScriptViewed}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {t("salesos.callassist.mark_script")}
        </button>
      ) : (
        <motion.button
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}
        >
          <Phone size={15} /> {t("salesos.callassist.start_call")}
        </motion.button>
      )}
    </div>
  );
}
