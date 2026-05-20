import { Link } from "wouter";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white py-8 lg:py-10 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Soluções */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Soluções</p>
            <ul className="space-y-1.5">
              <li><Link href="/gd-para-empresas" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">GD para Empresas</Link></li>
              <li><Link href="/mercado-livre-acl" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">ACL / Mercado Livre</Link></li>
              <li><Link href="/gestao-de-energia" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Gestão de Energia</Link></li>
              <li><Link href="/otimizacao-energetica" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Otimização Energética</Link></li>
              <li><Link href="/seja-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Diagnóstico Gratuito</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Empresa</p>
            <ul className="space-y-1.5">
              <li><Link href="/sobre" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Sobre</Link></li>
              <li><Link href="/insights" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Insights</Link></li>
              <li><Link href="/parceiros" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Parceiros</Link></li>
              <li><Link href="/faq" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Perguntas Frequentes</Link></li>
              <li><Link href="/portal-cliente" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Portal do Cliente</Link></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Recursos</p>
            <ul className="space-y-1.5">
              <li><Link href="/lei-mercado-livre" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Lei do Mercado Livre</Link></li>
              <li><Link href="/renovacao-contrato" className="text-[#736d77] hover:text-[#9e3ffd] transition-colors text-sm">Renovação de Contrato</Link></li>
            </ul>
          </div>

          {/* Localização */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-3">Contato</p>
            <div className="text-[#736d77] space-y-0.5 text-sm">
              <p>Rio de Janeiro</p>
              <p>Brasil</p>
              <p className="mt-2">contato@otimaenergia.com</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6 border-t border-gray-300">
          <Link href="/">
            <img src={logoIcon} alt="Ótima Energia" className="h-10 w-10 object-contain" />
          </Link>

          <p className="text-sm font-medium text-[#9e3ffd]">
            Sua energia. Sua escolha. Sua economia.
          </p>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm text-gray-500">
            <span>©{currentYear} Ótima Energia. Todos os direitos reservados.</span>
            <Link href="/privacidade" className="hover:text-[#df0af2] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#df0af2] transition-colors">Termos de Uso</Link>
            <Link href="/cookies" className="hover:text-[#df0af2] transition-colors">Cookies</Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Ótima Energia (CNPJ: 65.023.912/0001-24)
        </p>
      </div>
    </footer>
  );
}
