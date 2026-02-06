import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle2, Calendar, Clock, TrendingDown, Zap, Shield, AlertTriangle } from "lucide-react";
import logoFull from "@/assets/branding/logo-full-large.png";

const brandKit = {
  brandName: "Ótima Energia",
  tagline: "Inteligência em energia para o seu negócio",
  primaryColor: "#9e3ffd",
  secondaryColor: "#df0af2",
  darkColor: "#16163f",
  lightBgColor: "#f3eef8",
  textColor: "#736d77",
  fontFamily: "Inter",
  logoUrl: null,
  footerText: null,
  websiteUrl: "https://otimaenergia.com",
};

const mockProposal = {
  clientCompany: "Metalúrgica São Paulo Ltda.",
  clientName: "Roberto Nascimento",
  generatedAt: new Date().toISOString(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  preparedBy: "Callum McIlroy",
  recommendedReason: "Melhor custo-benefício no período contratual",
  baselineConsumption: "4.200 MWh/ano",
  baselineCost: "R$ 2.520.000,00/ano",
  items: [
    {
      id: 1,
      supplierName: "ENGIE Brasil",
      productType: "Incentivada 50%",
      termMonths: 36,
      finalEnergyPriceRmwh: "285.50",
      annualEnergyCost: "1.199.100,00",
      savingsAnnual: "1.320.900,00",
      savingsPercent: "52.4",
      isRecommended: true,
      publicNotes: "Contrato com cláusula de reajuste por IPCA, sem multa de rescisão após 24 meses.",
    },
    {
      id: 2,
      supplierName: "Omega Energia",
      productType: "Incentivada 50%",
      termMonths: 24,
      finalEnergyPriceRmwh: "298.00",
      annualEnergyCost: "1.251.600,00",
      savingsAnnual: "1.268.400,00",
      savingsPercent: "50.3",
      isRecommended: false,
      publicNotes: "Prazo mais curto, ideal para quem busca flexibilidade.",
    },
    {
      id: 3,
      supplierName: "AES Brasil",
      productType: "Convencional",
      termMonths: 60,
      finalEnergyPriceRmwh: "272.00",
      annualEnergyCost: "1.142.400,00",
      savingsAnnual: "1.377.600,00",
      savingsPercent: "54.7",
      isRecommended: false,
      publicNotes: null,
    },
  ],
};

export default function ProposalPreview() {
  const recommended = mockProposal.items.find(i => i.isRecommended);
  const others = mockProposal.items.filter(i => !i.isRecommended);

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: `${brandKit.fontFamily}, sans-serif`,
        backgroundColor: brandKit.lightBgColor,
      }}
    >
      <header className="py-6 px-4 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img src={logoFull} alt="Ótima Energia" className="h-12" />
          <span className="text-sm hidden sm:block" style={{ color: brandKit.textColor }}>
            {brandKit.tagline}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: brandKit.darkColor }}
              >
                Proposta Comercial
              </h1>
              <p style={{ color: brandKit.textColor }}>
                Preparada para <strong>{mockProposal.clientCompany}</strong>
              </p>
              <p className="text-sm mt-1" style={{ color: brandKit.textColor }}>
                A/C: {mockProposal.clientName}
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Gerada</Badge>
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm" style={{ color: brandKit.textColor }}>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Gerada em {new Date(mockProposal.generatedAt).toLocaleDateString("pt-BR")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Válida até {new Date(mockProposal.validUntil).toLocaleDateString("pt-BR")}
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

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="p-5">
              <p className="text-sm" style={{ color: brandKit.textColor }}>Consumo Anual (referência)</p>
              <p className="text-xl font-bold mt-1" style={{ color: brandKit.darkColor }}>
                {mockProposal.baselineConsumption}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-5">
              <p className="text-sm" style={{ color: brandKit.textColor }}>Custo Atual Estimado</p>
              <p className="text-xl font-bold mt-1" style={{ color: brandKit.darkColor }}>
                {mockProposal.baselineCost}
              </p>
            </CardContent>
          </Card>
        </div>

        {recommended && (
          <div
            className="rounded-xl p-6 mb-6 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${brandKit.primaryColor}, ${brandKit.secondaryColor})`,
            }}
          >
            <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Opção Recomendada
            </div>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{recommended.supplierName}</h3>
                <p className="text-white/80">{recommended.productType} • {recommended.termMonths} meses</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">
                  R$ {parseFloat(recommended.finalEnergyPriceRmwh).toFixed(2)}
                </p>
                <p className="text-white/70">por MWh</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/60 text-sm">Custo Anual Estimado</p>
                <p className="text-white font-semibold">R$ {recommended.annualEnergyCost}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Economia Anual</p>
                <p className="text-white font-semibold flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  R$ {recommended.savingsAnnual}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Redução</p>
                <p className="text-white font-bold text-xl">{recommended.savingsPercent}%</p>
              </div>
            </div>

            {recommended.publicNotes && (
              <p className="mt-4 text-white/80 text-sm italic bg-white/10 rounded-lg p-3">
                "{recommended.publicNotes}"
              </p>
            )}
          </div>
        )}

        {mockProposal.recommendedReason && (
          <div className="mb-6 p-4 rounded-lg bg-white border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: brandKit.primaryColor }} />
              <span className="font-semibold text-sm" style={{ color: brandKit.darkColor }}>
                Por que recomendamos?
              </span>
            </div>
            <p className="text-sm" style={{ color: brandKit.textColor }}>
              {mockProposal.recommendedReason}
            </p>
          </div>
        )}

        {others.length > 0 && (
          <>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: brandKit.darkColor }}
            >
              Outras Opções
            </h2>
            <div className="space-y-4">
              {others.map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.supplierName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.productType} • {item.termMonths} meses
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-2xl font-bold"
                          style={{ color: brandKit.primaryColor }}
                        >
                          R$ {parseFloat(item.finalEnergyPriceRmwh).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">por MWh</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t text-sm">
                      <div>
                        <p className="text-gray-500">Custo Anual</p>
                        <p className="font-medium">R$ {item.annualEnergyCost}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Economia Anual</p>
                        <p className="font-medium text-emerald-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          R$ {item.savingsAnnual}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Redução</p>
                        <p className="font-bold text-emerald-700">{item.savingsPercent}%</p>
                      </div>
                    </div>
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
          className="text-center p-8 rounded-xl bg-white shadow-sm"
        >
          <CheckCircle2
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: brandKit.primaryColor }}
          />
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: brandKit.darkColor }}
          >
            Próximos Passos
          </h3>
          <p style={{ color: brandKit.textColor }} className="max-w-lg mx-auto">
            Entre em contato com seu consultor para prosseguir com a contratação.
            Estamos prontos para ajudar você a economizar com energia no Mercado Livre.
          </p>
          <p className="text-sm mt-4" style={{ color: brandKit.textColor }}>
            Preparado por: <strong>{mockProposal.preparedBy}</strong>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: brandKit.textColor }}>
          <Shield className="w-3 h-3" />
          <span>Proposta confidencial e de uso exclusivo do destinatário</span>
        </div>
      </main>

      <footer
        className="py-6 px-4 mt-8"
        style={{ backgroundColor: brandKit.darkColor }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} {brandKit.brandName}. Todos os direitos reservados.
          </p>
          <a
            href={brandKit.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm mt-2 inline-block"
            style={{ color: brandKit.primaryColor }}
          >
            {brandKit.websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
      </footer>
    </div>
  );
}
