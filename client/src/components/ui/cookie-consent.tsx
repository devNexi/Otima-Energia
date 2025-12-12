import { useState, useEffect } from "react";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "otima_energia_cookie_consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    const timestamp = new Date().toISOString();
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: true, timestamp }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#16163f] text-white px-4 py-3 shadow-lg"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs md:text-sm leading-snug flex-1">
          <strong>Cookies:</strong> coletamos e salvamos dados da sua visita ao nosso site para aperfeiçoar as funcionalidades e melhorar a sua experiência. Ao clicar em "Aceitar", você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-[#c88ff5]">Termos de Uso</Link>,{" "}
          <Link href="/privacidade" className="underline hover:text-[#c88ff5]">Política de Privacidade</Link> e{" "}
          <Link href="/cookies" className="underline hover:text-[#c88ff5]">Política de Cookies</Link>.
        </p>
        <button
          onClick={handleAccept}
          className="bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-6 py-2 text-xs font-medium uppercase tracking-wide transition-colors whitespace-nowrap"
          data-testid="cookie-accept-button"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
