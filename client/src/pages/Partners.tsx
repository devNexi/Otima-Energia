import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Filter, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "ativo" | "destaque";
}

const partners: Partner[] = [
  {
    id: "neoenergia",
    name: "Neoenergia",
    description: "Uma das maiores distribuidoras de energia do Brasil",
    category: "Distribuidora",
    status: "destaque",
  },
  {
    id: "cpfl",
    name: "CPFL Energia",
    description: "Líder em energia renovável no Brasil",
    category: "Renovável",
    status: "destaque",
  },
  {
    id: "engie",
    name: "ENGIE Brasil",
    description: "Líder global em transição energética",
    category: "Renovável",
    status: "destaque",
  },
  {
    id: "enel",
    name: "Enel Brasil",
    description: "Principal operadora de energia renovável",
    category: "Renovável",
    status: "destaque",
  },
  {
    id: "equinor",
    name: "Equinor Brasil",
    description: "Desenvolvimento de energia eólica offshore e solar",
    category: "Eólica",
    status: "ativo",
  },
  {
    id: "shell",
    name: "Shell Energy Brasil",
    description: "Soluções integradas de energia",
    category: "Integrada",
    status: "ativo",
  },
  {
    id: "statkraft",
    name: "Statkraft Brasil",
    description: "Geração de energia renovável",
    category: "Renovável",
    status: "destaque",
  },
  {
    id: "voltalia",
    name: "Voltalia Brasil",
    description: "Produtor de energia solar e eólica",
    category: "Solar",
    status: "ativo",
  },
  {
    id: "omega",
    name: "Omega Energia",
    description: "Especialista em energia limpa e sustentável",
    category: "Renovável",
    status: "destaque",
  },
  {
    id: "auren",
    name: "Auren Energia",
    description: "Soluções completas em energia renovável",
    category: "Renovável",
    status: "ativo",
  },
  {
    id: "eneva",
    name: "Eneva",
    description: "Geração termelétrica e gás natural",
    category: "Termelétrica",
    status: "ativo",
  },
  {
    id: "aes",
    name: "AES Brasil",
    description: "Energia renovável com inovação tecnológica",
    category: "Renovável",
    status: "destaque",
  },
];

export default function Partners() {
  const [filter, setFilter] = useState<"todos" | "destaque">("destaque");
  
  const filteredPartners = filter === "todos" 
    ? partners 
    : partners.filter(p => p.status === "destaque");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - Matches DCVC Companies page */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <h1 className="text-[3.5rem] lg:text-[4.5rem] leading-[1] font-normal tracking-tight text-[#9e3ffd]">
              Parceiros
            </h1>
            <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed max-w-xl">
              Trabalhamos com diferentes agentes do setor elétrico para ampliar opções e promover concorrência real. Se você deseja colaborar para oferecer mais transparência e eficiência ao mercado, entre em contato.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar - Matches DCVC exactly */}
      <section className="bg-[#eee7f1] pb-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-4 mb-6">
            <button className="flex items-center gap-2 text-[#9e3ffd]">
              <Filter className="w-5 h-5" />
              <span className="text-sm font-medium">Filtrar</span>
            </button>
          </div>
          <p className="text-sm text-[#736d77]">
            Exibindo {filteredPartners.length} Parceiros em Destaque, de Todos os Setores.{" "}
            <button 
              onClick={() => setFilter(filter === "todos" ? "destaque" : "todos")}
              className="text-[#9e3ffd] hover:text-[#df0af2] hover:underline transition-colors"
            >
              {filter === "todos" ? "Mostrar Destaques" : "Mostrar Todos os Parceiros"}
            </button>
          </p>
        </div>
      </section>

      {/* Partners Grid - Matches DCVC Companies grid exactly */}
      <section className="bg-[#eee7f1] pb-24 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Partnership CTA Section */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#9e3ffd] mb-6">
                Quero ser Parceiro
              </h2>
              <p className="text-lg text-[#736d77] leading-relaxed mb-8">
                Você é fornecedor de energia, comercializador ou prestador de serviços no setor elétrico? Queremos conhecer você e colaborar para oferecer mais transparência e eficiência ao mercado.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <p className="text-[#736d77]">Acesso a uma base crescente de clientes empresariais</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <p className="text-[#736d77]">Processo de cotação simplificado e digital</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#9e3ffd] mt-1">•</span>
                  <p className="text-[#736d77]">Transparência total nas negociações</p>
                </div>
              </div>
            </div>

            <div className="bg-[#eee7f1] rounded-lg p-8 lg:p-10">
              <h3 className="text-xl font-medium text-[#3C145C] mb-6">
                Entre em contato
              </h3>
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Formulário enviado! Entraremos em contato em breve.'); }}>
                <div>
                  <label className="block text-sm text-[#3C145C] mb-2">Empresa *</label>
                  <Input 
                    placeholder="Nome da empresa" 
                    className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                    data-testid="input-partner-company"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-[#3C145C] mb-2">Nome *</label>
                    <Input 
                      placeholder="Seu nome" 
                      className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                      data-testid="input-partner-name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#3C145C] mb-2">E-mail *</label>
                    <Input 
                      type="email"
                      placeholder="email@empresa.com.br" 
                      className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                      data-testid="input-partner-email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#3C145C] mb-2">Tipo de Parceria</label>
                  <select className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white text-[#736d77] focus:border-[#9e3ffd] focus:outline-none">
                    <option value="">Selecione...</option>
                    <option value="fornecedor">Fornecedor de Energia</option>
                    <option value="comercializador">Comercializador</option>
                    <option value="distribuidora">Distribuidora</option>
                    <option value="tecnologia">Tecnologia/Serviços</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#3C145C] mb-2">Mensagem</label>
                  <Textarea 
                    placeholder="Conte-nos sobre sua empresa e interesse em parceria..." 
                    className="resize-none min-h-[100px] border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                    data-testid="input-partner-message"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                  data-testid="button-submit-partner"
                >
                  Enviar
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-[#736d77] mt-3 text-center">
                  Ao enviar, você confirma que é decisor(a) ou está autorizado(a) pela empresa a solicitar análises, cotações e avançar no processo.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div 
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#9e3ffd] hover:-translate-y-1 cursor-pointer"
      data-testid={`partner-card-${partner.id}`}
    >
      {/* Logo Area */}
      <div className="h-40 bg-[#eee7f1] flex items-center justify-center p-6">
        <span className="text-2xl font-semibold text-[#9e3ffd] tracking-tight text-center">
          {partner.name}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-[#3C145C] group-hover:text-[#9e3ffd] transition-colors mb-2">
          {partner.name}
        </h3>
        <p className="text-sm text-[#736d77] leading-relaxed mb-4">
          {partner.description}
        </p>
        <p className="text-xs uppercase tracking-wide text-[#c88ff5]">
          {partner.category}
        </p>
      </div>
    </div>
  );
}
