import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Star, CheckCircle2, Clock, Calendar, AlertTriangle, TrendingDown } from "lucide-react";
import logoFull from "@/assets/branding/logo-full-large.png";

interface ProposalSnapshot {
  proposal: {
    id: string;
    status: string;
    createdAt: string;
  };
  items: Array<{
    id: number;
    supplierName: string;
    productType: string | null;
    finalEnergyPriceRmwh: string;
    clientEnergyPriceRmwh: string;
    termMonths: number;
    proposedCost12m: string | null;
    savings12m: string | null;
    isRecommended: boolean;
    publicNotes: string | null;
  }>;
  client: {
    name: string | null;
    company: string | null;
  };
  brandKit: {
    brandName: string;
    tagline: string | null;
    primaryColor: string;
    secondaryColor: string;
    darkColor: string;
    lightBgColor: string;
    textColor: string;
    fontFamily: string;
    logoUrl: string | null;
    footerText: string | null;
    websiteUrl: string | null;
  };
  generatedAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  GENERATED: { label: "Gerada", color: "bg-blue-100 text-blue-800" },
  SENT: { label: "Enviada", color: "bg-indigo-100 text-indigo-800" },
  VIEWED: { label: "Visualizada", color: "bg-purple-100 text-purple-800" },
  ACCEPTED: { label: "Aceita", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Expirada", color: "bg-orange-100 text-orange-800" }
};

export default function PublicProposal() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/public/proposals/${publicId}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/proposals/${publicId}`);
      if (!res.ok) throw new Error("Proposal not found");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Proposta não encontrada</h1>
        <p className="text-gray-500 text-center max-w-md">
          Esta proposta pode ter expirado ou não está mais disponível. 
          Entre em contato com seu consultor para mais informações.
        </p>
      </div>
    );
  }

  const snapshot: ProposalSnapshot = data.snapshot;
  const brandKit = snapshot.brandKit || data.brandKit;

  const recommendedItem = snapshot.items?.find(i => i.isRecommended);
  const otherItems = snapshot.items?.filter(i => !i.isRecommended) || [];

  return (
    <div 
      className="min-h-screen"
      style={{ 
        fontFamily: `${brandKit?.fontFamily || "Inter"}, sans-serif`,
        backgroundColor: brandKit?.lightBgColor || "#eee7f1"
      }}
    >
      <header className="py-4 px-4 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="overflow-hidden h-12">
            <img src={brandKit?.logoUrl || logoFull} alt={brandKit?.brandName || "Ótima Energia"} className="h-20 -mt-4 object-contain" />
          </div>
          {brandKit?.tagline && (
            <span className="text-sm hidden sm:block" style={{ color: brandKit?.textColor || "#736d77" }}>
              {brandKit.tagline}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: brandKit?.darkColor || "#16163f" }}
              >
                Proposta Comercial
              </h1>
              <p style={{ color: brandKit?.textColor || "#736d77" }}>
                {snapshot.client?.company && (
                  <span>Preparada para <strong>{snapshot.client.company}</strong></span>
                )}
              </p>
            </div>
            <Badge className={statusLabels[data.proposal?.status]?.color || "bg-gray-100"}>
              {statusLabels[data.proposal?.status]?.label || data.proposal?.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: brandKit?.textColor || "#736d77" }}>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Gerada em {new Date(snapshot.generatedAt).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg mb-6 border-2 border-amber-400 bg-amber-50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Preços válidos por 24 horas</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Os preços apresentados nesta proposta refletem condições de mercado e são válidos por <strong>24 horas</strong> a partir da data de emissão. Após esse prazo, os valores podem ser atualizados conforme variações do mercado de energia.
            </p>
          </div>
        </div>

        {recommendedItem && (
          <div 
            className="rounded-xl p-6 mb-6 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${brandKit?.primaryColor || "#9e3ffd"}, ${brandKit?.secondaryColor || "#df0af2"})` 
            }}
          >
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Opção Recomendada
            </div>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{recommendedItem.supplierName}</h3>
                <p className="text-white/80">{recommendedItem.productType || "Energia Convencional"} • {recommendedItem.termMonths} meses</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">
                  R$ {parseFloat(recommendedItem.clientEnergyPriceRmwh || recommendedItem.finalEnergyPriceRmwh).toFixed(2)}
                </p>
                <p className="text-white/70">por MWh</p>
              </div>
            </div>

            {recommendedItem.proposedCost12m && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/60 text-sm">Custo Mensal Est.</p>
                  <p className="text-white font-semibold">R$ {(parseFloat(recommendedItem.proposedCost12m) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Custo Anual Est.</p>
                  <p className="text-white font-semibold">R$ {parseFloat(recommendedItem.proposedCost12m).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                {recommendedItem.savings12m && parseFloat(recommendedItem.savings12m) > 0 && (
                  <>
                    <div>
                      <p className="text-white/60 text-sm">Economia Anual</p>
                      <p className="text-white font-semibold flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        R$ {parseFloat(recommendedItem.savings12m).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {recommendedItem.publicNotes && (
              <p className="mt-4 text-white/80 text-sm italic bg-white/10 rounded-lg p-3">
                "{recommendedItem.publicNotes}"
              </p>
            )}
          </div>
        )}

        {otherItems.length > 0 && (
          <>
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: brandKit?.darkColor || "#16163f" }}
            >
              Outras Opções
            </h2>
            <div className="space-y-4">
              {otherItems.map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.supplierName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.productType || "Energia Convencional"} • {item.termMonths} meses
                        </p>
                      </div>
                      <div className="text-right">
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: brandKit?.primaryColor || "#9e3ffd" }}
                        >
                          R$ {parseFloat(item.clientEnergyPriceRmwh || item.finalEnergyPriceRmwh).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">por MWh</p>
                      </div>
                    </div>
                    {item.proposedCost12m && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t text-sm">
                        <div>
                          <p className="text-gray-500">Custo Mensal Est.</p>
                          <p className="font-medium">R$ {(parseFloat(item.proposedCost12m) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Custo Anual Est.</p>
                          <p className="font-medium">R$ {parseFloat(item.proposedCost12m).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        {item.savings12m && parseFloat(item.savings12m) > 0 && (
                          <div>
                            <p className="text-gray-500">Economia Anual</p>
                            <p className="font-medium text-emerald-600 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              R$ {parseFloat(item.savings12m).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {item.publicNotes && (
                      <p className="mt-3 text-sm text-muted-foreground italic bg-gray-50 rounded p-2">
                        "{item.publicNotes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <Separator className="my-8" />

        <div 
          className="text-center p-6 rounded-xl bg-white"
          style={{ borderColor: brandKit?.primaryColor }}
        >
          <CheckCircle2 
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: brandKit?.primaryColor || "#9e3ffd" }}
          />
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: brandKit?.darkColor || "#16163f" }}
          >
            Próximos Passos
          </h3>
          <p style={{ color: brandKit?.textColor || "#736d77" }}>
            Entre em contato com seu consultor para prosseguir com a contratação.
            Estamos prontos para ajudar você a economizar com energia no Mercado Livre.
          </p>
        </div>
      </main>

      <footer 
        className="py-6 px-4 mt-8"
        style={{ backgroundColor: brandKit?.darkColor || "#16163f" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            {brandKit?.footerText || `© ${new Date().getFullYear()} ${brandKit?.brandName || "Ótima Energia"}. Todos os direitos reservados.`}
          </p>
          {brandKit?.websiteUrl && (
            <a 
              href={brandKit.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm mt-2 inline-block"
              style={{ color: brandKit?.primaryColor || "#9e3ffd" }}
            >
              {brandKit.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
