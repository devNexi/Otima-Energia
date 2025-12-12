import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

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
          <p className="text-[#736d77] mt-4">Última atualização: Dezembro 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <div className="prose prose-lg max-w-none text-[#736d77]">
            <h2 className="text-2xl font-medium text-[#16163f] mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o site e os serviços da Ótima Energia ("Empresa", "nós"), você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, por favor não utilize nossos serviços.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">2. Descrição dos Serviços</h2>
            <p>A Ótima Energia oferece serviços de corretagem de energia, incluindo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Serviço de comparação gratuito de ofertas de energia</li>
              <li>Auditorias energéticas sem custo e sem obrigação</li>
              <li>Análise de perfil de consumo energético impulsionada por IA</li>
              <li>Intermediação na contratação de energia</li>
              <li>Gestão e monitoramento de consumo</li>
              <li>Portal do cliente para envio de contas e acompanhamento</li>
            </ul>
            <p className="mt-4">
              <strong>Modelo de remuneração:</strong> Nosso serviço de comparação é gratuito para o empresário. Nossa remuneração vem exclusivamente dos fornecedores de energia, garantindo total alinhamento aos interesses do cliente.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">3. Elegibilidade</h2>
            <p>
              Os serviços de migração para o mercado livre são destinados a empresas que atendam aos requisitos regulatórios vigentes, incluindo demanda contratada mínima de 500kW ou consumo compatível. A Ótima Energia realizará análise de elegibilidade sem custos.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">4. Cadastro e Conta</h2>
            <p>
              Para acessar determinados serviços, você precisará criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">5. Obrigações do Usuário</h2>
            <p>Ao utilizar nossos serviços, você concorda em:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Não utilizar os serviços para fins ilegais</li>
              <li>Não tentar acessar áreas restritas do sistema</li>
              <li>Não transmitir vírus ou código malicioso</li>
              <li>Respeitar os direitos de propriedade intelectual</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do site, incluindo textos, gráficos, logos, ícones, imagens, software e sua compilação, é propriedade da Ótima Energia ou de seus licenciadores e está protegido por leis de direitos autorais e propriedade intelectual.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">7. Limitação de Responsabilidade</h2>
            <p>
              A Ótima Energia atua como intermediária na contratação de energia, não sendo responsável por: interrupções no fornecimento de energia pelo comercializador ou distribuidora; variações de preço no mercado de energia; cumprimento de obrigações por terceiros. As estimativas de economia são baseadas em projeções e dados fornecidos, podendo variar.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">8. Confidencialidade</h2>
            <p>
              Trataremos todas as informações comerciais e dados de consumo como confidenciais, compartilhando apenas com fornecedores para fins de cotação e contratação, ou quando exigido por lei.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">9. Portal do Cliente</h2>
            <p>
              O Portal do Cliente está sujeito a termos adicionais que serão apresentados no momento do cadastro. O acesso ao portal é pessoal e intransferível, sendo vedado o compartilhamento de credenciais.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">10. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar seu acesso aos serviços a qualquer momento, por violação destes termos ou por nossa conveniência, mediante aviso prévio quando aplicável.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">11. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas pelo site ou por e-mail. O uso continuado dos serviços após alterações constitui aceitação dos novos termos.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">12. Lei Aplicável e Foro</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca do Rio de Janeiro, RJ, para dirimir quaisquer controvérsias decorrentes destes termos.
            </p>

            <h2 className="text-2xl font-medium text-[#16163f] mt-12 mb-4">13. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>E-mail:</strong> contato@otimaenergia.com.br</li>
              <li><strong>Telefone:</strong> +55 21 99999-9999</li>
              <li><strong>Endereço:</strong> Rio de Janeiro, RJ - Brasil</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
