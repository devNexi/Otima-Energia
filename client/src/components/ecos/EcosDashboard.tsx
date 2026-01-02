import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Users,
  TrendingDown,
  Clock,
  Loader2,
  ChevronRight,
  RefreshCcw,
  BookOpen,
  Bell
} from "lucide-react";

interface EcosDashboardProps {
  onViewClient?: (clientId: number) => void;
}

export function EcosDashboard({ onViewClient }: EcosDashboardProps) {
  const { language } = useI18n();
  const { toast } = useToast();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/ecos/dashboard-enhanced"],
    queryFn: async () => {
      const res = await fetch("/api/ecos/dashboard-enhanced");
      return res.json();
    }
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    }
  });

  const dashboard = dashboardData?.dashboard;
  const clients: any[] = clientsData?.clients || [];
  const clientsMap = new Map<number, any>(clients.map((c: any) => [c.id, c]));

  const getClientName = (clientId: number): string => {
    const client = clientsMap.get(clientId);
    return client?.companyName || `Client #${clientId}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US");
  };

  const formatPrice = (value: any) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (isNaN(num)) return "-";
    return `R$ ${num.toFixed(2)}/MWh`;
  };

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDaysUntilBadge = (days: number | null) => {
    if (days === null) return null;
    if (days <= 30) return <Badge className="bg-red-100 text-red-800 border-red-300">{days}d</Badge>;
    if (days <= 60) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{days}d</Badge>;
    return <Badge className="bg-green-100 text-green-800 border-green-300">{days}d</Badge>;
  };

  const getAlertLevelBadge = (alertLevel: string) => {
    switch (alertLevel) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-300">{language === "pt" ? "Crítico" : "Critical"}</Badge>;
      case '90_days':
        return <Badge className="bg-red-100 text-red-800 border-red-300">90d</Badge>;
      case '120_days':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">120d</Badge>;
      case '180_days':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">180d</Badge>;
      default:
        return null;
    }
  };

  const getRenewalStatusBadge = (status: string) => {
    switch (status) {
      case 'hold':
        return <Badge className="bg-gray-100 text-gray-700">{language === "pt" ? "Aguardar" : "Hold"}</Badge>;
      case 'review':
        return <Badge className="bg-blue-100 text-blue-800">{language === "pt" ? "Revisar" : "Review"}</Badge>;
      case 'renegotiate':
        return <Badge className="bg-green-100 text-green-800">{language === "pt" ? "Renegociar" : "Renegotiate"}</Badge>;
      default:
        return null;
    }
  };

  const getBenchmarkReviewBadge = (status: string, daysOverdue: number) => {
    if (status === 'Needs Review') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{daysOverdue}d {language === "pt" ? "atrasado" : "overdue"}</Badge>;
    }
    if (status === 'Archived') {
      return <Badge className="bg-gray-100 text-gray-600">{language === "pt" ? "Arquivado" : "Archived"}</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">{language === "pt" ? "Ativo" : "Active"}</Badge>;
  };

  const handleViewClient = (clientId: number) => {
    if (!onViewClient) return;
    
    const client = clientsMap.get(clientId);
    if (!client) {
      toast({
        title: language === "pt" ? "Cliente não encontrado" : "Client not found",
        description: language === "pt" ? "Não foi possível carregar os dados do cliente" : "Could not load client data",
        variant: "destructive"
      });
      return;
    }
    onViewClient(clientId);
  };

  if (dashboardLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-gray-500">
        {language === "pt" ? "Falha ao carregar dashboard" : "Failed to load dashboard"}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ecos-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {language === "pt" ? "Clientes Ativos" : "Active Clients"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-900" data-testid="stat-total-clients">
              {dashboard.totalClients}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {language === "pt" ? "Contratos - Ação Necessária" : "Contracts - Action Required"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600" data-testid="stat-contracts-action">
              {dashboard.contractsRequiringActionCount || 0}
            </div>
            <p className="text-xs text-gray-500">
              {language === "pt" ? "Próximos 180 dias" : "Next 180 days"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {language === "pt" ? "Acima da Faixa" : "Above Band"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600" data-testid="stat-above-band">
              {dashboard.aboveBandCount}
            </div>
            <p className="text-xs text-gray-500">
              {language === "pt" ? "Necessitam ação" : "Need action"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {language === "pt" ? "Em Risco" : "At Risk"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="stat-at-risk">
              {dashboard.atRiskCount}
            </div>
            <p className="text-xs text-gray-500">
              {language === "pt" ? "Revisar insights" : "Review insights"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {language === "pt" ? "Benchmarks - Revisão" : "Benchmarks - Review"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600" data-testid="stat-benchmarks-review">
              {dashboard.benchmarksRequiringReviewCount || 0}
            </div>
            <p className="text-xs text-gray-500">
              {language === "pt" ? "Necessitam revisão" : "Need review"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Bell className="w-5 h-5" />
              {language === "pt" ? "Contratos - Ação Necessária" : "Contracts Requiring Action"}
            </CardTitle>
            <CardDescription>
              {language === "pt" ? "Contratos expirando em 180 dias com níveis de alerta" : "Contracts expiring within 180 days with alert levels"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!dashboard.contractsRequiringAction || dashboard.contractsRequiringAction.length === 0) ? (
              <p className="text-center text-gray-500 py-4">
                {language === "pt" ? "Nenhum contrato requer ação" : "No contracts require action"}
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboard.contractsRequiringAction.map((contract: any) => (
                  <div 
                    key={contract.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      contract.computedAlertLevel === 'critical' ? 'bg-red-50 border-red-200' :
                      contract.computedAlertLevel === '120_days' ? 'bg-orange-50 border-orange-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}
                    data-testid={`contract-action-${contract.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{contract.clientName || getClientName(contract.clientId)}</p>
                      <p className="text-sm text-gray-600">
                        {contract.supplierName} • {language === "pt" ? "Expira:" : "Expires:"} {formatDate(contract.contractEnd)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRenewalStatusBadge(contract.renewalStatus || 'hold')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAlertLevelBadge(contract.computedAlertLevel)}
                      <span className="text-sm text-gray-500">{contract.daysUntilExpiry}d</span>
                      {onViewClient && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewClient(contract.clientId)}
                          data-testid={`view-contract-action-${contract.id}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              {language === "pt" ? "Clientes Acima da Faixa" : "Above Band Clients"}
            </CardTitle>
            <CardDescription>
              {language === "pt" ? "Pagando mais que o mercado" : "Paying above market rate"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.aboveBandDecisions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {language === "pt" ? "Nenhum cliente acima da faixa" : "No clients above band"}
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboard.aboveBandDecisions.map((decision: any) => (
                  <div 
                    key={decision.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200"
                    data-testid={`above-band-${decision.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{getClientName(decision.clientId)}</p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(decision.currentPriceRmwh)}
                      </p>
                      {decision.recommendation && (
                        <p className="text-xs text-red-600 mt-1">{decision.recommendation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">
                        {language === "pt" ? "Acima" : "Above"}
                      </Badge>
                      {onViewClient && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewClient(decision.clientId)}
                          data-testid={`view-above-band-${decision.id}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              {language === "pt" ? "Clientes Em Risco" : "At Risk Clients"}
            </CardTitle>
            <CardDescription>
              {language === "pt" ? "Próximos do limite superior" : "Near the upper limit"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.atRiskDecisions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {language === "pt" ? "Nenhum cliente em risco" : "No at-risk clients"}
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboard.atRiskDecisions.map((decision: any) => (
                  <div 
                    key={decision.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                    data-testid={`at-risk-${decision.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{getClientName(decision.clientId)}</p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(decision.currentPriceRmwh)}
                      </p>
                      {decision.recommendation && (
                        <p className="text-xs text-yellow-600 mt-1">{decision.recommendation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {language === "pt" ? "Risco" : "At Risk"}
                      </Badge>
                      {onViewClient && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewClient(decision.clientId)}
                          data-testid={`view-at-risk-${decision.id}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="w-5 h-5" />
              {language === "pt" ? "Insights Pendentes" : "Pending Insights"}
            </CardTitle>
            <CardDescription>
              {language === "pt" ? "Insights aguardando revisão" : "Insights awaiting review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.pendingReports.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {language === "pt" ? "Nenhum insight pendente" : "No pending insights"}
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboard.pendingReports.map((report: any) => (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"
                    data-testid={`pending-report-${report.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{getClientName(report.clientId)}</p>
                      <p className="text-sm text-gray-600">
                        {report.quarter} {report.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {language === "pt" ? "Pendente" : "Pending"}
                      </Badge>
                      {onViewClient && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewClient(report.clientId)}
                          data-testid={`view-pending-report-${report.id}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BookOpen className="w-5 h-5" />
              {language === "pt" ? "Benchmarks - Revisão Pendente" : "Benchmarks Requiring Review"}
            </CardTitle>
            <CardDescription>
              {language === "pt" ? "Benchmarks que precisam de atualização" : "Benchmarks that need updating"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!dashboard.benchmarksRequiringReview || dashboard.benchmarksRequiringReview.length === 0) ? (
              <p className="text-center text-gray-500 py-4">
                {language === "pt" ? "Todos os benchmarks estão atualizados" : "All benchmarks are up to date"}
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboard.benchmarksRequiringReview.map((benchmark: any) => (
                  <div 
                    key={benchmark.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      benchmark.reviewStatus === 'Archived' ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
                    }`}
                    data-testid={`benchmark-review-${benchmark.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {benchmark.segment} • {benchmark.region}
                      </p>
                      <p className="text-sm text-gray-600">
                        {benchmark.contractLengthMonths}{language === "pt" ? " meses" : " months"} • 
                        R$ {benchmark.lowerBoundRmwh}-{benchmark.upperBoundRmwh}/MWh
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === "pt" ? "Próxima revisão:" : "Next review:"} {formatDate(benchmark.nextReviewDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getBenchmarkReviewBadge(benchmark.reviewStatus, benchmark.daysOverdue)}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.location.href = '/admin?tab=benchmarks'}
                        data-testid={`review-benchmark-${benchmark.id}`}
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
