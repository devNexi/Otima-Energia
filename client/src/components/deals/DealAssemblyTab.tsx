import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
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
  WifiOff,
  RefreshCw,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Bug,
  Eye,
  EyeOff,
  Check,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ParseStage {
  label: { pt: string; en: string };
  startPct: number;
  endPct: number;
}

const PARSE_STAGES: ParseStage[] = [
  { label: { pt: 'Na fila...', en: 'Queued...' }, startPct: 0, endPct: 8 },
  { label: { pt: 'Enviando ao parser...', en: 'Sending to parser...' }, startPct: 8, endPct: 15 },
  { label: { pt: 'OCR em andamento...', en: 'Running OCR...' }, startPct: 15, endPct: 55 },
  { label: { pt: 'Extraindo campos...', en: 'Extracting fields...' }, startPct: 55, endPct: 80 },
  { label: { pt: 'Validando dados...', en: 'Validating data...' }, startPct: 80, endPct: 95 },
];

const EXPECTED_PARSE_SECONDS = 180;

function getParseProgress(elapsedMs: number): { pct: number; stage: ParseStage } {
  const elapsed = elapsedMs / 1000;
  const ratio = Math.min(elapsed / EXPECTED_PARSE_SECONDS, 1);
  const pct = Math.min(Math.round(ratio * 95), 95);
  let stage = PARSE_STAGES[0];
  for (const s of PARSE_STAGES) {
    if (pct >= s.startPct) stage = s;
  }
  return { pct, stage };
}

