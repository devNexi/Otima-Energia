import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "INÍCIO", href: "#top" },
    { name: "COMO FUNCIONA", href: "#process" },
    { name: "SOLUÇÕES", href: "#business" },
    { name: "CONTATO", href: "#contact" },
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
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      data-testid="navbar"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Simple text like DCVC */}
          <button 
            onClick={() => handleScroll("#top")}
            className="text-xl font-semibold tracking-tight text-gray-900"
            data-testid="logo-home"
          >
            ÓTIMA<br/>ENERGIA
          </button>

          {/* Desktop Navigation - Simple links like DCVC */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleScroll(link.href)}
                className="dcvc-nav-link"
                data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                {link.name}
              </button>
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
              <button
                key={link.name}
                onClick={() => handleScroll(link.href)}
                className="block w-full text-left text-lg tracking-wide text-gray-800 hover:text-[#D53F8C]"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
