import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import {
  Phone,
  ClipboardList,
  StickyNote,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
  MessageSquarePlus,
  Trash2,
  Loader2,
  Calendar,
  Mail,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SalesMirrorPanelProps {
  dealId: string;
  zohoLeadId?: string | null;
}

function RelativeTime({ date, language }: { date: string | null; language: string }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  let relative = "";
  if (diffDays > 30) {
    relative = language === "pt" ? `${Math.floor(diffDays / 30)} mês(es) atrás` : `${Math.floor(diffDays / 30)} month(s) ago`;
  } else if (diffDays > 0) {
    relative = language === "pt" ? `${diffDays} dia(s) atrás` : `${diffDays} day(s) ago`;
  } else if (diffHours > 0) {
    relative = language === "pt" ? `${diffHours} hora(s) atrás` : `${diffHours} hour(s) ago`;
  } else {
    relative = language === "pt" ? "agora" : "just now";
  }

  return (
    <span title={d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} className="text-sm">
      {relative}
    </span>
  );
}

const activityTypeIcons: Record<string, typeof Phone> = {
  CALL: Phone,
  TASK: ClipboardList,
  NOTE: StickyNote,
  MEETING: Users,
  EMAIL: Mail,
};

const activityTypeBadgeColors: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-800",
  TASK: "bg-purple-100 text-purple-800",
  NOTE: "bg-yellow-100 text-yellow-800",
  MEETING: "bg-green-100 text-green-800",
  EMAIL: "bg-pink-100 text-pink-800",
};

