import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-medium text-[#9e3ffd] uppercase tracking-wider mb-6">
              Clareza em um mercado cheio de ruído.
            </p>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed">
              A Ótima Energia é uma consultoria independente especializada em guiar empresas brasileiras para a melhor decisão energética — seja via Geração Distribuída (GD), no Mercado Livre (ACL), na gestão contínua de contratos ou na otimização no local.
            </p>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mt-6">
              Atuamos como parceiros de longo prazo, com um compromisso inegociável: neutralidade. Não vendemos um único produto, nem representamos um único fornecedor. Comparamos o máximo possível do mercado, analisamos todas as opções com dados reais e recomendamos o caminho que entrega mais economia para o seu perfil.
            </p>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed mt-6">
              Nosso serviço de diagnóstico é gratuito. Somos remunerados apenas quando nossa recomendação gera valor real para o cliente, e sempre com total transparência sobre como e por quem somos pagos.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <div>
              <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
                Estamos com pressa.
              </h2>
              <div className="space-y-6 text-lg text-[#736d77] leading-relaxed">
                <p>
                  A Lei nº 15.269/2025 abre o mercado livre de energia para 80 milhões de consumidores nos próximos 36 meses. É a maior transformação do setor elétrico brasileiro desde sua privatização.
                </p>
                <p>
                  Mas o ACL não é a única resposta. Milhões de empresas continuarão no mercado regulado, e muitas vão economizar mais — e mais rápido — através da Geração Distribuída (GD) ou da otimização de contratos com a concessionária.
                </p>
                <p>
                  Nossa missão é garantir que nenhuma empresa pague mais do que deveria, independentemente do mercado em que está hoje ou estará amanhã.
                </p>
                <p className="font-medium text-[#16163f]">
                  Queremos estar na linha de frente dessa revolução, como guias, não como vendedores.
                </p>
              </div>
            </div>
            <div className="flex items-start lg:justify-end">
              <Link 
                href="/solucoes"
                className="inline-flex items-center gap-3 text-sm font-normal tracking-wide uppercase group"
              >
                <span className="w-10 h-10 bg-[#9e3ffd] group-hover:bg-[#df0af2] flex items-center justify-center text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                  EXPLORAR SOLUÇÕES
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-12">
              Acreditamos em transparência radical.
            </h2>
            <div className="space-y-6 text-lg text-[#736d77] leading-relaxed">
              <p>
                O setor elétrico brasileiro movimenta mais de R$100 bilhões por ano, mas continua fragmentado e opaco. Fornecedores, distribuidoras, comercializadoras e usinas operam com informações assimétricas, deixando empresas pagando mais do que deveriam, em qualquer mercado.
              </p>
              <p>
                Acreditamos que <span className="font-medium text-[#9e3ffd]">tecnologia e dados</span> podem nivelar esse campo — não apenas no ACL, mas no GD e na gestão de contratos também.
              </p>
              <p>
                Nossa plataforma, o <span className="font-medium text-[#9e3ffd]">ECOS™</span>, analisa consumo, tarifas, contratos e ofertas de forma unificada. Ele não tem viés. Ele não empurra produto. Ele identifica a rota de maior economia, seja ela:
              </p>
              <ul className="space-y-3 ml-1">
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <span>Geração Distribuída (GD) — descontos de 15% a 25% sem instalação</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <span>Migração para o Mercado Livre (ACL) — economia de 20% a 40%</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <span>Gestão de Energia — acompanhamento estratégico e contínuo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <span>Otimização no local — redução de desperdícios na operação</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mb-16">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
              Não somos apenas uma corretora.
            </h2>
            <p className="text-lg text-[#736d77] leading-relaxed">
              A Ótima Energia opera como uma consultoria independente de inteligência energética.
            </p>
            <p className="text-lg text-[#736d77] leading-relaxed mt-4">
              Enquanto o mercado permanece opaco, manual e cheio de intermediários empurrando soluções únicas, nós usamos dados, automação e independência para proteger empresas e garantir decisões melhores — na migração, na renovação, na gestão do dia a dia.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 lg:gap-16">
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                40%
              </div>
              <p className="text-[#736d77]">
                Economia potencial na conta de luz*
              </p>
            </div>
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                R$100B+
              </div>
              <p className="text-[#736d77]">
                Volume anual do setor elétrico
              </p>
            </div>
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                80M
              </div>
              <p className="text-[#736d77]">
                Consumidores elegíveis até 2028
              </p>
            </div>
            <div>
              <div className="text-5xl lg:text-6xl font-light text-[#9e3ffd] mb-4">
                R$0
              </div>
              <p className="text-[#736d77]">
                Custo do diagnóstico gratuito
              </p>
            </div>
          </div>
          <p className="text-sm text-[#736d77] mt-8">
            *Resultados variam conforme perfil, região, mercado e condições de contratação.
          </p>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-16">
            Por que a Ótima Energia?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Independência</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Independência
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Não temos vínculo com nenhuma comercializadora, geradora ou usina. Nossa única lealdade é com o cliente.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Expertise</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Expertise
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Fundada por especialistas com experiência internacional no setor de energia. Trouxemos as melhores práticas globais para o mercado brasileiro, e as adaptamos à nossa realidade.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Tecnologia</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Tecnologia
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                O ECOS™ analisa consumo, compara ofertas e simula cenários em todas as frentes com IA e automação. Decisão boa é decisão com dados.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#9e3ffd] transition-colors">
              <p className="text-sm tracking-wide text-[#df0af2] uppercase mb-4">Resultados</p>
              <h3 className="text-xl font-medium text-[#16163f] mb-4">
                Resultados
              </h3>
              <p className="text-[#736d77] leading-relaxed">
                Nossos clientes economizam. Cuidamos de toda a burocracia, do diagnóstico à ativação, em qualquer frente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Pronto para descobrir o melhor caminho para sua empresa?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Faça um diagnóstico gratuito. Em até 5 dias úteis você recebe uma análise completa.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="about-cta"
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
