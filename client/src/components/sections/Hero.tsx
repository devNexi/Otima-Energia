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
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 min-h-screen flex items-end">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-24 w-full">
          <p className="text-lg lg:text-xl text-white/80 font-medium tracking-wide mb-4">
            Sua energia. Sua escolha. Sua economia.
          </p>
          <h1 className="dcvc-statement text-white max-w-4xl mb-6 leading-[1.3]">
            Conta menor. Controle total.{" "}
            <span className="text-highlight inline-block mt-1">Sem complexidade</span>.
          </h1>
          <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mb-8">
            O mercado de energia brasileiro oferece mais opções do que nunca: <strong>ACR (concessionária), ACL (Livre) e GDL (geração compartilhada)</strong>. Qual é a certa para o seu negócio?
          </p>
          <p className="text-lg text-white/80 max-w-2xl mb-8">
            Nós analisamos seu perfil, comparamos os três mercados com dados reais e te guiamos para a decisão que maximiza sua economia, sem viés e sem conflito de interesse.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
            data-testid="hero-cta"
          >
            Diagnóstico Gratuito dos 3 Mercados
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
