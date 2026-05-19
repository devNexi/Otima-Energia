import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, TrendingUp, Zap, BarChart3 } from "lucide-react";

export function Aurora() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#16163f] font-sans text-white flex flex-col items-center justify-center pt-24 pb-32">
      {/* Aurora Background Effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes aurora-1 {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-10%) scale(1.1) rotate(5deg); opacity: 0.8; }
          100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.6; }
        }
        @keyframes aurora-2 {
          0% { transform: translateX(0) scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: translateX(10%) scale(1.2) rotate(-5deg); opacity: 0.7; }
          100% { transform: translateX(0) scale(1) rotate(0deg); opacity: 0.5; }
        }
        @keyframes aurora-3 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(5%) translateX(-5%) scale(1.15); opacity: 0.6; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.4; }
        }
        .aurora-base {
          position: absolute;
          inset: -20%;
          z-index: 0;
          filter: blur(80px);
          pointer-events: none;
        }
        .aurora-band-1 {
          position: absolute;
          top: 10%;
          left: -10%;
          width: 70%;
          height: 40%;
          background: radial-gradient(ellipse at center, rgba(158, 63, 253, 0.4) 0%, transparent 70%);
          animation: aurora-1 12s ease-in-out infinite;
          transform-origin: center;
        }
        .aurora-band-2 {
          position: absolute;
          top: 30%;
          right: -20%;
          width: 80%;
          height: 50%;
          background: radial-gradient(ellipse at center, rgba(0, 255, 204, 0.25) 0%, transparent 70%);
          animation: aurora-2 15s ease-in-out infinite;
          transform-origin: right center;
        }
        .aurora-band-3 {
          position: absolute;
          bottom: -10%;
          left: 10%;
          width: 90%;
          height: 60%;
          background: radial-gradient(ellipse at center, rgba(200, 143, 245, 0.3) 0%, transparent 70%);
          animation: aurora-3 10s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .hero-content {
          position: relative;
          z-index: 10;
        }
      `}} />

      <div className="aurora-base">
        <div className="aurora-band-1"></div>
        <div className="aurora-band-2"></div>
        <div className="aurora-band-3"></div>
      </div>

      <div className="hero-content container max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {["Dados reais", "Processo comercial", "Treinamento", "Suporte da Otima", "Zero ganho por recrutamento"].map((badge, i) => (
            <Badge key={i} variant="outline" className="bg-[#16163f]/50 text-[#c88ff5] border-[#9e3ffd]/30 backdrop-blur-md px-3 py-1 font-medium">
              {badge}
            </Badge>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Receba empresas com potencial <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9e3ffd] to-[#c88ff5]">
            em energia.
          </span>
        </h1>

        {/* Subline */}
        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mb-12 font-light">
          Trabalhe contas reais. Ganhe até <span className="font-semibold text-white">35% de comissão</span> por clientes convertidos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-24">
          <Button size="lg" className="bg-[#9e3ffd] hover:bg-[#8b33e6] text-white px-8 py-6 text-lg rounded-full font-semibold transition-all hover:scale-105 shadow-[0_0_30px_-5px_rgba(158,63,253,0.5)] border-0">
            Candidatar-se
          </Button>
          <button className="text-[#c88ff5] hover:text-white font-medium flex items-center gap-2 transition-colors text-lg group">
            Ver como funciona
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4 Floating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[
            { title: "Contas Reais", desc: "Leads qualificados entregues a você.", icon: CheckCircle2 },
            { title: "Alta Conversão", desc: "Processo comercial validado.", icon: TrendingUp },
            { title: "Energia Barata", desc: "As melhores tarifas do mercado.", icon: Zap },
            { title: "Transparência", desc: "Acompanhe tudo pelo portal.", icon: BarChart3 },
          ].map((card, i) => (
            <Card key={i} className="bg-[#16163f]/60 border-[#9e3ffd]/20 backdrop-blur-lg hover:bg-[#16163f]/80 transition-colors">
              <CardContent className="p-6 text-left">
                <card.icon className="w-8 h-8 text-[#c88ff5] mb-4" />
                <h3 className="font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
