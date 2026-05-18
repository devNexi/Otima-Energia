import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Zap, MapPin, BarChart2, Users, TrendingUp, CheckCircle2, XCircle, ChevronRight, ArrowRight, Database, Target, FileText, Award, Star, Shield, Clock, DollarSign, Building2, Layers } from "lucide-react";
import logoIcon from "../assets/branding/logo-icon-transparent.png";

// ─── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── CTA Button ────────────────────────────────────────────────────────────────
function CtaButton({ text = "Aplicar para minha região", className = "", onClick }: { text?: string; className?: string; onClick?: () => void }) {
  const scrollToForm = () => {
    if (onClick) { onClick(); return; }
    document.getElementById("candidatura")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <button
      onClick={scrollToForm}
      className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${className}`}
      style={{ background: "linear-gradient(135deg, #9e3ffd 0%, #c88ff5 100%)", color: "#fff", boxShadow: "0 4px 24px rgba(158,63,253,0.35)" }}
    >
      {text} <ArrowRight className="w-4 h-4" />
    </button>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionTag({ text }: { text: string }) {
  return (
    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4" style={{ background: "rgba(158,63,253,0.12)", color: "#9e3ffd", border: "1px solid rgba(158,63,253,0.25)" }}>
      {text}
    </span>
  );
}

// ─── Partner levels data ───────────────────────────────────────────────────────
const LEVELS = [
  {
    num: 1, name: "Consultor de Economia de Energia", subtitle: "Iniciando a operação",
    leads: "25 leads/semana", faixa: "R$ 10k–R$ 30k/mês", comissao: "20%", reserva: "7 dias",
    foco: "Negócios locais com boa chance de qualificação", color: "#9e3ffd",
  },
  {
    num: 2, name: "Estrategista de Energia", subtitle: "Contas qualificadas comprovadas",
    leads: "50 leads/semana", faixa: "R$ 30k–R$ 75k/mês", comissao: "25%", reserva: "10 dias",
    foco: "Empresas maiores, melhores segmentos, maior potencial", color: "#3b82f6",
  },
  {
    num: 3, name: "Executivo de Contas", subtitle: "Alta performance",
    leads: "75 leads/semana", faixa: "R$ 50k–R$ 150k/mês", comissao: "30%", reserva: "14 dias",
    foco: "Oportunidades estratégicas e contas de maior valor", color: "#9e3ffd",
  },
  {
    num: 4, name: "Parceiro Regional", subtitle: "Comprovado regionalmente",
    leads: "100–150 leads/semana", faixa: "R$ 75k–R$ 250k+/mês", comissao: "35%", reserva: "21–30 dias",
    foco: "Campanhas regionais, segmentos estratégicos, oportunidades robustas", color: "#f59e0b",
  },
];

const REGIONS: { key: string; label: string; emoji: string; items: string[] }[] = [
  { key: "sudeste", label: "Sudeste", emoji: "🏙️", items: ["Supermercados médios", "Clínicas", "Condomínios", "Escolas privadas", "Eventos", "Oficinas grandes", "Hotéis urbanos"] },
  { key: "sul", label: "Sul", emoji: "⛵", items: ["Pousadas", "Padarias", "Distribuidores locais", "Oficinas", "Escolas", "Turismo regional", "Mercados"] },
  { key: "nordeste", label: "Nordeste", emoji: "🌊", items: ["Pousadas", "Beach clubs", "Restaurantes", "Eventos", "Mercados", "Turismo local", "Hotéis regionais"] },
  { key: "centro-oeste", label: "Centro-Oeste", emoji: "🌾", items: ["Churrascarias", "Mercados", "Oficinas", "Escolas privadas", "Distribuidores", "Negócios agro-adjacentes", "Clínicas"] },
  { key: "norte", label: "Norte", emoji: "🌿", items: ["Hotéis locais", "Mercados", "Clínicas", "Distribuidores", "Oficinas", "Serviços fluviais", "Negócios regionais de alto consumo"] },
];

// ─── Multi-step form ───────────────────────────────────────────────────────────
const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function PartnerForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [f1, setF1] = useState({ nome: "", whatsapp: "", email: "", estado: "", cidade: "", regiao: "" });
  const [f2, setF2] = useState({ vendeuB2b: "", experiencia: "", horas: "", rede: "" });
  const [f3, setF3] = useState({ c1: false, c2: false, c3: false, motivo: "" });

  const inp = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border";
  const inpStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" };

  const radioOpts = (name: string, opts: { val: string; label: string }[], value: string, onChange: (v: string) => void) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {opts.map(o => (
        <button key={o.val} type="button" onClick={() => onChange(o.val)}
          className="rounded-xl px-3 py-2.5 text-xs font-medium text-left transition-all duration-200"
          style={{
            background: value === o.val ? "rgba(158,63,253,0.18)" : "rgba(255,255,255,0.05)",
            border: value === o.val ? "1px solid #9e3ffd" : "1px solid rgba(255,255,255,0.1)",
            color: value === o.val ? "#9e3ffd" : "rgba(255,255,255,0.7)"
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  async function submit() {
    if (!f3.c1 || !f3.c2 || !f3.c3) { setError("Por favor confirme os três itens antes de enviar."); return; }
    if (!f3.motivo.trim()) { setError("Por favor explique por que quer ser Parceiro Otima."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f1, ...f2, ...f3 }),
      });
      if (!res.ok) throw new Error("Falha ao enviar candidatura.");
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-4 space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(158,63,253,0.15)", border: "1px solid rgba(158,63,253,0.3)" }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: "#9e3ffd" }} />
        </div>
        <h3 className="text-2xl font-bold text-white">Candidatura recebida.</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
          A equipe Otima analisará seu perfil, sua região e sua disponibilidade comercial. Se houver aderência, entraremos em contacto com os próximos passos.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: step >= n ? "100%" : "0%", background: "linear-gradient(90deg, #9e3ffd, #c88ff5)" }} />
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Dados básicos</h3>
          {[
            { label: "Nome completo", key: "nome", type: "text", ph: "Seu nome" },
            { label: "WhatsApp", key: "whatsapp", type: "tel", ph: "(21) 99999-9999" },
            { label: "E-mail", key: "email", type: "email", ph: "seu@email.com" },
            { label: "Cidade", key: "cidade", type: "text", ph: "Sua cidade" },
            { label: "Região onde pretende atuar", key: "regiao", type: "text", ph: "Ex: Grande São Paulo, Litoral RJ..." },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{field.label}</label>
              <input type={field.type} placeholder={field.ph} value={(f1 as any)[field.key]}
                onChange={e => setF1({ ...f1, [field.key]: e.target.value })}
                className={inp} style={inpStyle} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Estado</label>
            <select value={f1.estado} onChange={e => setF1({ ...f1, estado: e.target.value })} className={inp} style={{ ...inpStyle, appearance: "none" }}>
              <option value="">Selecione o estado</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button onClick={() => {
            if (!f1.nome || !f1.whatsapp || !f1.email || !f1.estado || !f1.cidade) return;
            setStep(2);
          }} className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all" style={{ background: "linear-gradient(135deg,#9e3ffd,#c88ff5)", color: "#fff" }}>
            Continuar <ChevronRight className="inline w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-white">Perfil comercial</h3>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Você já vendeu B2B?</label>
            {radioOpts("b2b", [{ val: "sim", label: "Sim" }, { val: "nao", label: "Não" }], f2.vendeuB2b, v => setF2({ ...f2, vendeuB2b: v }))}
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Qual sua experiência comercial?</label>
            {radioOpts("exp", [
              { val: "externas", label: "Vendas externas" }, { val: "consultoria", label: "Consultoria" },
              { val: "representacao", label: "Representação" }, { val: "corretagem", label: "Corretagem" },
              { val: "empreendedorismo", label: "Empreendedorismo" }, { val: "energia", label: "Energia" }, { val: "outro", label: "Outro" },
            ], f2.experiencia, v => setF2({ ...f2, experiencia: v }))}
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Horas por semana disponíveis</label>
            {radioOpts("horas", [{ val: "5-10", label: "5–10h" }, { val: "10-20", label: "10–20h" }, { val: "20+", label: "20h+" }], f2.horas, v => setF2({ ...f2, horas: v }))}
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Você tem rede local com empresários?</label>
            {radioOpts("rede", [{ val: "sim", label: "Sim" }, { val: "parcialmente", label: "Parcialmente" }, { val: "nao", label: "Ainda não" }], f2.rede, v => setF2({ ...f2, rede: v }))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>Voltar</button>
            <button onClick={() => { if (!f2.vendeuB2b || !f2.experiencia || !f2.horas || !f2.rede) return; setStep(3); }}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg,#9e3ffd,#c88ff5)", color: "#fff" }}>
              Continuar candidatura <ChevronRight className="inline w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-white">Confirmação e compromisso</h3>
          {[
            { key: "c1", label: "Entendo que a Otima não paga por recrutamento de novos parceiros." },
            { key: "c2", label: "Entendo que o foco é coletar contas de energia de empresas reais." },
            { key: "c3", label: "Entendo que existe mensalidade de R$ 297/mês e compromisso mínimo de 6 meses." },
          ].map(item => (
            <button key={item.key} type="button" onClick={() => setF3({ ...f3, [item.key]: !(f3 as any)[item.key] })}
              className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
              style={{ background: (f3 as any)[item.key] ? "rgba(158,63,253,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${(f3 as any)[item.key] ? "rgba(158,63,253,0.4)" : "rgba(255,255,255,0.1)"}` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: (f3 as any)[item.key] ? "#9e3ffd" : "rgba(255,255,255,0.08)", border: `1px solid ${(f3 as any)[item.key] ? "#9e3ffd" : "rgba(255,255,255,0.2)"}` }}>
                {(f3 as any)[item.key] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm" style={{ color: (f3 as any)[item.key] ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)" }}>{item.label}</span>
            </button>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Por que você quer ser Parceiro Otima?</label>
            <textarea rows={4} value={f3.motivo} onChange={e => setF3({ ...f3, motivo: e.target.value })} placeholder="Descreva sua motivação e o que te torna um bom candidato..."
              className={inp + " resize-none"} style={inpStyle} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>Voltar</button>
            <button onClick={submit} disabled={loading}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg,#9e3ffd,#c88ff5)", color: "#fff" }}>
              {loading ? "Enviando…" : "Enviar candidatura"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Parceiros() {
  const [activeLevel, setActiveLevel] = useState(0);
  const [activeRegion, setActiveRegion] = useState(0);

  const dark = "#16163f";
  const cardBg = "rgba(255,255,255,0.04)";
  const cardBorder = "1px solid rgba(255,255,255,0.09)";

  return (
    <div style={{ background: dark, color: "#fff", fontFamily: "Inter, system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 px-5 py-3 flex items-center justify-between" style={{ background: "rgba(22,22,63,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src={logoIcon} alt="Ótima Energia" className="h-7 w-auto" />
            <span className="font-bold text-white text-sm">Ótima Energia</span>
          </div>
        </Link>
        <button onClick={() => document.getElementById("candidatura")?.scrollIntoView({ behavior: "smooth" })}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: "linear-gradient(135deg,#9e3ffd,#c88ff5)", color: "#fff" }}>
          Candidatar-se
        </button>
      </header>

      {/* ── 1. HERO ── */}
      <section className="relative px-5 pt-20 pb-24 text-center overflow-hidden" style={{ background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(158,63,253,0.12) 0%, transparent 70%)" }}>
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(158,63,253,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(158,63,253,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(158,63,253,0.12)", border: "1px solid rgba(158,63,253,0.3)", color: "#9e3ffd" }}>
            <Zap className="w-3.5 h-3.5" /> Programa Nacional de Parceiros — Todos os estados do Brasil
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Receba empresas com potencial<br className="hidden sm:block" />
            <span style={{ background: "linear-gradient(135deg,#9e3ffd,#c88ff5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> em energia.</span>
          </h1>

          <p className="text-lg sm:text-xl mb-4 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Trabalhe contas reais. Ganhe <span style={{ color: "#c88ff5", fontWeight: 700 }}>até 35% de comissão</span> por clientes convertidos.
          </p>

          <p className="text-sm max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            A Otima opera um programa nacional com foco regional. Entregamos listas semanais de empresas locais com potencial de gasto relevante em energia. Você aborda os leads, coleta a conta e a Otima analisa a oportunidade.
          </p>

          {/* Key points */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Dados reais", "Processo comercial", "Treinamento", "Suporte da Otima", "Zero ganho por recrutamento"].map(p => (
              <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.06)", border: cardBorder, color: "rgba(255,255,255,0.7)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#9e3ffd" }} /> {p}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CtaButton />
            <button onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-medium flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Ver como funciona <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Candidaturas sujeitas à aprovação por perfil comercial e disponibilidade regional.
          </p>
        </div>

        {/* Floating cards */}
        <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MapPin, text: "Rio de Janeiro — 30 empresas liberadas", color: "#9e3ffd" },
            { icon: Building2, text: "Supermercado — conta estimada R$ 10k–R$ 30k/mês", color: "#c88ff5" },
            { icon: FileText, text: "Conta enviada — oportunidade em análise", color: "#9e3ffd" },
            { icon: DollarSign, text: "Cliente convertido — comissão recorrente elegível", color: "#f59e0b" },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-4 text-left" style={{ background: cardBg, border: cardBorder, backdropFilter: "blur(8px)" }}>
              <c.icon className="w-5 h-5 mb-2" style={{ color: c.color }} />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. PROBLEM ── */}
      <section className="px-5 py-20" style={{ background: "#1c1b4e" }}>
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionTag text="O problema" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Vender energia sem dados é <span style={{ color: "#9e3ffd" }}>começar no escuro.</span></h2>
          <p className="text-base mb-12 max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>
            Você pode ser ótimo em vendas e ainda assim perder semanas abordando as empresas erradas. Sem dados, sem lista, sem processo — sem saber quem realmente gasta energia suficiente para valer uma conversa.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="overflow-x-auto rounded-2xl" style={{ border: cardBorder }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  <th className="text-left px-5 py-3.5 font-semibold" style={{ color: "rgba(255,255,255,0.4)", width: "50%" }}>Antes da Otima</th>
                  <th className="text-left px-5 py-3.5 font-semibold" style={{ color: "#9e3ffd", width: "50%" }}>Com a Otima</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Procurar empresas manualmente", "Listas semanais de empresas locais"],
                  ["Ligar para qualquer negócio", "Segmentação por cidade e segmento"],
                  ["Perder tempo com contas pequenas", "Foco em empresas com potencial relevante"],
                  ["Não saber o potencial", "Faixa estimada de conta de energia"],
                  ["Trabalhar sem processo", "Scripts, treinamento e fluxo comercial"],
                  ["Depender só da própria rede", "Dados + execução local"],
                  ["Conversas soltas", "Conta enviada para análise da Otima"],
                ].map(([before, after], i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td className="px-5 py-3.5 flex items-start gap-2">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(255,80,80,0.6)" }} />
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>{before}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#9e3ffd" }} />
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{after}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
      </section>

      {/* ── 3. SOLUTION ── */}
      <section className="relative px-5 py-20 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src="/texture-electric.png" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55, mixBlendMode: "screen" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #16163f 0%, transparent 10%, transparent 90%, #16163f 100%)" }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionTag text="O que você recebe" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">A Otima te entrega uma <span style={{ color: "#9e3ffd" }}>base comercial para executar.</span></h2>
            <p className="text-base mb-12 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              Parceiros aprovados recebem listas semanais de empresas segmentadas por região, cidade, tipo de negócio e faixa estimada de conta de energia. Você não começa do zero. Você começa com direção.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Database, color: "#9e3ffd", title: "Leads semanais", desc: "Novas listas de empresas locais para trabalhar toda semana." },
              { icon: MapPin, color: "#3b82f6", title: "Segmentação regional", desc: "Estado, cidade, região e território comercial aprovado." },
              { icon: Building2, color: "#9e3ffd", title: "Tipo de negócio", desc: "Segmentação por categoria, segmento e perfil provável de consumo." },
              { icon: Target, color: "#ef4444", title: "Scripts e treinamento", desc: "Abordagem, qualificação, pedido da conta e processo de envio." },
              { icon: Award, color: "#9e3ffd", title: "Análise da Otima", desc: "A Otima avalia a conta, valida a oportunidade e define a melhor rota." },
              { icon: DollarSign, color: "#3b82f6", title: "Comissão recorrente", desc: "Você ganha quando o cliente converte e a Otima recebe." },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="rounded-2xl p-5 h-full transition-all duration-200 hover:scale-[1.02]" style={{ background: cardBg, border: cardBorder }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <h3 className="font-semibold mb-1.5 text-white">{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section id="como-funciona" className="px-5 py-20" style={{ background: "#16163f" }}>
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <SectionTag text="Como funciona" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">Como funciona o <span style={{ color: "#9e3ffd" }}>Programa de Parceiros Otima</span></h2>
        </Reveal>

        <div className="space-y-0">
          {[
            { num: 1, title: "Escolha sua área", desc: "Você trabalha uma cidade, região, estado ou território comercial aprovado. A Otima opera nacionalmente, com foco regional, cobrindo todos os estados do Brasil." },
            { num: 2, title: "Receba empresas toda semana", desc: "Parceiros aprovados recebem uma nova lista de empresas para trabalhar, com cidade, segmento, faixa estimada de conta e prioridade comercial." },
            { num: 3, title: "Fale com as empresas", desc: "Você liga, manda mensagem, visita ou usa sua rede local. O objetivo é abrir conversa com o decisor e identificar se a empresa tem conta de energia relevante." },
            { num: 4, title: "Colete a conta de energia", desc: "A conta é o ponto-chave. Nome não basta. Telefone não basta. A conta de energia é o documento que transforma um contacto em oportunidade real." },
            { num: 5, title: "A Otima analisa", desc: "A Otima analisa a conta, valida o potencial e identifica a melhor rota comercial. O parceiro não precisa ser engenheiro de energia — precisa saber abrir portas e seguir o processo." },
            { num: 6, title: "O cliente recebe uma proposta", desc: "Quando faz sentido, a Otima avança com a proposta comercial para o cliente." },
            { num: 7, title: "Você ganha comissão recorrente", desc: "Se o cliente assina, converte e a Otima recebe, você ganha comissão conforme seu nível de parceiro." },
          ].map((step, i) => (
            <Reveal key={step.num} delay={i * 50}>
              <div className="flex gap-5 pb-8 relative">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10" style={{ background: "linear-gradient(135deg,#9e3ffd,#c88ff5)", color: "#fff" }}>
                    {step.num}
                  </div>
                  {i < 6 && <div className="w-0.5 flex-1 mt-2" style={{ background: "rgba(158,63,253,0.2)" }} />}
                </div>
                <div className="pb-2">
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}><div className="mt-4"><CtaButton text="Começar candidatura" /></div></Reveal>
      </div>
      </section>

      {/* ── 5. IMPACT ── */}
      <section className="relative px-5 py-24 text-center overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src="/texture-wave1.png" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.07 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #16163f 0%, transparent 10%, transparent 90%, #16163f 100%)" }} />
        </div>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-10" style={{ color: "rgba(255,255,255,0.95)" }}>
              A Otima mostra onde mirar.<br />
              <span style={{ color: "#9e3ffd" }}>Você abre a conversa.</span><br />
              A conta valida a oportunidade.<br />
              <span style={{ color: "#c88ff5" }}>A comissão vem do cliente convertido.</span>
            </p>
            <CtaButton text="Aplicar para minha região" />
          </Reveal>
        </div>
      </section>

      {/* ── 6. NOT A PYRAMID ── */}
      <section className="px-5 py-20" style={{ background: "#1c1b4e" }}>
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionTag text="Modelo B2B real" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Isto não é pirâmide. <span style={{ color: "#9e3ffd" }}>E nunca será.</span></h2>
          <p className="text-base mb-4 max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>
            Vamos ser directos. Na Otima, você não ganha dinheiro recrutando pessoas. Você não precisa montar equipe. Você não ganha por trazer novos parceiros para o programa.
          </p>
          <p className="text-base mb-10 max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>
            A remuneração vem de resultado comercial real: empresas qualificadas, contas de energia válidas, oportunidades analisadas, clientes convertidos, receita recebida.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="overflow-x-auto rounded-2xl" style={{ border: cardBorder }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  <th className="text-left px-5 py-3.5 font-semibold" style={{ color: "rgba(255,100,100,0.8)", width: "50%" }}>Modelos comuns no mercado</th>
                  <th className="text-left px-5 py-3.5 font-semibold" style={{ color: "#9e3ffd", width: "50%" }}>Otima</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Ganho por recrutar pessoas", "Ganho por clientes reais convertidos"],
                  ["Promessa de renda fácil", "Processo comercial B2B"],
                  ["\"Monte sua rede\"", "Trabalhe empresas com potencial"],
                  ["Motivação sem ferramenta", "Dados, scripts e treinamento"],
                  ["Vende sonho", "Entrega operação"],
                  ["Foco em novos membros", "Foco em contas de energia"],
                  ["Discurso de oportunidade", "Execução comercial mensurável"],
                ].map(([bad, good], i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td className="px-5 py-3.5"><span style={{ color: "rgba(255,120,120,0.7)" }}>{bad}</span></td>
                    <td className="px-5 py-3.5"><span style={{ color: "rgba(255,255,255,0.8)" }}>{good}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={150}><div className="mt-10"><CtaButton text="Quero uma oportunidade séria" /></div></Reveal>
      </div>
      </section>

      {/* ── 7. ENERGY BILL ── */}
      <section className="px-5 py-20" style={{ background: "rgba(200,143,245,0.07)", borderTop: "1px solid rgba(200,143,245,0.12)", borderBottom: "1px solid rgba(200,143,245,0.12)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <SectionTag text="O ponto de validação" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">A conta de energia é <span style={{ color: "#9e3ffd" }}>o que importa.</span></h2>
            <p className="text-base mb-6 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
              No mercado de energia, conversa não paga comissão. O que transforma uma abordagem em oportunidade é uma conta de energia válida. Quando você coleta e envia para a Otima, conseguimos analisar, validar e avançar para a proposta.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-10">
              <div className="rounded-2xl px-8 py-6" style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)" }}>
                <p className="text-lg font-bold" style={{ color: "rgba(255,120,120,0.9)" }}>Sem conta,</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>é contacto.</p>
              </div>
              <ArrowRight className="w-6 h-6 rotate-90 sm:rotate-0" style={{ color: "rgba(255,255,255,0.2)" }} />
              <div className="rounded-2xl px-8 py-6" style={{ background: "rgba(158,63,253,0.1)", border: "1px solid rgba(158,63,253,0.3)" }}>
                <p className="text-lg font-bold" style={{ color: "#9e3ffd" }}>Com conta,</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>vira oportunidade.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 8. LEAD MOCKUP ── */}
      <section className="px-5 py-20" style={{ background: "#16163f" }}>
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionTag text="Exemplo de lista de leads" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Veja o tipo de informação que <span style={{ color: "#9e3ffd" }}>orienta sua prospecção.</span></h2>
          <p className="text-base mb-10 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            Parceiros aprovados recebem listas organizadas para ajudar a priorizar a execução comercial.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="overflow-x-auto rounded-2xl" style={{ border: cardBorder }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {["Empresa", "Cidade", "Segmento", "Conta estimada", "Prioridade"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supermercado Exemplo", "Niterói", "Mercado", "R$ 10k–R$ 30k/mês", "Alta"],
                  ["Hotel Exemplo", "Cabo Frio", "Hotel", "R$ 30k–R$ 75k/mês", "Média"],
                  ["Clínica Exemplo", "Petrópolis", "Clínica", "R$ 10k–R$ 30k/mês", "Alta"],
                  ["Escola Exemplo", "Campinas", "Escola privada", "R$ 30k–R$ 75k/mês", "Alta"],
                  ["Condomínio Exemplo", "Curitiba", "Condomínio", "R$ 10k–R$ 30k/mês", "Média"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td className="px-4 py-3 font-medium text-white">{row[0]}</td>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{row[1]}</td>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{row[2]}</td>
                    <td className="px-4 py-3" style={{ color: "#9e3ffd" }}>{row[3]}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: row[4] === "Alta" ? "rgba(158,63,253,0.15)" : "rgba(200,143,245,0.15)", color: row[4] === "Alta" ? "#9e3ffd" : "#3b82f6" }}>{row[4]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
            Exemplo visual. Dados reais são liberados apenas para parceiros aprovados.
          </p>
        </Reveal>
      </div>
      </section>

      {/* ── 9. BRAZIL MAP / REGIONS ── */}
      <section className="px-5 py-20" style={{ background: "#1c1b4e", borderTop: "1px solid rgba(200,143,245,0.1)", borderBottom: "1px solid rgba(200,143,245,0.1)" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionTag text="Operação nacional" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Uma operação nacional com <span style={{ color: "#3b82f6" }}>execução regional.</span></h2>
            <p className="text-base mb-10 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              A Otima opera em todos os estados do Brasil, mas a prospecção acontece onde a confiança comercial nasce: na região, na cidade, no contacto local.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 mb-6">
            {REGIONS.map((r, i) => (
              <button key={r.key} onClick={() => setActiveRegion(i)}
                className="px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: activeRegion === i ? "rgba(158,63,253,0.15)" : cardBg,
                  border: activeRegion === i ? "1px solid rgba(158,63,253,0.4)" : cardBorder,
                  color: activeRegion === i ? "#9e3ffd" : "rgba(255,255,255,0.6)",
                }}>
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          <Reveal>
            <div className="rounded-2xl p-6" style={{ background: cardBg, border: cardBorder }}>
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4" style={{ color: "#9e3ffd" }} />
                <span className="font-semibold text-white">Segmentos prioritários — {REGIONS[activeRegion].label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {REGIONS[activeRegion].items.map(item => (
                  <span key={item} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(158,63,253,0.08)", border: "1px solid rgba(158,63,253,0.2)", color: "rgba(255,255,255,0.75)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 10. PARTNER LEVELS ── */}
      <section className="px-5 py-20" style={{ background: "#16163f" }}>
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionTag text="Níveis de parceiro" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Quanto melhor você performa, <span style={{ color: "#9e3ffd" }}>melhores ficam suas oportunidades.</span></h2>
          <p className="text-base mb-10 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            Na Otima, você não cresce por discurso. Você cresce por resultado. A progressão acontece com base em execução comercial, contas enviadas e clientes convertidos.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {LEVELS.map((lvl, i) => (
            <Reveal key={lvl.num} delay={i * 60}>
              <button onClick={() => setActiveLevel(i)} className="w-full rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: activeLevel === i ? `${lvl.color}12` : cardBg,
                  border: activeLevel === i ? `1px solid ${lvl.color}50` : cardBorder,
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 font-bold text-sm" style={{ background: `${lvl.color}20`, color: lvl.color }}>
                  {lvl.num}
                </div>
                <p className="font-semibold text-white text-sm mb-0.5">{lvl.name}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lvl.subtitle}</p>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-5" style={{ background: `${LEVELS[activeLevel].color}08`, border: `1px solid ${LEVELS[activeLevel].color}25` }}>
            {[
              { label: "Leads semanais", value: LEVELS[activeLevel].leads },
              { label: "Conta estimada", value: LEVELS[activeLevel].faixa },
              { label: "Comissão", value: LEVELS[activeLevel].comissao },
              { label: "Reserva do lead", value: LEVELS[activeLevel].reserva },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: LEVELS[activeLevel].color }}>{item.value}</p>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Foco comercial</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>{LEVELS[activeLevel].foco}</p>
            </div>
          </div>
        </Reveal>
      </div>
      </section>

      {/* ── 11. PROGRESSION ── */}
      <section className="px-5 py-20" style={{ background: "#1c1b4e", borderTop: "1px solid rgba(158,63,253,0.12)", borderBottom: "1px solid rgba(158,63,253,0.12)" }}>
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <SectionTag text="Progressão" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Mais acesso vem de <span style={{ color: "#9e3ffd" }}>resultado, não de conversa.</span></h2>
            <p className="text-base mb-12 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              Na Otima, listas melhores não são liberadas porque alguém diz que "ligou bastante". Atividade importa. Mas o que aumenta seu acesso é produção verificável.
            </p>
          </Reveal>

          <div className="space-y-2">
            {["Trabalha os leads", "Coleta contas", "Envia oportunidades", "A Otima analisa", "Clientes convertem", "O parceiro ganha comissão", "O acesso pode aumentar"].map((step, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="flex items-center gap-4 p-4 rounded-xl transition-all" style={{ background: cardBg, border: cardBorder }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: `rgba(158,63,253,${0.15 + i * 0.08})`, color: "#9e3ffd" }}>{i + 1}</div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{step}</span>
                  {i < 6 && <ChevronRight className="ml-auto w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} />}
                  {i === 6 && <Star className="ml-auto w-4 h-4" style={{ color: "#f59e0b" }} />}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="text-2xl font-bold mt-10 text-center" style={{ color: "rgba(255,255,255,0.9)" }}>
              Traga contas. Gere oportunidades. <span style={{ color: "#9e3ffd" }}>Cresça por performance.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 12 & 13. FOR WHO / NOT FOR ── */}
      <section className="px-5 py-20" style={{ background: "#16163f" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Reveal>
            <div className="rounded-2xl p-7 h-full" style={{ background: "rgba(158,63,253,0.05)", border: "1px solid rgba(158,63,253,0.15)" }}>
              <SectionTag text="Para quem é" />
              <h3 className="text-2xl font-bold mb-4 text-white">Este programa é para quem <span style={{ color: "#9e3ffd" }}>sabe executar.</span></h3>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>Você pode ser um bom perfil se já fala com empresários, síndicos, lojistas, administradores, gestores ou donos de negócios.</p>
              <ul className="space-y-2">
                {["Consultores comerciais", "Vendedores autônomos", "Representantes comerciais", "Corretores", "Empreendedores locais", "Ex-gerentes comerciais", "Profissionais com rede empresarial", "Quem já vende B2B ou quer vender com processo"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#9e3ffd" }} /> {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.4)" }}>Você não precisa ser especialista em energia. Mas precisa saber abrir conversa, pedir a conta e seguir um processo comercial.</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl p-7 h-full" style={{ background: "rgba(255,80,80,0.04)", border: "1px solid rgba(255,80,80,0.15)" }}>
              <SectionTag text="Para quem não é" />
              <h3 className="text-2xl font-bold mb-4 text-white">Este programa não é para <span style={{ color: "rgba(255,120,120,0.9)" }}>todo mundo.</span></h3>
              <ul className="space-y-2">
                {[
                  "Quem quer renda passiva sem trabalhar",
                  "Quem quer ganhar recrutando pessoas",
                  "Quem quer receber leads e não executar",
                  "Quem procura dinheiro fácil",
                  "Quem não consegue seguir processo",
                  "Quem espera resultado sem actividade comercial",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,100,100,0.7)" }} /> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm font-medium text-white">A Otima entrega a estrutura.</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Você coloca o processo em movimento.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      </section>

      {/* ── 14. OFFER ── */}
      <section className="px-5 py-20" style={{ background: "linear-gradient(135deg,rgba(158,63,253,0.07) 0%,rgba(200,143,245,0.07) 100%)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <SectionTag text="A oferta" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Torne-se Parceiro <span style={{ color: "#9e3ffd" }}>Comercial Otima</span></h2>
            <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Acesse uma estrutura de prospecção B2B para trabalhar empresas com potencial de economia em energia.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl p-8 text-left max-w-xl mx-auto" style={{ background: cardBg, border: cardBorder }}>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-bold text-white">R$ 297</span>
                <span className="text-base mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>/mês · compromisso mínimo de 6 meses</span>
              </div>

              <div className="space-y-2 mb-8">
                {["Listas semanais de empresas locais", "Segmentação por cidade e estado", "Segmentação por tipo de negócio", "Estimativa de faixa de conta de energia", "Prioridade comercial", "Scripts de abordagem", "Treinamento inicial", "Processo de envio de contas", "Análise da Otima", "Elegibilidade para comissão recorrente", "Progressão por performance", "Suporte comercial da Otima"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#9e3ffd" }} /> {item}
                  </div>
                ))}
              </div>

              <CtaButton text="Aplicar para ser Parceiro Otima" className="w-full justify-center" />
              <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>Candidaturas sujeitas à aprovação por região, perfil comercial e disponibilidade de território.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 15. WHY SUBSCRIPTION ── */}
      <section className="px-5 py-20" style={{ background: "#1c1b4e" }}>
      <div className="max-w-3xl mx-auto text-center">
        <Reveal>
          <SectionTag text="Por que existe mensalidade" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Você não está pagando por motivação. <span style={{ color: "#9e3ffd" }}>Está acessando um sistema comercial.</span></h2>
          <p className="text-base mb-6 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Dados bons custam dinheiro. A Otima investe em tecnologia, segmentação, enriquecimento de dados, organização regional, distribuição semanal, treinamento e análise de oportunidades.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
            {["Você não paga para recrutar pessoas.", "Você não paga por uma promessa de renda.", "Você acessa uma operação comercial real."].map(t => (
              <div key={t} className="rounded-xl px-4 py-3" style={{ background: cardBg, border: cardBorder, color: "rgba(255,255,255,0.65)" }}>{t}</div>
            ))}
          </div>
        </Reveal>
      </div>
      </section>

      {/* ── 16. FINAL CTA + FORM ── */}
      <section id="candidatura" className="relative px-5 py-20 overflow-hidden" style={{ borderTop: "1px solid rgba(158,63,253,0.12)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src="/texture-wave2.png" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.06 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #16163f 0%, transparent 10%, transparent 90%, #16163f 100%)" }} />
        </div>
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <SectionTag text="Candidatura" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronto para trabalhar oportunidades <span style={{ color: "#9e3ffd" }}>reais de energia?</span></h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                Sem pirâmide. Sem promessa falsa. Sem começar do zero.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl p-7 sm:p-9" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <PartnerForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src={logoIcon} alt="Ótima Energia" className="h-6 w-auto" />
          <span className="font-bold text-white text-sm">Ótima Energia</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Link href="/privacy"><span className="hover:text-white transition-colors cursor-pointer">Privacidade</span></Link>
          <Link href="/terms"><span className="hover:text-white transition-colors cursor-pointer">Termos</span></Link>
          <Link href="/"><span className="hover:text-white transition-colors cursor-pointer">Ótima Energia</span></Link>
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>© 2025 Ótima Energia. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
