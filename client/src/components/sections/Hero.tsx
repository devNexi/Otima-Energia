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
          <p className="text-lg lg:text-xl text-white/80 font-medium tracking-wide mb-4">
            Sua energia. Sua escolha. Sua economia.
          </p>
          <h1 className="dcvc-statement text-white max-w-4xl mb-6 leading-[1.3]">
            Economia inteligente para a energia da sua empresa no{" "}
            <span className="text-highlight inline-block mt-1">Mercado Livre</span>.
          </h1>
          <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mb-8">
            Analisamos sua conta, comparamos ofertas do mercado e estruturamos contratos com clareza, segurança e transparência — sem custo para sua empresa.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="hero-cta"
          >
            Simular economia (diagnóstico gratuito)
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-white/70 mt-4 max-w-xl">
            Economia potencial de até 40%, dependendo do perfil e das condições de contratação.
          </p>
        </div>
      </div>
    </section>
  );
}
