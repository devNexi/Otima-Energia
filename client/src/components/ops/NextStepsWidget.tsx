import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ArrowRight,
  FileText,
  Send,
  Users,
  ClipboardCheck,
  Zap,
  Building2,
  Clock
} from "lucide-react";

interface NextStepsWidgetProps {
  dealId: string;
  currentStage: string;
  onActionClick?: (action: string) => void;
}

interface NextStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  action?: string;
  actionLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGE_NEXT_STEPS: Record<string, (checklistStatus: any) => NextStep[]> = {
  DRAFT: (status) => [
    {
      id: "upload_bill",
      label: "Upload Client Bill",
      description: "Upload the client's energy bill (fatura) to start the Bill-First journey.",
      required: true,
      completed: status?.billComplete ?? false,
      action: "open_dossier",
      actionLabel: "Go to Assembly",
      icon: FileText
    },
    {
      id: "generate_ecos",
      label: "Generate ECOS Analysis",
      description: "Run the ECOS analysis to benchmark the client's current tariff against market prices.",
      required: true,
      completed: status?.ecosComplete ?? false,
      action: "open_ecos",
      actionLabel: "Generate ECOS",
      icon: Zap
    },
    {
      id: "complete_dossier",
      label: "Complete Client Dossier",
      description: "Confirm client profile data (consumption, demand, tariff group) is ready for RFQ.",
      required: true,
      completed: status?.dossierComplete ?? false,
      action: "open_dossier",
      actionLabel: "Open Dossier",
      icon: ClipboardCheck
    },
    {
      id: "send_rfq",
      label: "Send RFQ to Suppliers",
      description: "Dispatch the Request for Quote to eligible suppliers to collect offers.",
      required: true,
      completed: status?.rfqSent ?? false,
      action: "select_suppliers",
      actionLabel: "Send RFQ",
      icon: Send
    }
  ],
  RFQ_SENT: (status) => [
    {
      id: "track_responses",
      label: "Track Supplier Responses",
      description: "Monitor which suppliers have responded and follow up with those who haven't.",
      required: false,
      completed: status?.allResponded ?? false,
      action: "view_rfqs",
      actionLabel: "View RFQs",
      icon: Send
    },
    {
      id: "follow_up",
      label: "Follow Up on Pending RFQs",
      description: "Contact suppliers who haven't responded within SLA window.",
      required: false,
      completed: status?.followUpsDone ?? true,
      action: "send_followup",
      actionLabel: "Send Follow-up",
      icon: Clock
    }
  ],
  QUOTES_RECEIVED: (status) => [
    {
      id: "compare_quotes",
      label: "Compare All Quotes",
      description: "Review and compare all received quotes using the comparison matrix.",
      required: true,
      completed: status?.quotesCompared ?? false,
      action: "compare_quotes",
      actionLabel: "Compare Quotes",
      icon: ClipboardCheck
    },
    {
      id: "verify_terms",
      label: "Verify Quote Terms",
      description: "Check all quote terms match client requirements (take-or-pay, flex, price structure).",
      required: true,
      completed: status?.termsVerified ?? false,
      action: "verify_terms",
      actionLabel: "Verify Terms",
      icon: CheckCircle2
    },
    {
      id: "get_approval",
      label: "Get Client Approval",
      description: "Present options to client and get approval on selected offer.",
      required: true,
      completed: status?.clientApproved ?? false,
      action: "client_approval",
      actionLabel: "Request Approval",
      icon: Users
    }
  ],
  OFFER_SELECTED: (status) => [
    {
      id: "finalize_contract",
      label: "Finalize Contract Terms",
      description: "Work with supplier to finalize all contract terms and conditions.",
      required: true,
      completed: status?.contractFinalized ?? false,
      action: "finalize_contract",
      actionLabel: "Finalize Contract",
      icon: FileText
    },
    {
      id: "collect_docs",
      label: "Collect Required Documents",
      description: "Gather all client documents required by the supplier for contract execution.",
      required: true,
      completed: status?.docsCollected ?? false,
      action: "collect_docs",
      actionLabel: "View Documents",
      icon: ClipboardCheck
    },
    {
      id: "compliance_check",
      label: "Complete Compliance Check",
      description: "Run compliance verification on all parties and contract terms.",
      required: true,
      completed: status?.complianceComplete ?? false,
      action: "run_compliance",
      actionLabel: "Run Compliance",
      icon: AlertTriangle
    }
  ],
  CONTRACT_SIGNED: (status) => [
    {
      id: "submit_to_ccee",
      label: "Submit to CCEE",
      description: "Submit contract to CCEE for registration and energy supply allocation.",
      required: true,
      completed: status?.cceeSubmitted ?? false,
      action: "submit_ccee",
      actionLabel: "Submit to CCEE",
      icon: Send
    },
    {
      id: "set_supply_date",
      label: "Confirm Supply Start Date",
      description: "Confirm the energy supply start date with all parties.",
      required: true,
      completed: status?.supplyDateSet ?? false,
      action: "set_date",
      actionLabel: "Confirm Date",
      icon: Clock
    }
  ],
  SUPPLY_LIVE: (status) => [
    {
      id: "verify_supply",
      label: "Verify Supply Started",
      description: "Confirm energy supply has started and consumption is being recorded.",
      required: true,
      completed: status?.supplyVerified ?? false,
      action: "verify_supply",
      actionLabel: "Verify Supply",
      icon: Zap
    },
    {
      id: "setup_commission",
      label: "Set Up Commission Tracking",
      description: "Configure commission calculations and tracking for this deal.",
      required: true,
      completed: status?.commissionSetup ?? false,
      action: "setup_commission",
      actionLabel: "Setup Commission",
      icon: Building2
    }
  ],
  COMMISSION_ACTIVE: (status) => [
    {
      id: "monitor_payments",
      label: "Monitor Commission Payments",
      description: "Track incoming commission payments and reconcile with expected amounts.",
      required: false,
      completed: status?.paymentsMonitored ?? true,
      action: "view_commissions",
      actionLabel: "View Commissions",
      icon: Building2
    },
    {
      id: "handle_variances",
      label: "Handle Any Variances",
      description: "Review and resolve any discrepancies between expected and actual commissions.",
      required: false,
      completed: status?.variancesHandled ?? true,
      action: "view_variances",
      actionLabel: "View Variances",
      icon: AlertTriangle
    }
  ],
  CONTRACT_ENDED: (status) => [
    {
      id: "final_reconciliation",
      label: "Final Commission Reconciliation",
      description: "Complete final reconciliation of all commission payments.",
      required: true,
      completed: status?.finalReconciled ?? false,
      action: "reconcile",
      actionLabel: "Reconcile",
      icon: ClipboardCheck
    },
    {
      id: "renewal_assessment",
      label: "Assess Renewal Opportunity",
      description: "Evaluate if client should be contacted for contract renewal.",
      required: false,
      completed: status?.renewalAssessed ?? false,
      action: "assess_renewal",
      actionLabel: "Assess Renewal",
      icon: Users
    }
  ],
  CLOSED: () => []
};

