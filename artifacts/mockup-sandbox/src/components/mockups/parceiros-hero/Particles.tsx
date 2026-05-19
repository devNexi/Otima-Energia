import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Building2, MapPin, TrendingUp, Handshake, ArrowRight } from 'lucide-react';

export function Particles() {
  // Generate a stable random network
  const network = useMemo(() => {
    const seed = (s: number) => () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
    const random = seed(42);
    
    const nodes = [];
    const numNodes = 60;
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        id: i,
        x: random() * 100,
        y: random() * 100,
        size: random() * 2 + 0.5,
        glow: random() > 0.8,
      });
    }
    
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = (nodes[i].y - nodes[j].y) * 1.5; // adjust for rough aspect ratio
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          if (random() > 0.3) {
            edges.push({ source: nodes[i], target: nodes[j], opacity: (1 - dist / 15) * 0.6 });
          }
        }
      }
    }
    return { nodes, edges };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col font-sans" style={{ backgroundColor: '#16163f' }}>
      <style>{`
        @keyframes particle-drift {
          0% { transform: translateY(0) scale(1.05); }
          50% { transform: translateY(-15px) scale(1.1); }
          100% { transform: translateY(0) scale(1.05); }
        }
        .animate-particle-bg {
          animation: particle-drift 40s ease-in-out infinite;
        }
        @keyframes node-pulse {
          0%, 100% { opacity: 0.4; r: 3; }
          50% { opacity: 0.8; r: 5; }
        }
        .animate-node-glow {
          animation: node-pulse 5s ease-in-out infinite alternate;
        }
      `}</style>
      
      {/* Particle Field Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="animate-particle-bg absolute inset-0 w-full h-full opacity-70">
          <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
            {network.edges.map((edge, i) => (
              <line
                key={`edge-${i}`}
                x1={`${edge.source.x}%`}
                y1={`${edge.source.y}%`}
                x2={`${edge.target.x}%`}
                y2={`${edge.target.y}%`}
                stroke="#c88ff5"
                strokeWidth="0.1"
                strokeOpacity={edge.opacity}
              />
            ))}
            {network.nodes.map(node => (
              <g key={`node-${node.id}`}>
                {node.glow && (
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r="4"
                    fill="#9e3ffd"
                    className="animate-node-glow"
                    style={{ animationDelay: `${(node.id % 5) * 0.7}s` }}
                    filter="blur(2px)"
                  />
                )}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={node.size / 5}
                  fill={node.glow ? "#fff" : "#c88ff5"}
                  opacity={node.glow ? 1 : 0.7}
                />
              </g>
            ))}
          </svg>
        </div>
        
        {/* Edge blending gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#16163f]/60 via-transparent to-[#16163f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#16163f]/80 via-transparent to-[#16163f]/80" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl">
          {["Dados reais", "Processo comercial", "Treinamento", "Suporte da Otima", "Zero ganho por recrutamento"].map(tag => (
            <Badge key={tag} variant="outline" className="bg-[#16163f]/60 text-[#c88ff5] border-[#9e3ffd]/40 backdrop-blur-md py-1.5 px-4 rounded-full font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-[#9e3ffd]" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Receba empresas com potencial
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#9e3ffd] to-[#c88ff5]">
               em energia.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium">
            Trabalhe contas reais. Ganhe até 35% de comissão por clientes convertidos.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 w-full">
          <Button size="lg" className="bg-[#9e3ffd] hover:bg-[#8b31e4] text-white px-10 py-7 text-lg rounded-full shadow-[0_0_40px_-10px_#9e3ffd] transition-all hover:scale-105 border-0">
            Candidatar-se
          </Button>
          <button className="text-white hover:text-[#c88ff5] font-semibold text-lg flex items-center transition-colors group">
            Ver como funciona <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Floating Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-auto pb-12">
          {[
            { icon: TrendingUp, title: "Comissão Alta", desc: "Até 35% por contrato fechado" },
            { icon: MapPin, title: "Cobertura Nacional", desc: "Atue em qualquer região" },
            { icon: Building2, title: "Foco B2B", desc: "Contas empresariais qualificadas" },
            { icon: Handshake, title: "Parceria Transparente", desc: "Acompanhamento em tempo real" }
          ].map((card, i) => (
            <Card key={i} className="bg-[#1a1a4a]/40 border-[#9e3ffd]/20 backdrop-blur-md overflow-hidden group hover:bg-[#1a1a4a]/70 transition-all hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9e3ffd]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#9e3ffd]/10 flex items-center justify-center mb-4">
                  <card.icon className="w-6 h-6 text-[#c88ff5]" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
