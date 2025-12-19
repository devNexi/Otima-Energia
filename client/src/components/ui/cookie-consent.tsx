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
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#3C145C] text-white px-4 py-2 shadow-lg"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <p className="text-[11px] md:text-xs leading-tight">
          Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-[#c88ff5]">Termos</Link>,{" "}
          <Link href="/privacidade" className="underline hover:text-[#c88ff5]">Privacidade</Link> e{" "}
          <Link href="/cookies" className="underline hover:text-[#c88ff5]">Cookies</Link>.
        </p>
        <button
          onClick={handleAccept}
          className="bg-[#9e3ffd] hover:bg-[#704094] text-white px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide transition-colors whitespace-nowrap"
          data-testid="cookie-accept-button"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
