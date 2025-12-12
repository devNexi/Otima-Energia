import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ArrowRight, Zap, Leaf, BarChart3, FileCheck } from "lucide-react";
import { Link } from "wouter";

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd]">
              Soluções completas para sua empresa economizar energia.
            </h1>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-8">
                Oferecemos um portfólio completo de serviços para empresas que querem reduzir custos com energia elétrica através do mercado livre.
              </p>
              <Link 
                href="/seja-cliente"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                  DIAGNÓSTICO GRATUITO
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Banner */}
      <section className="bg-[#9e3ffd] py-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white text-lg">
              <strong>Elegibilidade:</strong> Empresas com contas acima de R$8.000/mês e demanda a partir de ~500 kW (limite em redução com a nova lei)
            </p>
            <Link 
              href="/lei-mercado-livre"
              className="text-white underline hover:no-underline"
            >
              Saiba mais sobre a Lei →
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Economia */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Economia
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Contratação personalizada com apoio de IA para gerar previsibilidade e economia de até 40%. Auditoria gratuita e sem obrigação.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Economia de até 40% na conta de luz
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Comparação ampla do mercado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Serviço de comparação gratuito
                </li>
              </ul>
            </div>

            {/* Soluções Financeiras */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Soluções Financeiras
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Estruturação de custos energéticos e apoio na gestão contratual para reduzir desperdícios e surpresas na fatura.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Previsibilidade orçamentária
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Gestão contratual transparente
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Redução de desperdícios
                </li>
              </ul>
            </div>

            {/* Sustentabilidade */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <Leaf className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Sustentabilidade
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Acesso a opções de energia renovável certificada e estratégias de neutralização de carbono, sempre com transparência total.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Energia renovável certificada
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Estratégias de neutralização de carbono
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Transparência total
                </li>
              </ul>
            </div>

            {/* Gestão Energética */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <FileCheck className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Gestão Energética
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Otimização contínua de contratos e suporte regulatório, reduzindo riscos e processos manuais.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Otimização contínua de contratos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Suporte regulatório
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Redução de riscos e processos manuais
                </li>
              </ul>
            </div>

            {/* Monitoramento Inteligente */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300 md:col-span-2">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Monitoramento Inteligente
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Análises periódicas e insights baseados em dados para identificar oportunidades de melhoria ao longo do tempo.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Análises periódicas baseadas em dados
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Insights para melhoria contínua
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Acompanhamento de resultados
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Pronto para começar a economizar?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Faça um diagnóstico gratuito e descubra quanto sua empresa pode economizar no mercado livre de energia.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
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