export function NextStepsWidget({ dealId, currentStage, onActionClick }: NextStepsWidgetProps) {
  const { data: checklistData, isLoading: checklistLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/checklist`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/checklist`);
      return res.json();
    }
  });

  // For DRAFT deals, use real assembly-status to determine step completion
  const { data: assemblyData, isLoading: assemblyLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/assembly-status`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/assembly-status`);
      return res.json();
    },
    enabled: currentStage === "DRAFT",
  });

  const isLoading = checklistLoading || (currentStage === "DRAFT" && assemblyLoading);

  const getSteps = STAGE_NEXT_STEPS[currentStage];
  if (!getSteps) return null;

  const blockingItems = checklistData?.blockingItems || [];

  // Build DRAFT completion from actual assembly-status stage data
  const assemblyStageDone = (key: string) => {
    if (!assemblyData?.stages) return false;
    const stage = (assemblyData.stages as any[]).find((s: any) => s.stage === key);
    return stage?.status === "complete";
  };

  const completionStatus: Record<string, boolean> = currentStage === "DRAFT"
    ? {
        billComplete: assemblyStageDone("BILL"),
        ecosComplete: assemblyStageDone("ECOS"),
        dossierComplete: assemblyStageDone("DOSSIER"),
        rfqSent: assemblyStageDone("RFQ"),
      }
    : {
        allResponded: false,
        followUpsDone: true,
        quotesCompared: false,
        termsVerified: false,
        clientApproved: false,
        contractFinalized: false,
        docsCollected: false,
        complianceComplete: blockingItems.length === 0,
        cceeSubmitted: false,
        supplyDateSet: false,
        supplyVerified: false,
        commissionSetup: false,
        paymentsMonitored: true,
        variancesHandled: true,
        finalReconciled: false,
        renewalAssessed: false,
      };

  const steps = getSteps(completionStatus);
  const requiredSteps = steps.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => s.completed).length;
  const progress = requiredSteps.length > 0 
    ? Math.round((completedRequired / requiredSteps.length) * 100) 
    : 100;

  const canTransition = requiredSteps.every(s => s.completed);

  if (steps.length === 0) return null;

  return (
    <Card data-testid="next-steps-widget">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Next Steps
          </CardTitle>
          {requiredSteps.length > 0 && (
            <Badge 
              variant={canTransition ? "default" : "secondary"}
              className={canTransition ? "bg-green-100 text-green-800" : ""}
            >
              {completedRequired}/{requiredSteps.length} Complete
            </Badge>
          )}
        </div>
        {requiredSteps.length > 0 && (
          <Progress value={progress} className="h-2 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div 
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                step.completed 
                  ? "bg-green-50 border-green-200" 
                  : step.required 
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-muted/50 border-muted"
              }`}
              data-testid={`next-step-${step.id}`}
            >
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : step.required ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm font-medium ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                    {step.label}
                  </span>
                  {step.required && !step.completed && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
                {step.action && !step.completed && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto mt-2 text-xs"
                    onClick={() => onActionClick?.(step.action!)}
                    data-testid={`action-${step.action}`}
                  >
                    {step.actionLabel} →
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {!canTransition && requiredSteps.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Cannot advance stage</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Complete all required steps above before transitioning to the next stage.
            </p>
          </div>
        )}

        {canTransition && requiredSteps.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Ready to advance</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              All required steps are complete. You can transition to the next stage.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function useWorkflowGates(dealId: string, currentStage: string) {
  const { data: checklistData, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/checklist`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/deals/${dealId}/checklist`);
      return res.json();
    }
  });

  const apiBlockers = checklistData?.blockingItems || [];
  
  return {
    canTransition: apiBlockers.length === 0,
    blockingItems: apiBlockers.map((b: any) => b.content || b.label || "Required item incomplete"),
    isLoading
  };
}
