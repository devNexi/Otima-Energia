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
          <p className="dcvc-statement text-gray-900 max-w-5xl mb-8">
            Com anos de experiência no setor elétrico, ajudamos empresas a combater a ineficiência do mercado brasileiro atual. Utilizamos{" "}
            <span className="text-highlight">inteligência artificial</span>{" "}
            para comparar o máximo possível do mercado, oferecendo preços transparentes e condições flexíveis para que você economize e reinvista no seu negócio.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-12">
            A Lei nº 15.269/2025 está abrindo o mercado livre de energia para milhões de empresas. Nosso serviço de comparação é gratuito, com auditorias energéticas sem custo e sem qualquer obrigação para o empresário.
          </p>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl">
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">40%</p>
              <p className="text-[#736d77] mt-2">Economia de até</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">R$100B+</p>
              <p className="text-[#736d77] mt-2">Mercado anual</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">80M</p>
              <p className="text-[#736d77] mt-2">Elegíveis até 2028</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">0</p>
              <p className="text-[#736d77] mt-2">Custo para você</p>
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
                Envie sua conta de luz e Unidade Consumidora para uma análise gratuita impulsionada por IA, eliminando a falta de visibilidade do mercado.
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
                Nossa tecnologia compara ofertas de diferentes fornecedores, quebrando plataformas isoladas e promovendo competição real para encontrar as melhores condições.
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
                Você escolhe a proposta mais transparente e flexível e começa a economizar. Nosso serviço de comparação é gratuito e nossa remuneração vem diretamente dos fornecedores.
              </p>
            </div>
          </div>

          {/* Eligibility Note */}
          <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg max-w-2xl">
            <p className="text-[#736d77]">
              <strong className="text-[#16163f]">Elegibilidade:</strong> Atendemos empresas com contas acima de R$8.000/mês e demanda a partir de aproximadamente 500 kW (limite em redução com a nova lei).{" "}
              <a href="/lei-mercado-livre" className="text-[#9e3ffd] hover:underline">Saiba mais sobre a Lei</a>
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