function BillParseProgress({ updatedAt, isPt }: { updatedAt: number; isPt: boolean }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = updatedAt > 0 ? now - updatedAt : 0;
  const { pct, stage } = getParseProgress(elapsed);
  const elapsedSec = Math.round(elapsed / 1000);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  const timeStr = minutes > 0 ? `${minutes}m${seconds.toString().padStart(2, '0')}s` : `${seconds}s`;

  return (
    <div className="mt-1.5 space-y-1" data-testid="bill-parse-progress">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-blue-700 font-medium">{isPt ? stage.label.pt : stage.label.en}</span>
        <span className="text-muted-foreground tabular-nums">{pct}% · {timeStr}</span>
      </div>
      <Progress value={pct} className="h-1.5 bg-blue-100" indicatorClassName="bg-blue-500" />
    </div>
  );
}

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
  const { sessionId, user } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [transitionBlockers, setTransitionBlockers] = useState<any[]>([]);
  const [rfqBlockers, setRfqBlockers] = useState<any[]>([]);
  const [isAdvancingRfq, setIsAdvancingRfq] = useState(false);
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [debugBillId, setDebugBillId] = useState<number | null>(null);
  const [savingOverride, setSavingOverride] = useState(false);
  const [showPrcDebug, setShowPrcDebug] = useState(false);

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
    },
    refetchInterval: (query) => {
      const bills = query.state.data?.bills || [];
      const hasPending = bills.some((b: any) => b.parseStatus === 'PENDING' || b.parseStatus === 'PARSING' || b.parseStatus === 'UPLOADED');
      return hasPending ? 5000 : 30000;
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

  const { data: prcReadiness } = useQuery({
    queryKey: [`/api/deals/${dealId}/prc-readiness`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/deals/${dealId}/prc-readiness`);
        return res.json();
      } catch {
        return { ok: false };
      }
    },
    refetchInterval: 60000,
    retry: false
  });

  const uploadBillMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = `/api/deals/${dealId}/bills/upload`;
      console.log(`[BillUpload] POST ${url} dealId=${dealId} file=${file.name} size=${file.size} sessionId=${sessionId ? 'present' : 'MISSING'}`);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(url, {
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
        const healthy = data.parserHealthy;
        const ocrWarn = data.ocrDegraded;
        toast({ 
          title: isPt ? "Fatura carregada" : "Bill uploaded", 
          description: !healthy
            ? (isPt ? "Arquivo salvo. Parser indisponível — análise será tentada automaticamente." : "File saved. Parser unreachable — parsing will be retried automatically.")
            : ocrWarn
            ? (isPt ? "Análise iniciada. OCR degradado — extração pode ser limitada." : "Parsing started. OCR degraded — extraction may be limited.")
            : (isPt ? "Análise iniciada. Dados aparecerão em breve." : "Parsing started. Data will appear shortly.")
        });
      } else {
        toast({ title: isPt ? "Erro no upload" : "Upload failed", description: data.error || "Unknown error", variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
    },
    onError: (err: any) => {
      const msg = err.message || '';
      let description = msg;
      let title = isPt ? "Erro no upload" : "Upload failed";
      if (msg.startsWith('401:') || msg.includes('Authentication')) {
        title = isPt ? "Sessão expirada" : "Session expired";
        description = isPt ? "Faça login novamente para continuar." : "Please log in again to continue.";
      } else if (msg.startsWith('404:') || msg.includes('not found')) {
        title = isPt ? "Negócio não encontrado" : "Deal not found";
        description = isPt ? "O negócio pode ter sido excluído." : "The deal may have been deleted.";
      } else if (msg.startsWith('400:')) {
        title = isPt ? "Arquivo inválido" : "Invalid file";
      } else if (msg.startsWith('5')) {
        title = isPt ? "Erro do servidor" : "Server error";
        description = isPt ? "Tente novamente em instantes." : "Please try again shortly.";
      }
      console.error(`[BillUpload] FAILED: ${msg}`);
      toast({ title, description, variant: "destructive" });
    }
  });

  const retryBillParseMutation = useMutation({
    mutationFn: async (billId: number) => {
      const res = await fetch(`/api/deals/${dealId}/bills/${billId}/retry-parse`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId || '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    },
    onSuccess: () => {
      toast({ title: isPt ? "Re-análise iniciada" : "Re-parse started", description: isPt ? "A fatura será analisada novamente em breve." : "The bill will be re-parsed shortly." });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
    },
    onError: (err: any) => {
      toast({ title: isPt ? "Erro ao reprocessar" : "Retry failed", description: err.message, variant: "destructive" });
    }
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (billId: number) => {
      const res = await fetch(`/api/deals/${dealId}/bills/${billId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-session-id': sessionId || '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: isPt ? "Fatura excluída" : "Bill deleted", description: data.message });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/assembly-status`] });
    },
    onError: (err: any) => {
      toast({ title: isPt ? "Erro ao excluir" : "Delete failed", description: err.message, variant: "destructive" });
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
  const parserState = parserStatus?.state as string | undefined;
  const isParserUnreachable = parserState === 'UNREACHABLE' || parserState === 'ERROR';
  const isOcrDegraded = parserState === 'DEGRADED';
  const hasEcosComplete = !!stages.find(s => s.stage === 'ECOS_GENERATED' && s.status === 'complete');

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      setLocation(path);
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
                    else if (b.code === 'BILL_PARSE_FAILED') {
                      const failedBill = bills.find((bl: any) => bl.parseStatus === 'FAILED');
                      if (failedBill) retryBillParseMutation.mutate(failedBill.id);
                    }
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
      {isParserUnreachable && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isPt 
                    ? `Parser indisponível${parserStatus?.reason ? `: ${parserStatus.reason}` : ''}`
                    : `Parser unreachable${parserStatus?.reason ? `: ${parserStatus.reason}` : ''}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-700 hover:text-red-900 h-7 px-2"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['parser-status'] })}
                data-testid="button-retry-parser"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {isPt ? 'Tentar novamente' : 'Retry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {isOcrDegraded && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPt 
                  ? "Parser online, mas OCR indisponível — extração de texto pode ser limitada."
                  : "Parser online, but OCR unavailable — text extraction may be limited."}
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
                onClick={() => {
                  const isAssemblyLink = nextStep.deepLink.includes('tab=assembly');
                  const failedBill = bills.find((b: any) => b.parseStatus === 'FAILED');
                  const stuckBill = bills.find((b: any) => {
                    const s = b.parseStatus;
                    if (s !== 'PENDING' && s !== 'PARSING' && s !== 'UPLOADED') return false;
                    const u = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    return u > 0 && (Date.now() - u > 5 * 60 * 1000);
                  });

                  if (isAssemblyLink && (failedBill || stuckBill)) {
                    const billToRetry = failedBill || stuckBill;
                    retryBillParseMutation.mutate(billToRetry.id);
                  } else if (isAssemblyLink && bills.length === 0) {
                    fileInputRef.current?.click();
                  } else {
                    handleNavigate(nextStep.deepLink);
                  }
                }}
                disabled={retryBillParseMutation.isPending}
                className={isBlocked ? "bg-red-600 hover:bg-red-700" : ""}
                data-testid="button-next-step"
              >
                {retryBillParseMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{isPt ? "Reprocessando..." : "Retrying..."}</>
                  : <>{isPt ? "Ir para Ação" : "Go to Action"}<ChevronRight className="w-4 h-4 ml-1" /></>
                }
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

          {uploadResult && uploadResult.success && !uploadResult.parserHealthy && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700" data-testid="alert-parser-unreachable">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                {isPt ? "Arquivo salvo com sucesso. Parser indisponível — análise será tentada automaticamente." : "File saved successfully. Parser unreachable — parsing will be retried automatically."}
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
              {bills.map((bill: any) => {
                const status = bill.parseStatus as string;
                const updatedAt = bill.updatedAt ? new Date(bill.updatedAt).getTime() : 0;
                const isStuck = (status === 'PENDING' || status === 'PARSING' || status === 'UPLOADED') && updatedAt > 0 && (Date.now() - updatedAt > 5 * 60 * 1000);
                const isParsing = status === 'PARSING' || status === 'PENDING' || status === 'UPLOADED';
                const statusLabel = status === 'PARSED' ? (isPt ? 'Analisado' : 'Parsed')
                  : status === 'FAILED' ? (isPt ? 'Falhou' : 'Failed')
                  : isParsing ? (isPt ? 'Analisando...' : 'Parsing...')
                  : status;
                const statusIcon = status === 'PARSED' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  : status === 'FAILED' ? <AlertCircle className="w-3 h-3 text-red-600" />
                  : isParsing ? <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                  : <Clock className="w-3 h-3 text-amber-600" />;
                
                const isExpanded = expandedBillId === bill.id;
                const isEditing = editingBillId === bill.id;
                const isDebug = debugBillId === bill.id;
                const confidence = bill.fieldConfidence as Record<string, number> | null;
                const reasons = bill.fieldReasons as Record<string, string> | null;

                const criticalFields = [
                  { key: 'customerId', label: isPt ? 'CNPJ' : 'CNPJ', value: bill.customerId },
                  { key: 'ucCode', label: 'UC', value: bill.ucCode || bill.customerId },
                  { key: 'tariffGroup', label: isPt ? 'Grupo/Subgrupo' : 'Group/Subgroup', value: bill.tariffGroup || bill.subgrupo },
                  { key: 'totalEnergyKwh', label: isPt ? 'Consumo' : 'Consumption', value: bill.totalEnergyKwh },
                  { key: 'totalAmount', label: isPt ? 'Total a pagar' : 'Total Amount', value: bill.totalAmount },
                ];
                const missingCritical = status === 'PARSED' ? criticalFields.filter(f => !f.value) : [];
                const needsReview = missingCritical.length > 0;

                const rfqFieldGroups = [
                  { 
                    title: isPt ? 'Identidade' : 'Identity',
                    fields: [
                      { key: 'customerName', label: isPt ? 'Razão Social' : 'Company Name', value: bill.customerName },
                      { key: 'ucCode', label: 'UC', value: bill.ucCode },
                      { key: 'customerId', label: 'CNPJ', value: bill.customerId },
                      { key: 'endereco', label: isPt ? 'Endereço' : 'Address', value: bill.endereco },
                    ]
                  },
                  {
                    title: isPt ? 'Tarifa' : 'Tariff',
                    fields: [
                      { key: 'tariffGroup', label: isPt ? 'Grupo/Subgrupo' : 'Group/Subgroup', value: bill.tariffGroup || bill.subgrupo },
                      { key: 'modalidade', label: isPt ? 'Modalidade' : 'Modality', value: bill.modalidade },
                      { key: 'distributor', label: isPt ? 'Distribuidora' : 'Distributor', value: bill.distributor },
                    ]
                  },
                  {
                    title: isPt ? 'Consumo' : 'Consumption',
                    fields: [
                      { key: 'totalEnergyKwh', label: isPt ? 'Total (kWh)' : 'Total (kWh)', value: bill.totalEnergyKwh, fmt: 'kwh' },
                      { key: 'consumoPontaKwh', label: isPt ? 'Ponta (kWh)' : 'Peak (kWh)', value: bill.consumoPontaKwh, fmt: 'kwh' },
                      { key: 'consumoForaPontaKwh', label: isPt ? 'Fora Ponta (kWh)' : 'Off-Peak (kWh)', value: bill.consumoForaPontaKwh, fmt: 'kwh' },
                    ]
                  },
                  {
                    title: isPt ? 'Demanda' : 'Demand',
                    fields: [
                      { key: 'demandaContratadaKw', label: isPt ? 'Contratada (kW)' : 'Contracted (kW)', value: bill.demandaContratadaKw, fmt: 'kw' },
                      { key: 'demandaMedidaKw', label: isPt ? 'Medida (kW)' : 'Measured (kW)', value: bill.demandaMedidaKw, fmt: 'kw' },
                    ]
                  },
                  {
                    title: isPt ? 'Pagamento' : 'Payment',
                    fields: [
                      { key: 'totalAmount', label: isPt ? 'Total a Pagar' : 'Total Amount', value: bill.totalAmount, fmt: 'brl' },
                      { key: 'referenceMonth', label: isPt ? 'Mês Ref.' : 'Ref Month', value: bill.referenceMonth },
                      { key: 'dueDate', label: isPt ? 'Vencimento' : 'Due Date', value: bill.dueDate },
                    ]
                  },
                ];

                const fmtVal = (val: any, fmt?: string) => {
                  if (val == null || val === '') return null;
                  if (fmt === 'brl') return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                  if (fmt === 'kwh') return `${Number(val).toLocaleString('pt-BR')} kWh`;
                  if (fmt === 'kw') return `${Number(val).toLocaleString('pt-BR')} kW`;
                  return String(val);
                };

                const handleSaveOverride = async () => {
                  setSavingOverride(true);
                  try {
                    const res = await fetch(`/api/deals/${dealId}/bills/${bill.id}/override`, {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId || '' },
                      body: JSON.stringify(editFormData),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
                    toast({ title: isPt ? 'Campos atualizados' : 'Fields updated', description: isPt ? 'Dados salvos com sucesso.' : 'Data saved successfully.' });
                    setEditingBillId(null);
                    setEditFormData({});
                    queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/bills`] });
                  } catch (err: any) {
                    toast({ title: isPt ? 'Erro ao salvar' : 'Save failed', description: err.message, variant: 'destructive' });
                  } finally {
                    setSavingOverride(false);
                  }
                };

                const startEditing = () => {
                  const initial: Record<string, string> = {};
                  rfqFieldGroups.forEach(g => g.fields.forEach(f => {
                    if (f.value != null && f.value !== '') initial[f.key] = String(f.value);
                  }));
                  setEditFormData(initial);
                  setEditingBillId(bill.id);
                };

                return (
                  <div key={bill.id} className={cn("border rounded-md text-xs", 
                    status === 'FAILED' ? "bg-red-50 border-red-200" :
                    isStuck ? "bg-amber-50 border-amber-200" :
                    needsReview ? "bg-amber-50 border-amber-300" :
                    "bg-slate-50"
                  )} data-testid={`bill-row-${bill.id}`}>
                    <div className="p-2 flex items-center justify-between cursor-pointer" onClick={() => status === 'PARSED' && setExpandedBillId(isExpanded ? null : bill.id)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                        <span className="truncate">{bill.originalFilename}</span>
                        <div className="flex items-center gap-1">
                          {statusIcon}
                          <Badge variant="outline" className={cn("text-[10px] h-5",
                            status === 'PARSED' ? "bg-emerald-50 text-emerald-700" :
                            status === 'FAILED' ? "bg-red-50 text-red-700" :
                            status === 'PARSING' ? "bg-blue-50 text-blue-700" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {isStuck ? (isPt ? 'Travado' : 'Stuck') : statusLabel}
                          </Badge>
                          {needsReview && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-amber-100 text-amber-800 border-amber-300" data-testid={`badge-needs-review-${bill.id}`}>
                              {isPt ? 'Revisão Necessária' : 'Needs Review'}
                            </Badge>
                          )}
                          {bill.docKind && bill.docKind !== 'STANDARD_BILL' && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700">
                              {bill.docKind.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {status === 'PARSED' && bill.distributor && (
                          <span className="text-[10px] text-muted-foreground">{bill.distributor} {bill.referenceMonth ? `• ${bill.referenceMonth}` : ''}</span>
                        )}
                        {status === 'PARSED' && bill.totalAmount && (
                          <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 ml-1">
                            R$ {Number(bill.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                        )}
                        {status === 'PARSED' && (
                          isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />
                        )}
                        {isStuck && (
                          <button
                            onClick={(e) => { e.stopPropagation(); retryBillParseMutation.mutate(bill.id); }}
                            disabled={retryBillParseMutation.isPending}
                            className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-amber-200 hover:bg-amber-300 rounded transition-colors disabled:opacity-50"
                            data-testid={`button-retry-stuck-${bill.id}`}
                          >
                            {retryBillParseMutation.isPending ? (isPt ? 'Reenviando...' : 'Retrying...') : (isPt ? 'Reprocessar' : 'Retry')}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(isPt ? `Excluir "${bill.originalFilename}"? Isso não pode ser desfeito.` : `Delete "${bill.originalFilename}"? This cannot be undone.`)) {
                              deleteBillMutation.mutate(bill.id);
                            }
                          }}
                          disabled={deleteBillMutation.isPending}
                          className="shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title={isPt ? 'Excluir fatura' : 'Delete bill'}
                          data-testid={`button-delete-bill-${bill.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {status === 'PARSED' && needsReview && !isExpanded && (
                      <div className="mx-2 mb-2 text-[10px] text-amber-800 bg-amber-100 border border-amber-300 rounded px-2 py-1.5 flex items-start gap-1.5" data-testid={`alert-needs-review-${bill.id}`}>
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                        <span>
                          {isPt ? 'Campos críticos ausentes: ' : 'Missing critical fields: '}
                          <strong>{missingCritical.map(f => f.label).join(', ')}</strong>
                          {isPt ? ' — clique para revisar e preencher manualmente' : ' — click to review and fill manually'}
                        </span>
                      </div>
                    )}

                    {status === 'PARSED' && (
                      <div className="mx-2 mb-1 flex gap-1 flex-wrap">
                        {criticalFields.map(f => (
                          <span key={f.key} className={cn("inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded",
                            f.value ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )} data-testid={`field-check-${f.key}-${bill.id}`}>
                            {f.value ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {f.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {status === 'FAILED' && (
                      <div className="mx-2 mb-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1" data-testid={`bill-error-${bill.id}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium">{isPt ? 'Erro: ' : 'Error: '}</span>
                            {bill.parseErrors ? (Array.isArray(bill.parseErrors) ? bill.parseErrors.join('; ') : String(bill.parseErrors)) : (isPt ? 'Falha na análise do documento' : 'Document parsing failed')}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); retryBillParseMutation.mutate(bill.id); }}
                            disabled={retryBillParseMutation.isPending}
                            className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-red-200 hover:bg-red-300 rounded transition-colors disabled:opacity-50"
                            data-testid={`button-retry-parse-${bill.id}`}
                          >
                            {retryBillParseMutation.isPending ? (isPt ? 'Reenviando...' : 'Retrying...') : (isPt ? 'Reprocessar' : 'Retry')}
                          </button>
                        </div>
                      </div>
                    )}
                    {isParsing && !isStuck && (
                      <div className="px-2 pb-2">
                        <BillParseProgress updatedAt={updatedAt} isPt={isPt} />
                      </div>
                    )}
                    {isStuck && status !== 'FAILED' && (
                      <div className="mx-2 mb-2 text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-1">
                        {isPt ? 'Análise parada há mais de 5 minutos. Clique em Reprocessar.' : 'Parse stalled for over 5 minutes. Click Retry.'}
                      </div>
                    )}

                    {status === 'PARSED' && isExpanded && (
                      <div className="border-t border-slate-200 mx-2 mb-2 pt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                            {isPt ? 'Campos RFQ' : 'RFQ Fields'}
                          </span>
                          <div className="flex gap-1">
                            {!isEditing ? (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={startEditing} data-testid={`button-edit-${bill.id}`}>
                                <Edit3 className="w-3 h-3 mr-1" />{isPt ? 'Editar' : 'Edit'}
                              </Button>
                            ) : (
                              <>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-emerald-700" onClick={handleSaveOverride} disabled={savingOverride} data-testid={`button-save-override-${bill.id}`}>
                                  {savingOverride ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                  {isPt ? 'Salvar' : 'Save'}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-red-600" onClick={() => { setEditingBillId(null); setEditFormData({}); }} data-testid={`button-cancel-edit-${bill.id}`}>
                                  <X className="w-3 h-3 mr-1" />{isPt ? 'Cancelar' : 'Cancel'}
                                </Button>
                              </>
                            )}
                            {(user?.role === 'admin' || user?.role === 'ops') && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setDebugBillId(isDebug ? null : bill.id)} data-testid={`button-debug-${bill.id}`}>
                                <Bug className="w-3 h-3 mr-1" />{isPt ? 'Debug' : 'Debug'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {rfqFieldGroups.map(group => (
                          <div key={group.title}>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{group.title}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {group.fields.map(field => {
                                const fieldConf = confidence?.[field.key];
                                const fieldReason = reasons?.[field.key];
                                const isOverride = fieldReason === 'MANUAL_OVERRIDE';
                                const isLowConf = fieldConf != null && fieldConf < 0.6;
                                const hasValue = field.value != null && field.value !== '';
                                
                                return (
                                  <div key={field.key} className={cn("flex items-center gap-1 py-0.5 px-1 rounded text-[11px]",
                                    !hasValue && "bg-red-50",
                                    isLowConf && hasValue && "bg-amber-50",
                                    isOverride && "bg-blue-50"
                                  )} data-testid={`rfq-field-${field.key}-${bill.id}`}>
                                    <span className="text-muted-foreground shrink-0">{field.label}:</span>
                                    {isEditing ? (
                                      <Input
                                        className="h-5 text-[11px] py-0 px-1 border-slate-300"
                                        value={editFormData[field.key] || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        placeholder={isPt ? 'Não extraído' : 'Not extracted'}
                                        data-testid={`input-override-${field.key}-${bill.id}`}
                                      />
                                    ) : (
                                      <span className={cn("truncate", !hasValue && "text-red-500 italic")}>
                                        {hasValue ? (fmtVal(field.value, (field as any).fmt) || field.value) : (isPt ? 'Não detectado' : 'Not detected')}
                                      </span>
                                    )}
                                    {isOverride && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-blue-100 text-blue-700 shrink-0">manual</Badge>}
                                    {isLowConf && hasValue && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-100 text-amber-700 shrink-0">{Math.round((fieldConf || 0) * 100)}%</Badge>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {isDebug && (() => {
                          const allFields = rfqFieldGroups.flatMap(g => g.fields);
                          const foundFields = allFields.filter(f => f.value != null && f.value !== '');
                          const missingFields = allFields.filter(f => f.value == null || f.value === '');
                          const normalizeConf = (v: number) => v > 100 ? (v / 10000).toFixed(2) : v > 1 ? (v / 100).toFixed(2) : Number(v).toFixed(2);
                          return (
                          <div className="border-t border-slate-200 pt-2 space-y-2" data-testid={`debug-panel-${bill.id}`}>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              {isPt ? 'Debug (Ops)' : 'Debug (Ops)'}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-600">
                              <div><span className="font-medium">Parser URL:</span> {(bill.parseDebugJson as any)?.parserUrl || 'parser.otimaenergia.com'}</div>
                              <div><span className="font-medium">{isPt ? 'Latência:' : 'Latency:'}</span> {(bill.parseDebugJson as any)?.timingsMs?.totalMs ? `${Math.round((bill.parseDebugJson as any).timingsMs.totalMs)}ms` : '—'}</div>
                              <div><span className="font-medium">{isPt ? 'Tipo Doc:' : 'Doc Kind:'}</span> <Badge variant="outline" className="text-[9px] h-4 px-1">{bill.docKind || 'STANDARD_BILL'}</Badge></div>
                              <div><span className="font-medium">{isPt ? 'Páginas:' : 'Pages:'}</span> {(bill.parseDebugJson as any)?.pages || '—'}</div>
                              <div><span className="font-medium">{isPt ? 'Fonte Texto:' : 'Text Source:'}</span> {bill.textSource || (bill.parseDebugJson as any)?.textSource || '—'}</div>
                              <div><span className="font-medium">{isPt ? 'Confiança:' : 'Confidence:'}</span> {bill.parseConfidence != null ? normalizeConf(bill.parseConfidence) : '—'}</div>
                            </div>
                            <div className="text-[10px] border rounded p-2 bg-slate-100">
                              <span className="font-medium text-slate-600">{isPt ? 'Extração: ' : 'Extraction: '}</span>
                              <span className="text-emerald-700">{foundFields.length} {isPt ? 'encontrados' : 'found'}</span>
                              {missingFields.length > 0 && (
                                <span className="text-red-600"> · {missingFields.length} {isPt ? 'ausentes' : 'missing'}: {missingFields.map(f => f.label).join(', ')}</span>
                              )}
                            </div>
                            {reasons && Object.keys(reasons).length > 0 && (
                              <div className="text-[10px]">
                                <span className="font-medium text-slate-600">Field Reasons: </span>
                                <span className="text-slate-500">{Object.entries(reasons).map(([k, v]) => `${k}=${v}`).join(', ')}</span>
                              </div>
                            )}
                            {bill.parseWarnings && (bill.parseWarnings as any[]).length > 0 && (
                              <div className="text-[10px] text-amber-600">
                                <span className="font-medium">{isPt ? 'Avisos: ' : 'Warnings: '}</span>
                                {(bill.parseWarnings as any[]).join('; ')}
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(bill.parseDebugJson, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `parse_debug_bill_${bill.id}.json`;
                                document.body.appendChild(a);
                                a.click();
                                URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              }}
                              data-testid={`button-download-debug-${bill.id}`}
                            >
                              <Download className="w-3 h-3 mr-1" />{isPt ? 'Baixar JSON Debug' : 'Download Debug JSON'}
                            </Button>
                          </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div className="flex items-center gap-2 flex-wrap">
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
              {prcReadiness?.ok && (
                <Badge variant="outline" className={cn("text-xs", prcReadiness.isReady ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")} data-testid="badge-prc-ready">
                  PRC: {prcReadiness.isReady ? `${prcReadiness.submarketRows} rows (${prcReadiness.dealSubmarket})` : (isPt ? 'Sem dados' : 'No data')}
                </Badge>
              )}
              {(user?.role === 'admin' || user?.role === 'ops') && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowPrcDebug(!showPrcDebug)} data-testid="button-prc-debug">
                  <Bug className="w-3 h-3 mr-1" />{isPt ? 'PRC Debug' : 'PRC Debug'}
                </Button>
              )}
            </div>

            {showPrcDebug && prcReadiness?.ok && (user?.role === 'admin' || user?.role === 'ops') && (
              <div className="border rounded-md p-3 bg-slate-50 space-y-2 text-xs" data-testid="prc-debug-panel">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  PRC / ECOS Readiness Debug
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <div><span className="font-medium">{isPt ? 'Submercado:' : 'Submarket:'}</span> {prcReadiness.dealSubmarket}</div>
                  <div><span className="font-medium">{isPt ? 'Distribuidora:' : 'Distributor:'}</span> {prcReadiness.dealDistributor || '—'}</div>
                  <div><span className="font-medium">{isPt ? 'Faturas analisadas:' : 'Parsed bills:'}</span> {prcReadiness.parsedBillCount}</div>
                  <div><span className="font-medium">{isPt ? 'PRCs disponíveis:' : 'Available PRCs:'}</span> {prcReadiness.prcDocCount}</div>
                  <div><span className="font-medium">{isPt ? 'Total linhas PRC:' : 'Total PRC rows:'}</span> {prcReadiness.totalPrcRows}</div>
                  <div><span className="font-medium">{isPt ? 'Linhas submercado:' : 'Submarket rows:'}</span> {prcReadiness.submarketRows}</div>
                  <div><span className="font-medium">{isPt ? 'Produtos encontrados:' : 'Found products:'}</span> {(prcReadiness.foundProducts || []).join(', ') || '—'}</div>
                  <div><span className="font-medium">{isPt ? 'Termos encontrados:' : 'Found terms:'}</span> {(prcReadiness.foundTerms || []).map((t: number) => `${t}m`).join(', ') || '—'}</div>
                </div>
                {(prcReadiness.missingProducts?.length > 0 || prcReadiness.missingTerms?.length > 0) && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {prcReadiness.warnings?.join(' | ') || 'Missing coverage'}
                  </div>
                )}
                {prcReadiness.docSummaries?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">PRC Documents</p>
                    {prcReadiness.docSummaries.map((doc: any) => (
                      <div key={doc.id} className="text-[10px] text-slate-600 bg-white border rounded px-2 py-1">
                        <span className="font-medium">Doc #{doc.id}</span>
                        {' '}({doc.parseStatus}) — {doc.referenceMonth || '?'} — {doc.rowCount} rows
                        {doc.countsBySubmarket && Object.keys(doc.countsBySubmarket).length > 0 && (
                          <span className="ml-1 text-slate-500">
                            [{Object.entries(doc.countsBySubmarket).map(([k, v]) => `${k}:${v}`).join(', ')}]
                          </span>
                        )}
                        {doc.countsByProduct && Object.keys(doc.countsByProduct).length > 0 && (
                          <span className="ml-1 text-slate-500">
                            [{Object.entries(doc.countsByProduct).map(([k, v]) => `${k}:${v}`).join(', ')}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
