import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Business } from "@/components/sections/Business";
import { Contact } from "@/components/sections/Contact";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { CheckCircle } from "lucide-react";

function EcosSection() {
  return (
    <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
              Como garantimos economia contínua — não apenas no primeiro contrato
            </h2>
            <div className="space-y-4 text-lg text-[#736d77] leading-relaxed">
              <p>
                A economia no Mercado Livre não termina na assinatura do contrato.
                Preços mudam. Perfis de consumo variam. O mercado oscila.
              </p>
              <p>
                O <strong className="text-[#9e3ffd]">ECOS™</strong> é o sistema de inteligência da Ótima Energia. Ele organiza dados, automatiza análises e cria um histórico auditável de decisões — reduzindo ruído, riscos e decisões mal informadas.
              </p>
              <p>
                O ECOS acompanha continuamente o desempenho do seu contrato, compara sua posição com referências de mercado e indica ações apenas quando fazem sentido financeiro.
              </p>
              <p className="font-medium text-[#16163f]">
                ECOS™ não empurra mudanças. Ele mostra quando agir — e quando não agir.
              </p>
            </div>
          </div>
          <div className="bg-[#eee7f1] rounded-lg p-8 lg:p-10">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Monitoramento contínuo de contratos</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Relatórios periódicos de posicionamento</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Proteção contra decisões precipitadas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span className="text-lg text-[#16163f]">Economia sustentável no longo prazo</span>
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
      title: "Metodologia Estruturada",
      description: "Comparação ampla de ofertas, com critérios claros e documentados.",
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
          Por que confiar no processo da Ótima Energia?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustCards.map((card, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl"
            >
              <div className="w-10 h-10 bg-[#9e3ffd]/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5 text-[#9e3ffd]" />
              </div>
              <h3 className="text-lg font-semibold text-[#16163f] mb-2">
                {card.title}
              </h3>
              <p className="text-[#736d77] text-sm leading-relaxed">
                {card.description}
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
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
