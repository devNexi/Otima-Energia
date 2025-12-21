import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermosParcerias() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-white pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <Link 
            href="/rede-de-lucros-otima"
            className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Rede de Lucros
          </Link>
          
          <h1 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-8">
            Termos do Programa de Parcerias
          </h1>
          
          <div className="prose prose-lg max-w-none text-[#736d77]">
            <p className="lead">
              Última atualização: Dezembro de 2025
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">1. Objeto</h2>
            <p>
              O Programa de Parcerias "Rede de Lucros Ótima" é uma iniciativa da Ótima Energia para 
              estabelecer parcerias comerciais com profissionais e empresas interessados em indicar 
              potenciais clientes para o Mercado Livre de Energia.
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">2. Elegibilidade</h2>
            <p>
              Podem participar do programa pessoas físicas maiores de 18 anos ou pessoas jurídicas 
              regularmente constituídas, desde que aprovadas pela Ótima Energia após análise cadastral.
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">3. Indicações</h2>
            <p>
              O parceiro só poderá indicar empresas, instituições ou pessoas que tenham autorizado 
              explicitamente o contato pela Ótima Energia. Indicações sem consentimento prévio serão 
              desconsideradas e podem resultar no desligamento do programa.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proibido uso de listas frias ou contatos não autorizados</li>
              <li>Proibido spam ou abordagens agressivas em nome da Ótima</li>
              <li>O parceiro deve informar ao indicado sobre a parceria</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">4. Comissões</h2>
            <p>
              As comissões serão calculadas com base no valor líquido recebido pela Ótima Energia 
              em cada contrato originado de indicação do parceiro:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>20% da comissão líquida da Ótima no contrato indicado</li>
              <li>5% adicional sobre comissões de parceiros indicados pelo parceiro</li>
              <li>Renovações geram novas comissões proporcionais</li>
            </ul>
            <p className="mt-4">
              Os pagamentos seguem a mesma modalidade recebida pela Ótima (à vista ou parcelado).
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">5. Perfil Mínimo de Clientes</h2>
            <p>
              A Ótima Energia atende preferencialmente clientes com consumo significativo de energia. 
              Indicações de pequenos comércios com consumo insuficiente poderão ser recusadas ou 
              não gerar comissões relevantes.
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">6. Obrigações do Parceiro</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter dados cadastrais atualizados</li>
              <li>Não fazer declarações falsas sobre a Ótima ou seus serviços</li>
              <li>Não prometer resultados específicos ou garantidos aos indicados</li>
              <li>Zelar pela reputação da Ótima Energia</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">7. Prazo e Rescisão</h2>
            <p>
              A participação no programa é por prazo indeterminado e pode ser encerrada por 
              qualquer das partes a qualquer momento. Comissões pendentes de contratos já fechados 
              serão honradas conforme o previsto.
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">8. Confidencialidade</h2>
            <p>
              O parceiro se compromete a manter sigilo sobre informações comerciais e operacionais 
              da Ótima Energia a que tiver acesso em razão da parceria.
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">9. Modificações</h2>
            <p>
              A Ótima Energia poderá modificar estes termos a qualquer momento, comunicando as 
              alterações aos parceiros com antecedência mínima de 30 dias.
            </p>
            
            <h2 className="text-xl font-semibold text-[#16163f] mt-8 mb-4">10. Contato</h2>
            <p>
              Para dúvidas sobre o programa, entre em contato através do email 
              contato@otimaenergia.com.br ou pelo WhatsApp disponível em nosso site.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
