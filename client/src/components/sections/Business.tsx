export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const solutions = [
    {
      iconLabel: "Mercado ideal",
      icon: (
        <svg className="w-8 h-8 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      label: "Diagnóstico Neutro",
      title: "Escolha do Mercado Ideal",
      description: "Diagnóstico neutro entre ACR, ACL e GDL. Análise de viabilidade econômica e elegibilidade para direcionar sua empresa para o ambiente mais competitivo.",
    },
    {
      iconLabel: "Mercado Livre",
      icon: (
        <svg className="w-8 h-8 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: "ACL",
      title: "Otimização no Mercado Livre (ACL)",
      description: "Para empresas no ou migrando para o ACL: estratégia de contratação, seleção de comercializadora, negociação de condições e gestão de renovação para máxima economia.",
    },
    {
      iconLabel: "Mercado Cativo",
      icon: (
        <svg className="w-8 h-8 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "ACR",
      title: "Gestão no Mercado Cativo (ACR)",
      description: "Para empresas no ACR: análise profunda da fatura da concessionária, revisão da tarifa, gestão de créditos de GDL e monitoramento para garantir que você explore todos os descontos possíveis.",
    },
    {
      iconLabel: "100% claro",
      icon: (
        <svg className="w-8 h-8 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      label: "Independência",
      title: "Transparência & Independência",
      description: "Nosso diagnóstico é gratuito. Não somos vinculados a nenhuma comercializadora ou usina. Nossa receita vem de você, apenas se nossa recomendação fizer sentido econômico.",
    },
  ];

  return (
    <>
      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            Ajudamos empresas de todos os portes a{" "}
            <span className="text-highlight-pink">encontrar o mercado de energia mais econômico</span>{" "}
            com total transparência.
          </p>
        </div>
      </section>

      <section id="business" className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-16 text-center">Nossas Frentes de Atuação</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => (
              <div 
                key={index}
                className="group flex flex-col text-center p-6 rounded-xl hover:shadow-lg transition-all duration-300 bg-white h-full"
              >
                <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-40">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-[#9e3ffd]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      {solution.icon}
                    </div>
                    <span className="text-[#9e3ffd] font-medium text-sm">{solution.iconLabel}</span>
                  </div>
                </div>

                <p className="text-xs tracking-wide text-[#9e3ffd] uppercase mb-2 font-medium">
                  {solution.label}
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {solution.title}
                </h3>

                <p className="text-[#736d77] text-sm leading-relaxed flex-grow">
                  {solution.description}
                </p>

                <div className="mt-6">
                  <button 
                    onClick={() => handleScroll("#contact")}
                    className="inline-flex items-center gap-2 text-[#9e3ffd] font-medium text-sm hover:text-[#df0af2] transition-colors group/btn"
                    data-testid={`solution-btn-${index}`}
                  >
                    <span>Saiba Mais</span>
                    <span className="transform group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
