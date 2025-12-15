import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ArrowRight, Calendar, Building2, Factory, Store, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function LeiMercadoLivre() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd]">
              Mercado Livre de Energia: quando sua empresa pode migrar e começar a economizar
            </h1>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                O Mercado Livre de Energia representa uma das maiores oportunidades de redução de custos para empresas brasileiras.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                Com a Lei nº 15.269/2025, milhões de empresas passam a ter acesso ao mercado livre — mas acesso não significa transparência. Sem comparação e estrutura, muitas continuarão pagando mais do que deveriam.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-8">
                A Lei nº 15.269/2025 formaliza essa abertura ao longo dos próximos anos. A Ótima Energia existe para garantir que sua empresa aproveite essa oportunidade para economizar de forma correta, segura e sem riscos.
              </p>
              <Link 
                href="/seja-cliente"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
                data-testid="lei-cta"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                  DESCUBRA QUANDO SUA EMPRESA PODE MIGRAR
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* When Can You Migrate Section */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-8">
            Quando sua empresa pode migrar?
          </h2>
          <ul className="space-y-4 text-lg text-[#736d77] max-w-3xl mb-8">
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1">•</span>
              <span>Empresas que já atendem aos critérios atuais podem migrar imediatamente</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1">•</span>
              <span>Empresas comerciais e industriais fora do mercado livre passam a migrar gradualmente a partir de 2026</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1">•</span>
              <span>Pequenas empresas terão acesso ampliado até 2028</span>
            </li>
          </ul>
          <p className="text-lg text-[#736d77] max-w-3xl mb-4">
            Mesmo que sua empresa ainda não possa migrar hoje, já é possível iniciar o diagnóstico e se preparar. A Ótima Energia acompanha todo o processo desde o início.
          </p>
          <p className="text-lg text-[#736d77] max-w-3xl mb-4">
            Empresas que começam esse processo com antecedência ganham vantagem competitiva, mais poder de negociação e melhores condições quando chega o momento da migração.
          </p>
          <p className="text-lg text-[#736d77] max-w-3xl">
            Você não precisa esperar para começar. Empresas que se preparam com antecedência ganham vantagem competitiva, mais opções de negociação e evitam decisões no escuro quando chega o momento da migração.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-16">
            Cronograma de Abertura do Mercado
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Current */}
            <div className="bg-white border-2 border-[#9e3ffd] rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Factory className="w-8 h-8 text-[#9e3ffd]" />
                <span className="text-sm tracking-wide text-[#9e3ffd] uppercase font-medium">Já Podem Migrar</span>
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Empresas Elegíveis Hoje
              </h3>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Empresas com demanda a partir de aproximadamente 500 kW</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Consumidores de média e alta tensão</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Indústrias e grandes operações comerciais</span>
                </li>
              </ul>
            </div>

            {/* 2026-2027 */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-8 h-8 text-[#9e3ffd]" />
                <span className="text-sm tracking-wide text-[#736d77] uppercase">2026-2027</span>
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Próxima Fase
              </h3>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Regulamentação prática pela ANEEL a partir de 2026</span>
                </li>
                <li className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Expansão para empresas comerciais e industriais hoje no mercado regulado</span>
                </li>
              </ul>
            </div>

            {/* 2028 */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-8 h-8 text-[#9e3ffd]" />
                <span className="text-sm tracking-wide text-[#736d77] uppercase">Até 2028</span>
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Abertura Total
              </h3>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <Store className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Inclusão de pequenas empresas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Store className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>Até 80 milhões de consumidores elegíveis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefit Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-8">
              Por que se preparar com antecedência?
            </h2>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-8">
              Empresas que se preparam com antecedência evitam decisões apressadas, ganham poder de negociação e entram no mercado com contratos melhor estruturados. Nosso serviço de comparação é gratuito, mesmo que sua empresa ainda não esteja apta a migrar hoje.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <p className="text-4xl font-light text-[#9e3ffd] mb-2">40%</p>
                <p className="text-[#736d77]">Economia de até</p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-4xl font-light text-[#9e3ffd] mb-2">R$0</p>
                <p className="text-[#736d77]">Custo do diagnóstico</p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-4xl font-light text-[#9e3ffd] mb-2">0</p>
                <p className="text-[#736d77]">Obrigação de contratar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOS Preparation Section */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-8">
              Por que empresas inteligentes começam antes
            </h2>
            <div className="space-y-4 text-lg text-[#736d77] leading-relaxed">
              <p>
                A abertura do Mercado Livre cria oportunidade — mas também risco para quem chega despreparado.
              </p>
              <p>
                O <span className="font-medium text-[#9e3ffd]">ECOS™</span> permite que empresas se preparem com antecedência, entendendo seu perfil, riscos e posicionamento antes mesmo da migração ser possível.
              </p>
              <p className="font-medium text-[#16163f]">
                Quem chega com dados, chega negociando melhor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Descubra quando sua empresa pode migrar
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Faça uma análise gratuita impulsionada por IA e descubra seu potencial de economia no mercado livre de energia.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="lei-bottom-cta"
          >
            Solicitar Diagnóstico Gratuito
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
