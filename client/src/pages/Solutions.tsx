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
              <strong>Elegibilidade:</strong> Empresas com conta de luz acima de R$8.000/mês ou demanda contratada de 500kW+
            </p>
            <Link 
              href="/faq"
              className="text-white underline hover:no-underline"
            >
              Saiba mais sobre elegibilidade →
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
                Economia de Energia
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Comparamos ofertas de múltiplos comercializadores para encontrar o melhor preço para sua empresa. Nossa tecnologia analisa seu perfil de consumo e identifica as melhores oportunidades de economia.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Economia média de 35% na conta de luz
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Comparação de ofertas em tempo real
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Negociação com fornecedores certificados
                </li>
              </ul>
            </div>

            {/* Sustentabilidade */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <Leaf className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Energia Renovável
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Acesso a fontes de energia limpa e renovável. Ajudamos sua empresa a reduzir a pegada de carbono enquanto economiza, com certificados de origem renovável.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Energia solar, eólica e hidrelétrica
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Certificados I-REC de energia renovável
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Relatórios de sustentabilidade
                </li>
              </ul>
            </div>

            {/* Gestão Energética */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Gestão Energética
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Monitoramento contínuo do seu consumo com relatórios detalhados. Identificamos oportunidades de otimização e ajudamos a evitar desperdícios.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Dashboard de consumo em tempo real
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Alertas de consumo anormal
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Relatórios mensais de economia
                </li>
              </ul>
            </div>

            {/* Migração para ACL */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <FileCheck className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-2xl font-medium text-[#16163f] mb-4">
                Migração para o Mercado Livre
              </h3>
              <p className="text-[#736d77] leading-relaxed mb-6">
                Cuidamos de toda a burocracia da migração para o Ambiente de Contratação Livre (ACL). Processo simplificado, sem dor de cabeça para sua empresa.
              </p>
              <ul className="space-y-3 text-[#736d77]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Análise de viabilidade gratuita
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Documentação e registro na CCEE
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Acompanhamento pós-migração
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
