import { Link, useLocation } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  const isHomePage = location === "/";

  const handleScroll = (href: string) => {
    if (!isHomePage) {
      window.location.href = "/" + href;
      return;
    }
    
    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-[#F5F5F0] py-24 lg:py-32 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Large Navigation Links - DCVC Style */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {/* Main Nav */}
          <div className="space-y-4">
            <Link 
              href="/sobre"
              className="dcvc-footer-link block text-left"
            >
              Sobre
            </Link>
            <Link 
              href="/equipe"
              className="dcvc-footer-link block text-left"
            >
              Equipe
            </Link>
            <Link 
              href="/parceiros"
              className="dcvc-footer-link block text-left"
            >
              Parceiros
            </Link>
            <button 
              onClick={() => handleScroll("#contact")}
              className="dcvc-footer-link block text-left"
            >
              Contato
            </button>
          </div>

          {/* Topics */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Serviços</p>
            <ul className="space-y-3 text-gray-600">
              <li>Energia para PMEs</li>
              <li>Energia Industrial</li>
              <li>Consultoria Energética</li>
              <li>Análise de Mercado</li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Localização</p>
            <div className="text-gray-600 space-y-1">
              <p>Rio de Janeiro</p>
              <p>Brasil</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-8 border-t border-gray-300">
          {/* Logo */}
          <Link 
            href="/"
            className="text-xl font-semibold tracking-tight text-gray-900"
          >
            ÓTIMA<br/>ENERGIA
          </Link>

          {/* Copyright & Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm text-gray-500">
            <span>©{currentYear} Ótima Energia. Todos os direitos reservados.</span>
            <span className="hover:text-[#D53F8C] cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-[#D53F8C] cursor-pointer transition-colors">Termos de Uso</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
