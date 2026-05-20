import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import HeroBackground from "@/components/HeroBackground";

export function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen pt-20 overflow-hidden"
      style={{ background: "#09081e" }}
    >
      <HeroBackground />

      {/* Dot grid overlay — layers on top of shader */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(158,63,253,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
          zIndex: 1,
        }}
      />

      <div className="relative min-h-screen flex items-center" style={{ zIndex: 2 }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-24 pt-8 w-full">

          {/* Pill badge — tight to headline */}
          <div
            className="inline-block mb-4"
            style={{
              background: "rgba(158,63,253,0.15)",
              border: "1px solid rgba(158,63,253,0.3)",
              color: "#c88ff5",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "99px",
            }}
          >
            IA aplicada ao mercado de energia
          </div>

          <h1
            className="text-white max-w-5xl mb-5"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Menos custo. Mais clareza.{" "}
            <span style={{ color: "#c88ff5" }}>A decisão certa para a energia da sua empresa.</span>
          </h1>

          <p
            className="text-xl max-w-xl"
            style={{ color: "rgba(255,255,255,0.75)", marginBottom: "4px" }}
          >
            Análise neutra. Todas as opções. A decisão certa para o seu negócio.
          </p>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center" style={{ gap: "24px", margin: "20px 0 28px" }}>
            {[
              "Operamos em todos os estados",
              "CNPJ: 65.023.912/0001-24",
              "Análise 100% neutra",
              "Regulamentado ANEEL/CCEE",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5"
                style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}
              >
                <span style={{ color: "#9e3ffd" }}>✦</span> {item}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/seja-cliente"
              className="inline-flex items-center gap-3 text-white px-8 py-4 text-lg font-medium transition-all hover:opacity-90"
              style={{
                background: "#9e3ffd",
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(158,63,253,0.35)",
              }}
              data-testid="hero-cta"
            >
              Solicitar Diagnóstico
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/solucoes"
              className="inline-flex items-center gap-3 px-8 py-4 text-lg font-medium transition-colors"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.4)",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.9)",
              }}
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
