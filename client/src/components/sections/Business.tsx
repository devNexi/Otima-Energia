import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const solutions = [
  {
    label: "GD para Empresas",
    href: "/gd-para-empresas",
    title: "GD para Empresas",
    description: "Descontos de 15% a 25% na conta da concessionária participando de usinas solares, eólicas ou biogás. Sem instalação, sem obras, sem burocracia para você.",
  },
  {
    label: "ACL / Mercado Livre",
    href: "/mercado-livre-acl",
    title: "ACL / Mercado Livre",
    description: "Para empresas elegíveis: migração estruturada, seleção das melhores comercializadoras nacionais e gestão estratégica do contrato do início à renovação.",
  },
  {
    label: "Gestão de Energia",
    href: "/gestao-de-energia",
    title: "Gestão de Energia",
    description: "Acompanhamento estratégico e contínuo da sua posição energética. Monitoramos oportunidades, revisamos contratos e agimos no momento certo, não depois.",
  },
  {
    label: "Otimização no Local",
    href: "/otimizacao-energetica",
    title: "Otimização Energética",
    description: "Identificamos desperdícios na operação, revisamos o perfil de consumo e entregamos um plano concreto de redução, com as ações de maior impacto priorizadas.",
  },
];

export function Business() {
  return (
    <>
      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            Trabalhamos com os{" "}
            <span className="text-highlight-pink">principais players nacionais do setor</span>{" "}
            e mostramos o quadro completo, não uma solução empurrada.
          </p>
        </div>
      </section>

      <section id="business" className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-4 text-center">Nossas Frentes de Atuação</h2>
          <p className="text-center text-[#736d77] text-lg mb-16 max-w-2xl mx-auto">
            Cada empresa tem um perfil diferente. Identificamos qual caminho gera mais economia para o seu caso específico.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((s, i) => (
              <Link
                key={i}
                href={s.href}
                className="group flex flex-col p-8 rounded-xl border border-gray-200 hover:border-[#9e3ffd] hover:shadow-lg transition-all duration-300 bg-white"
                data-testid={`solution-card-${i}`}
              >
                <p className="text-xs tracking-wide text-[#9e3ffd] uppercase mb-3 font-medium">{s.label}</p>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#9e3ffd] transition-colors">
                  {s.title}
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed flex-grow mb-6">
                  {s.description}
                </p>
                <div className="flex items-center gap-2 text-[#9e3ffd] text-sm font-medium">
                  <span>Saiba mais</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
