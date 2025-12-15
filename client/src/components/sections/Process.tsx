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
            A maioria das empresas brasileiras paga mais do que deveria pela energia elétrica — não porque os preços são altos, mas porque o mercado é{" "}
            <span className="text-highlight">opaco, fragmentado e difícil de comparar</span>.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-12">
            Nosso serviço de comparação é gratuito. Analisamos sua conta, comparamos o máximo possível do mercado e apresentamos opções claras e flexíveis. Nossa remuneração vem exclusivamente dos fornecedores — nunca do empresário.
          </p>
          <div className="flex gap-16 max-w-4xl">
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">40%</p>
              <p className="text-[#736d77] mt-2">Economia de até</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">80%+</p>
              <p className="text-[#736d77] mt-2">Das empresas não estão no Mercado Livre hoje</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">80M</p>
              <p className="text-[#736d77] mt-2">Elegíveis até 2028</p>
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
                Envie sua conta de luz para um diagnóstico gratuito
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Envie sua conta de luz para um diagnóstico gratuito. Nossa tecnologia analisa seu perfil e verifica se sua empresa já pode migrar — ou quando poderá. Mesmo que ainda não esteja apta, você já pode iniciar o planejamento.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-[#c88ff5]">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Comparamos o mercado e negociamos as melhores condições
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Tornamos visível um mercado que normalmente é fechado e fragmentado, comparando ofertas e negociando contratos estruturados para gerar economia real — sem viés e sem custo para você.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-[#c88ff5]">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Migramos, contratamos e acompanhamos
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Você começa a economizar, enquanto cuidamos de toda a migração e seguimos otimizando seu contrato ao longo do tempo.
              </p>
            </div>
          </div>

          {/* Eligibility Note */}
          <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg max-w-2xl">
            <p className="text-[#736d77]">
              <strong className="text-[#16163f]">Elegibilidade:</strong> Atendemos empresas com contas acima de R$8.000/mês e demanda próxima de 500 kW (limite em redução). Se sua empresa ainda não for elegível, você já pode enviar seus dados para iniciar o diagnóstico.{" "}
              <a href="/lei-mercado-livre" className="text-[#9e3ffd] hover:underline">Saiba mais sobre o Mercado Livre</a>
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
