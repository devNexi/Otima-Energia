import { motion } from "framer-motion";
import { Search, BarChart3, FileCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: FileCheck,
    title: "Envie sua conta",
    description: "Basta compartilhar sua fatura atual ou código UC. Nossa IA analisa seu perfil de consumo instantaneamente.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Search,
    title: "Nós buscamos o melhor preço",
    description: "Nossa tecnologia varre todo o mercado livre para encontrar as melhores ofertas de fornecedores certificados.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: BarChart3,
    title: "Você escolhe e economiza",
    description: "Apresentamos as 3 melhores opções. Você escolhe, e nós cuidamos de toda a burocracia da migração.",
    color: "bg-purple-100 text-purple-600",
  },
];

export function Process() {
  return (
    <section id="process" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Como funciona a <span className="text-primary">Ótima Energia</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Simplificamos o processo complexo de migração para o Mercado Livre de Energia. Sem taxas escondidas, sem burocracia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-green-200 to-purple-200 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow bg-background relative overflow-hidden group">
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
