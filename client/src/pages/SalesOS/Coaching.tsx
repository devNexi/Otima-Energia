import { useState } from "react";
import { SalesOSLayout, useViewAs } from "@/components/sales/SalesOSLayout";
import {
  GraduationCap, Target, Star, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Calendar, TrendingUp, BookOpen, Phone, Clock, Award,
} from "lucide-react";

const BRAND = "#9e3ffd";

const COACHING_DATA: Record<string, {
  rep: string;
  weekFocus: string;
  focusStat: string;
  focusTip: string;
  weekScore: number;
  nextSession: string;
  qa: {
    date: string;
    lead: string;
    duration: string;
    items: { label: string; pass: boolean }[];
    note: string;
  }[];
  history: { week: string; score: number; improvement: string; nextFocus: string }[];
  scripts: { title: string; text: string }[];
}> = {
  Elayne: {
    rep: "Elayne Ferreira",
    weekFocus: "Pedido de conta direto após alcançar o decisor",
    focusStat: "Elayne alcançou 4 decisores esta semana sem pedir a conta em nenhum. Taxa de bill ask: 0% após decisor confirmado.",
    focusTip: "Após o decisor atender, use: \"A forma mais rápida é você me mandar a última conta por WhatsApp — em um minuto vejo se existe algo real para a gente.\"",
    weekScore: 7,
    nextSession: "Quinta-feira, 05 jun — 14h00",
    qa: [
      {
        date: "28/05",
        lead: "Hotel Bela Vista — Carlos Andrade",
        duration: "3:42",
        items: [
          { label: "Script de abertura seguido", pass: true },
          { label: "Decisor confirmado", pass: true },
          { label: "Pedido de conta feito", pass: false },
          { label: "Objeção solar tratada corretamente", pass: true },
          { label: "Tom consultivo mantido", pass: true },
          { label: "Próxima ação combinada", pass: false },
        ],
        note: "Bom progresso no script de abertura — Carlos confirmou ser o decisor logo no início e estava receptivo. A conta não foi pedida após esse momento positivo. A chamada encerrou sem compromisso de próxima ação. Foco: travar o pedido de conta como reflexo automático após rapport.",
      },
      {
        date: "27/05",
        lead: "Indústria Metalúrgica Sorocaba — Rodrigo Melo",
        duration: "2:18",
        items: [
          { label: "Script de abertura seguido", pass: true },
          { label: "Decisor confirmado", pass: false },
          { label: "Pedido de conta feito", pass: false },
          { label: "Objeção solar tratada corretamente", pass: false },
          { label: "Tom consultivo mantido", pass: true },
          { label: "Próxima ação combinada", pass: false },
        ],
        note: "Chamada encerrada antes de confirmar se Rodrigo é o decisor. A objeção de solar surgiu e foi aceita como definitiva sem diagnóstico. Praticar a resposta: \"Entendo — mas o mercado livre é diferente da solar, não tem instalação nem investimento. Me faz sentido explicar a diferença?\"",
      },
      {
        date: "26/05",
        lead: "Rede de Academias Corpore — Paula Dias",
        duration: "4:55",
        items: [
          { label: "Script de abertura seguido", pass: true },
          { label: "Decisor confirmado", pass: true },
          { label: "Pedido de conta feito", pass: true },
          { label: "Objeção solar tratada corretamente", pass: true },
          { label: "Tom consultivo mantido", pass: true },
          { label: "Próxima ação combinada", pass: true },
        ],
        note: "Chamada modelo esta semana. Paula confirmou ser decisora, Elayne pediu a conta com confiança e combinou envio por WhatsApp. Objeção de \"já tenho solar\" tratada corretamente. Use esta gravação como referência.",
      },
    ],
    history: [
      { week: "19–25 mai", score: 7, improvement: "Abertura do script mais fluída, menos hesitação no início", nextFocus: "Pedido de conta direto após decisor confirmar" },
      { week: "12–18 mai", score: 6, improvement: "Tratamento de objeção solar melhorou com o diagnóstico", nextFocus: "Checar se é decisor antes de avançar" },
      { week: "05–11 mai", score: 5, improvement: "Cadência de follow-up ficou mais consistente", nextFocus: "Tratar objeção solar com comparação direta" },
      { week: "28 abr–04 mai", score: 4, improvement: "Script de abertura padronizado pela primeira vez", nextFocus: "Consistência no follow-up" },
    ],
    scripts: [
      {
        title: "Abertura — 15 segundos",
        text: "\"[Nome], boa tarde! Aqui é Elayne da Ótima Energia. A gente ajuda empresas como a [empresa] a reduzir a conta de luz sem obra nem investimento — só com a mudança de fornecedor de energia. Você seria a pessoa que cuida dos custos operacionais lá?\"",
      },
      {
        title: "Pedido de conta após rapport",
        text: "\"A forma mais rápida de ver se existe desconto real para vocês é você me mandar a última conta de luz por WhatsApp — em um minuto eu vejo se faz sentido seguir em frente. Você tem ela aí agora?\"",
      },
      {
        title: "Objeção: já tenho solar",
        text: "\"Faz sentido — solar é uma ótima opção para geração. O mercado livre é diferente: não tem painel, não tem instalação, não tem investimento. A gente negocia o preço da energia que você já usa hoje. Me faz sentido explicar a diferença em 30 segundos?\"",
      },
      {
        title: "Objeção: sem tempo agora",
        text: "\"Sem problema! Posso te mandar por WhatsApp as informações em dois parágrafos — você lê quando der. O que vale mais para você: WhatsApp ou email?\"",
      },
    ],
  },
  Thaina: {
    rep: "Thaina Domet",
    weekFocus: "Identificação do decisor antes de apresentar produto",
    focusStat: "Thaina avançou em 6 leads esta semana sem confirmar se estava falando com o decisor. Taxa de qualificação correta: 33%.",
    focusTip: "Na segunda frase, pergunte: \"Você é quem decide sobre custos operacionais na empresa?\" — não avance sem confirmar. Se não for o decisor, peça transferência direta.",
    weekScore: 8,
    nextSession: "Quarta-feira, 04 jun — 15h30",
    qa: [
      {
        date: "27/05",
        lead: "Indústria Cerâmica Paulista — Marcos Ferreira",
        duration: "3:11",
        items: [
          { label: "Script de abertura seguido", pass: true },
          { label: "Decisor confirmado", pass: false },
          { label: "Pedido de conta feito", pass: true },
          { label: "Objeção solar tratada corretamente", pass: false },
          { label: "Tom consultivo mantido", pass: true },
          { label: "Próxima ação combinada", pass: true },
        ],
        note: "A conta foi pedida, o que é positivo. Mas Marcos não confirmou ser o decisor antes de avançar — pode ser que a conta chegue de um usuário sem poder de decisão. Próxima semana: confirmar decisor nos primeiros 30 segundos antes de qualquer avanço.",
      },
      {
        date: "26/05",
        lead: "Hotel Executivo Paulistano — Ana Lima",
        duration: "1:47",
        items: [
          { label: "Script de abertura seguido", pass: false },
          { label: "Decisor confirmado", pass: false },
          { label: "Pedido de conta feito", pass: false },
          { label: "Objeção solar tratada corretamente", pass: false },
          { label: "Tom consultivo mantido", pass: true },
          { label: "Próxima ação combinada", pass: false },
        ],
        note: "Chamada encerrada em menos de 2 minutos. Ana estava com pressa e Thaina encerrou sem tentar nenhuma técnica de continuidade. Praticar: \"Sem problema — posso te mandar por WhatsApp em dois parágrafos para você ver quando der?\"",
      },
      {
        date: "25/05",
        lead: "Supermercado Pão de Mel — José Santos",
        duration: "5:20",
        items: [
          { label: "Script de abertura seguido", pass: true },
          { label: "Decisor confirmado", pass: true },
          { label: "Pedido de conta feito", pass: true },
          { label: "Objeção solar tratada corretamente", pass: true },
          { label: "Tom consultivo mantido", pass: true },
          { label: "Próxima ação combinada", pass: true },
        ],
        note: "Excelente chamada. José foi qualificado como decisor logo no início, a conta foi pedida com naturalidade e uma próxima ação foi combinada. Referência para as próximas chamadas.",
      },
    ],
    history: [
      { week: "19–25 mai", score: 8, improvement: "Pedido de conta muito mais consistente — 70% das chamadas", nextFocus: "Qualificar decisor antes de avançar no script" },
      { week: "12–18 mai", score: 7, improvement: "Redução no tempo médio de chamada — mais objetiva", nextFocus: "Aumentar taxa de pedido de conta" },
      { week: "05–11 mai", score: 6, improvement: "Script de abertura padronizado", nextFocus: "Tratar objeção solar" },
      { week: "28 abr–04 mai", score: 5, improvement: "Follow-up mais estruturado após primeira tentativa", nextFocus: "Padronizar abertura" },
    ],
    scripts: [
      {
        title: "Abertura — 15 segundos",
        text: "\"[Nome], boa tarde! Aqui é Thaina da Ótima Energia. A gente ajuda empresas como a [empresa] a reduzir a conta de luz sem obra nem investimento — só com a mudança de fornecedor de energia. Você seria a pessoa que cuida dos custos operacionais lá?\"",
      },
      {
        title: "Qualificação de decisor",
        text: "\"Você é quem decide sobre custos operacionais na empresa? [Se não] — faz sentido, quem seria a melhor pessoa para conversar? Você consegue me passar direto pra ela agora?\"",
      },
      {
        title: "Pedido de conta após rapport",
        text: "\"A forma mais rápida de ver se existe desconto real para vocês é você me mandar a última conta de luz por WhatsApp — em um minuto eu vejo se faz sentido seguir em frente. Você tem ela aí agora?\"",
      },
      {
        title: "Saída por pressa / sem tempo",
        text: "\"Sem problema — posso te mandar por WhatsApp em dois parágrafos para você ver quando der. O que é melhor: WhatsApp ou email?\"",
      },
    ],
  },
  Renan: {
    rep: "Renan",
    weekFocus: "Revisão de pipeline e acompanhamento de SDRs",
    focusStat: "Semana de foco em qualidade de conversão. Pipeline médio com 20 leads ativos entre as duas SDRs.",
    focusTip: "Priorizar roleplay semanal com cada SDR — 15 minutos de simulação valem mais do que 1 hora de feedback escrito.",
    weekScore: 9,
    nextSession: "Sexta-feira, 06 jun — 09h00 (revisão semanal)",
    qa: [],
    history: [],
    scripts: [],
  },
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E8EAED" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold shrink-0" style={{ color }}>{score}/{max}</span>
    </div>
  );
}

