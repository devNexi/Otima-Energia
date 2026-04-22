import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Trophy,
  TrendingDown,
  TrendingUp,
  Building2,
  Clock,
  Zap,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  BarChart2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface QuoteRow {
  id: string;
  supplierId: number;
  supplierName: string;
  baseEnergyPriceRmwh: number;
  termMonths: number;
  energyType: string | null;
  priceStructure: string | null;
  validUntil: string | null;
  isSelected: boolean;
  isRejected: boolean;
  selectionReason: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  supplier?: { name: string; shortCode?: string };
}

interface RankedQuote extends QuoteRow {
  rank: number;
  isBestFit: boolean;
  deltaVsBest: number;
  deltaVsCurrent: number | null;
  barWidth: number;
}

function rankQuotes(quotes: QuoteRow[], currentPrice: number | null): RankedQuote[] {
  const active = quotes.filter((q) => !q.isRejected);
  if (!active.length) return [];
  const sorted = [...active].sort((a, b) => a.baseEnergyPriceRmwh - b.baseEnergyPriceRmwh);
  const lowest = sorted[0].baseEnergyPriceRmwh;
  const highest = sorted[sorted.length - 1].baseEnergyPriceRmwh;
  const spread = highest - lowest || 1;
  return sorted.map((q, i) => ({
    ...q,
    rank: i + 1,
    isBestFit: i === 0,
    deltaVsBest: i === 0 ? 0 : ((q.baseEnergyPriceRmwh - lowest) / lowest) * 100,
    deltaVsCurrent: currentPrice
      ? ((q.baseEnergyPriceRmwh - currentPrice) / currentPrice) * 100
      : null,
    barWidth: 20 + ((q.baseEnergyPriceRmwh - lowest) / spread) * 80,
  }));
}