export function SalesMirrorPanel({ dealId, zohoLeadId }: SalesMirrorPanelProps) {
  const { language } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [activityExpanded, setActivityExpanded] = useState(false);

  const { data: snapshotData, isLoading: snapshotLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/sales-snapshot`],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/sales-snapshot`);
      return res.json();
    },
    enabled: !!zohoLeadId,
  });

  const { data: activityData } = useQuery({
    queryKey: [`/api/deals/${dealId}/sales-activity`],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/sales-activity?limit=10`);
      return res.json();
    },
    enabled: !!zohoLeadId,
  });

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/internal-notes`],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/internal-notes`);
      return res.json();
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/sales-snapshot/refresh`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "pt" ? "Atualização solicitada" : "Refresh requested",
        description: language === "pt" ? "O snapshot será atualizado em breve." : "Snapshot will be updated shortly.",
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/sales-snapshot`] });
      }, 5000);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const sessionId = localStorage.getItem("sessionId") || "";
      const res = await fetch(`/api/deals/${dealId}/internal-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sessionId },
        body: JSON.stringify({ note }),
      });
      return res.json();
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/internal-notes`] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const sessionId = localStorage.getItem("sessionId") || "";
      const res = await fetch(`/api/deals/${dealId}/internal-notes/${noteId}`, {
        method: "DELETE",
        headers: { "x-session-id": sessionId },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/internal-notes`] });
    },
  });

  const snapshot = snapshotData?.snapshot;
  const crmLink = snapshotData?.crmLink;
  const noActivityWarning = snapshotData?.noActivityWarning;
  const zohoDeepLink = snapshotData?.zohoDeepLink;
  const activityItems = activityData?.items || [];
  const notes = notesData?.notes || [];

  if (!zohoLeadId) {
    return (
      <div className="space-y-4">
        <InternalNotesSection
          notes={notes}
          notesLoading={notesLoading}
          noteText={noteText}
          setNoteText={setNoteText}
          addNoteMutation={addNoteMutation}
          deleteNoteMutation={deleteNoteMutation}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card data-testid="panel-sales-snapshot">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              {language === "pt" ? "Painel de Vendas" : "Sales Snapshot"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {zohoDeepLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open(zohoDeepLink, "_blank")}
                  data-testid="button-open-zoho"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {language === "pt" ? "Abrir no Zoho" : "Open in Zoho"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                data-testid="button-refresh-snapshot"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {snapshotLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {noActivityWarning && (
                <div
                  className="flex items-center gap-2 p-2 mb-3 rounded bg-orange-50 border border-orange-200 text-orange-800 text-xs"
                  data-testid="warning-no-activity"
                >
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {language === "pt"
                    ? "Nenhuma atividade de vendas registrada nos últimos 10 dias."
                    : "No sales activity logged in the last 10 days."}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {language === "pt" ? "Último contato" : "Last contact"}
                  </span>
                  <RelativeTime date={snapshot?.lastContactAt} language={language} />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {language === "pt" ? "Próxima tarefa" : "Next task"}
                  </span>
                  {snapshot?.nextTaskAt ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        {new Date(snapshot.nextTaskAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          snapshot.nextTaskStatus === "OVERDUE"
                            ? "bg-red-100 text-red-800 border-red-300 text-[10px]"
                            : snapshot.nextTaskStatus === "UPCOMING"
                            ? "bg-blue-100 text-blue-800 border-blue-300 text-[10px]"
                            : "bg-gray-100 text-gray-800 border-gray-300 text-[10px]"
                        }
                        data-testid="badge-task-status"
                      >
                        {snapshot.nextTaskStatus}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {language === "pt" ? "Chamadas" : "Calls"}
                  </span>
                  <span className="font-medium" data-testid="text-total-calls">{snapshot?.totalCalls || 0}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {language === "pt" ? "Notas" : "Notes"}
                  </span>
                  <span className="font-medium" data-testid="text-total-notes">{snapshot?.totalNotes || 0}</span>
                </div>
              </div>

              {snapshot?.lastSyncAt && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {language === "pt" ? "Sincronizado" : "Synced"}: {new Date(snapshot.lastSyncAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </p>
              )}
              {!snapshot && (
                <p className="text-xs text-muted-foreground mt-2">
                  {language === "pt" ? "Nenhum dado de vendas sincronizado ainda." : "No sales data synced yet."}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {activityItems.length > 0 && (
        <Card data-testid="panel-sales-activity">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                {language === "pt" ? "Atividade de Vendas" : "Sales Activity"}
                <Badge variant="secondary" className="text-[10px]">{activityItems.length}</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setActivityExpanded(!activityExpanded)}
              >
                {activityExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {activityExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {activityItems.map((item: any) => {
                  const Icon = activityTypeIcons[item.activityType] || ClipboardList;
                  const badgeColor = activityTypeBadgeColors[item.activityType] || "bg-gray-100 text-gray-800";
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50" data-testid={`activity-item-${item.id}`}>
                      <div className={`p-1.5 rounded ${badgeColor}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${badgeColor} text-[10px]`}>{item.activityType}</Badge>
                          {item.occurredAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.occurredAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                            </span>
                          )}
                        </div>
                        {item.title && <p className="text-sm font-medium mt-0.5 line-clamp-1">{item.title}</p>}
                        {item.summary && <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>}
                      </div>
                      {item.url && (
                        <Button variant="ghost" size="sm" className="h-6 flex-shrink-0" onClick={() => window.open(item.url, "_blank")}>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <InternalNotesSection
        notes={notes}
        notesLoading={notesLoading}
        noteText={noteText}
        setNoteText={setNoteText}
        addNoteMutation={addNoteMutation}
        deleteNoteMutation={deleteNoteMutation}
        language={language}
      />
    </div>
  );
}

function InternalNotesSection({
  notes,
  notesLoading,
  noteText,
  setNoteText,
  addNoteMutation,
  deleteNoteMutation,
  language,
}: {
  notes: any[];
  notesLoading: boolean;
  noteText: string;
  setNoteText: (v: string) => void;
  addNoteMutation: any;
  deleteNoteMutation: any;
  language: string;
}) {
  return (
    <Card data-testid="panel-internal-notes">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-yellow-600" />
          {language === "pt" ? "Notas Internas" : "Internal Notes"}
          <Badge variant="secondary" className="text-[10px]">{notes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 mb-3">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={language === "pt" ? "Adicionar nota..." : "Add note..."}
            className="text-sm min-h-[60px] resize-none"
            data-testid="textarea-internal-note"
          />
          <Button
            variant="default"
            size="sm"
            className="h-auto self-end"
            disabled={!noteText.trim() || addNoteMutation.isPending}
            onClick={() => addNoteMutation.mutate(noteText.trim())}
            data-testid="button-add-note"
          >
            {addNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
          </Button>
        </div>

        {notesLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {language === "pt" ? "Nenhuma nota ainda." : "No notes yet."}
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notes.map((n: any) => (
              <div key={n.id} className="group flex items-start gap-2 p-2 rounded border bg-muted/30" data-testid={`note-${n.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {n.authorUserId} &middot; {new Date(n.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => deleteNoteMutation.mutate(n.id)}
                  data-testid={`button-delete-note-${n.id}`}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
