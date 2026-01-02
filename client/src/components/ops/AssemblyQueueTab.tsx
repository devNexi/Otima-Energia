import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { 
  Loader2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Filter,
  Target,
  Building2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const ASSEMBLY_STAGES = [
  'ORIGIN_QUALIFICATION',
  'DOSSIER_DRAFT',
  'DOSSIER_LOCKED',
  'RFQ_SENT',
  'QUOTES_RECEIVED',
  'QUOTE_SELECTED',
  'PROPOSAL_GENERATED',
  'ONBOARDING',
  'CONTRACT_SIGNED',
  'SUPPLY_LIVE'
] as const;

const STAGE_LABELS: Record<string, { pt: string; en: string }> = {
  ORIGIN_QUALIFICATION: { pt: 'Origem & Qualificação', en: 'Origin & Qualification' },
  DOSSIER_DRAFT: { pt: 'Dossiê do Cliente', en: 'Client Dossier' },
  DOSSIER_LOCKED: { pt: 'Dossiê Travado', en: 'Dossier Locked' },
  RFQ_SENT: { pt: 'RFQ Enviado', en: 'RFQ Sent' },
  QUOTES_RECEIVED: { pt: 'Cotações Recebidas', en: 'Quotes Received' },
  QUOTE_SELECTED: { pt: 'Cotação Selecionada', en: 'Quote Selected' },
  PROPOSAL_GENERATED: { pt: 'Proposta Gerada', en: 'Proposal Generated' },
  ONBOARDING: { pt: 'Onboarding (Docs)', en: 'Onboarding (Docs)' },
  CONTRACT_SIGNED: { pt: 'Contrato Assinado', en: 'Contract Signed' },
  SUPPLY_LIVE: { pt: 'Fornecimento Ativo', en: 'Supply Live' }
};

interface AssemblyQueueTabProps {
  onSelectDeal?: (dealId: string) => void;
}

export function AssemblyQueueTab({ onSelectDeal }: AssemblyQueueTabProps) {
  const { language } = useI18n();
  const isPt = language === "pt";
  
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [needsActionToday, setNeedsActionToday] = useState(false);
  const [myDealsOnly, setMyDealsOnly] = useState(false);

  const queryParams = new URLSearchParams();
  if (stageFilter && stageFilter !== "all") queryParams.set("stage", stageFilter);
  if (blockedOnly) queryParams.set("blockedOnly", "true");
  if (needsActionToday) queryParams.set("needsActionToday", "true");
  if (myDealsOnly) queryParams.set("myDeals", "true");

  const { data: queueData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/deals/assembly-queue", stageFilter, blockedOnly, needsActionToday, myDealsOnly],
    queryFn: async () => {
      const res = await fetch(`/api/deals/assembly-queue?${queryParams.toString()}`);
      return res.json();
    },
    refetchInterval: 60000
  });

  const queue = queueData?.queue || [];

  const handleSelectDeal = (dealId: string) => {
    if (onSelectDeal) {
      onSelectDeal(dealId);
    }
  };

  const getStageColor = (stage: string) => {
    const earlyStages = ['ORIGIN_QUALIFICATION', 'DOSSIER_DRAFT', 'DOSSIER_LOCKED'];
    const midStages = ['RFQ_SENT', 'QUOTES_RECEIVED', 'QUOTE_SELECTED', 'PROPOSAL_GENERATED'];
    const lateStages = ['ONBOARDING', 'CONTRACT_SIGNED', 'SUPPLY_LIVE'];
    
    if (earlyStages.includes(stage)) return "bg-blue-100 text-blue-800 border-blue-200";
    if (midStages.includes(stage)) return "bg-purple-100 text-purple-800 border-purple-200";
    if (lateStages.includes(stage)) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {isPt ? "Fila de Montagem" : "Assembly Queue"}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
              {isPt ? "Atualizar" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                {isPt ? "Etapa" : "Stage"}
              </Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-stage-filter">
                  <SelectValue placeholder={isPt ? "Todas as etapas" : "All stages"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isPt ? "Todas as etapas" : "All stages"}</SelectItem>
                  {ASSEMBLY_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {isPt ? STAGE_LABELS[stage].pt : STAGE_LABELS[stage].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="blocked" 
                checked={blockedOnly} 
                onCheckedChange={(c) => setBlockedOnly(!!c)}
                data-testid="checkbox-blocked-only"
              />
              <Label htmlFor="blocked" className="text-sm cursor-pointer">
                {isPt ? "Apenas bloqueados" : "Blocked only"}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="action-today" 
                checked={needsActionToday} 
                onCheckedChange={(c) => setNeedsActionToday(!!c)}
                data-testid="checkbox-needs-action"
              />
              <Label htmlFor="action-today" className="text-sm cursor-pointer">
                {isPt ? "Precisa ação (1+ dia)" : "Needs action (1+ day)"}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="my-deals" 
                checked={myDealsOnly} 
                onCheckedChange={(c) => setMyDealsOnly(!!c)}
                data-testid="checkbox-my-deals"
              />
              <Label htmlFor="my-deals" className="text-sm cursor-pointer">
                {isPt ? "Meus negócios" : "My deals"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : queue.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{isPt ? "Nenhum negócio encontrado com esses filtros" : "No deals found with these filters"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((item: any) => (
            <Card 
              key={item.dealId}
              className={cn(
                "cursor-pointer hover:border-primary/50 transition-colors",
                item.isBlocked && "border-red-300 bg-red-50/50"
              )}
              onClick={() => handleSelectDeal(item.dealId)}
              data-testid={`queue-item-${item.dealId}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        item.isBlocked ? "bg-red-100" : "bg-blue-100"
                      )}>
                        {item.isBlocked ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">
                        {item.deal?.title || item.client?.companyName || `Deal ${item.dealId.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {item.client?.companyName && (
                          <span>{item.client.companyName}</span>
                        )}
                        {item.idleSinceDays >= 1 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            {item.idleSinceDays} {isPt ? "dias" : "days"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={getStageColor(item.currentStage)}
                    >
                      {isPt 
                        ? STAGE_LABELS[item.currentStage]?.pt || item.currentStage
                        : STAGE_LABELS[item.currentStage]?.en || item.currentStage
                      }
                    </Badge>
                    
                    {item.isBlocked && (
                      <Badge variant="destructive" className="text-xs">
                        {item.blockerCount} {isPt ? "bloqueador(es)" : "blocker(s)"}
                      </Badge>
                    )}

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                {item.nextStep && (
                  <div className="mt-3 pt-3 border-t text-sm">
                    <span className="text-muted-foreground">
                      {isPt ? "Próximo:" : "Next:"}
                    </span>{" "}
                    <span className="font-medium">
                      {isPt ? item.nextStep.actionPt : item.nextStep.actionEn}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        {isPt 
          ? `${queue.length} negócio(s) na fila`
          : `${queue.length} deal(s) in queue`
        }
      </div>
    </div>
  );
}
