import { Link } from "wouter";
import { ArrowRight, Zap, BarChart3, Activity, Wrench } from "lucide-react";

const solutions = [
  {
    label: "GD para Empresas",
    href: "/gd-para-empresas",
    title: "GD para Empresas",
    description: "Descontos de 15% a 25% na conta da concessionária participando de usinas solares, eólicas ou biogás. Sem instalação, sem obras, sem burocracia para você.",
    icon: Zap,
  },
  {
    label: "ACL / Mercado Livre",
    href: "/mercado-livre-acl",
    title: "ACL / Mercado Livre",
    description: "Para empresas elegíveis: migração estruturada, seleção das melhores comercializadoras nacionais e gestão estratégica do contrato do início à renovação.",
    icon: BarChart3,
  },
  {
    label: "Gestão de Energia",
    href: "/gestao-de-energia",
    title: "Gestão de Energia",
    description: "Acompanhamento estratégico e contínuo da sua posição energética. Monitoramos oportunidades, revisamos contratos e agimos no momento certo, não depois.",
    icon: Activity,
  },
  {
    label: "Otimização no Local",
    href: "/otimizacao-energetica",
    title: "Otimização Energética",
    description: "Identificamos desperdícios na operação, revisamos o perfil de consumo e entregamos um plano concreto de redução, com as ações de maior impacto priorizadas.",
    icon: Wrench,
  },
];

export function Business() {
  return (
    <>
      <section
        style={{ background: "#ffffff" }}
        className="py-16 lg:py-20 border-t border-[#dfbaf2]"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-[#000000] max-w-5xl">
            Trabalhamos com os{" "}
            <span className="text-highlight-pink">principais players nacionais do setor</span>{" "}
            e mostramos o quadro completo, não uma solução empurrada.
          </p>
        </div>
      </section>

      <section
        id="business"
        style={{ background: "#ffffff" }}
        className="pb-20 lg:pb-28"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

          <div className="mb-12 flex flex-col items-center text-center">
            <div
              className="inline-block mb-4"
              style={{
                background: "rgba(158,63,253,0.08)",
                border: "1px solid rgba(158,63,253,0.25)",
                color: "#9e3ffd",
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: "99px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Nossas Frentes de Atuação
            </div>
            <h2
              className="text-[#000000]"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              O caminho certo para cada empresa
            </h2>
            <p
              className="mt-3 text-base max-w-xl"
              style={{ color: "#736d77" }}
            >
              Cada empresa tem um perfil diferente. Identificamos qual caminho gera mais economia para o seu caso específico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {solutions.map((s, i) => {
              const Icon = s.icon;
              return (
                <Link
                  key={i}
                  href={s.href}
                  className="group relative flex flex-col p-7 rounded-2xl transition-all duration-300 overflow-hidden"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dfbaf2",
                  }}
                  data-testid={`solution-card-${i}`}
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at 50% 0%, rgba(158,63,253,0.06) 0%, transparent 70%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ border: "1px solid #c88ff5" }}
                  />

                  <div className="relative z-10 flex flex-col h-full">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                      style={{
                        background: "rgba(158,63,253,0.1)",
                        border: "1px solid #dfbaf2",
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "#9e3ffd" }} />
                    </div>

                    <p
                      className="text-xs tracking-widest uppercase mb-2 font-semibold"
                      style={{ color: "#9e3ffd" }}
                    >
                      {s.label}
                    </p>
                    <h3
                      className="font-bold mb-3 transition-colors duration-200 group-hover:text-[#9e3ffd]"
                      style={{
                        color: "#000000",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "1.1rem",
                        lineHeight: 1.25,
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed flex-grow mb-6"
                      style={{ color: "#736d77" }}
                    >
                      {s.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all duration-200"
                      style={{ color: "#9e3ffd" }}
                    >
                      <span>Saiba mais</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
