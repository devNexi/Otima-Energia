import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: "GD para Empresas (Geração Distribuída)",
    items: [
      {
        question: "O que é Geração Distribuída (GD)?",
        answer: "É um modelo onde sua empresa assina uma cota de energia gerada por uma usina solar, eólica ou de biogás. Você não instala equipamento nenhum. Os créditos de energia são abatidos diretamente na sua conta da concessionária, gerando descontos de 15% a 25% todo mês."
      },
      {
        question: "Preciso instalar placas solares ou qualquer equipamento?",
        answer: "Não. A usina pertence ao gerador parceiro. Você assina uma cota da energia gerada sem nenhuma obra, instalação ou investimento em equipamentos."
      },
      {
        question: "Minha empresa pode fazer GD mesmo sem ser elegível para o Mercado Livre?",
        answer: "Sim. Essa é a maior vantagem do modelo. Qualquer empresa, de qualquer porte, atendida em baixa ou média tensão, pode aderir à Geração Distribuída, desde que sua distribuidora possua usinas compartilhadas operando na região."
      },
      {
        question: "Qual a diferença entre GD e Mercado Livre (ACL)?",
        answer: "No GD, você continua cliente da sua concessionária e recebe descontos direto na fatura via créditos de usinas compartilhadas. É simples, rápido e exige consumo mínimo baixo. No Mercado Livre (ACL), você troca de fornecedor e passa a contratar energia diretamente de uma comercializadora. Exige maior consumo (a partir de ~500 kW), mas pode gerar economias de 20% a 40%. Ambos são válidos — nossa consultoria analisa qual faz mais sentido para o seu perfil."
      },
      {
        question: "O desconto do GD é garantido? E se a usina gerar menos?",
        answer: "O desconto é aplicado sobre a tarifa da concessionária — se a tarifa sobe, seu desconto em reais sobe junto. Em relação à geração, os melhores contratos possuem mecanismos de garantia (geração mínima, reposição ou compensação). Nós analisamos essas cláusulas antes de recomendar qualquer gerador."
      },
      {
        question: "Quanto tempo leva para começar a economizar com GD?",
        answer: "Entre 30 e 90 dias, dependendo da distribuidora e do gerador selecionado."
      },
      {
        question: "Eu posso migrar para o Mercado Livre depois de entrar no GD?",
        answer: "Sim. São caminhos complementares, não excludentes. Muitas empresas começam economizando via GD enquanto se preparam estrategicamente para migrar ao ACL no futuro. Nós podemos planejar essa transição com você."
      },
    ]
  },
  {
    title: "Mercado Livre de Energia (ACL)",
    items: [
      {
        question: "O que é o Mercado Livre de Energia (ACL)?",
        answer: "É o ambiente onde empresas podem escolher seu fornecedor de energia, com mais transparência e competição. Diferente do mercado regulado (cativo), onde você só pode comprar da distribuidora local, no Mercado Livre você tem poder de escolha e pode economizar significativamente."
      },
      {
        question: "Quem pode migrar para o Mercado Livre?",
        answer: "Hoje, empresas com demanda a partir de aproximadamente 500 kW já podem migrar. Com a Lei nº 15.269/2025, esse acesso será ampliado gradualmente, e empresas que ainda não são elegíveis já podem iniciar o diagnóstico e o planejamento conosco."
      },
      {
        question: "Quanto posso economizar no ACL?",
        answer: "A economia pode chegar a até 40% na conta de luz, dependendo do perfil de consumo, localização e momento de contratação. Oferecemos um diagnóstico gratuito para calcular sua economia potencial."
      },
      {
        question: "O que é a Lei nº 15.269/2025?",
        answer: "A Lei nº 15.269/2025 moderniza o setor elétrico brasileiro e inicia a abertura total do mercado livre de energia. A partir de 2026, com a regulamentação prática, mais empresas poderão migrar, e até 2028 todas as empresas terão essa opção."
      },
      {
        question: "O que acontece com a qualidade da energia?",
        answer: "A energia que chega até sua empresa é exatamente a mesma, entregue pela mesma rede de distribuição. O que muda é apenas quem você paga pela energia consumida. A distribuidora continua responsável pela entrega física e pela qualidade do fornecimento."
      },
      {
        question: "Quanto tempo demora a migração para o ACL?",
        answer: "O processo completo de migração leva em média de 60 a 180 dias, dependendo da complexidade e do ciclo de faturamento. A Ótima Energia cuida de toda a burocracia, da análise de viabilidade ao acompanhamento pós-migração."
      },
      {
        question: "Preciso fazer algum investimento inicial para migrar?",
        answer: "Na maioria dos casos, não é necessário investimento inicial. A migração para o mercado livre não requer instalação de equipamentos especiais para a maioria das empresas."
      },
      {
        question: "Quando devo começar a pensar em migrar para o Mercado Livre?",
        answer: "O ideal é começar assim que possível. Mesmo que sua empresa ainda não esteja apta a migrar, iniciar o diagnóstico com antecedência permite planejamento, melhor negociação e menos riscos no futuro."
      },
    ]
  },
  {
    title: "Gestão de Energia",
    items: [
      {
        question: "O que é a Gestão de Energia da Ótima?",
        answer: "É um acompanhamento estratégico e contínuo da sua posição energética. Monitoramos oportunidades de mercado, revisamos contratos periodicamente e agimos no momento certo — não depois de uma janela favorável ter passado."
      },
      {
        question: "Para quem é a Gestão de Energia?",
        answer: "Para empresas que já estão no Mercado Livre e querem garantir que o contrato continue competitivo; empresas com múltiplas unidades que precisam de visão consolidada; e empresas que não têm equipe interna para monitorar o mercado de energia."
      },
      {
        question: "Com que frequência a Ótima revisa meu contrato?",
        answer: "O monitoramento é contínuo via ECOS™. Revisões formais acontecem periodicamente e sempre antes de janelas críticas de renovação, garantindo que você entre no próximo período com a melhor estrutura possível."
      },
    ]
  },
  {
    title: "Otimização Energética",
    items: [
      {
        question: "O que é a Otimização Energética no Local?",
        answer: "É uma análise estruturada que identifica desperdícios na operação, revisa o perfil de consumo e a adequação tarifária, e entrega um plano concreto de redução com as ações de maior impacto priorizadas."
      },
      {
        question: "O que é 'adequação tarifária'?",
        answer: "Muitas empresas estão na modalidade tarifária errada para seu perfil de consumo. Revisamos se o enquadramento atual (verde, amarela, azul) é o mais adequado — e isso pode gerar economia imediata sem nenhuma mudança operacional."
      },
      {
        question: "Posso fazer Otimização Energética mesmo sem estar no Mercado Livre?",
        answer: "Sim. A Otimização Energética é independente do mercado em que você está. É um diagnóstico das ineficiências na operação que gera resultado independente de GD ou ACL."
      },
    ]
  },
  {
    title: "Sobre a Ótima Energia",
    items: [
      {
        question: "Quanto custa o serviço?",
        answer: "Nosso diagnóstico é gratuito. Não cobramos nada do empresário para o diagnóstico inicial. Nossa remuneração vem dos fornecedores de energia quando nossa recomendação é implementada com sucesso."
      },
      {
        question: "Como vocês ganham dinheiro?",
        answer: "Somos remunerados diretamente pelos fornecedores. Nosso modelo é alinhado aos interesses do cliente: você não paga nada pelo serviço de diagnóstico, e nós ganhamos quando nossa recomendação gera valor real."
      },
      {
        question: "O que é o ECOS™?",
        answer: "O ECOS™ é o sistema proprietário da Ótima Energia que combina IA, automação e dados de mercado para acompanhar, avaliar e otimizar contratos de energia ao longo do tempo. Ele garante que decisões só sejam tomadas quando fazem sentido financeiro, com total transparência."
      },
      {
        question: "Vocês garantem economia?",
        answer: "Não. A economia depende do perfil, do mercado e das condições de contratação. O que garantimos é um processo estruturado, transparente e tecnicamente justificado para tomar a melhor decisão possível."
      },
      {
        question: "Por que tantas empresas economizam tanto ao mudar de mercado?",
        answer: "Porque a economia vem da correção de distorções: falta de visibilidade, contratos mal estruturados e pouca comparação entre fornecedores. Quando o mercado se torna transparente, a economia aparece."
      },
    ]
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const toggleFaq = (sectionIdx: number, itemIdx: number) => {
    const key = `${sectionIdx}-${itemIdx}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h1 className="text-[3rem] lg:text-[4rem] leading-[1] font-normal tracking-tight text-[#9e3ffd] mb-6">
            Perguntas Frequentes
          </h1>
          <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed max-w-2xl">
            Tire suas dúvidas sobre GD, Mercado Livre (ACL), Gestão de Energia, Otimização Energética e como sua empresa pode começar a economizar.
          </p>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          {faqSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className={sectionIdx > 0 ? "mt-16" : ""}>
              <h2 className="text-2xl font-normal tracking-tight text-[#16163f] mb-8" data-testid={`faq-section-${sectionIdx}`}>
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.items.map((faq, itemIdx) => {
                  const key = `${sectionIdx}-${itemIdx}`;
                  return (
                    <div 
                      key={key}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(sectionIdx, itemIdx)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                        data-testid={`faq-question-${sectionIdx}-${itemIdx}`}
                      >
                        <span className="text-lg font-medium text-[#16163f] pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown 
                          className={`w-5 h-5 text-[#9e3ffd] flex-shrink-0 transition-transform ${
                            openIndex === key ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {openIndex === key && (
                        <div className="px-6 pb-6">
                          <p className="text-[#736d77] leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-[#736d77] mb-12 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudar. Faça um diagnóstico gratuito e descubra qual caminho (GD, ACL, Gestão ou Otimização) faz mais sentido para sua empresa.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="faq-cta"
          >
            Fazer Diagnóstico Gratuito
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
