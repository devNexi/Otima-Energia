import { Shield, Smartphone, Zap } from "lucide-react";
import techImg from "@assets/generated_images/abstract_data_visualization_for_tech_section.png";

export function Tech() {
  return (
    <section id="tech" className="py-24 bg-[#0a192f] text-white relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              Transparência impulsionada por <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Tecnologia</span>
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Não somos apenas corretores. Somos uma empresa de tecnologia que usa dados para garantir que você nunca pague mais do que o necessário pela sua energia.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">IA de Comparação de Preços</h3>
                  <p className="text-gray-400">Nossos algoritmos monitoram o mercado em tempo real para encontrar as tarifas mais baixas disponíveis.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Segurança e Compliance</h3>
                  <p className="text-gray-400">Dados criptografados e processos auditados. Total conformidade com as normas regulatórias do setor elétrico.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Zero Margens Ocultas</h3>
                  <p className="text-gray-400">Modelo 100% transparente. Você vê o preço do fornecedor e sabe exatamente quanto economiza.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 shadow-2xl">
              <img 
                src={techImg} 
                alt="Energy Data Visualization" 
                className="rounded-xl w-full h-auto"
              />
              {/* Overlay UI Elements Mockup */}
              <div className="absolute top-8 right-8 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Economia em Tempo Real</div>
                <div className="text-2xl font-mono font-bold text-green-400">R$ 12.450,00</div>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <span>▲ 12%</span>
                  <span>vs. mês anterior</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
