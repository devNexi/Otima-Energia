import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Clock, Building2, BarChart3 } from "lucide-react";
import { TRACK_TYPE_DISPLAY } from "@shared/schema";

interface TrackComparisonPanelProps {
  trackId: number;
  productType: string;
  dealId: string;
}

interface QuoteRow {
  supplierId: number;
  supplierName: string;
  baseEnergyPriceRmwh: number;
  termMonths: number;
  structure?: string;
  respondedAt?: string;
  status: string;
  responseTimeDays?: number;
}

function rankQuotes(quotes: QuoteRow[]): (QuoteRow & { rank: number; isBestFit: boolean })[] {
  if (!quotes.length) return [];
  const sorted = [...quotes].sort((a, b) => {
    if (a.baseEnergyPriceRmwh !== b.baseEnergyPriceRmwh) {
      return a.baseEnergyPriceRmwh - b.baseEnergyPriceRmwh;
    }
    return (a.responseTimeDays ?? 999) - (b.responseTimeDays ?? 999);
  });
  return sorted.map((q, i) => ({
    ...q,
    rank: i + 1,
    isBestFit: i === 0,
  }));
}

export default function TrackComparisonPanel({ trackId, productType, dealId }: TrackComparisonPanelProps) {
  const { language } = useI18n();
  const isPt = language === "pt";
  const displayType = TRACK_TYPE_DISPLAY[productType] || productType;

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/quotes`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/quotes`);
      return res.json();
    },
  });

  const { data: eligibleData, isLoading: eligibleLoading } = useQuery({
    queryKey: ["/api/suppliers/gd-eligible", productType],
    queryFn: async () => {
      if (productType === "GDL") {
        const res = await apiRequest("GET", `/api/suppliers/gd-eligible`);
        return res.json();
      }
      const res = await apiRequest("GET", `/api/supplier-rfq-playbooks`);
      return res.json();
    },
    enabled: true,
  });

  const isLoading = quotesLoading || eligibleLoading;

  const quotes: QuoteRow[] = (quotesData?.quotes || quotesData || [])
    .filter((q: any) => q.baseEnergyPriceRmwh && q.baseEnergyPriceRmwh > 0 && q.status !== "REJECTED")
    .map((q: any) => ({
      supplierId: q.supplierId,
      supplierName: q.supplierName || q.supplier?.name || `Supplier #${q.supplierId}`,
      baseEnergyPriceRmwh: Number(q.baseEnergyPriceRmwh),
      termMonths: q.termMonths || q.contractTermMonths || 0,
      structure: q.energyType || q.contractStructure || "",
      respondedAt: q.respondedAt || q.createdAt,
      status: q.status || "ACTIVE",
      responseTimeDays: q.respondedAt
        ? Math.ceil((new Date(q.respondedAt).getTime() - new Date(q.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    }));

  const rankedQuotes = rankQuotes(quotes);

  const eligibleCount = productType === "GDL"
    ? (eligibleData?.suppliers?.length || 0)
    : (eligibleData?.playbooks?.length || 0);

  if (isLoading) {
    return (
      <Card data-testid="card-comparison-loading">
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isPt ? "Carregando comparativo..." : "Loading comparison..."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`card-comparison-${trackId}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {isPt ? `Comparativo de Ofertas — ${displayType}` : `Offer Comparison — ${displayType}`}
        </CardTitle>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span data-testid="text-eligible-count">
            {isPt ? "Fornecedores elegíveis" : "Eligible suppliers"}: {eligibleCount}
          </span>
          <span data-testid="text-quotes-received">
            {isPt ? "Cotações recebidas" : "Quotes received"}: {quotes.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {rankedQuotes.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground" data-testid="text-no-quotes">
            {isPt
              ? "Nenhuma cotação recebida ainda. Envie RFQs para fornecedores elegíveis."
              : "No quotes received yet. Send RFQs to eligible suppliers."}
          </div>
        ) : (
          <div className="space-y-2">
            {rankedQuotes.map((q) => (
              <div
                key={q.supplierId}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  q.isBestFit
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-background"
                }`}
                data-testid={`row-comparison-${q.supplierId}`}
              >
                <div className="w-6 text-center font-bold text-sm text-muted-foreground">
                  {q.rank === 1 ? (
                    <Trophy className="w-4 h-4 text-green-600 mx-auto" />
                  ) : (
                    `#${q.rank}`
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate" data-testid={`text-supplier-name-${q.supplierId}`}>
                      {q.supplierName}
                    </span>
                    {q.isBestFit && (
                      <Badge className="bg-green-100 text-green-800 text-[10px] shrink-0" data-testid={`badge-best-fit-${q.supplierId}`}>
                        {isPt ? "Melhor Opção" : "Best Fit"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <div className="font-semibold text-sm" data-testid={`text-price-${q.supplierId}`}>
                    R$ {q.baseEnergyPriceRmwh.toFixed(2)}/MWh
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                    {q.termMonths > 0 && (
                      <span>{q.termMonths} {isPt ? "meses" : "mo"}</span>
                    )}
                    {q.structure && (
                      <span>{q.structure}</span>
                    )}
                    {q.responseTimeDays !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {q.responseTimeDays}d
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {rankedQuotes.length >= 2 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800" data-testid="card-comparison-summary">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  {isPt ? (
                    <>
                      <strong>{rankedQuotes[0].supplierName}</strong> oferece o melhor preço
                      (R$ {rankedQuotes[0].baseEnergyPriceRmwh.toFixed(2)}/MWh),{" "}
                      {((1 - rankedQuotes[0].baseEnergyPriceRmwh / rankedQuotes[rankedQuotes.length - 1].baseEnergyPriceRmwh) * 100).toFixed(1)}%
                      {" "}abaixo da oferta mais alta.
                    </>
                  ) : (
                    <>
                      <strong>{rankedQuotes[0].supplierName}</strong> offers the best price
                      (R$ {rankedQuotes[0].baseEnergyPriceRmwh.toFixed(2)}/MWh),{" "}
                      {((1 - rankedQuotes[0].baseEnergyPriceRmwh / rankedQuotes[rankedQuotes.length - 1].baseEnergyPriceRmwh) * 100).toFixed(1)}%
                      {" "}below the highest offer.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
