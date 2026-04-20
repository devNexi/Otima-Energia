import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  TrendingUp,
  Send
} from "lucide-react";

const DEAL_STATES = [
  'DRAFT',
  'RFQ_SENT',
  'QUOTES_RECEIVED',
  'OFFER_SELECTED',
  'CONTRACT_SENT',
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
  CONTRACT_SENT: "bg-yellow-100 text-yellow-800 border-yellow-300",
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
  CONTRACT_SENT: { en: "Contract Sent", pt: "Contrato Enviado" },
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
    productLine: "GDL" as "GDL" | "ACL",
    energyType: "convencional",
    submarket: "SE_CO",
    volumeType: "flat",
    internalOwner: "Renan"
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals"],
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/deals/dashboard"],
  });

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: awaitingData } = useQuery({
    queryKey: ["/api/contracts/awaiting-signature"],
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      const { productLine, energyType, ...rest } = data;
      const payload: any = { ...rest };
      if (productLine === "ACL") {
        payload.energyType = energyType || "convencional";
      }
      const res = await apiRequest("POST", "/api/deals", payload);
      const deal = await res.json();
      if (deal.success && deal.deal?.id) {
        await apiRequest("POST", `/api/deals/${deal.deal.id}/tracks`, { type: productLine });
      }
      return deal;
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
          productLine: "GDL",
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

  const deals = (dealsData as any)?.deals || [];
  const dashboard = (dashboardData as any)?.dashboard;
  const clients = (clientsData as any)?.clients || [];

  const filteredDeals = deals.filter((deal: any) => {
    if (statusFilter === "AWAITING_SIGNATURE") {
      if (deal.status !== "CONTRACT_SENT") return false;
    } else if (statusFilter !== "all" && deal.status !== statusFilter) return false;
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
      productLine: newDealForm.productLine,
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

      {(() => {
        const awaiting = awaitingData as any;
        const awaitingCount = awaiting?.count || 0;
        const contractSentCount = dashboard?.dealsByStatus?.CONTRACT_SENT || 0;
        if (awaitingCount === 0 && contractSentCount === 0) return null;
        return (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
            <CardContent className="py-3">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {language === "pt" ? "Minhas Ações Hoje" : "My Actions Today"}
              </p>
              <div className="flex flex-wrap gap-3">
                {awaitingCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-amber-300 bg-white hover:bg-amber-50"
                    onClick={() => setStatusFilter("AWAITING_SIGNATURE")}
                    data-testid="action-awaiting-signature"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    <span className="font-bold text-amber-700 mr-1">{awaitingCount}</span>
                    {language === "pt" ? "contratos aguardando assinatura" : "contracts awaiting signature"}
                  </Button>
                )}
                {contractSentCount > 0 && awaitingCount === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-amber-300 bg-white hover:bg-amber-50"
                    onClick={() => setStatusFilter("CONTRACT_SENT")}
                    data-testid="action-contract-sent"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    <span className="font-bold text-amber-700 mr-1">{contractSentCount}</span>
                    {language === "pt" ? "contratos enviados" : "contracts sent"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

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
                      <Label>{language === "pt" ? "Linha de Produto" : "Product Line"}</Label>
                      <Select 
                        value={newDealForm.productLine} 
                        onValueChange={(v) => setNewDealForm(prev => ({ ...prev, productLine: v as "GDL" | "ACL" }))}
                      >
                        <SelectTrigger data-testid="select-product-line">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GDL">GD (Geração Distribuída)</SelectItem>
                          <SelectItem value="ACL">ACL (Mercado Livre)</SelectItem>
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

                  {newDealForm.productLine === "ACL" && (
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
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                  <SelectItem value="AWAITING_SIGNATURE" className="font-medium text-amber-700">{language === "pt" ? "Aguardando Assinatura" : "Awaiting Signature"}</SelectItem>
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
                        <Badge className={`${stateColors[deal.status as DealState] || "bg-gray-100 text-gray-800 border-gray-300"} border`}>
                          {stateLabels[deal.status as DealState]?.[language as "en" | "pt"] || deal.status}
                        </Badge>
                        {deal.status === 'CONTRACT_SENT' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 border text-[10px] animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            {language === "pt" ? "Aguardando Assinatura" : "Awaiting Signature"}
                          </Badge>
                        )}
                        {deal.primaryTrackType === 'GDL' && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs" data-testid={`badge-track-gd-${deal.id}`}>GD</Badge>
                        )}
                        {deal.primaryTrackType === 'ACL' && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-xs" data-testid={`badge-track-acl-${deal.id}`}>ACL</Badge>
                        )}
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
                        {(() => {
                          const trackType = deal.primaryTrackType;
                          if (trackType === 'GDL') return <span>GD</span>;
                          if (trackType === 'ACL' && deal.energyType) return <span>ACL · <span className="capitalize">{deal.energyType.replace(/_/g, ' ')}</span></span>;
                          if (trackType === 'ACL') return <span>ACL</span>;
                          if (deal.energyType) return <span className="capitalize">{deal.energyType.replace(/_/g, ' ')}</span>;
                          return null;
                        })()}
                        {deal.submarket && (
                          <span>{deal.submarket}</span>
                        )}
                        {deal.contractStartDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(deal.contractStartDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                            {deal.contractEndDate && ` - ${new Date(deal.contractEndDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}
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