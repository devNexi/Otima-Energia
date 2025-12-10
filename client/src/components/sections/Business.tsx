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
            Ajudamos empresas a{" "}
            <span className="text-highlight-pink">liberar economia</span>{" "}
            em todos os níveis de consumo de energia.
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
                Pequenas e Médias Empresas
              </p>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Modelo Varejo
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-8">
                Economia garantida sem investimento inicial. Processo de migração simplificado com fatura unificada e proteção contra flutuações de tarifa.
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
                Grandes Indústrias
              </p>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Acesso Atacado
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-8">
                Acesso direto ao mercado atacadista com estratégias personalizadas de compra, relatórios de inteligência de mercado e gestão de conformidade regulatória.
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
