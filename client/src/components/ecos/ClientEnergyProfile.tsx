import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { 
  X, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  DollarSign,
  Zap,
  Building2,
  TrendingUp,
  RefreshCw,
  Plus,
  Loader2,
  Clock
} from "lucide-react";

interface ClientEnergyProfileProps {
  client: {
    id: number;
    companyName: string;
    segment?: string | null;
    region?: string | null;
    avgConsumptionKwh?: string | null;
  };
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  within_band: "bg-green-100 text-green-800 border-green-300",
  at_risk: "bg-yellow-100 text-yellow-800 border-yellow-300",
  above_band: "bg-red-100 text-red-800 border-red-300",
  no_data: "bg-gray-100 text-gray-600 border-gray-300"
};

const statusIcons: Record<string, any> = {
  within_band: CheckCircle2,
  at_risk: AlertTriangle,
  above_band: AlertCircle,
  no_data: Clock
};

const statusLabels: Record<string, Record<string, string>> = {
  pt: {
    within_band: "Dentro da Faixa",
    at_risk: "Em Risco",
    above_band: "Acima da Faixa",
    no_data: "Sem Dados"
  },
  en: {
    within_band: "Within Band",
    at_risk: "At Risk",
    above_band: "Above Band",
    no_data: "No Data"
  }
};

