import { Link } from "wouter";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";

const BRAND = "#9e3ffd";

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white py-8 lg:py-10 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

        {/* Main columns */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Soluções */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Soluções</p>
            <ul className="space-y-1.5">
              <li><Link href="/gd-para-empresas" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">GD para Empresas</Link></li>
              <li><Link href="/mercado-livre-acl" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">ACL / Mercado Livre</Link></li>
              <li><Link href="/gestao-de-energia" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Gestão de Energia</Link></li>
              <li><Link href="/otimizacao-energetica" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Otimização Energética</Link></li>
              <li><Link href="/seja-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Diagnóstico Gratuito</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Empresa</p>
            <ul className="space-y-1.5">
              <li><Link href="/sobre" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Sobre</Link></li>
              <li><Link href="/insights" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Insights</Link></li>
              <li><Link href="/parceiros" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Parceiros</Link></li>
              <li><Link href="/faq" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Perguntas Frequentes</Link></li>
              <li><Link href="/portal-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Portal do Cliente</Link></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Recursos</p>
            <ul className="space-y-1.5">
              <li><Link href="/lei-mercado-livre" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Lei do Mercado Livre</Link></li>
              <li><Link href="/renovacao-contrato" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Renovação de Contrato</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Contato</p>
            <div className="text-[#736d77] space-y-0.5 text-sm">
              <p>Rio de Janeiro, Brasil</p>
              <p className="mt-2">contato@otimaenergia.com</p>
              <div className="flex items-center gap-2 mt-3">
                <a
                  href="https://br.linkedin.com/company/%C3%B3tima-energia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn da Ótima Energia"
                  className="flex items-center justify-center rounded-md transition-opacity hover:opacity-80"
                  style={{ background: BRAND, color: "#fff", width: "30px", height: "30px" }}
                  data-testid="link-linkedin"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href="https://instagram.com/otimaenergia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram da Ótima Energia"
                  className="flex items-center justify-center rounded-md transition-opacity hover:opacity-80"
                  style={{ background: BRAND, color: "#fff", width: "30px", height: "30px" }}
                  data-testid="link-instagram"
                >
                  <InstagramIcon />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-5 border-t border-gray-200">
          {/* Left: logo + tagline */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src={logoIcon} alt="Ótima Energia" className="h-8 w-8 object-contain" />
            </Link>
            <span className="text-sm font-medium" style={{ color: BRAND }}>
              Sua energia. Sua escolha. Sua economia.
            </span>
          </div>

          {/* Right: copyright + legal */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-1 text-sm text-gray-400">
            <span>©{currentYear} Ótima Energia (CNPJ: 65.023.912/0001-24)</span>
            <Link href="/privacidade" className="hover:text-[#9e3ffd] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#9e3ffd] transition-colors">Termos de Uso</Link>
            <Link href="/cookies" className="hover:text-[#9e3ffd] transition-colors">Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
