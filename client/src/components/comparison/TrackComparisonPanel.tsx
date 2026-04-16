import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trophy,
  TrendingDown,
  Building2,
  Zap,
  Clock,
  ArrowDownRight,
} from "lucide-react";
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
  createdAt?: string;
}

interface RankedQuote extends QuoteRow {
  rank: number;
  isBestFit: boolean;
  deltaVsHighest: number;
  barWidth: number;
}

function rankQuotes(quotes: QuoteRow[]): RankedQuote[] {
  if (!quotes.length) return [];
  const sorted = [...quotes].sort((a, b) => a.baseEnergyPriceRmwh - b.baseEnergyPriceRmwh);
  const lowest = sorted[0].baseEnergyPriceRmwh;
  const highest = sorted[sorted.length - 1].baseEnergyPriceRmwh;
  const spread = highest - lowest || 1;

  return sorted.map((q, i) => ({
    ...q,
    rank: i + 1,
    isBestFit: i === 0,
    deltaVsHighest: highest > 0 ? ((highest - q.baseEnergyPriceRmwh) / highest) * 100 : 0,
    barWidth: 30 + ((q.baseEnergyPriceRmwh - lowest) / spread) * 70,
  }));
}

function fmtPrice(price: number) {
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
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

  const { data: dealData, isLoading: dealLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}`);
      return res.json();
    },
  });

  const { data: eligibleData } = useQuery({
    queryKey: ["/api/suppliers/gd-eligible", productType],
    queryFn: async () => {
      if (productType === "GDL") {
        const res = await apiRequest("GET", `/api/suppliers/gd-eligible`);
        return res.json();
      }
      const res = await apiRequest("GET", `/api/supplier-rfq-playbooks`);
      return res.json();
    },
  });

  const isLoading = quotesLoading || dealLoading;

  const rawQuotes: QuoteRow[] = (quotesData?.quotes || quotesData || [])
    .filter((q: any) => q.baseEnergyPriceRmwh && Number(q.baseEnergyPriceRmwh) > 0 && q.status !== "REJECTED")
    .map((q: any) => ({
      supplierId: q.supplierId,
      supplierName: q.supplierName || q.supplier?.name || `Supplier #${q.supplierId}`,
      baseEnergyPriceRmwh: Number(q.baseEnergyPriceRmwh),
      termMonths: q.termMonths || q.contractTermMonths || 0,
      structure: q.energyType || q.contractStructure || "",
      respondedAt: q.respondedAt || q.createdAt,
      status: q.status || "ACTIVE",
      createdAt: q.createdAt,
    }));

  const rankedQuotes = rankQuotes(rawQuotes);

  // Derive client's current price from deal → client
  const deal = dealData?.deal || dealData;
  const clientCurrentPrice: number | null = (() => {
    const raw = deal?.client?.currentPriceRmwh || deal?.clientCurrentPriceRmwh || null;
    const n = Number(raw);
    return raw && n > 0 ? n : null;
  })();

  const avgMonthlyMwh = (() => {
    const m = deal?.volumeMwhMonth || deal?.volume_mwh_month;
    return m ? Number(m) : null;
  })();

  const eligibleCount = productType === "GDL"
    ? (eligibleData?.suppliers?.length || 0)
    : (eligibleData?.playbooks?.length || 0);

  const bestPrice = rankedQuotes[0]?.baseEnergyPriceRmwh;
  const mktAvg = rankedQuotes.length >= 2
    ? rankedQuotes.reduce((s, q) => s + q.baseEnergyPriceRmwh, 0) / rankedQuotes.length
    : null;

  // Annual savings vs client current price
  const annualSavings = clientCurrentPrice && bestPrice && avgMonthlyMwh
    ? (clientCurrentPrice - bestPrice) * avgMonthlyMwh * 12
    : null;

  const savingsPct = clientCurrentPrice && bestPrice
    ? ((clientCurrentPrice - bestPrice) / clientCurrentPrice) * 100
    : null;

  if (isLoading) {
    return (
      <Card data-testid="card-comparison-loading">
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isPt ? "Carregando comparativo..." : "Loading comparison..."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`card-comparison-${trackId}`} className="overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-white font-semibold text-sm tracking-wide">
                {isPt ? `Comparativo de Ofertas` : `Offer Comparison`}
                <span className="ml-2 text-slate-300 font-normal">— {displayType}</span>
              </span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-slate-400">
              {eligibleCount > 0 && (
                <span data-testid="text-eligible-count">
                  {isPt ? "Elegíveis" : "Eligible"}: <strong className="text-slate-200">{eligibleCount}</strong>
                </span>
              )}
              <span data-testid="text-quotes-received">
                {isPt ? "Cotações" : "Quotes"}: <strong className="text-slate-200">{rankedQuotes.length}</strong>
              </span>
              {mktAvg && rankedQuotes.length >= 2 && (
                <span>
                  {isPt ? "Média" : "Avg"}: <strong className="text-slate-200">R$ {fmtPrice(mktAvg)}/MWh</strong>
                </span>
              )}
            </div>
          </div>

          {clientCurrentPrice && (
            <div className="text-right">
              <div className="text-xs text-slate-400">{isPt ? "Preço atual" : "Current rate"}</div>
              <div className="text-white font-bold text-base">R$ {fmtPrice(clientCurrentPrice)}/MWh</div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        {/* Savings callout — only when we have a winning price + client current price */}
        {annualSavings !== null && savingsPct !== null && annualSavings > 0 && (
          <div
            className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border-b border-emerald-200"
            data-testid="card-savings-callout"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 shrink-0">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-emerald-700 font-medium">
                {isPt ? "Potencial de economia anual" : "Estimated annual savings"}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-800 font-bold text-xl" data-testid="text-annual-savings">
                  {fmtCurrency(annualSavings)}
                </span>
                <span className="text-emerald-600 text-sm font-medium">
                  ({savingsPct.toFixed(1)}% {isPt ? "de redução" : "reduction"})
                </span>
              </div>
            </div>
            {rankedQuotes[0] && (
              <div className="text-right text-xs text-emerald-700 shrink-0">
                <div>{isPt ? "vs. tarifa atual" : "vs. current tariff"}</div>
                <div className="flex items-center gap-1 justify-end font-semibold">
                  <ArrowDownRight className="w-3 h-3" />
                  {(clientCurrentPrice! - bestPrice).toFixed(2)} R$/MWh
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote list */}
        {rankedQuotes.length === 0 ? (
          <div className="text-center py-10 px-5" data-testid="text-no-quotes">
            <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isPt
                ? "Nenhuma cotação recebida ainda."
                : "No quotes received yet."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPt
                ? "Envie RFQs para fornecedores elegíveis para comparar ofertas."
                : "Send RFQs to eligible suppliers to compare offers."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {rankedQuotes.map((q, idx) => {
              const deltaPct = rankedQuotes.length >= 2
                ? ((q.baseEnergyPriceRmwh - rankedQuotes[0].baseEnergyPriceRmwh) / rankedQuotes[0].baseEnergyPriceRmwh) * 100
                : null;

              return (
                <div
                  key={q.supplierId}
                  className={`px-5 py-4 transition-colors ${
                    q.isBestFit
                      ? "bg-emerald-50/60"
                      : idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                  data-testid={`row-comparison-${q.supplierId}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5 ${
                      q.isBestFit ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {q.isBestFit ? (
                        <Trophy className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-xs font-bold">#{q.rank}</span>
                      )}
                    </div>

                    {/* Supplier + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`font-semibold text-sm ${q.isBestFit ? "text-emerald-900" : "text-foreground"}`}
                          data-testid={`text-supplier-name-${q.supplierId}`}
                        >
                          {q.supplierName}
                        </span>
                        {q.isBestFit && (
                          <Badge
                            className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold shrink-0"
                            data-testid={`badge-best-fit-${q.supplierId}`}
                          >
                            {isPt ? "Melhor Opção" : "Best Fit"}
                          </Badge>
                        )}
                        {deltaPct !== null && !q.isBestFit && (
                          <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                            +{deltaPct.toFixed(1)}% vs. melhor
                          </span>
                        )}
                      </div>

                      {/* Price bar */}
                      <div className="relative h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            q.isBestFit ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          style={{ width: `${q.barWidth}%` }}
                        />
                      </div>

                      {/* Sub-info */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {q.termMonths > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {q.termMonths} {isPt ? "meses" : "mo"}
                          </span>
                        )}
                        {q.structure && (
                          <span className="capitalize">{q.structure}</span>
                        )}
                        {clientCurrentPrice && (
                          <span className={`ml-auto font-medium ${
                            q.baseEnergyPriceRmwh < clientCurrentPrice ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {q.baseEnergyPriceRmwh < clientCurrentPrice
                              ? `${isPt ? "−" : "−"}${((clientCurrentPrice - q.baseEnergyPriceRmwh) / clientCurrentPrice * 100).toFixed(1)}% vs. atual`
                              : `+${((q.baseEnergyPriceRmwh - clientCurrentPrice) / clientCurrentPrice * 100).toFixed(1)}% vs. atual`
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <div
                        className={`font-bold text-base tabular-nums ${q.isBestFit ? "text-emerald-800" : "text-foreground"}`}
                        data-testid={`text-price-${q.supplierId}`}
                      >
                        R$ {fmtPrice(q.baseEnergyPriceRmwh)}
                      </div>
                      <div className="text-xs text-muted-foreground">/MWh</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary footer */}
            {rankedQuotes.length >= 2 && (
              <div
                className="px-5 py-3 bg-slate-50 flex items-center gap-2 text-xs text-slate-600"
                data-testid="card-comparison-summary"
              >
                <Trophy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>{rankedQuotes[0].supplierName}</strong>
                  {isPt ? " oferece o menor preço — " : " offers the lowest price — "}
                  {(
                    (1 - rankedQuotes[0].baseEnergyPriceRmwh / rankedQuotes[rankedQuotes.length - 1].baseEnergyPriceRmwh) * 100
                  ).toFixed(1)}%
                  {isPt ? " abaixo da oferta mais alta." : " below the highest offer."}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
