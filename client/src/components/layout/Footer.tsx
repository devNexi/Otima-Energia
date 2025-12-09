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
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <button 
              onClick={() => handleScroll("#top")}
              className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                Ó
              </div>
              <span className="text-xl font-bold tracking-tight">
                Ótima Energia
              </span>
            </button>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Transformando a forma como empresas brasileiras compram energia. 
              Transparência, tecnologia e economia garantida no Mercado Livre de Energia.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Navegação</h4>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => handleScroll("#process")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScroll("#business")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Para Empresas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScroll("#contact")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Contato</h4>
            <ul className="space-y-4 text-gray-400">
              <li>contato@otimaenergia.com.br</li>
              <li>(21) 99999-9999</li>
              <li>Rio de Janeiro, Brasil</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Ótima Energia. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-white cursor-pointer transition-colors">Termos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
