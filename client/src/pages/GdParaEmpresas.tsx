import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function GdParaEmpresas() {
  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />

      <section className="bg-[#13112a] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                GD para Empresas
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-white mb-6">
                Desconto de até 25% na sua conta de luz.{" "}
                <span className="text-[#9e3ffd]">Sem instalar nada.</span>
              </h1>
            </div>
            <div>
              <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-4">
                Sua empresa paga uma conta de energia relevante todo mês, mas ainda não migrou para o Mercado Livre?
              </p>
              <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-4">
                A Geração Distribuída (GD) permite que sua empresa receba descontos diretos na fatura da concessionária, participando de uma usina solar, eólica ou de biogás da sua região.
              </p>
              <p className="text-lg lg:text-xl text-white font-medium mb-4">
                Sem obras. Sem equipamentos. Sem burocracia para você.
              </p>
              <p className="text-lg text-white/80 leading-relaxed mb-8">
                A Ótima analisa sua elegibilidade, compara os geradores disponíveis na sua região com independência total e cuida de toda a implementação. Você só vê o desconto na conta.
              </p>
              <Link
                href="/seja-cliente"
                className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                data-testid="gd-hero-cta"
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
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-16">
            Como funciona a GD?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Uma usina gera energia limpa", desc: "Uma fazenda solar, eólica ou biogás injeta energia na rede da sua distribuidora." },
              { step: "02", title: "Você assina uma cota da usina", desc: "Nenhuma instalação, nenhuma compra de equipamento. Você assina uma fração da energia gerada." },
              { step: "03", title: "Os créditos abatem sua conta", desc: "A energia gerada vira créditos que a distribuidora desconta diretamente na sua fatura mensal." },
              { step: "04", title: "Você economiza todo mês", desc: "Os descontos variam entre 15% e 25% sobre o valor da conta, dependendo da região e do gerador." },
            ].map((item, i) => (
              <div key={i}>
                <div className="mb-4">
                  <span className="text-5xl font-light text-[#9e3ffd]/50">{item.step}</span>
                </div>
                <h3 className="text-xl font-medium text-white mb-3" data-testid={`gd-step-${i}`}>
                  {item.title}
                </h3>
                <p className="text-white/80 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#13112a] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-4">
            Quem pode aderir?
          </h2>
          <p className="text-lg text-white/80 leading-relaxed mb-6">
            A GD está disponível para empresas atendidas em:
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
              <span className="text-white/80 text-lg"><strong className="text-white">Baixa tensão</strong>: comércios, lojas, escolas, clínicas, pequenas indústrias</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
              <span className="text-white/80 text-lg"><strong className="text-white">Média tensão</strong>: indústrias, hospitais, shoppings, condomínios, hotéis</span>
            </li>
          </ul>
          <p className="text-lg text-white/80 leading-relaxed mb-4">
            A Ótima trabalha com os principais geradores e comercializadoras do mercado nacional. Nossa análise considera todos os players qualificados, com capacidade financeira e histórico comprovado, não apenas um parceiro exclusivo.
          </p>
          <p className="text-lg text-white/80 leading-relaxed mb-8">
            Se sua distribuidora ainda não opera com GD, avisamos quando surgir disponibilidade na sua região.
          </p>
          <Link
            href="/seja-cliente"
            className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
            data-testid="gd-check-availability"
          >
            Verificar disponibilidade para minha empresa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="bg-[#09081e] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-12">
            Por que fazer GD com a Ótima Energia?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Não somos vendedores de usina", body: "Não temos parque gerador próprio para empurrar. Somos consultores independentes. Recomendamos apenas o que faz sentido para o seu perfil." },
              { title: "Trabalhamos com players sérios e confiáveis", body: "Comparamos as condições reais dos principais geradores nacionais. Só recomendamos empresas com sólido histórico operacional, capacidade financeira e contratos transparentes." },
              { title: "Cuidamos de toda a burocracia", body: "Contrato, análise de crédito, registro, acompanhamento mensal dos créditos. Você não precisa se preocupar com nenhum detalhe operacional." },
              { title: "Visão de longo prazo com o ECOS™", body: "A GD é vantajosa hoje. Pode ser mais vantajoso mudar de gerador ou migrar para o Mercado Livre amanhã. O ECOS™ monitora isso continuamente para você." },
            ].map((card, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/[0.18] hover:border-[#9e3ffd] hover:shadow-lg transition-all" style={{ background: "rgba(255,255,255,0.1)" }}>
                <h3 className="text-lg font-semibold text-white mb-3">{card.title}</h3>
                <p className="text-white/80 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#13112a] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-12">
            GD vs. Mercado Livre (ACL): qual escolher?
          </h2>
          <div className="rounded-lg overflow-x-auto mb-8 border border-white/[0.18]">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ background: "rgba(158,63,253,0.15)", borderBottom: "1px solid rgba(158,63,253,0.3)" }}>
                  <th className="text-left px-6 py-3 font-medium text-white/60"></th>
                  <th className="text-left px-6 py-3 font-medium text-white">GD (Geração Distribuída)</th>
                  <th className="text-left px-6 py-3 font-medium text-white">ACL (Mercado Livre)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Elegibilidade", "Qualquer empresa, qualquer consumo", "A partir de ~500 kW"],
                  ["Investimento", "Zero", "Zero"],
                  ["Instalação", "Nenhuma", "Nenhuma"],
                  ["Desconto médio", "15% a 25%", "20% a 30%"],
                  ["Complexidade", "Baixa", "Média/Alta"],
                  ["Prazo contratual", "12 a 60 meses", "12 a 60 meses"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.05]" style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.1)" }}>
                    <td className="px-6 py-3 font-medium text-white">{row[0]}</td>
                    <td className="px-6 py-3 text-white/80">{row[1]}</td>
                    <td className="px-6 py-3 text-white/80">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl border border-[#9e3ffd]/30" style={{ background: "rgba(158,63,253,0.07)" }}>
              <h3 className="text-lg font-semibold text-[#9e3ffd] mb-4">GD é o melhor caminho para empresas que:</h3>
              <ul className="space-y-3">
                {[
                  "Querem economia imediata e simples",
                  "Não estão prontas ou não querem migrar para o ACL",
                  "Têm consumo moderado ou região sem oferta ACL competitiva",
                  "Preferem manter o relacionamento com a concessionária",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.18]" style={{ background: "rgba(255,255,255,0.1)" }}>
              <h3 className="text-lg font-semibold text-white mb-4">Mercado Livre é o melhor caminho para empresas que:</h3>
              <ul className="space-y-3">
                {[
                  "Têm consumo elevado (demanda acima de ~500 kW)",
                  "Buscam maior previsibilidade e contratos personalizados",
                  "Querem negociar energia renovável certificada",
                  "Têm apetite para gestão estratégica de contratos",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm text-white/40 mt-6">
            Não tem certeza qual caminho é o certo? O diagnóstico gratuito da Ótima analisa seu perfil e responde isso com clareza.
          </p>
        </div>
      </section>

      <section className="bg-[#09081e] py-16 lg:py-20 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-12">
            Perguntas frequentes
          </h2>
          <div className="space-y-6 max-w-3xl">
            {[
              { q: "Preciso instalar placas solares?", a: "Não. Você não instala, não compra e não mantém equipamento nenhum. A usina pertence ao gerador parceiro." },
              { q: "E se a usina gerar menos energia do que o esperado?", a: "Os melhores contratos possuem mecanismos de garantia: geração mínima, reposição ou compensação financeira. A Ótima analisa essas cláusulas antes de recomendar qualquer gerador." },
              { q: "Posso fazer GD e depois migrar para o Mercado Livre?", a: "Sim. São caminhos complementares. Muitas empresas economizam via GD enquanto se preparam estrategicamente para o ACL. Planejamos essa transição com você." },
              { q: "O desconto é fixo ou varia?", a: "O desconto é percentual sobre a tarifa da concessionária. Se a tarifa sobe, seu desconto em reais sobe junto. É uma economia proporcional e duradoura." },
              { q: "Quanto tempo leva para começar a economizar?", a: "Entre 30 e 90 dias, dependendo da distribuidora e do gerador selecionado." },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/[0.18]" style={{ background: "rgba(255,255,255,0.1)" }}>
                <h3 className="text-lg font-semibold text-white mb-2" data-testid={`gd-faq-${i}`}>{faq.q}</h3>
                <p className="text-white/80 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#13112a] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Pronto para reduzir sua conta de energia?
          </h2>
          <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
            Faça um diagnóstico gratuito. Em até 5 dias úteis, você recebe uma análise completa com o potencial de desconto para sua empresa.
          </p>
          <p className="text-base text-white/40 mb-12 max-w-xl mx-auto">
            Sem compromisso. Sem instalação. Sem custo.
          </p>
          <Link
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="gd-bottom-cta"
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
