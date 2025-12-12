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
      <section className="bg-[#eee7f1] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl mb-12">
            Há anos, ajudamos empresas brilhantes a economizar até{" "}
            <span className="text-highlight">35% na conta de luz</span>{" "}
            através do mercado livre de energia.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl">
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">R$100B+</p>
              <p className="text-[#736d77] mt-2">Mercado anual</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">80M</p>
              <p className="text-[#736d77] mt-2">Consumidores elegíveis até 2028</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">35%</p>
              <p className="text-[#736d77] mt-2">Economia média</p>
            </div>
          </div>
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
                <span className="text-6xl font-light text-[#c88ff5]">01</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Envie sua conta
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Compartilhe o código UC e suas contas de luz recentes. Nossa tecnologia analisa seu perfil de consumo e verifica elegibilidade.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-[#c88ff5]">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Comparamos o mercado
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Cotamos ofertas de múltiplos comercializadores certificados. Você recebe um relatório comparativo em até 48 horas.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-[#c88ff5]">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Você escolhe e economiza
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Apresentamos as melhores opções. Você decide e nós cuidamos de toda a documentação e migração para o mercado livre.
              </p>
            </div>
          </div>

          {/* Eligibility Note */}
          <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg max-w-2xl">
            <p className="text-[#736d77]">
              <strong className="text-[#16163f]">Elegibilidade:</strong> Para empresas com conta de luz acima de R$8.000/mês ou demanda contratada de 500kW+.{" "}
              <a href="/faq" className="text-[#9e3ffd] hover:underline">Saiba mais</a>
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <a 
              href="/seja-cliente"
              className="dcvc-arrow-btn group inline-flex"
              data-testid="process-cta"
            >
              <span className="arrow">
                <ArrowRight className="w-5 h-5" />
              </span>
              <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                FAZER DIAGNÓSTICO GRATUITO
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
