import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { useState, useRef } from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Clock,
  Lock,
  Send,
  FileText,
  Receipt,
  ShieldCheck,
  Zap,
  Target,
  FileCheck,
  Upload,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssemblyBlocker {
  code: string;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  deepLink: string;
  severity: 'error' | 'warning';
}

interface AssemblyStageStatus {
  stage: string;
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked';
  blockers: AssemblyBlocker[];
  actionButtonPt: string | null;
  actionButtonEn: string | null;
  actionDeepLink: string | null;
  evidenceLinks: Array<{ label: string; url: string }>;
  completedAt: string | null;
}

interface AssemblyStatus {
  dealId: string;
  currentStage: string;
  stages: AssemblyStageStatus[];
  nextStep: {
    stagePt: string;
    stageEn: string;
    actionPt: string;
    actionEn: string;
    deepLink: string;
  } | null;
  isBlocked: boolean;
  blockerCount: number;
  idleSinceDays: number;
  lastActivityAt: string | null;
  canAdvance: boolean;
}

const STAGE_ICONS: Record<string, React.ElementType> = {
  ORIGIN_QUALIFICATION: Target,
  BILL_UPLOADED: Upload,
  ECOS_GENERATED: Cpu,
  DOSSIER_DRAFT: FileText,
  DOSSIER_LOCKED: Lock,
  RFQ_SENT: Send,
  QUOTES_RECEIVED: Receipt,
  QUOTE_SELECTED: FileCheck,
  PROPOSAL_GENERATED: FileText,
  ONBOARDING: Clock,
  CONTRACT_SENT: Send,
  CONTRACT_SIGNED: ShieldCheck,
  SUPPLY_LIVE: Zap
};

const STAGE_LABELS: Record<string, { pt: string; en: string }> = {
  ORIGIN_QUALIFICATION: { pt: 'Origem & Qualificação', en: 'Origin & Qualification' },
  BILL_UPLOADED: { pt: 'Fatura Carregada', en: 'Bill Uploaded' },
  ECOS_GENERATED: { pt: 'ECOS Gerado', en: 'ECOS Generated' },
  DOSSIER_DRAFT: { pt: 'Dossiê do Cliente', en: 'Client Dossier' },
  DOSSIER_LOCKED: { pt: 'Dossiê Travado', en: 'Dossier Locked' },
  RFQ_SENT: { pt: 'RFQ Enviado', en: 'RFQ Sent' },
  QUOTES_RECEIVED: { pt: 'Cotações Recebidas', en: 'Quotes Received' },
  QUOTE_SELECTED: { pt: 'Cotação Selecionada', en: 'Quote Selected' },
  PROPOSAL_GENERATED: { pt: 'Proposta Gerada', en: 'Proposal Generated' },
  ONBOARDING: { pt: 'Onboarding (Docs)', en: 'Onboarding (Docs)' },
  CONTRACT_SENT: { pt: 'Contrato Enviado', en: 'Contract Sent' },
  CONTRACT_SIGNED: { pt: 'Contrato Assinado', en: 'Contract Signed' },
  SUPPLY_LIVE: { pt: 'Fornecimento Ativo', en: 'Supply Live' }
};

interface DealAssemblyTabProps {
  dealId: string;
  onNavigate?: (path: string) => void;
}

