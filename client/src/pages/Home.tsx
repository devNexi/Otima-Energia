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
    <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
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
                Por isso, a Ótima Energia opera com o <strong className="text-[#9e3ffd]">ECOS™</strong> — nosso sistema proprietário de inteligência e otimização de contratos de energia, desenvolvido com IA, automação e dados de mercado.
              </p>
              <p>
                O ECOS acompanha continuamente o desempenho do seu contrato, compara sua posição com referências de mercado e indica ações apenas quando fazem sentido financeiro.
              </p>
              <p>
                Em muitos casos, a melhor decisão é não mudar — e o ECOS deixa isso claro.
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

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Process />
        <EcosSection />
        <Business />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
