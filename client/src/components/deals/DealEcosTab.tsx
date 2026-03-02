import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { 
  Loader2, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  Eye,
  X,
  Trash2
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DealEcosTabProps {
  dealId: string;
}

type EcosStatus = "BELOW_BAND" | "WITHIN_BAND" | "ABOVE_BAND" | "NO_DATA";
type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

interface ConfidenceReason {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  descriptionEn: string;
  descriptionPt: string;
}

interface EcosSnapshot {
  id: number;
  dealId: string;
  version: number;
  createdAt: string;
  triggerType: string;
  status: EcosStatus;
  confidenceLevel: ConfidenceLevel;
  confidenceReasons: ConfidenceReason[];
  inputData: any;
  benchmarkMatch: any;
  results: any;
  recommendedNextStep: string;
  talkTrack: string;
  talkTrackPt: string;
}

interface EcosEvaluation {
  status: EcosStatus;
  confidenceLevel: ConfidenceLevel;
  confidenceReasons: ConfidenceReason[];
  clientPriceRmwh: number | null;
  benchmarkLowerRmwh: number | null;
  benchmarkUpperRmwh: number | null;
  priceGapPercent: number | null;
  potentialSavingsAnnual: number | null;
  talkTrackEn: string;
  talkTrackPt: string;
  recommendedNextStep: string;
  frozenInputs: any;
  benchmarkMatch: any;
}

const statusColors: Record<EcosStatus, string> = {
  BELOW_BAND: "bg-green-100 text-green-800 border-green-300",
  WITHIN_BAND: "bg-blue-100 text-blue-800 border-blue-300",
  ABOVE_BAND: "bg-red-100 text-red-800 border-red-300",
  NO_DATA: "bg-gray-100 text-gray-800 border-gray-300"
};

const statusLabels: Record<EcosStatus, { en: string; pt: string }> = {
  BELOW_BAND: { en: "Below Market", pt: "Abaixo do Mercado" },
  WITHIN_BAND: { en: "Within Market", pt: "Dentro do Mercado" },
  ABOVE_BAND: { en: "Above Market", pt: "Acima do Mercado" },
  NO_DATA: { en: "Insufficient Data", pt: "Dados Insuficientes" }
};

const confidenceColors: Record<ConfidenceLevel, string> = {
  LOW: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-emerald-100 text-emerald-800"
};

export function DealEcosTab({ dealId }: DealEcosTabProps) {
  const { language } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading2, setPreviewLoading2] = useState(false);

  const { data: snapshots, isLoading: snapshotsLoading } = useQuery<EcosSnapshot[]>({
    queryKey: ["/api/deals", dealId, "ecos-snapshots"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/ecos-snapshots`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.snapshots;
    }
  });

  const { data: previewEval, isLoading: previewLoading, refetch: refetchPreview } = useQuery<EcosEvaluation>({
    queryKey: ["/api/deals", dealId, "ecos-evaluation"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/ecos-evaluation`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.evaluation;
    },
    staleTime: 30000
  });

  const createSnapshotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/ecos-snapshots`, { triggerType: "MANUAL" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "ecos-snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "ecos-evaluation"] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      toast({
        title: language === "pt" ? "Snapshot criado" : "Snapshot created",
        description: language === "pt" 
          ? "A análise ECOS foi salva com sucesso." 
          : "ECOS analysis has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: number) => {
      const res = await apiRequest("DELETE", `/api/deals/${dealId}/ecos-snapshots/${snapshotId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "ecos-snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "ecos-evaluation"] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      toast({
        title: language === "pt" ? "Snapshot excluído" : "Snapshot deleted",
        description: language === "pt"
          ? "A análise ECOS foi removida."
          : "ECOS analysis has been removed."
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async (snapshotId: number) => {
    setDownloadingPdf(true);
    try {
      const res = await apiRequest("GET", `/api/deals/${dealId}/ecos/${snapshotId}/preview`);
      const html = await res.text();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked');
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };

      toast({
        title: language === "pt" ? "PDF pronto" : "PDF ready",
        description: language === "pt" 
          ? "Use Ctrl+P / Cmd+P para salvar como PDF." 
          : "Use Ctrl+P / Cmd+P to save as PDF."
      });
    } catch (error: any) {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" 
          ? "Falha ao gerar o PDF. Tente novamente." 
          : "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePreview = async (snapshotId: number) => {
    setPreviewLoading2(true);
    setPreviewOpen(true);
    try {
      const res = await apiRequest("GET", `/api/deals/${dealId}/ecos/${snapshotId}/preview`);
      const html = await res.text();
      setPreviewHtml(html);
    } catch (error: any) {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt"
          ? "Falha ao carregar preview."
          : "Failed to load preview.",
        variant: "destructive"
      });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading2(false);
    }
  };

  const latestSnapshot = snapshots?.[0];
  const displayData = previewEval || (latestSnapshot && {
    status: latestSnapshot.status,
    confidenceLevel: latestSnapshot.confidenceLevel,
    confidenceReasons: latestSnapshot.confidenceReasons,
    clientPriceRmwh: latestSnapshot.results?.clientEstimatedPriceRmwh,
    benchmarkLowerRmwh: latestSnapshot.benchmarkMatch?.lowerBoundRmwh,
    benchmarkUpperRmwh: latestSnapshot.benchmarkMatch?.upperBoundRmwh,
    priceGapPercent: latestSnapshot.results?.gapPercent,
    potentialSavingsAnnual: latestSnapshot.results?.potentialSavingsMax,
    talkTrackEn: latestSnapshot.talkTrack,
    talkTrackPt: latestSnapshot.talkTrackPt,
    recommendedNextStep: latestSnapshot.recommendedNextStep
  });

  if (snapshotsLoading || previewLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg">
              {language === "pt" ? "Preview do ECOS Snapshot" : "ECOS Snapshot Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 pt-0" style={{ height: 'calc(90vh - 60px)' }}>
            {previewLoading2 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border rounded-lg"
                style={{ minHeight: '800px' }}
                title="ECOS Preview"
                data-testid="iframe-ecos-preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {language === "pt" ? "Análise de Mercado ECOS" : "ECOS Market Analysis"}
            </CardTitle>
            <CardDescription>
              {language === "pt" 
                ? "Compare o preço atual com benchmarks de mercado" 
                : "Compare current pricing against market benchmarks"}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchPreview()}
              disabled={previewLoading}
              data-testid="button-refresh-ecos"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${previewLoading ? "animate-spin" : ""}`} />
              {language === "pt" ? "Atualizar" : "Refresh"}
            </Button>
            <Button 
              size="sm"
              onClick={() => createSnapshotMutation.mutate()}
              disabled={createSnapshotMutation.isPending}
              data-testid="button-capture-snapshot"
            >
              {createSnapshotMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {language === "pt" ? "Salvar Snapshot" : "Capture Snapshot"}
            </Button>
            {latestSnapshot && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(latestSnapshot.id)}
                        disabled={previewLoading2}
                        data-testid="button-preview-snapshot"
                      >
                        {previewLoading2 ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Preview
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{language === "pt" ? "Visualizar Snapshot para cliente" : "Preview client-facing Snapshot"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(latestSnapshot.id)}
                        disabled={downloadingPdf}
                        data-testid="button-download-pdf"
                      >
                        {downloadingPdf ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        PDF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{language === "pt" ? "Baixar Insight Snapshot em PDF" : "Download Insight Snapshot as PDF"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => {
                          if (window.confirm(language === "pt" ? "Tem certeza que deseja excluir este snapshot?" : "Are you sure you want to delete this snapshot?")) {
                            deleteSnapshotMutation.mutate(latestSnapshot.id);
                          }
                        }}
                        disabled={deleteSnapshotMutation.isPending}
                        data-testid="button-delete-latest-snapshot"
                      >
                        {deleteSnapshotMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {language === "pt" ? "Excluir" : "Delete"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{language === "pt" ? "Excluir este snapshot ECOS" : "Delete this ECOS snapshot"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayData ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={`text-sm px-3 py-1 ${statusColors[displayData.status]}`}>
                  {displayData.status === "ABOVE_BAND" && <TrendingUp className="w-4 h-4 mr-1" />}
                  {displayData.status === "BELOW_BAND" && <TrendingDown className="w-4 h-4 mr-1" />}
                  {displayData.status === "WITHIN_BAND" && <Minus className="w-4 h-4 mr-1" />}
                  {statusLabels[displayData.status][language === "pt" ? "pt" : "en"]}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className={`text-xs ${confidenceColors[displayData.confidenceLevel]}`}>
                        {displayData.confidenceLevel} {language === "pt" ? "Confiança" : "Confidence"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm font-medium mb-2">
                        {language === "pt" ? "Fatores de confiança:" : "Confidence factors:"}
                      </p>
                      <ul className="text-xs space-y-1">
                        {displayData.confidenceReasons?.map((reason: ConfidenceReason, idx: number) => (
                          <li key={idx} className="flex items-center gap-1">
                            {reason.impact === "positive" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                            {reason.impact === "negative" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                            {reason.impact === "neutral" && <Info className="w-3 h-3 text-gray-500" />}
                            {language === "pt" ? reason.descriptionPt : reason.descriptionEn}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500 mb-1">
                      {language === "pt" ? "Preço Estimado" : "Estimated Price"}
                    </p>
                    <p className="text-2xl font-bold">
                      {displayData.clientPriceRmwh 
                        ? `R$ ${displayData.clientPriceRmwh.toFixed(2)}/MWh`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500 mb-1">
                      {language === "pt" ? "Faixa de Mercado" : "Market Band"}
                    </p>
                    <p className="text-2xl font-bold">
                      {displayData.benchmarkLowerRmwh && displayData.benchmarkUpperRmwh
                        ? `R$ ${displayData.benchmarkLowerRmwh.toFixed(0)} - ${displayData.benchmarkUpperRmwh.toFixed(0)}`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500 mb-1">
                      {language === "pt" ? "Economia Potencial" : "Potential Savings"}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {displayData.potentialSavingsAnnual && displayData.potentialSavingsAnnual > 0
                        ? `R$ ${displayData.potentialSavingsAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/ano`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {latestSnapshot?.benchmarkMatch && (
                <Card className={latestSnapshot.benchmarkMatch.yearWarning ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">
                          {language === "pt" ? "Preços PRC:" : "PRC Prices:"}
                        </span>
                        <Badge variant="outline" className="text-xs" data-testid="badge-prc-year">
                          {latestSnapshot.benchmarkMatch.prcReferenceMonth || '—'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          ({latestSnapshot.benchmarkMatch.rowCount} {language === "pt" ? "linhas" : "rows"}, {latestSnapshot.benchmarkMatch.submarket})
                        </span>
                      </div>
                      {latestSnapshot.benchmarkMatch.termBreakdown?.length > 0 && (
                        <div className="text-xs text-slate-500">
                          {[...new Set(latestSnapshot.benchmarkMatch.termBreakdown.map((t: any) => t.product))].join(', ')}
                        </div>
                      )}
                    </div>
                    {latestSnapshot.benchmarkMatch.yearWarning && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span data-testid="text-prc-year-warning">{latestSnapshot.benchmarkMatch.yearWarning}</span>
                      </div>
                    )}
                    {latestSnapshot.benchmarkMatch.termBreakdown?.length > 0 && (
                      <div className="mt-3 overflow-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-500">
                              <th className="py-1 pr-3 font-medium">{language === "pt" ? "Produto" : "Product"}</th>
                              <th className="py-1 pr-3 font-medium">{language === "pt" ? "Ano" : "Year"}</th>
                              <th className="py-1 pr-3 font-medium">{language === "pt" ? "Preço" : "Price"}</th>
                              <th className="py-1 font-medium">{language === "pt" ? "Ref." : "Ref."}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {latestSnapshot.benchmarkMatch.termBreakdown.map((row: any, idx: number) => (
                              <tr key={idx} className="border-t border-slate-200">
                                <td className="py-1 pr-3 font-mono">{row.product}</td>
                                <td className="py-1 pr-3 font-mono">{row.priceYear || '—'}</td>
                                <td className="py-1 pr-3 font-mono">R$ {row.price?.toFixed(2)}</td>
                                <td className="py-1 text-slate-400">{row.referenceMonth || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 mb-2">
                        {language === "pt" ? "Talk Track para o Cliente" : "Client Talk Track"}
                      </p>
                      <p className="text-sm text-amber-900">
                        {language === "pt" ? displayData.talkTrackPt : displayData.talkTrackEn}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {language === "pt" ? "Próximo passo recomendado:" : "Recommended next step:"}
                <Badge variant="outline">
                  {displayData.recommendedNextStep === "REQUEST_RFQ" && (language === "pt" ? "Solicitar RFQ" : "Request RFQ")}
                  {displayData.recommendedNextStep === "WAIT" && (language === "pt" ? "Aguardar" : "Wait")}
                  {displayData.recommendedNextStep === "NEED_MORE_DATA" && (language === "pt" ? "Coletar mais dados" : "Need more data")}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {language === "pt" 
                  ? "Nenhuma análise disponível. Clique em 'Salvar Snapshot' para criar uma."
                  : "No analysis available. Click 'Capture Snapshot' to create one."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {snapshots && snapshots.length > 0 && (
        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" data-testid="toggle-snapshot-history">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === "pt" 
                  ? `Histórico de Snapshots (${snapshots.length})` 
                  : `Snapshot History (${snapshots.length})`}
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {snapshots.map((snapshot) => (
              <Card key={snapshot.id} className="bg-gray-50" data-testid={`ecos-snapshot-${snapshot.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" data-testid={`snapshot-version-${snapshot.id}`}>v{snapshot.version}</Badge>
                      <Badge className={`text-xs ${statusColors[snapshot.status]}`} data-testid={`snapshot-status-${snapshot.id}`}>
                        {statusLabels[snapshot.status][language === "pt" ? "pt" : "en"]}
                      </Badge>
                      <Badge className={`text-xs ${confidenceColors[snapshot.confidenceLevel]}`} data-testid={`snapshot-confidence-${snapshot.id}`}>
                        {snapshot.confidenceLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(snapshot.id)}
                        data-testid={`button-preview-${snapshot.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPdf(snapshot.id)}
                        data-testid={`button-pdf-${snapshot.id}`}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm(language === "pt" ? "Tem certeza que deseja excluir este snapshot?" : "Are you sure you want to delete this snapshot?")) {
                            deleteSnapshotMutation.mutate(snapshot.id);
                          }
                        }}
                        disabled={deleteSnapshotMutation.isPending}
                        data-testid={`button-delete-snapshot-${snapshot.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {language === "pt" ? "Excluir" : "Delete"}
                      </Button>
                      <span className="text-sm text-gray-500" data-testid={`snapshot-date-${snapshot.id}`}>
                        {new Date(snapshot.createdAt).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
