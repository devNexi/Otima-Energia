import { useEffect, useMemo } from "react";
import { CheckCircle, Zap, ArrowRight, MessageCircle, ExternalLink } from "lucide-react";

declare global {
  interface Window { gtag?: (...args: any[]) => void; dataLayer?: any[]; }
}

const BRAND = "#9e3ffd";
// TODO: Replace with real WhatsApp business number before launch
const WA_NUMBER = "5521999999999";
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
function ContentCompleto({ nome }: { nome: string }) {
  const waLink = `${WA_BASE}?text=${encodeURIComponent("Olá, sou " + (nome || "cliente") + " e acabei de me cadastrar no site para analisar minha conta de luz.")}`;
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

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-all"
          style={{ background: "#16A34A" }}
          data-testid="btn-whatsapp-completo"
        >
          <MessageCircle className="h-5 w-5" />
          Salvar WhatsApp da Ótima
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

function ContentSemConta({ nome }: { nome: string }) {
  const waMsg = encodeURIComponent("Olá, acabei de me cadastrar no site e quero enviar minha conta de luz para análise.");
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
      <p className="text-slate-500 text-base leading-relaxed mb-8">
        Para finalizar sua análise gratuita, precisamos da sua última conta de luz. Você pode:
      </p>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-left mb-8">
        <ul className="space-y-3 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5 shrink-0">1.</span>
            <span>Enviar agora pelo WhatsApp (mais rápido — clique no botão abaixo)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5 shrink-0">2.</span>
            <span>Aguardar nossa equipe entrar em contato em até 4 horas úteis para coletar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5 shrink-0">3.</span>
            <span>
              Enviar por email para:{" "}
              <a href="mailto:contato@otimaenergia.com.br" className="underline font-medium">
                contato@otimaenergia.com.br
              </a>
            </span>
          </li>
        </ul>
        <p className="text-xs text-amber-600 mt-3 italic">
          Quanto antes recebermos sua conta, mais rápido você descobre quanto pode economizar.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-all shadow-md text-base"
          style={{ background: "#16A34A" }}
          data-testid="btn-whatsapp-sem-conta"
        >
          <MessageCircle className="h-5 w-5" />
          Enviar minha conta pelo WhatsApp
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 rounded-lg px-6 py-3 hover:bg-slate-50 transition-colors"
          data-testid="btn-voltar-site-sem-conta"
        >
          Voltar ao site
        </a>
      </div>
    </>
  );
}

function ContentCasoEspecial({ nome }: { nome: string }) {
  const waMsg = encodeURIComponent("Olá, me cadastrei no site como caso especial e gostaria de falar com a equipe da Ótima.");
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
          className="inline-flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 rounded-lg px-6 py-3 hover:bg-slate-50 transition-colors"
          data-testid="btn-whatsapp-especial"
        >
          <MessageCircle className="h-5 w-5" />
          Falar com a Ótima no WhatsApp
        </a>
      </div>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Obrigado() {
  const { tipo, nome } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      tipo: params.get("tipo") || "completo",
      nome: sanitizeName(params.get("nome")),
    };
  }, []);

  useEffect(() => {
    switch (tipo) {
      case "completo":
      default:
        fireEvent("lead_form_submit", { value: 200, currency: "BRL" });
        break;
      case "sem-conta":
        fireEvent("lead_form_submit_no_bill", { value: 60, currency: "BRL" });
        break;
      case "caso-especial":
        // ⚠️ Do NOT send to Google Ads — intentionally no ads conversion here
        fireEvent("lead_form_submit_special_case");
        break;
    }
    fireEvent("thank_you_page_view", { tipo });
  }, [tipo]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <Zap className="h-6 w-6" style={{ color: BRAND }} />
            Ótima Energia
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {tipo === "sem-conta" && <ContentSemConta nome={nome} />}
          {tipo === "caso-especial" && <ContentCasoEspecial nome={nome} />}
          {(tipo === "completo" || (tipo !== "sem-conta" && tipo !== "caso-especial")) && (
            <ContentCompleto nome={nome} />
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
