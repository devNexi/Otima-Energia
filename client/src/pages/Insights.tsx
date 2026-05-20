import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

const articles: Article[] = [
  {
    id: "impactos-lei-15269",
    title: "Impactos da Lei nº 15.269/2025 para empresas",
    excerpt: "Entenda como a nova legislação vai transformar o mercado livre de energia e o que sua empresa precisa saber para se preparar.",
    date: "2025-01-15",
    category: "Legislação",
    readTime: "5 min",
  },
  {
    id: "gd-vs-acl",
    title: "GD ou ACL? Como escolher o caminho certo para a sua empresa",
    excerpt: "Geração Distribuída e Mercado Livre têm perfis diferentes. Entenda quando cada um faz sentido e por que a decisão depende do seu consumo.",
    date: "2025-02-10",
    category: "Estratégia",
    readTime: "6 min",
  },
  {
    id: "gestao-energia-continua",
    title: "Por que a economia de energia não acontece só na hora de contratar",
    excerpt: "A maioria das empresas pensa na energia uma vez e esquece. Veja como a gestão contínua pode garantir economia ao longo de todo o contrato.",
    date: "2025-03-05",
    category: "Gestão",
    readTime: "4 min",
  },
  {
    id: "reduzir-custos-energia",
    title: "Como reduzir custos de energia de forma estratégica",
    excerpt: "Descubra as principais estratégias para otimizar o consumo de energia e maximizar a economia da sua empresa.",
    date: "2025-01-10",
    category: "Economia",
    readTime: "4 min",
  },
  {
    id: "adequacao-tarifaria",
    title: "Adequação tarifária: como mudar de modalidade pode gerar economia imediata",
    excerpt: "Muitas empresas estão enquadradas na modalidade tarifária errada. Entenda como verificar e o que fazer.",
    date: "2025-04-08",
    category: "Otimização",
    readTime: "5 min",
  },
  {
    id: "sustentabilidade-energia-renovavel",
    title: "Sustentabilidade e energia renovável no Brasil",
    excerpt: "O papel da energia renovável na estratégia de sustentabilidade das empresas brasileiras e os benefícios além da economia.",
    date: "2025-01-05",
    category: "Sustentabilidade",
    readTime: "6 min",
  },
];

const categoryColors: Record<string, string> = {
  "Legislação": "bg-blue-100 text-blue-700",
  "Estratégia": "bg-purple-100 text-purple-700",
  "Gestão": "bg-green-100 text-green-700",
  "Economia": "bg-yellow-100 text-yellow-700",
  "Otimização": "bg-orange-100 text-orange-700",
  "Sustentabilidade": "bg-emerald-100 text-emerald-700",
};

export default function Insights() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd] mb-6">
              Insights
            </h1>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed">
              Artigos educativos sobre GD, Mercado Livre, Gestão de Energia e Otimização — para ajudar sua empresa a tomar decisões melhores sobre energia.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300 flex flex-col"
                data-testid={`article-${article.id}`}
              >
                <div className="bg-[#eee7f1] h-48 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-[#9e3ffd]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-[#9e3ffd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryColors[article.category] || "bg-gray-100 text-gray-700"}`}>
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(article.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span>{article.readTime} de leitura</span>
                  </div>

                  <h2 className="text-xl font-medium text-[#16163f] mb-3 group-hover:text-[#9e3ffd] transition-colors">
                    {article.title}
                  </h2>

                  <p className="text-[#736d77] leading-relaxed mb-6 flex-grow">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center gap-2 text-[#9e3ffd] font-medium text-sm">
                    <span>Em breve</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Quer saber o que é certo para a sua empresa?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Diagnóstico gratuito. Em até 5 dias úteis você recebe uma análise completa com recomendações claras para o seu perfil.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="insights-cta"
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
