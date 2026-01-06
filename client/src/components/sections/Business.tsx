export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const solutions = [
    {
      iconLabel: "Migração fácil",
      icons: [
        <svg key="rocket" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>,
        <svg key="arrow" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      ],
      label: "Empresas e PMEs",
      title: "Migração Simplificada",
      description: "Simplificamos toda a migração para o Mercado Livre, eliminando burocracia e gerando economia de até 40%.",
    },
    {
      iconLabel: "Sob medida",
      icons: [
        <svg key="puzzle" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>,
        <svg key="adjust" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ],
      label: "Empresas de Maior Porte",
      title: "Estratégias Personalizadas",
      description: "Estratégias sob medida com foco em previsibilidade, flexibilidade e redução consistente de custos.",
    },
    {
      iconLabel: "Gestão ativa",
      icons: [
        <svg key="refresh" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>,
        <svg key="trending" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ],
      label: "Gestão Contínua",
      title: "Otimização de Contratos",
      description: "Acompanhamos seu contrato ao longo do tempo, identificando oportunidades de melhoria e economia.",
    },
    {
      iconLabel: "100% claro",
      icons: [
        <svg key="eye" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>,
        <svg key="lock" className="w-7 h-7 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ],
      label: "Segurança Total",
      title: "Transparência Garantida",
      description: "Nosso serviço é gratuito para você. Trabalhamos com total transparência e sem conflitos de interesse.",
    },
  ];

  return (
    <>
      {/* Statement Section */}
      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            Ajudamos empresas de todos os portes a{" "}
            <span className="text-highlight-pink">economizar até 40%</span>{" "}
            na conta de luz com total transparência.
          </p>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="business" className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title mb-16 text-center">Soluções</h2>

          {/* Solutions Grid - Professional Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => (
              <div 
                key={index}
                className="group flex flex-col text-center p-6 rounded-xl hover:shadow-lg transition-all duration-300 bg-white h-full"
              >
                {/* Icon Visual */}
                <div className="mb-6 rounded-xl overflow-hidden bg-[#eee7f1] flex items-center justify-center h-40">
                  <div className="text-center p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {solution.icons.map((icon, i) => (
                        <div key={i} className="w-12 h-12 bg-[#9e3ffd]/20 rounded-full flex items-center justify-center">
                          {icon}
                        </div>
                      ))}
                    </div>
                    <span className="text-[#9e3ffd] font-medium text-sm">{solution.iconLabel}</span>
                  </div>
                </div>

                {/* Label */}
                <p className="text-xs tracking-wide text-[#9e3ffd] uppercase mb-2 font-medium">
                  {solution.label}
                </p>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {solution.title}
                </h3>

                {/* Description */}
                <p className="text-[#736d77] text-sm leading-relaxed flex-grow">
                  {solution.description}
                </p>

                {/* Button - pushed to bottom with mt-auto */}
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
