import { useState } from "react";
import type { Lead, BuyingSignal } from "@/data/mockLeads";
import {
  ChevronDown, ChevronUp, Newspaper, Building2, UserPlus,
  TrendingDown, MessageSquare, Wrench, Copy, Check,
} from "lucide-react";

interface LeadIntel {
  about: string;
  why_now: string;
  gd: { status: "eligible" | "check" | "not_eligible"; reason: string };
  acl: { status: "potential" | "below"; reason: string };
  solar: { installed: boolean; note: string };
}

const SIGNAL_ICONS: Record<BuyingSignal["type"], React.FC<{ size: number; style?: React.CSSProperties }>> = {
  press: Newspaper,
  expansion: Building2,
  hiring: UserPlus,
  sector_pressure: TrendingDown,
  supplier_complaint: MessageSquare,
  renovation: Wrench,
};

const SIGNAL_EMOJI: Record<BuyingSignal["type"], string> = {
  press: "📰",
  expansion: "🏢",
  hiring: "👤",
  sector_pressure: "📉",
  supplier_complaint: "💬",
  renovation: "🔧",
};

const URGENCY: Record<BuyingSignal["urgency"], { border: string; bg: string; color: string }> = {
  red:   { border: "#dc2626", bg: "#fef2f2", color: "#dc2626" },
  amber: { border: "#d97706", bg: "#fffbeb", color: "#d97706" },
  green: { border: "#16a34a", bg: "#f0fdf4", color: "#16a34a" },
};

const LEAD_INTEL: Record<string, LeadIntel> = {
  "lead-001": {
    about: "Hotel de médio porte em São Paulo com operação 24h. HVAC, lavanderia e áreas comuns criam carga de consumo constante. Decisões de custo passam pelo Gerente Geral ou Diretor Financeiro — Carlos Andrade é o perfil certo.",
    why_now: "Para operações hoteleiras, energia tende a ficar como custo tolerado até que pressão de margem force revisão. Consumo 24h com gestão dividida cria a inércia que uma análise rápida de GD pode desfazer.",
    gd:  { status: "eligible", reason: "Consumo estimado 85.000 kWh/mês — elegível GD" },
    acl: { status: "below",    reason: "Abaixo do limiar ACL — GD é o produto ideal" },
    solar: { installed: false, note: "Sem solar detectado — GD disponível" },
  },
  "lead-003": {
    about: "Condomínio residencial de grande porte em Belo Horizonte com áreas comuns significativas. Bombas, elevadores e iluminação geram consumo constante. A síndica é a decisora-chave e recentemente assumiu o cargo.",
    why_now: "Condomínios aceitam energia como custo fixo sem questionar. Uma nova síndica é a janela ideal — ela tem incentivo para mostrar economia aos moradores logo no início do mandato.",
    gd:  { status: "eligible", reason: "Consumo de áreas comuns elegível para GD" },
    acl: { status: "below",    reason: "Perfil de consumo adequado para GD, não ACL" },
    solar: { installed: false, note: "Tentativa anterior de solar rejeitada — abordar com GD" },
  },
  "lead-004": {
    about: "Clínica de diagnóstico por imagem em Curitiba com TC, Ressonância, Raio-X e Mamografia. Operação diária com picos de demanda intensos. Dr. Figueiredo acumula funções de Diretor Médico e sócio financeiro.",
    why_now: "Clínicas com equipamentos de diagnóstico têm picos de demanda que tornam a tarifa convencional cara. GD pode reduzir o custo da demanda contratada sem mudar a operação.",
    gd:  { status: "eligible", reason: "Consumo estimado 35.000 kWh/mês — elegível GD" },
    acl: { status: "below",    reason: "Abaixo do limiar mínimo de ACL" },
    solar: { installed: false, note: "Sem solar detectado — GD disponível" },
  },
  "lead-006": {
    about: "Lavanderia industrial no Rio de Janeiro com operação 24h. Máquinas de alta potência criam consumo noturno intenso que solar não consegue cobrir. Paulo Mendes é o dono-gestor.",
    why_now: "Lavanderias industriais têm consumo noturno que torna solar insuficiente. GD não compete com solar — complementa. A segunda unidade dobra o potencial de economia consolidado.",
    gd:  { status: "eligible", reason: "Operação 24h com alta demanda noturna — perfil ideal para GD" },
    acl: { status: "below",    reason: "Abaixo do limiar mínimo para ACL" },
    solar: { installed: false, note: "Solar em avaliação — GD noturno é complementar" },
  },
  "lead-007": {
    about: "Supermercado independente em Santo André com câmaras frias e operação estendida. Equipamentos de refrigeração criam carga base constante. DM ainda não identificado.",
    why_now: "Supermercados com câmaras frias têm carga base que nunca zera — perfil ideal para GD. Primeiro contato é estratégico para ganhar a conversa antes do concorrente.",
    gd:  { status: "eligible", reason: "Câmaras frias detectadas — consumo 24/7 ideal para GD" },
    acl: { status: "below",    reason: "Porte de conta adequado para GD, não ACL" },
    solar: { installed: false, note: "Sem solar detectado — GD livre" },
  },
  "lead-009": {
    about: "Frigorífico de grande porte em Campinas com operação 24h. Câmaras de resfriamento e processamento criam uma das maiores cargas de consumo constante de qualquer segmento. José Antônio é o proprietário.",
    why_now: "Frigoríficos são onde GD tem maior ROI por causa do consumo 24/7. Com 21 tentativas, a barreira é de acesso — não de interesse. José já demonstrou receptividade. Mudança de abordagem pode destravar.",
    gd:  { status: "eligible", reason: "Consumo 24/7 e conta R$38k/mês — perfil premium para GD" },
    acl: { status: "potential", reason: "Potencial ACL Varejista — verificar consumo anual exato" },
    solar: { installed: false, note: "Sem solar — mercado livre disponível" },
  },
  "lead-011": {
    about: "Hotel de pequeno porte em Florianópolis com localização privilegiada. Sazonalidade turística cria picos de consumo no verão. Beatriz Carvalho é a gerente-proprietária que decide sobre custos.",
    why_now: "Hotéis menores não têm gestor de custos dedicado — a conta de energia chega e é paga sem análise. Reforma em andamento é o momento perfeito para revisar contratos antes de inaugurar a nova capacidade.",
    gd:  { status: "eligible", reason: "Consumo estimado elegível para GD" },
    acl: { status: "below",    reason: "Porte insuficiente para ACL" },
    solar: { installed: false, note: "Sem solar detectado — GD disponível" },
  },
  "lead-016": {
    about: "Câmara fria industrial em São Paulo com operação 24h e segunda unidade em Guarulhos. Refrigeração industrial é um dos maiores consumidores de energia por m². Rodrigo Teixeira é o sócio-diretor.",
    why_now: "Com proposta em mãos e prazo de 3 dias, Rodrigo está no momento de decisão. Consumo 24/7 das duas unidades torna esta a maior economia potencial da carteira. Cada dia de atraso é custo real.",
    gd:  { status: "check",    reason: "Verificar se ACL ou GD é mais vantajoso neste porte" },
    acl: { status: "potential", reason: "Consumo R$45k/mês — elegível ACL Direto" },
    solar: { installed: false, note: "Operação noturna dominante — GD complementa melhor" },
  },
};

