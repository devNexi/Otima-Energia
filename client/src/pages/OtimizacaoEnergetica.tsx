import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function OtimizacaoEnergetica() {
  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />

      <section className="bg-[#13112a] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                Otimização Energética no Local
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-white mb-6">
                Menos desperdício.{" "}
                <span className="text-[#9e3ffd]">Mais resultado na operação.</span>
              </h1>
            </div>
            <div>
              <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-4">
                Mudar de fornecedor ou de mercado resolve uma parte do custo de energia. Mas parte significativa do que sua empresa paga está escondida na operação: em equipamentos, padrões de uso, horários de pico e ineficiências que ninguém mapeou.
              </p>
              <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-4">
                A Otimização Energética da Ótima identifica, com metodologia estruturada, onde o dinheiro está sendo desperdiçado na operação, e entrega um plano concreto para reduzir, sem comprometer a operação.
              </p>
              <p className="text-lg lg:text-xl text-white font-medium mb-8">
                Resultado real. Sem promessas vagas.
              </p>
              <Link
                href="/seja-cliente"
                className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                data-testid="otimizacao-hero-cta"
              >
                Solicitar Diagnóstico Gratuito
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-4">
            O que identificamos e o que entregamos
          </h2>
          <p className="text-lg text-white/80 mb-12 max-w-2xl">
            Nossa abordagem combina análise da fatura, perfil de consumo e, quando aplicável, levantamento das instalações, para entregar um diagnóstico acionável, não um relatório que fica na gaveta.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Mapeamento de desperdícios",
                desc: "Identificamos onde a empresa consome mais do que deveria: equipamentos ineficientes, horários de pico desnecessários, cargas desnecessárias ativas fora do expediente.",
              },
              {
                title: "Revisão do perfil de consumo",
                desc: "Analisamos a curva de carga da empresa e identificamos padrões que geram custos evitáveis, tanto na tarifa da concessionária quanto em eventuais contratos no ACL.",
              },
              {
                title: "Oportunidades de eficiência no local",
                desc: "Substituição de equipamentos, ajuste de demanda contratada, adequação tarifária, uso de automação e controle. Identificamos as ações com melhor custo-benefício.",
              },
              {
                title: "Adequação tarifária",
                desc: "Muitas empresas estão na modalidade tarifária errada. Revisamos se o enquadramento atual (verde, amarela, azul) é o mais adequado para o perfil de consumo da empresa.",
              },
              {
                title: "Plano de ação concreto",
                desc: "Ao final do diagnóstico, entregamos um plano com as oportunidades ranqueadas por impacto financeiro e complexidade de implementação. Você escolhe por onde começar.",
              },
              {
                title: "Acompanhamento da execução",
                desc: "Para quem quer ir além do diagnóstico, acompanhamos a implementação das mudanças e medimos os resultados reais ao longo do tempo.",
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/[0.18] hover:border-[#9e3ffd] hover:shadow-lg transition-all" style={{ background: "rgba(255,255,255,0.1)" }} data-testid={`otimizacao-feature-${i}`}>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/80 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#13112a] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-12">
            Quem mais se beneficia
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { segment: "Condomínios", detail: "Iluminação, bombas, elevadores, portões. Geralmente sem nenhum controle de eficiência." },
              { segment: "Hotéis e pousadas", detail: "Ar-condicionado, iluminação e aquecimento representam a maior parte do consumo. Otimização direta." },
              { segment: "Supermercados e varejos", detail: "Refrigeração, iluminação e sistemas de climatização. Alto impacto, alta oportunidade." },
              { segment: "Clínicas e hospitais", detail: "Equipamentos médicos, climatização e iluminação 24h exigem gestão cuidadosa e eficiente." },
              { segment: "Escolas e universidades", detail: "Sazonalidade de uso permite otimizações específicas por período e área da instalação." },
              { segment: "Indústrias e galpões", detail: "Motores, compressores, iluminação industrial e demanda contratada são os maiores vetores de custo." },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-6 border border-white/[0.18] hover:border-[#9e3ffd] transition-colors" style={{ background: "rgba(255,255,255,0.1)" }}>
                <h3 className="text-lg font-semibold text-white mb-2" data-testid={`otimizacao-segment-${i}`}>{item.segment}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-6">
                Otimização Energética como parte de uma estratégia maior
              </h2>
              <p className="text-lg text-white/80 leading-relaxed mb-4">
                A otimização no local é uma das frentes da Ótima. Ela complementa e frequentemente potencializa as demais estratégias:
              </p>
              <ul className="space-y-4">
                {[
                  "Antes de migrar para o ACL: reduzir o consumo pode alterar o perfil de contratação ideal",
                  "Antes de aderir ao GD: conhecer a curva de carga garante a cota certa",
                  "Combinada com Gestão de Energia: você economiza no contrato e na operação",
                  "Para múltiplas unidades: ações de eficiência podem ser replicadas em escala",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-8 lg:p-10 border border-[#9e3ffd]/20" style={{ background: "rgba(158,63,253,0.06)" }}>
              <h3 className="text-xl font-medium text-white mb-6">Por que a Ótima faz diferença aqui</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                Não somos uma empresa de eficiência energética isolada. Somos uma consultoria de inteligência energética que enxerga o custo completo de energia da sua empresa: contrato, tarifa, operação e desperdício.
              </p>
              <p className="text-white/80 leading-relaxed">
                Isso nos permite recomendar ações de otimização no local que realmente fazem sentido para o seu perfil de contrato e mercado, sem criar incoerência entre as frentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#13112a] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Descubra onde sua empresa está desperdiçando energia
          </h2>
          <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
            Inicie com um diagnóstico gratuito. Identificamos o potencial de redução no seu perfil e recomendamos o caminho mais eficiente.
          </p>
          <p className="text-base text-white/40 mb-12 max-w-xl mx-auto">
            Sem compromisso. Sem custo inicial.
          </p>
          <Link
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="otimizacao-bottom-cta"
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
