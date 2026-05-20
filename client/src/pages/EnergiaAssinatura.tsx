import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function EnergiaAssinatura() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <p className="text-sm text-[#9e3ffd] font-medium uppercase tracking-wide mb-4">
                Energia por Assinatura (GDL)
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#16163f] mb-6">
                Desconto de até 25% na sua conta de luz.{" "}
                <span className="text-[#9e3ffd]">Sem investir em placas solares.</span>
              </h1>
            </div>
            <div>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                Sua empresa ainda está no mercado cativo (concessionária) e sente o peso da conta de luz todo mês?
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                Migrar para o Mercado Livre não é viável agora? Você ainda pode economizar, e muito.
              </p>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mb-4">
                A Geração Distribuída Compartilhada (GDL), mais conhecida como <strong className="text-[#16163f]">energia por assinatura</strong>, permite que sua empresa receba descontos diretos na fatura da concessionária participando de uma usina solar, eólica ou de biogás da sua região.
              </p>
              <p className="text-lg lg:text-xl text-[#16163f] font-medium mb-8">
                Sem obras. Sem placas no telhado. Sem burocracia.
              </p>
              <p className="text-lg text-[#736d77] leading-relaxed mb-8">
                Nós analisamos se você é elegível, conectamos sua empresa ao gerador certo e gerenciamos toda a compensação de créditos. Você só vê o desconto na conta.
              </p>
              <Link 
                href="/diagnostico"
                className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                data-testid="gdl-hero-cta"
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
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-16">
            Como funciona a energia por assinatura?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Uma usina gera energia limpa", desc: "Uma fazenda solar, eólica ou biogás injeta energia na rede da sua distribuidora." },
              { step: "02", title: "Você assina uma cota dessa usina", desc: "Você não compra nem instala equipamento nenhum. Você apenas assina uma fração da energia gerada." },
              { step: "03", title: "Os créditos abatem sua conta", desc: "A energia gerada vira créditos que a distribuidora abate diretamente na sua fatura. Você paga menos à concessionária." },
              { step: "04", title: "Você economiza todo mês", desc: "Os descontos variam entre 15% e 25% sobre o valor da sua conta de energia, dependendo da região e do gerador." },
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="mb-4">
                  <span className="text-5xl font-light text-[#c88ff5]">{item.step}</span>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3" data-testid={`gdl-step-${i}`}>
                  {item.title}
                </h3>
                <p className="text-[#736d77] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-4">
            Quem pode aderir?
          </h2>
          <p className="text-lg text-[#736d77] leading-relaxed mb-4">
            Qualquer empresa atendida em:
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
              <span className="text-[#736d77] text-lg"><strong className="text-[#16163f]">Baixa tensão</strong> (comércios, lojas, pequenas indústrias)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#9e3ffd] mt-1 font-bold">•</span>
              <span className="text-[#736d77] text-lg"><strong className="text-[#16163f]">Média tensão</strong> (indústrias, grandes comércios, hospitais, shoppings)</span>
            </li>
          </ul>
          <p className="text-lg text-[#736d77] leading-relaxed mb-4">
            A energia por assinatura já está disponível em diversas distribuidoras pelo país. Atuamos com os principais geradores e comercializadores do mercado, e nossa análise considera todos os players qualificados, não apenas um.
          </p>
          <p className="text-lg text-[#736d77] leading-relaxed mb-8">
            Atendemos empresas em todas as regiões onde o modelo já está regulamentado. Se sua distribuidora ainda não opera com GDL, podemos avisar quando houver novidades.
          </p>
          <Link 
            href="/diagnostico"
            className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
            data-testid="gdl-check-availability"
          >
            Verificar disponibilidade para minha empresa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-12">
            Por que fazer GDL com a Ótima Energia?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:border-[#9e3ffd] hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-[#16163f] mb-3">Não somos vendedores de usina</h3>
              <p className="text-[#736d77] leading-relaxed">
                Não temos "nosso" próprio parque gerador para empurrar. Somos consultores independentes.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-[#9e3ffd] hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-[#16163f] mb-3">Analisamos o melhor gerador para o seu caso</h3>
              <p className="text-[#736d77] leading-relaxed">
                Nem toda usina entrega o mesmo desconto, contrato ou segurança. Comparamos as condições reais dos principais players do mercado, e só recomendamos os mais sólidos e confiáveis.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-[#9e3ffd] hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-[#16163f] mb-3">Cuidamos de toda a burocracia</h3>
              <p className="text-[#736d77] leading-relaxed">
                Contrato, análise de crédito, registro de consórcio, acompanhamento mensal dos créditos. Você não precisa se preocupar com nada.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-[#9e3ffd] hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-[#16163f] mb-3">Reavaliamos sua posição todo ano</h3>
              <p className="text-[#736d77] leading-relaxed">
                O GDL é vantajoso hoje. Pode ser mais vantajoso trocar de usina amanhã. Ou migrar para o Mercado Livre depois. Nosso ECOS™ monitora isso para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-12">
            GDL vs. Mercado Livre: qual escolher?
          </h2>
          <div className="bg-white rounded-lg overflow-x-auto mb-8">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[#16163f] text-white">
                  <th className="text-left px-6 py-3 font-medium"></th>
                  <th className="text-left px-6 py-3 font-medium">GDL (Energia por Assinatura)</th>
                  <th className="text-left px-6 py-3 font-medium">Mercado Livre (ACL)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Elegibilidade", "Qualquer empresa, qualquer consumo", "A partir de ~500 kW (limite em redução)"],
                  ["Fornecedor", "Continua sendo a concessionária", "Você escolhe uma comercializadora"],
                  ["Investimento", "Zero", "Zero"],
                  ["Obra/instalação", "Zero", "Zero"],
                  ["Desconto médio", "15% a 25%", "20% a 30%"],
                  ["Complexidade", "Baixa", "Média/Alta"],
                  ["Prazo contratual", "12 a 60 meses", "12 a 60 meses"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 font-medium text-[#16163f]">{row[0]}</td>
                    <td className="px-6 py-3 text-[#736d77]">{row[1]}</td>
                    <td className="px-6 py-3 text-[#736d77]">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#9e3ffd] mb-4">GDL é o melhor caminho para empresas que:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Querem economia imediata e simples</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Não estão prontas (ou não querem) migrar para o ACL</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Têm consumo moderado ou estão em regiões sem oferta competitiva no ACL</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#16163f] mb-4">Mercado Livre é o melhor caminho para empresas que:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#16163f] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Têm alto consumo (&gt; 500 kW)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#16163f] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Buscam máxima previsibilidade e contratos personalizados</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#16163f] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Querem negociar energia renovável certificada em larga escala</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link 
              href="/diagnostico"
              className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
              data-testid="gdl-help-decide"
            >
              Ajuda gratuita para decidir
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-12">
            O que nossos clientes economizam?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#eee7f1] p-8 rounded-xl">
              <p className="text-lg text-[#16163f] italic leading-relaxed mb-4">
                "Reduzimos nossa conta de luz em 18% com energia por assinatura. Processo simples, rápido e sem instalar nada no nosso telhado."
              </p>
              <p className="text-[#736d77] font-medium">, Rede de supermercados, Interior de SP</p>
            </div>
            <div className="bg-[#eee7f1] p-8 rounded-xl">
              <p className="text-lg text-[#16163f] italic leading-relaxed mb-4">
                "A Ótima nos apresentou o GDL como alternativa enquanto não migramos para o Mercado Livre. Já estamos economizando há 8 meses."
              </p>
              <p className="text-[#736d77] font-medium">, Indústria alimentícia, Contagem/MG</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-12">
            Perguntas frequentes
          </h2>
          <div className="space-y-6 max-w-3xl">
            {[
              { q: "Preciso instalar placas solares?", a: "Não. Você não instala, não compra, não mantém equipamento nenhum. A usina é de terceiros." },
              { q: "O que acontece se a usina gerar menos energia?", a: "A maioria dos contratos possui mecanismos de garantia (geração mínima, reposição ou compensação). Nós analisamos essas cláusulas antes de recomendar qualquer gerador." },
              { q: "Posso fazer GDL e depois migrar para o Mercado Livre?", a: "Sim. São caminhos complementares. Podemos planejar sua entrada futura no ACL enquanto você já economiza via GDL." },
              { q: "O desconto é garantido?", a: "O desconto é aplicado sobre a tarifa da concessionária. Se a tarifa sobe, seu desconto em reais sobe junto. É uma economia proporcional e duradoura." },
              { q: "Quanto tempo leva para começar a economizar?", a: "Entre 30 e 60 dias, dependendo da distribuidora e do gerador escolhido." },
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-[#16163f] mb-2" data-testid={`gdl-faq-${i}`}>{faq.q}</h3>
                <p className="text-[#736d77] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Pronto para reduzir sua conta de luz?
          </h2>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Faça uma simulação gratuita.
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Em até 3 dias úteis, você recebe uma análise completa com: potencial de desconto para sua empresa, geradores disponíveis na sua região, comparação com o Mercado Livre (se aplicável) e minuta contratual para avaliação.
          </p>
          <Link 
            href="/diagnostico"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="gdl-bottom-cta"
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
