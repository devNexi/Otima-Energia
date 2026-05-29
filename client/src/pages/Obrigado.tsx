import { useEffect, useMemo } from "react";
import { CheckCircle, ArrowRight, MessageCircle, ExternalLink } from "lucide-react";
import logoFull from "@/assets/branding/logo-full-large.png";

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
  // Strip anything that isn't a letter (including accented), space, or hyphen
  const clean = raw.replace(/[^a-zA-ZÀ-ÿ\s-]/g, "").trim().slice(0, 40);
  return clean || "";
}

// ─── Content variants ────────────────────────────────────────────────────────
function ContentCompleto({ nome, tipo }: { nome: string; tipo: string }) {
  const waLink = `${WA_BASE}?text=${encodeURIComponent("Olá! Acabei de enviar minha conta de luz no site da Ótima Energia e gostaria de conversar.")}`;
  return (
    <>
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
        Recebemos sua conta. Análise em andamento.
      </h1>
      <p className="text-slate-600 text-base md:text-lg mb-2">
        {nome ? `Obrigado, ${nome}!` : "Obrigado!"}
      </p>
      <p className="text-slate-500 text-base leading-relaxed mb-8">
        Nossa equipe de especialistas já está analisando sua conta de luz. Você receberá sua análise personalizada e proposta de economia em até 24 horas úteis, pelo email cadastrado ou WhatsApp.
      </p>

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-left mb-8">
        <p className="text-sm font-semibold text-purple-800 mb-3">Enquanto isso:</p>
        <ul className="space-y-2 text-sm text-purple-700">
          <li className="flex items-start gap-2"><span className="font-bold mt-0.5">1.</span>Verifique sua caixa de entrada (e a pasta de spam)</li>
          <li className="flex items-start gap-2"><span className="font-bold mt-0.5">2.</span>Salve nosso WhatsApp comercial para receber a análise mais rápido</li>
          <li className="flex items-start gap-2"><span className="font-bold mt-0.5">3.</span>Fique à vontade para tirar dúvidas pelo WhatsApp enquanto analisamos</li>
        </ul>
      </div>

      <p className="text-center text-slate-500 mb-3 text-sm">Prefere falar pelo WhatsApp?</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => fireEvent("whatsapp_click_obrigado", { tipo, source: "thank_you_page" })}
          className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-all"
          style={{ background: "#25D366" }}
          data-testid="btn-whatsapp-completo"
        >
          <MessageCircle className="h-5 w-5" />
          💬 Falar pelo WhatsApp
        </a>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 rounded-lg px-6 py-3 hover:bg-slate-50 transition-colors"
          data-testid="btn-voltar-site-completo"
        >
          Voltar ao site <ArrowRight className="h-4 w-4" />
        </a>
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
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
        <ExternalLink className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
        Recebemos seus dados! Falta só sua conta de luz.
      </h1>
      <p className="text-slate-600 text-base md:text-lg mb-2">
        {nome ? `Obrigado, ${nome}!` : "Obrigado!"}
      </p>

      <div className="rounded-xl p-6 mb-8 text-center" style={{ background: "#f8f5ff", borderLeft: "4px solid #9e3ffd" }}>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Quer agilizar sua análise?</h3>
        <p className="text-slate-600 text-sm mb-5">Envie sua conta de luz pelo WhatsApp agora e nossa equipe analisará no mesmo dia.</p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => fireEvent("whatsapp_click_obrigado", { tipo, source: "thank_you_page" })}
          className="inline-flex items-center justify-center gap-2 font-bold text-white rounded-lg px-8 py-4 text-lg shadow-md transition-all"
          style={{ background: "#25D366" }}
          data-testid="btn-whatsapp-sem-conta"
        >
          <MessageCircle className="h-5 w-5" />
          💬 Enviar conta pelo WhatsApp
        </a>
      </div>

      <p className="text-slate-500 text-sm mb-6">
        Ou responda o email de confirmação com o arquivo da conta em anexo.
        <br />
        Sem a conta, nossa equipe entrará em contato pelo telefone informado.
      </p>

      <a
        href="/"
        className="inline-flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 rounded-lg px-6 py-3 hover:bg-slate-50 transition-colors"
        data-testid="btn-voltar-site-sem-conta"
      >
        Voltar ao site
      </a>
    </>
  );
}

function ContentCasoEspecial({ nome, tipo }: { nome: string; tipo: string }) {
  const waMsg = encodeURIComponent("Olá! Acabei de me cadastrar como caso especial no site da Ótima Energia e gostaria de conversar sobre minha situação.");
  const waLink = `${WA_BASE}?text=${waMsg}`;
  return (
    <>
      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-blue-600" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
        Recebemos sua solicitação como caso especial.
      </h1>
      <p className="text-slate-600 text-base md:text-lg mb-2">
        {nome ? `Obrigado, ${nome}!` : "Obrigado!"}
      </p>
      <p className="text-slate-500 text-base leading-relaxed mb-8">
        Sua conta está fora do nosso perfil padrão (R$ 5.000+/mês), mas vamos analisar caso a caso. Nossa equipe verificará se conseguimos gerar economia significativa para sua empresa.
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-left mb-8">
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">•</span>
            Resposta em até 5 dias úteis pelo email cadastrado ou WhatsApp.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">•</span>
            Se houver oportunidade, entraremos em contato. Caso contrário, retornaremos com sugestões alternativas para sua empresa.
          </li>
        </ul>
      </div>

      <p className="text-center text-slate-500 mb-3 text-sm">Prefere falar pelo WhatsApp?</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-all"
          style={{ background: BRAND }}
          data-testid="btn-voltar-site-especial"
        >
          Voltar ao site <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => fireEvent("whatsapp_click_obrigado", { tipo, source: "thank_you_page" })}
          className="inline-flex items-center justify-center gap-2 font-medium text-white rounded-lg px-6 py-3 transition-colors"
          style={{ background: "#25D366" }}
          data-testid="btn-whatsapp-especial"
        >
          <MessageCircle className="h-5 w-5" />
          💬 Falar pelo WhatsApp
        </a>
      </div>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
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
        // ⚠️ Do NOT send to Google Ads — intentionally no ads conversion here
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
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <a href="/">
            <img src={logoFull} alt="Ótima Energia" className="h-10 w-auto" />
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {tipo === "sem-conta" && <ContentSemConta nome={nome} empresa={empresa} tipo={tipo} />}
          {tipo === "caso-especial" && <ContentCasoEspecial nome={nome} tipo={tipo} />}
          {(tipo === "completo" || (tipo !== "sem-conta" && tipo !== "caso-especial")) && (
            <ContentCompleto nome={nome} tipo={tipo} />
          )}
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Ótima Energia ·{" "}
        <a href="/privacidade" className="ml-1 hover:text-purple-600 underline">Política de Privacidade</a>
      </footer>
    </div>
  );
}
