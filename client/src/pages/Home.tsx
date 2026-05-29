import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Business } from "@/components/sections/Business";
import { Contact } from "@/components/sections/Contact";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

function DifferentiationSection() {
  const points = [
    {
      title: "Trabalhamos com os principais players nacionais",
      desc: "Só colocamos na mesa comercializadoras e geradores com capacidade financeira sólida, histórico comprovado e contratos transparentes. Nenhum player duvidoso, nenhuma oferta sem sustentação.",
    },
    {
      title: "Mostramos o quadro completo — não uma solução empurrada",
      desc: "Analisamos GD, ACL, Gestão de Energia e otimização no local. Você vê todas as opções viáveis e escolhe com clareza. Nunca com pressão.",
    },
    {
      title: "Para sua empresa, o serviço é gratuito",
      desc: "O diagnóstico não tem custo. Somos remunerados pelos fornecedores quando nossa recomendação gera valor real — e você sempre sabe exatamente como e por quem somos pagos.",
    },
    {
      title: "Você decide com informação, não com urgência",
      desc: "Nossa metodologia é construída para eliminar a assimetria de informação que o mercado de energia usa contra você. Decisão boa é decisão com dados.",
    },
  ];

  return (
    <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-6">
              O que torna a Ótima diferente
            </h2>
            <p className="text-lg text-[#736d77] leading-relaxed">
              O mercado de energia é opaco por design. Fornecedores, distribuidoras e comercializadoras operam com informações assimétricas. A maioria das empresas não tem acesso à comparação, aos dados e à visibilidade que a Ótima tem.
            </p>
            <p className="text-lg text-[#736d77] leading-relaxed mt-4">
              Nós existimos para nivelar esse campo.
            </p>
          </div>
          <div className="space-y-6">
            {points.map((p, i) => (
              <div key={i} className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-[#16163f] mb-1">{p.title}</h3>
                  <p className="text-[#736d77] text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyOtimaSection() {
  const cards = [
    {
      num: "01",
      label: "Independência",
      title: "Independência real",
      desc: "Não temos vínculo com nenhuma comercializadora, geradora ou usina. Somos remunerados apenas quando nossa recomendação gera valor real para o cliente.",
    },
    {
      num: "02",
      label: "Transparência",
      title: "Transparência radical",
      desc: "Você sabe exatamente como ganhamos, quando ganhamos e por que recomendamos cada solução. Nada fica escondido.",
    },
    {
      num: "03",
      label: "Tecnologia",
      title: "ECOS™ como inteligência",
      desc: "Nosso sistema proprietário analisa consumo, compara ofertas e monitora oportunidades de mercado com IA e automação — sem viés, sem conflito.",
    },
    {
      num: "04",
      label: "Execução",
      title: "Do diagnóstico à implementação",
      desc: "Não entregamos só um relatório. Cuidamos de toda a execução — migração, contratos, créditos, renovação — em qualquer frente.",
    },
  ];

  return (
    <section
      style={{ background: "#0d0c24" }}
      className="py-20 lg:py-28 border-t border-[rgba(158,63,253,0.15)]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-14 text-center">
          <div
            className="inline-block mb-4"
            style={{
              background: "rgba(158,63,253,0.12)",
              border: "1px solid rgba(158,63,253,0.3)",
              color: "#c88ff5",
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: "99px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Por que a Ótima Energia
          </div>
          <h2
            className="text-white"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Construída para ser diferente
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => (
            <div
              key={i}
              className="relative p-7 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(158,63,253,0.18)",
              }}
            >
              <span
                className="absolute top-2 right-4 select-none pointer-events-none font-black"
                style={{
                  color: "rgba(158,63,253,0.08)",
                  fontSize: "5.5rem",
                  lineHeight: 1,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {card.num}
              </span>
              <p
                className="text-xs tracking-widest uppercase mb-3 font-semibold relative z-10"
                style={{ color: "#df0af2" }}
              >
                {card.label}
              </p>
              <h3
                className="font-bold mb-3 relative z-10"
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "1.05rem",
                  lineHeight: 1.3,
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm leading-relaxed relative z-10"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SegmentsSection() {
  const segments = [
    { name: "Condomínios", detail: "Iluminação, elevadores, bombas e portões" },
    { name: "Gestoras de Condomínio", detail: "Visão consolidada de múltiplos ativos" },
    { name: "Escolas e Universidades", detail: "Alto consumo com sazonalidade previsível" },
    { name: "Clínicas e Hospitais", detail: "Operação contínua, alta criticidade" },
    { name: "Hotéis e Pousadas", detail: "Climatização e iluminação 24h" },
    { name: "Supermercados", detail: "Refrigeração e carga constante" },
    { name: "Empresas com múltiplas unidades", detail: "Visão e estratégia consolidada" },
    { name: "Indústrias e galpões", detail: "Alta demanda, máximo potencial de economia" },
  ];

  return (
    <section
      style={{ background: "#09081e" }}
      className="py-20 lg:py-28 border-t border-[rgba(158,63,253,0.15)]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-14 text-center">
          <div
            className="inline-block mb-4"
            style={{
              background: "rgba(158,63,253,0.12)",
              border: "1px solid rgba(158,63,253,0.3)",
              color: "#c88ff5",
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: "99px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Quem Atendemos
          </div>
          <h2
            className="text-white"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Qualquer empresa com energia relevante
          </h2>
          <p
            className="mt-3 text-base max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Qualquer empresa com uma conta de energia relevante pode se beneficiar do nosso diagnóstico.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {segments.map((s, i) => (
            <div
              key={i}
              className="p-5 rounded-xl transition-all duration-200 hover:border-[rgba(158,63,253,0.4)]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(158,63,253,0.18)",
              }}
              data-testid={`segment-${i}`}
            >
              <p
                className="font-semibold text-sm mb-1"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                {s.name}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.42)" }}
              >
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EcosSection() {
  const [tab, setTab] = useState<'gd' | 'acl'>('gd');

  const gdStats = [
    { label: "CONTA ATUAL ESTIMADA", val: "R$ 18.500/mês", green: false },
    { label: "DESCONTO GD APLICADO", val: "35%", green: false },
    { label: "NOVA CONTA ESTIMADA", val: "R$ 12.025/mês", green: false },
    { label: "ECONOMIA POTENCIAL EST.", val: "R$ 6.475/mês", green: true },
  ];
  const aclStats = [
    { label: "CUSTO MÉDIO DE ENERGIA (R$/MWh)", val: "R$ 847/MWh", green: false },
    { label: "MELHOR PREÇO ACL PROJETADO", val: "R$ 678/MWh", green: false },
    { label: "CONSUMO MÉDIO", val: "42,8 MWh/mês", green: false },
    { label: "ECONOMIA POTENCIAL EST.", val: "R$ 7.234/mês", green: true },
  ];
  const gdOffers = [
    { name: "Gerador Solar — Região Sudeste", badge: "Melhor desconto", val: "35% desc.", hi: true },
    { name: "Gerador Solar — Interior SP", badge: null, val: "28% desc.", hi: false },
    { name: "Gerador Eólico — Região Nordeste", badge: null, val: "22% desc.", hi: false },
  ];
  const aclOffers = [
    { name: "Comercializadora A", badge: "Melhor preço", val: "R$ 678/MWh", hi: true },
    { name: "Comercializadora B", badge: null, val: "R$ 712/MWh", hi: false },
    { name: "Comercializadora C", badge: null, val: "R$ 741/MWh", hi: false },
  ];

  const stats = tab === 'gd' ? gdStats : aclStats;
  const offers = tab === 'gd' ? gdOffers : aclOffers;
  const offersLabel = tab === 'gd' ? "GERADORES DISPONÍVEIS NA REGIÃO" : "COMPARAÇÃO DE OFERTAS ACL";
  const offersNote = tab === 'gd'
    ? "* Nomes dos geradores são ilustrativos. Os parceiros reais são apresentados após o diagnóstico, preservando a confidencialidade comercial."
    : "* Nomes das comercializadoras são ilustrativos. As ofertas reais são apresentadas após o diagnóstico, preservando a confidencialidade comercial.";
  const verdict = tab === 'gd'
    ? "Desconto disponível — oportunidade identificada"
    : "Abaixo da média — oportunidade identificada";

  return (
    <section className="relative overflow-hidden py-16 lg:py-24" style={{ background: "linear-gradient(135deg, #0a0920 0%, #16163f 60%, #1a0835 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/texture-electric.png')", backgroundSize: "600px", backgroundRepeat: "repeat", opacity: 0.04 }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(158,63,253,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.5 }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — text block */}
          <div>
            <div className="inline-block mb-5" style={{ background: "rgba(158,63,253,0.15)", border: "1px solid rgba(158,63,253,0.3)", color: "#c88ff5", fontSize: "0.72rem", fontWeight: 700, padding: "5px 13px", borderRadius: "99px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Sistema Proprietário
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "clamp(3.5rem, 7vw, 5.5rem)", color: "#fff", letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: "8px" }}>
              ECOS<sup style={{ fontSize: "0.38em", verticalAlign: "super", fontWeight: 800 }}>™</sup>
            </h2>
            <p style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "1.1rem", marginBottom: "20px" }}>
              Inteligência que orienta cada decisão
            </p>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)", maxWidth: "480px" }}>
              O sistema proprietário da Ótima Energia que combina IA, automação e dados de mercado para garantir que cada decisão seja tomada no momento certo, com as informações certas — sem conflito, sem viés.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "Analisa consumo e perfil energético",
                "Compara ofertas reais de todas as comercializadoras",
                "Monitora janelas de renovação e oportunidades de mercado",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3" style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#9e3ffd" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/ecos"
              className="inline-flex items-center gap-2 text-white font-medium transition-all hover:opacity-90"
              style={{ background: "#9e3ffd", borderRadius: "8px", padding: "12px 24px", fontSize: "0.95rem", fontFamily: "'Sora', sans-serif", boxShadow: "0 4px 20px rgba(158,63,253,0.35)" }}
            >
              Conhecer o ECOS™ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — ECOS™ interactive mockup card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "20px" }}>

            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ color: "#c88ff5", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif" }}>ECOS™ · ANÁLISE DE MERCADO</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", marginTop: "2px" }}>Exemplo ilustrativo · Dados simulados</p>
              </div>
              <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "6px", padding: "3px 9px", fontSize: "0.6rem", fontWeight: 700, color: "#22c55e", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Ativo
              </div>
            </div>

            {/* GD / ACL toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "3px", gap: "3px", marginBottom: "14px" }}>
              {([
                { key: 'gd', label: '⚡ Energia por Assinatura (GD)' },
                { key: 'acl', label: '📈 Mercado Livre (ACL)' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    flex: 1,
                    padding: "7px 4px",
                    borderRadius: "6px",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    background: tab === key ? "#9e3ffd" : "transparent",
                    color: tab === key ? "#fff" : "rgba(255,255,255,0.4)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "'Sora', sans-serif",
                  }}
                  data-testid={`ecos-tab-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Position bar */}
            <div style={{ marginBottom: "14px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>POSIÇÃO NO MERCADO</p>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "7px", marginBottom: "5px", overflow: "hidden" }}>
                <div style={{ width: "28%", height: "100%", borderRadius: "4px", background: "#9e3ffd" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.56rem", color: "rgba(255,255,255,0.28)", marginBottom: "6px" }}>
                <span>Muito abaixo</span><span>Muito acima</span>
              </div>
              <p style={{ color: "#c88ff5", fontSize: "0.78rem", fontWeight: 600 }}>{verdict}</p>
            </div>

            {/* 4-metric grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
              {stats.map((stat, i) => (
                <div key={`${tab}-${i}`} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.54rem", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3 }}>{stat.label}</p>
                  <p style={{ color: stat.green ? "#22c55e" : "#fff", fontSize: "0.8rem", fontWeight: 700, marginTop: "3px" }}>{stat.val}</p>
                </div>
              ))}
            </div>

            {/* Offers list */}
            <div style={{ marginBottom: "14px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{offersLabel}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {offers.map((s, i) => (
                  <div key={`${tab}-offer-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: s.hi ? "rgba(158,63,253,0.1)" : "rgba(255,255,255,0.03)", border: s.hi ? "1px solid rgba(158,63,253,0.25)" : "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "7px 10px" }}>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.7rem", flex: 1, paddingRight: "8px" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {s.badge && <span style={{ background: "rgba(158,63,253,0.2)", color: "#c88ff5", fontSize: "0.56rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>{s.badge}</span>}
                      <span style={{ color: s.hi ? "#c88ff5" : "#fff", fontSize: "0.78rem", fontWeight: 700 }}>{s.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "0.56rem", marginTop: "8px", lineHeight: 1.4 }}>{offersNote}</p>
            </div>

            {/* Legal disclaimer */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.58rem", lineHeight: 1.5, textAlign: "center" }}>
                Simulação ilustrativa baseada no componente energia. A economia real depende do perfil de consumo, distribuidora, modalidade tarifária, encargos de rede, tributos e condições contratuais finais. Análise completa fornecida após diagnóstico.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
        <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
          Descubra qual é o melhor caminho para reduzir a conta de energia da sua empresa.
        </h2>
        <p className="text-xl text-[#736d77] mb-4 max-w-2xl mx-auto">
          Diagnóstico gratuito. Sem compromisso. Em até 5 dias úteis você recebe uma análise completa.
        </p>
        <p className="text-base text-[#736d77] mb-12 max-w-xl mx-auto">
          Sem pressão, sem conflito de interesse. Você decide com informação.
        </p>
        <Link
          href="/seja-cliente"
          className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
          data-testid="home-final-cta"
        >
          Solicitar Diagnóstico Gratuito
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}

// ─── Google Reviews via Elfsight ──────────────────────────────────────────────
// 1. Go to https://elfsight.com/google-reviews-widget/
// 2. Create a free widget connected to your Google Business page
// 3. Copy the app ID from the embed code (looks like: elfsight-app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
// 4. Replace ELFSIGHT_APP_ID below with your real ID
const ELFSIGHT_APP_ID = "elfsight-app-621cc45b-3c8c-4f91-9a14-009acabd13bf";

function GoogleReviews() {
  return (
    <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-8">
          <p className="text-sm tracking-widest text-[#9e3ffd] uppercase font-semibold mb-2">Avaliações</p>
          <h2 className="text-2xl lg:text-3xl font-semibold text-[#16163f]">O que nossos clientes dizem</h2>
        </div>
        <div className={ELFSIGHT_APP_ID} data-elfsight-app-lazy="true"></div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Process />
        <DifferentiationSection />
        <Business />
        <WhyOtimaSection />
        <SegmentsSection />
        <EcosSection />
        <GoogleReviews />
        <FinalCta />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
