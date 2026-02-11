import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";


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
          <p className="text-[#736d77] mt-4">Ótima Energia Ltda.</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <div className="prose prose-lg max-w-none text-[#736d77]">
            <p className="text-lg mb-8">
              A Ótima Energia Ltda. ("Ótima Energia", "nós", "nosso" ou "conosco") reconhece a importância da sua privacidade e está comprometida em proteger os seus Dados Pessoais.
            </p>
            <p className="mb-12">
              Esta Política de Privacidade ("Política") explica, de forma clara e objetiva, quais dados coletamos, como os utilizamos, com quem podemos compartilhá-los, por quanto tempo os armazenamos e quais são os seus direitos, sempre em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados, LGPD) e demais normas aplicáveis.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mb-4">1. Quem Somos</h2>
            <ul className="list-none pl-0 space-y-2 mb-4">
              <li><strong>Controladora:</strong> Ótima Energia Ltda.</li>
              <li><strong>Site:</strong> https://otimaenergia.com</li>
              <li><strong>E-mail para privacidade:</strong> privacidade@otimaenergia.com</li>
              <li><strong>Contato geral:</strong> contato@otimaenergia.com</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">2. Definições</h2>
            <p>Para fins desta Política:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"Dado Pessoal":</strong> informação relacionada a pessoa natural identificada ou identificável (ex.: nome, e-mail, telefone).</li>
              <li><strong>"Dado Pessoal Sensível":</strong> dado sobre origem racial/étnica, convicção religiosa, opinião política, filiação sindical, dado de saúde/vida sexual, dado genético ou biométrico, quando vinculado a pessoa natural.</li>
              <li><strong>"Titular":</strong> pessoa natural a quem se referem os Dados Pessoais (você).</li>
              <li><strong>"Tratamento":</strong> qualquer operação com Dados Pessoais (coleta, uso, armazenamento, compartilhamento, eliminação etc.).</li>
              <li><strong>"LGPD":</strong> Lei nº 13.709/2018.</li>
              <li><strong>"ANPD":</strong> Autoridade Nacional de Proteção de Dados.</li>
              <li><strong>"Site":</strong> páginas e ambientes digitais operados pela Ótima Energia.</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">3. Dados Pessoais que Coletamos</h2>
            <p className="mb-4">
              Tratamos Dados Pessoais para viabilizar nossos serviços de diagnóstico, comparação e coordenação do processo no Mercado Livre de Energia, bem como para operar nosso Site e rotinas administrativas.
            </p>
            <p className="mb-2">Podemos coletar:</p>
            
            <h3 className="text-xl font-medium text-[#16163f] mt-6 mb-3">3.1. Dados cadastrais e de identificação</h3>
            <p>Nome, e-mail, telefone/WhatsApp, cargo, empresa, CNPJ da empresa (quando aplicável), endereço (quando necessário), documento de identificação (quando necessário para contratação).</p>
            
            <h3 className="text-xl font-medium text-[#16163f] mt-6 mb-3">3.2. Dados de consumo e informações técnicas</h3>
            <p>Dados de fatura/conta de energia, Unidade Consumidora (UC), histórico de consumo, demanda/contratação, informações do fornecimento, perfil de consumo e demais dados necessários para análises e simulações.</p>
            
            <h3 className="text-xl font-medium text-[#16163f] mt-6 mb-3">3.3. Dados de navegação e tecnologia</h3>
            <p>Endereço IP, data e hora de acesso, páginas visitadas, dispositivo, navegador, cookies, identificadores e registros de uso.</p>
            
            <h3 className="text-xl font-medium text-[#16163f] mt-6 mb-3">3.4. Registros de comunicação (quando aplicável)</h3>
            <p>Podemos registrar informações fornecidas em contatos por telefone/WhatsApp/e-mail (por exemplo: nome do responsável, cargo, status Mercado Livre vs distribuidora, Grupo A/B informado, melhor horário para contato).</p>
            <p className="mt-2">Quando permitido e aplicável, ligações podem ser gravadas e/ou transcritas para fins de qualidade, segurança, comprovação e melhoria de processos.</p>
            
            <h3 className="text-xl font-medium text-[#16163f] mt-6 mb-3">3.5. Dados financeiros e de pagamento (quando aplicável)</h3>
            <p>Dados bancários e informações necessárias para faturamento/recebimento/pagamento, quando houver contratação e/ou obrigações administrativas correlatas.</p>
            
            <p className="mt-4 p-4 bg-[#eee7f1] rounded-lg">
              <strong>Observação importante:</strong> Em regra, nossos serviços são direcionados a empresas. Ainda assim, podemos tratar dados de pessoas naturais (ex.: representante legal, sócio, responsável financeiro, contato comercial).
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">4. Fontes de Dados</h2>
            <p>
              Além dos dados fornecidos diretamente por você, podemos tratar dados de contato empresarial obtidos de fontes públicas e/ou bases acessíveis publicamente, para fins de prospecção B2B e atualização cadastral (por exemplo: registros empresariais e cadastros públicos que contenham telefone/e-mail comercial informado pela empresa).
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">5. Finalidades e Bases Legais (LGPD)</h2>
            <p className="mb-4">A seguir, exemplos das principais atividades de tratamento:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Diagnóstico e análise de elegibilidade/perfil:</strong> procedimentos preliminares / execução de contrato.</li>
              <li><strong>Modelagem de propostas e simulações:</strong> procedimentos preliminares / execução de contrato; legítimo interesse.</li>
              <li><strong>Atendimento e comunicação operacional:</strong> procedimentos preliminares / execução de contrato; legítimo interesse.</li>
              <li><strong>Contato inicial B2B e atualização cadastral (inclui chamadas telefônicas):</strong> legítimo interesse, observados direitos e expectativas do titular e mecanismos de oposição/descadastro.</li>
              <li><strong>Segurança, prevenção a fraude e auditoria:</strong> legítimo interesse; cumprimento de obrigação legal quando aplicável.</li>
              <li><strong>Melhoria de processos e qualidade do atendimento (inclui registros e, quando aplicável, gravação/transcrição):</strong> legítimo interesse.</li>
              <li><strong>Marketing institucional:</strong> consentimento ou legítimo interesse, conforme o caso, com opção de descadastro.</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">6. Contato por Telefone e Assistentes Virtuais (IA)</h2>
            <p className="mb-4">
              Podemos realizar contatos por telefone com números comerciais associados a empresas para: (i) confirmar dados cadastrais, (ii) identificar o responsável pela conta de energia, (iii) entender o status do fornecimento (Mercado Livre vs distribuidora) e (iv) encaminhar o atendimento ao time humano quando apropriado.
            </p>
            <p className="mb-4">
              Em alguns contatos, utilizamos assistentes virtuais para conduzir perguntas objetivas e registrar as respostas. No início do contato, buscamos uma confirmação de disponibilidade para prosseguir com perguntas rápidas (por exemplo: "Posso fazer duas perguntas rápidas sobre a conta de energia?").
            </p>
            <p>
              Se você não quiser continuar, pode solicitar o encerramento do contato e o bloqueio de novos contatos.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">7. Cookies e Tecnologias Semelhantes</h2>
            <p className="mb-4">
              Cookies são pequenos arquivos armazenados no seu dispositivo quando você acessa um site. Eles ajudam a garantir o funcionamento do Site, melhorar a experiência e compreender como o Site é utilizado.
            </p>
            <p className="mb-2">Podemos utilizar:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies necessários:</strong> essenciais para funcionamento do Site.</li>
              <li><strong>Cookies funcionais:</strong> personalizam preferências e melhoram a experiência.</li>
              <li><strong>Cookies analíticos:</strong> medem performance e uso do Site.</li>
              <li><strong>Cookies de marketing:</strong> permitem conteúdos e comunicações mais relevantes.</li>
            </ul>
            <p className="mt-4">
              Você pode gerenciar cookies nas configurações do seu navegador. Bloquear certos cookies pode afetar o funcionamento do Site.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">8. Links para Sites de Terceiros</h2>
            <p>
              Nosso Site pode conter links para sites de terceiros. Esta Política não se aplica a esses ambientes. Recomendamos que você leia as políticas de privacidade desses terceiros. Não nos responsabilizamos por conteúdo, segurança ou práticas de privacidade de terceiros.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">9. Compartilhamento de Dados Pessoais</h2>
            <p className="mb-2">Compartilhamos dados somente quando necessário, nos limites e finalidades desta Política, com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prestadores de serviços</strong> (hospedagem, atendimento, analytics, nuvem, automação, assinatura eletrônica, e-mail, telefonia).</li>
              <li><strong>Parceiros operacionais</strong> estritamente necessários quando você solicitar formalmente proposta/contratação que demande interação com agentes do setor.</li>
              <li><strong>Autoridades públicas</strong> quando houver obrigação legal/regulatória ou ordem judicial.</li>
            </ul>
            <p className="mt-4">
              Exigimos, sempre que aplicável, padrões de segurança e confidencialidade compatíveis com a LGPD.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">10. Transferência Internacional de Dados</h2>
            <p>
              Podemos armazenar ou processar dados em serviços de nuvem e ferramentas que operam fora do Brasil. Nesses casos, adotamos salvaguardas adequadas para assegurar conformidade com a LGPD e regulamentações da ANPD, incluindo cláusulas contratuais e avaliação de medidas de segurança.
            </p>
            <p className="mt-4">
              Se você quiser mais detalhes sobre os mecanismos utilizados, entre em contato pelos canais desta Política.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">11. Transferência de Controle / Operações Societárias</h2>
            <p>
              Em caso de fusão, aquisição, reorganização, cisão ou venda de ativos, os Dados Pessoais poderão ser transferidos a terceiros envolvidos na operação, respeitando esta Política e a legislação aplicável. Se houver mudanças materiais no tratamento, poderemos comunicar você e, quando necessário, solicitar consentimento.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">12. Segurança da Informação</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, perda, alteração, divulgação indevida e outros incidentes.
            </p>
            <p className="mt-4">
              Apesar disso, nenhuma transmissão na Internet é 100% segura. Caso ocorra incidente relevante, atuaremos para mitigar impactos e, quando aplicável, adotaremos as comunicações exigidas pela LGPD.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">13. Retenção e Eliminação de Dados</h2>
            <p className="mb-2">Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta Política, inclusive para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>cumprimento de obrigações legais/regulatórias;</li>
              <li>exercício regular de direitos em processos;</li>
              <li>auditorias e segurança;</li>
              <li>resguardo de evidências e prevenção à fraude.</li>
            </ul>
            <p className="mt-4">
              Ao final do prazo aplicável, os dados são eliminados ou anonimizados, conforme viável e permitido.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">14. Dados de Crianças e Adolescentes</h2>
            <p>
              Nossos serviços não são direcionados a crianças e adolescentes. Não coletamos intencionalmente dados de menores de 18 anos. Se identificarmos tratamento indevido, poderemos excluir os dados e adotar providências necessárias.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">15. Direitos do Titular</h2>
            <p className="mb-2">Nos termos da LGPD, você pode solicitar:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>confirmação de tratamento;</li>
              <li>acesso;</li>
              <li>correção;</li>
              <li>anonimização, bloqueio ou eliminação;</li>
              <li>portabilidade (quando aplicável);</li>
              <li>informação sobre compartilhamentos;</li>
              <li>informação sobre transferência internacional;</li>
              <li>revogação de consentimento (quando aplicável);</li>
              <li>revisão de decisões automatizadas (quando aplicável).</li>
            </ul>
            <p className="mt-4">
              Você também pode solicitar oposição a determinados tratamentos baseados em legítimo interesse e solicitar bloqueio de contatos.
            </p>
            <p className="mt-4">
              Para exercer seus direitos, entre em contato através do e-mail: <strong>privacidade@otimaenergia.com</strong>
            </p>
            <p className="mt-2">
              Podemos solicitar comprovação de identidade e/ou informações adicionais para segurança. Responderemos dentro de prazos razoáveis e conforme exigências legais.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">16. Decisões Automatizadas e Perfilamento</h2>
            <p>
              Podemos utilizar recursos tecnológicos para análise e organização de dados (ex.: extração de informações de faturas e simulações). Quando houver decisão automatizada com impacto relevante, o titular poderá solicitar revisão, nos termos da LGPD, através do canal de contato.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">17. Alterações desta Política</h2>
            <p>
              Podemos alterar esta Política a qualquer momento, com indicação da data da última atualização. Alterações relevantes poderão ser comunicadas por meios razoáveis (ex.: Site, e-mail), quando apropriado.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">18. Contato</h2>
            <ul className="list-none pl-0 space-y-2">
              <li><strong>E-mail para privacidade:</strong> privacidade@otimaenergia.com</li>
              <li><strong>Contato geral:</strong> contato@otimaenergia.com</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">19. Consentimento (Quando Aplicável)</h2>
            <p>
              Quando o tratamento se basear em consentimento, você poderá recusá-lo ou revogá-lo a qualquer momento. A recusa pode limitar determinados recursos (ex.: envio de marketing).
            </p>
            <p className="mt-4">
              Ao interagir conosco e utilizar nossos canais, você declara estar ciente desta Política e autoriza o tratamento de seus dados nos termos aqui previstos, conforme a base legal aplicável a cada finalidade.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}
