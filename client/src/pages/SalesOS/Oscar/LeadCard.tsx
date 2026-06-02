import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { SalesOSLayout } from "@/components/sales/SalesOSLayout";
import { mockOscarLeads, OscarLead } from "@/data/mockOscarLeads";
import {
  ArrowLeft, Building2, MapPin, User, Phone, Mail, MessageSquare,
  Star, TrendingUp, AlertTriangle, CheckCircle, Sparkles,
  Clock, Edit2, Send, PhoneCall, Search, ChevronRight,
} from "lucide-react";

const STATUS_CFG: Record<OscarLead["status"], { color: string; bg: string; border: string }> = {
  "Reunião Marcada": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "Proposta Enviada": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "Em contato":      { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Agente Ativo":    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Não contatado":   { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

const OSCAR_TEMPLATES = [
  {
    id: "primeiro",
    label: "Primeiro Contacto",
    tag: "Introdução",
    text: (name: string, company: string) =>
      `Olá, ${name}! Sou Oscar Lima, da Ótima Energia.\n\nEstou em contacto com profissionais como você — à frente de negócios com carteira de clientes PJ — sobre uma oportunidade de gerar receita recorrente através do programa Ótima Agente.\n\nEm resumo: você indica clientes da sua carteira que paguem mais de R$5.000/mês em energia elétrica, e nós cuidamos de toda a migração para o mercado livre. Você recebe comissão recorrente por cada contrato firmado.\n\nFaria sentido para a ${company}? Posso te contar mais em 15 minutos.`,
  },
  {
    id: "followup",
    label: "Follow-up",
    tag: "Reforço",
    text: (name: string, company: string) =>
      `Olá, ${name}! Voltando rapidamente sobre o programa Ótima Agente.\n\nUm dos nossos agentes — também consultor empresarial — gerou R$4.200 em comissões nos primeiros 90 dias sem alterar nada no próprio negócio. Apenas introduzindo clientes que já tinham interesse em reduzir custos.\n\nAcredito que a ${company} tem um perfil muito parecido. Consigo te mandar um exemplo real de proposta?`,
  },
  {
    id: "proposta",
    label: "Proposta",
    tag: "Convite",
    text: (name: string, _company: string) =>
      `${name}, gostaria de te convidar para uma conversa formal sobre o modelo Ótima Agente.\n\nPosso apresentar:\n• Estrutura de comissões detalhada\n• Casos reais de agentes com perfil similar\n• Processo de indicação (leva menos de 10 min por cliente)\n• Suporte comercial que fazemos por você\n\nSeria possível uma videoconferência de 30 minutos esta semana?`,
  },
  {
    id: "pattern",
    label: "Pattern Interrupt",
    tag: "Reengajamento",
    text: (name: string, _company: string) =>
      `${name}, vou ser direto:\n\nTenho 1 empresa no Ceará que começou com 3 indicações há 60 dias e já recebe R$1.800/mês em comissões.\n\nSe não fizer sentido para você, tudo bem — mas se quiser saber como funciona, responde aqui com "sim" e eu te mando o exemplo completo.`,
  },
];

const DM_STATES = {
  A: {
    title: "Sem rota direta identificada",
    desc: "Ainda não encontramos o contacto direto do decisor. Clique para iniciar o processo de busca.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    actionLabel: "Iniciar Busca de Contacto",
  },
  B: {
    title: "Contacto encontrado",
    desc: "Contacto direto localizado com alta confiança.",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    actionLabel: "Ver Detalhes",
  },
  C: {
    title: "Contacto não encontrado",
    desc: "Buscas exauridas. Use as rotas alternativas abaixo.",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    actionLabel: "Ver Alternativas",
  },
};

type Tab = "intel" | "dm" | "mensagens" | "historico";

function IntelTab({ lead }: { lead: OscarLead }) {
  return (
    <div className="space-y-4">
      {/* Business summary */}
      <div className="rounded-xl p-4" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={14} style={{ color: "#9e3ffd" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>O que este negócio faz</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{lead.businessSummary}</p>
      </div>

      {/* Why Otima Agent */}
      <div className="rounded-xl p-4" style={{ background: "rgba(158,63,253,0.04)", border: "1px solid rgba(158,63,253,0.15)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: "#9e3ffd" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e3ffd" }}>Por que faria sentido como Agente Ótima</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{lead.whyOtima}</p>
      </div>

      {/* Buying signals */}
      <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} style={{ color: "#16a34a" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Sinais de interesse</span>
        </div>
        <div className="space-y-2">
          {lead.buyingSignals.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
              <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio & score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
          <div className="text-lg font-bold mb-0.5" style={{ color: "#9e3ffd" }}>{lead.score}</div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>Score de potencial /100</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
          <div className="text-sm font-bold mb-0.5" style={{ color: "#16163f" }}>{lead.estimatedPortfolio}</div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>Portfólio estimado</div>
        </div>
      </div>
    </div>
  );
}

function DMTab({ lead }: { lead: OscarLead }) {
  const cfg = DM_STATES[lead.dmState];
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cfg.color}20` }}>
            {lead.dmState === "B" ? <CheckCircle size={15} style={{ color: cfg.color }} /> : <Search size={15} style={{ color: cfg.color }} />}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1" style={{ color: cfg.color }}>{cfg.title}</div>
            <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{cfg.desc}</p>
          </div>
        </div>
        {lead.dmState === "B" && lead.dmName && (
          <div className="mt-4 rounded-lg p-3" style={{ background: "#FFFFFF", border: `1px solid ${cfg.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm" style={{ color: "#16163f" }}>{lead.dmName}</div>
                <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{lead.ownerRole}</div>
                {lead.dmPhone && <div className="text-xs mt-1 font-medium" style={{ color: "#374151" }}>{lead.dmPhone}</div>}
              </div>
              <div>
                <div className="text-xs px-2 py-1 rounded-full font-bold"
                  style={{ background: "#dcfce7", color: "#16a34a" }}>
                  {lead.dmConfidence !== undefined ? `${Math.round(lead.dmConfidence * 100)}% confiança` : "Verificado"}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#9e3ffd", color: "#fff" }}>
                <PhoneCall size={11} /> Ligar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                <MessageSquare size={11} /> WA
              </button>
            </div>
          </div>
        )}
        {lead.dmState === "A" && (
          <button className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "#9e3ffd", color: "#fff" }}>
            {cfg.actionLabel}
          </button>
        )}
        {lead.dmState === "C" && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>Rotas alternativas</div>
            {["LinkedIn — busca por nome + empresa", "Site institucional — página de equipe", "CNPJ — sócios no Receita Federal"].map((route, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}>
                <span className="text-xs" style={{ color: "#374151" }}>{route}</span>
                <ChevronRight size={12} style={{ color: "#9CA3AF" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MensagensTab({ lead }: { lead: OscarLead }) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function selectTemplate(tpl: typeof OSCAR_TEMPLATES[0]) {
    setMessage(tpl.text(lead.ownerName.split(" ")[0], lead.company));
    setActiveTemplate(tpl.id);
  }

  return (
    <div className="space-y-4">
      {/* Template grid */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
          Templates de prospecção de agente
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OSCAR_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl)}
              className="text-left p-3 rounded-xl transition-all"
              style={{
                background: activeTemplate === tpl.id ? "rgba(158,63,253,0.08)" : "#F8F9FC",
                border: `1px solid ${activeTemplate === tpl.id ? "rgba(158,63,253,0.3)" : "#E8EAED"}`,
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: activeTemplate === tpl.id ? "#9e3ffd" : "#9CA3AF" }}>
                {tpl.tag}
              </div>
              <div className="text-xs font-medium" style={{ color: "#16163f" }}>{tpl.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Selecione um template ou escreva sua mensagem..."
          rows={7}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151", lineHeight: 1.6 }}
        />
        <div className="flex gap-2 mt-2">
          <button
            disabled={!message.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-all"
            style={{
              background: message.trim() ? "#25D366" : "#F3F4F6",
              color: message.trim() ? "#fff" : "#9CA3AF",
            }}
          >
            <MessageSquare size={13} /> Enviar WA
          </button>
          <button
            disabled={!message.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-all"
            style={{
              background: message.trim() ? "rgba(158,63,253,0.08)" : "#F3F4F6",
              color: message.trim() ? "#9e3ffd" : "#9CA3AF",
              border: message.trim() ? "1px solid rgba(158,63,253,0.2)" : "1px solid #E8EAED",
            }}
          >
            <Send size={13} /> Enviar Email
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoricoTab({ lead }: { lead: OscarLead }) {
  return (
    <div className="space-y-1">
      {lead.history.length === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: "#9CA3AF" }}>
          Nenhuma interação registada.
        </div>
      )}
      {lead.messages.map((msg, i) => (
        <div key={`msg-${i}`} className="flex gap-3 px-1 py-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: msg.direction === "in" ? "#f0fdf4" : "rgba(158,63,253,0.1)" }}>
            {msg.channel === "WA" ? (
              <MessageSquare size={11} style={{ color: msg.direction === "in" ? "#16a34a" : "#9e3ffd" }} />
            ) : msg.channel === "Email" ? (
              <Mail size={11} style={{ color: msg.direction === "in" ? "#16a34a" : "#9e3ffd" }} />
            ) : (
              <PhoneCall size={11} style={{ color: msg.direction === "in" ? "#16a34a" : "#9e3ffd" }} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: msg.direction === "in" ? "#16a34a" : "#9e3ffd" }}>
                {msg.direction === "in" ? lead.ownerName.split(" ")[0] : "Oscar"} · {msg.channel}
              </span>
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{msg.date}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{msg.snippet}</p>
          </div>
        </div>
      ))}
      {lead.history.map((h, i) => (
        <div key={`hist-${i}`} className="flex gap-3 px-1 py-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
            <Clock size={11} style={{ color: "#9CA3AF" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                {h.type} · {h.date}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{h.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "intel",     label: "Inteligência do Negócio" },
  { key: "dm",        label: "Enriquecimento DM" },
  { key: "mensagens", label: "Mensagens" },
  { key: "historico", label: "Histórico" },
];

export default function OscarLeadCard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("intel");
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const lead = mockOscarLeads.find(l => l.id === id);
  if (!lead) {
    return (
      <SalesOSLayout>
        <div className="flex items-center justify-center h-full">
          <p style={{ color: "#9CA3AF" }}>Alvo não encontrado.</p>
        </div>
      </SalesOSLayout>
    );
  }

  const cfg = STATUS_CFG[lead.status];
  if (!notes && lead.notes) setNotes(lead.notes);

  return (
    <SalesOSLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0"
          style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <button
            onClick={() => navigate("/sales-os/oscar/targets")}
            className="flex items-center gap-1.5 text-sm transition-all"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#9e3ffd")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <div className="h-4 w-px" style={{ background: "#E8EAED" }} />
          <span className="font-semibold text-sm" style={{ color: "#16163f" }}>{lead.company}</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {lead.status}
          </span>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: "rgba(158,63,253,0.07)", color: "#9e3ffd" }}>
            Score {lead.score}/100
          </span>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — company details */}
          <div className="overflow-y-auto p-5 space-y-4 shrink-0"
            style={{ width: "38%", borderRight: "1px solid #E8EAED", background: "#FFFFFF" }}>

            {/* Company header */}
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "rgba(158,63,253,0.1)", border: "1px solid rgba(158,63,253,0.2)" }}>
                <Building2 size={22} style={{ color: "#9e3ffd" }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: "#16163f" }}>{lead.company}</h2>
              <div className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{lead.businessType}</div>
              <div className="text-xs flex items-center gap-1 mt-1" style={{ color: "#9CA3AF" }}>
                <MapPin size={11} /> {lead.city}, {lead.state}
              </div>
            </div>

            <div className="h-px" style={{ background: "#E8EAED" }} />

            {/* Fields */}
            {[
              { label: "CNPJ", value: lead.cnpj },
              { label: "Responsável", value: `${lead.ownerName} · ${lead.ownerRole}` },
              { label: "Telefone", value: lead.phone + (lead.whatsapp ? " (WA)" : "") },
              { label: "Email", value: lead.email },
              { label: "Portfólio estimado", value: lead.estimatedPortfolio },
              { label: "Último contacto", value: lead.lastContact ?? "Nunca" },
            ].map(f => (
              <div key={f.label}>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>{f.label}</div>
                <div className="text-sm" style={{ color: "#374151" }}>{f.value}</div>
              </div>
            ))}

            <div className="h-px" style={{ background: "#E8EAED" }} />

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Notas</div>
                <button onClick={() => setEditNotes(e => !e)} className="text-[10px]" style={{ color: "#9e3ffd" }}>
                  <Edit2 size={11} />
                </button>
              </div>
              {editNotes ? (
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-2.5 py-2 rounded-lg text-xs outline-none resize-none"
                  style={{ background: "#F8F9FC", border: "1px solid rgba(158,63,253,0.3)", color: "#374151" }}
                />
              ) : (
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                  {notes || <span style={{ color: "#9CA3AF" }}>Sem notas.</span>}
                </p>
              )}
            </div>

            {/* Score bar */}
            <div className="rounded-xl p-3" style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
                  <Star size={12} style={{ color: "#d97706" }} /> Score de potencial
                </div>
                <span className="text-xs font-bold" style={{ color: "#9e3ffd" }}>{lead.score}/100</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8EAED" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#9e3ffd,#df0af2)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${lead.score}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
            </div>
          </div>

          {/* Right — tabs */}
          <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#F8F9FC" }}>
            {/* Tab bar */}
            <div className="flex border-b shrink-0 px-4" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-3 text-xs font-semibold transition-all border-b-2 -mb-px"
                  style={{
                    color: activeTab === tab.key ? "#9e3ffd" : "#9CA3AF",
                    borderBottomColor: activeTab === tab.key ? "#9e3ffd" : "transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "intel"     && <IntelTab lead={lead} />}
              {activeTab === "dm"        && <DMTab lead={lead} />}
              {activeTab === "mensagens" && <MensagensTab lead={lead} />}
              {activeTab === "historico" && <HistoricoTab lead={lead} />}
            </div>
          </div>
        </div>
      </div>
    </SalesOSLayout>
  );
}
