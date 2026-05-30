import { useEffect, useMemo } from "react";
import { CheckCircle, ArrowRight, MessageCircle, ExternalLink, Clock, Mail, Shield } from "lucide-react";
import HeroBackground from "@/components/HeroBackground";
import { Navbar } from "@/components/layout/Navbar";

declare global {
  interface Window { gtag?: (...args: any[]) => void; dataLayer?: any[]; }
}

const BRAND = "#9e3ffd";
const WA_NUMBER = "5521997959777";
const WA_BASE = `https://wa.me/${WA_NUMBER}`;

function fireEvent(name: string, params?: Record<string, any>) {
  try {
    if (window.gtag) window.gtag("event", name, params || {});
    else if (window.dataLayer) window.dataLayer.push({ event: name, ...params });
  } catch {}
}

function sanitizeName(raw: string | null): string {
  if (!raw) return "";
  const clean = raw.replace(/[^a-zA-ZÀ-ÿ\s-]/g, "").trim().slice(0, 40);
  return clean || "";
}

// ─── Shared styled primitives ─────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "16px",
  padding: "28px",
};

const mutedText: React.CSSProperties = { color: "rgba(255,255,255,0.55)" };
const bodyText: React.CSSProperties = { color: "rgba(255,255,255,0.75)" };

function IconBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
      style={{ background: `${color}18`, border: `1.5px solid ${color}40` }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 32px ${color}40` }}
      />
      <div style={{ color, position: "relative" }}>{children}</div>
    </div>
  );
}

function WaButton({ href, onClick, testId, label }: { href: string; onClick?: () => void; testId: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      data-testid={testId}
      className="inline-flex items-center justify-center gap-2 font-bold text-white rounded-xl px-7 py-3.5 transition-all hover:opacity-90 hover:-translate-y-0.5"
      style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.35)", fontFamily: "'Sora', sans-serif" }}
    >
      <MessageCircle className="h-5 w-5" />
      {label}
    </a>
  );
}

function BackButton({ href, testId }: { href: string; testId: string }) {
  return (
    <a
      href={href}
      data-testid={testId}
      className="inline-flex items-center justify-center gap-2 font-medium rounded-xl px-6 py-3.5 transition-all hover:opacity-80"
      style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", fontFamily: "'Inter', sans-serif" }}
    >
      Voltar ao site <ArrowRight className="h-4 w-4" />
    </a>
  );
}

// ─── Content variants ─────────────────────────────────────────────────────────
function ContentCompleto({ nome, tipo }: { nome: string; tipo: string }) {
  const waLink = `${WA_BASE}?text=${encodeURIComponent("Olá! Acabei de enviar minha conta de luz no site da Ótima Energia e gostaria de conversar.")}`;
  return (
    <>
      <IconBadge color="#22c55e">
        <CheckCircle className="h-9 w-9" />
      </IconBadge>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
        Recebemos sua conta. Análise em andamento.
      </h1>
      <p className="text-base md:text-lg mb-2" style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
        {nome ? `Obrigado, ${nome}!` : "Obrigado!"}
      </p>
      <p className="text-base leading-relaxed mb-8" style={bodyText}>
        Nossa equipe de especialistas já está analisando sua conta de luz. Você receberá sua análise personalizada e proposta de economia em até 24 horas úteis, pelo email cadastrado ou WhatsApp.
      </p>

      <div style={{ ...cardStyle, borderLeft: `3px solid ${BRAND}`, textAlign: "left" }} className="mb-8">
        <p className="text-sm font-semibold mb-4" style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Enquanto isso:
        </p>
        <ul className="space-y-3">
          {[
            { icon: <Mail className="h-4 w-4 shrink-0 mt-0.5" />, text: "Verifique sua caixa de entrada (e a pasta de spam)" },
            { icon: <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" />, text: "Salve nosso WhatsApp comercial para receber a análise mais rápido" },
            { icon: <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />, text: "Fique à vontade para tirar dúvidas pelo WhatsApp enquanto analisamos" },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={bodyText}>
              <span style={{ color: BRAND }}>{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm mb-4" style={mutedText}>Prefere falar pelo WhatsApp?</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <WaButton
          href={waLink}
          onClick={() => fireEvent("whatsapp_click_obrigado", { tipo, source: "thank_you_page", page: window.location.pathname })}
          testId="btn-whatsapp-completo"
          label="💬 Falar pelo WhatsApp"
        />
        <BackButton href="/" testId="btn-voltar-site-completo" />
      </div>
    </>
  );
}

function ContentSemConta({ nome, empresa, tipo }: { nome: string; empresa: string; tipo: string }) {
  const empresaOrDefault = empresa || "minha empresa";
  const waMsg = encodeURIComponent(`Olá! Acabei de me cadastrar no site da Ótima Energia e vou enviar minha conta de luz para análise. Meu nome é ${nome} da empresa ${empresaOrDefault}.`);
  const waLink = `${WA_BASE}?text=${waMsg}`;
  return (
    <>
      <IconBadge color="#f59e0b">
        <ExternalLink className="h-9 w-9" />
      </IconBadge>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
        Recebemos seus dados! Falta só sua conta de luz.
      </h1>
      <p className="text-base md:text-lg mb-6" style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
        {nome ? `Obrigado, ${nome}!` : "Obrigado!"}
      </p>

      <div style={{ ...cardStyle, borderLeft: `3px solid ${BRAND}`, textAlign: "left" }} className="mb-6">
        <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
          Quer agilizar sua análise?
        </h3>
        <p className="text-sm mb-5" style={bodyText}>
          Envie sua conta de luz pelo WhatsApp agora e nossa equipe analisará no mesmo dia.
        </p>
        <WaButton
          href={waLink}
          onClick={() => fireEvent("whatsapp_click_obrigado", { tipo, source: "thank_you_page", page: window.location.pathname })}
          testId="btn-whatsapp-sem-conta"
          label="💬 Enviar conta pelo WhatsApp"
        />
      </div>

      <p className="text-sm mb-6" style={mutedText}>
        Ou responda o email de confirmação com o arquivo da conta em anexo.
        <br />
        Sem a conta, nossa equipe entrará em contato pelo telefone informado.
      </p>

      <BackButton href="/" testId="btn-voltar-site-sem-conta" />
    </>
  );
}

function ContentCasoEspecial({ nome, tipo }: { nome: string; tipo: string }) {
  const waMsg = encodeURIComponent("Olá! Acabei de me cadastrar como caso especial no site da Ótima Energia e gostaria de conversar sobre minha situação.");
  const waLink = `${WA_BASE}?text=${waMsg}`;
  return (
    <>
      <IconBadge color="#60a5fa">
        <CheckCircle className="h-9 w-9" />
      </IconBadge>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
        Recebemos sua solicitação como caso especial.
      </h1>
      <p className="text-base md:text-lg mb-2" style={{ color: "#c88ff5", fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
        {nome ? `Obrigado, ${nome}!` : "Obrigado!"}
      </p>
      <p className="text-base leading-relaxed mb-8" style={bodyText}>
        Sua conta está fora do nosso perfil padrão (R$ 5.000+/mês), mas vamos analisar caso a caso. Nossa equipe verificará se conseguimos gerar economia significativa para sua empresa.
      </p>

      <div style={{ ...cardStyle, borderLeft: "3px solid #60a5fa", textAlign: "left" }} className="mb-8">
        <ul className="space-y-3">
          {[
            { icon: <Clock className="h-4 w-4 shrink-0 mt-0.5" />, text: "Resposta em até 5 dias úteis pelo email cadastrado ou WhatsApp." },
            { icon: <Shield className="h-4 w-4 shrink-0 mt-0.5" />, text: "Se houver oportunidade, entraremos em contato. Caso contrário, retornaremos com sugestões alternativas para sua empresa." },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={bodyText}>
              <span style={{ color: "#60a5fa" }}>{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm mb-4" style={mutedText}>Prefere falar pelo WhatsApp?</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/"
          data-testid="btn-voltar-site-especial"
          className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-xl px-6 py-3.5 transition-all hover:-translate-y-0.5"
          style={{ background: BRAND, boxShadow: "0 4px 20px rgba(158,63,253,0.35)", fontFamily: "'Sora', sans-serif" }}
        >
          Voltar ao site <ArrowRight className="h-4 w-4" />
        </a>
        <WaButton
          href={waLink}
          onClick={() => fireEvent("whatsapp_click_obrigado", { tipo, source: "thank_you_page", page: window.location.pathname })}
          testId="btn-whatsapp-especial"
          label="💬 Falar pelo WhatsApp"
        />
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Obrigado() {
  const { tipo, nome, empresa } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      tipo: params.get("tipo") || "completo",
      nome: sanitizeName(params.get("nome")),
      empresa: sanitizeName(params.get("empresa")),
    };
  }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tipo") || "completo";
    switch (t) {
      case "sem-conta":
        fireEvent("lead_form_submit_no_bill", { value: 60, currency: "BRL" });
        break;
      case "caso-especial":
        fireEvent("lead_form_submit_special_case");
        break;
      case "completo":
      default:
        fireEvent("lead_form_submit", { value: 200, currency: "BRL" });
        break;
    }
    fireEvent("thank_you_page_view", { tipo: t });
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09081e", fontFamily: "'Inter', sans-serif" }}>

      <Navbar />

      {/* Hero glow area */}
      <div className="relative overflow-hidden pt-20" style={{ minHeight: 220 }}>
        <div className="absolute inset-0">
          <HeroBackground />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(9,8,30,0.55) 0%, rgba(9,8,30,0.92) 80%, #09081e 100%)" }}
        />
        {/* Glow orb */}
        <div
          className="absolute pointer-events-none"
          style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(158,63,253,0.18) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 pb-20 -mt-36 relative z-10">
        <div
          className="w-full max-w-lg text-center rounded-2xl p-8 md:p-10"
          style={{
            background: "rgba(19,17,42,0.80)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(158,63,253,0.08)",
          }}
        >
          {tipo === "sem-conta" && <ContentSemConta nome={nome} empresa={empresa} tipo={tipo} />}
          {tipo === "caso-especial" && <ContentCasoEspecial nome={nome} tipo={tipo} />}
          {(tipo === "completo" || (tipo !== "sem-conta" && tipo !== "caso-especial")) && (
            <ContentCompleto nome={nome} tipo={tipo} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-6 text-center text-xs border-t"
        style={{ color: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        © {new Date().getFullYear()} Ótima Energia ·{" "}
        <a href="/privacidade" className="ml-1 hover:text-purple-400 underline transition-colors">
          Política de Privacidade
        </a>
      </footer>
    </div>
  );
}
