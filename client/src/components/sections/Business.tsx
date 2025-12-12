import { ArrowRight } from "lucide-react";

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
          <div className="grid md:grid-cols-2 gap-px bg-gray-200">
            {/* SME Solution */}
            <div className="bg-white p-8 lg:p-12">
              <p className="text-sm tracking-wide text-gray-500 uppercase mb-4">
                Empresas e PMEs
              </p>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Migração Simplificada
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-8">
                Migração simplificada para o mercado livre, faturamento organizado e economia de até 40%, com auditoria gratuita e sem obrigação.
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

            {/* Industrial Solution */}
            <div className="bg-white p-8 lg:p-12">
              <p className="text-sm tracking-wide text-gray-500 uppercase mb-4">
                Empresas de Maior Porte
              </p>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Estratégias Personalizadas
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-8">
                Estratégias personalizadas de contratação, comparação ampla do mercado e negociação eficiente para maximizar economia e previsibilidade.
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
      </section>
    </>
  );
}
