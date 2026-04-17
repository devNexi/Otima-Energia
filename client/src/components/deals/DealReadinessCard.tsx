import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  FileText,
  BarChart3,
  FolderOpen,
  Send,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";

interface DealReadinessCardProps {
  dealId: string;
  onTabChange?: (tab: string) => void;
}

const PIPELINE_STAGES = [
  {
    key: "BILL_UPLOADED",
    icon: FileText,
    labelPt: "Fatura",
    labelEn: "Bill",
    tab: "assembly",
  },
  {
    key: "ECOS_GENERATED",
    icon: BarChart3,
    labelPt: "ECOS",
    labelEn: "ECOS",
    tab: "ecos",
  },
  {
    key: "DOSSIER_DRAFT",
    icon: FolderOpen,
    labelPt: "Dossiê",
    labelEn: "Dossier",
    tab: "assembly",
  },
  {
    key: "RFQ_SENT",
    icon: Send,
    labelPt: "RFQ",
    labelEn: "RFQ",
    tab: "rfq",
  },
] as const;

type PipelineStageKey = (typeof PIPELINE_STAGES)[number]["key"];

function StageIcon({ status }: { status: string }) {
  if (status === "complete") {
    return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  }
  if (status === "blocked") {
    return <XCircle className="w-5 h-5 text-red-400" />;
  }
  if (status === "in_progress") {
    return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />;
  }
  return <Circle className="w-5 h-5 text-slate-300" />;
}

function statusColor(status: string): string {
  if (status === "complete") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "blocked") return "text-red-700 bg-red-50 border-red-200";
  if (status === "in_progress") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-400 bg-slate-50 border-slate-200";
}

function statusLabel(status: string, isPt: boolean): string {
  if (status === "complete") return isPt ? "Completo" : "Complete";
  if (status === "blocked") return isPt ? "Bloqueado" : "Blocked";
  if (status === "in_progress") return isPt ? "Em andamento" : "In progress";
  return isPt ? "Pendente" : "Pending";
}

function connectorColor(prevStatus: string, currStatus: string): string {
  if (prevStatus === "complete") return "bg-emerald-300";
  return "bg-slate-200";
}

