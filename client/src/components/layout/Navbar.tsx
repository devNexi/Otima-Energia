import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkColor = scrolled ? "#000000" : "rgba(255,255,255,0.85)";
  const linkHoverClass = scrolled ? "hover:text-[#9e3ffd]" : "hover:text-white";

  return (
    <>
      <nav
        data-testid="navbar"
        style={{
          background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid #eee7f1" : "none",
          transition: "all 0.3s ease",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
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
                  className={`flex items-center gap-1 text-xs font-semibold tracking-widest uppercase transition-colors duration-200 ${linkHoverClass}`}
                  style={{ color: linkColor, fontFamily: "'Sora', sans-serif" }}
                  data-testid="nav-solucoes"
                >
                  SOLUÇÕES
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${subOpen ? "rotate-180" : ""}`} />
                </Link>
                {subOpen && (
                  <div className="absolute top-full left-0 pt-2 w-52">
                    <div className="bg-white border border-[#eee7f1] rounded-lg shadow-lg py-2">
                      {solutions.map((s) => (
                        <Link
                          key={s.href}
                          href={s.href}
                          onClick={() => setSubOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#000000] hover:bg-[#eee7f1] hover:text-[#9e3ffd] transition-colors"
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
                  className={`text-xs font-semibold tracking-widest uppercase transition-colors duration-200 ${link.highlight ? "" : linkHoverClass}`}
                  style={{
                    color: link.highlight ? "#9e3ffd" : linkColor,
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: link.highlight ? 700 : 600,
                  }}
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
              className="lg:hidden p-2 transition-colors"
              style={{ color: scrolled ? "#000000" : "rgba(255,255,255,0.85)" }}
              onClick={() => setIsOpen(!isOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-[#eee7f1]">
            <div className="px-6 py-8 space-y-4">
              <p className="text-xs font-semibold text-[#736d77] uppercase tracking-wider mb-2">Soluções</p>
              {solutions.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base text-[#000000] hover:text-[#9e3ffd] transition-colors pl-2"
                >
                  {s.name}
                </Link>
              ))}
              <div className="border-t border-[#eee7f1] pt-4 space-y-4">
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
                    className="block text-base text-[#000000] hover:text-[#9e3ffd] transition-colors"
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
    </>
  );
}
