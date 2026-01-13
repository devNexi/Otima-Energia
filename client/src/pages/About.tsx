import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-medium text-[#9e3ffd] uppercase tracking-wider mb-6">
              Sua energia. Sua escolha. Sua economia.
            </p>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed">
              Ótima Energia é uma corretora especializada em ajudar empresas brasileiras a acessar o mercado livre de energia com clareza, eficiência e total transparência.
            </p>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mt-6">
              Atuamos como parceiros de longo prazo, comparando o máximo possível do mercado para garantir que nossos clientes tomem decisões bem-informadas, com contratos flexíveis e preços justos. Nosso modelo é alinhado aos interesses do cliente: nosso serviço de comparação é gratuito, e somos remunerados exclusivamente pelos fornecedores.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
                Estamos com pressa.
              </h2>
              <p className="text-lg text-[#736d77] leading-relaxed">
                A Lei nº 15.269/2025 abre o mercado livre de energia para 80 milhões de consumidores nos próximos 36 meses. Esta é a maior transformação do setor elétrico brasileiro desde sua privatização. Queremos estar na linha de frente dessa revolução.
              </p>
            </div>
            <div className="flex items-start lg:justify-end">
              <Link 
                href="/#business"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                  EXPLORAR SOLUÇÕES
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-12">
              Acreditamos em transparência radical.
            </h2>
            <div className="space-y-6 text-lg text-[#736d77] leading-relaxed">
              <p>
                O mercado livre de energia brasileiro movimenta mais de R$100 bilhões por ano, mas continua opaco e fragmentado. Fornecedores, distribuidoras e comercializadores operam com informações assimétricas, deixando empresas pagando mais do que deveriam.
              </p>
              <p>
                Acreditamos que <span className="font-medium text-[#9e3ffd]">tecnologia e dados</span> podem nivelar esse campo. Nossa plataforma analisa consumo, compara ofertas e negocia condições que empresas individuais nunca conseguiriam sozinhas.
              </p>
              <p>
                Não somos apenas uma corretora.
              </p>
              <p>
                A Ótima Energia opera como uma parceira de migração, conformidade e otimização, apoiada pelo <span className="font-medium text-[#9e3ffd]">ECOS™</span> — um sistema proprietário desenvolvido para lidar com a complexidade real do mercado livre brasileiro.
              </p>
              <p>
                Enquanto o mercado permanece opaco e manual, usamos inteligência, dados e automação para proteger empresas e garantir decisões melhores ao longo do tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 lg:gap-16">
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                40%
              </div>
              <p className="text-[#736d77]">
                Economia de até na conta de luz
              </p>
            </div>
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                R$100B+
              </div>
              <p className="text-[#736d77]">
                Volume anual do mercado livre de energia
              </p>
            </div>
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                80M
              </div>
              <p className="text-[#736d77]">
                Consumidores elegíveis até 2028
              </p>
            </div>
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                R$0
              </div>
              <p className="text-[#736d77]">
                Custo do serviço de comparação
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-16">
            Por Que a Ótima Energia
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Expertise</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Conhecimento de Mercado
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Fundada por especialistas com experiência internacional no setor de energia. Trazemos as melhores práticas globais para o mercado brasileiro.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Tecnologia</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Plataforma Inteligente
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Nossa tecnologia analisa seu consumo, compara ofertas de múltiplos fornecedores e encontra as melhores condições automaticamente.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Resultados</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Economia Comprovada
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Nossos clientes economizam em média 35% na conta de luz. Cuidamos de toda a burocracia da migração para o mercado livre.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
