import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Download, Copy, MessageCircle, Eye, Edit, Loader2, 
  TrendingUp, CheckCircle2, Zap, Calendar, Star
} from "lucide-react";
import type { DealProposal, DealProposalItem, Client, Supplier } from "@shared/schema";

interface QuoteWithSupplier {
  id: string;
  supplierId: number;
  supplierName: string;
  energyType: string | null;
  baseEnergyPriceRmwh: string | null;
  clientEnergyPriceRmwh: string | null;
  validUntil: string | null;
  termMonths?: number;
  isComplete?: boolean;
  isRiskFlagged?: boolean;
  isExpired?: boolean;
}

interface ProposalGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  client: Client;
  quotes: QuoteWithSupplier[];
  suppliers?: Supplier[];
}

interface ProposalItem extends DealProposalItem {
  supplierName: string;
}

const RECOMMENDED_REASONS = [
  "Melhor custo-benefício no prazo escolhido",
  "Fornecedor confiável com histórico comprovado",
  "Maior flexibilidade contratual",
  "Preço competitivo com indexação favorável",
  "Alinhado ao perfil de consumo do cliente"
];

export function ProposalGenerator({ open, onOpenChange, dealId, client, quotes: fallbackQuotes, suppliers }: ProposalGeneratorProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch eligible quotes from API (excludes expired/incomplete/risk-flagged)
  const { data: eligibleQuotesData, isLoading: loadingQuotes } = useQuery({
    queryKey: ["eligible-quotes", dealId],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${dealId}/eligible-quotes`, {
        credentials: "include"
      });
      if (!response.ok) return { quotes: [] };
      return response.json();
    },
    enabled: open
  });
  
  const quotes: QuoteWithSupplier[] = useMemo(() => {
    const apiQuotes = eligibleQuotesData?.quotes || [];
    return apiQuotes.filter((q: QuoteWithSupplier) => (q.clientEnergyPriceRmwh || q.baseEnergyPriceRmwh) && q.termMonths);
  }, [eligibleQuotesData]);
  
  const [activeTab, setActiveTab] = useState("configure");
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Baseline inputs (from bill data or manual entry)
  const [baseline, setBaseline] = useState({
    consumptionMwh12m: "",
    energySupplyCost12m: "",
    energySupplyCostManual: "",
    costIsProxy: false,
    proxyLabel: "Estimativa conservadora",
    isAnnualized: false,
    sourceNote: "Últimos 12 meses"
  });
  
  // Track if using manual entry mode
  const [useManualBaseline, setUseManualBaseline] = useState(false);
  
  // Selected quotes to include in proposal
  const [selectedItems, setSelectedItems] = useState<Array<{
    quoteId: string;
    termMonths: number;
    marginValue: number;
    energyType: string;
    indexationType: string;
    publicNotes: string;
  }>>([]);
  
  const [recommendedItemIndex, setRecommendedItemIndex] = useState<number | null>(null);
  const [recommendedReason, setRecommendedReason] = useState(RECOMMENDED_REASONS[0]);
  const [validityDays, setValidityDays] = useState(15);
  const [preparedByName, setPreparedByName] = useState("");
  
  // Compute savings for each item
  const computedItems = useMemo(() => {
    const baselineConsumption = parseFloat(baseline.consumptionMwh12m) || 0;
    // Use manual entry if extracted is not available
    const baselineCost = parseFloat(baseline.energySupplyCost12m) || parseFloat(baseline.energySupplyCostManual) || 0;
    
    return selectedItems.map((item, index) => {
      const quote = quotes.find(q => q.id === item.quoteId);
      if (!quote) return null;
      
      const effectivePrice = quote.clientEnergyPriceRmwh || quote.baseEnergyPriceRmwh;
      if (!effectivePrice) return null;
      const clientPrice = parseFloat(effectivePrice);
      const finalPrice = clientPrice + item.marginValue;
      
      let proposedCost12m = 0;
      let savings12m = 0;
      let savingsTotal = 0;
      let savingsMonthlyAvg = 0;
      let isNegative = false;
      
      if (baselineConsumption > 0 && baselineCost > 0) {
        proposedCost12m = baselineConsumption * finalPrice;
        savings12m = baselineCost - proposedCost12m;
        savingsTotal = savings12m * (item.termMonths / 12);
        savingsMonthlyAvg = savingsTotal / item.termMonths;
        isNegative = savingsTotal < 0;
      }
      
      return {
        ...item,
        quote,
        supplierName: quote.supplierName || 'Fornecedor',
        finalPrice,
        proposedCost12m,
        savings12m,
        savingsTotal,
        savingsMonthlyAvg,
        isNegative,
        isRecommended: index === recommendedItemIndex
      };
    }).filter(Boolean);
  }, [selectedItems, quotes, baseline, recommendedItemIndex]);
  
  // Find best option (highest positive savings)
  const bestOption = useMemo(() => {
    const positive = computedItems.filter(i => i && !i.isNegative && i.savingsTotal > 0);
    if (positive.length === 0) return null;
    return positive.reduce((best, curr) => 
      (curr?.savingsTotal || 0) > (best?.savingsTotal || 0) ? curr : best
    , positive[0]);
  }, [computedItems]);
  
  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);
      
      const response = await fetch(`/api/deals/${dealId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baselineConsumptionMwh12m: baseline.consumptionMwh12m || null,
          baselineEnergySupplyCost12m: baseline.energySupplyCost12m || null,
          baselineEnergySupplyCostManual: useManualBaseline ? baseline.energySupplyCostManual : null,
          baselineCostIsProxy: baseline.costIsProxy,
          baselineProxyLabel: baseline.costIsProxy ? baseline.proxyLabel : null,
          baselineIsAnnualized: baseline.isAnnualized,
          baselineSourceNote: useManualBaseline ? "Entrada manual" : baseline.sourceNote,
          validUntil: validUntil.toISOString().split('T')[0],
          preparedByName: preparedByName || null,
          proposalTitle: `Proposta Comercial - ${client.companyName}`
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create proposal");
      return response.json();
    },
    onSuccess: async (data) => {
      setProposalId(data.proposal.id);
      
      // Add items
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const quote = quotes.find(q => q.id === item.quoteId);
        if (!quote) continue;
        
        await fetch(`/api/proposals/${data.proposal.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            dealQuoteId: item.quoteId,
            termMonths: item.termMonths,
            marginType: 'ADD_R_PER_MWH',
            marginValue: item.marginValue,
            energyType: item.energyType,
            indexationType: item.indexationType,
            isRecommended: i === recommendedItemIndex,
            publicNotes: item.publicNotes
          }),
        });
      }
      
      // Set recommended reason
      if (recommendedItemIndex !== null) {
        await fetch(`/api/proposals/${data.proposal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            recommendedReason
          }),
        });
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/proposals`] });
      toast({ title: "Proposta criada com sucesso" });
      setActiveTab("preview");
    },
    onError: () => {
      toast({ title: "Erro ao criar proposta", variant: "destructive" });
    },
  });
  
  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("proposal-preview-content");
      if (!element) throw new Error("Preview element not found");
      
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `proposta-${client.companyName?.replace(/\s+/g, '-') || 'cliente'}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };
      
      await html2pdf().set(opt).from(element).save();
      toast({ title: "PDF gerado com sucesso" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  
  const addQuoteToProposal = (quoteId: string) => {
    const quote = quotes.find((q: QuoteWithSupplier) => q.id === quoteId);
    if (!quote || !(quote.clientEnergyPriceRmwh || quote.baseEnergyPriceRmwh)) {
      toast({ 
        title: "Oferta inválida",
        description: "Esta oferta não possui preço definido.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedItems([...selectedItems, {
      quoteId,
      termMonths: quote.termMonths || 24,
      marginValue: 5, // Default R$/MWh margin
      energyType: quote.energyType || 'convencional',
      indexationType: 'IPCA',
      publicNotes: ''
    }]);
  };
  
  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
    if (recommendedItemIndex === index) {
      setRecommendedItemIndex(null);
    } else if (recommendedItemIndex !== null && recommendedItemIndex > index) {
      setRecommendedItemIndex(recommendedItemIndex - 1);
    }
  };
  
  const updateItem = (index: number, updates: Partial<typeof selectedItems[0]>) => {
    setSelectedItems(selectedItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // Check if baseline cost is available (extracted OR manual)
  const effectiveBaselineCost = baseline.energySupplyCost12m || baseline.energySupplyCostManual;
  
  const canGenerate = selectedItems.length > 0 && 
    baseline.consumptionMwh12m && 
    effectiveBaselineCost && 
    recommendedItemIndex !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerador de Proposta - {client.companyName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Configurar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévia
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2" disabled={!proposalId}>
              <MessageCircle className="h-4 w-4" />
              Enviar
            </TabsTrigger>
          </TabsList>

          {/* CONFIGURE TAB */}
          <TabsContent value="configure" className="mt-4 space-y-6">
            {/* Baseline Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Baseline do Cliente (Dados da Fatura)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Consumo Anual (MWh/12m)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 1200"
                    value={baseline.consumptionMwh12m}
                    onChange={(e) => setBaseline({ ...baseline, consumptionMwh12m: e.target.value })}
                    data-testid="input-baseline-consumption"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Custo Anual Fornecimento (R$)</Label>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useManualBaseline}
                        onChange={(e) => setUseManualBaseline(e.target.checked)}
                        className="h-3 w-3"
                      />
                      Entrada manual
                    </label>
                  </div>
                  {!useManualBaseline ? (
                    <Input
                      type="number"
                      placeholder="Ex: 480000 (da fatura)"
                      value={baseline.energySupplyCost12m}
                      onChange={(e) => setBaseline({ ...baseline, energySupplyCost12m: e.target.value })}
                      data-testid="input-baseline-cost"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Custo anual manual (R$)"
                        value={baseline.energySupplyCostManual}
                        onChange={(e) => setBaseline({ ...baseline, energySupplyCostManual: e.target.value })}
                        data-testid="input-baseline-cost-manual"
                      />
                      <label className="flex items-center gap-2 text-xs text-amber-600">
                        <input
                          type="checkbox"
                          checked={baseline.costIsProxy}
                          onChange={(e) => setBaseline({ ...baseline, costIsProxy: e.target.checked })}
                          className="h-3 w-3"
                        />
                        Marcar como estimativa conservadora
                      </label>
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={baseline.isAnnualized}
                      onChange={(e) => setBaseline({ 
                        ...baseline, 
                        isAnnualized: e.target.checked,
                        sourceNote: e.target.checked ? "Estimativa anualizada" : "Últimos 12 meses"
                      })}
                    />
                    <span className="text-sm">Dados anualizados (menos de 12 meses disponíveis)</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Quote Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Cotações para Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available quotes */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {quotes.filter(q => !selectedItems.some(si => si.quoteId === q.id)).map(quote => (
                    <Button
                      key={quote.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addQuoteToProposal(quote.id)}
                      data-testid={`button-add-quote-${quote.id}`}
                    >
                      + {quote.supplierName} ({quote.termMonths || 24}m)
                    </Button>
                  ))}
                  {quotes.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma oferta de fornecedor disponível para este deal</p>
                  )}
                </div>

                {/* Selected items */}
                {selectedItems.map((item, index) => {
                  const computed = computedItems[index];
                  const quote = quotes.find(q => q.id === item.quoteId);
                  
                  return (
                    <div key={index} className={`p-4 border rounded-lg ${index === recommendedItemIndex ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{quote?.supplierName}</span>
                          {index === recommendedItemIndex && (
                            <Badge className="bg-emerald-600"><Star className="h-3 w-3 mr-1" /> Recomendado</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={index === recommendedItemIndex ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setRecommendedItemIndex(index === recommendedItemIndex ? null : index)}
                          >
                            {index === recommendedItemIndex ? "Desmarcar" : "Marcar como Recomendado"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Prazo (meses)</Label>
                          <Select
                            value={item.termMonths.toString()}
                            onValueChange={(v) => updateItem(index, { termMonths: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12 meses</SelectItem>
                              <SelectItem value="24">24 meses</SelectItem>
                              <SelectItem value="36">36 meses</SelectItem>
                              <SelectItem value="60">60 meses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Ajuste (R$/MWh)</Label>
                          <Input
                            type="number"
                            value={item.marginValue}
                            onChange={(e) => updateItem(index, { marginValue: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tipo Energia</Label>
                          <Select
                            value={item.energyType}
                            onValueChange={(v) => updateItem(index, { energyType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="convencional">Convencional</SelectItem>
                              <SelectItem value="incentivada">Incentivada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Indexação</Label>
                          <Select
                            value={item.indexationType}
                            onValueChange={(v) => updateItem(index, { indexationType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IPCA">IPCA</SelectItem>
                              <SelectItem value="IGPM">IGP-M</SelectItem>
                              <SelectItem value="Fixo">Fixo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {computed && baseline.consumptionMwh12m && (
                        <div className="mt-3 p-2 bg-muted/50 rounded flex items-center justify-between text-sm">
                          <span>Preço Final: <strong>R$ {computed.finalPrice.toFixed(2)}/MWh</strong></span>
                          <span className={computed.isNegative ? 'text-red-600' : 'text-emerald-600'}>
                            {computed.isNegative ? (
                              <>Aumento: {formatCurrency(Math.abs(computed.savingsTotal))} no período</>
                            ) : (
                              <>Economia: {formatCurrency(computed.savingsTotal)} no período ({formatCurrency(computed.savingsMonthlyAvg)}/mês)</>
                            )}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <Label className="text-xs">Nota qualitativa (max 10 palavras)</Label>
                        <Input
                          placeholder="Ex: Ótimo custo-benefício para longo prazo"
                          value={item.publicNotes}
                          onChange={(e) => updateItem(index, { publicNotes: e.target.value })}
                          maxLength={80}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recommended Reason */}
            {recommendedItemIndex !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Por que Recomendamos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={recommendedReason} onValueChange={setRecommendedReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECOMMENDED_REASONS.map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Detalhes da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Validade (dias)</Label>
                  <Input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                    min={1}
                    max={90}
                  />
                </div>
                <div>
                  <Label>Preparado por</Label>
                  <Input
                    placeholder="Nome do consultor"
                    value={preparedByName}
                    onChange={(e) => setPreparedByName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => createProposalMutation.mutate()}
                disabled={!canGenerate || createProposalMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-create-proposal"
              >
                {createProposalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Gerar Proposta
              </Button>
            </div>
          </TabsContent>

          {/* PREVIEW TAB - PDF Layout */}
          <TabsContent value="preview" className="mt-4">
            <div id="proposal-preview-content" className="bg-white p-8 rounded-lg border" style={{ fontFamily: "Arial, sans-serif" }}>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-emerald-700">ÓTIMA ENERGIA</h1>
                <p className="text-sm text-gray-500">Corretora de Energia do Mercado Livre</p>
              </div>

              {/* Section A - Executive Summary */}
              <div className="bg-emerald-50 p-6 rounded-lg mb-6 border border-emerald-200">
                {bestOption ? (
                  <>
                    <h2 className="text-xl font-bold text-emerald-800 mb-2">
                      Potencial de economia estimada de até {formatCurrency(bestOption.savingsTotal)} no prazo de {bestOption.termMonths} meses
                    </h2>
                    <p className="text-emerald-700 mb-2">
                      Equivalente a ~{formatCurrency(bestOption.savingsMonthlyAvg)} por mês (média no período)
                    </p>
                    <p className="text-sm text-emerald-600 italic">
                      Baseado no seu histórico de consumo, sem compromisso.
                    </p>
                  </>
                ) : (
                  <p className="text-emerald-700">Configure as cotações para ver a economia estimada</p>
                )}
              </div>

              {/* Section B - Current Baseline */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Seu Consumo Atual
                </h3>
                {baseline.costIsProxy && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded mb-3 text-sm flex items-center gap-2">
                    <span className="font-medium">{baseline.proxyLabel || 'Estimativa conservadora'}</span>
                    <span className="text-amber-600">, Custo base estimado manualmente</span>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Consumo anual estimado</p>
                    <p className="text-xl font-bold">{baseline.consumptionMwh12m || '—'} MWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Custo anual atual (fornecimento)</p>
                    <p className="text-xl font-bold">
                      {effectiveBaselineCost ? formatCurrency(parseFloat(effectiveBaselineCost)) : '—'}
                      {useManualBaseline && <span className="text-xs text-amber-600 ml-1">(manual)</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preço médio atual</p>
                    <p className="text-xl font-bold">
                      {baseline.consumptionMwh12m && effectiveBaselineCost 
                        ? `R$ ${(parseFloat(effectiveBaselineCost) / parseFloat(baseline.consumptionMwh12m)).toFixed(2)}/MWh`
                        : '—'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  {baseline.isAnnualized 
                    ? "Estimativa baseada no histórico disponível de faturas (anualizado)."
                    : "Comparação baseada na parcela de fornecimento de energia das suas faturas atuais (últimos 12 meses)."}
                </p>
              </div>

              {/* Section C - Comparison Table */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Opções Disponíveis
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  As ofertas variam por prazo (24/36/60 meses). A economia total reflete o prazo escolhido.
                </p>
                
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border">Fornecedor</th>
                      <th className="p-2 text-center border">Tipo</th>
                      <th className="p-2 text-center border">Prazo</th>
                      <th className="p-2 text-right border">Preço (R$/MWh)</th>
                      <th className="p-2 text-right border">Economia no Período</th>
                      <th className="p-2 text-right border">Economia/Mês</th>
                      <th className="p-2 text-left border">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedItems.map((item, idx) => item && (
                      <tr key={idx} className={item.isRecommended ? 'bg-emerald-50' : ''}>
                        <td className="p-2 border font-medium">
                          {item.supplierName}
                          {item.isRecommended && <Badge className="ml-2 bg-emerald-600 text-xs">Recomendado</Badge>}
                        </td>
                        <td className="p-2 border text-center capitalize">{item.energyType}</td>
                        <td className="p-2 border text-center">{item.termMonths}m</td>
                        <td className="p-2 border text-right">R$ {item.finalPrice.toFixed(2)}</td>
                        <td className={`p-2 border text-right font-medium ${item.isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.isNegative 
                            ? `Aumento: ${formatCurrency(Math.abs(item.savingsTotal))}`
                            : formatCurrency(item.savingsTotal)}
                        </td>
                        <td className={`p-2 border text-right ${item.isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.isNegative 
                            ? `+${formatCurrency(Math.abs(item.savingsMonthlyAvg))}`
                            : formatCurrency(item.savingsMonthlyAvg)}
                        </td>
                        <td className="p-2 border text-xs text-gray-600">{item.publicNotes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section D - Recommended Option */}
              {recommendedItemIndex !== null && computedItems[recommendedItemIndex] && (
                <div className="mb-6 p-4 border-2 border-emerald-500 rounded-lg bg-emerald-50">
                  <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" /> Opção Recomendada
                  </h3>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Fornecedor</p>
                      <p className="font-medium">{computedItems[recommendedItemIndex]?.supplierName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Prazo</p>
                      <p className="font-medium">{computedItems[recommendedItemIndex]?.termMonths} meses</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preço</p>
                      <p className="font-medium">R$ {computedItems[recommendedItemIndex]?.finalPrice.toFixed(2)}/MWh</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Economia Total</p>
                      <p className="font-bold text-emerald-700">{formatCurrency(computedItems[recommendedItemIndex]?.savingsTotal || 0)}</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm"><strong>Por que recomendamos:</strong> {recommendedReason}</p>
                  </div>
                </div>
              )}

              {/* Section E - Next Steps */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Próximos Passos</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Escolher a opção (prazo e modelo)</li>
                  <li>Assinar documentos e aprovar garantias (se aplicável)</li>
                  <li>Onboarding com a comercializadora + data de início do fornecimento</li>
                </ol>
              </div>

              {/* Footer */}
              <Separator className="my-4" />
              <div className="text-xs text-gray-500">
                <p className="mb-2">
                  Economia estimada apenas na parcela de fornecimento de energia, baseada no consumo dos últimos 12 meses. 
                  Valores podem variar conforme perfil e condições contratuais.
                </p>
                <div className="flex justify-between">
                  <span>Proposta preparada por: {preparedByName || 'Ótima Energia'}</span>
                  <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                variant="outline"
                data-testid="button-download-pdf"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Baixar PDF
              </Button>
            </div>
          </TabsContent>

          {/* SEND TAB */}
          <TabsContent value="send" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Proposta criada com sucesso. Use os botões abaixo para compartilhar com o cliente.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    const link = `${window.location.origin}/proposal/view/${proposalId}`;
                    navigator.clipboard.writeText(link);
                    toast({ title: "Link copiado!" });
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button variant="outline" className="text-green-600" onClick={() => {
                    const phone = client.phone?.replace(/\D/g, "") || "";
                    const message = encodeURIComponent(
                      `Olá!\n\nSegue sua proposta comercial da Ótima Energia.\n\n` +
                      `${bestOption ? `Economia estimada: ${formatCurrency(bestOption.savingsTotal)} no prazo de ${bestOption.termMonths} meses` : ''}`
                    );
                    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                  }}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
