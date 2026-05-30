import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Business } from "@/components/sections/Business";
import { CheckCircle, ArrowRight, Building2, GraduationCap, HeartPulse, Hotel, ShoppingCart, Layers, Factory, Building } from "lucide-react";
import { Link } from "wouter";

function DifferentiationSection() {
  const points = [
    {
      title: "Trabalhamos com os principais players nacionais",
      desc: "Só colocamos na mesa comercializadoras e geradores com capacidade financeira sólida, histórico comprovado e contratos transparentes. Nenhum player duvidoso, nenhuma oferta sem sustentação.",
    },
    {
      title: "Mostramos o quadro completo, não uma solução empurrada",
      desc: "Analisamos GD, ACL, Gestão de Energia e otimização no local. Você vê todas as opções viáveis e escolhe com clareza. Nunca com pressão.",
    },
    {
      title: "Para sua empresa, o serviço é gratuito",
      desc: "O diagnóstico não tem custo. Somos remunerados pelos fornecedores quando nossa recomendação gera valor real, e você sempre sabe exatamente como e por quem somos pagos.",
    },
    {
      title: "Você decide com informação, não com urgência",
      desc: "Nossa metodologia é construída para eliminar a assimetria de informação que o mercado de energia usa contra você. Decisão boa é decisão com dados.",
    },
  ];

  return (
    <section
      style={{ background: "#09081e" }}
      className="py-16 lg:py-20 border-t border-[rgba(255,255,255,0.05)]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <h2
              className="mb-6"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              O que torna a Ótima diferente
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", lineHeight: "1.75" }}>
              O mercado de energia é opaco por design. Fornecedores, distribuidoras e comercializadoras operam com informações assimétricas. A maioria das empresas não tem acesso à comparação, aos dados e à visibilidade que a Ótima tem.
            </p>
            <p
              className="mt-4"
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.05rem",
                fontStyle: "italic",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 600,
                borderLeft: "2px solid #9e3ffd",
                paddingLeft: "16px",
                marginTop: "20px",
              }}
            >
              Nós existimos para nivelar esse campo.
            </p>
          </div>

          <div className="space-y-3">
            {points.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(158,63,253,0.3)",
                  }}
                >
                  <CheckCircle className="w-3 h-3" style={{ color: "#9e3ffd" }} />
                </div>
                <div>
                  <h3
                    className="mb-1"
                    style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}
                  >
                    {p.title}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.825rem", lineHeight: "1.65" }}>
                    {p.desc}
                  </p>
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
      desc: "Nosso sistema proprietário analisa consumo, compara ofertas e monitora oportunidades de mercado com IA e automação, sem viés, sem conflito.",
    },
    {
      num: "04",
      label: "Execução",
      title: "Do diagnóstico à implementação",
      desc: "Não entregamos só um relatório. Cuidamos de toda a execução: migração, contratos, créditos, renovação, em qualquer frente.",
    },
  ];

  return (
    <section
      style={{ background: "#13112a" }}
      className="py-20 lg:py-28 border-t border-[rgba(255,255,255,0.05)]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-14 text-center">
          <div
            className="inline-block mb-4"
            style={{
              background: "rgba(255,255,255,0.08)",
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
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="absolute top-8 right-4 select-none pointer-events-none font-black"
                style={{
                  color: "rgba(255,255,255,0.05)",
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
                  color: "#ffffff",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "1.05rem",
                  lineHeight: 1.3,
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm leading-relaxed relative z-10"
                style={{ color: "rgba(255,255,255,0.72)" }}
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
    { Icon: Building2,        name: "Condomínios",                   detail: "Iluminação, elevadores, bombas e portões" },
    { Icon: Building,         name: "Gestoras de Condomínio",        detail: "Visão consolidada de múltiplos ativos" },
    { Icon: GraduationCap,    name: "Escolas e Universidades",       detail: "Alto consumo com sazonalidade previsível" },
    { Icon: HeartPulse,       name: "Clínicas e Hospitais",          detail: "Operação contínua, alta criticidade" },
    { Icon: Hotel,            name: "Hotéis e Pousadas",             detail: "Climatização e iluminação 24h" },
    { Icon: ShoppingCart,     name: "Supermercados",                 detail: "Refrigeração e carga constante" },
    { Icon: Layers,           name: "Múltiplas Unidades",            detail: "Visão e estratégia consolidada" },
    { Icon: Factory,          name: "Indústrias e galpões",          detail: "Alta demanda, máximo potencial de economia" },
  ];

  return (
    <section
      className="relative overflow-hidden py-20 lg:py-28 border-t border-[rgba(255,255,255,0.04)]"
      style={{ background: "#09081e" }}
    >
      {/* Deep purple radial spotlight from bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 90% 55% at 50% 105%, rgba(74,29,150,0.55) 0%, rgba(94,39,210,0.18) 40%, transparent 70%)",
        }}
      />
      {/* Top purple gradient hairline */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(158,63,253,0.7) 50%, transparent 100%)" }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="mb-14 text-center">
          <div
            className="inline-block mb-5"
            style={{
              background: "rgba(158,63,253,0.18)",
              border: "1px solid rgba(158,63,253,0.45)",
              color: "#c88ff5",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "5px 16px",
              borderRadius: "99px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Quem Atendemos
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.03em",
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            Qualquer empresa com{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #bf7fff 0%, #9e3ffd 45%, #df0af2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              energia relevante
            </span>
          </h2>
          <p
            className="mt-4 text-base max-w-lg mx-auto"
            style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}
          >
            Uma conta relevante é o único requisito. O diagnóstico é gratuito, sem compromisso.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
          {segments.map(({ Icon, name, detail }, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-default"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(94,39,210,0.18)";
                el.style.borderColor = "rgba(158,63,253,0.55)";
                el.style.boxShadow = "0 0 0 1px rgba(158,63,253,0.2), 0 12px 40px rgba(74,29,150,0.35)";
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.05)";
                el.style.borderColor = "rgba(255,255,255,0.1)";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
              }}
              data-testid={`segment-${i}`}
            >
              {/* Purple top accent bar */}
              <div
                style={{
                  height: "3px",
                  background: "linear-gradient(90deg, #9e3ffd, #df0af2)",
                  opacity: 0.7,
                }}
              />

              <div className="p-5 lg:p-6">
                {/* Icon + faded number row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "rgba(158,63,253,0.15)",
                      border: "1px solid rgba(158,63,253,0.25)",
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#bf7fff" }} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: "2rem",
                      lineHeight: 1,
                      color: "rgba(158,63,253,0.2)",
                      userSelect: "none",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <p
                  className="font-semibold mb-1.5"
                  style={{ color: "#ffffff", fontSize: "0.9rem", lineHeight: 1.3 }}
                >
                  {name}
                </p>
                <p
                  style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", lineHeight: 1.6 }}
                >
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: "16px" }}>
            Não encontrou o seu segmento? Qualquer empresa com conta relevante pode solicitar o diagnóstico.
          </p>
          <Link
            href="/seja-cliente"
            className="inline-flex items-center gap-2 font-semibold transition-all duration-200 hover:gap-3"
            style={{ color: "#9e3ffd", fontFamily: "'Sora', sans-serif", fontSize: "0.9rem" }}
            data-testid="segments-cta"
          >
            Solicitar Diagnóstico Gratuito
            <ArrowRight className="w-4 h-4" />
          </Link>
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
    { name: "Gerador Solar, Região Sudeste", badge: "Melhor desconto", val: "35% desc.", hi: true },
    { name: "Gerador Solar, Interior SP", badge: null, val: "28% desc.", hi: false },
    { name: "Gerador Eólico, Região Nordeste", badge: null, val: "22% desc.", hi: false },
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
    ? "Desconto disponível. Oportunidade identificada"
    : "Abaixo da média. Oportunidade identificada";

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
              O sistema proprietário da Ótima Energia que combina IA, automação e dados de mercado para garantir que cada decisão seja tomada no momento certo, com as informações certas. Sem conflito, sem viés.
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
  const [hovered, setHovered] = useState(false);
  return (
    <section
      className="border-t border-[rgba(255,255,255,0.04)]"
      style={{ background: "#2d0f52", position: "relative", overflow: "hidden", minHeight: "380px" }}
    >
      {/* Glow orb 1 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(158,63,253,0.4) 0%, transparent 65%)",
          top: -120, left: -80,
        }}
      />
      {/* Glow orb 2 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,143,245,0.25) 0%, transparent 65%)",
          bottom: -80, right: -40,
        }}
      />

      {/* Two-column layout */}
      <div
        className="relative z-10 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2"
        style={{ minHeight: 380 }}
      >
        {/* LEFT COLUMN */}
        <div
          className="flex flex-col justify-center"
          style={{
            padding: "56px 48px 56px 52px",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c88ff5", marginBottom: 16, fontFamily: "'Sora', sans-serif" }}>
            Análise 100% neutra
          </p>
          <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
            Pare de pagar mais do que deveria. Descubra isso agora,{" "}
            <span style={{ color: "#c88ff5" }}>de graça.</span>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
            Trabalhamos com todas as principais comercializadoras e geradores do país. Não temos preferência por nenhuma delas. O que importa é o que é certo para{" "}
            <span style={{ color: "#ffffff", fontWeight: 700 }}>você</span>.
          </p>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col justify-center" style={{ padding: "56px 48px 56px 52px" }}>
          {/* Neutral badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 28, width: "fit-content",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.6)", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500, lineHeight: 1.4 }}>
              Parceiros em todas as frentes: GD, ACL, Gestão e Otimização. Sem vínculo, sem comissão escondida.
            </span>
          </div>

          {/* Proof points */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              "Diagnóstico completo sem custo algum para sua empresa",
              "Você escolhe o fornecedor. Nós só mostramos o quadro completo",
              "Se não houver economia, você saberá disso também. Sem pressão",
              "Resultado em até 5 dias úteis, sem burocracia",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(158,63,253,0.2)", border: "1px solid rgba(158,63,253,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 10, color: "#c88ff5",
                }}>✓</span>
                {item}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href="/seja-cliente"
            data-testid="home-final-cta"
            style={{
              background: hovered ? "#f0e8ff" : "#ffffff",
              color: "#2d0f52",
              fontWeight: 800,
              fontSize: 15,
              padding: "16px 28px",
              borderRadius: 8,
              border: "none",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              display: "block",
              textAlign: "center",
              marginBottom: 12,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Sora', sans-serif",
              transform: hovered ? "translateY(-1px)" : "translateY(0)",
              textDecoration: "none",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            Quero saber se estou pagando certo →
          </Link>

          {/* Reassurance line */}
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.5 }}>
            Gratuito · Sem compromisso ·{" "}
            <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Sem conflito de interesse</span>
          </p>
        </div>
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
    <section
      style={{ background: "#09081e" }}
      className="py-16 lg:py-20 border-t border-[rgba(255,255,255,0.04)]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-10">
          <div
            className="inline-block mb-4"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(158,63,253,0.3)",
              color: "#c88ff5",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "5px 14px",
              borderRadius: "99px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Avaliações
          </div>
          <h2
            className="text-white"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              letterSpacing: "-0.02em",
            }}
          >
            O que nossos clientes dizem
          </h2>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <div className={ELFSIGHT_APP_ID} data-elfsight-app-lazy="true"></div>
        </div>
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
      </main>
      <Footer />
    </div>
  );
}
