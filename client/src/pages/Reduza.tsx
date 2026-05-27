import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload, CheckCircle, CheckCircle2, ArrowRight, Shield, X, ChevronDown,
  Search, MessageSquare, TrendingDown, Building2, Sparkles,
  Mail, Phone, Clock, Map, BarChart2, Linkedin, Instagram,
} from "lucide-react";
import logoFull from "@/assets/branding/logo-full-large.png";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";
import HeroBackground from "@/components/HeroBackground";

declare global {
  interface Window { gtag?: (...args: any[]) => void; dataLayer?: any[]; }
}

// ─── Brand tokens ───────────────────────────────────────────────────────────
const BRAND = "#9e3ffd";

// ─── Data ───────────────────────────────────────────────────────────────────
const ESTADOS = [
  { v: "SP", l: "São Paulo" }, { v: "MG", l: "Minas Gerais" },
  { v: "RJ", l: "Rio de Janeiro" }, { v: "PR", l: "Paraná" },
  { v: "RS", l: "Rio Grande do Sul" }, { v: "SC", l: "Santa Catarina" },
  { v: "BA", l: "Bahia" }, { v: "GO", l: "Goiás" },
  { v: "DF", l: "Distrito Federal" }, { v: "ES", l: "Espírito Santo" },
  { v: "PE", l: "Pernambuco" }, { v: "CE", l: "Ceará" },
  { v: "MT", l: "Mato Grosso" }, { v: "MS", l: "Mato Grosso do Sul" },
  { v: "PA", l: "Pará" }, { v: "MA", l: "Maranhão" },
  { v: "PB", l: "Paraíba" }, { v: "RN", l: "Rio Grande do Norte" },
  { v: "AL", l: "Alagoas" }, { v: "SE", l: "Sergipe" },
  { v: "PI", l: "Piauí" }, { v: "AM", l: "Amazonas" },
  { v: "TO", l: "Tocantins" },
  // ⚠️ AC, AP, RR, RO omitted — not covered
];

const TIPOS_NEGOCIO = [
  "Indústria", "Supermercado / Varejo Alimentício", "Comércio / Varejo",
  "Hotel / Resort / Pousada", "Clínica / Hospital", "Escola / Faculdade",
  "Condomínio Comercial", "Condomínio Residencial", "Shopping / Centro Comercial",
  "Centro de Distribuição / Galpão", "Lavanderia / Frigorífico",
  "Escritório / Serviços", "Outro",
];

const VALORES_CONTA = [
  "R$ 5.000 a R$ 10.000", "R$ 10.000 a R$ 30.000",
  "R$ 30.000 a R$ 80.000", "Mais de R$ 80.000",
  "Menos de R$ 5.000 (caso especial)",
];

const TRUST_BADGES = [
  { icon: <CheckCircle2 className="h-6 w-6" />, title: "100% grátis para sua empresa", sub: "Sem taxa, mensalidade ou comissão." },
  { icon: <Sparkles className="h-6 w-6" />, title: "Não é energia solar", sub: "Sem placas, painel ou inversor." },
  { icon: <Shield className="h-6 w-6" />, title: "Sem trocar de distribuidora", sub: "Você mantém sua distribuidora atual." },
  { icon: <Building2 className="h-6 w-6" />, title: "Sem obra na empresa", sub: "Sem instalação ou intervenção física." },
  { icon: <TrendingDown className="h-6 w-6" />, title: "Pago pelos fornecedores", sub: "Comissão dos parceiros, não de você." },
  { icon: <Search className="h-6 w-6" />, title: "Análise por especialista", sub: "Engenheiros e analistas energéticos." },
];

const STEPS = [
  { icon: <Upload className="h-6 w-6" />, title: "Você envia sua última conta de luz", desc: "Em segundos, pelo celular ou computador. Aceitamos PDF ou foto." },
  { icon: <Search className="h-6 w-6" />, title: "Especialista analisa seu perfil", desc: "Verificamos sua distribuidora, consumo e o desconto disponível na sua região." },
  { icon: <MessageSquare className="h-6 w-6" />, title: "Você recebe sua proposta", desc: "Análise enviada por WhatsApp ou email em até 24 horas úteis. Sem compromisso." },
  { icon: <TrendingDown className="h-6 w-6" />, title: "Desconto direto na sua conta", desc: "Aprovou? O desconto começa a aparecer na sua próxima fatura. Você não muda nada." },
];

