import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, BarChart2, RefreshCw, Bell } from "lucide-react";

const features = [
  {
    icon: BarChart2,
    title: "Análise de perfil energético",
    desc: "Leitura automática de contas, histórico de consumo e perfil de risco para montar um quadro completo da sua operação energética.",
  },
  {
    icon: RefreshCw,
    title: "Comparação de ofertas em tempo real",
    desc: "Acessa dados reais de comercializadoras, geradores de GD e distribuidoras para montar comparações neutras, sem favoritismo.",
  },
  {
    icon: Bell,
    title: "Monitoramento de renovações",
    desc: "Rastreia janelas contratuais e alertas de mercado para garantir que você nunca perca uma oportunidade de economia.",
  },
];

export default function Ecos() {
  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />
      <main>

        <section
          className="relative overflow-hidden pt-40 pb-24"
          style={{ background: "linear-gradient(135deg, #0a0920 0%, #16163f 60%, #1a0835 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/texture-electric.png')", backgroundSize: "600px", backgroundRepeat: "repeat", opacity: 0.04 }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(158,63,253,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.45 }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(158,63,253,0.2) 0%, transparent 70%)" }} />

          <div className="relative z-10 max-w-[1100px] mx-auto px-6 lg:px-12 text-center">
            <div className="inline-block mb-6" style={{ background: "rgba(158,63,253,0.15)", border: "1px solid rgba(158,63,253,0.3)", color: "#c88ff5", fontSize: "0.72rem", fontWeight: 700, padding: "5px 13px", borderRadius: "99px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Sistema Proprietário · Ótima Energia
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "clamp(4rem, 9vw, 7rem)", color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.9, marginBottom: "16px" }}>
              ECOS<sup style={{ fontSize: "0.38em", verticalAlign: "super", fontWeight: 800 }}>™</sup>
            </h1>
            <p style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "1.25rem", marginBottom: "20px" }}>
              Inteligência que orienta cada decisão
            </p>
            <p className="text-lg lg:text-xl leading-relaxed mx-auto" style={{ color: "rgba(255,255,255,0.65)", maxWidth: "600px", marginBottom: "40px" }}>
              O sistema de inteligência proprietário da Ótima Energia. Combina IA, automação e dados de mercado para garantir que cada decisão energética seja tomada no momento certo, com as informações certas.
            </p>
            <Link
              href="/seja-cliente"
              className="inline-flex items-center gap-2 text-white font-semibold transition-all hover:opacity-90"
              style={{ background: "#9e3ffd", borderRadius: "8px", padding: "14px 28px", fontSize: "1rem", fontFamily: "'Sora', sans-serif", boxShadow: "0 8px 24px rgba(158,63,253,0.4)" }}
              data-testid="ecos-hero-cta"
            >
              Solicitar Diagnóstico ECOS™
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-t border-white/[0.04]" style={{ background: "#13112a" }}>
          <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#9e3ffd", fontFamily: "'Sora', sans-serif" }}>
                Capacidades
              </p>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#fff", letterSpacing: "-0.015em", marginBottom: "16px" }}>
                O que o ECOS™ faz por você
              </h2>
              <p className="text-lg max-w-xl mx-auto text-white/80">
                Três capacidades integradas que transformam dados brutos em decisões confiáveis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-col"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "14px", padding: "28px 24px" }}
                  data-testid={`ecos-feature-${i}`}
                >
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 flex-shrink-0" style={{ background: "rgba(158,63,253,0.15)" }}>
                    <f.icon className="w-5 h-5" style={{ color: "#9e3ffd" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "1.05rem", color: "#fff", marginBottom: "10px" }}>
                    {f.title}
                  </h3>
                  <p className="text-white/80" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-2xl p-8 lg:p-12" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)" }}>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.75rem", color: "#fff", marginBottom: "12px" }}>
                    Sem conflito. Sem viés.
                  </h3>
                  <p className="text-white/80" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
                    O ECOS™ não tem interesse em qual solução você escolhe. Ele só recomenda uma mudança quando há ganho real projetado. Você sempre vê os dados que sustentam a recomendação.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Recomendações documentadas e rastreáveis",
                    "Dados de mercado atualizados em tempo real",
                    "Cobertura de GD, ACL, Gestão e Otimização",
                    "Análise independente, sem vínculo com fornecedores",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#9e3ffd" }} />
                      <span className="text-white/80" style={{ fontSize: "0.9rem" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          className="relative overflow-hidden py-24 border-t border-white/[0.04]"
          style={{ background: "linear-gradient(135deg, #0a0920 0%, #16163f 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/texture-electric.png')", backgroundSize: "600px", backgroundRepeat: "repeat", opacity: 0.04 }} />
          <div className="relative z-10 max-w-[700px] mx-auto px-6 lg:px-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif" }}>
              Pronto para começar?
            </p>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Deixe o ECOS™ analisar a energia da sua empresa
            </h2>
            <p className="text-lg mb-10 text-white/60">
              Diagnóstico gratuito. Em até 5 dias úteis você recebe uma análise completa com as melhores opções para o seu perfil.
            </p>
            <Link
              href="/seja-cliente"
              className="inline-flex items-center gap-2 text-white font-semibold transition-all hover:opacity-90"
              style={{ background: "#9e3ffd", borderRadius: "8px", padding: "14px 32px", fontSize: "1rem", fontFamily: "'Sora', sans-serif", boxShadow: "0 8px 24px rgba(158,63,253,0.4)" }}
              data-testid="ecos-final-cta"
            >
              Solicitar Diagnóstico Gratuito
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
