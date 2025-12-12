import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h1 className="text-[3rem] lg:text-[4rem] leading-[1] font-normal tracking-tight text-[#9e3ffd]">
            Política de Privacidade
          </h1>
          <p className="text-[#736d77] mt-4">Última atualização: Dezembro 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <div className="prose prose-lg max-w-none text-[#736d77]">
            <h2 className="text-2xl font-medium text-[#16163f] mb-4">1. Introdução</h2>
            <p>
              A Ótima Energia ("nós", "nosso" ou "Empresa") está comprometida em proteger a privacidade de seus usuários, clientes e parceiros. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Nosso compromisso é com o uso responsável dos dados para análises energéticas e serviços gratuitos de comparação, sempre com total transparência.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">2. Dados que Coletamos</h2>
            <p>Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de identificação:</strong> nome, e-mail, telefone, CNPJ/CPF</li>
              <li><strong>Dados empresariais:</strong> razão social, endereço, setor de atuação</li>
              <li><strong>Dados de consumo energético:</strong> código UC, histórico de contas, perfil de consumo</li>
              <li><strong>Dados de navegação:</strong> endereço IP, cookies, páginas visitadas</li>
              <li><strong>Documentos:</strong> contas de energia enviadas para análise</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">3. Como Usamos seus Dados</h2>
            <p>Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analisar seu perfil de consumo e calcular economia potencial</li>
              <li>Comparar ofertas de fornecedores de energia</li>
              <li>Processar sua migração para o mercado livre</li>
              <li>Enviar comunicações sobre nossos serviços</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Melhorar nossos produtos e serviços</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">4. Base Legal</h2>
            <p>
              O tratamento de dados pessoais é realizado com base em: consentimento do titular; execução de contrato; cumprimento de obrigação legal; e legítimo interesse da empresa, sempre respeitando os direitos do titular.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">5. Compartilhamento de Dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fornecedores de energia:</strong> para cotação e contratação</li>
              <li><strong>CCEE:</strong> para registro e operação no mercado livre</li>
              <li><strong>Prestadores de serviços:</strong> que nos auxiliam nas operações</li>
              <li><strong>Autoridades:</strong> quando exigido por lei</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">6. Seus Direitos</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar anonimização ou eliminação de dados</li>
              <li>Solicitar portabilidade de dados</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">7. Segurança</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda, alteração ou destruição. Utilizamos criptografia, firewalls, controle de acesso e monitoramento contínuo.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">8. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política, ou conforme exigido por lei. Dados de clientes são mantidos durante a vigência do contrato e pelo prazo legal aplicável após seu término.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">9. Cookies</h2>
            <p>
              Utilizamos cookies para melhorar sua experiência em nosso site. Você pode gerenciar preferências de cookies através das configurações do seu navegador.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">10. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco:
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>E-mail:</strong> privacidade@otimaenergia.com.br</li>
              <li><strong>Telefone:</strong> +55 21 99999-9999</li>
              <li><strong>Endereço:</strong> Rio de Janeiro, RJ - Brasil</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">11. Alterações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Recomendamos que você a revise regularmente. Alterações significativas serão comunicadas através do nosso site ou por e-mail.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
