import { Link } from "wouter";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";

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

const colHead: React.CSSProperties = {
  fontFamily: "'Sora', sans-serif",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#9e3ffd",
  marginBottom: "14px",
  display: "block",
};

const footerLink = "text-sm transition-colors duration-200";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{ background: "#000000", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      className="py-10 lg:py-12"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

        {/* Main columns */}
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Soluções */}
          <div>
            <span style={colHead}>Soluções</span>
            <ul className="space-y-2">
              <li><Link href="/gd-para-empresas" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>GD para Empresas</Link></li>
              <li><Link href="/mercado-livre-acl" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>ACL / Mercado Livre</Link></li>
              <li><Link href="/gestao-de-energia" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Gestão de Energia</Link></li>
              <li><Link href="/otimizacao-energetica" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Otimização Energética</Link></li>
              <li><Link href="/seja-cliente" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Diagnóstico Gratuito</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <span style={colHead}>Empresa</span>
            <ul className="space-y-2">
              <li><Link href="/sobre" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Sobre</Link></li>
              <li><Link href="/insights" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Insights</Link></li>
              <li><Link href="/parceiros" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Parceiros</Link></li>
              <li><Link href="/faq" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Perguntas Frequentes</Link></li>
              <li><Link href="/portal-cliente" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Portal do Cliente</Link></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <span style={colHead}>Recursos</span>
            <ul className="space-y-2">
              <li><Link href="/lei-mercado-livre" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Lei do Mercado Livre</Link></li>
              <li><Link href="/renovacao-contrato" className={footerLink} style={{ color: "rgba(255,255,255,0.45)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>Renovação de Contrato</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <span style={colHead}>Contato</span>
            <div className="space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              <p>Rio de Janeiro, Brasil</p>
              <p className="mt-2">contato@otimaenergia.com</p>
              <div className="flex items-center gap-2 mt-4">
                <a
                  href="https://br.linkedin.com/company/%C3%B3tima-energia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn da Ótima Energia"
                  className="flex items-center justify-center rounded-md transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", width: "30px", height: "30px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(158,63,253,0.2)"; (e.currentTarget as HTMLElement).style.color = "#9e3ffd"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
                  data-testid="link-linkedin"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href="https://instagram.com/otimaenergia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram da Ótima Energia"
                  className="flex items-center justify-center rounded-md transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", width: "30px", height: "30px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(158,63,253,0.2)"; (e.currentTarget as HTMLElement).style.color = "#9e3ffd"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
                  data-testid="link-instagram"
                >
                  <InstagramIcon />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px" }}>
          <div className="flex items-center gap-3 mb-3 justify-center">
            <Link href="/">
              <img src={logoIcon} alt="Ótima Energia" className="h-7 w-7 object-contain opacity-70" />
            </Link>
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
              }}
            >
              Sua energia. Sua escolha. Sua economia.
            </span>
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1"
            style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}
          >
            <span>©{currentYear} Ótima Energia (CNPJ: 65.023.912/0001-24)</span>
            <Link href="/privacidade" className="transition-colors hover:text-[#9e3ffd]">Privacidade</Link>
            <Link href="/termos" className="transition-colors hover:text-[#9e3ffd]">Termos de Uso</Link>
            <Link href="/cookies" className="transition-colors hover:text-[#9e3ffd]">Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
