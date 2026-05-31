import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Copy, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import type { Lead } from "@/data/mockLeads";

const BANNED = ["só estou verificando", "alguma atualização", "voltando a entrar em contato", "qualquer coisa estou à disposição"];

function checkBanned(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

const messageTemplates = {
  whatsapp: (lead: Lead) => `Olá ${lead.dm_name?.split(" ")[0] || ""}! Sou da Ótima Energia.

Analisando contas de ${lead.industry_segment.toLowerCase()} em ${lead.city}, o ${lead.company} chamou atenção — o perfil de consumo tem potencial real de redução.

${lead.suggested_bill_ask_angle}

Levaria menos de 24h para ter o resultado. Posso te enviar mais detalhes?`,

  email: (lead: Lead) => `Assunto: Redução na conta de energia — ${lead.company}

${lead.dm_name ? `Prezado(a) ${lead.dm_name.split(" ")[0]},` : "Prezado(a),"}

${lead.rep_call_brief.split(".")[0]}.

Com base no perfil de ${lead.industry_segment.toLowerCase()} em ${lead.city}, identificamos uma oportunidade de redução que pode ser relevante para o ${lead.company}.

${lead.suggested_opening_angle}

${lead.suggested_bill_ask_angle}

Fico à disposição para uma conversa rápida.

Atenciosamente,
Equipe Ótima Energia`,

  cobranca: (lead: Lead) => `Olá ${lead.dm_name?.split(" ")[0] || ""}!

Só para não perder a janela — já terminei de preparar tudo para a análise do ${lead.company}.

${lead.suggested_bill_ask_angle}

Se conseguir enviar hoje, já te dou o resultado amanhã de manhã.`,

  interrupcao: (lead: Lead) => `${lead.dm_name?.split(" ")[0] || "Olá"},

Uma pergunta direta: você sabe quanto o ${lead.company} paga por kWh hoje?

Pergunto porque estamos vendo ${lead.industry_segment.toLowerCase()}s em ${lead.city} pagando até 30% a mais do que precisariam.

${lead.suggested_first_question}

São 90 segundos de conversa — posso ligar agora?`,
};

const contextInfo = {
  whatsapp: { style: "Remoção de Fricção", angle: "Bill Ask Direto" },
  email: { style: "Consultivo Formal", angle: "Apresentação de Oportunidade" },
  cobranca: { style: "Bill Chase Gentil", angle: "Urgência de Janela" },
  interrupcao: { style: "Interrupção de Padrão", angle: "Pergunta de Alto Impacto" },
};

type TabKey = "whatsapp" | "email" | "cobranca" | "interrupcao";

interface Props {
  lead: Lead;
  activeTab: TabKey;
}

export function MessageComposer({ lead, activeTab }: Props) {
  const [text, setText] = useState(messageTemplates[activeTab](lead));
  const [bannedPhrase, setBannedPhrase] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showContext, setShowContext] = useState(false);

  useEffect(() => {
    setText(messageTemplates[activeTab](lead));
    setBannedPhrase(null);
  }, [activeTab, lead]);

  function handleChange(val: string) {
    setText(val);
    setBannedPhrase(checkBanned(val));
  }

  function doCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ctx = contextInfo[activeTab];

  return (
    <div className="space-y-3">
      {/* Style badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(158,63,253,0.15)", color: "#c88ff5", border: "1px solid rgba(158,63,253,0.25)" }}>
          Estilo: {ctx.style}
        </span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Ângulo: {ctx.angle}</span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={e => handleChange(e.target.value)}
          rows={activeTab === "email" ? 12 : 8}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: bannedPhrase ? "1.5px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.85)",
            fontFamily: "inherit",
            lineHeight: 1.6,
          }}
          placeholder="Digite sua mensagem..."
        />

        {/* Banned phrase warning */}
        <AnimatePresence>
          {bannedPhrase && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 mt-1.5"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "#fca5a5" }}>
                Frase proibida detectada: <strong>"{bannedPhrase}"</strong> — evite linguagem passiva.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context used */}
      <div>
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Contexto utilizado: {lead.industry_segment} · {lead.city} · {ctx.angle}
          {showContext ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        <AnimatePresence>
          {showContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg p-3 mt-2 text-xs space-y-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
            >
              <div>Segmento: <span style={{ color: "rgba(255,255,255,0.7)" }}>{lead.industry_segment}</span></div>
              <div>Barreira de confiança: <span style={{ color: "rgba(255,255,255,0.7)" }}>{lead.likely_trust_barrier.level} — {lead.likely_trust_barrier.explanation}</span></div>
              <div>SOP utilizado: <span style={{ color: "rgba(255,255,255,0.7)" }}>SOP-09 Análise de Mensagem</span></div>
              <div>Ângulo: <span style={{ color: "rgba(255,255,255,0.7)" }}>{ctx.angle}</span></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={doCopy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: copied ? "rgba(34,197,94,0.2)" : "#9e3ffd", color: copied ? "#22c55e" : "#fff" }}
        >
          <Copy size={13} /> {copied ? "Copiado!" : "Copiar"}
        </button>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", cursor: "not-allowed" }}
          title="Indisponível no protótipo"
        >
          Enviar
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Clock size={13} /> Agendar
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(158,63,253,0.1)", color: "#c88ff5", border: "1px solid rgba(158,63,253,0.2)" }}
        >
          <Zap size={13} /> Acionar Sequência
        </button>
      </div>
    </div>
  );
}
