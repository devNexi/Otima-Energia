import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, ChevronRight, Zap, TrendingUp, Users, Shield } from "lucide-react";

export function Prism() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-slate-50 font-sans" style={{ backgroundColor: "#16163f" }}>
      <style dangerouslySetInlineStyle={{
        __html: `
          @keyframes slow-spin {
            from { transform: rotate(0deg) scale(2); }
            to { transform: rotate(360deg) scale(2); }
          }
          .prism-rays {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(
              from 180deg at 20% 20%,
              transparent 0deg,
              transparent 15deg,
              rgba(158, 63, 253, 0.4) 15.5deg,
              transparent 16deg,
              transparent 25deg,
              rgba(200, 143, 245, 0.3) 25.5deg,
              transparent 26deg,
              transparent 45deg,
              rgba(64, 224, 208, 0.2) 45.5deg,
              transparent 46deg,
              transparent 60deg,
              rgba(158, 63, 253, 0.5) 60.5deg,
              transparent 61deg,
              transparent 85deg,
              rgba(75, 0, 130, 0.4) 85.5deg,
              transparent 86deg,
              transparent 360deg
            );
            animation: slow-spin 40s linear infinite;
            transform-origin: 20% 20%;
            opacity: 0.8;
            pointer-events: none;
            mix-blend-mode: screen;
          }
          .prism-glow {
            position: absolute;
            top: -20%;
            left: -10%;
            width: 80vw;
            height: 80vw;
            background: radial-gradient(circle, rgba(158,63,253,0.3) 0%, transparent 70%);
            pointer-events: none;
          }
        `
      }} />

      {/* Background Variant: Prism Rays */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="prism-rays" />
        <div className="prism-glow" />
      </div>

      <div className="relative z-10 flex-grow flex flex-col">
        {/* Navigation (simplified) */}
        <nav className="flex items-center justify-between p-6 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#c88ff5]" />
            <span className="font-bold text-xl tracking-tight">Ótima Energia</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
            <a href="#" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#" className="hover:text-white transition-colors">Requisitos</a>
          </div>
          <Button variant="outline" className="border-[#9e3ffd] text-[#9e3ffd] hover:bg-[#9e3ffd] hover:text-white transition-colors bg-transparent">
            Login
          </Button>
        </nav>

        {/* Hero Content */}
        <main className="flex-grow flex flex-col justify-center items-center px-4 pt-12 pb-24 max-w-5xl mx-auto w-full text-center">
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="secondary" className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-[#c88ff5]" /> Dados reais
            </Badge>
            <Badge variant="secondary" className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-[#c88ff5]" /> Processo comercial
            </Badge>
            <Badge variant="secondary" className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-[#c88ff5]" /> Treinamento
            </Badge>
            <Badge variant="secondary" className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-[#c88ff5]" /> Suporte da Otima
            </Badge>
            <Badge variant="secondary" className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-[#c88ff5]" /> Zero ganho por recrutamento
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl">
            Receba empresas com potencial
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c88ff5] to-[#9e3ffd]">
              em energia.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
            Trabalhe contas reais. Ganhe até 35% de comissão por clientes convertidos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button size="lg" className="bg-[#9e3ffd] hover:bg-[#8b33e6] text-white text-lg px-8 py-6 h-auto rounded-full font-semibold transition-all hover:scale-105 shadow-[0_0_20px_rgba(158,63,253,0.3)]">
              Candidatar-se <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="ghost" size="lg" className="text-lg px-8 py-6 h-auto rounded-full font-medium hover:bg-white/5 text-slate-200">
              Ver como funciona <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          </div>
        </main>

        {/* Floating Info Cards */}
        <div className="max-w-6xl mx-auto w-full px-4 pb-12 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, title: "Comissão Alta", desc: "Até 35% por fechamento" },
              { icon: Zap, title: "Mercado Livre", desc: "Economia real para o cliente" },
              { icon: Shield, title: "Sem Riscos", desc: "Apoiado por especialistas" },
              { icon: Users, title: "Leads Qualificados", desc: "Contas de alto potencial" }
            ].map((card, i) => (
              <Card key={i} className="bg-slate-900/60 border-slate-800/50 backdrop-blur-md shadow-xl hover:bg-slate-900/80 transition-colors">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#9e3ffd]/20 flex items-center justify-center mb-4">
                    <card.icon className="w-6 h-6 text-[#c88ff5]" />
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-400">{card.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
