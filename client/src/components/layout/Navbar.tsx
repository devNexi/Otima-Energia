import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#top" },
    { name: "How It Works", href: "#process" },
    { name: "Solutions", href: "#business" },
    { name: "Contact", href: "#contact" },
  ];

  const handleScroll = (href: string) => {
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
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB]"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto" style={{ padding: "1.5rem 2rem" }}>
        <div className="flex items-center justify-between">
          {/* Logo - Purple like DCVC's colored logo */}
          <button 
            onClick={() => handleScroll("#top")}
            className="text-xl font-bold tracking-tight text-[#6B46C1]"
            data-testid="logo-home"
          >
            Ótima Energia
          </button>

          {/* Desktop Navigation - Purple links, pink hover */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleScroll(link.href)}
                className="nav-link-dcvc"
                data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                {link.name}
              </button>
            ))}
            <button 
              onClick={() => handleScroll("#contact")}
              className="btn-primary-dcvc"
              data-testid="nav-cta"
            >
              Get a Quote
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#6B46C1]"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB]">
          <div className="px-8 py-6 space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleScroll(link.href)}
                className="block w-full text-left text-lg text-[#6B46C1] hover:text-[#D53F8C] transition-colors"
              >
                {link.name}
              </button>
            ))}
            <button 
              onClick={() => handleScroll("#contact")}
              className="btn-primary-dcvc w-full text-center mt-4"
            >
              Get a Quote
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
