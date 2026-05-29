import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function Process() {
  const steps = [
    {
      num: "01",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#9e3ffd" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Envie sua conta ou seus dados",
      desc: "Você compartilha informações básicas ou suas faturas. Nossa IA (ECOS™) extrai o que é relevante e monta o seu perfil energético.",
    },
    {
      num: "02",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#9e3ffd" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Analisamos seu perfil energético",
      desc: "Cruzamos consumo, tarifa local, distribuidora, elegibilidade e mercado para mapear todas as rotas viáveis: GD, ACL, Gestão ou otimização no local.",
    },
    {
      num: "03",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#9e3ffd" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Mostramos as rotas viáveis com clareza",
      desc: "Você recebe uma análise clara das opções disponíveis, com cenários, prazos, riscos e recomendação. A decisão final, sempre transparente, é sua.",
    },
    {
      num: "04",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#9e3ffd" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Você escolhe, nós cuidamos da execução",
      desc: "Da assinatura do contrato à ativação, cuidamos de toda a burocracia. E na renovação, reavaliamos o cenário para garantir que você permaneça no melhor lugar.",
    },
  ];

  return (
    <>
      {/* ── "A maioria" statement section ─────────────────────── */}
      <section
        style={{ background: "#09081e" }}
        className="py-20 lg:py-24 border-t border-[rgba(158,63,253,0.15)]"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-white max-w-5xl mb-8">
            A maioria das empresas brasileiras paga mais do que deveria pela energia,{" "}
            <span className="text-highlight">não por falta de opções, mas por falta de clareza</span>.
          </p>
          <p
            className="text-lg lg:text-xl max-w-4xl mb-6"
            style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.75" }}
          >
            O mercado de energia é fragmentado e opaco: ofertas confusas, contratos ambíguos e fornecedores que empurram uma única solução: a que é melhor para eles, não para você.
          </p>
          <p
            className="text-lg lg:text-xl max-w-4xl"
            style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.75" }}
          >
            A Ótima existe para dar clareza: analisamos todas as opções viáveis (GD, ACL, Gestão de Energia e otimização no local), explicamos tudo com transparência e entregamos só o que importa: a decisão certa para o seu negócio.
          </p>

          <div
            className="flex flex-wrap gap-10 lg:gap-20 max-w-4xl mt-10"
            style={{
              borderTop: "1px solid rgba(158,63,253,0.15)",
              paddingTop: "32px",
            }}
          >
            {[
              { num: "4", label: "Frentes de atuação" },
              { num: "30%", label: "Economia de até" },
              { num: "0", label: "Conflitos de interesse" },
            ].map(({ num, label }) => (
              <div key={label}>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "3rem",
                    color: "#9e3ffd",
                    lineHeight: 1,
                  }}
                >
                  {num}
                </p>
                <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm mt-8 max-w-2xl" style={{ color: "rgba(255,255,255,0.25)" }}>
            *Valores indicam potencial de economia estimada. Resultados variam conforme perfil, região e prazo.
          </p>
        </div>
      </section>

      {/* ── "Como funciona" step cards ─────────────────────────── */}
      <section
        id="process"
        style={{ background: "#13112a" }}
        className="py-20 lg:py-24 border-t border-[rgba(158,63,253,0.15)]"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-12">
            <div
              className="inline-block mb-4"
              style={{
                background: "rgba(158,63,253,0.12)",
                border: "1px solid rgba(158,63,253,0.3)",
                color: "#c88ff5",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: "99px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Como Funciona
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                marginBottom: "12px",
              }}
            >
              Como funciona o diagnóstico
            </h2>
            <p
              className="max-w-3xl"
              style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: "1.75" }}
            >
              Nosso processo substitui a venda de uma solução única por uma análise neutra e estruturada. Trabalhamos como seu consultor estratégico para identificar a rota de maior economia para o seu perfil.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((item, i) => (
              <div
                key={i}
                className="relative p-6 rounded-2xl overflow-hidden"
                style={{
                  background: "#1a1833",
                  border: "1px solid rgba(158,63,253,0.15)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                <span
                  className="absolute select-none pointer-events-none font-black"
                  style={{
                    color: "rgba(158,63,253,0.1)",
                    fontSize: "4.5rem",
                    lineHeight: 1,
                    fontFamily: "'Outfit', sans-serif",
                    top: "-8px",
                    right: "16px",
                  }}
                >
                  {item.num}
                </span>

                <div
                  className="flex items-center justify-center mb-4 relative z-10"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(158,63,253,0.12)",
                    border: "1px solid rgba(158,63,253,0.25)",
                  }}
                >
                  {item.icon}
                </div>

                <h3
                  className="font-semibold mb-2 relative z-10"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: "#ffffff",
                    fontSize: "1rem",
                    lineHeight: 1.35,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="relative z-10"
                  style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: "1.75" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/seja-cliente"
              className="inline-flex items-center gap-2 font-semibold transition-all hover:gap-3"
              style={{ color: "#9e3ffd", fontFamily: "'Sora', sans-serif", fontSize: "0.85rem" }}
              data-testid="process-cta"
            >
              Solicitar Diagnóstico Gratuito
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
