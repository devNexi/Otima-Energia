import { motion } from "framer-motion";
import { Check, Building2, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    ]
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
    ]
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
    <section id="business" className="section-spacing bg-background">
      <div className="container-dcvc">
        <div className="max-w-3xl mb-16">
          <h2 className="mb-6">
            Soluções <span className="text-gradient">sob medida</span> para o seu negócio
          </h2>
          <p className="text-xl text-muted-foreground">
            Seja você uma pequena empresa ou uma grande indústria, temos a solução ideal 
            para reduzir seus custos energéticos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className="card-dcvc"
            >
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <solution.icon className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="mb-3">{solution.title}</h3>
              <p className="text-muted-foreground mb-6">{solution.description}</p>
              
              <ul className="space-y-3 mb-8">
                {solution.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handleScroll("#contact")}
                className="btn-primary w-full"
              >
                Simular Economia
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-4xl font-bold text-primary mb-2">35%</div>
            <div className="text-muted-foreground">Economia média</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Empresas atendidas</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">R$10M+</div>
            <div className="text-muted-foreground">Economia gerada</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">Digital</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
