import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Business } from "@/components/sections/Business";
import { Contact } from "@/components/sections/Contact";
import { CheckCircle } from "lucide-react";

function EcosSection() {
  return (
    <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
              Como garantimos economia contínua
            </h2>
            <div className="space-y-4 text-lg text-[#736d77] leading-relaxed">
              <p>
                A verdadeira economia não está só na escolha do mercado certo, está na revisão contínua, na hora certa.
              </p>
              <p>
                É aí que entra o <strong className="text-[#9e3ffd]">ECOS™</strong>, nosso sistema interno de inteligência de mercado.
                Usamos o ECOS™ em dois momentos chave:
              </p>
              <ul className="space-y-3 ml-1">
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <span><strong className="text-[#16163f]">No diagnóstico:</strong> para cruzar seu perfil com os três mercados (ACR, ACL, GDL) e identificar onde sua empresa economiza mais</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <span><strong className="text-[#16163f]">Na renovação:</strong> para comparar seu contrato atual com o cenário de mercado e decidir, com dados, se vale a pena renegociar, trocar ou manter</span>
                </li>
              </ul>
              <p>
                O ECOS™ é uma ferramenta só nossa, usada para te entregar análises mais justas, no momento certo, sem pressa e sem ruído.
              </p>
              <p className="font-medium text-[#16163f]">
                Porque economia de verdade é clareza nos momentos que importam, não interferência no meio do caminho.
              </p>
            </div>
          </div>
          <div className="bg-[#eee7f1] rounded-lg p-8 lg:p-10">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Diagnóstico dos 3 mercados com dados reais</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Revisão focada na janela de renovação</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Decisões baseadas em ganho, não em pressa</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Economia sustentável, sem monitoramento invasivo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const trustCards = [
    {
      title: "Metodologia Baseada em Escolha",
      description: "Análise estruturada que compara os três mercados (ACR, ACL, GDL) com critérios claros, priorizando seu resultado financeiro.",
    },
    {
      title: "Análise por IA",
      description: "Automação aplicada à leitura de faturas, cenários e riscos.",
    },
    {
      title: "Sem Conflito de Interesse",
      description: "O diagnóstico é gratuito. Você decide se quer avançar.",
    },
    {
      title: "Rastreabilidade Total",
      description: "Cada decisão tem justificativa, histórico e registro.",
    },
  ];

  return (
    <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <h2 className="dcvc-section-title mb-16 text-center">
          Por que somos consultores, não vendedores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustCards.map((card, index) => {
            return (
              <div 
                key={index}
                className="bg-white p-6 rounded-xl"
              >
                <div className="w-10 h-10 bg-[#9e3ffd]/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#16163f] mb-2">
                  {card.title}
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MarketsGlossary() {
  const markets = [
    {
      title: "O que é ACR (Mercado Cativo)?",
      description: "O mercado tradicional, com concessionária regional fixa. Atuamos na otimização da conta, revisão de tarifas e gestão de créditos de GDL.",
    },
    {
      title: "O que é ACL (Mercado Livre de Energia)?",
      description: "Ambiente onde você pode escolher seu fornecedor e negociar contratos personalizados. Guiamos sua migração e estratégia de compra.",
    },
    {
      title: "O que é GDL (Geração Distribuída Compartilhada)?",
      description: 'Modelo de "energia por assinatura" de usinas renováveis. Analisamos a viabilidade e gerenciamos sua participação para gerar descontos na conta de luz.',
    },
  ];

  return (
    <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <h2 className="dcvc-section-title mb-16 text-center">Entenda os Mercados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {markets.map((market, index) => (
            <div key={index} className="bg-[#eee7f1] p-8 rounded-xl">
              <h4 className="text-lg font-semibold text-[#16163f] mb-4" data-testid={`market-title-${index}`}>
                {market.title}
              </h4>
              <p className="text-[#736d77] leading-relaxed" data-testid={`market-desc-${index}`}>
                {market.description}
              </p>
            </div>
          ))}
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
        <EcosSection />
        <TrustSection />
        <Business />
        <MarketsGlossary />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
