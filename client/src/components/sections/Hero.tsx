import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      id="top" 
      className="min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-purple-50 pt-20"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Mercado Livre de Energia
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8">
              Somos{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                energia inteligente
              </span>
              {" "}para empresas.
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Há anos ajudamos empresas brasileiras a economizar até{" "}
              <span className="font-semibold text-purple-600">35% na conta de luz</span>{" "}
              com transparência, tecnologia e as melhores condições do mercado livre.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleScroll("#contact")}
                className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300"
                data-testid="hero-cta-primary"
              >
                Simular Economia
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button 
                onClick={() => handleScroll("#process")}
                className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all border-2 border-gray-200 hover:border-purple-200"
                data-testid="hero-cta-secondary"
              >
                Como Funciona
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-6">Resultados comprovados</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">35%</div>
                  <div className="text-sm text-gray-600">Economia média</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600">Empresas atendidas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">R$10M+</div>
                  <div className="text-sm text-gray-600">Economia gerada</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
