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

  const navStyle: React.CSSProperties = scrolled
    ? {
        background: "rgba(13,12,43,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(158,63,253,0.15)",
      }
    : {
        background: "transparent",
        borderBottom: "none",
      };

  const linkColor = "rgba(255,255,255,0.75)";

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={navStyle}
        data-testid="navbar"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link href="/" data-testid="logo-home">
              <img
                src={logoFull}
                alt="Ótima Energia"
                className="h-14 lg:h-16 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
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
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest transition-colors duration-150"
                  style={{ color: linkColor, letterSpacing: "0.08em" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
                  data-testid="nav-solucoes"
                >
                  SOLUÇÕES
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${subOpen ? "rotate-180" : ""}`} />
                </Link>
                {subOpen && (
                  <div className="absolute top-full left-0 pt-2 w-52">
                    <div
                      className="rounded-lg py-2 shadow-xl"
                      style={{
                        background: "rgba(13,12,43,0.97)",
                        border: "1px solid rgba(158,63,253,0.2)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      {solutions.map((s) => (
                        <Link
                          key={s.href}
                          href={s.href}
                          onClick={() => setSubOpen(false)}
                          className="block px-4 py-2.5 text-sm transition-colors duration-150"
                          style={{ color: "rgba(255,255,255,0.65)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
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
                  className="text-xs font-semibold tracking-widest transition-colors duration-150"
                  style={{
                    color: link.highlight ? "#9e3ffd" : linkColor,
                    fontWeight: link.highlight ? 700 : 600,
                    letterSpacing: "0.08em",
                  }}
                  onMouseEnter={e => { if (!link.highlight) e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={e => { if (!link.highlight) e.currentTarget.style.color = linkColor; }}
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
                className="inline-flex items-center gap-2 text-white px-5 py-3 text-sm font-semibold tracking-wide transition-all hover:opacity-90"
                style={{
                  background: "#9e3ffd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(158,63,253,0.3)",
                  fontFamily: "'Sora', sans-serif",
                }}
                data-testid="nav-cta"
              >
                Solicitar Diagnóstico
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 transition-colors"
              style={{ color: "rgba(255,255,255,0.8)" }}
              onClick={() => setIsOpen(!isOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            className="lg:hidden"
            style={{
              background: "rgba(13,12,43,0.97)",
              borderTop: "1px solid rgba(158,63,253,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="px-6 py-8 space-y-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Soluções
              </p>
              {solutions.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base pl-2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {s.name}
                </Link>
              ))}
              <div
                className="pt-4 space-y-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Link
                  href="/ecos"
                  onClick={() => setIsOpen(false)}
                  className="block text-base font-bold"
                  style={{ color: "#9e3ffd" }}
                >
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
                    className="block text-base transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4">
                <Link
                  href="/seja-cliente"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center text-white px-5 py-3 text-sm font-semibold tracking-wide transition-all"
                  style={{
                    background: "#9e3ffd",
                    borderRadius: "8px",
                    fontFamily: "'Sora', sans-serif",
                  }}
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
