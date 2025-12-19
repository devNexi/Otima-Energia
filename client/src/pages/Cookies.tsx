import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h1 className="text-[3rem] lg:text-[4rem] leading-[1] font-normal tracking-tight text-[#9e3ffd]">
            Política de Cookies
          </h1>
          <p className="text-[#736d77] mt-4">Ótima Energia Ltda.</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <div className="prose prose-lg max-w-none text-[#736d77]">
            <p className="text-lg mb-8">
              A Ótima Energia Ltda. ("Ótima Energia", "nós" ou "nosso") utiliza cookies e tecnologias semelhantes para melhorar a experiência do usuário, garantir o correto funcionamento do site e compreender como nossos visitantes interagem com nossos conteúdos.
            </p>
            <p className="mb-12">
              Esta Política de Cookies explica o que são cookies, como os utilizamos, quais tipos de cookies empregamos e como você pode gerenciá-los, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).
            </p>

            <h2 className="text-2xl font-medium text-[#3C145C] mb-4">1. O que são cookies?</h2>
            <p>
              Cookies são pequenos arquivos de texto armazenados no seu navegador ou dispositivo quando você visita um site. Eles permitem reconhecer seu dispositivo, lembrar preferências e coletar informações sobre sua navegação.
            </p>

            <h2 className="text-2xl font-medium text-[#3C145C] mt-12 mb-4">2. Para que utilizamos cookies?</h2>
            <p className="mb-2">Utilizamos cookies para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Garantir o funcionamento adequado do site</li>
              <li>Melhorar desempenho e segurança</li>
              <li>Entender como os usuários navegam pelo site</li>
              <li>Aperfeiçoar conteúdos, funcionalidades e experiência do usuário</li>
            </ul>
            <p className="mt-4">
              Não utilizamos cookies para fins ilegais ou para vender dados pessoais.
            </p>

            <h2 className="text-2xl font-medium text-[#3C145C] mt-12 mb-4">3. Tipos de cookies utilizados</h2>
            
            <h3 className="text-xl font-medium text-[#3C145C] mt-6 mb-3">Cookies Necessários</h3>
            <p>
              Essenciais para o funcionamento do site. Permitem navegação, envio de formulários e acesso a áreas seguras. Sem eles, o site pode não funcionar corretamente.
            </p>

            <h3 className="text-xl font-medium text-[#3C145C] mt-6 mb-3">Cookies de Desempenho e Análise</h3>
            <p>
              Coletam informações agregadas e anônimas sobre como os visitantes utilizam o site, permitindo melhorias contínuas.
            </p>

            <h3 className="text-xl font-medium text-[#3C145C] mt-6 mb-3">Cookies Funcionais</h3>
            <p>
              Permitem lembrar preferências do usuário, como idioma ou região, proporcionando uma experiência mais personalizada.
            </p>

            <h3 className="text-xl font-medium text-[#3C145C] mt-6 mb-3">Cookies de Marketing (se aplicável)</h3>
            <p>
              Podem ser utilizados para apresentar conteúdos mais relevantes. Caso sejam implementados no futuro, o usuário será informado e poderá consentir.
            </p>

            <h2 className="text-2xl font-medium text-[#3C145C] mt-12 mb-4">4. Consentimento</h2>
            <p>
              Ao acessar nosso site pela primeira vez, você verá um aviso de cookies. Ao clicar em "Aceitar", você concorda com o uso de cookies conforme descrito nesta Política, na <a href="/privacidade" className="text-[#9e3ffd] hover:underline">Política de Privacidade</a> e nos <a href="/termos" className="text-[#9e3ffd] hover:underline">Termos de Uso</a>.
            </p>
            <p className="mt-4">
              Você pode retirar seu consentimento a qualquer momento ajustando as configurações do seu navegador.
            </p>

            <h2 className="text-2xl font-medium text-[#3C145C] mt-12 mb-4">5. Como gerenciar ou desativar cookies</h2>
            <p>
              Você pode configurar seu navegador para bloquear ou alertar sobre cookies. A desativação de cookies essenciais pode impactar o funcionamento do site.
            </p>
            <p className="mt-4 mb-2">Links úteis:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#9e3ffd] hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/pt-BR/kb/protecao-aprimorada-contra-rastreamento-desktop" target="_blank" rel="noopener noreferrer" className="text-[#9e3ffd] hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#9e3ffd] hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#9e3ffd] hover:underline">Microsoft Edge</a></li>
            </ul>

            <h2 className="text-2xl font-medium text-[#3C145C] mt-12 mb-4">6. Alterações nesta Política</h2>
            <p>
              Esta Política pode ser atualizada a qualquer momento. Recomendamos a revisão periódica desta página para se manter informado.
            </p>

            <h2 className="text-2xl font-medium text-[#3C145C] mt-12 mb-4">7. Contato</h2>
            <p>
              Em caso de dúvidas sobre esta Política de Cookies ou sobre o uso de dados pessoais, entre em contato:
            </p>
            <ul className="list-none pl-0 space-y-2 mt-4">
              <li><strong>Ótima Energia Ltda.</strong></li>
              <li><strong>E-mail:</strong> contato@otimaenergia.com.br</li>
              <li><strong>E-mail para privacidade:</strong> privacidade@otimaenergia.com.br</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
