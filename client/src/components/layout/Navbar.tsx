import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoFull from "@/assets/branding/logo-full-large.png";

const solutions = [
  { name: "GD para Empresas", href: "/gd-para-empresas" },
  { name: "ACL / Mercado Livre", href: "/mercado-livre-acl" },
  { name: "Gestão de Energia", href: "/gestao-de-energia" },
  { name: "Otimização Energética", href: "/otimizacao-energetica" },
];

const navLinks = [
  { name: "SOLUÇÕES", href: "/solucoes", hasSub: true },
  { name: "ECOS™", href: "/ecos", hasSub: false, highlight: true },
  { name: "FAQ", href: "/faq", hasSub: false },
  { name: "SOBRE", href: "/sobre", hasSub: false },
  { name: "PARCEIROS", href: "/parceiros", hasSub: false },
  { name: "INSIGHTS", href: "/insights", hasSub: false },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200" data-testid="navbar">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" data-testid="logo-home">
              <img src={logoFull} alt="Ótima Energia" className="h-14 lg:h-16 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-10">
              {/* Solutions dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSubOpen(true)}
                onMouseLeave={() => setSubOpen(false)}
              >
                <Link
                  href="/solucoes"
                  className="dcvc-nav-link flex items-center gap-1"
                  data-testid="nav-solucoes"
                >
                  SOLUÇÕES
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${subOpen ? "rotate-180" : ""}`} />
                </Link>
                {subOpen && (
                  <div className="absolute top-full left-0 pt-2 w-52">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                      {solutions.map((s) => (
                        <Link
                          key={s.href}
                          href={s.href}
                          onClick={() => setSubOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#16163f] hover:bg-[#eee7f1] hover:text-[#9e3ffd] transition-colors"
                          data-testid={`nav-sub-${s.name.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="dcvc-nav-link"
                  style={link.highlight ? { color: "#9e3ffd", fontWeight: 700 } : undefined}
                  data-testid={`nav-${link.name.toLowerCase().replace(/[\s™]/g, "-")}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block">
              <Link
                href="/seja-cliente"
                className="inline-flex items-center gap-2 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-5 py-3 text-sm font-medium tracking-wide transition-colors"
                style={{ borderRadius: "8px" }}
                data-testid="nav-cta"
              >
                Solicitar Diagnóstico
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-700"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-6 py-8 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Soluções</p>
              {solutions.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base text-[#16163f] hover:text-[#9e3ffd] transition-colors pl-2"
                >
                  {s.name}
                </Link>
              ))}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <Link href="/ecos" onClick={() => setIsOpen(false)} className="block text-base font-semibold hover:text-[#9e3ffd] transition-colors" style={{ color: "#9e3ffd" }}>
                  ECOS™
                </Link>
                {[
                  { name: "Sobre", href: "/sobre" },
                  { name: "FAQ", href: "/faq" },
                  { name: "Parceiros", href: "/parceiros" },
                  { name: "Insights", href: "/insights" },
                  { name: "Portal do Cliente", href: "/portal-cliente" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-base text-[#16163f] hover:text-[#9e3ffd] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4">
                <Link
                  href="/seja-cliente"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-5 py-3 text-sm font-medium tracking-wide transition-colors"
                  style={{ borderRadius: "8px" }}
                  data-testid="nav-cta-mobile"
                >
                  Solicitar Diagnóstico
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Floating WhatsApp CTA — all marketing pages */}
      <a
        href="https://wa.me/5521XXXXXXXXX"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        data-testid="floating-whatsapp"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999,
          background: "#9e3ffd",
          color: "#fff",
          borderRadius: "50px",
          padding: "12px 20px",
          fontFamily: "'Sora', sans-serif",
          fontWeight: 600,
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 20px rgba(158,63,253,0.4)",
          textDecoration: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 28px rgba(158,63,253,0.5)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(158,63,253,0.4)"; }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="hidden sm:inline">Falar no WhatsApp</span>
      </a>
    </>
  );
}
