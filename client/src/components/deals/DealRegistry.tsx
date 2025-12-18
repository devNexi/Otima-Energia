import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { 
  Loader2, 
  Plus, 
  Filter, 
  Building2, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
  Eye,
  TrendingUp
} from "lucide-react";

const DEAL_STATES = [
  'DRAFT',
  'RFQ_SENT',
  'QUOTES_RECEIVED',
  'OFFER_SELECTED',
  'CONTRACT_SIGNED',
  'SUPPLY_LIVE',
  'COMMISSION_ACTIVE',
  'CONTRACT_ENDED',
  'CLOSED'
] as const;

type DealState = typeof DEAL_STATES[number];

const stateColors: Record<DealState, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
  RFQ_SENT: "bg-blue-100 text-blue-800 border-blue-300",
  QUOTES_RECEIVED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  OFFER_SELECTED: "bg-purple-100 text-purple-800 border-purple-300",
  CONTRACT_SIGNED: "bg-amber-100 text-amber-800 border-amber-300",
  SUPPLY_LIVE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  COMMISSION_ACTIVE: "bg-green-100 text-green-800 border-green-300",
  CONTRACT_ENDED: "bg-orange-100 text-orange-800 border-orange-300",
  CLOSED: "bg-slate-100 text-slate-800 border-slate-300"
};

const stateLabels: Record<DealState, { en: string; pt: string }> = {
  DRAFT: { en: "Draft", pt: "Rascunho" },
  RFQ_SENT: { en: "RFQ Sent", pt: "RFQ Enviado" },
  QUOTES_RECEIVED: { en: "Quotes Received", pt: "Cotações Recebidas" },
  OFFER_SELECTED: { en: "Offer Selected", pt: "Oferta Selecionada" },
  CONTRACT_SIGNED: { en: "Contract Signed", pt: "Contrato Assinado" },
  SUPPLY_LIVE: { en: "Supply Live", pt: "Fornecimento Ativo" },
  COMMISSION_ACTIVE: { en: "Commission Active", pt: "Comissão Ativa" },
  CONTRACT_ENDED: { en: "Contract Ended", pt: "Contrato Encerrado" },
  CLOSED: { en: "Closed", pt: "Fechado" }
};

interface DealRegistryProps {
  onViewDeal: (dealId: string) => void;
}

