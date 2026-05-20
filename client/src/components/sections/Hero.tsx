import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import heroVideo from "@assets/generated_videos/solar_farm_aerial_sunset.mp4";

export function Hero() {
  return (
    <section id="top" className="relative min-h-screen pt-20">
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
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 min-h-screen flex items-end">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-24 w-full">
          <p className="text-base lg:text-lg text-white/70 font-medium tracking-widest uppercase mb-4">
            Clareza em um mercado de energia cheio de ruído.
          </p>
          <h1 className="dcvc-statement text-white max-w-5xl mb-6 leading-[1.2]">
            Menos custo. Mais clareza.{" "}
            <span className="text-highlight inline-block mt-1">A decisão certa para a energia da sua empresa.</span>
          </h1>
          <p className="text-lg lg:text-xl text-white/85 max-w-2xl mb-10">
            O mercado de energia no Brasil é opaco, fragmentado e cheio de interesses cruzados.
            A Ótima Energia ajuda sua empresa a enxergar o quadro completo e escolher, com segurança,
            entre <strong>GD, ACL, Gestão de Energia</strong> e otimização no local.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/seja-cliente"
              className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
              data-testid="hero-cta"
            >
              Solicitar Diagnóstico
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/solucoes"
              className="inline-flex items-center gap-3 border border-white/50 hover:border-white text-white px-8 py-4 text-lg font-medium transition-colors"
              data-testid="hero-secondary-cta"
            >
              Ver Soluções
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