export function DealAssemblyTab({ dealId, onNavigate }: DealAssemblyTabProps) {
  const { language } = useI18n();
  const isPt = language === "pt";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [transitionBlockers, setTransitionBlockers] = useState<any[]>([]);

  const { data: assemblyData, isLoading, error } = useQuery<{ success: boolean } & AssemblyStatus>({
    queryKey: [`/api/deals/${dealId}/assembly-status`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/assembly-status`);
      return res.json();
    },
    refetchInterval: 30000
  });

  const { data: billsData } = useQuery({
    queryKey: [`/api/deals/${dealId}/bills`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/bills`);
      return res.json();
    }
  });

  const uploadBillMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/deals/${dealId}/bills/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      return res.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
    }
  });

  const generateEcosMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/ecos/generate`);
      return res.json();
    },
    onSuccess: (data) => {
      if (!data.success && data.blockers) {
        setTransitionBlockers(data.blockers);
      } else {
        setTransitionBlockers([]);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/ecos/snapshots`] });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadResult(null);
      uploadBillMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !assemblyData?.success) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {isPt ? "Erro ao carregar status de montagem" : "Error loading assembly status"}
        </CardContent>
      </Card>
    );
  }

  const { stages, nextStep, isBlocked, blockerCount, idleSinceDays, currentStage } = assemblyData;
  const bills = billsData?.bills || [];
  const parsedBills = bills.filter((b: any) => b.parseStatus === 'PARSED');

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'in_progress': return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'blocked': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': 
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{isPt ? "Concluído" : "Complete"}</Badge>;
      case 'in_progress': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{isPt ? "Em andamento" : "In Progress"}</Badge>;
      case 'blocked': 
        return <Badge variant="destructive">{isPt ? "Bloqueado" : "Blocked"}</Badge>;
      default: 
        return <Badge variant="outline" className="text-gray-400">{isPt ? "Pendente" : "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {nextStep && (
        <Card className={cn(
          "border-2",
          isBlocked ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {isBlocked ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-600" />
              )}
              {isPt ? "Próximo Passo" : "Next Step"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">
                  {isPt ? nextStep.stagePt : nextStep.stageEn}
                </p>
                <p className="text-muted-foreground">
                  {isPt ? nextStep.actionPt : nextStep.actionEn}
                </p>
              </div>
              <Button
                onClick={() => handleNavigate(nextStep.deepLink)}
                className={isBlocked ? "bg-red-600 hover:bg-red-700" : ""}
                data-testid="button-next-step"
              >
                {isPt ? "Ir para Ação" : "Go to Action"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {isBlocked && blockerCount > 0 && (
              <p className="text-sm text-red-600 mt-2">
                {isPt 
                  ? `${blockerCount} bloqueador(es) ativo(s)`
                  : `${blockerCount} active blocker(s)`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {idleSinceDays >= 3 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPt 
                  ? `Negócio inativo há ${idleSinceDays} dias`
                  : `Deal idle for ${idleSinceDays} days`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {(currentStage === 'BILL_UPLOADED' || currentStage === 'ORIGIN_QUALIFICATION' || currentStage === 'ECOS_GENERATED' || parsedBills.length === 0) && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              {isPt ? "Carregar Fatura de Energia" : "Upload Energy Bill"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-bill-upload"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadBillMutation.isPending}
                data-testid="button-upload-bill"
              >
                {uploadBillMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isPt ? "Processando..." : "Processing..."}</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />{isPt ? "Selecionar PDF" : "Select PDF"}</>
                )}
              </Button>
              {parsedBills.length > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700" data-testid="badge-bill-count">
                  {parsedBills.length} {isPt ? "fatura(s) processada(s)" : "bill(s) parsed"}
                </Badge>
              )}
            </div>

            {uploadBillMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" data-testid="alert-upload-error">
                {isPt ? "Erro ao carregar fatura. Tente novamente." : "Error uploading bill. Try again."}
              </div>
            )}

            {uploadResult && uploadResult.success && uploadResult.extracted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md space-y-1" data-testid="card-extracted-fields">
                <p className="text-sm font-medium text-emerald-800">{isPt ? "Dados Extraídos:" : "Extracted Data:"}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-emerald-700">
                  {uploadResult.extracted.distributor && <div><span className="font-medium">{isPt ? "Distribuidora:" : "Distributor:"}</span> {uploadResult.extracted.distributor}</div>}
                  {uploadResult.extracted.referenceMonth && <div><span className="font-medium">{isPt ? "Mês Ref:" : "Ref Month:"}</span> {uploadResult.extracted.referenceMonth}</div>}
                  {uploadResult.extracted.totalEnergyKwh && <div><span className="font-medium">{isPt ? "Energia (kWh):" : "Energy (kWh):"}</span> {uploadResult.extracted.totalEnergyKwh}</div>}
                  {uploadResult.extracted.totalAmount && <div><span className="font-medium">{isPt ? "Valor Total:" : "Total Amount:"}</span> R$ {uploadResult.extracted.totalAmount}</div>}
                  {uploadResult.extracted.customerId && <div><span className="font-medium">CNPJ:</span> {uploadResult.extracted.customerId}</div>}
                  {uploadResult.extracted.tariffGroup && <div><span className="font-medium">{isPt ? "Grupo Tarifário:" : "Tariff Group:"}</span> {uploadResult.extracted.tariffGroup}</div>}
                </div>
                {uploadResult.extracted.confidence && (
                  <Badge variant="outline" className={cn(
                    "mt-1 text-xs",
                    parseFloat(uploadResult.extracted.confidence) >= 0.8 ? "bg-emerald-100 text-emerald-800" :
                    parseFloat(uploadResult.extracted.confidence) >= 0.5 ? "bg-amber-100 text-amber-800" :
                    "bg-red-100 text-red-800"
                  )}>
                    {isPt ? "Confiança:" : "Confidence:"} {Math.round(parseFloat(uploadResult.extracted.confidence || '0') * 100)}%
                  </Badge>
                )}
              </div>
            )}

            {uploadResult && !uploadResult.success && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" data-testid="alert-parse-error">
                {uploadResult.error || (isPt ? "Falha ao processar fatura" : "Failed to process bill")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {parsedBills.length > 0 && !stages.find(s => s.stage === 'ECOS_GENERATED' && s.status === 'complete') && (
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              {isPt ? "Gerar Perfil ECOS" : "Generate ECOS Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isPt 
                ? `${parsedBills.length} fatura(s) disponível(is) para análise. Gere o perfil ECOS para calcular consumo anual, elegibilidade ACL e economia potencial.`
                : `${parsedBills.length} bill(s) available for analysis. Generate the ECOS profile to compute annual consumption, ACL eligibility, and potential savings.`
              }
            </p>
            <Button
              onClick={() => generateEcosMutation.mutate()}
              disabled={generateEcosMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-ecos"
            >
              {generateEcosMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isPt ? "Gerando..." : "Generating..."}</>
              ) : (
                <><Cpu className="w-4 h-4 mr-2" />{isPt ? "Gerar ECOS" : "Generate ECOS"}</>
              )}
            </Button>
            {transitionBlockers.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-1" data-testid="alert-ecos-blockers">
                {transitionBlockers.map((b: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{b.message || b.code}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {isPt ? "Montagem do Negócio" : "Deal Assembly"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {stages.map((stage, index) => {
              const StageIcon = STAGE_ICONS[stage.stage] || Circle;
              const isCurrentStage = stage.stage === currentStage;
              const labels = STAGE_LABELS[stage.stage] || { pt: stage.stage, en: stage.stage };
              
              return (
                <div key={stage.stage} className="relative">
                  {index < stages.length - 1 && (
                    <div className={cn(
                      "absolute left-[22px] top-[44px] w-0.5 h-[calc(100%-20px)]",
                      stage.status === 'complete' ? "bg-emerald-400" : "bg-gray-200"
                    )} />
                  )}
                  
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg transition-colors",
                    isCurrentStage && "bg-slate-50 border border-slate-200"
                  )}>
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center",
                        stage.status === 'complete' && "bg-emerald-100",
                        stage.status === 'in_progress' && "bg-blue-100",
                        stage.status === 'blocked' && "bg-red-100",
                        stage.status === 'not_started' && "bg-gray-100"
                      )}>
                        <StageIcon className={cn(
                          "w-5 h-5",
                          stage.status === 'complete' && "text-emerald-600",
                          stage.status === 'in_progress' && "text-blue-600",
                          stage.status === 'blocked' && "text-red-600",
                          stage.status === 'not_started' && "text-gray-400"
                        )} />
                      </div>
                      <div className="absolute -top-1 -right-1">
                        {getStatusIcon(stage.status)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className={cn(
                          "font-medium",
                          stage.status === 'not_started' && "text-gray-400"
                        )}>
                          {isPt ? labels.pt : labels.en}
                        </h3>
                        {getStatusBadge(stage.status)}
                      </div>
                      
                      {stage.blockers.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {stage.blockers.map((blocker, bIdx) => (
                            <TooltipProvider key={bIdx}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={cn(
                                      "flex items-center gap-2 text-sm cursor-pointer hover:underline",
                                      blocker.severity === 'error' ? "text-red-600" : "text-amber-600"
                                    )}
                                    onClick={() => handleNavigate(blocker.deepLink)}
                                    data-testid={`blocker-${blocker.code}`}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{isPt ? blocker.titlePt : blocker.titleEn}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p>{isPt ? blocker.descriptionPt : blocker.descriptionEn}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                      
                      {stage.evidenceLinks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {stage.evidenceLinks.map((link, lIdx) => (
                            <Button
                              key={lIdx}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleNavigate(link.url)}
                            >
                              {link.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      {stage.actionButtonPt && stage.status !== 'complete' && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant={stage.status === 'blocked' ? "destructive" : "default"}
                            onClick={() => stage.actionDeepLink && handleNavigate(stage.actionDeepLink)}
                            data-testid={`action-${stage.stage.toLowerCase()}`}
                          >
                            {isPt ? stage.actionButtonPt : stage.actionButtonEn}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                      
                      {stage.completedAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isPt ? "Concluído em" : "Completed"}: {new Date(stage.completedAt).toLocaleDateString(isPt ? 'pt-BR' : 'en-US')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
