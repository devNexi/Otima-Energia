import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Calculator, 
  Trophy, 
  TrendingDown,
  Building2,
  Loader2,
  X,
  DollarSign,
  Calendar,
  Zap
} from "lucide-react";

interface Client {
  id: number;
  companyName: string;
  currentPriceRmwh?: string | null;
  avgConsumptionKwh?: string | null;
}

interface Supplier {
  id: number;
  name: string;
  shortCode: string;
}

interface SupplierQuote {
  id: number;
  supplierName: string;
  quoteReference?: string | null;
  validUntil: string;
  priceRmwh?: string | null;
  pldSpreadRmwh?: string | null;
  demandaPriceRkwMes?: string | null;
  contractDuration?: number | null;
  contractType?: string | null;
  ourCommissionRmwh?: string | null;
  commissionPaidBy?: string | null;
  totalClientCostAnnual?: string | null;
  ourCommissionAnnual?: string | null;
  clientSavingsAnnual?: string | null;
  effectivePriceRmwh?: string | null;
  status?: string | null;
}

interface CalculationResult {
  total_client_cost_annual: number;
  our_commission_annual: number;
  client_savings_annual: number;
  effective_price_rmwh: number;
  annual_consumption_mwh: number;
  energy_cost_annual: number;
  demand_cost_annual: number;
}

interface SupplierQuoteManagerProps {
  client: Client;
  onClose: () => void;
}

const CONTRACT_DURATIONS = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "48", label: "48 meses" },
];

const CONTRACT_TYPES = [
  { value: "Convencional", label: "Convencional" },
  { value: "11", label: "11" },
  { value: "15", label: "15" },
  { value: "Bior", label: "Bior" },
];

