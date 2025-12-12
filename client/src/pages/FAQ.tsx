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
    question: "O que é o Mercado Livre de Energia?",
    answer: "O Mercado Livre de Energia, também chamado de Ambiente de Contratação Livre (ACL), é um ambiente onde consumidores podem escolher livremente seu fornecedor de energia elétrica, negociando preços, prazos e condições diretamente. Diferente do mercado cativo (regulado), onde você só pode comprar da distribuidora local, no mercado livre você tem poder de escolha e pode economizar significativamente."
  },
  {
    question: "Quem pode migrar para o Mercado Livre?",
    answer: "Atualmente, podem migrar para o mercado livre: empresas com demanda contratada igual ou superior a 500kW; consumidores especiais (entre 500kW e 1.500kW) que comprem energia de fontes incentivadas; e, a partir da Lei 15.269/2025, todos os consumidores poderão migrar gradualmente até 2028. Como regra prática, empresas com conta de luz acima de R$8.000/mês geralmente são elegíveis."
  },
  {
    question: "Quanto posso economizar no Mercado Livre?",
    answer: "A economia média varia entre 20% e 35% na conta de luz, dependendo do perfil de consumo, localização e momento de contratação. Alguns clientes conseguem economias ainda maiores, especialmente em contratos de longo prazo ou com fontes renováveis incentivadas. Oferecemos um diagnóstico gratuito para calcular sua economia potencial."
  },
  {
    question: "O que é UC (Unidade Consumidora)?",
    answer: "UC é o código único que identifica cada ponto de consumo de energia elétrica. Cada estabelecimento (fábrica, loja, escritório) possui uma UC própria, que aparece na sua conta de luz. Esse código é essencial para análise do seu consumo e migração para o mercado livre."
  },
  {
    question: "Quanto tempo demora a migração?",
    answer: "O processo completo de migração leva em média de 60 a 180 dias, dependendo da complexidade e do ciclo de faturamento. A Ótima Energia cuida de toda a burocracia: análise de viabilidade, negociação com fornecedores, documentação para a CCEE (Câmara de Comercialização de Energia Elétrica) e acompanhamento pós-migração."
  },
  {
    question: "Preciso fazer algum investimento inicial?",
    answer: "Na maioria dos casos, não é necessário investimento inicial. A migração para o mercado livre não requer instalação de equipamentos especiais para a maioria das empresas. Nossa consultoria trabalha com um modelo de sucesso: você só paga quando começar a economizar."
  },
  {
    question: "O que acontece se eu consumir mais ou menos que o contratado?",
    answer: "No mercado livre, você contrata um volume de energia baseado no seu histórico de consumo. Se consumir mais, pode comprar energia adicional no mercado de curto prazo (spot). Se consumir menos, dependendo do contrato, pode haver flexibilidade ou a energia excedente pode ser negociada. Nossa gestão contínua ajuda a otimizar esses cenários."
  },
  {
    question: "A qualidade da energia muda no Mercado Livre?",
    answer: "Não. A energia que chega até sua empresa é exatamente a mesma, entregue pela mesma rede de distribuição. O que muda é apenas quem você paga pela energia consumida. A distribuidora continua responsável pela entrega física e pela qualidade do fornecimento."
  },
  {
    question: "Posso voltar para o mercado regulado?",
    answer: "Sim, é possível retornar ao mercado regulado (cativo), mas existe um prazo de aviso prévio de 5 anos para consumidores livres convencionais. Consumidores especiais têm prazo de 180 dias. Por isso, é importante fazer uma análise cuidadosa antes de migrar – algo que fazemos gratuitamente para você."
  },
  {
    question: "O que é energia incentivada?",
    answer: "Energia incentivada é aquela gerada por fontes renováveis como solar, eólica, biomassa e pequenas centrais hidrelétricas (PCHs). Ela recebe descontos nas tarifas de uso do sistema de transmissão (TUST) e distribuição (TUSD), que podem chegar a 50% ou 100%, tornando-a ainda mais vantajosa economicamente além dos benefícios ambientais."
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
