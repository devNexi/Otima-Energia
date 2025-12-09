import { motion } from "framer-motion";
import { FileText, Search, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Envie sua conta",
    description: "Compartilhe sua fatura atual. Nossa tecnologia analisa seu perfil de consumo instantaneamente.",
  },
  {
    number: "02",
    icon: Search,
    title: "Buscamos o melhor preço",
    description: "Varremos todo o mercado livre para encontrar as melhores ofertas de fornecedores certificados.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Você escolhe e economiza",
    description: "Apresentamos as melhores opções. Você escolhe, e nós cuidamos de toda a migração.",
  },
];

export function Process() {
  return (
    <section id="process" className="section-spacing bg-muted">
      <div className="container-dcvc">
        <div className="max-w-3xl mb-16">
          <h2 className="mb-6">
            Como funciona a <span className="text-gradient">Ótima Energia</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Simplificamos o processo complexo de migração para o Mercado Livre de Energia. 
            Sem taxas escondidas, sem burocracia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className="card-dcvc"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
