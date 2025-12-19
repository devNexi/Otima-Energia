import { ArrowRight } from "lucide-react";
import diagnosisImage from "@/assets/homepage/diagnosis.png";
import compareImage from "@/assets/homepage/compare.png";
import migrateImage from "@/assets/homepage/migrate.png";

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

      {/* Process Steps Section */}
      <section id="process" className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title mb-16">Como Funciona</h2>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src={diagnosisImage} 
                  alt="Diagnóstico de energia" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">01</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Envie sua conta de luz
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Nossa análise identifica perfil, elegibilidade, riscos e oportunidades — mesmo que a migração ainda não seja imediata.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src={compareImage} 
                  alt="Comparação de mercado" 
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Comparamos cenários e negociamos
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Comparamos cenários, explicamos diferenças contratuais (preço, prazo, indexação, flexibilidade) e negociamos com fornecedores.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-6 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src={migrateImage} 
                  alt="Migração e acompanhamento" 
                  className="w-full h-48 object-cover hue-rotate-[-20deg] saturate-[0.85] brightness-[0.9]"
                />
              </div>
              <div className="mb-4">
                <span className="text-5xl font-light text-[#c88ff5]">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Acompanhamos da decisão ao fornecimento
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Acompanhamos da decisão ao fornecimento — e seguimos monitorando para evitar contratos mal posicionados.
              </p>
            </div>
          </div>

          {/* Data-driven decision note */}
          <p className="mt-8 text-lg text-[#9e3ffd] font-medium">
            Decisão orientada por dados, não por pressão comercial.
          </p>

          {/* Eligibility Note */}
          <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg max-w-2xl">
            <p className="text-[#736d77]">
              <strong className="text-[#3C145C]">Elegibilidade:</strong> Atendemos empresas com contas acima de R$8.000/mês e demanda próxima de 500 kW (limite em redução). Se sua empresa ainda não for elegível, você já pode enviar seus dados para iniciar o diagnóstico.{" "}
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
              <span className="text-[#3C145C] group-hover:text-[#704094] transition-colors">
                FAZER DIAGNÓSTICO GRATUITO
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
