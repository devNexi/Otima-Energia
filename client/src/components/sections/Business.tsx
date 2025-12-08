import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import industrialImg from "@assets/generated_images/modern_industrial_factory_for_business_section.png";

export function Business() {
  return (
    <section id="business" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              Soluções sob medida para o seu negócio
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Seja você uma pequena empresa ou uma grande indústria, temos a solução ideal para reduzir seus custos energéticos.
            </p>

            <Tabs defaultValue="sme" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger 
                  value="sme" 
                  className="py-3 text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
                >
                  Pequenas e Médias
                </TabsTrigger>
                <TabsTrigger 
                  value="industrial" 
                  className="py-3 text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
                >
                  Grandes Indústrias
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sme" className="space-y-6">
                <div className="space-y-4">
                  {[
                    "Economia garantida sem investimento inicial",
                    "Migração simplificada (Modelo Varejista)",
                    "Gestão unificada em uma única fatura",
                    "Proteção contra bandeiras tarifárias"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-foreground font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-6" size="lg">Simular para minha empresa</Button>
              </TabsContent>
              
              <TabsContent value="industrial" className="space-y-6">
                <div className="space-y-4">
                  {[
                    "Acesso direto ao mercado atacadista",
                    "Estratégias personalizadas de compra (Longo Prazo)",
                    "Relatórios detalhados de inteligência de mercado",
                    "Gestão de risco e conformidade regulatória"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-foreground font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-6" size="lg">Falar com Consultor Industrial</Button>
              </TabsContent>
            </Tabs>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2rem] blur-2xl opacity-50" />
            <img 
              src={industrialImg} 
              alt="Industrial Energy" 
              className="relative rounded-2xl shadow-2xl w-full h-auto object-cover aspect-[4/3] border border-white/20"
            />
            
            {/* Floating Stat Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-border max-w-xs hidden md:block">
              <div className="text-sm text-muted-foreground mb-1">Economia Média Anual</div>
              <div className="text-3xl font-bold text-green-600">R$ 45.000+</div>
              <div className="text-xs text-muted-foreground mt-2">Baseado em clientes SME</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
