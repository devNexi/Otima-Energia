import { Link, useLocation } from "wouter";
import logoFull from "@/assets/brand/logo-full.png";

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
    <footer className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Large Navigation Links */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Main Nav */}
          <div className="space-y-4">
            <Link 
              href="/solucoes"
              className="dcvc-footer-link block text-left"
            >
              Soluções
            </Link>
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
          </div>

          {/* Resources */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Recursos</p>
            <ul className="space-y-3">
              <li><Link href="/lei-mercado-livre" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Mercado Livre de Energia</Link></li>
              <li><Link href="/renovacao-contrato" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Renovação e Migração</Link></li>
              <li><Link href="/faq" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Perguntas Frequentes</Link></li>
              <li><Link href="/insights" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Insights</Link></li>
              <li><Link href="/seja-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Diagnóstico Gratuito</Link></li>
              <li><Link href="/portal-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Portal do Cliente</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Serviços</p>
            <ul className="space-y-3 text-[#736d77]">
              <li>Economia de Energia</li>
              <li>Energia Renovável</li>
              <li>Gestão Energética</li>
              <li>Migração para ACL</li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Localização</p>
            <div className="text-[#736d77] space-y-1">
              <p>Rio de Janeiro</p>
              <p>Brasil</p>
              <p className="mt-4">contato@otimaenergia.com.br</p>
              <p>+55 21 99999-9999</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-8 border-t border-gray-300">
          {/* Logo */}
          <Link href="/">
            <img 
              src={logoFull} 
              alt="Ótima Energia" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Copyright & Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm text-gray-500">
            <span>©{currentYear} Ótima Energia. Todos os direitos reservados.</span>
            <Link href="/privacidade" className="hover:text-[#df0af2] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#df0af2] transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