function getDefaultIntel(lead: Lead): LeadIntel {
  const large = lead.bill_band === "L" || lead.bill_band === "XL";
  return {
    about: `${lead.industry_segment} com conta de ${lead.bill_size}. ${lead.why_this_account_may_be_worth_reviewing_now}`,
    why_now: lead.why_this_account_may_be_worth_reviewing_now,
    gd:  { status: "eligible", reason: "Perfil de consumo elegível para GD" },
    acl: { status: large ? "potential" : "below", reason: large ? "Verificar consumo anual para ACL" : "Abaixo do limiar mínimo para ACL" },
    solar: { installed: false, note: "Sem solar detectado" },
  };
}

export function LeadIntelligenceCard({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const signals = lead.buying_signals ?? [];
  const intel = LEAD_INTEL[lead.id] ?? getDefaultIntel(lead);

  const barrier = lead.likely_trust_barrier;
  const barrierColor = barrier.level === "alta" ? "#dc2626" : barrier.level === "média" ? "#d97706" : "#16a34a";
  const barrierBg    = barrier.level === "alta" ? "#fef2f2" : barrier.level === "média" ? "#fffbeb" : "#f0fdf4";
  const barrierLabel = barrier.level === "alta" ? "Barreira Alta" : barrier.level === "média" ? "Barreira Média" : "Barreira Baixa";

  const firstSignal = signals[0];

  const hasSolar = lead.activity_timeline?.some(e => e.note?.toLowerCase().includes("solar")) ?? false;

  const gdStyle = intel.gd.status === "eligible"
    ? { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Elegível" }
    : intel.gd.status === "check"
    ? { bg: "#F8F9FC", color: "#6B7280", border: "#E8EAED", label: "Verificar" }
    : { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Não elegível" };

  const aclStyle = intel.acl.status === "potential"
    ? { bg: "rgba(158,63,253,0.06)", color: "#7c3aed", border: "rgba(158,63,253,0.2)", label: "Potencial" }
    : { bg: "#F8F9FC", color: "#9CA3AF", border: "#E8EAED", label: "Abaixo do threshold" };

  const solarStyle = hasSolar
    ? { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Solar detectado — rodar diagnóstico" }
    : { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Sem solar — GD livre" };

  function copyScript(signal: BuyingSignal) {
    navigator.clipboard.writeText(signal.script_copy).catch(() => {});
    setCopiedId(signal.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E8EAED" }}>
      {/* ── Collapsed bar — always visible ───────────────────────────── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 text-left transition-colors"
        style={{ minHeight: 48, background: expanded ? "#F8F9FC" : "#FFFFFF" }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#9CA3AF" }}>
          Inteligência do Lead
        </span>

        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8EAED" }}
          >
            {lead.industry_segment}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ background: barrierBg, color: barrierColor, border: `1px solid ${barrierColor}25` }}
          >
            {barrierLabel}
          </span>
          {firstSignal ? (
            <span className="text-[11px] truncate" style={{ color: "#6B7280" }}>
              {SIGNAL_EMOJI[firstSignal.type]} {firstSignal.title}
            </span>
          ) : (
            <span className="text-[10px] truncate" style={{ color: "#9CA3AF" }}>
              Nenhum sinal ativo · usar ângulo do segmento
            </span>
          )}
        </div>

        <span className="shrink-0" style={{ color: "#9CA3AF" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* ── Expanded content ─────────────────────────────────────────── */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-4">

          {/* Section 1 — Sobre Este Negócio */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>
              Sobre Este Negócio
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{intel.about}</p>
          </div>

          {/* Section 2 — Sinais de Compra */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
              Sinais de Compra
            </div>
            {signals.length === 0 ? (
              <div
                className="px-3 py-2.5 rounded-lg text-xs"
                style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#9CA3AF" }}
              >
                Nenhum sinal recente. Usar ângulo padrão do segmento.
              </div>
            ) : (
              <div className="space-y-2">
                {signals.map(signal => {
                  const u = URGENCY[signal.urgency];
                  const SigIcon = SIGNAL_ICONS[signal.type];
                  const copied = copiedId === signal.id;
                  return (
                    <div
                      key={signal.id}
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        background: u.bg,
                        border: `1px solid ${u.border}30`,
                        borderLeft: `3px solid ${u.border}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <SigIcon size={13} style={{ color: u.color, marginTop: 2, flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold mb-0.5" style={{ color: u.color }}>{signal.title}</div>
                          <div className="text-xs mb-1 leading-snug" style={{ color: "#374151" }}>{signal.description}</div>
                          <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{signal.source} · {signal.date}</div>
                        </div>
                        <button
                          onClick={() => copyScript(signal)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition-all"
                          style={{
                            background: copied ? "#dcfce7" : "rgba(158,63,253,0.08)",
                            color: copied ? "#16a34a" : "#9e3ffd",
                            border: `1px solid ${copied ? "#bbf7d0" : "rgba(158,63,253,0.2)"}`,
                          }}
                        >
                          {copied ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copied ? "Copiado!" : "Usar no script"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3 — Por Que Agora */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>
              Por Que Agora
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{intel.why_now}</p>
          </div>

          {/* Section 4 — Elegibilidade de Produto */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
              Elegibilidade de Produto
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-2.5" style={{ background: gdStyle.bg, border: `1px solid ${gdStyle.border}` }}>
                <div className="text-[9px] font-bold mb-1 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>GD</div>
                <div className="text-xs font-bold mb-1" style={{ color: gdStyle.color }}>{gdStyle.label}</div>
                <div className="text-[10px] leading-snug" style={{ color: "#6B7280" }}>{intel.gd.reason}</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: aclStyle.bg, border: `1px solid ${aclStyle.border}` }}>
                <div className="text-[9px] font-bold mb-1 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>ACL</div>
                <div className="text-xs font-bold mb-1" style={{ color: aclStyle.color }}>{aclStyle.label}</div>
                <div className="text-[10px] leading-snug" style={{ color: "#6B7280" }}>{intel.acl.reason}</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: solarStyle.bg, border: `1px solid ${solarStyle.border}` }}>
                <div className="text-[9px] font-bold mb-1 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Solar</div>
                <div className="text-xs font-bold mb-1" style={{ color: solarStyle.color }}>
                  {hasSolar ? "Instalado" : "Sem solar"}
                </div>
                <div className="text-[10px] leading-snug" style={{ color: "#6B7280" }}>{intel.solar.note}</div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
