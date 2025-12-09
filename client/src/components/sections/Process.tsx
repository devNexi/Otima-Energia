import { motion } from "framer-motion";
import { FileText, Search, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Envie sua conta",
    description: "Compartilhe sua fatura atual. Nossa tecnologia analisa seu perfil de consumo instantaneamente.",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
  },
  {
    number: "02",
    icon: Search,
    title: "Buscamos o melhor preço",
    description: "Varremos todo o mercado livre para encontrar as melhores ofertas de fornecedores certificados.",
    color: "from-green-500 to-green-600",
    bgLight: "bg-green-50",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Você escolhe e economiza",
    description: "Apresentamos as melhores opções. Você escolhe, e nós cuidamos de toda a migração.",
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50",
  },
];

export function Process() {
  return (
    <section id="process" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-purple-600 font-semibold mb-4">Como Funciona</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simplificamos a migração para o{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Mercado Livre
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Sem taxas escondidas, sem burocracia. Em três passos simples, você começa a economizar.
            </p>
          </motion.div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-8 h-full shadow-sm hover:shadow-xl transition-all duration-300 hover:border-purple-100">
                {/* Step Number & Icon */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-gray-100 group-hover:text-purple-100 transition-colors">
                    {step.number}
                  </span>
                  <div className={`w-14 h-14 rounded-xl ${step.bgLight} flex items-center justify-center`}>
                    <step.icon className={`w-7 h-7 bg-gradient-to-r ${step.color} bg-clip-text text-purple-600`} />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
