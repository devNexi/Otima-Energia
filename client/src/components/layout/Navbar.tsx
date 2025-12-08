import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Como Funciona", href: "#process" },
    { name: "Para Empresas", href: "#business" },
    { name: "Tecnologia", href: "#tech" },
    { name: "Quem Somos", href: "#about" },
    { name: "Contato", href: "#contact" },
  ];

  const handleScroll = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10 shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
            Ó
          </div>
          <span className="text-xl font-heading font-bold tracking-tight text-foreground">
            Ótima<span className="text-primary">Energia</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleScroll(link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Globe className="w-5 h-5" />
          </Button>
          <Button className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            Simular Economia
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-8 mt-8">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => handleScroll(link.href)}
                      className="text-lg font-medium text-left text-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  <Button className="w-full justify-between" size="lg">
                    Simular Economia
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Globe className="w-4 h-4" />
                    English
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
