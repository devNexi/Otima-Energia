export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScroll = (href: string) => {
    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-foreground text-white py-16">
      <div className="container-dcvc">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <button 
              onClick={() => handleScroll("#top")}
              className="text-2xl font-bold tracking-tight mb-4 block hover:opacity-80 transition-opacity"
            >
              ÓTIMA ENERGIA
            </button>
            <p className="text-white/60 max-w-md leading-relaxed">
              Transformando a forma como empresas brasileiras compram energia. 
              Transparência, tecnologia e economia garantida.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Navegação</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleScroll("#process")}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScroll("#business")}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Para Empresas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScroll("#contact")}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Contato</h4>
            <ul className="space-y-3 text-white/60">
              <li>contato@otimaenergia.com.br</li>
              <li>São Paulo, Brasil</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {currentYear} Ótima Energia. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <span>Privacidade</span>
            <span>Termos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
