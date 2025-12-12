import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "O que é o mercado livre de energia?",
    answer: "É o ambiente onde empresas podem escolher seu fornecedor de energia, com mais transparência e competição. Diferente do mercado regulado (cativo), onde você só pode comprar da distribuidora local, no mercado livre você tem poder de escolha e pode economizar significativamente."
  },
  {
    question: "Quanto custa o serviço?",
    answer: "Nosso serviço de comparação é gratuito. Não cobramos do empresário. Realizamos auditorias energéticas sem custo e sem qualquer obrigação para você."
  },
  {
    question: "Como vocês ganham dinheiro?",
    answer: "Somos remunerados diretamente pelos fornecedores. Nosso modelo é alinhado aos interesses do cliente: você não paga nada pelo serviço de comparação, e nós ganhamos uma comissão do fornecedor escolhido."
  },
  {
    question: "Quem pode participar?",
    answer: "Empresas elegíveis hoje incluem aquelas com demanda a partir de aproximadamente 500 kW e contas acima de R$8.000/mês. Com a Lei nº 15.269/2025, o mercado está se abrindo gradualmente para todas as empresas até 2028."
  },
  {
    question: "Quanto posso economizar?",
    answer: "A economia pode chegar a até 40% na conta de luz, dependendo do perfil de consumo, localização e momento de contratação. Oferecemos um diagnóstico gratuito impulsionado por IA para calcular sua economia potencial."
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
    question: "Quanto tempo demora a migração?",
    answer: "O processo completo de migração leva em média de 60 a 180 dias, dependendo da complexidade e do ciclo de faturamento. A Ótima Energia cuida de toda a burocracia, da análise de viabilidade ao acompanhamento pós-migração."
  },
  {
    question: "Preciso fazer algum investimento inicial?",
    answer: "Na maioria dos casos, não é necessário investimento inicial. A migração para o mercado livre não requer instalação de equipamentos especiais para a maioria das empresas."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h1 className="text-[3rem] lg:text-[4rem] leading-[1] font-normal tracking-tight text-[#9e3ffd] mb-6">
            Perguntas Frequentes
          </h1>
          <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed max-w-2xl">
            Tire suas dúvidas sobre o mercado livre de energia e como sua empresa pode começar a economizar.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  data-testid={`faq-question-${index}`}
                >
                  <span className="text-lg font-medium text-[#16163f] pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-[#9e3ffd] flex-shrink-0 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-[#736d77] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-[#736d77] mb-12 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudar. Faça um diagnóstico gratuito e descubra se sua empresa pode migrar para o mercado livre.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
          >
            Fazer Diagnóstico Gratuito
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
