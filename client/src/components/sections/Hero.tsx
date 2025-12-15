import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import heroVideo from "@assets/generated_videos/solar_farm_aerial_sunset.mp4";

export function Hero() {
  return (
    <section id="top" className="relative min-h-screen pt-20">
      {/* Video Background */}
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
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - Bottom left like DCVC */}
      <div className="relative z-10 min-h-screen flex items-end">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-24 w-full">
          <h1 className="dcvc-statement text-white max-w-4xl mb-6">
            Economize até{" "}
            <span className="text-highlight">40%</span>{" "}
            na conta de luz da sua empresa com o Mercado Livre de Energia.
          </h1>
          <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mb-8">
            A Ótima Energia resolve a falta de transparência do mercado livre, comparando o máximo possível de ofertas e estruturando contratos corretos — com total segurança.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="hero-cta"
          >
            Solicitar Diagnóstico Gratuito
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
