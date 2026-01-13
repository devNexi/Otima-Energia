import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";


export default function Team() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h1 className="text-[3.5rem] lg:text-[4.5rem] leading-[1] font-normal tracking-tight text-[#9e3ffd]">
            Equipe
          </h1>
        </div>
      </section>

      {/* Team Grid */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
            {/* Callum */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-20 h-20 bg-[#eee7f1] rounded-full mb-6 flex items-center justify-center">
                <span className="text-2xl font-light text-[#9e3ffd]">CS</span>
              </div>
              <h3 className="text-2xl font-medium text-[#9e3ffd]">
                Callum Sinclair
              </h3>
              <p className="text-[#df0af2] font-medium mt-2">
                Fundador & CEO
              </p>
              <p className="text-[#736d77] leading-relaxed mt-4">
                Fundador com anos de experiência no mercado de energia do Reino Unido. Cidadão brasileiro focado em trazer inovação e melhores práticas internacionais para o setor elétrico brasileiro.
              </p>
            </div>

            {/* Renan */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-20 h-20 bg-[#eee7f1] rounded-full mb-6 flex items-center justify-center">
                <span className="text-2xl font-light text-[#9e3ffd]">R</span>
              </div>
              <h3 className="text-2xl font-medium text-[#9e3ffd]">
                Renan
              </h3>
              <p className="text-[#df0af2] font-medium mt-2">
                Diretor de Operações Brasil
              </p>
              <p className="text-[#736d77] leading-relaxed mt-4">
                Vasta experiência em operações e gestão comercial no setor energético brasileiro. Responsável por garantir excelência na entrega e no relacionamento com clientes e parceiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}
