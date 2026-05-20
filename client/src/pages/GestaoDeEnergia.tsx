import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function GestaoDeEnergia() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                Gestão de Energia
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#16163f] mb-6">
                Economia contínua.{" "}
                <span className="text-[#9e3ffd]">Não só na hora de contratar.</span>
              </h1>
            </div>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                A maioria das empresas resolve a energia uma vez, quando migra ou contrata, e esquece. O mercado muda, a tarifa muda, o contrato envelhece, e ninguém revisa.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                A Gestão de Energia da Ótima é um acompanhamento estratégico contínuo. Monitoramos sua posição no mercado, identificamos oportunidades de redução e garantimos que as decisões corretas sejam tomadas no momento certo, não depois.
              </p>
              <p className="text-lg lg:text-xl text-[#16163f] font-medium mb-8">
                Você foca no negócio. A gente cuida da conta de energia.
              </p>
              <Link
                href="/seja-cliente"
                className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                data-testid="gestao-hero-cta"
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
            O que inclui a Gestão de Energia da Ótima
          </h2>
          <p className="text-lg text-[#736d77] mb-12 max-w-2xl">
            Uma visão estratégica e recorrente da sua posição energética, não uma análise pontual que fica obsoleta em seis meses.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Acompanhamento estratégico da conta",
                desc: "Revisão periódica da sua fatura, identificando variações relevantes, cobranças indevidas e desvios em relação ao contrato vigente.",
              },
              {
                title: "Monitoramento de oportunidades de mercado",
                desc: "O ECOS™ monitora continuamente o cenário do setor (preços de energia, abertura do mercado livre, novos geradores na sua região) e aciona quando há uma oportunidade real.",
              },
              {
                title: "Apoio à tomada de decisão",
                desc: "Quando surgir uma oportunidade de migrar, renovar ou ajustar o contrato, você recebe uma análise clara com recomendação estruturada. Sem pressão, sem ruído, com dados.",
              },
              {
                title: "Revisão contratual recorrente",
                desc: "Antes de qualquer vencimento ou janela de renovação, reavaliamos o mercado e garantimos que você esteja entrando na próxima fase com a melhor estrutura possível.",
              },
              {
                title: "Visão consolidada em múltiplas unidades",
                desc: "Para empresas com várias unidades consumidoras, oferecemos uma visão consolidada, identificando oportunidades de otimização no portfólio completo, não apenas em uma conta.",
              },
              {
                title: "Relatórios e rastreabilidade",
                desc: "Cada análise, recomendação e decisão é documentada. Você tem histórico completo e pode justificar internamente cada escolha energética da empresa.",
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 hover:border-[#9e3ffd] hover:shadow-lg transition-all" data-testid={`gestao-feature-${i}`}>
                <h3 className="text-lg font-semibold text-[#16163f] mb-3">{item.title}</h3>
                <p className="text-[#736d77] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-6">
                Para quem é a Gestão de Energia?
              </h2>
              <p className="text-lg text-[#736d77] leading-relaxed mb-6">
                A Gestão de Energia é ideal para empresas que:
              </p>
              <ul className="space-y-4">
                {[
                  "Já estão no Mercado Livre e querem garantir que o contrato continue competitivo",
                  "Têm múltiplas unidades e precisam de uma visão consolidada e estratégica",
                  "Não têm equipe interna dedicada para monitorar o mercado de energia",
                  "Querem decisões baseadas em dados, não em urgência ou pressão de fornecedores",
                  "Buscam redução contínua de custos, não só no momento da contratação",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                    <span className="text-[#736d77]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 lg:p-10 border border-gray-200">
              <h3 className="text-xl font-medium text-[#16163f] mb-6">O que mudou com a Lei nº 15.269/2025</h3>
              <p className="text-[#736d77] leading-relaxed mb-4">
                Com a abertura gradual do mercado livre até 2028, mais empresas terão acesso ao ACL. Isso significa mais oportunidades, mas também mais decisões a tomar.
              </p>
              <p className="text-[#736d77] leading-relaxed mb-4">
                Empresas sem gestão estratégica tendem a tomar decisões tardias, contratar mal ou perder janelas favoráveis de negociação.
              </p>
              <p className="text-[#16163f] font-medium">
                A Gestão de Energia da Ótima garante que você esteja sempre posicionado corretamente, seja no ACL, no GD ou no mercado regulado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#9e3ffd] mb-8">
            O papel do ECOS™ na gestão contínua
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 text-lg text-[#736d77] leading-relaxed">
              <p>
                O <strong className="text-[#9e3ffd]">ECOS™</strong> é o sistema proprietário da Ótima Energia que combina IA, automação e dados de mercado para acompanhar, avaliar e otimizar posições de energia ao longo do tempo.
              </p>
              <p>
                Ele não é uma ferramenta de relatórios. É um sistema de inteligência que identifica quando algo mudou, e quando isso representa uma oportunidade ou um risco para o seu contrato.
              </p>
              <p>
                Na prática, isso significa que sua empresa não precisa ficar monitorando o mercado. O ECOS™ faz isso, e nós traduzimos os sinais em recomendações claras e acionáveis.
              </p>
            </div>
            <div className="bg-[#eee7f1] rounded-xl p-8">
              <ul className="space-y-4">
                {[
                  "Monitoramento contínuo de preços e contratos",
                  "Alertas em janelas críticas de renovação",
                  "Comparação com o mercado para validar posição atual",
                  "Análise de risco em mudanças de cenário",
                  "Recomendações documentadas e rastreáveis",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                    <span className="text-[#16163f]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Comece com um diagnóstico gratuito
          </h2>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Entendemos sua posição atual, identificamos oportunidades e recomendamos o modelo de gestão mais adequado para o seu caso.
          </p>
          <p className="text-base text-gray-400 mb-12 max-w-xl mx-auto">
            Sem compromisso. Sem custo inicial. Você decide se quer avançar.
          </p>
          <Link
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="gestao-bottom-cta"
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
