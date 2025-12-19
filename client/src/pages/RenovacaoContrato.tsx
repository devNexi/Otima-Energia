import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ArrowRight, Building2, Clock, FileText, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function RenovacaoContrato() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd]">
              Quando minha empresa pode migrar para o Mercado Livre de Energia?
            </h1>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-8">
                O momento certo depende do seu contrato — e de um bom planejamento.
              </p>
              <Link 
                href="/seja-cliente"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
                data-testid="renovacao-hero-cta"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[#3C145C] group-hover:text-[#df0af2] transition-colors">
                  SOLICITAR DIAGNÓSTICO GRATUITO
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section A - Simple explanation */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#3C145C] mb-8">
            A regra prática: sua empresa pode se preparar agora.
          </h2>
          <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed max-w-4xl mb-4">
            No Mercado Livre de Energia, o momento da migração depende do contrato atual da sua empresa, das cláusulas de saída e do planejamento do processo.
          </p>
          <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed max-w-4xl">
            Por isso, mesmo que sua empresa ainda não possa migrar hoje, já é possível iniciar o diagnóstico e se preparar com antecedência.
          </p>
        </div>
      </section>

      {/* Section B - How it works (3 cards) */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#3C145C] mb-4">
                Empresas que já estão no Mercado Livre
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Empresas que já operam no Mercado Livre costumam analisar e negociar novas condições com antecedência. Quanto antes o planejamento começa, maior é o poder de negociação e a chance de garantir contratos mais flexíveis e econômicos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#3C145C] mb-4">
                Empresas ainda no mercado regulado
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Mesmo antes da migração ser permitida, sua empresa já pode iniciar o diagnóstico, entender seu perfil de consumo e se posicionar melhor para quando a abertura do mercado acontecer.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#eee7f1] rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#3C145C] mb-4">
                O que realmente define o momento da migração
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                O fator decisivo não é "esperar uma data". O que define o momento ideal são as condições do seu contrato atual, o prazo de migração com a distribuidora e o planejamento correto para evitar riscos e perdas financeiras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section C - Practical scenarios table */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#3C145C] mb-12">
            Cenários comuns na prática
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#9e3ffd]">
                  <th className="text-left py-4 pr-8 text-lg font-medium text-[#3C145C]">Situação da Empresa</th>
                  <th className="text-left py-4 text-lg font-medium text-[#3C145C]">O que faz sentido</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 pr-8 text-[#736d77]">Contrato com prazo fixo</td>
                  <td className="py-4 text-[#736d77]">Planejar com antecedência e estruturar a migração no momento correto</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 pr-8 text-[#736d77]">Contrato com possibilidade de renegociação</td>
                  <td className="py-4 text-[#736d77]">Avaliar o mercado e negociar melhores condições</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 pr-8 text-[#736d77]">Contrato rígido</td>
                  <td className="py-4 text-[#736d77]">Evitar penalidades e preparar a empresa para o vencimento</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 pr-8 text-[#736d77]">Empresa ainda fora do Mercado Livre</td>
                  <td className="py-4 text-[#736d77]">Iniciar diagnóstico e planejamento desde já</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section D - Why prepare early */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-8">
              Por que começar antes gera vantagem competitiva
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-lg text-[#736d77]">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span>Evita decisões apressadas</span>
              </li>
              <li className="flex items-start gap-3 text-lg text-[#736d77]">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span>Aumenta o poder de negociação</span>
              </li>
              <li className="flex items-start gap-3 text-lg text-[#736d77]">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span>Reduz riscos contratuais</span>
              </li>
              <li className="flex items-start gap-3 text-lg text-[#736d77]">
                <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                <span>Permite estruturar economia de forma planejada</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section E - CTA */}
      <section className="bg-[#3C145C] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Quer entender o melhor caminho para sua empresa?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Solicite um diagnóstico gratuito. Analisamos sua conta, avaliamos sua elegibilidade e indicamos o melhor momento para migrar — agora ou quando sua empresa estiver apta.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="renovacao-bottom-cta"
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
