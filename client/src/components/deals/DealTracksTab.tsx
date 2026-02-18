import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  TRACK_STATUS_TRANSITIONS,
  GDL_TRACK_STATUSES,
  ACL_TRACK_STATUSES,
  ACR_TRACK_STATUSES,
  OTHER_TRACK_STATUSES,
  TRACK_DOC_TYPES,
} from "@shared/schema";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  GitBranch,
  FileText,
  Loader2,
  AlertTriangle,
  Calendar,
  Upload,
  Link2,
  Copy,
  ExternalLink,
  Smartphone,
  Mail,
  MessageCircle,
  RefreshCw,
  Shield,
  KeyRound,
  Eye,
  Send,
  TimerReset,
  StopCircle,
  User,
  Phone,
} from "lucide-react";

interface DealTracksTabProps {
  dealId: string;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  GDL: "bg-green-100 text-green-800 border-green-300",
  ACL: "bg-blue-100 text-blue-800 border-blue-300",
  ACR: "bg-purple-100 text-purple-800 border-purple-300",
  OTHER: "bg-gray-100 text-gray-800 border-gray-300",
};

const TYPE_BUTTON_COLORS: Record<string, string> = {
  GDL: "bg-green-600 hover:bg-green-700 text-white",
  ACL: "bg-blue-600 hover:bg-blue-700 text-white",
  ACR: "bg-purple-600 hover:bg-purple-700 text-white",
  OTHER: "bg-gray-600 hover:bg-gray-700 text-white",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  ENERGY_BILL: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CNPJ_CARD: "bg-blue-100 text-blue-800 border-blue-300",
  LGPD_CONSENT: "bg-green-100 text-green-800 border-green-300",
  OTHER: "bg-gray-100 text-gray-800 border-gray-300",
};

const GDL_CTA_MAP: Record<string, { en: string; pt: string }> = {
  GDL_NEW: { en: "Complete Eligibility", pt: "Completar Elegibilidade" },
  GDL_ELIGIBILITY_PASSED: { en: "Upload Missing Docs", pt: "Enviar Docs Faltantes" },
  GDL_DOCS_COMPLETE: { en: "Submit to Prime", pt: "Submeter à Prime" },
  GDL_SUBMITTED_TO_PRIME: { en: "Mark Prime Approved", pt: "Marcar Prime Aprovado" },
  GDL_PRIME_APPROVED: { en: "Send Proposal", pt: "Enviar Proposta" },
  GDL_PROPOSAL_SENT: { en: "Record Client Acceptance", pt: "Registrar Aceite do Cliente" },
  GDL_CLIENT_ACCEPTED: { en: "Send Contract", pt: "Enviar Contrato" },
  GDL_CONTRACT_SENT: { en: "Mark Contract Signed", pt: "Marcar Contrato Assinado" },
  GDL_CONTRACT_SIGNED: { en: "Close Won", pt: "Fechar Ganho" },
};

const GDL_STEPS = [
  "GDL_NEW",
  "GDL_ELIGIBILITY_PASSED",
  "GDL_DOCS_COMPLETE",
  "GDL_SUBMITTED_TO_PRIME",
  "GDL_PRIME_APPROVED",
  "GDL_PROPOSAL_SENT",
  "GDL_CLIENT_ACCEPTED",
  "GDL_CONTRACT_SENT",
  "GDL_CONTRACT_SIGNED",
  "GDL_CLOSED_WON",
];

function formatStatus(status: string): string {
  const prefixes = ["GDL_", "ACL_", "ACR_", "OTHER_"];
  let cleaned = status;
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
      break;
    }
  }
  return cleaned
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getStatusColor(status: string): string {
  if (status.includes("CLOSED_WON")) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (status.includes("CLOSED_LOST")) return "bg-red-100 text-red-800 border-red-300";
  if (status.includes("NEW")) return "bg-gray-100 text-gray-800 border-gray-300";
  return "bg-amber-100 text-amber-800 border-amber-300";
}

function getGdlProgress(status: string): number {
  const idx = GDL_STEPS.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (GDL_STEPS.length - 1)) * 100);
}

function getGdlStepStatus(currentStatus: string) {
  const idx = GDL_STEPS.indexOf(currentStatus);
  return {
    eligibility: idx >= 1,
    docsComplete: idx >= 2,
    primeSubmitted: idx >= 3,
    proposalSent: idx >= 5,
    accepted: idx >= 6,
  };
}