const STATS = [
  { icon: <Map className="h-7 w-7" />, stat: "23", label: "Estados atendidos no Brasil" },
  { icon: <BarChart2 className="h-7 w-7" />, stat: "Até 25%", label: "Desconto possível na conta de luz" },
  { icon: <Clock className="h-7 w-7" />, stat: "24h", label: "Resposta da análise gratuita" },
];

const FAQ_ITEMS = [
  {
    q: "Como a Ótima ganha dinheiro se o serviço é grátis?",
    a: "Somos pagos pelos fornecedores parceiros de Geração Distribuída quando intermediamos uma economia. O custo nunca é repassado para sua empresa. Você apenas recebe o desconto direto na conta de luz.",
  },
  {
    q: "Isso é energia solar? Preciso instalar placas na minha empresa?",
    a: "Não. Geração Distribuída não exige a instalação de placa solar, painel, inversor ou qualquer equipamento na sua empresa. A energia já é gerada por usinas parceiras, e os créditos abatem diretamente sua conta de luz. Sua operação não muda em nada.",
  },
  {
    q: "Vou precisar trocar de distribuidora ou mudar de contrato?",
    a: "Não. Você mantém sua distribuidora atual — não há mudança de contrato com a concessionária, nem religação, nem obra na sua empresa. O desconto aparece direto na sua fatura.",
  },
  {
    q: "Em quanto tempo começo a economizar?",
    a: "Após análise e aprovação do contrato, o desconto costuma aparecer entre 30 e 60 dias na sua fatura, dependendo do ciclo de leitura da sua distribuidora.",
  },
  {
    q: "Tem multa se eu quiser sair do contrato?",
    a: "Os contratos de GD têm prazo de fidelidade que varia por fornecedor e região. Nosso especialista vai te apresentar as condições com clareza antes de qualquer assinatura. Você só assina se fizer sentido para sua empresa.",
  },
  {
    q: "Minha empresa qualifica?",
    a: "Atendemos empresas em 23 estados do Brasil. A elegibilidade depende da sua distribuidora, perfil de consumo e localização. Envie sua conta e analisamos sem compromisso — você só descobre se vale a pena enviando.",
  },
  {
    q: "Como vocês usam minha conta de luz?",
    a: "Sua fatura é usada exclusivamente para análise técnica de economia. Não compartilhamos com terceiros que não sejam fornecedores parceiros relevantes para preparar sua proposta. Veja nossa Política de Privacidade para detalhes.",
  },
  {
    q: "Quais distribuidoras vocês atendem?",
    a: "Trabalhamos com as principais distribuidoras do Brasil. Envie sua conta e confirmamos a cobertura na sua região em até 24 horas.",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function scrollToForm(e?: React.MouseEvent) {
  e?.preventDefault();
  document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
}

function fireEvent(name: string, params?: Record<string, any>) {
  try {
    if (window.gtag) window.gtag("event", name, params || {});
    else if (window.dataLayer) window.dataLayer.push({ event: name, ...params });
  } catch {}
}

function captureUTMs() {
  const p = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"];
  const utms: Record<string, string> = {};
  keys.forEach(k => {
    const v = p.get(k);
    if (v) {
      utms[k] = v;
      sessionStorage.setItem(`otima_${k}`, v);
    }
  });
  return utms;
}

function getUTMsFromSession() {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"];
  const utms: Record<string, string> = {};
  keys.forEach(k => { utms[k] = sessionStorage.getItem(`otima_${k}`) || ""; });
  return utms;
}

// ─── Form schema ─────────────────────────────────────────────────────────────
const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório").refine(
    v => v.trim().split(/\s+/).length >= 2, "Informe nome e sobrenome"
  ),
  empresa: z.string().min(2, "Empresa obrigatória"),
  email: z.string().email("Email inválido"),
  phone: z.string().refine(v => v.replace(/\D/g, "").length === 11, "Informe DDD + 9 dígitos"),
  estado: z.string().min(1, "Estado obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  tipoNegocio: z.string().min(1, "Tipo de negócio obrigatório"),
  valorConta: z.string().min(1, "Selecione a faixa da conta"),
  lgpd: z.boolean().refine(v => v === true, "Você precisa aceitar para continuar"),
  honeypot: z.string().max(0),
});
type FormValues = z.infer<typeof schema>;

