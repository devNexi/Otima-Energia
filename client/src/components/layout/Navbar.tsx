import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoFull from "@/assets/branding/logo-full-large.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const isHomePage = location === "/";

  const navLinks = [
    { name: "SOLUÇÕES", href: "/solucoes", isPage: true },
    { name: "MERCADO LIVRE", href: "/lei-mercado-livre", isPage: true },
    { name: "SOBRE", href: "/sobre", isPage: true },
    { name: "FAQ", href: "/faq", isPage: true },
    { name: "PORTAL", href: "/portal-cliente", isPage: true },
    { name: "SEJA CLIENTE", href: "/seja-cliente", isPage: true },
  ];

  const handleNavClick = (href: string, isPage: boolean) => {
    if (isPage) {
      setIsOpen(false);
      return;
    }
    
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
    setIsOpen(false);
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      data-testid="navbar"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            href="/"
            data-testid="logo-home"
          >
            <img 
              src={logoFull} 
              alt="Ótima Energia" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Simple links like DCVC */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              link.isPage ? (
                <Link
                  key={link.name}
                  href={link.href}
                  className="dcvc-nav-link"
                  data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href, link.isPage)}
                  className="dcvc-nav-link"
                  data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {link.name}
                </button>
              )
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-6 py-8 space-y-6">
            {navLinks.map((link) => (
              link.isPage ? (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left text-lg tracking-wide text-[#16163f] hover:text-[#9e3ffd]"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href, link.isPage)}
                  className="block w-full text-left text-lg tracking-wide text-[#16163f] hover:text-[#9e3ffd]"
                >
                  {link.name}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
