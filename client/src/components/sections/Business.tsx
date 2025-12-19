import migracaoImg from "@/assets/homepage/sol-migracao.png";
import estrategiasImg from "@/assets/homepage/sol-estrategias.png";
import otimizacaoImg from "@/assets/homepage/sol-otimizacao.png";
import transparenciaImg from "@/assets/homepage/sol-transparencia.png";

export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const solutions = [
    {
      image: migracaoImg,
      label: "Empresas e PMEs",
      title: "Migração Simplificada",
      description: "Simplificamos toda a migração para o Mercado Livre, eliminando burocracia e gerando economia de até 40%.",
    },
    {
      image: estrategiasImg,
      label: "Empresas de Maior Porte",
      title: "Estratégias Personalizadas",
      description: "Estratégias sob medida com foco em previsibilidade, flexibilidade e redução consistente de custos.",
    },
    {
      image: otimizacaoImg,
      label: "Gestão Contínua",
      title: "Otimização de Contratos",
      description: "Acompanhamos seu contrato ao longo do tempo, identificando oportunidades de melhoria e economia.",
    },
    {
      image: transparenciaImg,
      label: "Segurança Total",
      title: "Transparência Garantida",
      description: "Nosso serviço é gratuito para você. Trabalhamos com total transparência e sem conflitos de interesse.",
    },
  ];

  return (
    <>
      {/* Statement Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            Ajudamos empresas de todos os portes a{" "}
            <span className="text-highlight-pink">economizar até 40%</span>{" "}
            na conta de luz com total transparência.
          </p>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="business" className="bg-white py-24 lg:py-32 border-t border-gray-200">
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
                {/* Image */}
                <div className="mb-6 rounded-xl overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                  <img 
                    src={solution.image} 
                    alt={solution.title} 
                    className="w-full h-40 object-cover"
                  />
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
