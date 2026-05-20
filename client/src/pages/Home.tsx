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
    <section className="bg-[#16163f] py-16 lg:py-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
              Inteligência que orienta cada decisão
            </p>
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
              ECOS™
            </h2>
            <div className="space-y-4 text-lg text-gray-300 leading-relaxed">
              <p>
                O <strong className="text-[#9e3ffd]">ECOS™</strong> é o sistema proprietário da Ótima Energia que combina IA, automação e dados de mercado para garantir que cada decisão seja tomada no momento certo, com as informações certas.
              </p>
              <p>
                Ele não vende produto. Ele analisa dados: ofertas reais de comercializadoras, desempenho de geradores de GD, bandas de preço histórico, perfis de risco e janelas contratuais.
              </p>
              <p className="font-medium text-white">
                O ECOS™ só recomenda uma mudança quando há ganho real projetado. Sem conflito. Sem viés. Sem promessas vazias.
              </p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 lg:p-10">
            <ul className="space-y-4 text-gray-300">
              {[
                "Análise automática de contas e perfil de consumo",
                "Comparação de ofertas reais de comercializadoras",
                "Monitoramento de geradores de GD na sua região",
                "Alertas em janelas críticas de renovação",
                "Recomendações documentadas e rastreáveis",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