function fmtPrice(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCurrency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function energyTypeLabel(t: string | null) {
  if (!t) return null;
  const map: Record<string, string> = {
    convencional: "Convencional",
    incentivada_50: "Incentivada 50%",
    incentivada_100: "Incentivada 100%",
    gas: "GÁS",
    fixed: "Preço Fixo",
    indexed_ipca: "IPCA",
    indexed_igpm: "IGPM",
    pld_spread: "PLD+Spread",
  };
  return map[t.toLowerCase()] || t;
}

interface Props {
  dealId: string;
  deal: any;
}

export function QuotesComparisonTab({ dealId, deal }: Props) {
  const { language } = useI18n();
  const isPt = language === "pt";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectDialogQuote, setSelectDialogQuote] = useState<RankedQuote | null>(null);
  const [rejectDialogQuote, setRejectDialogQuote] = useState<RankedQuote | null>(null);
  const [selectReason, setSelectReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectedVisible, setRejectedVisible] = useState(false);

  const { data: quotesData, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/quotes`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/quotes`);
      return res.json();
    },
  });

  const selectMutation = useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/quotes/${quoteId}/select`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/quotes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] });
      toast({ title: isPt ? "Cotação selecionada" : "Quote selected", description: isPt ? "Cotação marcada como recomendada." : "Quote marked as recommended." });
      setSelectDialogQuote(null);
      setSelectReason("");
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/quotes/${quoteId}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/quotes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] });
      toast({ title: isPt ? "Cotação rejeitada" : "Quote rejected" });
      setRejectDialogQuote(null);
      setRejectReason("");
    },
    onError: () => toast({ title: isPt ? "Erro" : "Error", variant: "destructive" }),
  });

  const allQuotes: QuoteRow[] = (quotesData?.quotes || []).map((q: any) => ({
    id: q.id,
    supplierId: q.supplierId,
    supplierName: q.supplierName || q.supplier?.name || `Supplier #${q.supplierId}`,
    baseEnergyPriceRmwh: Number(q.baseEnergyPriceRmwh || 0),
    termMonths: q.termMonths || q.contractTermMonths || 0,
    energyType: q.energyType || null,
    priceStructure: q.priceStructure || null,
    validUntil: q.validUntil || null,
    isSelected: !!q.isSelected,
    isRejected: !!q.isRejected,
    selectionReason: q.selectionReason || null,
    rejectionReason: q.rejectionReason || null,
    notes: q.notes || null,
    createdAt: q.createdAt,
    supplier: q.supplier,
  })).filter((q: QuoteRow) => q.baseEnergyPriceRmwh > 0);

  const clientCurrentPrice: number | null = (() => {
    const raw = deal?.client?.currentPriceRmwh ?? deal?.clientCurrentPriceRmwh ?? null;
    const n = Number(raw);
    return raw && n > 0 ? n : null;
  })();

  const avgMonthlyMwh: number | null = (() => {
    const raw = deal?.volumeMwhMonth ?? deal?.client?.avgConsumptionKwh ?? null;
    if (!raw) return null;
    const n = Number(raw);
    return n > 0 ? n / 1000 : null; // kWh → MWh
  })();

  const rejectedQuotes = allQuotes.filter((q) => q.isRejected);
  const rankedQuotes = rankQuotes(allQuotes, clientCurrentPrice);
  const selectedQuote = allQuotes.find((q) => q.isSelected);
  const bestQuote = rankedQuotes[0];
  const mktAvg = rankedQuotes.length >= 2
    ? rankedQuotes.reduce((s, q) => s + q.baseEnergyPriceRmwh, 0) / rankedQuotes.length
    : null;
  const priceSpread = rankedQuotes.length >= 2
    ? rankedQuotes[rankedQuotes.length - 1].baseEnergyPriceRmwh - rankedQuotes[0].baseEnergyPriceRmwh
    : null;

  const annualSavings = clientCurrentPrice && bestQuote && avgMonthlyMwh
    ? (clientCurrentPrice - bestQuote.baseEnergyPriceRmwh) * avgMonthlyMwh * 12
    : null;
  const savingsPct = clientCurrentPrice && bestQuote
    ? ((clientCurrentPrice - bestQuote.baseEnergyPriceRmwh) / clientCurrentPrice) * 100
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{isPt ? "Carregando cotações..." : "Loading quotes..."}</span>
      </div>
    );
  }

  if (rankedQuotes.length === 0 && rejectedQuotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-base font-medium text-muted-foreground">
            {isPt ? "Nenhuma cotação recebida ainda" : "No quotes received yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isPt ? "Envie RFQs para fornecedores elegíveis para iniciar a comparação." : "Send RFQs to eligible suppliers to start comparing offers."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Internal-use badge */}
      <div className="flex items-center justify-between">
        <div />
        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {isPt ? "Uso interno" : "Internal use"}
        </Badge>
      </div>

      {/* Main comparison card */}
      <Card className="overflow-hidden border-0 shadow-md">
        {/* Dark header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-violet-400" />
                <span className="text-white font-semibold text-sm tracking-wide uppercase">
                  {isPt ? "Comparativo de Fornecedores" : "Supplier Comparison"}
                </span>
              </div>
              <div className="flex flex-wrap gap-5 mt-2 text-xs text-slate-400">
                <span>
                  {isPt ? "Cotações ativas" : "Active quotes"}:{" "}
                  <strong className="text-slate-100">{rankedQuotes.length}</strong>
                </span>
                {mktAvg && (
                  <span>
                    {isPt ? "Média de mercado" : "Market avg"}:{" "}
                    <strong className="text-slate-100">R$ {fmtPrice(mktAvg)}/MWh</strong>
                  </span>
                )}
                {priceSpread && priceSpread > 0 && (
                  <span>
                    {isPt ? "Variação" : "Spread"}:{" "}
                    <strong className="text-slate-100">R$ {fmtPrice(priceSpread)}/MWh</strong>
                  </span>
                )}
              </div>
            </div>
            {clientCurrentPrice && (
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">{isPt ? "Tarifa atual do cliente" : "Client current rate"}</div>
                <div className="text-white font-bold text-xl">R$ {fmtPrice(clientCurrentPrice)}</div>
                <div className="text-xs text-slate-400">/MWh</div>
              </div>
            )}
          </div>
        </div>

        {/* Savings banner */}
        {annualSavings !== null && savingsPct !== null && annualSavings > 0 && (
          <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 shrink-0">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                {isPt ? "Potencial de economia anual estimada" : "Estimated annual savings potential"}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-emerald-800 font-black text-2xl" data-testid="text-annual-savings">
                  {fmtCurrency(annualSavings)}
                </span>
                <span className="text-emerald-600 text-sm font-semibold">
                  ({savingsPct.toFixed(1)}% {isPt ? "de redução" : "reduction"})
                </span>
              </div>
            </div>
            {bestQuote && clientCurrentPrice && (
              <div className="text-right text-xs text-emerald-700 shrink-0 border-l border-emerald-200 pl-4">
                <div className="font-medium">{isPt ? "Melhor vs. atual" : "Best vs. current"}</div>
                <div className="flex items-center gap-1 justify-end font-bold text-base text-emerald-800 mt-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  −{(clientCurrentPrice - bestQuote.baseEnergyPriceRmwh).toFixed(2)} R$/MWh
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote rows */}
        <div className="divide-y">
          {rankedQuotes.map((q) => {
            const label = energyTypeLabel(q.energyType) || energyTypeLabel(q.priceStructure);
            return (
              <div
                key={q.id}
                data-testid={`row-quote-${q.id}`}
                className={`px-6 py-5 transition-colors ${
                  q.isSelected
                    ? "bg-violet-50 border-l-4 border-l-violet-500"
                    : q.isBestFit
                    ? "bg-emerald-50/50"
                    : "bg-white hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5 font-bold ${
                      q.isSelected
                        ? "bg-violet-500 text-white"
                        : q.isBestFit
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500 text-xs"
                    }`}
                  >
                    {q.isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : q.isBestFit ? (
                      <Trophy className="w-3.5 h-3.5" />
                    ) : (
                      <span>#{q.rank}</span>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: name + badges */}
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span
                        className={`font-semibold text-base ${
                          q.isSelected ? "text-violet-900" : q.isBestFit ? "text-emerald-900" : "text-foreground"
                        }`}
                        data-testid={`text-supplier-name-${q.id}`}
                      >
                        {q.supplierName}
                      </span>
                      {q.isSelected && (
                        <Badge className="bg-violet-100 text-violet-800 border border-violet-300 text-[11px] font-semibold">
                          <Check className="w-3 h-3 mr-1" />
                          {isPt ? "Selecionada" : "Selected"}
                        </Badge>
                      )}
                      {q.isBestFit && !q.isSelected && (
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
                          <Trophy className="w-3 h-3 mr-1" />
                          {isPt ? "Melhor Preço" : "Best Price"}
                        </Badge>
                      )}
                      {q.rank === 2 && !q.isSelected && (
                        <Badge variant="outline" className="text-slate-500 text-[11px]">
                          {isPt ? "2º lugar" : "Runner-up"}
                        </Badge>
                      )}
                      {label && (
                        <Badge variant="outline" className="text-xs text-slate-500">
                          {label}
                        </Badge>
                      )}
                      {q.termMonths > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {q.termMonths} {isPt ? "meses" : "mo"}
                        </span>
                      )}
                    </div>

                    {/* Price bar */}
                    <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          q.isSelected ? "bg-violet-500" : q.isBestFit ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        style={{ width: `${q.barWidth}%` }}
                      />
                    </div>

                    {/* Delta info row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {q.rank > 1 && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          +{q.deltaVsBest.toFixed(1)}% {isPt ? "vs. melhor" : "vs. best"}
                        </span>
                      )}
                      {q.deltaVsCurrent !== null && (
                        <span
                          className={`flex items-center gap-1 font-semibold ml-auto ${
                            q.deltaVsCurrent < 0 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {q.deltaVsCurrent < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {q.deltaVsCurrent < 0 ? "" : "+"}
                          {q.deltaVsCurrent.toFixed(1)}% {isPt ? "vs. tarifa atual" : "vs. current rate"}
                        </span>
                      )}
                    </div>

                    {q.selectionReason && (
                      <p className="text-xs text-violet-700 mt-2 italic">"{q.selectionReason}"</p>
                    )}
                  </div>

                  {/* Price + actions */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div>
                      <div
                        className={`font-black text-2xl tabular-nums ${
                          q.isSelected ? "text-violet-800" : q.isBestFit ? "text-emerald-800" : "text-foreground"
                        }`}
                        data-testid={`text-price-${q.id}`}
                      >
                        R$ {fmtPrice(q.baseEnergyPriceRmwh)}
                      </div>
                      <div className="text-xs text-muted-foreground">/MWh</div>
                    </div>

                    {!q.isSelected && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setRejectDialogQuote(q)}
                          data-testid={`button-reject-quote-${q.id}`}
                        >
                          <X className="w-3 h-3 mr-1" />
                          {isPt ? "Rejeitar" : "Reject"}
                        </Button>
                        <Button
                          size="sm"
                          className={`h-7 text-xs ${
                            q.isBestFit
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-violet-600 hover:bg-violet-700 text-white"
                          }`}
                          onClick={() => setSelectDialogQuote(q)}
                          data-testid={`button-select-quote-${q.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {isPt ? "Selecionar" : "Select"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Competitive summary footer */}
        {rankedQuotes.length >= 2 && (
          <div className="px-6 py-3 bg-slate-50 border-t flex items-center gap-2 text-xs text-slate-600">
            <Trophy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              <strong className="text-slate-800">{rankedQuotes[0].supplierName}</strong>{" "}
              {isPt ? "oferece o menor preço —" : "offers the lowest price —"}{" "}
              <strong className="text-emerald-700">
                {(
                  (1 - rankedQuotes[0].baseEnergyPriceRmwh / rankedQuotes[rankedQuotes.length - 1].baseEnergyPriceRmwh) *
                  100
                ).toFixed(1)}
                %{" "}
              </strong>
              {isPt ? "abaixo da oferta mais alta" : "below the highest offer"}.
            </span>
          </div>
        )}
      </Card>

      {/* Intelligent Recommendation */}
      {rankedQuotes.length > 0 && (
        <Card className="border border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-violet-100 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-violet-900">
                    {isPt ? "Recomendação Inteligente" : "Smart Recommendation"}
                  </span>
                  {selectedQuote ? (
                    <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-[10px]">
                      {isPt ? "Selecionada" : "Confirmed"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                      {isPt ? "Pendente" : "Pending"}
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-slate-700 leading-relaxed">
                  {selectedQuote ? (
                    <>
                      <strong className="text-violet-800">{selectedQuote.supplierName}</strong>{" "}
                      {isPt ? "foi selecionada como a melhor opção para este deal." : "has been selected as the best fit for this deal."}
                      {selectedQuote.selectionReason && (
                        <span className="block mt-1 text-slate-500 italic">"{selectedQuote.selectionReason}"</span>
                      )}
                    </>
                  ) : bestQuote ? (
                    <>
                      {isPt
                        ? `Com base nas cotações recebidas, `
                        : `Based on received quotes, `}
                      <strong className="text-violet-800">{bestQuote.supplierName}</strong>
                      {isPt
                        ? ` apresenta o melhor preço (R$ ${fmtPrice(bestQuote.baseEnergyPriceRmwh)}/MWh)`
                        : ` offers the best price (R$ ${fmtPrice(bestQuote.baseEnergyPriceRmwh)}/MWh)`}
                      {mktAvg && rankedQuotes.length >= 2 && (
                        <>
                          {isPt ? ", ficando " : ", sitting "}
                          <strong className="text-emerald-700">
                            {((mktAvg - bestQuote.baseEnergyPriceRmwh) / mktAvg * 100).toFixed(1)}%
                          </strong>
                          {isPt ? " abaixo da média de mercado" : " below market average"}
                        </>
                      )}
                      {savingsPct !== null && savingsPct > 0 && (
                        <>
                          {isPt ? " e representando uma economia de " : " and representing a "}
                          <strong className="text-emerald-700">{savingsPct.toFixed(1)}%</strong>
                          {isPt ? " em relação à tarifa atual." : " savings vs. current rate."}
                        </>
                      )}
                      {!savingsPct || savingsPct <= 0 ? "." : ""}
                    </>
                  ) : null}
                </div>

                {!selectedQuote && bestQuote && (
                  <Button
                    size="sm"
                    className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
                    onClick={() => setSelectDialogQuote(bestQuote)}
                    data-testid="button-select-recommendation"
                  >
                    <Check className="w-3 h-3 mr-1.5" />
                    {isPt ? `Confirmar ${bestQuote.supplierName}` : `Confirm ${bestQuote.supplierName}`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Rejected quotes (collapsible) */}
      {rejectedQuotes.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            onClick={() => setRejectedVisible((v) => !v)}
            data-testid="button-toggle-rejected"
          >
            {rejectedVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {rejectedVisible
              ? (isPt ? "Ocultar rejeitadas" : "Hide rejected")
              : (isPt ? `Ver ${rejectedQuotes.length} oferta(s) rejeitada(s)` : `Show ${rejectedQuotes.length} rejected offer(s)`)}
          </button>

          {rejectedVisible && (
            <Card className="mt-2 border-red-100">
              <CardContent className="divide-y p-0">
                {rejectedQuotes.map((q) => (
                  <div key={q.id} className="px-5 py-3 flex items-center gap-3 bg-red-50/50">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 shrink-0">
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-500 line-through">{q.supplierName}</span>
                      {q.rejectionReason && (
                        <span className="text-xs text-red-500 ml-2 italic">— {q.rejectionReason}</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-400 tabular-nums">
                      R$ {fmtPrice(q.baseEnergyPriceRmwh)}/MWh
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Select dialog */}
      <Dialog open={!!selectDialogQuote} onOpenChange={(o) => !o && setSelectDialogQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isPt ? "Selecionar Cotação" : "Select Quote"}</DialogTitle>
            <DialogDescription>
              {isPt
                ? `Confirmar ${selectDialogQuote?.supplierName} como oferta selecionada para este deal.`
                : `Confirm ${selectDialogQuote?.supplierName} as the selected offer for this deal.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectDialogQuote && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                <span className="font-medium text-sm">{selectDialogQuote.supplierName}</span>
                <span className="font-bold text-emerald-700">R$ {fmtPrice(selectDialogQuote.baseEnergyPriceRmwh)}/MWh</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                {isPt ? "Motivo da seleção (opcional)" : "Selection reason (optional)"}
              </label>
              <Textarea
                value={selectReason}
                onChange={(e) => setSelectReason(e.target.value)}
                placeholder={isPt ? "Ex: Melhor preço e prazo adequado para o cliente..." : "e.g., Best price and suitable term for the client..."}
                rows={3}
                data-testid="input-select-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelectDialogQuote(null)}>
                {isPt ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => selectDialogQuote && selectMutation.mutate({ quoteId: selectDialogQuote.id, reason: selectReason })}
                disabled={selectMutation.isPending}
                data-testid="button-confirm-select"
              >
                {selectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Check className="w-4 h-4 mr-1" />
                {isPt ? "Confirmar Seleção" : "Confirm Selection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialogQuote} onOpenChange={(o) => !o && setRejectDialogQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {isPt ? "Rejeitar Cotação" : "Reject Quote"}
            </DialogTitle>
            <DialogDescription>
              {isPt
                ? `Rejeitar a oferta de ${rejectDialogQuote?.supplierName}. Esta ação pode ser revertida.`
                : `Reject the offer from ${rejectDialogQuote?.supplierName}. This can be undone.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                {isPt ? "Motivo da rejeição" : "Rejection reason"}
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isPt ? "Ex: Preço acima do esperado pelo cliente..." : "e.g., Price above client's expectation..."}
                rows={3}
                data-testid="input-reject-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialogQuote(null)}>
                {isPt ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectDialogQuote && rejectMutation.mutate({ quoteId: rejectDialogQuote.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                data-testid="button-confirm-reject"
              >
                {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <X className="w-4 h-4 mr-1" />
                {isPt ? "Confirmar Rejeição" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
