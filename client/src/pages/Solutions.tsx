import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { ArrowRight, Zap, Leaf } from "lucide-react";
import { Link } from "wouter";

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd]">
              Soluções completas para sua empresa pagar menos energia.
            </h1>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                Não existe uma única resposta para todos. Cada empresa tem um perfil de consumo, uma tarifa de distribuidora e objetivos diferentes.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                A Ótima Energia existe para encontrar a rota mais econômica para o seu caso específico, seja no mercado cativo (ACR), no mercado livre (ACL) ou via geração compartilhada (GDL).
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                Atuamos como seu consultor independente: analisamos os três cenários com dados reais, recomendamos o melhor caminho e executamos toda a implementação. Sem viés. Sem conflito.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-8">
                Todas as nossas frentes de atuação são operadas sobre o <strong className="text-[#9e3ffd]">ECOS™</strong>, nosso sistema proprietário de inteligência de mercado que combina IA, automação e dados em tempo real para proteger sua empresa de decisões sem visibilidade.
              </p>
              <Link 
                href="/seja-cliente"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
                data-testid="solutions-hero-cta"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                  DIAGNÓSTICO GRATUITO DOS 3 MERCADOS
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-16">
            Escolha o caminho certo para sua empresa
          </h2>

          <div className="space-y-16">
            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="flex-shrink-0">
                <span className="text-6xl font-light text-[#c88ff5]">01</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-medium text-[#16163f]" data-testid="solution-title-diagnostico">
                    Diagnóstico dos 3 Mercados
                  </h3>
                </div>
                <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-6">
                  Grátis | Sem compromisso | Para qualquer empresa
                </p>
                <p className="text-[#736d77] leading-relaxed mb-4">
                  Antes de qualquer recomendação, fazemos uma análise completa e neutra.
                </p>
                <p className="text-[#736d77] leading-relaxed mb-6">
                  Nossa IA cruza seu perfil de consumo, tarifa da concessionária, localização e elegibilidade para calcular a economia potencial em cada um dos três mercados: <strong className="text-[#16163f]">ACR</strong> (otimização na conta atual), <strong className="text-[#16163f]">ACL</strong> (migração para o livre) e <strong className="text-[#16163f]">GDL</strong> (energia por assinatura).
                </p>
                <p className="text-[#736d77] leading-relaxed mb-8">
                  Você recebe um diagnóstico claro com cenários, prazos e riscos. E decide, com total transparência, qual caminho faz sentido para o seu negócio.
                </p>
                <Link 
                  href="/seja-cliente"
                  className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
                  data-testid="cta-diagnostico"
                >
                  Quero meu diagnóstico gratuito
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="flex-shrink-0">
                <span className="text-6xl font-light text-[#c88ff5]">02</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
                <h3 className="text-2xl font-medium text-[#16163f] mb-2" data-testid="solution-title-acr">
                  Otimização no Mercado Cativo (ACR)
                </h3>
                <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-6">
                  Gestão de contas e acesso à Geração Compartilhada (GDL)
                </p>
                <p className="text-[#736d77] leading-relaxed mb-6">
                  Sua empresa ainda não migrou para o livre? Ou não é elegível? Você ainda pode economizar, hoje, sem trocar de fornecedor.
                </p>
                <p className="text-[#736d77] leading-relaxed mb-4 font-medium text-[#16163f]">
                  Atuamos em duas frentes no mercado cativo:
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <div>
                      <strong className="text-[#16163f]">Análise e revisão de contas:</strong>
                      <span className="text-[#736d77]"> Identificamos cobranças indevidas, erros de enquadramento tarifário e oportunidades imediatas de redução na sua fatura da concessionária.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <div>
                      <strong className="text-[#16163f]">Energia por Assinatura (GDL):</strong>
                      <span className="text-[#736d77]"> Conectamos sua empresa a usinas solares, eólicas ou biogás da sua região. Você recebe descontos de 15% a 25% na sua conta de luz, sem investir em equipamentos, sem obras, sem dor de cabeça. Nós gerenciamos toda a relação com o gerador e a compensação dos créditos.</span>
                    </div>
                  </div>
                </div>
                <Link 
                  href="/seja-cliente"
                  className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
                  data-testid="cta-acr"
                >
                  Economizar no meu contrato atual
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="flex-shrink-0">
                <span className="text-6xl font-light text-[#c88ff5]">03</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
                <h3 className="text-2xl font-medium text-[#16163f] mb-2" data-testid="solution-title-acl">
                  Migração e Gestão no Mercado Livre (ACL)
                </h3>
                <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-6">
                  Estratégia, contratação e renovação inteligente
                </p>
                <p className="text-[#736d77] leading-relaxed mb-6">
                  Para empresas elegíveis ou já atuantes no ambiente livre, entregamos economia consistente através de:
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <div>
                      <strong className="text-[#16163f]">Migração simplificada:</strong>
                      <span className="text-[#736d77]"> Cuidamos de todo o processo regulatório, documental e contratual para entrada no ACL. Zero burocracia para você.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <div>
                      <strong className="text-[#16163f]">Seleção de comercializadoras:</strong>
                      <span className="text-[#736d77]"> Usamos o ECOS™ para comparar ofertas reais de múltiplas fornecedoras e negociar as melhores condições para seu perfil.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <div>
                      <strong className="text-[#16163f]">Gestão de contratos e renovação:</strong>
                      <span className="text-[#736d77]"> Acompanhamos seu contrato ao longo do tempo. Na janela de renovação, reavaliamos o mercado e decidimos com dados se vale a pena renovar, renegociar ou trocar de fornecedor. Sem pressa, sem ruído.</span>
                    </div>
                  </div>
                </div>
                <Link 
                  href="/seja-cliente"
                  className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
                  data-testid="cta-acl"
                >
                  Quero migrar ou otimizar meu ACL
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="flex-shrink-0">
                <span className="text-6xl font-light text-[#c88ff5]">04</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <Leaf className="w-6 h-6 text-[#9e3ffd]" />
                  <h3 className="text-2xl font-medium text-[#16163f]" data-testid="solution-title-esg">
                    Sustentabilidade e Estratégia Energética
                  </h3>
                </div>
                <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-6">
                  Energia renovável certificada e neutralização de carbono
                </p>
                <p className="text-[#736d77] leading-relaxed mb-6">
                  Para empresas com compromissos ESG ou metas de descarbonização, estruturamos soluções sob medida:
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <span className="text-[#736d77]">Contratação de energia renovável certificada (I-REC, selo de origem)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <span className="text-[#736d77]">Estratégias de neutralização de carbono</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
                    <span className="text-[#736d77]">Apoio na comunicação de resultados socioambientais</span>
                  </div>
                </div>
                <p className="text-[#736d77] leading-relaxed mb-8">
                  Tudo com total rastreabilidade e transparência.
                </p>
                <Link 
                  href="/seja-cliente"
                  className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
                  data-testid="cta-esg"
                >
                  Soluções ESG para minha empresa
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#16163f] py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                Todos os caminhos passam pelo mesmo sistema.
              </p>
              <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
                ECOS™, Inteligência que orienta cada decisão.
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Seja no ACR, no ACL ou no GDL, todas as nossas recomendações são geradas e validadas pelo ECOS™, nosso sistema proprietário de IA e automação.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Ele não vende produto. Ele analisa dados: ofertas reais de comercializadoras, desempenho de usinas GDL, bandas de preço histórico, perfis de risco e janelas contratuais.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                O ECOS™ só recomenda uma mudança quando há ganho real projetado. Sem conflito. Sem viés. Sem promessas vazias.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 lg:p-10">
              <div className="w-14 h-14 bg-[#9e3ffd] rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Ofertas reais de comercializadoras
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Desempenho de usinas GDL
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Bandas de preço histórico
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Perfis de risco e janelas contratuais
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  Recomendações apenas com ganho real projetado
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
            Pronto para descobrir o melhor caminho para sua empresa?
          </h2>
          <p className="text-xl text-[#736d77] mb-4 max-w-2xl mx-auto">
            Faça um diagnóstico gratuito dos 3 mercados.
          </p>
          <p className="text-lg text-[#736d77] mb-12 max-w-2xl mx-auto">
            Em até 5 dias úteis, você recebe uma análise completa com cenários comparáveis e recomendações claras.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="solutions-bottom-cta"
          >
            Solicitar Diagnóstico Gratuito
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
