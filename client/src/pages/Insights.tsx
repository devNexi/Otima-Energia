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
    id: "reduzir-custos-energia",
    title: "Como reduzir custos de energia de forma estratégica",
    excerpt: "Descubra as principais estratégias para otimizar o consumo de energia e maximizar a economia da sua empresa.",
    date: "2025-01-10",
    category: "Economia",
    readTime: "4 min",
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

export default function Insights() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd] mb-6">
              Insights
            </h1>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed">
              Artigos educativos sobre o mercado livre de energia, legislação, economia e sustentabilidade para ajudar sua empresa a tomar decisões informadas.
            </p>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Coming Soon Note */}
          <div className="mt-16 text-center">
            <p className="text-[#736d77] text-lg">
              Mais artigos em breve. Assine nossa newsletter para receber as novidades.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#16163f] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6">
            Quer saber mais sobre o mercado livre de energia?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Nosso serviço de comparação é gratuito. Faça um diagnóstico e descubra o potencial de economia da sua empresa.
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

function ArticleCard({ article }: { article: Article }) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300 group"
      data-testid={`article-card-${article.id}`}
    >
      {/* Category Header */}
      <div className="bg-[#eee7f1] p-4">
        <span className="text-sm tracking-wide text-[#9e3ffd] uppercase font-medium">
          {article.category}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-medium text-[#16163f] group-hover:text-[#9e3ffd] transition-colors mb-3">
          {article.title}
        </h3>
        <p className="text-[#736d77] leading-relaxed mb-4">
          {article.excerpt}
        </p>
        
        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-[#736d77]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(article.date).toLocaleDateString('pt-BR')}</span>
          </div>
          <span>{article.readTime} de leitura</span>
        </div>
      </div>
    </div>
  );
}