export function DealReadinessCard({ dealId, onTabChange }: DealReadinessCardProps) {
  const { language } = useI18n();
  const isPt = language === "pt";
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/assembly-status`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/assembly-status`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 px-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {isPt ? "Verificando prontidão..." : "Checking readiness..."}
      </div>
    );
  }

  if (!data || !data.stages) return null;

  const stageMap = new Map<string, any>(
    (data.stages as any[]).map((s: any) => [s.stage, s])
  );

  const pipelineStatuses = PIPELINE_STAGES.map((ps) => {
    const stageData = stageMap.get(ps.key);
    return {
      ...ps,
      status: stageData?.status || "not_started",
      blockers: stageData?.blockers || [],
      actionButtonPt: stageData?.actionButtonPt || null,
      actionButtonEn: stageData?.actionButtonEn || null,
      actionDeepLink: stageData?.actionDeepLink || null,
      completedAt: stageData?.completedAt || null,
    };
  });

  const completedCount = pipelineStatuses.filter((s) => s.status === "complete").length;
  const blockedStage = pipelineStatuses.find((s) => s.status === "blocked");
  const nextActionStage = pipelineStatuses.find(
    (s) => s.status === "in_progress" || s.status === "not_started"
  );

  const overallPct = Math.round((completedCount / PIPELINE_STAGES.length) * 100);

  function handleAction(stage: typeof pipelineStatuses[0]) {
    if (stage.actionDeepLink) {
      const tabMatch = stage.actionDeepLink.match(/[?&]tab=([^&]+)/);
      const tabFromLink = tabMatch?.[1];
      if (tabFromLink && onTabChange) {
        onTabChange(tabFromLink);
        return;
      }
      if (stage.actionDeepLink.startsWith("/")) {
        navigate(stage.actionDeepLink);
        return;
      }
    }
    if (onTabChange) {
      onTabChange(stage.tab);
    }
  }

  return (
    <div
      className="rounded-xl border bg-white shadow-sm overflow-hidden mb-4"
      data-testid="card-deal-readiness"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {isPt ? "Jornada Bill-First" : "Bill-First Journey"}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${
              completedCount === PIPELINE_STAGES.length
                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                : blockedStage
                ? "border-red-300 text-red-700 bg-red-50"
                : "border-amber-300 text-amber-700 bg-amber-50"
            }`}
            data-testid="badge-readiness-status"
          >
            {completedCount === PIPELINE_STAGES.length
              ? isPt ? "Pronto para proposta" : "Ready for proposal"
              : blockedStage
              ? isPt ? "Bloqueado" : "Blocked"
              : `${completedCount}/${PIPELINE_STAGES.length} ${isPt ? "concluídos" : "complete"}`}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="w-28 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallPct === 100
                  ? "bg-emerald-500"
                  : blockedStage
                  ? "bg-red-400"
                  : "bg-amber-400"
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{overallPct}%</span>
        </div>
      </div>

      {/* Stage steps */}
      <div className="flex items-stretch px-5 py-4 gap-0" data-testid="readiness-pipeline">
        {pipelineStatuses.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = stage.status === "in_progress" || stage.status === "blocked";
          const isLast = idx === pipelineStatuses.length - 1;
          const prevStatus = idx > 0 ? pipelineStatuses[idx - 1].status : "complete";

          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              {/* Stage block */}
              <div
                className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 px-1 py-1 rounded-lg cursor-pointer transition-colors ${
                  isActive ? "bg-slate-50" : "hover:bg-slate-50/50"
                }`}
                onClick={() => {
                  if (onTabChange) onTabChange(stage.tab);
                }}
                data-testid={`stage-${stage.key}`}
              >
                <StageIcon status={stage.status} />

                <div className="text-center">
                  <div
                    className={`text-xs font-semibold ${
                      stage.status === "complete"
                        ? "text-emerald-700"
                        : stage.status === "blocked"
                        ? "text-red-600"
                        : stage.status === "in_progress"
                        ? "text-amber-700"
                        : "text-slate-400"
                    }`}
                  >
                    {isPt ? stage.labelPt : stage.labelEn}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      stage.status === "complete"
                        ? "text-emerald-500"
                        : stage.status === "blocked"
                        ? "text-red-400"
                        : stage.status === "in_progress"
                        ? "text-amber-500"
                        : "text-slate-300"
                    }`}
                  >
                    {statusLabel(stage.status, isPt)}
                  </div>
                </div>

                {/* CTA button for current/blocked stage */}
                {(stage.status === "in_progress" || stage.status === "blocked") &&
                  (stage.actionButtonPt || stage.actionButtonEn) && (
                    <Button
                      size="sm"
                      variant={stage.status === "blocked" ? "destructive" : "default"}
                      className="h-6 text-[10px] px-2 mt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(stage);
                      }}
                      data-testid={`button-action-${stage.key}`}
                    >
                      {isPt ? stage.actionButtonPt : stage.actionButtonEn}
                    </Button>
                  )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={`h-0.5 w-6 shrink-0 mx-1 rounded ${connectorColor(prevStatus, stage.status)}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Blocker banner */}
      {blockedStage && blockedStage.blockers.length > 0 && (
        <div
          className="mx-5 mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
          data-testid="banner-blocker"
        >
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700">
              {isPt
                ? blockedStage.blockers[0].titlePt
                : blockedStage.blockers[0].titleEn}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {isPt
                ? blockedStage.blockers[0].descriptionPt
                : blockedStage.blockers[0].descriptionEn}
            </p>
          </div>
          {blockedStage.actionDeepLink && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 shrink-0"
              onClick={() => handleAction(blockedStage)}
              data-testid="button-resolve-blocker"
            >
              {isPt ? "Resolver" : "Resolve"}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Next step hint (when not blocked and not all complete) */}
      {!blockedStage && nextActionStage && completedCount < PIPELINE_STAGES.length && (
        <div
          className="mx-5 mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200"
          data-testid="banner-next-step"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <p className="text-xs text-blue-700 flex-1">
            {isPt ? "Próximo passo: " : "Next step: "}
            <strong>{isPt ? nextActionStage.labelPt : nextActionStage.labelEn}</strong>
            {nextActionStage.actionButtonPt && (
              <> — {isPt ? nextActionStage.actionButtonPt : nextActionStage.actionButtonEn}</>
            )}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2 text-blue-700 hover:bg-blue-100 shrink-0"
            onClick={() => handleAction(nextActionStage)}
            data-testid="button-next-step"
          >
            {isPt ? "Ir" : "Go"}
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