export function DealTracksTab({ dealId }: DealTracksTabProps) {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const isPt = language === "pt";

  const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null);
  const [creatingType, setCreatingType] = useState<string | null>(null);

  const { data: tracksData, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/tracks`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/tracks`);
      return res.json();
    },
  });

  const tracks: any[] = Array.isArray(tracksData) ? tracksData : [];

  const createTrackMutation = useMutation({
    mutationFn: async (type: string) => {
      setCreatingType(type);
      const res = await apiRequest("POST", `/api/deals/${dealId}/tracks`, { type });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: isPt ? "Track criada" : "Track created",
        description: isPt ? "A track foi adicionada com sucesso." : "The track was added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
      if (data?.id) {
        setExpandedTrackId(data.id);
      }
      setCreatingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: isPt ? "Erro" : "Error",
        description: error.message,
        variant: "destructive",
      });
      setCreatingType(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8" data-testid="tracks-loading">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="deal-tracks-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            {isPt ? "Tracks do Negócio" : "Deal Tracks"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isPt
              ? "Gerencie as trilhas de contratação deste negócio"
              : "Manage the contracting tracks for this deal"}
          </p>
        </div>
        <div className="flex gap-2">
          {(["GDL", "ACL", "ACR", "OTHER"] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              className={TYPE_BUTTON_COLORS[type]}
              onClick={() => createTrackMutation.mutate(type)}
              disabled={createTrackMutation.isPending}
              data-testid={`button-create-track-${type.toLowerCase()}`}
            >
              {creatingType === type && createTrackMutation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              + {type === "OTHER" ? (isPt ? "Outro" : "Other") : type}
            </Button>
          ))}
        </div>
      </div>

      {tracks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{isPt ? "Nenhuma track criada ainda" : "No tracks created yet"}</p>
            <p className="text-xs mt-1">
              {isPt
                ? "Clique em um dos botões acima para criar uma track"
                : "Click one of the buttons above to create a track"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tracks.map((track: any) => (
            <TrackCard
              key={track.id}
              track={track}
              dealId={dealId}
              isExpanded={expandedTrackId === track.id}
              onToggle={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)}
              isPt={isPt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrackCard({
  track,
  dealId,
  isExpanded,
  onToggle,
  isPt,
}: {
  track: any;
  dealId: string;
  isExpanded: boolean;
  onToggle: () => void;
  isPt: boolean;
}) {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isGDL = track.type === "GDL";
  const gdlSteps = isGDL ? getGdlStepStatus(track.status) : null;
  const gdlProgress = isGDL ? getGdlProgress(track.status) : 0;
  const ctaLabel = isGDL ? GDL_CTA_MAP[track.status] : null;

  const nextActionDate = track.nextActionAt ? new Date(track.nextActionAt) : null;
  const isOverdue = nextActionDate && nextActionDate < new Date();

  const gdlCtaMutation = useMutation({
    mutationFn: async () => {
      const transitions = TRACK_STATUS_TRANSITIONS[track.status] || [];
      const nextStatus = transitions.find((s: string) => !s.includes("CLOSED_LOST"));
      if (!nextStatus) return;
      const res = await apiRequest("PATCH", `/api/tracks/${track.id}/status`, { newStatus: nextStatus });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: isPt ? "Status atualizado" : "Status updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${track.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-track-${track.id}`}>
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
        data-testid={`button-toggle-track-${track.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <Badge className={`${TYPE_BADGE_COLORS[track.type] || TYPE_BADGE_COLORS.OTHER} border`} data-testid={`badge-track-type-${track.id}`}>
              {track.type}
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(track.status)} border`} data-testid={`badge-track-status-${track.id}`}>
              {formatStatus(track.status)}
            </Badge>
            {track.partnerName && (
              <span className="text-sm text-muted-foreground" data-testid={`text-partner-${track.id}`}>
                {track.partnerName}
              </span>
            )}
            {track.metadata?.intakeCompletedAt && (
              <Badge className="bg-green-100 text-green-800 border-green-300 border text-[10px]" data-testid={`badge-intake-complete-${track.id}`}>
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                Intake Complete
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {nextActionDate ? (
              <span
                className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                data-testid={`text-next-action-${track.id}`}
              >
                <Calendar className="w-3 h-3" />
                {isPt ? "Próxima ação" : "Next action"}:{" "}
                {nextActionDate.toLocaleDateString(isPt ? "pt-BR" : "en-US", { weekday: "short" })}{" "}
                {nextActionDate.toLocaleTimeString(isPt ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                {track.nextActionText && ` — ${track.nextActionText}`}
                {isOverdue && (
                  <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0" data-testid={`badge-overdue-${track.id}`}>
                    {isPt ? "Atrasado" : "Overdue"}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic" data-testid={`text-no-action-${track.id}`}>
                {isPt ? "Sem próxima ação" : "No next action"}
              </span>
            )}
          </div>
        </div>

        {isGDL && !track.status.includes("CLOSED") && (
          <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-xs">
              <Progress value={gdlProgress} className="flex-1 h-2" data-testid={`progress-gdl-${track.id}`} />
              <span className="text-muted-foreground font-medium">{gdlProgress}%</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                {gdlSteps?.eligibility ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-gray-400" />}
                {isPt ? "Elegibilidade" : "Eligibility"}
              </span>
              <span className="flex items-center gap-1">
                {gdlSteps?.docsComplete ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-gray-400" />}
                Docs
              </span>
              <span className="flex items-center gap-1">
                {gdlSteps?.primeSubmitted ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-gray-400" />}
                Prime
              </span>
              <span className="flex items-center gap-1">
                {gdlSteps?.proposalSent ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-gray-400" />}
                {isPt ? "Proposta" : "Proposal"}
              </span>
              <span className="flex items-center gap-1">
                {gdlSteps?.accepted ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-gray-400" />}
                {isPt ? "Aceito" : "Accepted"}
              </span>
            </div>
            {ctaLabel && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  gdlCtaMutation.mutate();
                }}
                disabled={gdlCtaMutation.isPending}
                data-testid={`button-gdl-cta-${track.id}`}
              >
                {gdlCtaMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                <ChevronRight className="w-3 h-3 mr-1" />
                {isPt ? ctaLabel.pt : ctaLabel.en}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <TrackDetailView trackId={track.id} trackType={track.type} dealId={dealId} />
        </CardContent>
      )}
    </Card>
  );
}

function TrackDetailView({
  trackId,
  trackType,
  dealId,
}: {
  trackId: number;
  trackType: string;
  dealId: string;
}) {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const isPt = language === "pt";

  const [closureEvaluation, setClosureEvaluation] = useState<string | null>(null);
  const [docType, setDocType] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [nextActionText, setNextActionText] = useState("");
  const [partnerNameEdit, setPartnerNameEdit] = useState("");
  const [partnerNameDirty, setPartnerNameDirty] = useState(false);

  const { data: trackDetail, isLoading } = useQuery({
    queryKey: [`/api/tracks/${trackId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tracks/${trackId}`);
      return res.json();
    },
    select: (data: any) => {
      if (!partnerNameDirty && data?.partnerName !== undefined) {
        setTimeout(() => {
          setPartnerNameEdit(data.partnerName || "");
          if (data.nextActionAt) setNextActionAt(new Date(data.nextActionAt).toISOString().slice(0, 16));
          if (data.nextActionText) setNextActionText(data.nextActionText || "");
        }, 0);
      }
      return data;
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const res = await apiRequest("PATCH", `/api/tracks/${trackId}/status`, {
        newStatus: nextStatus,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: isPt ? "Status atualizado" : "Status updated",
        description: isPt ? "A track foi avançada com sucesso." : "The track was advanced successfully.",
      });
      if (data?.closureEvaluation) {
        setClosureEvaluation(data.closureEvaluation);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({
        title: isPt ? "Erro" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const metadataMutation = useMutation({
    mutationFn: async (metadata: any) => {
      const res = await apiRequest("PATCH", `/api/tracks/${trackId}/metadata`, {
        metadata,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Metadados atualizados" : "Metadata updated" });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/documents`, {
        documentType: docType,
        fileName: docFileName,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Documento adicionado" : "Document added" });
      setDocType("");
      setDocFileName("");
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const nextActionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/tracks/${trackId}/next-action`, {
        nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
        nextActionText: nextActionText || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Próxima ação atualizada" : "Next action updated" });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const partnerMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("PATCH", `/api/tracks/${trackId}/metadata`, {
        metadata: { ...(trackDetail?.metadata || {}), partnerName: name },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Parceiro atualizado" : "Partner updated" });
      setPartnerNameDirty(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentStatus = trackDetail?.status || "";
  const events: any[] = trackDetail?.events || [];
  const documents: any[] = trackDetail?.documents || [];
  const allowedTransitions = TRACK_STATUS_TRANSITIONS[currentStatus] || [];
  const metadata = trackDetail?.metadata || {};
  const isGDL = trackType === "GDL";

  const GDL_REQUIRED_DOCS = ["ENERGY_BILL", "CNPJ_CARD", "LGPD_CONSENT"];
  const missingDocs = isGDL
    ? GDL_REQUIRED_DOCS.filter((dt) => !documents.some((d: any) => d.documentType === dt))
    : [];
  const showDocsWarning = isGDL && missingDocs.length > 0 && !currentStatus.includes("CLOSED");

  return (
    <div className="space-y-6 border-t pt-4">
      {closureEvaluation && (
        <Alert className="bg-blue-50 border-blue-300" data-testid="alert-closure-evaluation">
          <AlertTriangle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">{closureEvaluation}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {isPt ? "Status Atual" : "Current Status"}
          </p>
          <p className="text-lg font-semibold">{formatStatus(currentStatus)}</p>
        </div>
        {allowedTransitions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {allowedTransitions.map((nextStatus: string) => (
              <Button
                key={nextStatus}
                size="sm"
                variant={nextStatus.includes("CLOSED_LOST") ? "destructive" : "default"}
                onClick={() => advanceMutation.mutate(nextStatus)}
                disabled={advanceMutation.isPending}
                data-testid={`button-advance-${nextStatus}`}
              >
                {advanceMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {nextStatus.includes("CLOSED_LOST") ? (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    {isPt ? "Perder" : "Lose"}
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {formatStatus(nextStatus)}
                  </>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">{isPt ? "Nome do Parceiro" : "Partner Name"}</Label>
          <div className="flex gap-2">
            <Input
              value={partnerNameEdit}
              onChange={(e) => {
                setPartnerNameEdit(e.target.value);
                setPartnerNameDirty(true);
              }}
              placeholder={isPt ? "Ex: Solar Prime" : "Ex: Solar Prime"}
              data-testid={`input-partner-name-${trackId}`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => partnerMutation.mutate(partnerNameEdit)}
              disabled={partnerMutation.isPending}
              data-testid={`button-save-partner-${trackId}`}
            >
              {partnerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (isPt ? "Salvar" : "Save")}
            </Button>
          </div>
        </div>
      </div>

      {isGDL && (
        <GDLEligibilityChecklist
          metadata={metadata}
          onUpdate={(eligibility: any) =>
            metadataMutation.mutate({ ...metadata, eligibility })
          }
          isPending={metadataMutation.isPending}
        />
      )}

      {showDocsWarning && (
        <Alert className="bg-yellow-50 border-yellow-300" data-testid="alert-missing-docs">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {isPt ? "Documentos faltantes para submissão à Prime: " : "Missing docs for Prime submission: "}
            {missingDocs.map((d) => d.replace(/_/g, " ")).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {isPt ? "Documentos" : "Documents"} ({documents.length})
        </h4>
        {documents.length > 0 && (
          <div className="space-y-2 mb-3">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 text-sm p-2 rounded border"
                data-testid={`document-${doc.id}`}
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <Badge className={`${DOC_TYPE_COLORS[doc.documentType] || DOC_TYPE_COLORS.OTHER} border text-[10px]`}>
                  {doc.documentType?.replace(/_/g, " ")}
                </Badge>
                <span>{doc.fileName || doc.documentType}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(doc.createdAt).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">{isPt ? "Tipo de Documento" : "Document Type"}</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid={`select-doc-type-${trackId}`}>
                <SelectValue placeholder={isPt ? "Selecione" : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {TRACK_DOC_TYPES.map((dt) => (
                  <SelectItem key={dt} value={dt}>{dt.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">{isPt ? "Nome do Arquivo" : "File Name"}</Label>
            <Input
              value={docFileName}
              onChange={(e) => setDocFileName(e.target.value)}
              placeholder={isPt ? "ex: conta_luz_jan.pdf" : "e.g. bill_jan.pdf"}
              data-testid={`input-doc-filename-${trackId}`}
            />
          </div>
          <Button
            size="sm"
            onClick={() => uploadDocMutation.mutate()}
            disabled={!docType || !docFileName || uploadDocMutation.isPending}
            data-testid={`button-upload-doc-${trackId}`}
          >
            {uploadDocMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            {isPt ? "Adicionar" : "Add"}
          </Button>
        </div>
      </div>

      <IntakeReadinessSection trackId={trackId} dealId={dealId} trackType={trackType} isPt={isPt} />

      <ContractSection trackId={trackId} dealId={dealId} isPt={isPt} />

      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {isPt ? "Próxima Ação" : "Next Action"}
        </h4>
        <div className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">{isPt ? "Data/Hora" : "Date/Time"}</Label>
            <Input
              type="datetime-local"
              value={nextActionAt}
              onChange={(e) => setNextActionAt(e.target.value)}
              data-testid={`input-next-action-at-${trackId}`}
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">{isPt ? "Descrição" : "Description"}</Label>
            <Input
              value={nextActionText}
              onChange={(e) => setNextActionText(e.target.value)}
              placeholder={isPt ? "Ex: Pedir 6 contas" : "Ex: Ask for 6 bills"}
              data-testid={`input-next-action-text-${trackId}`}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => nextActionMutation.mutate()}
            disabled={nextActionMutation.isPending}
            data-testid={`button-save-next-action-${trackId}`}
          >
            {nextActionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (isPt ? "Salvar" : "Save")}
          </Button>
        </div>
      </div>

      {events.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {isPt ? "Linha do Tempo" : "Timeline"}
          </h4>
          <div className="space-y-3">
            {events.map((event: any, idx: number) => (
              <div key={event.id} className="flex items-start gap-3" data-testid={`event-${event.id}`}>
                <div className="relative flex-shrink-0 mt-1">
                  <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                  {idx < events.length - 1 && (
                    <div className="absolute left-1.5 top-3 w-px h-6 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {event.toStatus && (
                      <Badge variant="outline" className="text-xs">
                        {formatStatus(event.toStatus)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString(isPt ? "pt-BR" : "en-US")}
                    </span>
                  </div>
                  {event.fromStatus && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatStatus(event.fromStatus)} → {formatStatus(event.toStatus)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GDLEligibilityChecklist({
  metadata,
  onUpdate,
  isPending,
}: {
  metadata: any;
  onUpdate: (eligibility: any) => void;
  isPending: boolean;
}) {
  const { language } = useI18n();
  const isPt = language === "pt";
  const eligibility = metadata?.eligibility || {};

  const items = [
    { key: "hasDistributor", label: isPt ? "Distribuidora definida" : "Distributor defined" },
    { key: "hasCCEEProfile", label: isPt ? "Perfil CCEE cadastrado" : "CCEE profile registered" },
    { key: "monthlyDemandKw", label: isPt ? "Demanda mensal (kW) informada" : "Monthly demand (kW) informed" },
    { key: "voltageLevel", label: isPt ? "Nível de tensão definido" : "Voltage level defined" },
    { key: "lgpdConsentDigital", label: isPt ? "Consentimento LGPD digital" : "Digital LGPD consent" },
  ];

  const handleToggle = (key: string) => {
    const updated = { ...eligibility, [key]: !eligibility[key] };
    onUpdate(updated);
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          {isPt ? "Checklist de Elegibilidade GDL" : "GDL Eligibility Checklist"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <Checkbox
                id={`eligibility-${item.key}`}
                checked={!!eligibility[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
                disabled={isPending}
                data-testid={`checkbox-eligibility-${item.key}`}
              />
              <Label htmlFor={`eligibility-${item.key}`} className="text-sm cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getTrackWhatsAppLine2(trackType: string): string {
  switch (trackType) {
    case 'GDL':
      return 'Para avançarmos com a proposta de energia por assinatura, preciso que envie as suas faturas.';
    case 'ACL':
      return 'Para avançarmos com a migração para o Mercado Livre, preciso que envie as suas faturas.';
    case 'ACR':
      return 'Para avançarmos com a otimização do seu contrato atual de energia, preciso que envie as suas faturas.';
    default:
      return 'Para avançarmos com a análise e proposta de energia, preciso que envie as suas faturas.';
  }
}

function IntakeReadinessSection({ trackId, dealId, trackType, isPt }: { trackId: number; dealId: string; trackType: string; isPt: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [showModal, setShowModal] = useState(false);
  const [linkData, setLinkData] = useState<{ token: string; accessCode: string | null; expiresAt: string; companyName: string | null } | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editContactName, setEditContactName] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactWhatsapp, setEditContactWhatsapp] = useState('');
  const [stopReason, setStopReason] = useState<string>('manual_override');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [linkConfig, setLinkConfig] = useState({
    requireLGPD: true,
    requireLOA: true,
    expectedBillsCount: 6,
    requireCode: false,
  });

  const { data: intakeStatus } = useQuery({
    queryKey: [`/api/tracks/${trackId}/intake-status`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tracks/${trackId}/intake-status`);
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/generate-intake-link`, linkConfig);
      return res.json();
    },
    onSuccess: (data) => {
      setLinkData({ token: data.token, accessCode: data.accessCode, expiresAt: data.expiresAt, companyName: data.companyName });
      setShowModal(true);
      setMarkedSent(false);
      toast({ title: isPt ? "Link gerado!" : "Link generated!" });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}/intake-status`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/regenerate-intake-link`, linkConfig);
      return res.json();
    },
    onSuccess: (data) => {
      setLinkData({ token: data.token, accessCode: data.accessCode, expiresAt: data.expiresAt, companyName: data.companyName });
      setMarkedSent(false);
      toast({ title: isPt ? "Link regenerado!" : "Link regenerated!" });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}/intake-status`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const extendExpiryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/extend-intake-expiry`);
      return res.json();
    },
    onSuccess: (data) => {
      if (linkData) setLinkData({ ...linkData, expiresAt: data.expiresAt, token: data.token || linkData.token });
      toast({ title: isPt ? "Prazo estendido!" : "Expiry extended!" });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}/intake-status`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const markSentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/mark-intake-sent`, { channel: 'whatsapp' });
      return res.json();
    },
    onSuccess: () => {
      setMarkedSent(true);
      toast({ title: isPt ? "Marcado como enviado!" : "Marked as sent!" });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: chaseData, refetch: refetchChase } = useQuery({
    queryKey: [`/api/tracks/${trackId}/chase-state`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tracks/${trackId}/chase-state`);
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const sendIntakeLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/send-intake-link-action`, {
        contactName,
        contactEmail,
        contactWhatsapp: whatsappOptIn ? contactWhatsapp : null,
        whatsappOptIn,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Link enviado por e-mail!" : "Intake link sent!" });
      refetchChase();
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}/intake-status`] });
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro ao enviar" : "Send failed", description: error.message, variant: "destructive" });
    },
  });

  const stopChaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/chase-stop`, { reason: stopReason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Chase parado" : "Chase stopped" });
      refetchChase();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c <= 1 ? 0 : c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resendEmailMutation = useMutation({
    mutationFn: async (newEmail?: string) => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/chase-resend-email`, {
        contactEmail: newEmail || undefined,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: isPt ? `E-mail reenviado para ${data.resentTo}` : `Email resent to ${data.resentTo}` });
      setResendCooldown(60);
      refetchChase();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro ao reenviar" : "Resend failed", description: error.message, variant: "destructive" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const res = await apiRequest("PATCH", `/api/tracks/${trackId}/chase-contact`, updates);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Contato atualizado" : "Contact updated" });
      setEditingContact(false);
      refetchChase();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const retryWebhookMutation = useMutation({
    mutationFn: async (webhookType: string) => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/chase-retry-webhook`, { webhookType });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.delivered ? (isPt ? "Webhook entregue" : "Webhook delivered") : (isPt ? "Webhook falhou" : "Webhook failed"), variant: data.delivered ? "default" : "destructive" });
      refetchChase();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const restartChaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/chase-restart`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Chase reiniciado" : "Chase restarted" });
      refetchChase();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const chaseState = chaseData?.chaseState;
  const chaseActive = chaseState?.active === true;

  useEffect(() => {
    if (chaseState?.lastSentAt) {
      const elapsed = (Date.now() - new Date(chaseState.lastSentAt).getTime()) / 1000;
      if (elapsed < 60) setResendCooldown(Math.ceil(60 - elapsed));
    }
  }, [chaseState?.lastSentAt]);

  const portalUrl = linkData ? `${window.location.origin}/client/intake/${linkData.token}` : '';
  const activeSessionUrl = intakeStatus?.session?.token ? `${window.location.origin}/client/intake/${intakeStatus.session.token}` : '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} ${isPt ? 'copiado!' : 'copied!'}` });
  };

  const line2 = getTrackWhatsAppLine2(trackType);
  const clientName = linkData?.companyName || '{Nome}';

  const whatsAppMessage = linkData
    ? `Olá ${clientName}, tudo bem?\n\n${line2}\n\n✅ Acesse pelo telemóvel:\n${portalUrl}${linkData.accessCode ? `\n\n🔐 Código de acesso: ${linkData.accessCode}` : ''}\n\nAssim que tiver as últimas faturas à mão, o envio leva apenas alguns minutos.\nDepois disso, avançamos com a análise técnica.`
    : '';

  const sendEmail = async () => {
    if (!emailTo || !portalUrl) return;
    setSendingEmail(true);
    try {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/send-intake-email`, {
        email: emailTo,
        companyName: linkData?.companyName || '',
        portalUrl,
        accessCode: linkData?.accessCode || null,
        token: linkData?.token,
      });
      if (!res.ok) throw new Error('Failed to send email');
      toast({ title: isPt ? "E-mail enviado!" : "Email sent!" });
      setEmailTo('');
    } catch (err: any) {
      toast({ title: isPt ? "Erro ao enviar" : "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const hasActiveIntake = intakeStatus && intakeStatus.session;
  const bills = intakeStatus?.bills;
  const lgpd = intakeStatus?.lgpd;
  const loa = intakeStatus?.loa;
  const isComplete = hasActiveIntake && intakeStatus.session?.usedAt;

  const expiresAt = linkData?.expiresAt && linkData.expiresAt !== '' ? new Date(linkData.expiresAt) : null;
  const daysUntilExpiry = expiresAt && !isNaN(expiresAt.getTime()) ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 3;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        {isPt ? "Intake do Cliente" : "Client Intake"}
      </h4>

      {hasActiveIntake ? (
        <Card className={`${isComplete ? 'border-green-300 bg-green-50/50' : 'border-blue-300 bg-blue-50/50'}`} data-testid={`card-intake-status-${trackId}`}>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {isPt ? "Status do Intake" : "Intake Status"}
              </span>
              <Badge className={isComplete ? "bg-green-100 text-green-800 border-green-300 border" : "bg-blue-100 text-blue-800 border-blue-300 border"} data-testid={`badge-intake-status-${trackId}`}>
                {isComplete ? (isPt ? "Completo" : "Complete") : (isPt ? "Em andamento" : "In progress")}
              </Badge>
            </div>
            {isComplete && intakeStatus.session?.usedAt && (
              <p className="text-[10px] text-green-700">
                {isPt ? "Concluído em" : "Completed"}: {new Date(intakeStatus.session.usedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1" data-testid={`intake-bills-${trackId}`}>
                {bills?.uploaded >= (bills?.required || 1) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span>{isPt ? "Faturas" : "Bills"}: {bills?.uploaded || 0}/{bills?.required || '?'}</span>
              </div>
              {intakeStatus.session?.requireLGPD && (
                <div className="flex items-center gap-1" data-testid={`intake-lgpd-${trackId}`}>
                  {lgpd?.captured ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  LGPD
                </div>
              )}
              {intakeStatus.session?.requireLOA && (
                <div className="flex items-center gap-1" data-testid={`intake-loa-${trackId}`}>
                  {loa?.captured ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  LOA
                </div>
              )}
            </div>
            {!isComplete && (
              <div className="flex gap-2 pt-1 flex-wrap">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { copyToClipboard(activeSessionUrl, 'Link'); }} data-testid={`button-copy-intake-link-${trackId}`}>
                  <Copy className="w-3 h-3 mr-1" /> {isPt ? "Copiar Link" : "Copy Link"}
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setLinkData({ token: intakeStatus.session.token, accessCode: intakeStatus.session.accessCode || null, expiresAt: intakeStatus.session.expiresAt || '', companyName: null }); setShowModal(true); setMarkedSent(false); }} data-testid={`button-share-intake-${trackId}`}>
                  <MessageCircle className="w-3 h-3 mr-1" /> {isPt ? "Compartilhar" : "Share"}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-7 text-orange-600" onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending} data-testid={`button-regenerate-intake-${trackId}`}>
                  {regenerateMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  {isPt ? "Regenerar" : "Regenerate"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed" data-testid={`card-generate-intake-${trackId}`}>
          <CardContent className="py-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              {isPt ? "Gere um link para o cliente enviar faturas, assinar LGPD e LOA." : "Generate a link for the client to upload bills, sign LGPD and LOA."}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">{isPt ? "Faturas" : "Bills"}</Label>
                <Input type="number" min={1} max={24} value={linkConfig.expectedBillsCount} onChange={(e) => setLinkConfig(prev => ({ ...prev, expectedBillsCount: parseInt(e.target.value) || 6 }))} className="h-7 text-xs" data-testid={`input-expected-bills-${trackId}`} />
              </div>
              <div className="flex items-center gap-1.5 pt-4">
                <Checkbox id={`lgpd-${trackId}`} checked={linkConfig.requireLGPD} onCheckedChange={(v) => setLinkConfig(prev => ({ ...prev, requireLGPD: !!v }))} data-testid={`checkbox-require-lgpd-${trackId}`} />
                <Label htmlFor={`lgpd-${trackId}`} className="text-xs cursor-pointer">LGPD</Label>
              </div>
              <div className="flex items-center gap-1.5 pt-4">
                <Checkbox id={`loa-${trackId}`} checked={linkConfig.requireLOA} onCheckedChange={(v) => setLinkConfig(prev => ({ ...prev, requireLOA: !!v }))} data-testid={`checkbox-require-loa-${trackId}`} />
                <Label htmlFor={`loa-${trackId}`} className="text-xs cursor-pointer">LOA</Label>
              </div>
              <div className="flex items-center gap-1.5 pt-4">
                <Checkbox id={`code-${trackId}`} checked={linkConfig.requireCode} onCheckedChange={(v) => setLinkConfig(prev => ({ ...prev, requireCode: !!v }))} data-testid={`checkbox-require-code-${trackId}`} />
                <Label htmlFor={`code-${trackId}`} className="text-xs cursor-pointer"><KeyRound className="w-3 h-3 inline mr-0.5" />{isPt ? "Código" : "Code"}</Label>
              </div>
            </div>
            <Button size="sm" onClick={() => generateLinkMutation.mutate()} disabled={generateLinkMutation.isPending} className="w-full" data-testid={`button-generate-intake-link-${trackId}`}>
              {generateLinkMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Link2 className="w-3 h-3 mr-1" />}
              {isPt ? "Gerar Link de Intake" : "Generate Intake Link"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showModal && linkData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid={`modal-intake-link-${trackId}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                {isPt ? "Link de Intake" : "Intake Link"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Link</Label>
                <div className="flex gap-2">
                  <Input value={portalUrl} readOnly className="text-xs h-8 font-mono" data-testid="input-modal-portal-url" />
                  <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={() => copyToClipboard(portalUrl, 'Link')} data-testid="button-modal-copy-link">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {linkData.accessCode && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{isPt ? "Código de Acesso" : "Access Code"}</Label>
                  <div className="flex gap-2 items-center">
                    <div className="bg-gray-100 rounded px-4 py-2 text-lg font-bold tracking-[6px] font-mono" data-testid="text-access-code">
                      {linkData.accessCode}
                    </div>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => copyToClipboard(linkData.accessCode!, isPt ? 'Código' : 'Code')} data-testid="button-modal-copy-code">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{isPt ? "Validade" : "Expiry"}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {expiresAt ? `Link expira em: ${expiresAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : (isPt ? 'Sem expiração definida' : 'No expiry set')}
                  </span>
                  {isExpiringSoon && (
                    <>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-[10px]" data-testid="badge-expiry-warning">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        {daysUntilExpiry! <= 0 ? 'Expirado' : `${daysUntilExpiry}d restantes`}
                      </Badge>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => extendExpiryMutation.mutate()} disabled={extendExpiryMutation.isPending} data-testid="button-extend-expiry">
                        {extendExpiryMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <TimerReset className="w-3 h-3 mr-0.5" />}
                        Estender +7 dias
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{isPt ? "Mensagem WhatsApp" : "WhatsApp Message"}</Label>
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto" data-testid="whatsapp-preview">
                  {whatsAppMessage}
                </div>
                <Button size="sm" variant="outline" className="w-full justify-center text-xs h-8" onClick={() => { copyToClipboard(whatsAppMessage, 'WhatsApp'); }} data-testid="button-modal-whatsapp">
                  <MessageCircle className="w-3.5 h-3.5 mr-2 text-green-600" />
                  {isPt ? "Copiar Mensagem WhatsApp" : "Copy WhatsApp Message"}
                </Button>
              </div>

              <div className="border-t pt-3 space-y-3">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  {isPt ? "Enviar Link de Intake" : "Send Intake Link"}
                </Label>

                {chaseActive ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2" data-testid="chase-active-state">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isPt ? "Link enviado" : "Link sent"}
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-[10px]">
                        {isPt ? "Chase ativo" : "Chase active"}
                      </Badge>
                    </div>

                    {!editingContact ? (
                      <div className="text-[10px] text-blue-700 space-y-0.5">
                        <p><strong>{isPt ? "Para" : "To"}:</strong> {chaseState.contactName || ''} ({chaseState.contactEmail})</p>
                        {chaseState.contactWhatsapp && <p><strong>WhatsApp:</strong> {chaseState.contactWhatsapp}</p>}
                        <p><strong>{isPt ? "Enviado em" : "Sent"}:</strong> {new Date(chaseState.lastSentAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                        <Button size="sm" variant="link" className="text-[10px] h-5 p-0 text-blue-600" onClick={() => { setEditContactName(chaseState.contactName || ''); setEditContactEmail(chaseState.contactEmail || ''); setEditContactWhatsapp(chaseState.contactWhatsapp || ''); setEditingContact(true); }} data-testid="button-edit-contact">
                          {isPt ? "Editar contato" : "Edit contact"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 bg-white/60 rounded p-2">
                        <Input value={editContactName} onChange={(e) => setEditContactName(e.target.value)} placeholder={isPt ? "Nome" : "Name"} className="text-xs h-6" data-testid="input-edit-contact-name" />
                        <Input type="email" value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)} placeholder="E-mail" className="text-xs h-6" data-testid="input-edit-contact-email" />
                        <Input value={editContactWhatsapp} onChange={(e) => setEditContactWhatsapp(e.target.value)} placeholder="WhatsApp +55..." className="text-xs h-6" data-testid="input-edit-contact-whatsapp" />
                        <div className="flex gap-1">
                          <Button size="sm" className="text-[10px] h-6 flex-1" onClick={() => updateContactMutation.mutate({ contactName: editContactName, contactEmail: editContactEmail, contactWhatsapp: editContactWhatsapp })} disabled={updateContactMutation.isPending} data-testid="button-save-contact">
                            {updateContactMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (isPt ? "Salvar" : "Save")}
                          </Button>
                          <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setEditingContact(false)} data-testid="button-cancel-edit">
                            {isPt ? "Cancelar" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button size="sm" variant="outline" className="text-xs h-7 w-full text-blue-700 border-blue-300" onClick={() => resendEmailMutation.mutate(undefined)} disabled={resendEmailMutation.isPending || resendCooldown > 0} data-testid="button-resend-email">
                      {resendEmailMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                      {resendCooldown > 0 ? `${isPt ? 'Aguarde' : 'Wait'} ${resendCooldown}s` : (isPt ? "Reenviar E-mail" : "Resend Email")}
                    </Button>

                    {(() => {
                      const sessionExpiresAt = intakeStatus?.session?.expiresAt ? new Date(intakeStatus.session.expiresAt) : null;
                      const sessionDaysLeft = sessionExpiresAt && !isNaN(sessionExpiresAt.getTime()) ? Math.ceil((sessionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                      if (!sessionExpiresAt) return null;
                      return (
                        <div className="text-[10px] text-blue-600 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{isPt ? 'Expira' : 'Expires'}: {sessionExpiresAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                          {sessionDaysLeft !== null && sessionDaysLeft <= 3 && (
                            <>
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-[10px] px-1 py-0">
                                {sessionDaysLeft <= 0 ? (isPt ? 'Expirado!' : 'Expired!') : `${sessionDaysLeft}d`}
                              </Badge>
                              <Button size="sm" variant="link" className="text-[10px] h-5 p-0 text-amber-700" onClick={() => extendExpiryMutation.mutate()} disabled={extendExpiryMutation.isPending} data-testid="button-extend-chase-expiry">
                                {extendExpiryMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : `+7 ${isPt ? 'dias' : 'days'}`}
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    <div className="border-t border-blue-200 pt-2 space-y-1.5">
                      <Label className="text-[10px] text-blue-600">{isPt ? "Motivo para parar" : "Stop reason"}</Label>
                      <Select value={stopReason} onValueChange={setStopReason}>
                        <SelectTrigger className="h-7 text-xs" data-testid="select-stop-reason">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual_override">{isPt ? "Parado manualmente" : "Manual override"}</SelectItem>
                          <SelectItem value="client_opt_out">{isPt ? "Cliente recusou" : "Client opt-out"}</SelectItem>
                          <SelectItem value="invalid_contact">{isPt ? "Contato inválido" : "Invalid contact"}</SelectItem>
                          <SelectItem value="lost_interest">{isPt ? "Perdeu interesse" : "Lost interest"}</SelectItem>
                          <SelectItem value="other">{isPt ? "Outro" : "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-300 hover:bg-red-50 w-full" onClick={() => stopChaseMutation.mutate()} disabled={stopChaseMutation.isPending} data-testid="button-stop-chase">
                        {stopChaseMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <StopCircle className="w-3 h-3 mr-1" />}
                        {isPt ? "Parar Chase" : "Stop Chase"}
                      </Button>
                    </div>

                    <div className="border-t border-blue-200 pt-2 space-y-1">
                      <Label className="text-[10px] text-blue-600 flex items-center gap-1">{isPt ? "Status Webhook" : "Webhook Status"}</Label>
                      <div className="text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">chase.start:</span>
                          {chaseState.webhookStartFired ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 border text-[9px] px-1 py-0">OK</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-[9px] px-1 py-0">{isPt ? 'Falhou' : 'Failed'}</Badge>
                          )}
                        </div>
                        {chaseState.webhookLastAttemptAt && (
                          <p className="text-[9px] text-blue-500">{isPt ? 'Última tentativa' : 'Last attempt'}: {new Date(chaseState.webhookLastAttemptAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                        )}
                        {chaseState.webhookLastError && (
                          <p className="text-[9px] text-red-500">{isPt ? 'Erro' : 'Error'}: {chaseState.webhookLastError}</p>
                        )}
                      </div>
                      {isAdmin && chaseState.webhookStartFired === false && (
                        <Button size="sm" variant="outline" className="text-[10px] h-6 w-full mt-1" onClick={() => retryWebhookMutation.mutate('start')} disabled={retryWebhookMutation.isPending} data-testid="button-retry-start-webhook">
                          {retryWebhookMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                          {isPt ? "Reenviar webhook start" : "Retry start webhook"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : chaseState && !chaseState.active ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2" data-testid="chase-stopped-state">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <StopCircle className="w-3.5 h-3.5" />
                        {isPt ? "Chase encerrado" : "Chase stopped"}
                      </div>
                      <Badge className="bg-gray-100 text-gray-700 border-gray-300 border text-[10px]">
                        {
                          { intake_complete: isPt ? 'Intake completo' : 'Intake complete',
                            manual_override: isPt ? 'Parado manualmente' : 'Manual override',
                            client_opt_out: isPt ? 'Cliente recusou' : 'Client opt-out',
                            invalid_contact: isPt ? 'Contato inválido' : 'Invalid contact',
                            lost_interest: isPt ? 'Perdeu interesse' : 'Lost interest',
                            other: isPt ? 'Outro' : 'Other',
                          }[chaseState.stoppedReason as string] || chaseState.stoppedReason
                        }
                      </Badge>
                    </div>
                    {chaseState.contactEmail && <p className="text-[10px] text-gray-500">{isPt ? "Enviado para" : "Sent to"}: {chaseState.contactEmail}</p>}
                    {chaseState.stoppedAt && <p className="text-[10px] text-gray-400">{isPt ? "Parado em" : "Stopped at"}: {new Date(chaseState.stoppedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>}

                    <div className="text-[10px] space-y-0.5 border-t border-gray-200 pt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">chase.stop webhook:</span>
                        {chaseState.webhookStopFired ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300 border text-[9px] px-1 py-0">OK</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-[9px] px-1 py-0">{isPt ? 'Falhou' : 'Failed'}</Badge>
                        )}
                      </div>
                      {chaseState.webhookLastError && !chaseState.webhookStopFired && (
                        <p className="text-[9px] text-red-500">{isPt ? 'Erro' : 'Error'}: {chaseState.webhookLastError}</p>
                      )}
                      {chaseState.webhookLastAttemptAt && (
                        <p className="text-[9px] text-gray-400">{isPt ? 'Última tentativa' : 'Last attempt'}: {new Date(chaseState.webhookLastAttemptAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                      )}
                    </div>

                    {isAdmin && chaseState.webhookStopFired === false && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 w-full" onClick={() => retryWebhookMutation.mutate('stop')} disabled={retryWebhookMutation.isPending} data-testid="button-retry-stop-webhook">
                        {retryWebhookMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        {isPt ? "Reenviar webhook stop" : "Retry stop webhook"}
                      </Button>
                    )}

                    {isAdmin && chaseState.stoppedReason !== 'intake_complete' && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 w-full text-blue-600 border-blue-300" onClick={() => restartChaseMutation.mutate()} disabled={restartChaseMutation.isPending} data-testid="button-restart-chase">
                        {restartChaseMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        {isPt ? "Reiniciar Chase (Admin)" : "Restart Chase (Admin)"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{isPt ? "Nome do contato" : "Contact name"}</Label>
                        <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="João Silva" className="text-xs h-7" data-testid="input-contact-name" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />E-mail *</Label>
                        <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@empresa.com" className="text-xs h-7" data-testid="input-contact-email" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />WhatsApp</Label>
                        <Input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="+5511999999999" className="text-xs h-7" data-testid="input-contact-whatsapp" />
                      </div>
                      <div className="flex items-center gap-1.5 pb-0.5">
                        <Checkbox id={`wa-optin-${trackId}`} checked={whatsappOptIn} onCheckedChange={(v) => setWhatsappOptIn(!!v)} data-testid="checkbox-whatsapp-optin" />
                        <Label htmlFor={`wa-optin-${trackId}`} className="text-[10px] cursor-pointer whitespace-nowrap">Opt-in WA</Label>
                      </div>
                    </div>
                    <Button size="sm" className="w-full text-xs h-8 bg-green-600 hover:bg-green-700" onClick={() => sendIntakeLinkMutation.mutate()} disabled={sendIntakeLinkMutation.isPending || !contactEmail} data-testid="button-send-intake-link">
                      {sendIntakeLinkMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      {isPt ? "ENVIAR LINK DE INTAKE" : "SEND INTAKE LINK"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 block">{isPt ? "Ações" : "Actions"}</Label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={markedSent ? "secondary" : "outline"} className="text-xs h-8" onClick={() => markSentMutation.mutate()} disabled={markSentMutation.isPending || markedSent} data-testid="button-mark-sent">
                    {markSentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : markedSent ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                    {markedSent ? (isPt ? 'Enviado' : 'Sent') : (isPt ? 'Marcar como Enviado (manual)' : 'Mark as Sent (manual)')}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => window.open(portalUrl, '_blank')} data-testid="button-modal-preview">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {isPt ? "Preview Link" : "Preview Link"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-8 text-orange-600" onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending} data-testid="button-modal-regenerate">
                    {regenerateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                    {isPt ? "Regenerar Link" : "Regenerate Link"}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-2 flex justify-end">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowModal(false)} data-testid="button-modal-close">
                  {isPt ? "Fechar" : "Close"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  NOT_READY: "bg-gray-100 text-gray-800 border-gray-300",
  READY: "bg-blue-100 text-blue-800 border-blue-300",
  SENT: "bg-amber-100 text-amber-800 border-amber-300",
  SIGNED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  DECLINED: "bg-red-100 text-red-800 border-red-300",
  EXPIRED: "bg-orange-100 text-orange-800 border-orange-300",
};

const CONTRACT_STATUS_LABELS: Record<string, { en: string; pt: string }> = {
  NOT_READY: { en: "Not Ready", pt: "Não Pronto" },
  READY: { en: "Ready", pt: "Pronto" },
  SENT: { en: "Sent", pt: "Enviado" },
  SIGNED: { en: "Signed", pt: "Assinado" },
  DECLINED: { en: "Declined", pt: "Recusado" },
  EXPIRED: { en: "Expired", pt: "Expirado" },
};

function ContractSection({ trackId, dealId, isPt }: { trackId: number; dealId: string; isPt: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadVersionLabel, setUploadVersionLabel] = useState("");
  const [uploadIsFinal, setUploadIsFinal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendName, setSendName] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState("");
  const [sendChannel, setSendChannel] = useState("email");
  const [signedFileName, setSignedFileName] = useState("");
  const [waLink, setWaLink] = useState<string | null>(null);
  const [waMessage, setWaMessage] = useState<string | null>(null);

  const { data: contractData, isLoading } = useQuery({
    queryKey: [`/api/tracks/${trackId}/contract`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tracks/${trackId}/contract`);
      return res.json();
    },
  });

  const contract = contractData?.contract;
  const supplierContracts: any[] = contractData?.supplierContracts || [];
  const signedContracts: any[] = contractData?.signedContracts || [];
  const finalContract = contractData?.finalContract;
  const status = contract?.status || "NOT_READY";

  const invalidateContract = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}/contract`] });
    queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/contracts/upload-supplier`, {
        fileName: uploadFileName,
        versionLabel: uploadVersionLabel || undefined,
        isFinal: uploadIsFinal,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Contrato do fornecedor enviado" : "Supplier contract uploaded" });
      setUploadFileName("");
      setUploadVersionLabel("");
      setUploadIsFinal(false);
      invalidateContract();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/contracts/send`, {
        clientName: sendName,
        clientEmail: sendEmail,
        clientWhatsapp: sendWhatsapp || undefined,
        channel: sendChannel,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: isPt ? "Contrato enviado ao cliente" : "Contract sent to client" });
      if (data.waLink) setWaLink(data.waLink);
      if (data.whatsappMessage) setWaMessage(data.whatsappMessage);
      invalidateContract();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const markSignedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tracks/${trackId}/contracts/mark-signed`, {
        signedFileName,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isPt ? "Contrato assinado registrado!" : "Signed contract recorded!" });
      setSignedFileName("");
      invalidateContract();
    },
    onError: (error: Error) => {
      toast({ title: isPt ? "Erro" : "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString(isPt ? "pt-BR" : "en-US", { timeZone: "America/Sao_Paulo" });
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30" data-testid={`contract-section-${trackId}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            {isPt ? "Contratos" : "Contracts"}
          </span>
          <Badge className={`${CONTRACT_STATUS_COLORS[status] || CONTRACT_STATUS_COLORS.NOT_READY} border text-xs`} data-testid={`badge-contract-status-${trackId}`}>
            {CONTRACT_STATUS_LABELS[status]?.[isPt ? "pt" : "en"] || status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {supplierContracts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{isPt ? "Contratos do Fornecedor" : "Supplier Contracts"}</p>
            <div className="space-y-1">
              {supplierContracts.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-2 text-xs p-1.5 rounded border bg-white" data-testid={`doc-supplier-contract-${doc.id}`}>
                  <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{doc.fileName}</span>
                  {doc.versionLabel && <Badge variant="outline" className="text-[10px] shrink-0">{doc.versionLabel}</Badge>}
                  {doc.isFinal && <Badge className="bg-green-100 text-green-800 border-green-300 border text-[10px] shrink-0">{isPt ? "Final" : "Final"}</Badge>}
                  <span className="text-muted-foreground ml-auto shrink-0">{new Date(doc.createdAt).toLocaleDateString(isPt ? "pt-BR" : "en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {signedContracts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{isPt ? "Contratos Assinados" : "Signed Contracts"}</p>
            <div className="space-y-1">
              {signedContracts.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-2 text-xs p-1.5 rounded border bg-white" data-testid={`doc-signed-contract-${doc.id}`}>
                  <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="truncate">{doc.fileName}</span>
                  {doc.signedAt && <span className="text-muted-foreground ml-auto shrink-0">{formatDate(doc.signedAt)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {contract?.sentAt && (
          <div className="text-xs space-y-0.5 p-2 rounded bg-white border">
            <p><span className="font-medium">{isPt ? "Enviado para:" : "Sent to:"}</span> {contract.clientName} ({contract.clientEmail})</p>
            {contract.clientWhatsapp && <p><span className="font-medium">WhatsApp:</span> {contract.clientWhatsapp}</p>}
            <p><span className="font-medium">{isPt ? "Enviado em:" : "Sent at:"}</span> {formatDate(contract.sentAt)}</p>
            {contract.signedAt && <p><span className="font-medium">{isPt ? "Assinado em:" : "Signed at:"}</span> {formatDate(contract.signedAt)}</p>}
          </div>
        )}

        <div className="space-y-3 border-t pt-3">
          <div>
            <p className="text-xs font-medium mb-1.5">{isPt ? "Enviar Contrato do Fornecedor" : "Upload Supplier Contract"}</p>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="space-y-1 flex-1 min-w-[150px]">
                <Label className="text-[10px]">{isPt ? "Nome do Arquivo" : "File Name"}</Label>
                <Input value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} placeholder="contrato_v1.pdf" className="h-7 text-xs" data-testid={`input-contract-filename-${trackId}`} />
              </div>
              <div className="space-y-1 min-w-[100px]">
                <Label className="text-[10px]">{isPt ? "Versão" : "Version"}</Label>
                <Input value={uploadVersionLabel} onChange={(e) => setUploadVersionLabel(e.target.value)} placeholder="v1" className="h-7 text-xs" data-testid={`input-contract-version-${trackId}`} />
              </div>
              <div className="flex items-center gap-1.5 pb-0.5">
                <Checkbox id={`final-${trackId}`} checked={uploadIsFinal} onCheckedChange={(v) => setUploadIsFinal(!!v)} data-testid={`checkbox-contract-final-${trackId}`} />
                <Label htmlFor={`final-${trackId}`} className="text-[10px] cursor-pointer whitespace-nowrap">Final</Label>
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={() => uploadMutation.mutate()} disabled={!uploadFileName || uploadMutation.isPending} data-testid={`button-upload-contract-${trackId}`}>
                {uploadMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                {isPt ? "Enviar" : "Upload"}
              </Button>
            </div>
          </div>

          {(status === 'READY' || status === 'SENT') && (
            <div>
              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700" onClick={() => {
                if (contract?.clientName) setSendName(contract.clientName);
                if (contract?.clientEmail) setSendEmail(contract.clientEmail);
                if (contract?.clientWhatsapp) setSendWhatsapp(contract.clientWhatsapp);
                setShowSendModal(true);
              }} data-testid={`button-send-contract-${trackId}`}>
                <Send className="w-3 h-3 mr-1" />
                {status === 'SENT' ? (isPt ? "Reenviar para o Cliente" : "Resend to Client") : (isPt ? "Enviar para o Cliente" : "Send to Client")}
              </Button>
            </div>
          )}

          {(status === 'SENT' || status === 'READY') && (
            <div>
              <p className="text-xs font-medium mb-1.5">{isPt ? "Enviar Contrato Assinado (Manual)" : "Upload Signed Contract (Manual)"}</p>
              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <Input value={signedFileName} onChange={(e) => setSignedFileName(e.target.value)} placeholder="contrato_assinado.pdf" className="h-7 text-xs" data-testid={`input-signed-filename-${trackId}`} />
                </div>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => markSignedMutation.mutate()} disabled={!signedFileName || markSignedMutation.isPending} data-testid={`button-mark-signed-${trackId}`}>
                  {markSignedMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {isPt ? "Marcar Assinado" : "Mark Signed"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {showSendModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowSendModal(false)}>
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isPt ? "Enviar Contrato para Assinatura" : "Send Contract for Signature"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isPt ? "Nome do Cliente" : "Client Name"}</Label>
                  <Input value={sendName} onChange={(e) => setSendName(e.target.value)} placeholder="João Silva" className="h-8 text-sm" data-testid="input-send-name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder="cliente@empresa.com" type="email" className="h-8 text-sm" data-testid="input-send-email" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp</Label>
                  <Input value={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.value)} placeholder="+5511999999999" className="h-8 text-sm" data-testid="input-send-whatsapp" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isPt ? "Canal" : "Channel"}</Label>
                  <Select value={sendChannel} onValueChange={setSendChannel}>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-send-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="both">{isPt ? "Ambos" : "Both"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {waLink && (
                  <div className="p-2 rounded bg-green-50 border border-green-200 space-y-1">
                    <p className="text-xs font-medium text-green-800">{isPt ? "Link WhatsApp gerado:" : "WhatsApp link generated:"}</p>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 underline break-all" data-testid="link-whatsapp">{waLink}</a>
                    {waMessage && (
                      <div className="mt-1">
                        <p className="text-[10px] text-muted-foreground">{isPt ? "Mensagem:" : "Message:"}</p>
                        <p className="text-xs text-gray-600 whitespace-pre-line">{waMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowSendModal(false); setWaLink(null); setWaMessage(null); }} data-testid="button-cancel-send">
                    {isPt ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => sendMutation.mutate()} disabled={!sendName || !sendEmail || sendMutation.isPending} data-testid="button-confirm-send">
                    {sendMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    {isPt ? "Enviar" : "Send"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
