import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
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
  Cpu,
  FolderOpen,
  Download,
  AlertTriangle,
  WifiOff
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
  const { toast } = useToast();
  const { sessionId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [transitionBlockers, setTransitionBlockers] = useState<any[]>([]);
  const [rfqBlockers, setRfqBlockers] = useState<any[]>([]);
  const [isAdvancingRfq, setIsAdvancingRfq] = useState(false);

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

  const { data: dealData } = useQuery({
    queryKey: [`/api/deals/${dealId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}`);
      return res.json();
    }
  });

  const { data: parserStatus } = useQuery({
    queryKey: ['parser-status'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/parser/status`);
        return res.json();
      } catch {
        return { online: false };
      }
    },
    refetchInterval: 60000,
    retry: false
  });

  const uploadBillMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/deals/${dealId}/bills/upload`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId || '' },
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`${res.status}: ${errBody.slice(0, 500)}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      if (data.success && data.idempotent) {
        toast({ title: isPt ? "Fatura duplicada" : "Duplicate bill", description: isPt ? "Esta fatura já foi carregada (mesmo conteúdo)." : "This bill was already uploaded (same content).", variant: "default" });
      } else if (data.success) {
        const parserOffline = data.parserOffline;
        toast({ 
          title: isPt ? "Fatura carregada" : "Bill uploaded", 
          description: parserOffline 
            ? (isPt ? "Arquivo salvo. Parser offline — análise será tentada automaticamente." : "File saved. Parser offline — parsing will be retried automatically.")
            : (isPt ? "Análise iniciada. Dados aparecerão em breve." : "Parsing started. Data will appear shortly.")
        });
      } else {
        toast({ title: isPt ? "Erro no upload" : "Upload failed", description: data.error || "Unknown error", variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
    },
    onError: (err: any) => {
      toast({ title: isPt ? "Erro no upload" : "Upload failed", description: err.message, variant: "destructive" });
    }
  });

  const generateEcosMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/ecos/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId || '' },
      });
      const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok && data.blockers) {
        return data;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${data.error || JSON.stringify(data).slice(0, 500)}`);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.blockers && data.blockers.length > 0) {
        setTransitionBlockers(data.blockers);
        toast({ title: isPt ? "ECOS bloqueado" : "ECOS blocked", description: data.blockers.map((b: any) => b.message || b.code).join('; '), variant: "destructive" });
      } else if (data.ok || data.success) {
        setTransitionBlockers([]);
        toast({ title: isPt ? "ECOS gerado" : "ECOS generated", description: data.idempotent ? (isPt ? "Snapshot existente retornado (dados iguais)." : "Existing snapshot returned (same data).") : (isPt ? "Novo snapshot criado com sucesso." : "New snapshot created successfully.") });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/ecos/snapshots`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
    },
    onError: (err: any) => {
      toast({ title: isPt ? "Erro ao gerar ECOS" : "ECOS generation failed", description: err.message, variant: "destructive" });
    }
  });

  const handleAdvanceToRfq = async () => {
    setIsAdvancingRfq(true);
    setRfqBlockers([]);
    try {
      const checkRes = await fetch(`/api/deals/${dealId}/check-advance-rfq`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId || '' },
      });
      const checkData = await checkRes.json().catch(() => ({ ok: false, error: `HTTP ${checkRes.status}` }));
      if (!checkRes.ok && !checkData.blockers) {
        throw new Error(`${checkRes.status}: ${checkData.error || 'Request failed'}`);
      }
      
      if (!checkData.ok && checkData.blockers && checkData.blockers.length > 0) {
        setRfqBlockers(checkData.blockers);
        console.error('[AdvanceToRFQ] Blocked:', checkData.blockers);
        toast({ 
          title: isPt ? "Avanço bloqueado" : "Advance blocked", 
          description: checkData.blockers.map((b: any) => b.message || b.code).join('; '), 
          variant: "destructive" 
        });
        return;
      }

      if (checkData.ok) {
        const transRes = await fetch(`/api/deals/${dealId}/transition`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId || '' },
          body: JSON.stringify({
            toState: 'RFQ_SENT',
            triggeredBy: 'user',
            triggeredByType: 'user',
            reason: 'Advanced from Assembly tab'
          })
        });
        if (!transRes.ok) {
          const errBody = await transRes.text();
          throw new Error(`${transRes.status}: ${errBody.slice(0, 500)}`);
        }
        const transData = await transRes.json();
        
        if (transData.success) {
          toast({ title: isPt ? "Avançado para RFQ" : "Advanced to RFQ", description: isPt ? "Negócio avançou para fase de cotação." : "Deal advanced to quotation phase." });
          queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
          queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] });
        } else {
          const errorBlockers = transData.blockers || [{ code: 'TRANSITION_FAILED', message: transData.error || 'Transition failed' }];
          setRfqBlockers(errorBlockers);
          console.error('[AdvanceToRFQ] Transition failed:', transData);
          toast({ title: isPt ? "Falha na transição" : "Transition failed", description: transData.error || 'Unknown error', variant: "destructive" });
        }
      }
    } catch (err: any) {
      console.error('[AdvanceToRFQ] Error:', err);
      toast({ title: isPt ? "Erro" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAdvancingRfq(false);
    }
  };

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
  const clientId = dealData?.deal?.clientId;
  const isParserOffline = parserStatus && !parserStatus.online;
  const hasEcosComplete = !!stages.find(s => s.stage === 'ECOS_GENERATED' && s.status === 'complete');

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

  const renderBlockerCards = (blockers: any[], title: string) => {
    if (blockers.length === 0) return null;
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3" data-testid="alert-rfq-blockers">
        <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {title}
        </p>
        {blockers.map((b: any, i: number) => (
          <div key={i} className="p-3 bg-white border border-red-100 rounded-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px] h-5">{b.code}</Badge>
                  <span className="text-sm font-medium text-red-800">{b.message}</span>
                </div>
                {b.deepLink && (
                  <p className="text-xs text-red-600 mt-1">{b.deepLink}</p>
                )}
              </div>
              {b.cta && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100 flex-shrink-0"
                  onClick={() => {
                    if (b.code === 'NO_PRC') handleNavigate('/admin/prc');
                    else if (b.code === 'NO_BILL') fileInputRef.current?.click();
                    else if (b.code === 'NO_ECOS') generateEcosMutation.mutate();
                    else if (b.code === 'DOSSIER_NOT_READY' && clientId) handleNavigate(`/admin/dossier/${clientId}`);
                    else if (b.deepLink) handleNavigate(b.deepLink);
                  }}
                  data-testid={`cta-${b.code.toLowerCase()}`}
                >
                  {b.cta}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isParserOffline && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPt 
                  ? "Parser offline — faturas serão processadas automaticamente quando o serviço retornar."
                  : "Parser offline — bills will be processed automatically when service returns."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            {isPt ? "Carregar Fatura de Energia (PDF)" : "Upload Energy Bill (PDF)"}
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
              size="lg"
            >
              {uploadBillMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isPt ? "Processando..." : "Processing..."}</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />{isPt ? "Selecionar PDF da Fatura" : "Select Bill PDF"}</>
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

          {uploadResult && uploadResult.success && uploadResult.parserOffline && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700" data-testid="alert-parser-offline">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                {isPt ? "Arquivo salvo com sucesso. Parser offline — análise será tentada automaticamente." : "File saved successfully. Parser offline — parsing will be retried automatically."}
              </div>
            </div>
          )}

          {uploadResult && !uploadResult.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" data-testid="alert-parse-error">
              {uploadResult.error || (isPt ? "Falha ao processar fatura" : "Failed to process bill")}
            </div>
          )}

          {uploadResult?.idempotent && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700" data-testid="alert-duplicate-bill">
              {isPt ? "Esta fatura já foi carregada anteriormente (mesmo conteúdo)." : "This bill was already uploaded (same content)."}
            </div>
          )}

          {bills.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isPt ? "Faturas Carregadas" : "Uploaded Bills"}
              </p>
              {bills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between p-2 bg-slate-50 border rounded-md text-xs" data-testid={`bill-row-${bill.id}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    <span className="truncate">{bill.originalFilename}</span>
                    <Badge variant="outline" className={cn("text-[10px] h-5",
                      bill.parseStatus === 'PARSED' ? "bg-emerald-50 text-emerald-700" :
                      bill.parseStatus === 'FAILED' ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    )}>
                      {bill.parseStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {bill.parseStatus === 'PARSED' && bill.distributor && (
                      <span className="text-[10px] text-muted-foreground">{bill.distributor} • {bill.referenceMonth}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {parsedBills.length > 0 && !hasEcosComplete && (
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
            {transitionBlockers.length > 0 && renderBlockerCards(transitionBlockers, isPt ? "Bloqueadores ECOS:" : "ECOS Blockers:")}
          </CardContent>
        </Card>
      )}

      {hasEcosComplete && (
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">
                  {isPt ? "ECOS gerado com sucesso" : "ECOS generated successfully"}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {clientId && (
                  <Button
                    variant="outline"
                    onClick={() => handleNavigate(`/admin/dossier/${clientId}`)}
                    data-testid="button-view-dossier"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {isPt ? "Ver Dossiê" : "View Dossier"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/deals/${dealId}/ecos/latest/pdf`, {
                        headers: { 'x-session-id': sessionId || '' },
                        credentials: 'include'
                      });
                      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `ecos_insight_pack_${dealId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (err: any) {
                      toast({ title: isPt ? "Erro ao baixar PDF" : "PDF download failed", description: err.message, variant: "destructive" });
                    }
                  }}
                  data-testid="button-download-ecos-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isPt ? "ECOS PDF" : "ECOS PDF"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasEcosComplete && (
        <Card className="border-2 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              {isPt ? "Avançar para RFQ" : "Advance to RFQ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isPt 
                ? "Verifique pré-requisitos e avance o negócio para a fase de cotação com fornecedores."
                : "Check prerequisites and advance the deal to the supplier quotation phase."}
            </p>
            <Button
              onClick={handleAdvanceToRfq}
              disabled={isAdvancingRfq}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="button-advance-rfq"
            >
              {isAdvancingRfq ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isPt ? "Verificando..." : "Checking..."}</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />{isPt ? "Avançar para RFQ" : "Advance to RFQ"}</>
              )}
            </Button>
            {rfqBlockers.length > 0 && renderBlockerCards(rfqBlockers, isPt ? "Pré-requisitos pendentes:" : "Pending prerequisites:")}
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