export function ClientEnergyProfile({ client, onClose }: ClientEnergyProfileProps) {
  const { toast } = useToast();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [newContractForm, setNewContractForm] = useState({
    contractStart: "",
    contractEnd: "",
    priceRmwh: "",
    volumeMwhMonth: "",
    supplierName: "",
    flexibilityPercent: "",
    commissionRmwh: ""
  });

  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: [`/api/ecos/contracts/${client.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/ecos/contracts/${client.id}`);
      return res.json();
    }
  });

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: [`/api/clients/${client.id}/bills`],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${client.id}/bills`);
      return res.json();
    }
  });

  const { data: ecosStatusData, isLoading: ecosLoading } = useQuery({
    queryKey: [`/api/ecos/status/${client.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/ecos/status/${client.id}`);
      return res.json();
    }
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: typeof newContractForm) => {
      const res = await fetch("/api/ecos/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          contractStart: data.contractStart,
          contractEnd: data.contractEnd,
          priceRmwh: data.priceRmwh,
          volumeMwhMonth: data.volumeMwhMonth || null,
          supplierName: data.supplierName,
          flexibilityPercent: data.flexibilityPercent || null,
          commissionRmwh: data.commissionRmwh || null
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create contract");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecos/contracts/${client.id}`] });
      setNewContractOpen(false);
      setNewContractForm({
        contractStart: "",
        contractEnd: "",
        priceRmwh: "",
        volumeMwhMonth: "",
        supplierName: "",
        flexibilityPercent: "",
        commissionRmwh: ""
      });
      toast({ title: language === "pt" ? "Contrato criado!" : "Contract created!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: language === "pt" ? "Erro" : "Error",
        description: error.message || (language === "pt" ? "Falha ao criar contrato" : "Failed to create contract"),
        variant: "destructive"
      });
    }
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ecos/evaluate/${client.id}`, {
        method: "POST"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecos/status/${client.id}`] });
      toast({ title: language === "pt" ? "Avaliação atualizada!" : "Evaluation updated!" });
    },
    onError: () => {
      toast({ 
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" ? "Falha ao avaliar cliente" : "Failed to evaluate client",
        variant: "destructive"
      });
    }
  });

  const contracts = contractsData?.contracts || [];
  const bills = billsData?.bills || [];
  const ecosStatus = ecosStatusData?.success ? ecosStatusData.status : null;

  const activeContract = contracts.find((c: any) => c.status === "active");
  const StatusIcon = ecosStatus ? statusIcons[ecosStatus.statusResult] || Clock : Clock;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US");
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `R$ ${num.toLocaleString(language === "pt" ? "pt-BR" : "en-US", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" data-testid="client-energy-profile">
        <div className="bg-violet-900 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {language === "pt" ? "Perfil Energético" : "Energy Profile"}
            </h2>
            <p className="text-violet-200 text-sm">{client.companyName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-violet-800" data-testid="button-close-profile">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`border-2 ${ecosStatus ? statusColors[ecosStatus.statusResult] : statusColors.no_data}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  {language === "pt" ? "Status ECOS" : "ECOS Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold" data-testid="ecos-status">
                  {ecosStatus 
                    ? statusLabels[language][ecosStatus.statusResult] 
                    : (language === "pt" ? "Sem avaliação" : "No evaluation")}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => evaluateMutation.mutate()}
                  disabled={evaluateMutation.isPending}
                  data-testid="button-evaluate"
                >
                  {evaluateMutation.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  {language === "pt" ? "Reavaliar" : "Re-evaluate"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  {language === "pt" ? "Preço Atual" : "Current Price"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-700" data-testid="current-price">
                  {activeContract ? `${formatCurrency(activeContract.priceRmwh)}/MWh` : "-"}
                </div>
                {ecosStatus?.potentialSavingsR && parseFloat(ecosStatus.potentialSavingsR) > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {language === "pt" ? "Economia potencial:" : "Potential savings:"} {formatCurrency(ecosStatus.potentialSavingsR)}/ano
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {language === "pt" ? "Vencimento" : "Expiration"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold" data-testid="contract-expiration">
                  {activeContract ? formatDate(activeContract.contractEnd) : "-"}
                </div>
                {ecosStatus?.contractRemainingMonths && (
                  <p className="text-xs text-gray-500">
                    {ecosStatus.contractRemainingMonths} {language === "pt" ? "meses restantes" : "months remaining"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {ecosStatus?.recommendation && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">
                      {language === "pt" ? "Recomendação" : "Recommendation"}
                    </p>
                    <p className="text-sm text-orange-700 mt-1" data-testid="recommendation">
                      {ecosStatus.recommendation}
                    </p>
                    {ecosStatus.explanationPt && (
                      <p className="text-xs text-orange-600 mt-2">
                        {ecosStatus.explanationPt}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="contracts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="contracts" className="flex items-center gap-2" data-testid="tab-contracts">
                <FileText className="w-4 h-4" />
                {language === "pt" ? "Contratos" : "Contracts"}
              </TabsTrigger>
              <TabsTrigger value="consumption" className="flex items-center gap-2" data-testid="tab-consumption">
                <TrendingUp className="w-4 h-4" />
                {language === "pt" ? "Consumo" : "Consumption"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contracts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{language === "pt" ? "Contratos de Energia" : "Energy Contracts"}</CardTitle>
                    <CardDescription>
                      {language === "pt" ? "Histórico de contratos do cliente" : "Client contract history"}
                    </CardDescription>
                  </div>
                  <Dialog open={newContractOpen} onOpenChange={setNewContractOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-new-contract">
                        <Plus className="w-4 h-4 mr-1" />
                        {language === "pt" ? "Novo Contrato" : "New Contract"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{language === "pt" ? "Adicionar Contrato" : "Add Contract"}</DialogTitle>
                        <DialogDescription>
                          {language === "pt" ? "Registre um novo contrato de energia" : "Register a new energy contract"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{language === "pt" ? "Início *" : "Start *"}</Label>
                            <Input
                              type="date"
                              value={newContractForm.contractStart}
                              onChange={(e) => setNewContractForm({ ...newContractForm, contractStart: e.target.value })}
                              data-testid="input-contract-start"
                            />
                          </div>
                          <div>
                            <Label>{language === "pt" ? "Término *" : "End *"}</Label>
                            <Input
                              type="date"
                              value={newContractForm.contractEnd}
                              onChange={(e) => setNewContractForm({ ...newContractForm, contractEnd: e.target.value })}
                              data-testid="input-contract-end"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>{language === "pt" ? "Fornecedor *" : "Supplier *"}</Label>
                          <Input
                            value={newContractForm.supplierName}
                            onChange={(e) => setNewContractForm({ ...newContractForm, supplierName: e.target.value })}
                            placeholder={language === "pt" ? "Nome do fornecedor" : "Supplier name"}
                            data-testid="input-supplier-name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{language === "pt" ? "Preço (R$/MWh) *" : "Price (R$/MWh) *"}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newContractForm.priceRmwh}
                              onChange={(e) => setNewContractForm({ ...newContractForm, priceRmwh: e.target.value })}
                              data-testid="input-price"
                            />
                          </div>
                          <div>
                            <Label>{language === "pt" ? "Volume (MWh/mês)" : "Volume (MWh/month)"}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newContractForm.volumeMwhMonth}
                              onChange={(e) => setNewContractForm({ ...newContractForm, volumeMwhMonth: e.target.value })}
                              data-testid="input-volume"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{language === "pt" ? "Flexibilidade (%)" : "Flexibility (%)"}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newContractForm.flexibilityPercent}
                              onChange={(e) => setNewContractForm({ ...newContractForm, flexibilityPercent: e.target.value })}
                              data-testid="input-flexibility"
                            />
                          </div>
                          <div>
                            <Label>{language === "pt" ? "Comissão (R$/MWh)" : "Commission (R$/MWh)"}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newContractForm.commissionRmwh}
                              onChange={(e) => setNewContractForm({ ...newContractForm, commissionRmwh: e.target.value })}
                              data-testid="input-commission"
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => createContractMutation.mutate(newContractForm)}
                          disabled={
                            !newContractForm.contractStart || 
                            !newContractForm.contractEnd || 
                            !newContractForm.priceRmwh ||
                            !newContractForm.supplierName ||
                            createContractMutation.isPending
                          }
                          data-testid="button-save-contract"
                        >
                          {createContractMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {language === "pt" ? "Salvar Contrato" : "Save Contract"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {contractsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : contracts.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {language === "pt" ? "Nenhum contrato cadastrado" : "No contracts registered"}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contracts.map((contract: any) => (
                        <div 
                          key={contract.id} 
                          className={`border rounded-lg p-4 ${contract.status === "active" ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                          data-testid={`contract-row-${contract.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{contract.supplierName}</span>
                                <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                                  {contract.status === "active" 
                                    ? (language === "pt" ? "Ativo" : "Active")
                                    : contract.status === "expired"
                                    ? (language === "pt" ? "Expirado" : "Expired")
                                    : contract.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(contract.contractStart)} - {formatDate(contract.contractEnd)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(contract.priceRmwh)}/MWh
                                </span>
                                {contract.volumeMwhMonth && (
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {contract.volumeMwhMonth} MWh/mês
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consumption">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "pt" ? "Histórico de Consumo" : "Consumption History"}</CardTitle>
                  <CardDescription>
                    {language === "pt" ? "Faturas enviadas pelo cliente" : "Bills uploaded by client"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {billsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : bills.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {language === "pt" ? "Nenhuma fatura enviada" : "No bills uploaded"}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bills.map((bill: any) => (
                        <div 
                          key={bill.id} 
                          className="border rounded-lg p-4"
                          data-testid={`bill-row-${bill.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{bill.mesReferencia || bill.fileName}</span>
                                <Badge variant={bill.ocrStatus === "success" ? "default" : "secondary"}>
                                  {bill.ocrStatus === "success" 
                                    ? (language === "pt" ? "Processado" : "Processed")
                                    : bill.ocrStatus === "pending"
                                    ? (language === "pt" ? "Pendente" : "Pending")
                                    : bill.ocrStatus}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                {bill.consumoKwh && (
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {parseFloat(bill.consumoKwh).toLocaleString()} kWh
                                  </span>
                                )}
                                {bill.demandaKw && (
                                  <span>
                                    {language === "pt" ? "Demanda:" : "Demand:"} {bill.demandaKw} kW
                                  </span>
                                )}
                                {bill.valorTotal && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {formatCurrency(bill.valorTotal)}
                                  </span>
                                )}
                                {bill.distribuidora && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {bill.distribuidora}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
