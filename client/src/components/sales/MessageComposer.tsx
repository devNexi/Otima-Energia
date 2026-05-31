import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Copy, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import type { Lead } from "@/data/mockLeads";

const BANNED = [
  "só estou verificando",
  "alguma atualização",
  "voltando a entrar em contato",
  "qualquer coisa estou à disposição",
  "só passando para verificar",
  "circling back",
  "following up",
  "checking in",
];

function checkBanned(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

const messageTemplates = {
  whatsapp: (lead: Lead) =>
    `Olá ${lead.dm_name?.split(" ")[0] || ""}! Aqui é da Ótima Energia.

Estou acompanhando o mercado de ${lead.industry_segment.toLowerCase()} em ${lead.city} e o ${lead.company} tem um perfil de consumo com potencial real de redução de custo.

${lead.suggested_bill_ask_angle}

O processo é simples: você envia a conta, a gente analisa em 24h e apresenta o resultado — sem custo e sem compromisso.

Vale dar uma olhada?`,

  email: (lead: Lead) =>
    `Assunto: Oportunidade de redução na conta de energia — ${lead.company}

${lead.dm_name ? `Prezado(a) ${lead.dm_name.split(" ")[0]},` : "Prezado(a),"}

${lead.rep_call_brief.split(".")[0]}.

Analisando o perfil de consumo de empresas do segmento de ${lead.industry_segment.toLowerCase()} em ${lead.city}, identificamos uma oportunidade que pode ser relevante para o ${lead.company}.

${lead.suggested_opening_angle}

${lead.suggested_bill_ask_angle}

Disponível para uma conversa rápida de 15 minutos?

Atenciosamente,
Equipe Ótima Energia`,

  cobranca: (lead: Lead) =>
    `${lead.dm_name?.split(" ")[0] || "Olá"},

Finalizei toda a preparação para a análise do ${lead.company} — só estou aguardando a conta de luz para gerar o resultado.

${lead.suggested_bill_ask_angle}

Se conseguir enviar hoje, já te passo o número de economia amanhã de manhã. A janela desta semana fecha quinta.

Pode mandar aqui pelo WhatsApp mesmo — uma foto já resolve!`,

  interrupcao: (lead: Lead) =>
    `${lead.dm_name?.split(" ")[0] || ""},

Uma pergunta direta: quanto o ${lead.company} paga por kWh hoje?

Pergunto porque estamos vendo ${lead.industry_segment.toLowerCase()}s em ${lead.city} pagando até 32% acima do necessário.

${lead.suggested_first_question}

São 90 segundos de conversa — posso ligar agora?`,
};

const contextInfo = {
  whatsapp: { style: "Remoção de Fricção", angle: "Bill Ask Direto", cta: "Enviar conta por WhatsApp" },
  email: { style: "Value Drop", angle: "Apresentação de Oportunidade", cta: "Agendar conversa" },
  cobranca: { style: "Remoção de Fricção escalando para Interrupção", angle: "Urgência de Janela", cta: "Enviar foto da conta" },
  interrupcao: { style: "Interrupção de Padrão", angle: "Pergunta de Alto Impacto", cta: "Responder agora" },
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
    if (bannedPhrase) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ctx = contextInfo[activeTab];
  const isBlocked = !!bannedPhrase;

  return (
    <div className="space-y-3">
      {/* Style badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
        >
          Estilo: {ctx.style}
        </span>
        <span className="text-xs" style={{ color: "#D1D5DB" }}>·</span>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>CTA: {ctx.cta}</span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={e => handleChange(e.target.value)}
          rows={activeTab === "email" ? 12 : 8}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{
            background: "#FFFFFF",
            border: isBlocked ? "1.5px solid #dc2626" : "1px solid #E8EAED",
            color: "#374151",
            fontFamily: "inherit",
            lineHeight: 1.6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          onFocus={e => { if (!isBlocked) e.target.style.borderColor = "#9e3ffd"; }}
          onBlur={e => { if (!isBlocked) e.target.style.borderColor = "#E8EAED"; }}
          placeholder="Digite sua mensagem..."
        />

        <AnimatePresence>
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 mt-1.5"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <AlertCircle size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "#dc2626" }}>
                ⚠ Linguagem genérica detectada. Use o ângulo sugerido acima.{" "}
                <strong>Frase: "{bannedPhrase}"</strong>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context used */}
      <div>
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: "#9CA3AF" }}
        >
          Contexto utilizado {showContext ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        <AnimatePresence>
          {showContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl p-3 mt-2 text-xs space-y-1"
              style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#6B7280" }}
            >
              <div>Segmento: <span style={{ color: "#374151" }}>{lead.industry_segment}</span></div>
              <div>
                Barreira de confiança:{" "}
                <span style={{ color: "#374151" }}>
                  {lead.likely_trust_barrier.level} — {lead.likely_trust_barrier.explanation}
                </span>
              </div>
              <div>Ângulo SOP: <span style={{ color: "#374151" }}>{ctx.angle}</span></div>
              <div>CTA: <span style={{ color: "#374151" }}>{ctx.cta}</span></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={doCopy}
          disabled={isBlocked}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: isBlocked ? "#F3F4F6" : copied ? "#dcfce7" : "#9e3ffd",
            color: isBlocked ? "#9CA3AF" : copied ? "#16a34a" : "#fff",
            cursor: isBlocked ? "not-allowed" : "pointer",
            boxShadow: isBlocked ? "none" : copied ? "none" : "0 2px 8px rgba(158,63,253,0.25)",
          }}
        >
          <Copy size={13} /> {copied ? "Copiado!" : "Copiar"}
        </button>
        <button
          disabled={isBlocked}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "#F8F9FC",
            color: isBlocked ? "#9CA3AF" : "#6B7280",
            border: `1px solid ${isBlocked ? "#fecaca" : "#E8EAED"}`,
            cursor: "not-allowed",
          }}
          title={isBlocked ? "Remova a linguagem genérica antes de enviar" : "Indisponível no protótipo"}
        >
          {isBlocked ? "⚠ Enviar bloqueado" : "Enviar"}
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
        >
          <Clock size={13} /> Agendar
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: "rgba(158,63,253,0.08)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.2)" }}
        >
          <Zap size={13} /> Acionar Sequência
        </button>
      </div>
    </div>
  );
}
