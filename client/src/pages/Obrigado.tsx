import { useEffect } from "react";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function fireEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (window.gtag) {
      window.gtag("event", eventName, params || {});
    } else if (window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch {}
}

export default function Obrigado() {
  useEffect(() => {
    fireEvent("thank_you_page_view");
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <Zap className="h-6 w-6 text-purple-600" />
          <span className="font-bold text-lg text-gray-900">Ótima Energia</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Recebemos sua solicitação!
          </h1>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            Nossa equipe irá analisar as informações enviadas e um Especialista em Energia da Ótima entrará em contato com sua comparação personalizada.
          </p>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-left mb-8">
            <p className="text-sm font-semibold text-purple-800 mb-2">O que acontece agora?</p>
            <ul className="space-y-2 text-sm text-purple-700">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">1.</span>
                Você receberá um email de confirmação em instantes.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">2.</span>
                Nossa equipe analisa seu perfil de consumo em até 24h úteis.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">3.</span>
                Um especialista envia sua auditoria personalizada de economia.
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Se você ainda não enviou sua conta de energia, pode responder o email de confirmação com o arquivo para agilizar a análise.
          </p>

          <div className="flex justify-center">
            <a
              href="/reduza"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-colors"
              data-testid="link-nova-solicitacao"
            >
              Nova solicitação
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Ótima Energia · 
        <a href="/privacidade" className="ml-1 hover:text-purple-600">Política de Privacidade</a>
      </footer>
    </div>
  );
}
