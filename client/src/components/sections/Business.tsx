import { motion } from "framer-motion";
import { Check, Building2, Factory, ArrowRight } from "lucide-react";

const solutions = [
  {
    icon: Building2,
    title: "Pequenas e Médias Empresas",
    description: "Economia garantida sem investimento inicial. Migração simplificada.",
    benefits: [
      "Economia garantida sem investimento inicial",
      "Migração simplificada (Modelo Varejista)",
      "Gestão unificada em uma única fatura",
      "Proteção contra bandeiras tarifárias"
    ],
    highlight: "Ideal para empresas com consumo a partir de 500kWh/mês",
    color: "purple"
  },
  {
    icon: Factory,
    title: "Grandes Indústrias",
    description: "Acesso direto ao mercado atacadista com estratégias personalizadas.",
    benefits: [
      "Acesso direto ao mercado atacadista",
      "Estratégias personalizadas de compra",
      "Relatórios de inteligência de mercado",
      "Gestão de risco e conformidade"
    ],
    highlight: "Para consumidores com demanda acima de 500kW",
    color: "pink"
  }
];

export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="business" className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-purple-600 font-semibold mb-4">Para Empresas</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Soluções sob medida para{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                o seu negócio
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Seja você uma pequena empresa ou uma grande indústria, temos a solução ideal para reduzir seus custos energéticos.
            </p>
          </motion.div>
        </div>

        {/* Solutions Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-2xl p-8 lg:p-10 h-full shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-100">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${solution.color === 'purple' ? 'bg-purple-100' : 'bg-pink-100'} flex items-center justify-center mb-6`}>
                  <solution.icon className={`w-8 h-8 ${solution.color === 'purple' ? 'text-purple-600' : 'text-pink-600'}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                <p className="text-gray-600 mb-6">{solution.description}</p>
                
                {/* Benefits */}
                <ul className="space-y-4 mb-8">
                  {solution.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full ${solution.color === 'purple' ? 'bg-purple-100' : 'bg-pink-100'} flex items-center justify-center mt-0.5 flex-shrink-0`}>
                        <Check className={`w-3 h-3 ${solution.color === 'purple' ? 'text-purple-600' : 'text-pink-600'}`} />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Highlight */}
                <div className={`text-sm ${solution.color === 'purple' ? 'text-purple-600 bg-purple-50' : 'text-pink-600 bg-pink-50'} px-4 py-2 rounded-lg inline-block mb-6`}>
                  {solution.highlight}
                </div>
                
                {/* CTA */}
                <button 
                  onClick={() => handleScroll("#contact")}
                  className={`w-full flex items-center justify-center gap-2 ${
                    solution.color === 'purple' 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-pink-600 hover:bg-pink-700'
                  } text-white px-6 py-4 rounded-xl font-semibold transition-colors`}
                >
                  Simular Economia
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
