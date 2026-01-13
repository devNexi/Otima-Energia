import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  AlertTriangle, 
  User, 
  Building2, 
  Clock,
  TrendingUp,
  Target,
  BarChart3
} from "lucide-react";

interface ErrorEvent {
  id: number;
  errorCode: string;
  severity: string;
  dealId: string;
  stageAt: string;
  userId: number;
  supplierId: number | null;
  errorContext: any;
  resolvedAt: Date | null;
  createdAt: Date;
}

interface ErrorStats {
  byStage: Record<string, number>;
  byErrorCode: Record<string, number>;
  byUser: Record<string, number>;
  bySupplier: Record<string, number>;
  bySeverity: Record<string, number>;
  recentErrors: ErrorEvent[];
}

const STAGE_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  RFQ_SENT: "RFQ Enviado",
  QUOTES_RECEIVED: "Cotações",
  OFFER_SELECTED: "Oferta Selecionada",
  CONTRACT_SIGNED: "Contrato Assinado",
  SUPPLY_LIVE: "Fornecimento Ativo",
  COMMISSION_ACTIVE: "Comissão Ativa",
  CONTRACT_ENDED: "Contrato Encerrado",
  CLOSED: "Fechado"
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500"
};

const ERROR_DESCRIPTIONS: Record<string, string> = {
  "MISSING_DOC": "Documento obrigatório não anexado",
  "INVALID_DATA": "Dados inválidos ou incompletos",
  "SLA_BREACH": "SLA de fornecedor ultrapassado",
  "QUOTE_MISMATCH": "Termos da cotação não conferem",
  "COMPLIANCE_FAIL": "Falha na verificação de compliance",
  "REGISTRATION_ERROR": "Erro no registro de mercado",
  "COMMISSION_DISCREPANCY": "Discrepância na comissão",
  "CONTRACT_TERMS": "Termos contratuais inconsistentes"
};

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? Math.min(value / max, 1) : 0;
  const bgOpacity = Math.round(intensity * 100);
  
  return (
    <div 
      className={`w-full h-12 flex items-center justify-center rounded transition-colors
        ${intensity > 0.7 ? "bg-red-500 text-white" : 
          intensity > 0.4 ? "bg-orange-400 text-white" : 
          intensity > 0.1 ? "bg-yellow-300 text-black" : 
          "bg-gray-100 text-gray-400"}`}
      title={`${value} errors`}
    >
      {value > 0 ? value : "-"}
    </div>
  );
}

export function ErrorHeatmapDashboard() {
  const [timeRange, setTimeRange] = useState("7d");
  const [viewMode, setViewMode] = useState("stage");

  const { data: errorStats, isLoading } = useQuery({
    queryKey: ["/api/ops/error-stats", timeRange],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ops/error-stats?range=${timeRange}`);
      return res.json();
    }
  });

  const stats: ErrorStats = errorStats || {
    byStage: {},
    byErrorCode: {},
    byUser: {},
    bySupplier: {},
    bySeverity: {},
    recentErrors: []
  };

  const maxByStage = Math.max(...Object.values(stats.byStage as Record<string, number>), 1);
  const maxByCode = Math.max(...Object.values(stats.byErrorCode as Record<string, number>), 1);
  const totalErrors = Object.values(stats.byStage as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6" data-testid="error-heatmap-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Common Mistakes Heatmap
          </h2>
          <p className="text-muted-foreground">
            Visualize error patterns to prevent recurring issues
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32" data-testid="select-time-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalErrors}</p>
                <p className="text-sm text-muted-foreground">Total Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bySeverity?.critical || 0}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(stats.byErrorCode || {}).length}
                </p>
                <p className="text-sm text-muted-foreground">Error Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.recentErrors?.filter(e => e.resolvedAt).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="stage" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            By Stage
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            By Error Type
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            By User
          </TabsTrigger>
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            By Supplier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Errors by Deal Stage</CardTitle>
              <CardDescription>
                See which stages have the most errors to focus training and process improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                  <div key={stage} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1 truncate" title={label}>
                      {label}
                    </p>
                    <HeatmapCell 
                      value={(stats.byStage as Record<string, number>)[stage] || 0} 
                      max={maxByStage}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Errors by Type</CardTitle>
              <CardDescription>
                Identify the most common error types for targeted playbook creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byErrorCode || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([code, count]) => (
                    <div key={code} className="flex items-center gap-4">
                      <div className="w-48 truncate">
                        <p className="font-medium text-sm">{code}</p>
                        <p className="text-xs text-muted-foreground">
                          {ERROR_DESCRIPTIONS[code] || "Error description"}
                        </p>
                      </div>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${((count as number) / maxByCode) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm w-12 text-right">{count as number}</span>
                    </div>
                  ))}
                {Object.keys(stats.byErrorCode || {}).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No errors recorded in this period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Errors by User</CardTitle>
              <CardDescription>
                Identify users who may need additional training or support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byUser || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([userId, count]) => (
                    <div key={userId} className="flex items-center gap-4">
                      <div className="w-32 flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">User #{userId}</span>
                      </div>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${((count as number) / (Math.max(...Object.values(stats.byUser as Record<string, number>)) || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm w-12 text-right">{count as number}</span>
                    </div>
                  ))}
                {Object.keys(stats.byUser || {}).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No user-specific errors recorded
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Errors by Supplier</CardTitle>
              <CardDescription>
                Identify supplier-related issues for playbook refinement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.bySupplier || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([supplierId, count]) => (
                    <div key={supplierId} className="flex items-center gap-4">
                      <div className="w-32 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Supplier #{supplierId}</span>
                      </div>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${((count as number) / (Math.max(...Object.values(stats.bySupplier as Record<string, number>)) || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm w-12 text-right">{count as number}</span>
                    </div>
                  ))}
                {Object.keys(stats.bySupplier || {}).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No supplier-specific errors recorded
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Errors</CardTitle>
          <CardDescription>
            Latest error events with context and resolution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats.recentErrors || []).slice(0, 5).map((error: ErrorEvent) => (
              <div 
                key={error.id} 
                className="flex items-center gap-4 p-3 border rounded-lg"
                data-testid={`error-event-${error.id}`}
              >
                <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[error.severity] || "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{error.errorCode}</span>
                    <Badge variant="outline" className="text-xs">
                      {STAGE_LABELS[error.stageAt] || error.stageAt}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Deal: {error.dealId?.substring(0, 8)}...
                  </p>
                </div>
                <div className="text-right">
                  {error.resolvedAt ? (
                    <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                  ) : (
                    <Badge variant="destructive">Open</Badge>
                  )}
                </div>
              </div>
            ))}
            {(stats.recentErrors || []).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No recent errors - great job!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
