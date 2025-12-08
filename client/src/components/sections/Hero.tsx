import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVideo from "@assets/generated_videos/minimalist_data_reveal_animation_with_map_of_brazil_and_savings_pulse.mp4";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Zap className="w-4 h-4" />
              <span>Mercado Livre de Energia</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[1.1] mb-6 text-foreground">
              Energia inteligente para o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">negócio</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Transparência, tecnologia e o melhor preço garantido. Modernizamos a forma como sua empresa compra energia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="text-lg px-8 h-14 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
                Simular Economia Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/50 backdrop-blur-sm border-primary/20 hover:bg-white/80">
                Falar com Especialista
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Até 35% de economia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Sem custos de adesão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Gestão 100% digital</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