export function DealRegistry({ onViewDeal }: DealRegistryProps) {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    clientId: "",
    energyType: "convencional",
    submarket: "SE_CO",
    volumeType: "flat",
    internalOwner: "Renan"
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      return res.json();
    }
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/deals/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/deals/dashboard");
      return res.json();
    }
  });

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    }
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: language === "pt" ? "Deal criado" : "Deal created",
          description: language === "pt" ? "O deal foi criado com sucesso." : "The deal was created successfully."
        });
        queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/deals/dashboard"] });
        setNewDealOpen(false);
        setNewDealForm({
          clientId: "",
          energyType: "convencional",
          submarket: "SE_CO",
          volumeType: "flat",
          internalOwner: "Renan"
        });
      } else {
        toast({
          title: language === "pt" ? "Erro" : "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    }
  });

  const deals = dealsData?.deals || [];
  const dashboard = dashboardData?.dashboard;
  const clients = clientsData?.clients || [];

  const filteredDeals = deals.filter((deal: any) => {
    if (statusFilter !== "all" && deal.status !== statusFilter) return false;
    if (ownerFilter && !deal.internalOwner?.toLowerCase().includes(ownerFilter.toLowerCase())) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const clientName = deal.client?.companyName?.toLowerCase() || "";
      const supplierName = deal.supplier?.name?.toLowerCase() || "";
      if (!clientName.includes(searchLower) && !supplierName.includes(searchLower) && !deal.id.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const getStateProgress = (state: DealState) => {
    const index = DEAL_STATES.indexOf(state);
    return ((index + 1) / DEAL_STATES.length) * 100;
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealForm.clientId) {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" ? "Selecione um cliente" : "Select a client",
        variant: "destructive"
      });
      return;
    }
    createDealMutation.mutate({
      clientId: parseInt(newDealForm.clientId),
      energyType: newDealForm.energyType,
      submarket: newDealForm.submarket,
      volumeType: newDealForm.volumeType,
      internalOwner: newDealForm.internalOwner
    });
  };

  if (dealsLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="deal-registry">
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-violet-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {language === "pt" ? "Total Deals" : "Total Deals"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-900" data-testid="stat-total-deals">
                {dashboard.totalDeals}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {language === "pt" ? "Comissão Mensal" : "Monthly Commission"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-commission">
                R$ {parseFloat(dashboard.activeCommissionValue || "0").toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-gray-500">
                {language === "pt" ? "Deals ativos" : "Active deals"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === "pt" ? "Pagamentos Próximos" : "Upcoming Payments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600" data-testid="stat-upcoming">
                {dashboard.upcomingPayments}
              </div>
              <p className="text-xs text-gray-500">
                {language === "pt" ? "Próximos 30 dias" : "Next 30 days"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {language === "pt" ? "Pagamentos Atrasados" : "Overdue Payments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600" data-testid="stat-overdue">
                {dashboard.overduePayments}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {language === "pt" ? "Ação Necessária" : "Action Required"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600" data-testid="stat-action">
                {dashboard.dealsRequiringAction?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {language === "pt" ? "Registro de Deals" : "Deal Registry"}
              </CardTitle>
              <CardDescription>
                {language === "pt" 
                  ? "Sistema de controle de receita e execução de deals"
                  : "Revenue control and deal execution system"}
              </CardDescription>
            </div>
            <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700" data-testid="button-new-deal">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === "pt" ? "Novo Deal" : "New Deal"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === "pt" ? "Criar Novo Deal" : "Create New Deal"}</DialogTitle>
                  <DialogDescription>
                    {language === "pt" 
                      ? "Inicie um novo deal selecionando o cliente e configurações iniciais"
                      : "Start a new deal by selecting the client and initial settings"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDeal} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === "pt" ? "Cliente" : "Client"}</Label>
                    <Select 
                      value={newDealForm.clientId} 
                      onValueChange={(v) => setNewDealForm(prev => ({ ...prev, clientId: v }))}
                    >
                      <SelectTrigger data-testid="select-deal-client">
                        <SelectValue placeholder={language === "pt" ? "Selecione um cliente" : "Select a client"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "pt" ? "Tipo de Energia" : "Energy Type"}</Label>
                      <Select 
                        value={newDealForm.energyType} 
                        onValueChange={(v) => setNewDealForm(prev => ({ ...prev, energyType: v }))}
                      >
                        <SelectTrigger data-testid="select-energy-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="convencional">Convencional</SelectItem>
                          <SelectItem value="incentivada_50">Incentivada 50%</SelectItem>
                          <SelectItem value="incentivada_100">Incentivada 100%</SelectItem>
                          <SelectItem value="gas">Gás</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Submercado</Label>
                      <Select 
                        value={newDealForm.submarket} 
                        onValueChange={(v) => setNewDealForm(prev => ({ ...prev, submarket: v }))}
                      >
                        <SelectTrigger data-testid="select-submarket">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SE_CO">SE/CO</SelectItem>
                          <SelectItem value="S">Sul</SelectItem>
                          <SelectItem value="NE">Nordeste</SelectItem>
                          <SelectItem value="N">Norte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "pt" ? "Tipo de Volume" : "Volume Type"}</Label>
                      <Select 
                        value={newDealForm.volumeType} 
                        onValueChange={(v) => setNewDealForm(prev => ({ ...prev, volumeType: v }))}
                      >
                        <SelectTrigger data-testid="select-volume-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="modulated">Modulado</SelectItem>
                          <SelectItem value="linked_to_load">Vinculado à Carga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === "pt" ? "Responsável" : "Owner"}</Label>
                      <Input 
                        value={newDealForm.internalOwner}
                        onChange={(e) => setNewDealForm(prev => ({ ...prev, internalOwner: e.target.value }))}
                        data-testid="input-deal-owner"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createDealMutation.isPending}
                    data-testid="button-submit-deal"
                  >
                    {createDealMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === "pt" ? "Criar Deal" : "Create Deal"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="filter-status">
                  <SelectValue placeholder={language === "pt" ? "Filtrar por status" : "Filter by status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "pt" ? "Todos os Status" : "All Statuses"}</SelectItem>
                  {DEAL_STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {stateLabels[state][language as "en" | "pt"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input 
              placeholder={language === "pt" ? "Buscar por cliente ou fornecedor..." : "Search by client or supplier..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-deals"
            />

            <Input 
              placeholder={language === "pt" ? "Filtrar por responsável..." : "Filter by owner..."}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-48"
              data-testid="input-filter-owner"
            />
          </div>

          {filteredDeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{language === "pt" ? "Nenhum deal encontrado" : "No deals found"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeals.map((deal: any) => (
                <div 
                  key={deal.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  data-testid={`deal-row-${deal.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">
                          {deal.client?.companyName || `Client #${deal.clientId}`}
                        </h3>
                        <Badge className={`${stateColors[deal.status as DealState]} border`}>
                          {stateLabels[deal.status as DealState][language as "en" | "pt"]}
                        </Badge>
                        {deal.manualOverrideRequired && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {language === "pt" ? "Ação Manual" : "Manual Action"}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {deal.supplier && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {deal.supplier.name}
                          </span>
                        )}
                        {deal.energyType && (
                          <span className="capitalize">{deal.energyType.replace("_", " ")}</span>
                        )}
                        {deal.submarket && (
                          <span>{deal.submarket}</span>
                        )}
                        {deal.contractStartDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(deal.contractStartDate).toLocaleDateString("pt-BR")}
                            {deal.contractEndDate && ` - ${new Date(deal.contractEndDate).toLocaleDateString("pt-BR")}`}
                          </span>
                        )}
                        {deal.expectedCommissionMonthly && (
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            R$ {parseFloat(deal.expectedCommissionMonthly).toLocaleString("pt-BR")}/mês
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 transition-all"
                            style={{ width: `${getStateProgress(deal.status)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 min-w-[50px] text-right">
                          {Math.round(getStateProgress(deal.status))}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewDeal(deal.id)}
                        data-testid={`button-view-deal-${deal.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {language === "pt" ? "Ver Detalhes" : "View Details"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}