import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";


export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h1 className="text-[3rem] lg:text-[4rem] leading-[1] font-normal tracking-tight text-[#9e3ffd]">
            Termos de Uso
          </h1>
          <p className="text-[#736d77] mt-4">Ótima Energia Ltda.</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <div className="prose prose-lg max-w-none text-[#736d77]">
            
            <h2 className="text-2xl font-medium text-[#16163f] mb-4">1. Introdução</h2>
            <p>
              1.1. Estes Termos de Uso ("Termos") regulam o acesso e a utilização do site operado pela Ótima Energia Ltda. ("Ótima Energia", "nós", "nosso"), disponível em https://otimaenergia.com.br e de quaisquer páginas, formulários, áreas de acesso e conteúdos relacionados (em conjunto, o "Site").
            </p>
            <p>
              1.2. Ao acessar, navegar, enviar informações, utilizar formulários, criar conta, acessar área restrita ou utilizar qualquer funcionalidade do Site, você ("Você" ou "Usuário") declara ter lido, entendido e concordado com estes Termos e com a Política de Privacidade do Site.
            </p>
            <p>
              1.3. Se você não concordar com estes Termos, não deve utilizar o Site.
            </p>
            <p>
              1.4. O Site pode conter conteúdos informativos e canais para solicitação de diagnóstico, contato e envio de documentos (por exemplo, faturas de energia). O uso do Site não cria, por si só, obrigação de contratação de serviços.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">2. Quem Somos</h2>
            <ul className="list-none pl-0 space-y-2">
              <li>2.1. <strong>Controladora/Responsável pelo Site:</strong> Ótima Energia Ltda.</li>
              <li>2.2. <strong>Site:</strong> https://otimaenergia.com.br</li>
              <li>2.3. <strong>E-mail de contato:</strong> contato@otimaenergia.com</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">3. Elegibilidade e Uso Permitido</h2>
            <p>
              3.1. O Site é destinado principalmente a empresas e a seus representantes, gestores e responsáveis autorizados.
            </p>
            <p>3.2. Ao utilizar o Site, você declara que:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>a) tem capacidade legal para aceitar estes Termos;</li>
              <li>b) se estiver agindo em nome de uma empresa, possui poderes para representar e vincular essa empresa;</li>
              <li>c) fornecerá informações verdadeiras, atuais e completas;</li>
              <li>d) utilizará o Site apenas para finalidades lícitas.</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">4. Descrição dos Serviços e Natureza das Informações</h2>
            <p>
              4.1. A Ótima Energia atua como intermediadora e parceira de migração, contratação e otimização para empresas que desejam avaliar condições no Mercado Livre de Energia, inclusive com análise de faturas e elaboração de simulações e propostas.
            </p>
            <p>
              4.2. As informações apresentadas no Site têm finalidade geral e podem ser atualizadas a qualquer momento. Mesmo quando fornecemos estimativas e simulações, resultados reais podem variar conforme perfil de consumo, condições contratuais, prazos, regras setoriais, disponibilidade de fornecedores e requisitos técnicos/regulatórios.
            </p>
            <p>
              4.3. O "serviço de comparação" é gratuito para o empresário/empresa usuária do Site. A remuneração da Ótima Energia pode ocorrer por meio de comissões pagas por fornecedores e/ou parceiros, sem cobrança direta ao usuário, conforme aplicável e conforme instrumentos contratuais específicos.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">5. Cadastro, Formulários e Envio de Documentos</h2>
            <p>
              5.1. Para utilizar determinadas funcionalidades (por exemplo, solicitar diagnóstico, enviar faturas, acessar área restrita), você pode precisar fornecer dados e documentos.
            </p>
            <p>
              5.2. Você se compromete a enviar apenas informações que tenha direito de compartilhar e que não violem sigilo, confidencialidade, direitos de terceiros ou normas aplicáveis.
            </p>
            <p>
              5.3. Caso você envie faturas ou dados de consumo, você declara estar autorizado a fazê-lo e compreende que tais dados serão tratados conforme nossa Política de Privacidade, para fins de diagnóstico, simulação, comunicação e eventual contratação.
            </p>
            <p>
              5.4. Podemos recusar, bloquear ou excluir envios que estejam ilegíveis, incompletos, suspeitos, fraudulentos, ofensivos ou em desconformidade com estes Termos.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">6. Licença de Uso do Site e Propriedade Intelectual</h2>
            <p>
              6.1. Todo o conteúdo do Site, incluindo textos, marcas, logotipos, layout, bases de dados, gráficos, imagens, vídeos, materiais, códigos e funcionalidades, é de propriedade da Ótima Energia ou de seus licenciantes e está protegido por legislação aplicável de propriedade intelectual.
            </p>
            <p>
              6.2. Concedemos a você uma licença limitada, revogável, não exclusiva, intransferível e sem sublicenciamento para acessar e utilizar o Site para fins internos e não comerciais, exclusivamente conforme estes Termos.
            </p>
            <p>
              6.3. É proibido: copiar, reproduzir, modificar, distribuir, exibir publicamente, realizar engenharia reversa, explorar comercialmente, ou criar obras derivadas do conteúdo do Site sem autorização prévia e expressa.
            </p>
            <p>
              6.4. "Ótima Energia" e sinais distintivos associados são marcas de titularidade da Ótima Energia (ou de terceiros, quando indicado).
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">7. Condutas Proibidas</h2>
            <p>7.1. Você concorda em não:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>a) utilizar o Site para fins ilícitos, fraudulentos ou abusivos;</li>
              <li>b) enviar informações falsas, enganosas ou imprecisas;</li>
              <li>c) tentar obter acesso não autorizado a sistemas, contas, servidores ou redes;</li>
              <li>d) interferir ou interromper o funcionamento do Site, inclusive por meio de ataques, sobrecarga, exploração de vulnerabilidades, "hacking", "password mining" ou similares;</li>
              <li>e) utilizar robôs, spiders, scrapers, crawling automatizado, ou qualquer meio automatizado para coletar conteúdo, dados ou informações do Site sem autorização;</li>
              <li>f) inserir códigos maliciosos, vírus, ou qualquer elemento que possa prejudicar o Site ou terceiros;</li>
              <li>g) violar direitos de propriedade intelectual, sigilo ou confidencialidade;</li>
              <li>h) utilizar o Site de forma a impor carga desproporcional à infraestrutura.</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">8. Conteúdos de Terceiros e Links Externos</h2>
            <p>
              8.1. O Site pode conter links para sites de terceiros. A Ótima Energia não controla, não endossa e não se responsabiliza por conteúdos, políticas, práticas ou segurança de sites de terceiros.
            </p>
            <p>
              8.2. O uso de sites de terceiros é por sua conta e risco. Recomendamos a leitura dos termos e políticas desses terceiros.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">9. Disponibilidade do Site e Alterações</h2>
            <p>
              9.1. Podemos, a qualquer momento, modificar, suspender, descontinuar ou restringir o acesso a qualquer parte do Site, temporária ou permanentemente, com ou sem aviso prévio.
            </p>
            <p>
              9.2. Não garantimos que o Site funcionará de forma ininterrupta, livre de erros ou totalmente segura. Podemos realizar manutenções e atualizações.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">10. Isenções e Limitações de Responsabilidade</h2>
            <p>
              10.1. O Site e seu conteúdo são fornecidos "no estado em que se encontram" e "conforme disponível", sem garantias expressas ou implícitas, inclusive de adequação a um propósito específico, não violação ou disponibilidade contínua.
            </p>
            <p>10.2. Na máxima extensão permitida pela lei, a Ótima Energia não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>a) danos indiretos, lucros cessantes, perda de receita, perda de dados, interrupção de negócios;</li>
              <li>b) decisões tomadas com base em informações gerais do Site;</li>
              <li>c) falhas decorrentes de terceiros (ex.: provedores de internet, hospedagem, ataques externos);</li>
              <li>d) incompatibilidades técnicas do dispositivo do usuário;</li>
              <li>e) atrasos, indisponibilidades ou alterações regulatórias do setor elétrico que impactem prazos e condições.</li>
            </ul>
            <p>
              10.3. Nada nestes Termos exclui responsabilidades que não possam ser excluídas pela legislação aplicável.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">11. Indenização</h2>
            <p>11.1. Você concorda em indenizar, defender e isentar a Ótima Energia, seus administradores, colaboradores, parceiros e prestadores de serviços contra quaisquer reivindicações, perdas, danos, custos e despesas (incluindo honorários advocatícios), decorrentes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>a) do uso indevido do Site;</li>
              <li>b) do envio de informações ou documentos sem autorização;</li>
              <li>c) da violação destes Termos, da Política de Privacidade ou de direitos de terceiros.</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">12. Privacidade e Proteção de Dados</h2>
            <p>
              12.1. O tratamento de Dados Pessoais realizado pela Ótima Energia está descrito na <a href="/privacidade" className="text-[#9e3ffd] hover:underline">Política de Privacidade</a> do Site.
            </p>
            <p>
              12.2. Ao utilizar o Site, você declara ciência de que dados podem ser coletados e tratados conforme a Política de Privacidade.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">13. Comunicações</h2>
            <p>
              13.1. Podemos enviar comunicações operacionais relacionadas ao seu contato/diagnóstico (por e-mail, telefone, WhatsApp ou outros meios informados).
            </p>
            <p>
              13.2. Comunicações de marketing dependerão da base legal aplicável e, quando necessário, do seu consentimento, com opção de descadastro.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">14. Rescisão e Bloqueio de Acesso</h2>
            <p>
              14.1. Podemos suspender ou encerrar seu acesso ao Site (incluindo área restrita), a qualquer tempo, se identificarmos violação destes Termos, condutas suspeitas, fraude, risco de segurança ou exigência legal/regulatória.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">15. Atualizações destes Termos</h2>
            <p>
              15.1. Podemos alterar estes Termos periodicamente. A versão vigente será sempre a publicada no Site, com indicação da data de atualização.
            </p>
            <p>
              15.2. O uso continuado do Site após a publicação de alterações será considerado como aceitação dos Termos atualizados.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">16. Legislação Aplicável e Foro</h2>
            <p>
              16.1. Estes Termos são regidos pelas leis da República Federativa do Brasil.
            </p>
            <p>
              16.2. Fica eleito o foro da Comarca do Rio de Janeiro, RJ, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias relacionadas a estes Termos, salvo quando a legislação aplicável determinar foro diverso.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">17. Disposições Gerais</h2>
            <p>
              17.1. Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais permanecerão em pleno vigor.
            </p>
            <p>
              17.2. A eventual tolerância ao descumprimento de qualquer cláusula não constitui renúncia de direito.
            </p>
            <p>
              17.3. Estes Termos constituem o acordo integral entre você e a Ótima Energia sobre o uso do Site.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">18. Contato</h2>
            <p>Em caso de dúvidas, solicitações ou reclamações:</p>
            <ul className="list-none pl-0 space-y-2">
              <li><strong>E-mail:</strong> contato@otimaenergia.com</li>
              <li><strong>E-mail para privacidade:</strong> privacidade@otimaenergia.com</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}
