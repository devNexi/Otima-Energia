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
      <section className="bg-[#eee7f1] py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl mb-8">
            A maioria das empresas brasileiras paga mais do que deveria pela energia,{" "}
            <span className="text-highlight">não por falta de opções, mas por falta de clareza</span>.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-6">
            O mercado de energia é cheio de oportunidades, mas também de ruído: ofertas confusas, contratos ambíguos e vendedores que empurram uma única solução.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] max-w-4xl mb-12">
            A Ótima existe para tirar o peso das suas costas: analisamos os três mercados (ACR, ACL e GDL), explicamos tudo com transparência e te entregamos só o que importa — a decisão certa para o seu negócio.
          </p>
          <div className="flex flex-wrap gap-8 lg:gap-16 max-w-4xl">
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">3</p>
              <p className="text-[#736d77] mt-2">Mercados analisados</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">40%</p>
              <p className="text-[#736d77] mt-2">Economia de até</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#9e3ffd]">0</p>
              <p className="text-[#736d77] mt-2">Conflitos de interesse</p>
            </div>
          </div>
          <p className="text-sm text-[#736d77] mt-8 max-w-2xl">
            *Valores indicam potencial de economia estimada. Resultados variam conforme perfil, região e prazo.
          </p>
        </div>
      </section>

      <section id="process" className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-4">Como encontramos o mercado ideal para você</h2>
          <p className="text-lg text-[#736d77] max-w-3xl mb-16">
            Nosso método substitui a venda de uma única solução por uma análise neutra. Trabalhamos como seu consultor estratégico para identificar a rota de maior economia.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-[#df0af2]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-[#df0af2] font-medium">Diagnóstico completo</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">01</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Diagnóstico Completo dos 3 Mercados
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Você compartilha suas faturas. Nossa IA (ECOS™) cruza seu consumo, tarifa local e perfil com modelos dos mercados <strong>ACR, ACL e GDL</strong> para calcular a economia real possível em cada um.
              </p>
            </div>

            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-[#df0af2]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-[#df0af2] font-medium">Elegibilidade e cenários</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Análise de Elegibilidade e Cenários
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Identificamos em qual(is) mercado(s) sua empresa se qualifica e simulamos projeções financeiras detalhadas. Entregamos um quadro claro de prazos, riscos e oportunidades de cada caminho.
              </p>
            </div>

            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-[#df0af2]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[#df0af2] font-medium">Recomendação clara</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Recomendação Clara e Comparável
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Apresentamos uma proposta única com a <strong>recomendação do mercado mais vantajoso</strong> e, se aplicável, as melhores ofertas de fornecedores ou contratos daquele ambiente. A decisão final, sempre transparente, é sua.
              </p>
            </div>

            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-48">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-[#df0af2]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-[#df0af2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-[#df0af2] font-medium">Implementação e gestão</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">04</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Implementação e Gestão
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Acompanhamos toda a migração para o ACL, a otimização do contrato na concessionária (ACR) ou a adesão a uma usina GDL. E na renovação, reavaliamos o cenário para garantir que você permaneça no melhor lugar.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg max-w-2xl">
            <p className="text-[#736d77]">
              <strong className="text-[#16163f]">Elegibilidade:</strong> Após a mudança federal de jan/2024, empresas atendidas em Grupo A (média/alta tensão) podem migrar para o Mercado Livre. Mas mesmo quem não migra pode economizar com otimização no ACR ou créditos de GDL.{" "}
              <a href="/lei-mercado-livre" className="text-[#9e3ffd] hover:underline">Saiba mais</a>
            </p>
          </div>

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
                DIAGNÓSTICO GRATUITO DOS 3 MERCADOS
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
