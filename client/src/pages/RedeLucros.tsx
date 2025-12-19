import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ArrowRight, Users, BarChart3, FileCheck, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function RedeLucros() {
  const whoIsItFor = [
    "Consultores empresariais",
    "Contadores",
    "Gestores de facilities",
    "Profissionais do setor energético",
  ];

  const whatWeProvide = [
    {
      icon: FileCheck,
      title: "Análise técnica estruturada",
      description: "Metodologia comprovada de comparação e avaliação de ofertas.",
    },
    {
      icon: BarChart3,
      title: "Plataforma de acompanhamento",
      description: "Acesso a dados, relatórios e histórico de decisões.",
    },
    {
      icon: Users,
      title: "Processo claro e auditável",
      description: "Transparência total em cada etapa do processo.",
    },
    {
      icon: DollarSign,
      title: "Remuneração alinhada ao sucesso",
      description: "Modelo que só funciona se o cliente economiza.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd] mb-6">
                Rede de Lucros Ótima
              </h1>
              <p className="text-xl lg:text-2xl text-[#736d77] leading-relaxed mb-8">
                Um programa para profissionais que querem gerar valor real no Mercado Livre de Energia.
              </p>
              <p className="text-lg text-[#736d77] leading-relaxed">
                A abertura do mercado cria oportunidade — mas também confusão. A Rede de Lucros Ótima conecta consultores, contadores, gestores e especialistas a uma estrutura técnica confiável.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 lg:p-10">
              <h2 className="text-xl font-medium text-[#3C145C] mb-6">
                Para quem é este programa?
              </h2>
              <ul className="space-y-4">
                {whoIsItFor.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#9e3ffd] rounded-full flex-shrink-0" />
                    <span className="text-[#736d77]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-16 text-center">
            O que oferecemos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whatWeProvide.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="text-center p-6"
                >
                  <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-7 h-7 text-[#9e3ffd]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#3C145C] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[#736d77] text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="dcvc-section-title mb-8">
              Como funciona
            </h2>
            <p className="text-lg text-[#736d77] leading-relaxed mb-8">
              Você identifica empresas que podem se beneficiar do Mercado Livre de Energia. Nós cuidamos de toda a análise técnica, comparação de ofertas e estruturação de contratos.
            </p>
            <p className="text-lg text-[#736d77] leading-relaxed mb-8">
              O processo é transparente, auditável e focado em resultados reais — não em promessas.
            </p>
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <p className="text-4xl font-light text-[#9e3ffd]">1</p>
                <p className="text-[#736d77] mt-2">Indicação qualificada</p>
              </div>
              <div>
                <p className="text-4xl font-light text-[#9e3ffd]">2</p>
                <p className="text-[#736d77] mt-2">Análise e negociação</p>
              </div>
              <div>
                <p className="text-4xl font-light text-[#9e3ffd]">3</p>
                <p className="text-[#736d77] mt-2">Remuneração por sucesso</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#3C145C] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Quero entender como funciona
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Entre em contato para saber mais sobre o programa e como participar.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#704094] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="rede-lucros-cta"
          >
            Falar com a equipe
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