export function SupplierQuoteManager({ client, onClose }: SupplierQuoteManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addQuoteOpen, setAddQuoteOpen] = useState(false);
  const [priceType, setPriceType] = useState<"fixed" | "pld_spread">("fixed");
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  const [formData, setFormData] = useState({
    supplierName: "",
    quoteReference: "",
    validUntil: "",
    priceRmwh: "",
    pldSpreadRmwh: "",
    demandaPriceRkwMes: "",
    contractDuration: "24",
    contractType: "Convencional",
    ourCommissionRmwh: "5.00",
    commissionPaidBy: "supplier",
  });

  const [clientCalcData, setClientCalcData] = useState({
    avgConsumptionKwh: client.avgConsumptionKwh || "10000",
    demandaKw: "50",
    currentPriceRmwh: client.currentPriceRmwh || "0",
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      return res.json();
    }
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/clients", client.id, "quotes"],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${client.id}/quotes`);
      return res.json();
    }
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: { client_data: object; quote_data: object }) => {
      const res = await fetch("/api/quotes/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCalculationResult(data);
      }
    }
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: object) => {
      const res = await fetch(`/api/clients/${client.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id, "quotes"] });
      setAddQuoteOpen(false);
      resetForm();
      toast({ title: "Cotação adicionada com sucesso!" });
    }
  });

  const markWonMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const res = await fetch(`/api/supplier-quotes/${quoteId}/won`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id, "quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Cotação marcada como ganha!" });
    }
  });

  const suppliers: Supplier[] = suppliersData?.suppliers || [];
  const quotes: SupplierQuote[] = quotesData?.quotes || [];

  const sortedQuotes = [...quotes].sort((a, b) => {
    const costA = parseFloat(a.totalClientCostAnnual || "0");
    const costB = parseFloat(b.totalClientCostAnnual || "0");
    return costA - costB;
  });

  const currentPriceRmwh = parseFloat(client.currentPriceRmwh || "0");
  const avgConsumptionKwh = parseFloat(client.avgConsumptionKwh || "0");

  const resetForm = () => {
    setFormData({
      supplierName: "",
      quoteReference: "",
      validUntil: "",
      priceRmwh: "",
      pldSpreadRmwh: "",
      demandaPriceRkwMes: "",
      contractDuration: "24",
      contractType: "Convencional",
      ourCommissionRmwh: "5.00",
      commissionPaidBy: "supplier",
    });
    setCalculationResult(null);
    setPriceType("fixed");
  };

  const handleCalculate = () => {
    calculateMutation.mutate({
      client_data: {
        avgConsumptionKwh: parseFloat(clientCalcData.avgConsumptionKwh) || 10000,
        currentPriceRmwh: parseFloat(clientCalcData.currentPriceRmwh) || 0,
        demandaKw: parseFloat(clientCalcData.demandaKw) || 50,
      },
      quote_data: {
        price_type: priceType,
        priceRmwh: priceType === "fixed" ? formData.priceRmwh : undefined,
        pldSpreadRmwh: priceType === "pld_spread" ? formData.pldSpreadRmwh : undefined,
        demandaPriceRkwMes: formData.demandaPriceRkwMes,
        ourCommissionRmwh: formData.ourCommissionRmwh,
      }
    });
  };

  const handleSaveQuote = () => {
    if (!formData.supplierName || !formData.validUntil) {
      toast({ title: "Erro", description: "Preencha fornecedor e data de validade", variant: "destructive" });
      return;
    }

    const quoteData = {
      supplierName: formData.supplierName,
      quoteReference: formData.quoteReference || null,
      validUntil: formData.validUntil,
      priceRmwh: priceType === "fixed" ? formData.priceRmwh : null,
      pldSpreadRmwh: priceType === "pld_spread" ? formData.pldSpreadRmwh : null,
      demandaPriceRkwMes: formData.demandaPriceRkwMes || null,
      contractDuration: parseInt(formData.contractDuration),
      contractType: formData.contractType,
      ourCommissionRmwh: formData.ourCommissionRmwh,
      commissionPaidBy: formData.commissionPaidBy,
      totalClientCostAnnual: calculationResult?.total_client_cost_annual?.toString(),
      ourCommissionAnnual: calculationResult?.our_commission_annual?.toString(),
      clientSavingsAnnual: calculationResult?.client_savings_annual?.toString(),
      effectivePriceRmwh: calculationResult?.effective_price_rmwh?.toString(),
      status: "active",
    };

    createQuoteMutation.mutate(quoteData);
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!num) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "won":
        return <Badge className="bg-green-100 text-green-800">Ganha</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800">Ativa</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Expirada</Badge>;
      case "lost":
        return <Badge className="bg-red-100 text-red-800">Perdida</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Rascunho</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="supplier-quote-manager">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Cotações de Fornecedores - {client.companyName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Consumo médio: {avgConsumptionKwh ? `${avgConsumptionKwh.toLocaleString("pt-BR")} kWh/mês` : "Não informado"} | 
            Preço atual: {currentPriceRmwh ? `${formatCurrency(currentPriceRmwh)}/MWh` : "Não informado"}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addQuoteOpen} onOpenChange={setAddQuoteOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-quote">
                <Plus className="w-4 h-4 mr-2" />
                Nova Cotação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Cotação de Fornecedor</DialogTitle>
                <DialogDescription>Insira os dados da proposta recebida</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierName">Fornecedor *</Label>
                  <Input
                    id="supplierName"
                    list="suppliers-list"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="Selecione ou digite o nome..."
                    data-testid="input-supplier-name"
                  />
                  <datalist id="suppliers-list">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-400 mt-1">Digite para adicionar um novo fornecedor</p>
                </div>

                <div>
                  <Label htmlFor="quoteReference">Referência da Proposta</Label>
                  <Input
                    id="quoteReference"
                    value={formData.quoteReference}
                    onChange={(e) => setFormData({ ...formData, quoteReference: e.target.value })}
                    placeholder="Ex: PROP-2024-001"
                    data-testid="input-quote-reference"
                  />
                </div>

                <div>
                  <Label htmlFor="validUntil">Válido até *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    data-testid="input-valid-until"
                  />
                </div>

                <div>
                  <Label>Tipo de Preço</Label>
                  <Select
                    value={priceType}
                    onValueChange={(v: "fixed" | "pld_spread") => setPriceType(v)}
                  >
                    <SelectTrigger data-testid="select-price-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Preço Fixo (R$/MWh)</SelectItem>
                      <SelectItem value="pld_spread">PLD + Spread</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {priceType === "fixed" ? (
                  <div>
                    <Label htmlFor="priceRmwh">Preço (R$/MWh)</Label>
                    <Input
                      id="priceRmwh"
                      type="number"
                      step="0.01"
                      value={formData.priceRmwh}
                      onChange={(e) => setFormData({ ...formData, priceRmwh: e.target.value })}
                      placeholder="Ex: 350.00"
                      data-testid="input-price-rmwh"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="pldSpreadRmwh">Spread sobre PLD (R$/MWh)</Label>
                    <Input
                      id="pldSpreadRmwh"
                      type="number"
                      step="0.01"
                      value={formData.pldSpreadRmwh}
                      onChange={(e) => setFormData({ ...formData, pldSpreadRmwh: e.target.value })}
                      placeholder="Ex: 50.00"
                      data-testid="input-pld-spread"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="demandaPriceRkwMes">Demanda (R$/kW/mês)</Label>
                  <Input
                    id="demandaPriceRkwMes"
                    type="number"
                    step="0.01"
                    value={formData.demandaPriceRkwMes}
                    onChange={(e) => setFormData({ ...formData, demandaPriceRkwMes: e.target.value })}
                    placeholder="Ex: 25.00"
                    data-testid="input-demanda-price"
                  />
                </div>

                <div>
                  <Label htmlFor="contractDuration">Duração do Contrato</Label>
                  <Select
                    value={formData.contractDuration}
                    onValueChange={(v) => setFormData({ ...formData, contractDuration: v })}
                  >
                    <SelectTrigger data-testid="select-contract-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contractType">Tipo de Contrato</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(v) => setFormData({ ...formData, contractType: v })}
                  >
                    <SelectTrigger data-testid="select-contract-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ourCommissionRmwh">Nossa Comissão (R$/MWh)</Label>
                  <Input
                    id="ourCommissionRmwh"
                    type="number"
                    step="0.01"
                    value={formData.ourCommissionRmwh}
                    onChange={(e) => setFormData({ ...formData, ourCommissionRmwh: e.target.value })}
                    data-testid="input-commission"
                  />
                </div>

                <div>
                  <Label>Comissão Paga Por</Label>
                  <Select
                    value={formData.commissionPaidBy}
                    onValueChange={(v) => setFormData({ ...formData, commissionPaidBy: v })}
                  >
                    <SelectTrigger data-testid="select-commission-paid-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCalculate}
                  disabled={calculateMutation.isPending}
                  data-testid="button-calculate"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {calculateMutation.isPending ? "Calculando..." : "Calcular"}
                </Button>
              </div>

              {calculationResult && (
                <Card className="mt-4 bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-800">Resultado do Cálculo</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Custo Anual Cliente:</span>
                      <p className="font-semibold text-lg">{formatCurrency(calculationResult.total_client_cost_annual)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Nossa Comissão Anual:</span>
                      <p className="font-semibold text-lg text-violet-600">{formatCurrency(calculationResult.our_commission_annual)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Economia Anual Cliente:</span>
                      <p className={`font-semibold text-lg ${calculationResult.client_savings_annual > 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(calculationResult.client_savings_annual)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço Efetivo:</span>
                      <p className="font-semibold text-lg">{formatCurrency(calculationResult.effective_price_rmwh)}/MWh</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 mt-4 justify-end">
                <Button variant="outline" onClick={() => { setAddQuoteOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveQuote}
                  disabled={createQuoteMutation.isPending || !formData.supplierName || !formData.validUntil}
                  data-testid="button-save-quote"
                >
                  {createQuoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Cotação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={onClose} data-testid="button-close-quotes">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {quotesLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma cotação cadastrada</p>
            <p className="text-sm">Clique em "Nova Cotação" para adicionar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedQuotes.map((quote, index) => {
            const isBest = index === 0 && quote.totalClientCostAnnual;
            const savingsPercent = currentPriceRmwh && quote.effectivePriceRmwh
              ? ((currentPriceRmwh - parseFloat(quote.effectivePriceRmwh)) / currentPriceRmwh * 100).toFixed(1)
              : null;

            return (
              <Card 
                key={quote.id}
                className={`${isBest ? "border-green-400 border-2 shadow-lg" : ""} ${quote.status === "won" ? "bg-green-50" : ""}`}
                data-testid={`quote-card-${quote.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBest && quote.status !== "won" && (
                        <Badge className="bg-green-500 text-white">
                          <Trophy className="w-3 h-3 mr-1" />
                          Melhor Preço
                        </Badge>
                      )}
                      <CardTitle className="text-base">{quote.supplierName}</CardTitle>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.status !== "won" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => markWonMutation.mutate(quote.id)}
                          disabled={markWonMutation.isPending}
                          data-testid={`button-mark-won-${quote.id}`}
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          Marcar Ganha
                        </Button>
                      )}
                    </div>
                  </div>
                  {quote.quoteReference && (
                    <CardDescription>Ref: {quote.quoteReference}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Preço
                      </span>
                      <p className="font-medium">
                        {quote.priceRmwh 
                          ? `${formatCurrency(quote.priceRmwh)}/MWh` 
                          : quote.pldSpreadRmwh 
                            ? `PLD + ${formatCurrency(quote.pldSpreadRmwh)}` 
                            : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Validade
                      </span>
                      <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Custo Anual</span>
                      <p className="font-medium">{formatCurrency(quote.totalClientCostAnnual)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Economia
                      </span>
                      <p className={`font-medium ${savingsPercent && parseFloat(savingsPercent) > 0 ? "text-green-600" : ""}`}>
                        {savingsPercent ? `${savingsPercent}%` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t">
                    <div>
                      <span className="text-gray-500">Duração</span>
                      <p className="font-medium">{quote.contractDuration ? `${quote.contractDuration} meses` : "-"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipo</span>
                      <p className="font-medium">{quote.contractType || "-"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Nossa Comissão</span>
                      <p className="font-medium text-violet-600">
                        {formatCurrency(quote.ourCommissionAnnual)}/ano
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Paga por</span>
                      <p className="font-medium">{quote.commissionPaidBy === "supplier" ? "Fornecedor" : "Cliente"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedQuotes.length > 1 && (
            <Card className="bg-violet-50 border-violet-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-violet-800">Resumo de Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-violet-700">
                  <p>
                    Melhor cotação: <strong>{sortedQuotes[0].supplierName}</strong> - 
                    Comissão anual: <strong>{formatCurrency(sortedQuotes[0].ourCommissionAnnual)}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
