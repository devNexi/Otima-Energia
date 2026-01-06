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
            A maioria das empresas brasileiras paga mais do que deveria pela energia,{" "}
            <span className="text-highlight">não por falta de opções, mas por falta de clareza</span>.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-6">
            O Mercado Livre é cheio de oportunidades, mas também de ruído: ofertas confusas, contratos ambíguos e vendedores que prometem o mundo.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-12">
            A Ótima existe para tirar o peso das suas costas: comparamos ofertas reais, explicamos tudo com transparência e te entregamos só o que importa, uma decisão tranquila, sem arrependimentos depois.
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

      {/* Process Steps Section */}
      <section id="process" className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title mb-16 text-[#df0af2]">Como Funciona</h2>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Step 1 - Upload documents / energy profile */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-14 h-14 bg-[#df0af2]/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="w-14 h-14 bg-[#df0af2]/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[#df0af2] font-medium">Análise energética</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#df0af2]">01</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Você compartilha seu consumo e perfil de contratação
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Envie suas faturas e informações básicas para iniciarmos a análise do seu perfil energético.
              </p>
            </div>

            {/* Step 2 - Fetch proposals / handshake + pricing */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-14 h-14 bg-[#df0af2]/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="w-14 h-14 bg-[#df0af2]/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[#df0af2] font-medium">Cotação de mercado</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#df0af2]">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Buscamos propostas com preços finais
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Consultamos comercializadoras parceiras e trazemos ofertas com tudo incluído — sem taxas ocultas.
              </p>
            </div>

            {/* Step 3 - Compare options / decision */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-14 h-14 bg-[#df0af2]/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="w-14 h-14 bg-[#df0af2]/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[#df0af2] font-medium">Comparação clara</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#df0af2]">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Você compara e escolhe a melhor opção
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Apresentamos as propostas de forma clara para você decidir o que faz mais sentido para o seu negócio.
              </p>
            </div>

            {/* Step 4 - Contract protection */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-[#df0af2]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-[#df0af2] font-medium">Proteção contratual</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#df0af2]">04</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Garantimos a execução e protegemos seu contrato
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Acompanhamos todo o processo e blindamos seu contrato contra renegociações forçadas.
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
              <span className="w-10 h-10 bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                <ArrowRight className="w-5 h-5" />
              </span>
              <span className="text-[#df0af2] group-hover:text-[#9e3ffd] transition-colors">
                FAZER DIAGNÓSTICO GRATUITO
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
