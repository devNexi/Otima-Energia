import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Clock,
  Trophy,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  User,
  Star,
  FileText,
  BarChart3,
  History,
  Loader2,
  ExternalLink,
  Zap,
  AlertCircle,
  CheckCircle2,
  Languages
} from "lucide-react";

type KpiData = {
  avgResponseHours: number | null;
  winRate: number;
  wins: number;
  totalRfqs: number;
  totalQuotes: number;
  responseTimeBuckets: { bucket: string; count: number }[];
  winRateTrend: { month: string; winRate: number; wins: number; rfqs: number }[];
};

type InteractionEntry = {
  type: 'RFQ_ENVIADA' | 'COTAÇÃO_RECEBIDA';
  dateTime: string;
  details: string;
  dealId: string | null;
  responseTimeHours: number | null;
  meta: Record<string, any>;
};

type SupplierContact = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  isActive: boolean;
  preferredFormat: string | null;
  typicalResponseHours: number | null;
};

type Supplier = {
  id: number;
  name: string;
  shortCode: string;
  category: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  isActive: boolean;
  contacts?: SupplierContact[];
};

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez"
};

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_LABELS[m] || m}/${y.slice(2)}`;
}

export default function SupplierDetail() {
  const [, params] = useRoute("/admin/suppliers/:id");
  const supplierId = parseInt(params?.id || "0");
  const [language, setLanguage] = useState<"pt" | "en">("pt");

  const { data: supplierData, isLoading: loadingSupplier } = useQuery({
    queryKey: [`/api/suppliers-with-contacts`],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/suppliers-with-contacts");
      return res.json();
    }
  });

  const { data: kpiData, isLoading: loadingKpis } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}/intelligence/kpis`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/suppliers/${supplierId}/intelligence/kpis`);
      return res.json();
    },
    enabled: supplierId > 0
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}/intelligence/history`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/suppliers/${supplierId}/intelligence/history`);
      return res.json();
    },
    enabled: supplierId > 0
  });

  const supplier: Supplier | undefined = supplierData?.suppliers?.find((s: Supplier) => s.id === supplierId);
  const kpis: KpiData | undefined = kpiData?.kpis;
  const history: InteractionEntry[] = historyData?.history || [];

  if (loadingSupplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">Fornecedor não encontrado</p>
        <Link href="/admin/suppliers">
          <Button variant="outline" data-testid="button-back-suppliers">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const maxBucketCount = Math.max(...(kpis?.responseTimeBuckets || []).map(b => b.count), 1);
  const maxTrendRfqs = Math.max(...(kpis?.winRateTrend || []).map(t => t.rfqs), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/suppliers">
              <Button variant="ghost" size="sm" data-testid="button-back-suppliers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "pt" ? "Fornecedores" : "Suppliers"}
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-supplier-detail-name">
                  {supplier.name}
                </h1>
                <Badge variant={supplier.isActive ? "default" : "secondary"} className="text-xs">
                  {supplier.isActive ? (language === "pt" ? "Ativo" : "Active") : (language === "pt" ? "Inativo" : "Inactive")}
                </Badge>
                {supplier.category && (
                  <Badge variant="outline" className="text-xs">{supplier.category}</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{supplier.shortCode}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
            data-testid="button-language-toggle"
          >
            <Languages className="h-4 w-4 mr-2" />
            {language === "pt" ? "English" : "Português"}
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-supplier-detail">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              {language === "pt" ? "Visão Geral" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              {language === "pt" ? "Histórico de Interações" : "Interaction History"}
            </TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              {language === "pt" ? "Desempenho" : "Performance"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              supplier={supplier}
              kpis={kpis}
              loadingKpis={loadingKpis}
              language={language}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              history={history}
              loading={loadingHistory}
              language={language}
            />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceTab
              kpis={kpis}
              loading={loadingKpis}
              language={language}
              maxBucketCount={maxBucketCount}
              maxTrendRfqs={maxTrendRfqs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({ supplier, kpis, loadingKpis, language }: {
  supplier: Supplier;
  kpis?: KpiData;
  loadingKpis: boolean;
  language: "pt" | "en";
}) {
  return (
    <div className="space-y-6">
      {loadingKpis ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="kpi-avg-response">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {language === "pt" ? "Tempo Médio de Resposta" : "Avg Response Time"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-avg-response">
                    {kpis.avgResponseHours != null ? `${kpis.avgResponseHours} horas` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="kpi-win-rate">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {language === "pt" ? "Taxa de Sucesso" : "Win Rate"}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="text-2xl font-bold text-gray-900" data-testid="text-win-rate">
                          {kpis.winRate}%
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{kpis.wins}/{kpis.totalRfqs} RFQs {language === "pt" ? "vencidas" : "won"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="kpi-total-rfqs">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {language === "pt" ? "RFQs Enviadas" : "RFQs Sent"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-rfqs">
                    {kpis.totalRfqs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="kpi-total-quotes">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {language === "pt" ? "Cotações Recebidas" : "Quotes Received"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-quotes">
                    {kpis.totalQuotes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {language === "pt" ? "Contatos" : "Contacts"}
          </CardTitle>
          <CardDescription>
            {language === "pt" ? "Equipe de relacionamento" : "Relationship team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.contacts && supplier.contacts.length > 0 ? (
            <div className="space-y-3">
              {supplier.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-lg border ${contact.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                  data-testid={`contact-row-${contact.id}`}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm">{contact.name}</span>
                    {contact.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    {contact.role && <span className="text-xs text-gray-500">• {contact.role}</span>}
                    {contact.preferredFormat && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {contact.preferredFormat === 'email' ? 'Email' :
                          contact.preferredFormat === 'whatsapp' ? 'WhatsApp' :
                          contact.preferredFormat === 'portal' ? 'Portal' :
                          contact.preferredFormat === 'phone' ? (language === "pt" ? 'Telefone' : 'Phone') :
                          contact.preferredFormat}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {contact.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>
                    )}
                    {contact.typicalResponseHours && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {contact.typicalResponseHours}h</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              {language === "pt" ? "Nenhum contato cadastrado" : "No contacts registered"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTab({ history, loading, language }: {
  history: InteractionEntry[];
  loading: boolean;
  language: "pt" | "en";
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {language === "pt" ? "Histórico de Interações" : "Interaction History"}
        </CardTitle>
        <CardDescription>
          {language === "pt"
            ? "Cronologia unificada de RFQs enviadas e cotações recebidas"
            : "Unified chronology of sent RFQs and received quotes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {language === "pt" ? "Nenhuma interação registrada" : "No interactions recorded"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-interaction-history">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">{language === "pt" ? "Data/Hora" : "Date/Time"}</th>
                  <th className="pb-2 pr-4 font-medium">{language === "pt" ? "Tipo" : "Type"}</th>
                  <th className="pb-2 pr-4 font-medium">{language === "pt" ? "Detalhes" : "Details"}</th>
                  <th className="pb-2 font-medium">{language === "pt" ? "Ações" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-gray-50" data-testid={`row-interaction-${idx}`}>
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                      {new Date(entry.dateTime).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={entry.type === 'RFQ_ENVIADA' ? 'outline' : 'default'}
                        className={`text-xs ${
                          entry.type === 'RFQ_ENVIADA'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : entry.meta?.isSelected
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                        data-testid={`badge-type-${idx}`}
                      >
                        {entry.type === 'RFQ_ENVIADA' ? 'RFQ Enviada' : 'Cotação Recebida'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <span>{entry.details}</span>
                      {entry.responseTimeHours != null && (
                        <span className="ml-2 text-xs text-gray-500">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {entry.responseTimeHours}h
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {entry.dealId && (
                        <Link href={`/admin/deals`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid={`link-deal-${idx}`}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Deal #{entry.dealId.slice(0, 8)}
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceTab({ kpis, loading, language, maxBucketCount, maxTrendRfqs }: {
  kpis?: KpiData;
  loading: boolean;
  language: "pt" | "en";
  maxBucketCount: number;
  maxTrendRfqs: number;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!kpis) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        {language === "pt" ? "Dados insuficientes para análise" : "Insufficient data for analysis"}
      </p>
    );
  }

  const bucketColors: Record<string, string> = {
    '<24h': 'bg-green-500',
    '24-48h': 'bg-blue-500',
    '48-72h': 'bg-amber-500',
    '>72h': 'bg-red-500'
  };

  const bucketOrder = ['<24h', '24-48h', '48-72h', '>72h'];
  const orderedBuckets = bucketOrder.map(b => 
    kpis.responseTimeBuckets.find(r => r.bucket === b) || { bucket: b, count: 0 }
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card data-testid="chart-response-distribution">
        <CardHeader>
          <CardTitle className="text-base">
            {language === "pt" ? "Distribuição de Tempo de Resposta" : "Response Time Distribution"}
          </CardTitle>
          <CardDescription>
            {language === "pt" ? "Quantidade de cotações por faixa de tempo" : "Quote count by time bucket"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orderedBuckets.every(b => b.count === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {language === "pt" ? "Sem dados de tempo de resposta" : "No response time data"}
            </p>
          ) : (
            <div className="space-y-3">
              {orderedBuckets.map((b) => (
                <div key={b.bucket} className="flex items-center gap-3" data-testid={`bar-bucket-${b.bucket}`}>
                  <span className="text-sm font-medium w-16 text-right text-gray-600">{b.bucket}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bucketColors[b.bucket] || 'bg-gray-400'} flex items-center justify-end pr-2 transition-all duration-500`}
                      style={{ width: `${Math.max((b.count / maxBucketCount) * 100, b.count > 0 ? 10 : 0)}%` }}
                    >
                      {b.count > 0 && (
                        <span className="text-xs font-bold text-white">{b.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="chart-win-rate-trend">
        <CardHeader>
          <CardTitle className="text-base">
            {language === "pt" ? "Tendência da Taxa de Sucesso" : "Win Rate Trend"}
          </CardTitle>
          <CardDescription>
            {language === "pt" ? "Taxa de sucesso mensal (últimos 6 meses)" : "Monthly win rate (last 6 months)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kpis.winRateTrend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {language === "pt" ? "Sem dados de tendência" : "No trend data"}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2 h-40">
                {kpis.winRateTrend.map((t) => {
                  const barHeight = maxTrendRfqs > 0 ? (t.rfqs / maxTrendRfqs) * 100 : 0;
                  const winHeight = maxTrendRfqs > 0 ? (t.wins / maxTrendRfqs) * 100 : 0;
                  return (
                    <TooltipProvider key={t.month}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1 flex flex-col items-center gap-1" data-testid={`bar-trend-${t.month}`}>
                            <span className="text-xs font-bold text-gray-700">{t.winRate}%</span>
                            <div className="w-full relative" style={{ height: `${barHeight}%`, minHeight: t.rfqs > 0 ? '8px' : '2px' }}>
                              <div className="absolute inset-0 bg-gray-200 rounded-t" />
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t"
                                style={{ height: `${barHeight > 0 ? (winHeight / barHeight) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500">{formatMonth(t.month)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.wins} {language === "pt" ? "ganhas" : "wins"} / {t.rfqs} RFQs = {t.winRate}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded" /> RFQs</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> {language === "pt" ? "Ganhas" : "Wins"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
