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
      <section className="bg-[#eee7f1] py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl mb-8">
            A maioria das empresas brasileiras paga mais do que deveria pela energia elétrica — não porque os preços são altos, mas porque o mercado é{" "}
            <span className="text-highlight">opaco, fragmentado e difícil de comparar</span>.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-12">
            O problema não é o preço da energia — é a falta de visibilidade. O mercado livre é complexo, fragmentado e difícil de comparar. A Ótima Energia existe para estruturar decisões melhores, com análise técnica, comparação ampla e contratos bem posicionados.
          </p>
          <div className="flex flex-wrap gap-8 lg:gap-16 max-w-4xl">
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
          <p className="text-sm text-[#736d77] mt-8 max-w-2xl">
            *Valores indicam potencial de mercado e economia estimada. Resultados variam conforme perfil, região e prazo.
          </p>
        </div>
      </section>

      {/* Process Steps Section - Timeline Style */}
      <section id="process" className="bg-white py-16 lg:py-24 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title mb-16 text-center">Como Funciona</h2>

          {/* Desktop Timeline */}
          <div className="hidden lg:block">
            {/* Top row - Steps 2 and 4 content */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div></div>
              <div className="text-center px-4">
                <span className="inline-block px-4 py-1 bg-[#9e3ffd] text-white text-sm font-medium rounded-full mb-3">
                  Passo 02
                </span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Buscamos propostas com preços finais
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed">
                  Consultamos comercializadoras parceiras e trazemos ofertas com tudo incluído — sem taxas ocultas.
                </p>
              </div>
              <div></div>
              <div className="text-center px-4">
                <span className="inline-block px-4 py-1 bg-[#df0af2] text-white text-sm font-medium rounded-full mb-3">
                  Passo 04
                </span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Garantimos a execução e protegemos seu contrato
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed">
                  Acompanhamos todo o processo e blindamos seu contrato contra renegociações forçadas.
                </p>
              </div>
            </div>

            {/* Timeline circles and connectors */}
            <div className="relative flex items-center justify-between max-w-4xl mx-auto py-8">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#eee7f1] -translate-y-1/2"></div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3 h-3 bg-[#c88ff5] rounded-full mb-2"></div>
                <div className="w-20 h-20 rounded-full border-[3px] border-dashed border-[#c88ff5] flex items-center justify-center bg-white">
                  <div className="w-16 h-16 rounded-full bg-[#9e3ffd] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">01</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center">
                <svg className="w-4 h-4 text-[#9e3ffd] mb-2 rotate-180" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L8 6h8L12 2z"/>
                </svg>
                <div className="w-20 h-20 rounded-full border-[3px] border-dashed border-[#c88ff5] flex items-center justify-center bg-white">
                  <div className="w-16 h-16 rounded-full bg-[#9e3ffd] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">02</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3 h-3 bg-[#c88ff5] rounded-full mb-2"></div>
                <div className="w-20 h-20 rounded-full border-[3px] border-dashed border-[#c88ff5] flex items-center justify-center bg-white">
                  <div className="w-16 h-16 rounded-full bg-[#c88ff5] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">03</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center">
                <svg className="w-4 h-4 text-[#df0af2] mb-2 rotate-180" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L8 6h8L12 2z"/>
                </svg>
                <div className="w-20 h-20 rounded-full border-[3px] border-dashed border-[#df0af2] flex items-center justify-center bg-white">
                  <div className="w-16 h-16 rounded-full bg-[#df0af2] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">04</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row - Steps 1 and 3 content */}
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="text-center px-4">
                <span className="inline-block px-4 py-1 bg-[#9e3ffd] text-white text-sm font-medium rounded-full mb-3">
                  Passo 01
                </span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Você compartilha seu consumo e perfil de contratação
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed">
                  Envie suas faturas e informações básicas para iniciarmos a análise do seu perfil energético.
                </p>
              </div>
              <div></div>
              <div className="text-center px-4">
                <span className="inline-block px-4 py-1 bg-[#c88ff5] text-white text-sm font-medium rounded-full mb-3">
                  Passo 03
                </span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Você compara e escolhe a melhor opção
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed">
                  Apresentamos as propostas de forma clara para você decidir o que faz mais sentido para o seu negócio.
                </p>
              </div>
              <div></div>
            </div>
          </div>

          {/* Mobile Timeline - Vertical */}
          <div className="lg:hidden space-y-8">
            {[
              { num: "01", title: "Você compartilha seu consumo e perfil de contratação", desc: "Envie suas faturas e informações básicas para iniciarmos a análise do seu perfil energético.", color: "#9e3ffd" },
              { num: "02", title: "Buscamos propostas com preços finais", desc: "Consultamos comercializadoras parceiras e trazemos ofertas com tudo incluído — sem taxas ocultas.", color: "#9e3ffd" },
              { num: "03", title: "Você compara e escolhe a melhor opção", desc: "Apresentamos as propostas de forma clara para você decidir o que faz mais sentido para o seu negócio.", color: "#c88ff5" },
              { num: "04", title: "Garantimos a execução e protegemos seu contrato", desc: "Acompanhamos todo o processo e blindamos seu contrato contra renegociações forçadas.", color: "#df0af2" },
            ].map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: step.color }}
                  >
                    <span className="text-white text-xl font-bold">{step.num}</span>
                  </div>
                  {index < 3 && <div className="w-0.5 h-full bg-[#eee7f1] mt-2"></div>}
                </div>
                <div className="pb-4">
                  <span 
                    className="inline-block px-3 py-1 text-white text-xs font-medium rounded-full mb-2"
                    style={{ backgroundColor: step.color }}
                  >
                    Passo {step.num}
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-[#736d77] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Eligibility Note */}
          <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg max-w-2xl mx-auto">
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
