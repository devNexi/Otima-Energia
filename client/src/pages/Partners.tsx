import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Filter } from "lucide-react";

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
              Trabalhamos com os principais fornecedores de energia e parceiros tecnológicos do Brasil para entregar as melhores soluções para o seu negócio.
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
        <h3 className="text-lg font-medium text-[#16163f] group-hover:text-[#9e3ffd] transition-colors mb-2">
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