export default function Coaching() {
  const { viewAs } = useViewAs();
  const [openScript, setOpenScript] = useState<number | null>(null);
  const [openQA, setOpenQA] = useState<number | null>(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const data = COACHING_DATA[viewAs] ?? COACHING_DATA.Elayne;
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const weekLabel = "26 mai – 1 jun";

  return (
    <SalesOSLayout>
      <div className="h-screen overflow-y-auto" style={{ background: "#F8F9FC" }}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b" style={{ background: "#FFFFFF", borderColor: "#E8EAED" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)" }}
              >
                <GraduationCap size={20} style={{ color: "#fff" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#16163f" }}>Coaching</h1>
                <div className="text-xs" style={{ color: "#9CA3AF" }}>{data.rep} · {today}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)", color: BRAND }}
              >
                <Award size={14} />
                Semana {weekLabel}
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}
              >
                <Calendar size={13} style={{ color: "#9CA3AF" }} />
                <span className="text-xs" style={{ color: "#6B7280" }}>Próxima sessão:</span>
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{data.nextSession}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 max-w-4xl">

          {/* ── Score + quick stats ─────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>NOTA DA SEMANA</div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold" style={{ color: data.weekScore >= 8 ? "#16a34a" : data.weekScore >= 6 ? "#d97706" : "#dc2626" }}>
                  {data.weekScore}
                </span>
                <span className="text-lg mb-1" style={{ color: "#9CA3AF" }}>/10</span>
              </div>
              <ScoreBar score={data.weekScore} />
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>QA ESTA SEMANA</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-bold" style={{ color: "#16163f" }}>{data.qa.length}</span>
                <span className="text-sm mb-1" style={{ color: "#9CA3AF" }}>chamadas avaliadas</span>
              </div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>
                {data.qa.filter(q => q.items.filter(i => i.pass).length >= 4).length} com nota ≥ 4/6
              </div>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>TENDÊNCIA</div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={24} style={{ color: data.history.length > 0 && data.weekScore > data.history[0].score ? "#16a34a" : "#d97706" }} />
                <span className="text-sm font-bold" style={{ color: "#374151" }}>
                  {data.history.length > 0
                    ? (data.weekScore > data.history[0].score ? `+${data.weekScore - data.history[0].score} vs semana passada` : data.weekScore === data.history[0].score ? "Estável" : `${data.weekScore - data.history[0].score} vs semana passada`)
                    : "Primeira semana"
                  }
                </span>
              </div>
              {data.history.length > 0 && (
                <div className="flex items-center gap-1">
                  {[...data.history].reverse().map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      title={`${h.week}: ${h.score}/10`}
                      style={{
                        height: `${(h.score / 10) * 28}px`,
                        background: h.score >= 8 ? "#16a34a" : h.score >= 6 ? "#d97706" : "#dc2626",
                        opacity: 0.7,
                        minHeight: 4,
                      }}
                    />
                  ))}
                  <div
                    className="flex-1 rounded-sm"
                    style={{ height: `${(data.weekScore / 10) * 28}px`, background: data.weekScore >= 8 ? "#16a34a" : "#d97706", minHeight: 4 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Meu Foco desta Semana ───────────────────────────────────── */}
          <div
            className="rounded-xl p-5"
            style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%)", border: "1px solid #ddd6fe" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} style={{ color: BRAND }} />
              <span className="text-sm font-bold" style={{ color: "#16163f" }}>Meu Foco desta Semana</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(158,63,253,0.15)", color: BRAND }}
              >
                Definido por Renan
              </span>
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: "#5b21b6" }}>{data.weekFocus}</p>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>{data.focusStat}</p>
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}
            >
              <div className="flex items-start gap-2">
                <Star size={14} style={{ color: BRAND, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: BRAND }}>FRASE EXATA PARA USAR</div>
                  <p className="text-sm italic font-medium" style={{ color: "#4c1d95" }}>{data.focusTip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── QA desta Semana ─────────────────────────────────────────── */}
          {data.qa.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Phone size={15} style={{ color: "#6b7280" }} />
                <h2 className="text-sm font-bold" style={{ color: "#374151" }}>QA desta Semana</h2>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{data.qa.length} chamadas avaliadas</span>
              </div>
              <div className="space-y-3">
                {data.qa.map((call, idx) => {
                  const passed = call.items.filter(i => i.pass).length;
                  const total = call.items.length;
                  const isOpen = openQA === idx;
                  const color = passed >= 5 ? "#16a34a" : passed >= 3 ? "#d97706" : "#dc2626";
                  return (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden"
                      style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <button
                        onClick={() => setOpenQA(isOpen ? null : idx)}
                        className="flex items-center justify-between w-full px-5 py-3.5"
                        style={{ background: isOpen ? "#F8F9FC" : "#FFFFFF" }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                          >
                            {passed}/{total}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-semibold" style={{ color: "#16163f" }}>{call.lead}</div>
                            <div className="text-xs" style={{ color: "#9CA3AF" }}>
                              {call.date} · <Clock size={9} className="inline" /> {call.duration}
                            </div>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {call.items.map(item => (
                              <div key={item.label} className="flex items-center gap-2 py-1">
                                {item.pass
                                  ? <CheckCircle size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                                  : <XCircle size={14} style={{ color: "#dc2626", flexShrink: 0 }} />
                                }
                                <span className="text-xs" style={{ color: item.pass ? "#15803d" : "#b91c1c" }}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                          <div
                            className="rounded-xl p-3.5"
                            style={{ background: "#F8F9FC", border: "1px solid #E8EAED" }}
                          >
                            <div className="text-[10px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                              Nota de Renan
                            </div>
                            <p className="text-sm" style={{ color: "#374151" }}>{call.note}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Biblioteca de Scripts ───────────────────────────────────── */}
          {data.scripts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={15} style={{ color: "#6b7280" }} />
                <h2 className="text-sm font-bold" style={{ color: "#374151" }}>Biblioteca de Scripts</h2>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#F3F4F6", color: "#9CA3AF" }}
                >
                  leitura apenas
                </span>
              </div>
              <div className="space-y-2">
                {data.scripts.map((script, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "#FFFFFF", border: "1px solid #E8EAED" }}
                  >
                    <button
                      onClick={() => setOpenScript(openScript === idx ? null : idx)}
                      className="flex items-center justify-between w-full px-4 py-3"
                    >
                      <span className="text-sm font-semibold" style={{ color: "#374151" }}>{script.title}</span>
                      {openScript === idx
                        ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} />
                        : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />
                      }
                    </button>
                    {openScript === idx && (
                      <div className="px-4 pb-4">
                        <p
                          className="text-sm italic p-3 rounded-lg"
                          style={{ background: "rgba(158,63,253,0.05)", border: "1px solid rgba(158,63,253,0.12)", color: "#4c1d95" }}
                        >
                          {script.text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Histórico de Coaching ───────────────────────────────────── */}
          {data.history.length > 0 && (
            <div>
              <button
                onClick={() => setHistoryOpen(o => !o)}
                className="flex items-center gap-2 w-full mb-3"
              >
                <TrendingUp size={15} style={{ color: "#6b7280" }} />
                <h2 className="text-sm font-bold" style={{ color: "#374151" }}>Histórico de Coaching</h2>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{data.history.length} semanas</span>
                <div className="ml-auto">
                  {historyOpen
                    ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} />
                    : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />
                  }
                </div>
              </button>
              {historyOpen && (
                <div className="space-y-3">
                  {data.history.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4"
                      style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold" style={{ color: "#374151" }}>{h.week}</span>
                        <div className="flex items-center gap-2">
                          <ScoreBar score={h.score} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>MELHORIA PRINCIPAL</div>
                          <div style={{ color: "#374151" }}>{h.improvement}</div>
                        </div>
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>FOCO SEGUINTE</div>
                          <div style={{ color: "#374151" }}>{h.nextFocus}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </SalesOSLayout>
  );
}
