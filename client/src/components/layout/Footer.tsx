export function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground py-12 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                Ó
              </div>
              <span className="text-xl font-heading font-bold tracking-tight">
                Ótima<span className="text-primary">Energia</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6">
              Transformando o mercado de energia brasileiro com tecnologia, transparência e os melhores preços.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#process" className="hover:text-primary transition-colors">Como Funciona</a></li>
              <li><a href="#business" className="hover:text-primary transition-colors">Para Empresas</a></li>
              <li><a href="#tech" className="hover:text-primary transition-colors">Tecnologia</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors">Quem Somos</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Ótima Energia. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span>São Paulo, Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
