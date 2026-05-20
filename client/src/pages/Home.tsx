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
      label: "Independência",
      title: "Independência real",
      desc: "Não temos vínculo com nenhuma comercializadora, geradora ou usina. Somos remunerados apenas quando nossa recomendação gera valor real para o cliente.",
    },
    {
      label: "Transparência",
      title: "Transparência radical",
      desc: "Você sabe exatamente como ganhamos, quando ganhamos e por que recomendamos cada solução. Nada fica escondido.",
    },
    {
      label: "Tecnologia",
      title: "ECOS™ como inteligência",
      desc: "Nosso sistema proprietário analisa consumo, compara ofertas e monitora oportunidades de mercado com IA e automação — sem viés, sem conflito.",
    },
    {
      label: "Execução",
      title: "Do diagnóstico à implementação",
      desc: "Não entregamos só um relatório. Cuidamos de toda a execução — migração, contratos, créditos, renovação — em qualquer frente.",
    },
  ];

  return (
    <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <h2 className="dcvc-section-title mb-16 text-center">Por que a Ótima Energia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-xl">
              <p className="text-xs tracking-wide text-[#df0af2] uppercase mb-3 font-semibold">{card.label}</p>
              <h3 className="text-lg font-semibold text-[#16163f] mb-3">{card.title}</h3>
              <p className="text-[#736d77] text-sm leading-relaxed">{card.desc}</p>
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
    <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-4 text-center">
          Quem atendemos
        </h2>
        <p className="text-center text-[#736d77] text-lg mb-12 max-w-xl mx-auto">
          Qualquer empresa com uma conta de energia relevante pode se beneficiar do nosso diagnóstico.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {segments.map((s, i) => (
            <div key={i} className="bg-[#eee7f1] rounded-xl p-5" data-testid={`segment-${i}`}>
              <p className="font-semibold text-[#16163f] text-sm mb-1">{s.name}</p>
              <p className="text-[#736d77] text-xs leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EcosSection() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24" style={{ background: "linear-gradient(135deg, #0a0920 0%, #16163f 60%, #1a0835 100%)" }}>
      {/* Texture overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/texture-electric.png')", backgroundSize: "600px", backgroundRepeat: "repeat", opacity: 0.04 }} />
      {/* Dot grid */}
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

          {/* Right — ECOS™ UI mockup */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "24px" }}>
            {/* Mockup header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ color: "#c88ff5", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif" }}>ECOS™ · Análise de Mercado</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", marginTop: "2px" }}>Gerado em tempo real · Confidencial</p>
              </div>
              <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.62rem", fontWeight: 700, color: "#22c55e", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Ativo
              </div>
            </div>

            {/* 5-band market position */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Posição no Mercado</p>
              <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: "8px", borderRadius: "4px", background: i === 1 ? "#9e3ffd" : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.58rem", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
                <span>Muito abaixo</span><span>Muito acima</span>
              </div>
              <p style={{ color: "#c88ff5", fontSize: "0.82rem", fontWeight: 600 }}>Abaixo da média — oportunidade identificada</p>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {[
                { label: "Consumo médio", val: "42,8 MWh/mês", green: false },
                { label: "Tarifa atual", val: "R$ 847/MWh", green: false },
                { label: "Melhor oferta", val: "R$ 678/MWh", green: false },
                { label: "Economia proj.", val: "R$ 7.234/mês", green: true },
              ].map((stat, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
                  <p style={{ color: stat.green ? "#22c55e" : "#fff", fontSize: "0.82rem", fontWeight: 700, marginTop: "3px" }}>{stat.val}</p>
                </div>
              ))}
            </div>

            {/* Supplier comparison */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Comparação de Ofertas</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { name: "Comercializadora A", price: "R$ 678/MWh", badge: "Melhor oferta", hi: true },
                  { name: "Comercializadora B", price: "R$ 712/MWh", badge: null, hi: false },
                  { name: "Comercializadora C", price: "R$ 741/MWh", badge: null, hi: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: s.hi ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", border: s.hi ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px" }}>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {s.badge && <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: "4px" }}>{s.badge}</span>}
                      <span style={{ color: s.hi ? "#22c55e" : "#fff", fontSize: "0.8rem", fontWeight: 700 }}>{s.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.58rem", marginTop: "10px", textAlign: "center" }}>
                * Dados simulados — análise real gerada com os dados da sua empresa
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
        <FinalCta />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
