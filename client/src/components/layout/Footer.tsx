import { Link, useLocation } from "wouter";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";

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
    <footer className="bg-white py-8 lg:py-10 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Large Navigation Links */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Main Nav */}
          <div className="space-y-2">
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
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Recursos</p>
            <ul className="space-y-1.5">
              <li><Link href="/lei-mercado-livre" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Mercado Livre de Energia</Link></li>
              <li><Link href="/renovacao-contrato" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Renovação e Migração</Link></li>
              <li><Link href="/faq" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Perguntas Frequentes</Link></li>
              <li><Link href="/insights" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Insights</Link></li>
              <li><Link href="/seja-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Diagnóstico Gratuito</Link></li>
              <li><Link href="/portal-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Portal do Cliente</Link></li>
              <li><Link href="/rede-de-lucros-otima" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors">Rede de Lucros Ótima</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Serviços</p>
            <ul className="space-y-1.5 text-[#736d77]">
              <li>Economia de Energia</li>
              <li>Energia Renovável</li>
              <li>Gestão Energética</li>
              <li>Migração para ACL</li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Localização</p>
            <div className="text-[#736d77] space-y-0.5">
              <p>Rio de Janeiro</p>
              <p>Brasil</p>
              <p className="mt-2">contato@otimaenergia.com.br</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6 border-t border-gray-300">
          {/* Logo */}
          <Link href="/">
            <img 
              src={logoIcon} 
              alt="Ótima Energia" 
              className="h-10 w-10 object-contain"
            />
          </Link>

          {/* Slogan */}
          <p className="text-sm font-medium text-[#9e3ffd]">
            Sua energia. Sua escolha. Sua economia.
          </p>

          {/* Copyright & Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm text-gray-500">
            <span>©{currentYear} Ótima Energia. Todos os direitos reservados.</span>
            <Link href="/privacidade" className="hover:text-[#df0af2] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#df0af2] transition-colors">Termos de Uso</Link>
          </div>
        </div>

        {/* Legal Info */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          Ótima Energia (CNPJ: 64.103.434/0001-08), com registro ativo na CCEE.
        </p>
      </div>
    </footer>
  );
}
