import { ArrowRight } from "lucide-react";

export function Process() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Statement Section - Like DCVC's "For 13 years..." */}
      <section className="bg-[#F5F5F0] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            Há anos, ajudamos empresas brilhantes a economizar até{" "}
            <span className="text-highlight">35% na conta de luz</span>{" "}
            através do mercado livre de energia.
          </p>
        </div>
      </section>

      {/* Process Steps Section */}
      <section id="process" className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title mb-16">Como Funciona</h2>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-200">01</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Envie sua conta
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Compartilhe sua conta de luz atual. Nossa tecnologia analisa seu perfil de consumo instantaneamente.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-200">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Encontramos o melhor preço
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Varremos todo o mercado livre para encontrar as melhores ofertas de fornecedores certificados.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-200">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Você escolhe e economiza
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Apresentamos as melhores opções. Você escolhe e nós cuidamos de toda a burocracia da migração.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16">
            <button 
              onClick={() => handleScroll("#contact")}
              className="dcvc-arrow-btn group"
              data-testid="process-cta"
            >
              <span className="arrow">
                <ArrowRight className="w-5 h-5" />
              </span>
              <span className="text-gray-900 group-hover:text-[#D53F8C] transition-colors">
                SOLICITAR COTAÇÃO
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
