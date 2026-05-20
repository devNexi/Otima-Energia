import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function MercadoLivreAcl() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                ACL / Mercado Livre de Energia
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#16163f] mb-6">
                Escolha quem fornece a energia da sua empresa.{" "}
                <span className="text-[#9e3ffd]">Com transparência e estratégia.</span>
              </h1>
            </div>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                O Mercado Livre de Energia (ACL) permite que empresas elegíveis comprem energia diretamente de comercializadoras, com preços negociados, contratos personalizados e economias de até 30% na conta.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                O problema é que o mercado é opaco: dezenas de comercializadoras, diferentes estruturas de contrato, condições confusas e vendedores que empurram o que é melhor para eles, não para você.
              </p>
              <p className="text-lg lg:text-xl text-[#16163f] font-medium mb-8">
                A Ótima Energia entra como seu consultor independente: sem vínculo com nenhuma comercializadora, sem pressão, com visão completa do mercado.
              </p>
              <Link
                href="/seja-cliente"
                className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                data-testid="acl-hero-cta"
              >
                Solicitar Diagnóstico Gratuito
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-4">
            O que a Ótima entrega no ACL
          </h2>
          <p className="text-lg text-[#736d77] mb-12 max-w-2xl">
            Atuamos em todas as etapas do ciclo de energia no Mercado Livre, da primeira análise à renovação do contrato.
          </p>

          <div className="space-y-8">
            {[
              {
                num: "01",
                title: "Diagnóstico e elegibilidade",
                sub: "Gratuito e sem compromisso",
                body: "Antes de qualquer movimento, analisamos se o ACL faz sentido para a sua empresa. Consideramos consumo, perfil de carga, localização, distribuidora e timing de contrato. Se não for o caminho certo agora, dizemos isso claramente.",
              },
              {
                num: "02",
                title: "Seleção e comparação de comercializadoras",
                sub: "Apenas players nacionais sólidos e confiáveis",
                body: "A Ótima trabalha exclusivamente com as principais comercializadoras do mercado brasileiro: empresas com sólida capacidade financeira, histórico comprovado e contratos transparentes. Usamos o ECOS™ para comparar as ofertas reais e identificar a melhor combinação de preço, prazo e condições para o seu perfil.",
              },
              {
                num: "03",
                title: "Migração simplificada",
                sub: "Zero burocracia para você",
                body: "Cuidamos de todo o processo regulatório, documental e de comunicação com a distribuidora para a entrada no ACL. Você acompanha o processo, sem ter que executá-lo.",
              },
              {
                num: "04",
                title: "Gestão e renovação estratégica",
                sub: "Decisão com dados, na hora certa",
                body: "O contrato de energia no ACL não é eterno. Quando a janela de renovação se aproxima, reavaliamos o cenário de mercado e recomendamos, com dados, se é hora de renovar, renegociar ou trocar de comercializadora. Sem pressa, sem ruído.",
              },
            ].map((item, i) => (
              <div key={i} className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
                <div className="flex-shrink-0">
                  <span className="text-6xl font-light text-[#c88ff5]">{item.num}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] hover:shadow-lg transition-all">
                  <h3 className="text-xl font-medium text-[#16163f] mb-1" data-testid={`acl-service-${i}`}>{item.title}</h3>
                  <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">{item.sub}</p>
                  <p className="text-[#736d77] leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-4">
            Quem pode migrar para o ACL?
          </h2>
          <p className="text-lg text-[#736d77] mb-8 max-w-2xl">
            Com a Lei nº 15.269/2025, o acesso ao Mercado Livre está sendo ampliado gradualmente. Veja o cronograma:
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                phase: "Agora",
                title: "Já podem migrar",
                items: ["Empresas com demanda a partir de ~500 kW", "Consumidores de média e alta tensão", "Indústrias e grandes operações comerciais"],
                color: "bg-[#9e3ffd]",
              },
              {
                phase: "2026–2027",
                title: "Próxima fase",
                items: ["Novas regras de elegibilidade a partir de 2026", "Expansão para empresas comerciais e industriais hoje no mercado regulado"],
                color: "bg-[#16163f]",
              },
              {
                phase: "Até 2028",
                title: "Abertura total",
                items: ["Inclusão de pequenas empresas", "Até 80 milhões de consumidores elegíveis"],
                color: "bg-[#736d77]",
              },
            ].map((phase, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden">
                <div className={`${phase.color} text-white px-6 py-4`}>
                  <p className="text-sm uppercase tracking-wide font-medium opacity-80">{phase.phase}</p>
                  <p className="text-lg font-medium">{phase.title}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-[#9e3ffd] flex-shrink-0 mt-1" />
                        <span className="text-[#736d77] text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#736d77]">
            Mesmo que sua empresa ainda não seja elegível, iniciar o diagnóstico com antecedência gera vantagem competitiva: melhor planejamento, mais poder de negociação e menor risco na migração.
          </p>
        </div>
      </section>

      <section className="bg-[#16163f] py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                O que nos diferencia
              </p>
              <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
                Independência real no mercado livre.
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                A maioria das empresas que "ajuda" você a entrar no ACL representa um conjunto limitado de fornecedores, ou tem vínculo comercial com apenas uma ou duas comercializadoras.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                A Ótima Energia não representa nenhuma comercializadora. Nós comparamos o mercado com dados reais, colocamos na mesa apenas players com solidez financeira e histórico comprovado, e recomendamos o que é melhor para o seu perfil.
              </p>
            </div>
            <div className="space-y-4">
              {[
                "Acesso às principais comercializadoras nacionais",
                "Comparação real de propostas, não curadoria de um único fornecedor",
                "Análise de risco contratual antes de qualquer assinatura",
                "Acompanhamento contínuo durante a vigência do contrato",
                "Reavaliação estratégica na janela de renovação",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
            Descubra se o ACL é o caminho certo para a sua empresa
          </h2>
          <p className="text-xl text-[#736d77] mb-12 max-w-2xl mx-auto">
            Diagnóstico gratuito. Sem compromisso. Em até 5 dias úteis você recebe uma análise clara com cenários, prazos e recomendação.
          </p>
          <Link
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="acl-bottom-cta"
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