// ─── Component ───────────────────────────────────────────────────────────────
export default function Reduza() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [skipBillAcknowledged, setSkipBillAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Pre-expand the #1 trust objection question by default
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formStarted, setFormStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lgpd: false, honeypot: "" },
  });

  const lgpdValue = watch("lgpd");

  useEffect(() => {
    captureUTMs();
    fireEvent("page_view");
  }, []);

  const handleFormFocus = () => {
    if (!formStarted) { setFormStarted(true); fireEvent("form_start"); }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setValue("phone", masked, { shouldValidate: formStarted });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) { setUploadError("Arquivo inválido. Envie PDF, JPG ou PNG."); return; }
    if (f.size > 10 * 1024 * 1024) { setUploadError("Arquivo muito grande. Máximo 10 MB."); return; }
    setFile(f);
    setUploadError(null);
    setShowSkipOption(false);
    // NOTE: bill_upload_added is intentionally NOT fired here.
    // It fires in onSubmit after the server confirms the upload succeeded.
  };

  const onSubmit = async (data: FormValues) => {
    if (data.honeypot) return;
    if (!file && !skipBillAcknowledged) {
      setUploadError("Envie sua conta ou confirme que entende que a análise será simplificada.");
      document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const utms = getUTMsFromSession();
      const fd = new FormData();
      fd.append("nome", data.nome);
      fd.append("empresa", data.empresa);
      fd.append("email", data.email);
      fd.append("phone", data.phone);
      fd.append("estado", data.estado);
      fd.append("cidade", data.cidade);
      fd.append("tipoImovel", data.tipoNegocio);
      fd.append("valorConta", data.valorConta);
      fd.append("landingPageUrl", window.location.href);
      fd.append("referrer", document.referrer);
      fd.append("userAgent", navigator.userAgent);
      Object.entries(utms).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("bill", file);

      const res = await fetch("/api/landing/submit", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Erro ao enviar formulário");

      const isCasoEspecial = data.valorConta === "Menos de R$ 5.000 (caso especial)";
      const tipo = isCasoEspecial ? "caso-especial" : file ? "completo" : "sem-conta";

      // bill_upload_added fires here — only after the server has confirmed the
      // bill was received and saved (not on file-field interaction).
      if (file) {
        fireEvent("bill_upload_added", { file_type: file.type });
      }

      const firstName = encodeURIComponent(data.nome.trim().split(/\s+/)[0]);
      window.location.href = `/obrigado?tipo=${tipo}&nome=${firstName}`;

    } catch (err: any) {
      setSubmitError(err.message || "Erro inesperado. Tente novamente.");
      fireEvent("form_error", { error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Field classes ────────────────────────────────────────────────────────
  const inputCls = (hasError: boolean) =>
    `w-full rounded-lg px-3 py-3 text-base text-gray-900 border ${hasError ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-purple-600"} focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-colors`;
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
  const errCls = "text-red-600 text-xs mt-1";

  // ── CTA Button ────────────────────────────────────────────────────────────
  const PrimaryBtn = ({ onClick, className = "" }: { onClick?: (e: React.MouseEvent) => void; className?: string }) => (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-semibold text-white rounded-lg transition-all ${className}`}
      style={{ background: BRAND }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.9)"; e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(158,63,253,0.45)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      Receber minha análise gratuita <ArrowRight className="h-5 w-5" />
    </button>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">

      {/* ── Section 0: Sticky Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200" style={{ height: 64 }}>
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <a href="/">
            <img src={logoFull} alt="Ótima Energia" className="h-10 w-auto" />
          </a>
          <button
            onClick={scrollToForm}
            className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition-all"
            style={{ background: BRAND }}
            onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.9)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "")}
            data-testid="header-cta"
          >
            <span className="hidden sm:inline">Solicitar análise grátis</span>
            <span className="sm:hidden">Análise grátis</span>
          </button>
        </div>
      </header>

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section
        className="relative text-white py-16 md:py-24 px-4 overflow-hidden"
        style={{ background: "#09081e" }}
      >
        {/* WebGL smoke bg */}
        <div className="absolute inset-0">
          <HeroBackground />
        </div>
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(9,8,30,0.72) 0%, rgba(9,8,30,0.55) 50%, rgba(9,8,30,0.70) 100%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-5 gap-10 items-center">
          {/* Left 3/5 */}
          <div className="md:col-span-3">
            <p className="text-sm md:text-base font-semibold mb-4 tracking-wide" style={{ color: "#FBBF24" }}>
              PARA EMPRESAS COM CONTA DE LUZ A PARTIR DE R$ 5.000/MÊS
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              Desconto direto na conta de luz da sua empresa.
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-2 max-w-xl font-medium">
              Receba até 25% de desconto na conta de energia da sua empresa.
            </p>
            <p className="text-base md:text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
              Sem custo, sem obra, sem trocar de distribuidora. Você economiza, a Ótima é paga pelos fornecedores parceiros.
            </p>
            <PrimaryBtn onClick={scrollToForm} className="text-lg px-7 py-4 shadow-lg mb-5 w-full sm:w-auto" />
            <p className="text-sm text-white/55 flex flex-wrap gap-x-4 gap-y-1">
              <span>✓ 100% grátis para sua empresa</span>
              <span>✓ Não é energia solar</span>
              <span>✓ Análise por especialista</span>
            </p>
          </div>

          {/* Right 2/5 — WebGL card with result callout (desktop only) */}
          <div className="md:col-span-2 hidden md:flex justify-center">
            <div
              className="relative rounded-2xl overflow-hidden w-full max-w-sm"
              style={{ minHeight: 420, border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {/* Inner canvas — re-uses WebGL but as a contained card */}
              <div className="absolute inset-0">
                <HeroBackground />
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(9,8,30,0.15) 0%, rgba(9,8,30,0.72) 55%, rgba(9,8,30,0.88) 100%)" }} />
              <div className="absolute inset-0 flex flex-col px-7 pt-12 pb-7 text-white">
                {/* Label pinned to top */}
                <p className="text-white/55 text-xs font-semibold uppercase tracking-widest">Exemplo de resultado</p>
                {/* Spacer pushes stats to the bottom */}
                <div className="flex-1" />
                {/* Stats at bottom */}
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-white/55">Conta atual</p>
                  <p className="text-3xl font-bold text-white">R$ 10.000<span className="text-base font-normal text-white/50">/mês</span></p>
                </div>
                <div className="h-px mb-4" style={{ background: "rgba(255,255,255,0.12)" }} />
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-white/55">Economia possível</p>
                  <p className="text-2xl font-bold" style={{ color: "#A3E635" }}>
                    até R$ 2.500<span className="text-base font-normal text-white/50">/mês</span>
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-white/75 mb-4">
                  {["Sem custo", "Sem obra", "Sem trocar de distribuidora"].map(t => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#A3E635" }} />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-white/30 italic">* Valores ilustrativos. Análise real feita por especialista.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint — subtle pulse, no bounce */}
        <div className="relative z-10 hidden md:flex justify-center mt-10">
          <button
            onClick={scrollToForm}
            className="text-white/35 hover:text-white/60 transition-colors"
            aria-label="Rolar para o formulário"
            style={{ animation: "pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite" }}
          >
            <ChevronDown className="h-7 w-7" />
          </button>
        </div>
      </section>

      {/* ── Section 2: Trust bar ──────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {TRUST_BADGES.map((b, i) => (
            <div key={i} className="flex flex-col items-start gap-2.5">
              <div
                className="rounded-full p-2.5 flex items-center justify-center"
                style={{ background: "#F3F4F6", color: BRAND }}
              >
                {b.icon}
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{b.title}</p>
              <p className="text-xs text-slate-400 leading-snug">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: How it works ───────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-slate-900">
            Como funciona
          </h2>
          <p className="text-center text-slate-500 text-lg mb-12">
            Quatro passos. Sem complicação. Sem custo para você.
          </p>

          {/* Steps with connector line */}
          <div className="relative">
            {/* Desktop horizontal connector — dotted line at icon-center height */}
            <div
              className="hidden md:block absolute"
              style={{
                top: 28,
                left: "calc(12.5% + 28px)",
                right: "calc(12.5% + 28px)",
                height: 1,
                backgroundImage: `repeating-linear-gradient(90deg, rgba(158,63,253,0.35) 0px, rgba(158,63,253,0.35) 6px, transparent 6px, transparent 14px)`,
              }}
            />
            {/* Mobile vertical connector */}
            <div
              className="md:hidden absolute left-7"
              style={{
                top: 56,
                bottom: 56,
                width: 1,
                backgroundImage: `repeating-linear-gradient(180deg, rgba(158,63,253,0.35) 0px, rgba(158,63,253,0.35) 6px, transparent 6px, transparent 14px)`,
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
              {STEPS.map((s, i) => (
                <div key={i} className="flex md:flex-col items-start md:items-center gap-5 md:text-center">
                  {/* Outlined icon circle with number badge */}
                  <div className="relative shrink-0 z-10">
                    <div
                      className="w-14 h-14 rounded-full border-2 bg-white flex items-center justify-center"
                      style={{ borderColor: BRAND, color: BRAND }}
                    >
                      {s.icon}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center font-bold"
                      style={{ background: BRAND, fontSize: "0.58rem" }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1 leading-snug">{s.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Social proof ───────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-slate-900">
            Empresas que já economizam com a Ótima
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 rounded-2xl px-6 py-8 border border-slate-100"
                style={{ background: "#FAFAFA" }}
              >
                <div className="rounded-full p-3" style={{ background: "#F3E8FF", color: BRAND }}>
                  {s.icon}
                </div>
                <p className="text-4xl font-bold" style={{ color: BRAND }}>{s.stat}</p>
                <p className="text-sm font-medium text-slate-600 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 italic">
            * Desconto médio máximo baseado nas condições atuais de fornecedores parceiros. Análise individualizada define o desconto real para sua empresa.
          </p>
        </div>
      </section>

      {/* ── Section 5: Form ───────────────────────────────────────────────── */}
      <section
        id="formulario"
        className="relative overflow-hidden py-16 md:py-20 px-4"
        style={{ background: "linear-gradient(135deg, #0a0920 0%, #16163f 60%, #1a0835 100%)" }}
      >
        {/* WebGL bg at low opacity for depth */}
        <div className="absolute inset-0" style={{ opacity: 0.18 }}>
          <HeroBackground />
        </div>
        {/* Dark overlay to keep form readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(10,9,32,0.80) 0%, rgba(22,22,63,0.78) 60%, rgba(26,8,53,0.82) 100%)" }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/texture-electric.png')", backgroundSize: "600px", backgroundRepeat: "repeat", opacity: 0.035 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(158,63,253,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.5 }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div
            className="bg-white rounded-2xl p-8 md:p-12"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(158,63,253,0.08)" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900">
              Envie sua conta e veja seu desconto
            </h2>
            <p className="text-slate-500 text-base mb-8">
              Análise feita por especialista. Resposta em até 24 horas úteis. Sem compromisso.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormFocus} noValidate>
              {/* Honeypot */}
              <input type="text" {...register("honeypot")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

              <div className="space-y-5">
                {/* Row 1: Nome + Empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="nome" className={labelCls}>Nome completo <span className="text-red-500">*</span></label>
                    <input id="nome" {...register("nome")} autoComplete="name" placeholder="Maria Silva" className={inputCls(!!errors.nome)} data-testid="input-nome" />
                    {errors.nome && <p className={errCls} role="alert">{errors.nome.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="empresa" className={labelCls}>Empresa <span className="text-red-500">*</span></label>
                    <input id="empresa" {...register("empresa")} autoComplete="organization" placeholder="Nome da empresa" className={inputCls(!!errors.empresa)} data-testid="input-empresa" />
                    {errors.empresa && <p className={errCls} role="alert">{errors.empresa.message}</p>}
                  </div>
                </div>

                {/* Row 2: Email + WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="email" className={labelCls}>Email corporativo <span className="text-red-500">*</span></label>
                    <input id="email" type="email" {...register("email")} autoComplete="email" placeholder="maria@empresa.com.br" className={inputCls(!!errors.email)} data-testid="input-email" />
                    {errors.email && <p className={errCls} role="alert">{errors.email.message}</p>}
                    <p className="text-xs text-slate-400 mt-1">Use seu email comercial para receber a análise.</p>
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>WhatsApp / Celular <span className="text-red-500">*</span></label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      className={inputCls(!!errors.phone)}
                      onChange={handlePhoneChange}
                      value={watch("phone") || ""}
                      data-testid="input-phone"
                    />
                    {errors.phone && <p className={errCls} role="alert">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* Row 3: Estado + Cidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="estado" className={labelCls}>Estado <span className="text-red-500">*</span></label>
                    <select id="estado" {...register("estado")} className={inputCls(!!errors.estado)} data-testid="select-estado">
                      <option value="">Selecione seu estado</option>
                      {ESTADOS.map(e => <option key={e.v} value={e.v}>{e.l}</option>)}
                    </select>
                    {errors.estado && <p className={errCls} role="alert">{errors.estado.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cidade" className={labelCls}>Cidade <span className="text-red-500">*</span></label>
                    <input id="cidade" {...register("cidade")} autoComplete="address-level2" placeholder="Sua cidade" className={inputCls(!!errors.cidade)} data-testid="input-cidade" />
                    {errors.cidade && <p className={errCls} role="alert">{errors.cidade.message}</p>}
                  </div>
                </div>

                {/* Row 4: Tipo de negócio + Valor da conta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="tipoNegocio" className={labelCls}>Tipo de negócio <span className="text-red-500">*</span></label>
                    <select id="tipoNegocio" {...register("tipoNegocio")} className={inputCls(!!errors.tipoNegocio)} data-testid="select-tipo-negocio">
                      <option value="">Selecione...</option>
                      {TIPOS_NEGOCIO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.tipoNegocio && <p className={errCls} role="alert">{errors.tipoNegocio.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="valorConta" className={labelCls}>Valor médio da conta por mês <span className="text-red-500">*</span></label>
                    <select id="valorConta" {...register("valorConta")} className={inputCls(!!errors.valorConta)} data-testid="select-valor-conta">
                      <option value="">Selecione a faixa</option>
                      {VALORES_CONTA.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {errors.valorConta && <p className={errCls} role="alert">{errors.valorConta.message}</p>}
                    <p className="text-xs text-slate-400 mt-1 italic">Atendemos empresas com conta a partir de R$ 5.000/mês. Contas menores podem ser analisadas caso a caso.</p>
                  </div>
                </div>

                {/* File upload */}
                <div id="upload-zone">
                  <label className={labelCls}>
                    Anexe sua última conta de luz{" "}
                    <span className="text-slate-400 font-normal">(recomendado — análise muito mais precisa)</span>
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                    style={{ borderColor: file ? "#16A34A" : uploadError ? "#DC2626" : "#CBD5E1" }}
                    data-testid="upload-dropzone"
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-3 text-green-700">
                        <CheckCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="text-slate-400 hover:text-red-500 ml-1 shrink-0" aria-label="Remover arquivo">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-9 w-9 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-500 font-medium">Clique para enviar ou arraste o arquivo aqui</p>
                        <p className="text-xs text-slate-400 mt-1">PDF ou foto da fatura · máx. 10 MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-file"
                  />

                  {/* Skip path */}
                  {!file && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => { setShowSkipOption(v => !v); setUploadError(null); }}
                        className="text-sm underline underline-offset-2"
                        style={{ color: BRAND }}
                        data-testid="btn-skip-upload"
                      >
                        Não tenho minha conta agora — quero ser contatado depois
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-300"
                        style={{ maxHeight: showSkipOption ? 80 : 0 }}
                      >
                        <label className="flex items-start gap-3 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={skipBillAcknowledged}
                            onChange={e => { setSkipBillAcknowledged(e.target.checked); setUploadError(null); }}
                            className="mt-0.5 h-4 w-4 rounded accent-purple-600"
                            data-testid="checkbox-skip-bill"
                          />
                          <span className="text-sm text-slate-600 leading-snug">
                            Entendo que sem a conta a análise será simplificada. A Ótima entrará em contato para coletar a conta antes de finalizar.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className={errCls} role="alert" aria-live="polite">{uploadError}</p>
                  )}

                  <p className="text-xs text-slate-400 mt-2 flex items-start gap-1.5">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Sua conta é usada exclusivamente para análise. Não compartilhamos seus dados.
                  </p>
                </div>

                {/* LGPD */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("lgpd")}
                      className="mt-0.5 h-4 w-4 rounded accent-purple-600 shrink-0"
                      data-testid="checkbox-lgpd"
                    />
                    <span className="text-sm text-slate-600 leading-relaxed">
                      Concordo em compartilhar minha conta de luz e dados de contato para análise de economia, e autorizo a Ótima Energia a entrar em contato comigo por email, telefone ou WhatsApp. Veja nossa{" "}
                      <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: BRAND }}>
                        Política de Privacidade
                      </a>. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.lgpd && <p className={errCls} role="alert" aria-live="polite">{errors.lgpd.message}</p>}
                </div>

                {/* Trust line above button */}
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>🔒 Dados protegidos</span>
                  <span>⏱️ Resposta em até 24h úteis</span>
                  <span>✓ Sem compromisso</span>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert" aria-live="polite" data-testid="submit-error">
                    {submitError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!lgpdValue || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 font-semibold text-white text-lg rounded-lg transition-all"
                  style={{
                    background: BRAND,
                    height: 56,
                    opacity: (!lgpdValue || isSubmitting) ? 0.5 : 1,
                    cursor: (!lgpdValue || isSubmitting) ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting && lgpdValue) {
                      e.currentTarget.style.filter = "brightness(0.92)";
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.boxShadow = "0 8px 28px rgba(158,63,253,0.45)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = "";
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                  data-testid="button-submit"
                >
                  {isSubmitting ? (
                    <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Enviando...</>
                  ) : (
                    <>Receber minha análise gratuita <ArrowRight className="h-5 w-5" /></>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Sua conta de luz é usada apenas para preparar sua análise. Não enviamos spam.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Section 6: FAQ ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-slate-900">
            Perguntas frequentes
          </h2>
          <div className="divide-y divide-slate-100">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i}>
                {/* "Mais perguntadas" label before the first 3 questions */}
                {i === 0 && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 pt-1 pb-3">
                    Mais perguntadas
                  </p>
                )}
                {i === 3 && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 pt-5 pb-3">
                    Outras dúvidas
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left transition-colors hover:text-purple-700"
                  data-testid={`faq-item-${i}`}
                >
                  <span className="text-base md:text-lg font-semibold text-slate-800">{item.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0"
                    style={{
                      color: openFaq === i ? BRAND : "#94a3b8",
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease, color 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? 400 : 0 }}
                >
                  <p className="text-slate-600 text-base leading-relaxed pb-5">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Final CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-24 px-4 text-white text-center" style={{ background: "#09081e" }}>
        <div className="absolute inset-0">
          <HeroBackground />
        </div>
        <div className="absolute inset-0" style={{ background: "rgba(9,8,30,0.72)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-5">Quanto sua empresa pode economizar?</h2>
          <p className="text-lg md:text-xl text-white/75 mb-10 max-w-lg mx-auto">
            Envie sua última conta de luz e descubra em até 24 horas úteis. Sem custo, sem compromisso.
          </p>
          <PrimaryBtn onClick={scrollToForm} className="text-lg px-9 py-5 shadow-xl" />
        </div>
      </section>

      {/* ── Section 8: Footer ─────────────────────────────────────────────── */}
      <footer style={{ background: "#0F172A" }} className="px-4 pt-14 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-white/65 text-sm mb-10">
          {/* Col 1: Brand */}
          <div>
            <a href="/" className="inline-block mb-4">
              <img src={logoIcon} alt="Ótima Energia" className="h-10 w-auto" />
            </a>
            <p className="leading-relaxed mb-2 text-white/80">Energia mais barata para empresas brasileiras.</p>
            <p className="text-white/35 text-xs leading-relaxed">
              CNPJ 65.023.912/0001-24<br />Rio de Janeiro, Brasil
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <p className="font-semibold text-white mb-4">Navegação</p>
            <ul className="space-y-2.5">
              <li><a href="/#sobre" className="hover:text-white transition-colors">Sobre a Ótima</a></li>
              <li><a href="#formulario" onClick={scrollToForm} className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#formulario" onClick={scrollToForm} className="hover:text-white transition-colors">Análise gratuita</a></li>
              <li><a href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <p className="font-semibold text-white mb-4">Contato</p>
            <ul className="space-y-3">
              {/* TODO: Replace with real WhatsApp business number */}
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 opacity-60" />
                <a href="https://wa.me/5521999999999" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  (21) 99999-9999 {/* TODO: update */}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 opacity-60" />
                <a href="mailto:contato@otimaenergia.com.br" className="hover:text-white transition-colors">contato@otimaenergia.com.br</a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 opacity-60" />
                <span>Segunda a sexta, das 9h às 18h</span>
              </li>
              <li className="flex items-center gap-2">
                <Map className="h-4 w-4 shrink-0 opacity-60" />
                <span>Atendemos em 23 estados do Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-5xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Ótima Energia. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com/company/otimaenergia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white/70 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com/otimaenergia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white/70 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
