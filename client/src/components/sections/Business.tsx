import { ArrowRight } from "lucide-react";
import migracaoImage from "@/assets/homepage/migracao.png";
import estrategiasImage from "@/assets/homepage/estrategias.png";

export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Statement Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            Ajudamos empresas de todos os portes a{" "}
            <span className="text-highlight-pink">economizar até 40%</span>{" "}
            na conta de luz com total transparência.
          </p>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="business" className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title mb-16">Soluções</h2>

          {/* Solutions Grid - Like DCVC Spotlight cards */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* SME Solution */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="opacity-75 hover:opacity-100 transition-opacity">
                <img 
                  src={migracaoImage} 
                  alt="Migração Simplificada" 
                  className="w-full h-56 object-cover"
                />
              </div>
              <div className="p-8 lg:p-10">
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-4">
                  Empresas e PMEs
                </p>
                <h3 className="text-2xl font-medium text-gray-900 mb-4">
                  Migração Simplificada
                </h3>
                <p className="text-[#736d77] leading-relaxed mb-8">
                  Para PMEs, simplificamos toda a migração para o Mercado Livre de Energia, eliminando burocracia, riscos e falta de transparência. Nossa comparação é gratuita, sem obrigação, e focada em gerar economia de até 40% para reinvestir no crescimento do seu negócio.
                </p>
                <button 
                  onClick={() => handleScroll("#contact")}
                  className="dcvc-arrow-btn group"
                >
                  <span className="arrow">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                    SAIBA MAIS
                  </span>
                </button>
              </div>
            </div>

            {/* Industrial Solution */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="opacity-75 hover:opacity-100 transition-opacity">
                <img 
                  src={estrategiasImage} 
                  alt="Estratégias Personalizadas" 
                  className="w-full h-56 object-cover"
                />
              </div>
              <div className="p-8 lg:p-10">
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-4">
                  Empresas de Maior Porte
                </p>
                <h3 className="text-2xl font-medium text-gray-900 mb-4">
                  Estratégias Personalizadas
                </h3>
                <p className="text-[#736d77] leading-relaxed mb-8">
                  Para empresas de maior porte, estruturamos estratégias personalizadas de contratação, com foco em previsibilidade, flexibilidade contratual e redução consistente de custos. Atuamos desde a análise inicial até a gestão contínua do contrato, sempre buscando as melhores condições do mercado.
                </p>
                <button 
                  onClick={() => handleScroll("#contact")}
                  className="dcvc-arrow-btn group"
                >
                  <span className="arrow">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                    SAIBA MAIS
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
