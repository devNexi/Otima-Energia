import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  PhoneCall,
  Mail,
  MessageSquare,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaybookStep {
  order: number;
  action: string;
  description: string;
  dueHours?: number;
}

interface Playbook {
  id: number;
  scenarioKey: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  applicableStages: string[];
  actionSteps: PlaybookStep[];
  escalationPath?: {
    afterHours: number;
    escalateTo: string;
    method: string;
  };
}

const severityConfig = {
  LOW: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: Lightbulb,
  },
  MEDIUM: {
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: AlertCircle,
  },
  HIGH: {
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: AlertTriangle,
  },
  CRITICAL: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    borderColor: "border-red-200 dark:border-red-800",
    icon: AlertTriangle,
  },
};

interface PlaybookCoachProps {
  dealStage: string;
  triggeredScenario?: string;
  compact?: boolean;
}

export function PlaybookCoach({
  dealStage,
  triggeredScenario,
  compact = false,
}: PlaybookCoachProps) {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [expandedPlaybooks, setExpandedPlaybooks] = useState<Set<number>>(new Set());

  const { data } = useQuery<{ success: boolean; playbooks: Playbook[] }>({
    queryKey: ["/api/playbooks", { stage: dealStage, scenarioKey: triggeredScenario }],
  });

  const playbooks = data?.playbooks || [];

  const toggleExpanded = (id: number) => {
    setExpandedPlaybooks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (playbooks.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {playbooks.slice(0, 3).map((playbook) => {
          const config = severityConfig[playbook.severity];
          const Icon = config.icon;

          return (
            <button
              key={playbook.id}
              onClick={() => setSelectedPlaybook(playbook)}
              className={cn(
                "w-full p-2 rounded-lg border text-left transition-colors hover:bg-muted/50",
                config.borderColor
              )}
              data-testid={`playbook-card-${playbook.scenarioKey}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{playbook.title}</span>
                <Badge variant="outline" className={cn("ml-auto text-xs", config.color)}>
                  {playbook.severity}
                </Badge>
              </div>
            </button>
          );
        })}

        <PlaybookDetailDialog
          playbook={selectedPlaybook}
          open={!!selectedPlaybook}
          onOpenChange={(open) => !open && setSelectedPlaybook(null)}
        />
      </div>
    );
  }

  return (
    <Card data-testid="playbook-coach">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Playbook Coach
        </CardTitle>
        <CardDescription>
          Cenários comuns e como resolvê-los
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {playbooks.map((playbook) => {
          const config = severityConfig[playbook.severity];
          const Icon = config.icon;
          const isExpanded = expandedPlaybooks.has(playbook.id);

          return (
            <Collapsible
              key={playbook.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(playbook.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    config.borderColor,
                    isExpanded && "bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={cn(
                        "h-5 w-5 mt-0.5",
                        playbook.severity === "CRITICAL" && "text-red-500",
                        playbook.severity === "HIGH" && "text-orange-500",
                        playbook.severity === "MEDIUM" && "text-amber-500",
                        playbook.severity === "LOW" && "text-blue-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{playbook.title}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs shrink-0", config.color)}
                        >
                          {playbook.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {playbook.description}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 ml-8 space-y-2 border-l-2 pl-4 border-muted">
                  {playbook.actionSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-medium shrink-0">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                        {step.dueHours && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Fazer em até {step.dueHours < 1 ? `${step.dueHours * 60} min` : `${step.dueHours}h`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {playbook.escalationPath && (
                    <div className="pt-2 mt-2 border-t border-dashed">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        <span>
                          Escalar para {playbook.escalationPath.escalateTo} após{" "}
                          {playbook.escalationPath.afterHours}h sem resolução
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PlaybookDetailDialog({
  playbook,
  open,
  onOpenChange,
}: {
  playbook: Playbook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!playbook) return null;

  const config = severityConfig[playbook.severity];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-5 w-5",
                playbook.severity === "CRITICAL" && "text-red-500",
                playbook.severity === "HIGH" && "text-orange-500",
                playbook.severity === "MEDIUM" && "text-amber-500",
                playbook.severity === "LOW" && "text-blue-500"
              )}
            />
            <DialogTitle>{playbook.title}</DialogTitle>
            <Badge variant="outline" className={cn("ml-auto", config.color)}>
              {playbook.severity}
            </Badge>
          </div>
          <DialogDescription className="text-left">
            {playbook.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Passos para resolver
          </h4>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {playbook.actionSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    {step.order}
                  </div>
                  <div className="flex-1 pb-4 border-b last:border-0">
                    <p className="font-medium text-sm">{step.action}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    {step.dueHours && (
                      <div className="flex items-center gap-1 mt-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          {step.dueHours < 1
                            ? `${step.dueHours * 60} minutos`
                            : `${step.dueHours} hora${step.dueHours > 1 ? "s" : ""}`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {playbook.escalationPath && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Escalação
              </div>
              <p className="text-sm text-muted-foreground">
                Se não resolver em{" "}
                <span className="font-medium">{playbook.escalationPath.afterHours} horas</span>,
                escalar para{" "}
                <span className="font-medium">{playbook.escalationPath.escalateTo}</span> via{" "}
                <span className="font-medium">{playbook.escalationPath.method}</span>.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SuggestedPlaybook({
  scenarioKey,
  onDismiss,
}: {
  scenarioKey: string;
  onDismiss?: () => void;
}) {
  const { data } = useQuery<{ success: boolean; playbook: Playbook }>({
    queryKey: [`/api/playbooks/${scenarioKey}`],
  });

  const playbook = data?.playbook;

  if (!playbook) return null;

  const config = severityConfig[playbook.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        config.borderColor,
        "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20"
      )}
      data-testid={`suggested-playbook-${scenarioKey}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Lightbulb className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">Dica: {playbook.title}</span>
            <Badge variant="outline" className={cn("text-xs", config.color)}>
              {playbook.severity}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{playbook.description}</p>
          
          <div className="space-y-2">
            {playbook.actionSteps.slice(0, 3).map((step) => (
              <div key={step.order} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{step.action}</span>
              </div>
            ))}
            {playbook.actionSteps.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{playbook.actionSteps.length - 3} mais passos
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onDismiss}
          >
            Dispensar
          </Button>
        )}
      </div>
    </div>
  );
}
