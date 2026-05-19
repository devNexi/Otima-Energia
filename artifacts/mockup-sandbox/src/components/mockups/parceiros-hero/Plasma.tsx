import React from 'react';
import './_group.css';

export function Plasma() {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center pt-24 pb-32 px-4 font-sans text-white plasma-bg">
      {/* Background visual treatment */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="plasma-arc arc-1"></div>
        <div className="plasma-arc arc-2"></div>
        <div className="plasma-arc arc-3"></div>
        {/* SVG Arcs for extra texture */}
        <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 200 Q 400 300 800 100 T 1600 400" fill="none" stroke="#c88ff5" strokeWidth="2" filter="blur(2px)" className="animate-[plasma-pulse_3s_infinite_alternate]" />
          <path d="M0 500 Q 500 200 1000 600 T 1600 300" fill="none" stroke="#9e3ffd" strokeWidth="4" filter="blur(4px)" className="animate-[plasma-pulse_4s_infinite_alternate]" />
          <path d="M200 0 Q 300 500 600 800 T 800 1600" fill="none" stroke="#c88ff5" strokeWidth="3" filter="blur(3px)" className="animate-[plasma-pulse_2s_infinite_alternate-reverse]" />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">
        
        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {["Dados reais", "Processo comercial", "Treinamento", "Suporte da Otima", "Zero ganho por recrutamento"].map(badge => (
            <span key={badge} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#9e3ffd]/10 text-[#c88ff5] border border-[#9e3ffd]/30 backdrop-blur-sm shadow-[0_0_10px_rgba(158,63,253,0.2)]">
              {badge}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1]">
          Receba empresas com potencial
          <span className="block bg-gradient-to-r from-[#c88ff5] via-[#9e3ffd] to-[#c88ff5] text-transparent bg-clip-text mt-2 bg-[length:200%_auto] animate-pulse">
            em energia.
          </span>
        </h1>

        {/* Subline */}
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl font-medium leading-relaxed">
          Trabalhe contas reais. Ganhe até <span className="text-[#c88ff5] font-bold">35% de comissão</span> por clientes convertidos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-10">
          <button className="px-10 py-5 rounded-xl bg-[#9e3ffd] text-white font-bold text-xl hover:bg-[#8b31e5] transition-all shadow-[0_0_40px_rgba(158,63,253,0.6)] hover:shadow-[0_0_60px_rgba(158,63,253,0.8)] hover:scale-105 active:scale-95">
            Candidatar-se
          </button>
          <a href="#" className="text-white hover:text-[#c88ff5] transition-colors font-bold text-lg inline-flex items-center group">
            Ver como funciona 
            <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
          </a>
        </div>
      </div>

      {/* Floating Info Cards */}
      <div className="relative z-10 max-w-6xl w-full mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {[
          { title: "Contas Reais", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          { title: "Processo Transparente", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { title: "Alta Conversão", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
          { title: "Suporte Dedicado", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" }
        ].map((card, i) => (
          <div key={i} className="bg-[#16163f]/60 backdrop-blur-xl border border-[#9e3ffd]/30 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-[#16163f]/80 hover:border-[#c88ff5]/50 hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-[#9e3ffd]/20 flex items-center justify-center mb-6 group-hover:bg-[#9e3ffd]/40 transition-colors shadow-[inset_0_0_20px_rgba(158,63,253,0.3)]">
              <svg className="w-7 h-7 text-[#c88ff5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{card.title}</h3>
            <p className="text-base text-gray-400 leading-relaxed">
              Trabalhe com um portfólio validado e processos otimizados para fechar mais negócios.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
