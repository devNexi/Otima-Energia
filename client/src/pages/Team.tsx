import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export default function Team() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#F5F5F0] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <h1 className="text-[3.5rem] lg:text-[4.5rem] leading-[1] font-normal tracking-tight text-[#6B46C1]">
              Equipe
            </h1>
            <p className="text-lg lg:text-xl text-gray-700 leading-relaxed max-w-xl">
              Combinamos profunda expertise no mercado de energia com tecnologia para transformar como o Brasil compra eletricidade.
            </p>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Callum */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#6B46C1] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center">
                <span className="text-2xl font-light text-gray-400">CS</span>
              </div>
              <h3 className="text-2xl font-medium text-[#6B46C1] mb-2">
                Callum Sinclair
              </h3>
              <p className="text-[#D53F8C] font-medium mb-4">
                Fundador & CEO
              </p>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  Visão, estratégia e arquitetura tecnológica. Traz o playbook do mercado de energia do Reino Unido para o mercado livre de R$100 bilhões do Brasil.
                </p>
                <p>
                  Lidera a estratégia de três fases do ACR Group: corretagem → infraestrutura de plataforma → switching de mercado de massa.
                </p>
              </div>
            </div>

            {/* Renan */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#6B46C1] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center">
                <span className="text-2xl font-light text-gray-400">R</span>
              </div>
              <h3 className="text-2xl font-medium text-[#6B46C1] mb-2">
                Renan
              </h3>
              <p className="text-[#D53F8C] font-medium mb-4">
                Diretor de Operações Brasil
              </p>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  Espinha dorsal operacional e execução no mercado brasileiro. Gerencia relacionamentos com fornecedores e operações diárias.
                </p>
                <p>
                  15% de equity de performance adquirido através de marcos de receita: €500k, €1.5M, €5M.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACR Group Structure */}
      <section className="bg-[#F5F5F0] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#6B46C1] mb-6">
            Estrutura ACR Group
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-12 max-w-3xl">
            Estratégia de três fases para capturar o Mercado Livre de Energia Brasileiro de R$100 bilhões anuais.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#6B46C1] transition-colors">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                ACR Group Ltda.
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Holding que supervisiona Ótima Energia, Mercado Invisível e Trocaluz.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#6B46C1] transition-colors">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Ótima Energia
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Corretagem de alta performance gerando receita imediata e inteligência de mercado.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#6B46C1] transition-colors">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Mercado Invisível
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sistema operacional B2B para o mercado livre de energia do Brasil.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#6B46C1] transition-colors">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Trocaluz
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Portal de comparação e switching para 80M de consumidores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="text-[2rem] lg:text-[2.5rem] leading-[1.2] font-normal tracking-tight text-gray-900 max-w-4xl">
            Nosso objetivo: tornar-se a{" "}
            <span className="text-[#6B46C1]">camada de infraestrutura</span>{" "}
            para o switching de energia do Brasil.
          </p>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
