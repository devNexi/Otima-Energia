import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#top" },
    { name: "Como Funciona", href: "#process" },
    { name: "Para Empresas", href: "#business" },
    { name: "Contato", href: "#contact" },
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
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container-dcvc h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => handleScroll("#top")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          data-testid="logo-home"
        >
          <span className="text-xl font-bold tracking-tight text-primary">
            ÓTIMA ENERGIA
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleScroll(link.href)}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Button 
            onClick={() => handleScroll("#contact")}
            className="btn-primary"
            data-testid="nav-cta"
          >
            Simular Economia
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="mobile-menu-toggle"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border">
          <div className="container-dcvc py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleScroll(link.href)}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left py-2"
              >
                {link.name}
              </button>
            ))}
            <Button 
              onClick={() => handleScroll("#contact")}
              className="btn-primary w-full mt-4"
            >
              Simular Economia
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
