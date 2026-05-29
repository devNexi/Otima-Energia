import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Building2, Clock, FileText, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function RenovacaoContrato() {
  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />
      
      <section className="bg-[#13112a] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd]">
              Quando minha empresa pode migrar para o Mercado Livre de Energia?
            </h1>
            <div>
              <p className="text-lg lg:text-xl text-white/70 leading-relaxed mb-8">
                O momento certo depende do seu contrato, e de um bom planejamento.
              </p>
              <Link 
                href="/seja-cliente"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
                data-testid="renovacao-hero-cta"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-white/70 group-hover:text-[#df0af2] transition-colors">
                  SOLICITAR DIAGNÓSTICO GRATUITO
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-16 lg:py-24 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-8">
            A regra prática: sua empresa pode se preparar agora.
          </h2>
          <p className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-4xl mb-4">
            No Mercado Livre de Energia, o momento da migração depende do contrato atual da sua empresa, das cláusulas de saída e do planejamento do processo.
          </p>
          <p className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-4xl">
            Por isso, mesmo que sua empresa ainda não possa migrar hoje, já é possível iniciar o diagnóstico e se preparar com antecedência.
          </p>
        </div>
      </section>

      <section className="bg-[#13112a] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: "Empresas que já estão no Mercado Livre",
                body: "Empresas que já operam no Mercado Livre costumam analisar e negociar novas condições com antecedência. Quanto antes o planejamento começa, maior é o poder de negociação e a chance de garantir contratos mais flexíveis e econômicos.",
              },
              {
                icon: Clock,
                title: "Empresas ainda no mercado regulado",
                body: "Mesmo antes da migração ser permitida, sua empresa já pode iniciar o diagnóstico, entender seu perfil de consumo e se posicionar melhor para quando a abertura do mercado acontecer.",
              },
              {
                icon: FileText,
                title: "O que realmente define o momento da migração",
                body: 'O fator decisivo não é "esperar uma data". O que define o momento ideal são as condições do seu contrato atual, o prazo de migração com a distribuidora e o planejamento correto para evitar riscos e perdas financeiras.',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-lg p-8 border border-white/10 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-6" style={{ background: "rgba(158,63,253,0.12)" }}>
                  <card.icon className="w-7 h-7 text-[#9e3ffd]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-4">{card.title}</h3>
                <p className="text-white/70 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-12">
            Cenários comuns na prática
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#9e3ffd]">
                  <th className="text-left py-4 pr-8 text-lg font-medium text-white">Situação da Empresa</th>
                  <th className="text-left py-4 text-lg font-medium text-white">O que faz sentido</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Contrato com prazo fixo", "Planejar com antecedência e estruturar a migração no momento correto"],
                  ["Contrato com possibilidade de renegociação", "Avaliar o mercado e negociar melhores condições"],
                  ["Contrato rígido", "Evitar penalidades e preparar a empresa para o vencimento"],
                  ["Empresa ainda fora do Mercado Livre", "Iniciar diagnóstico e planejamento desde já"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.06]">
                    <td className="py-4 pr-8 text-white/70">{row[0]}</td>
                    <td className="py-4 text-white/70">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-[#13112a] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-8">
              Por que começar antes gera vantagem competitiva
            </h2>
            <ul className="space-y-4">
              {[
                "Evita decisões apressadas",
                "Aumenta o poder de negociação",
                "Reduz riscos contratuais",
                "Permite estruturar economia de forma planejada",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-lg text-white/70">
                  <CheckCircle className="w-6 h-6 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Quer entender o melhor caminho para sua empresa?
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Solicite um diagnóstico gratuito. Analisamos sua conta, avaliamos sua elegibilidade e indicamos o melhor momento para migrar, agora ou quando sua empresa estiver apta.
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
    </div>
  );
}
