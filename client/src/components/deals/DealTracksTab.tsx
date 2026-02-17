import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import {
  TRACK_STATUS_TRANSITIONS,
  GDL_TRACK_STATUSES,
  ACL_TRACK_STATUSES,
  ACR_TRACK_STATUSES,
  OTHER_TRACK_STATUSES,
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
} from "lucide-react";

interface DealTracksTabProps {
  dealId: string;
}

const TRACK_TYPE_LABELS: Record<string, { en: string; pt: string }> = {
  GDL: { en: "GDL - Distributed Generation", pt: "GDL - Geração Distribuída Local" },
  ACL: { en: "ACL - Free Market", pt: "ACL - Ambiente de Contratação Livre" },
  ACR: { en: "ACR - Regulated Market", pt: "ACR - Ambiente de Contratação Regulado" },
  OTHER: { en: "Other", pt: "Outro" },
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  GDL: "bg-green-100 text-green-800 border-green-300",
  ACL: "bg-blue-100 text-blue-800 border-blue-300",
  ACR: "bg-purple-100 text-purple-800 border-purple-300",
  OTHER: "bg-gray-100 text-gray-800 border-gray-300",
};

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

export function DealTracksTab({ dealId }: DealTracksTabProps) {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const isPt = language === "pt";

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTrackType, setNewTrackType] = useState("");
  const [newPartnerName, setNewPartnerName] = useState("");
  const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null);

  const { data: tracksData, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/tracks`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/tracks`);
      return res.json();
    },
  });

  const tracks: any[] = Array.isArray(tracksData) ? tracksData : [];

  const createTrackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/tracks`, {
        type: newTrackType,
        partnerName: newPartnerName || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: isPt ? "Track criada" : "Track created",
        description: isPt ? "A track foi adicionada com sucesso." : "The track was added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/tracks`] });
      setAddDialogOpen(false);
      setNewTrackType("");
      setNewPartnerName("");
    },
    onError: (error: Error) => {
      toast({
        title: isPt ? "Erro" : "Error",
        description: error.message,
        variant: "destructive",
      });
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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-track">
              <Plus className="w-4 h-4 mr-2" />
              {isPt ? "Adicionar Track" : "Add Track"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isPt ? "Nova Track" : "New Track"}</DialogTitle>
              <DialogDescription>
                {isPt
                  ? "Selecione o tipo de track e opcionalmente defina um parceiro"
                  : "Select the track type and optionally set a partner"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isPt ? "Tipo de Track *" : "Track Type *"}</Label>
                <Select value={newTrackType} onValueChange={setNewTrackType}>
                  <SelectTrigger data-testid="select-track-type">
                    <SelectValue placeholder={isPt ? "Selecione o tipo" : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GDL">{TRACK_TYPE_LABELS.GDL[isPt ? "pt" : "en"]}</SelectItem>
                    <SelectItem value="ACL">{TRACK_TYPE_LABELS.ACL[isPt ? "pt" : "en"]}</SelectItem>
                    <SelectItem value="ACR">{TRACK_TYPE_LABELS.ACR[isPt ? "pt" : "en"]}</SelectItem>
                    <SelectItem value="OTHER">{TRACK_TYPE_LABELS.OTHER[isPt ? "pt" : "en"]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isPt ? "Nome do Parceiro (opcional)" : "Partner Name (optional)"}</Label>
                <Input
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder={isPt ? "Ex: Solar Prime" : "Ex: Solar Prime"}
                  data-testid="input-partner-name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {isPt ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                onClick={() => createTrackMutation.mutate()}
                disabled={!newTrackType || createTrackMutation.isPending}
                data-testid="button-submit-track"
              >
                {createTrackMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPt ? "Criar Track" : "Create Track"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tracks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{isPt ? "Nenhuma track criada ainda" : "No tracks created yet"}</p>
            <p className="text-xs mt-1">
              {isPt
                ? "Adicione uma track para gerenciar uma trilha de contratação"
                : "Add a track to manage a contracting path"}
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
}: {
  track: any;
  dealId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { language } = useI18n();
  const isPt = language === "pt";

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
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {track.partnerName && (
              <span data-testid={`text-partner-${track.id}`}>
                {isPt ? "Parceiro" : "Partner"}: {track.partnerName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(track.createdAt).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
            </span>
          </div>
        </div>
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

  const { data: trackDetail, isLoading } = useQuery({
    queryKey: [`/api/tracks/${trackId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tracks/${trackId}`);
      return res.json();
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const res = await apiRequest("PATCH", `/api/tracks/${trackId}/status`, {
        status: nextStatus,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: isPt ? "Status atualizado" : "Status updated",
        description: isPt ? "A track foi avançada com sucesso." : "The track was advanced successfully.",
      });
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
      toast({
        title: isPt ? "Metadados atualizados" : "Metadata updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tracks/${trackId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: isPt ? "Erro" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const track = trackDetail?.track;
  const events: any[] = trackDetail?.events || [];
  const documents: any[] = trackDetail?.documents || [];
  const currentStatus = track?.status || "";
  const allowedTransitions = TRACK_STATUS_TRANSITIONS[currentStatus] || [];

  return (
    <div className="space-y-6 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {isPt ? "Status Atual" : "Current Status"}
          </p>
          <p className="text-lg font-semibold">{formatStatus(currentStatus)}</p>
        </div>
        {allowedTransitions.length > 0 && (
          <div className="flex gap-2">
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

      {trackType === "GDL" && (
        <GDLEligibilityChecklist
          metadata={track?.metadata || {}}
          onUpdate={(eligibility: any) =>
            metadataMutation.mutate({ ...track?.metadata, eligibility })
          }
          isPending={metadataMutation.isPending}
        />
      )}

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

      {documents.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {isPt ? "Documentos" : "Documents"}
          </h4>
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 text-sm p-2 rounded border"
                data-testid={`document-${doc.id}`}
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>{doc.fileName || doc.documentType}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(doc.createdAt).toLocaleDateString(isPt ? "pt-BR" : "en-US")}
                </span>
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
    {
      key: "hasDistributor",
      label: isPt ? "Distribuidora definida" : "Distributor defined",
    },
    {
      key: "hasCCEEProfile",
      label: isPt ? "Perfil CCEE cadastrado" : "CCEE profile registered",
    },
    {
      key: "monthlyDemandKw",
      label: isPt ? "Demanda mensal (kW) informada" : "Monthly demand (kW) informed",
    },
    {
      key: "voltageLevel",
      label: isPt ? "Nível de tensão definido" : "Voltage level defined",
    },
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
              <Label
                htmlFor={`eligibility-${item.key}`}
                className="text-sm cursor-pointer"
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
