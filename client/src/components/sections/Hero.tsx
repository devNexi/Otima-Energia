import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="top" className="min-h-screen flex items-center pt-16 bg-gradient-to-b from-muted/50 to-background">
      <div className="container-dcvc py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="mb-8">
              Somos <span className="text-gradient">energia inteligente</span> para empresas.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Há anos ajudamos empresas brasileiras a economizar até 35% na conta de luz com transparência, tecnologia e as melhores condições do mercado livre.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => handleScroll("#contact")}
                className="btn-primary text-lg px-8 py-6 h-auto"
                data-testid="hero-cta-primary"
              >
                Simular Economia
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleScroll("#process")}
                className="btn-secondary text-lg px-8 py-6 h-auto"
                data-testid="hero-cta-secondary"
              >
                Como Funciona
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
