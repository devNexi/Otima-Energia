import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lock,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface ChecklistItem {
  id: number;
  itemKey: string;
  label: string;
  description?: string;
  helpText?: string;
  isBlocking: boolean;
  requiresEvidence: boolean;
  sortOrder: number;
}

interface ChecklistCompletion {
  id: number;
  dealId: string;
  checklistItemId: number;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  evidenceUrl?: string;
}

interface Checklist {
  id: number;
  dealStage: string;
  name: string;
  description?: string;
  sortOrder: number;
}

interface ChecklistDrawerProps {
  dealId: string;
  dealStage: string;
  onBlockersChange?: (hasBlockers: boolean) => void;
}

export function ChecklistDrawer({
  dealId,
  dealStage,
  onBlockersChange,
}: ChecklistDrawerProps) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data: checklistData, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/checklist`],
    enabled: open,
  });

  const { data: blockersData } = useQuery({
    queryKey: [`/api/deals/${dealId}/blocker-check`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/blocker-check`);
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({
      itemId,
      notes,
    }: {
      itemId: number;
      notes?: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/deals/${dealId}/checklist/${itemId}/complete`,
        { notes }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/deals/${dealId}/checklist`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/deals/${dealId}/blocker-check`],
      });
    },
  });

  const checklists: Checklist[] = checklistData?.checklists || [];
  const completions: ChecklistCompletion[] = checklistData?.completions || [];
  const blockers = blockersData?.blockers || [];
  const hasBlockers = blockers.length > 0;

  const getCompletionForItem = (itemId: number): ChecklistCompletion | undefined => {
    return completions.find((c) => c.checklistItemId === itemId);
  };

  const isItemCompleted = (itemId: number): boolean => {
    const completion = getCompletionForItem(itemId);
    return completion?.isCompleted || false;
  };

  const handleComplete = async (item: ChecklistItem) => {
    if (isItemCompleted(item.id)) return;
    
    await completeMutation.mutateAsync({
      itemId: item.id,
      notes: noteText[item.id],
    });
    
    setNoteText((prev) => ({ ...prev, [item.id]: "" }));
  };

  const items = checklistData?.items || {};
  const totalItems = checklists.reduce((acc, cl) => {
    return acc + ((items as Record<number, any[]>)[cl.id]?.length || 0);
  }, 0);

  const allItemIds = Object.values(items as Record<number, any[]>).flat().map((item: any) => item.id);
  const completedCount = completions.filter((c) => c.isCompleted && allItemIds.includes(c.checklistItemId)).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            hasBlockers && "border-amber-500 text-amber-600"
          )}
          data-testid="button-open-checklist"
        >
          <ClipboardCheck className="h-4 w-4" />
          Checklist
          {hasBlockers && (
            <Badge variant="destructive" className="ml-1 h-5 px-1.5">
              {blockers.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Checklist - {dealStage}
          </SheetTitle>
          <SheetDescription>
            Complete os itens obrigatórios antes de avançar o deal.
          </SheetDescription>
        </SheetHeader>

        {hasBlockers && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              {blockers.length} item(s) bloqueando transição
            </div>
            <ul className="space-y-1 text-sm text-amber-600 dark:text-amber-400">
              {blockers.map((b: any) => (
                <li key={b.itemKey} className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {b.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum checklist configurado para este estágio.
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={checklists.map((c) => c.id.toString())}>
              {checklists.map((checklist) => {
                const checklistItems: ChecklistItem[] = (items as Record<number, ChecklistItem[]>)[checklist.id] || [];
                const checklistCompletions = completions.filter(
                  (c) => checklistItems.some((item) => item.id === c.checklistItemId)
                );
                const checklistCompleted = checklistItems.every((item) =>
                  isItemCompleted(item.id)
                );

                return (
                  <AccordionItem key={checklist.id} value={checklist.id.toString()}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        {checklistCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{checklist.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {checklistCompletions.filter((c) => c.isCompleted).length}/
                          {checklistItems.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {checklistItems.map((item) => {
                          const completed = isItemCompleted(item.id);
                          const completion = getCompletionForItem(item.id);

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "p-3 rounded-lg border transition-colors",
                                completed
                                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                  : item.isBlocking
                                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                  : "bg-muted/30"
                              )}
                              data-testid={`checklist-item-${item.itemKey}`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={completed}
                                  onCheckedChange={() => handleComplete(item)}
                                  disabled={completed || completeMutation.isPending}
                                  className="mt-0.5"
                                  data-testid={`checkbox-${item.itemKey}`}
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "font-medium text-sm",
                                        completed && "line-through text-muted-foreground"
                                      )}
                                    >
                                      {item.label}
                                    </span>
                                    {item.isBlocking && !completed && (
                                      <Badge variant="destructive" className="text-xs h-5">
                                        Obrigatório
                                      </Badge>
                                    )}
                                    {item.helpText && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            {item.helpText}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}

                                  {completed && completion && (
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                                      Completado em{" "}
                                      {new Date(completion.completedAt!).toLocaleDateString("pt-BR")}
                                      {completion.notes && (
                                        <span className="block mt-1 text-muted-foreground">
                                          Nota: {completion.notes}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {!completed && (
                                    <div className="mt-2 space-y-2">
                                      <Textarea
                                        placeholder="Adicionar nota (opcional)..."
                                        className="text-xs h-16 resize-none"
                                        value={noteText[item.id] || ""}
                                        onChange={(e) =>
                                          setNoteText((prev) => ({
                                            ...prev,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                        data-testid={`textarea-note-${item.itemKey}`}
                                      />
                                      {item.requiresEvidence && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-1 text-xs"
                                        >
                                          <Upload className="h-3 w-3" />
                                          Anexar evidência
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso total:</span>
            <span className="font-medium">
              {completedCount}/{totalItems} completos
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: totalItems > 0 ? `${(completedCount / totalItems) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function BlockerAlert({
  dealId,
  targetStage,
  onCanTransition,
}: {
  dealId: string;
  targetStage: string;
  onCanTransition?: (can: boolean) => void;
}) {
  const { data } = useQuery({
    queryKey: [`/api/deals/${dealId}/blocker-check`, { targetStage }],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/deals/${dealId}/blocker-check?targetStage=${targetStage}`
      );
      return res.json();
    },
  });

  const canTransition = data?.canTransition ?? true;
  const blockers = data?.blockers || [];

  if (canTransition) {
    return null;
  }

  return (
    <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-2">
        <Lock className="h-4 w-4" />
        Não é possível avançar para {targetStage}
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
        Complete os seguintes itens obrigatórios:
      </p>
      <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
        {blockers.map((b: any) => (
          <li key={b.itemKey} className="flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{b.label}</span>
              {b.helpText && (
                <p className="text-xs text-red-500 dark:text-red-400/80 mt-0.5">
                  {b.helpText}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
