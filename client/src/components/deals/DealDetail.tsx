import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { DealCasesTab } from "@/components/commission-os/DealCasesTab";
import { ComplianceChecklistTab } from "@/components/commission-os/ComplianceChecklistTab";
import { NextActionWidget } from "@/components/widgets/NextActionWidget";
import { BlindAuctionPanel } from "@/components/deals/BlindAuctionPanel";
import { DealEcosTab } from "@/components/deals/DealEcosTab";
import { DealProposalsTab } from "@/components/deals/DealProposalsTab";
import { DealAssemblyTab } from "@/components/deals/DealAssemblyTab";
import { DealTracksTab } from "@/components/deals/DealTracksTab";
import { SetClientPriceModal } from "@/components/deals/SetClientPriceModal";
import { ContextualTooltip } from "@/components/ops/ContextualTooltip";
import { ChecklistDrawer } from "@/components/ops/ChecklistDrawer";
import { NextStepsWidget, useWorkflowGates } from "@/components/ops/NextStepsWidget";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Building2, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  History,
  User,
  Zap,
  Receipt,
  Upload,
  Check,
  X,
  Briefcase,
  Shield,
  ShieldCheck,
  Send,
  BarChart3,
  GitBranch
} from "lucide-react";

const DEAL_STATES = [
  'DRAFT',
  'RFQ_SENT',
  'QUOTES_RECEIVED',
  'OFFER_SELECTED',
  'CONTRACT_SIGNED',
  'SUPPLY_LIVE',
  'COMMISSION_ACTIVE',
  'CONTRACT_ENDED',
  'CLOSED'
] as const;

type DealState = typeof DEAL_STATES[number];

const stateColors: Record<DealState, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
  RFQ_SENT: "bg-blue-100 text-blue-800 border-blue-300",
  QUOTES_RECEIVED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  OFFER_SELECTED: "bg-purple-100 text-purple-800 border-purple-300",
  CONTRACT_SIGNED: "bg-amber-100 text-amber-800 border-amber-300",
  SUPPLY_LIVE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  COMMISSION_ACTIVE: "bg-green-100 text-green-800 border-green-300",
  CONTRACT_ENDED: "bg-orange-100 text-orange-800 border-orange-300",
  CLOSED: "bg-slate-100 text-slate-800 border-slate-300"
};

const stateLabels: Record<DealState, { en: string; pt: string }> = {
  DRAFT: { en: "Draft", pt: "Rascunho" },
  RFQ_SENT: { en: "RFQ Sent", pt: "RFQ Enviado" },
  QUOTES_RECEIVED: { en: "Quotes Received", pt: "Cotações Recebidas" },
  OFFER_SELECTED: { en: "Offer Selected", pt: "Oferta Selecionada" },
  CONTRACT_SIGNED: { en: "Contract Signed", pt: "Contrato Assinado" },
  SUPPLY_LIVE: { en: "Supply Live", pt: "Fornecimento Ativo" },
  COMMISSION_ACTIVE: { en: "Commission Active", pt: "Comissão Ativa" },
  CONTRACT_ENDED: { en: "Contract Ended", pt: "Contrato Encerrado" },
  CLOSED: { en: "Closed", pt: "Fechado" }
};

interface DealDetailProps {
  dealId: string;
  onBack: () => void;
}

export function DealDetail({ dealId, onBack }: DealDetailProps) {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [clientPriceQuote, setClientPriceQuote] = useState<any>(null);
  const [clientPriceModalOpen, setClientPriceModalOpen] = useState(false);
  const [transitionForm, setTransitionForm] = useState({
    reason: "",
    notes: ""
  });
  
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceType: "MILESTONE_1" as "MILESTONE_1" | "MILESTONE_2" | "ADJUSTMENT" | "MONTHLY" | "QUARTERLY" | "FINAL",
    grossAmountBrl: "",
    paymentTrigger: "",
    dueDate: "",
    serviceDescription: "",
    notes: ""
  });

  const { data: dealData, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}`],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}`);
      return res.json();
    }
  });

  const { data: transitionsData } = useQuery({
    queryKey: [`/api/deals/${dealId}/transitions`],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/transitions`);
      return res.json();
    }
  });

  const transitionMutation = useMutation({
    mutationFn: async (data: { toState: string; reason: string; notes?: string }) => {
      const res = await fetch(`/api/deals/${dealId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          triggeredBy: "admin",
          triggeredByType: "user"
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: language === "pt" ? "Status atualizado" : "Status updated",
          description: language === "pt" ? "O deal foi movido para o próximo estado." : "The deal was moved to the next state."
        });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/transitions`] });
        queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
        setTransitionDialogOpen(false);
        setTransitionForm({ reason: "", notes: "" });
      } else {
        toast({
          title: language === "pt" ? "Erro" : "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    }
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      dealId: string;
      supplierId: number | null;
      clientId: number | null;
      invoiceType: string;
      grossAmountBrl: string;
      paymentTrigger: string;
      dueDate: string;
      serviceDescription: string;
      notes: string;
    }) => {
      const sessionId = localStorage.getItem("sessionId") || "";
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.id) {
        toast({
          title: language === "pt" ? "Fatura criada" : "Invoice created",
          description: language === "pt" 
            ? `Fatura ${data.invoiceNumber} criada com sucesso.` 
            : `Invoice ${data.invoiceNumber} created successfully.`
        });
        setInvoiceDialogOpen(false);
        setInvoiceForm({
          invoiceType: "MILESTONE_1",
          grossAmountBrl: "",
          paymentTrigger: "",
          dueDate: "",
          serviceDescription: "",
          notes: ""
        });
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      } else {
        toast({
          title: language === "pt" ? "Erro" : "Error",
          description: data.error || "Failed to create invoice",
          variant: "destructive"
        });
      }
    }
  });

  const deal = dealData?.deal;
  const validTransitions = transitionsData?.validTransitions || [];
  const currentState = transitionsData?.currentState;
  
  const { canTransition, blockingItems, isLoading: gatesLoading } = useWorkflowGates(
    dealId, 
    deal?.status || 'DRAFT'
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{language === "pt" ? "Deal não encontrado" : "Deal not found"}</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === "pt" ? "Voltar" : "Back"}
        </Button>
      </div>
    );
  }

  const handleTransition = (toState: string) => {
    if (!transitionForm.reason) {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" ? "Motivo é obrigatório" : "Reason is required",
        variant: "destructive"
      });
      return;
    }
    transitionMutation.mutate({
      toState,
      reason: transitionForm.reason,
      notes: transitionForm.notes
    });
  };

  const getStateIndex = (state: string) => DEAL_STATES.indexOf(state as DealState);

  const handleCreateInvoice = () => {
    if (!invoiceForm.grossAmountBrl || !invoiceForm.dueDate || !invoiceForm.paymentTrigger) {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" 
          ? "Valor, vencimento e gatilho são obrigatórios" 
          : "Amount, due date and trigger are required",
        variant: "destructive"
      });
      return;
    }
    createInvoiceMutation.mutate({
      dealId: deal.id,
      supplierId: deal.supplierId || null,
      clientId: deal.clientId || null,
      invoiceType: invoiceForm.invoiceType,
      grossAmountBrl: invoiceForm.grossAmountBrl,
      paymentTrigger: invoiceForm.paymentTrigger,
      dueDate: invoiceForm.dueDate,
      serviceDescription: invoiceForm.serviceDescription || `Comissão - ${deal.client?.companyName || "Cliente"}`,
      notes: invoiceForm.notes
    });
  };

  const openInvoiceDialog = () => {
    const defaultAmount = deal.expectedCommissionMonthly 
      ? parseFloat(deal.expectedCommissionMonthly).toFixed(2)
      : "";
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    
    setInvoiceForm({
      invoiceType: deal.commissionPaymentType === "monthly" ? "MONTHLY" : "MILESTONE_1",
      grossAmountBrl: defaultAmount,
      paymentTrigger: "",
      dueDate: defaultDueDate.toISOString().split("T")[0],
      serviceDescription: `Comissão de intermediação - ${deal.client?.companyName || "Cliente"}`,
      notes: ""
    });
    setInvoiceDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="deal-detail">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === "pt" ? "Voltar" : "Back"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {deal.client?.companyName || `Client #${deal.clientId}`}
            </h1>
            <p className="text-sm text-gray-500">Deal ID: {deal.id.substring(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deal.zohoLeadId && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-300 border text-sm px-3 py-1" data-testid="badge-zoho-source">
              <Zap className="w-3 h-3 mr-1" />
              {language === "pt" ? "Via Zoho" : "Via Zoho"}
            </Badge>
          )}
          <Badge className={`${stateColors[deal.status as DealState]} border text-lg px-4 py-2`} data-testid="badge-deal-status">
            {stateLabels[deal.status as DealState][language as "en" | "pt"]}
          </Badge>
        </div>
      </div>

      {/* Zoho Origin Banner - Read-only notice */}
      {deal.zohoLeadId && (
        <div 
          className="bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-300 rounded-lg p-4 flex items-center gap-3"
          data-testid="banner-zoho-origin"
        >
          <div className="bg-orange-200 p-2 rounded-full">
            <Zap className="w-5 h-5 text-orange-700" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-orange-900">
              {language === "pt" 
                ? "Originado do Zoho CRM • Controle operacional no Ótima Portal" 
                : "Originated from Zoho CRM • Operational control lives in Ótima Portal"}
            </p>
            <p className="text-sm text-orange-700">
              {language === "pt"
                ? "Dados do lead são somente leitura. Todas as alterações de estado e documentos são gerenciadas aqui."
                : "Lead data is read-only. All state changes and documents are managed here."}
            </p>
          </div>
        </div>
      )}

      {/* Zoho Lead Summary Panel */}
      {deal.zohoLeadId && (
        <Card className="bg-orange-50 border-orange-200" data-testid="panel-zoho-lead-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {language === "pt" ? "Resumo do Lead (Zoho)" : "Lead Summary (Zoho)"}
            </CardTitle>
            <CardDescription className="text-xs text-orange-700">
              {language === "pt" ? "Dados recebidos da qualificação automática - não editável" : "Data received from automatic qualification - read-only"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "ID do Lead" : "Lead ID"}</span>
                <span className="font-mono text-xs" data-testid="text-zoho-lead-id">{deal.zohoLeadId}</span>
              </div>
              <div>
                <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Resultado" : "Outcome"}</span>
                <Badge 
                  variant="outline" 
                  className={
                    deal.zohoLeadOutcome === "Hotkey" 
                      ? "bg-green-100 text-green-800 border-green-300" 
                      : deal.zohoLeadOutcome === "Warm" 
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                        : "bg-gray-100 text-gray-800 border-gray-300"
                  }
                  data-testid="badge-zoho-outcome"
                >
                  {deal.zohoLeadOutcome || "Unknown"}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Agente" : "Agent"}</span>
                <span data-testid="text-zoho-agent">{deal.zohoLeadSourceAgent || "Unknown"}</span>
              </div>
              <div>
                <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Mercado" : "Market"}</span>
                <span data-testid="text-zoho-market">{deal.brMarket || "Unknown"} / {language === "pt" ? "Grupo" : "Group"} {deal.brGroup || "?"}</span>
              </div>
              {deal.dmName && (
                <div>
                  <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Decisor" : "Decision Maker"}</span>
                  <span data-testid="text-zoho-dm-name">{deal.dmName} {deal.dmRole ? `(${deal.dmRole})` : ""}</span>
                </div>
              )}
              {deal.dmDirectPhone && (
                <div>
                  <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Telefone Decisor" : "DM Phone"}</span>
                  <span data-testid="text-zoho-dm-phone">{deal.dmDirectPhone}</span>
                </div>
              )}
              {deal.dmAvailability && (
                <div>
                  <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Disponibilidade" : "Availability"}</span>
                  <span className="text-xs" data-testid="text-zoho-dm-availability">{deal.dmAvailability}</span>
                </div>
              )}
              {deal.zohoCallbackAt && (
                <div>
                  <span className="text-xs text-orange-700 font-medium block">{language === "pt" ? "Callback Agendado" : "Callback Scheduled"}</span>
                  <span className="text-xs" data-testid="text-zoho-callback">{new Date(deal.zohoCallbackAt).toLocaleString()}</span>
                </div>
              )}
            </div>
            {deal.zohoQuickNote && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <span className="text-xs text-orange-700 font-medium block mb-1">{language === "pt" ? "Nota Rápida" : "Quick Note"}</span>
                <p className="text-sm italic text-orange-900 bg-orange-100 p-2 rounded" data-testid="text-zoho-quick-note">{deal.zohoQuickNote}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            {language === "pt" ? "Progresso do Deal" : "Deal Progress"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {DEAL_STATES.map((state, index) => {
              const isActive = state === deal.status;
              const isPast = getStateIndex(deal.status) > index;
              const isFuture = getStateIndex(deal.status) < index;
              
              return (
                <div key={state} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                    ${isActive ? "bg-violet-600 text-white" : ""}
                    ${isPast ? "bg-green-500 text-white" : ""}
                    ${isFuture ? "bg-gray-200 text-gray-500" : ""}
                  `}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`ml-2 text-xs whitespace-nowrap ${isActive ? "font-bold" : ""} ${isFuture ? "text-gray-400" : ""}`}>
                    {stateLabels[state][language as "en" | "pt"]}
                  </span>
                  {index < DEAL_STATES.length - 1 && (
                    <ArrowRight className={`w-4 h-4 mx-2 ${isPast ? "text-green-500" : "text-gray-300"}`} />
                  )}
                </div>
              );
            })}
          </div>
          
          {validTransitions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  {language === "pt" ? "Próxima ação disponível:" : "Next available action:"}
                </p>
                <ChecklistDrawer dealId={dealId} dealStage={deal.status} />
              </div>
              <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
                <DialogTrigger asChild>
                  <ContextualTooltip
                    tooltipKey={`stage_transition_${deal.status}`}
                    title={language === "pt" ? "Avançar Estado do Deal" : "Advance Deal State"}
                    content={!canTransition && blockingItems.length > 0
                      ? (language === "pt" 
                        ? `Bloqueado: Complete os seguintes itens antes de avançar: ${blockingItems.slice(0, 3).join(", ")}${blockingItems.length > 3 ? "..." : ""}`
                        : `Blocked: Complete the following items before advancing: ${blockingItems.slice(0, 3).join(", ")}${blockingItems.length > 3 ? "..." : ""}`)
                      : (language === "pt" 
                        ? "Antes de avançar: verifique se todos os itens obrigatórios do checklist foram concluídos. Cada estágio tem requisitos específicos que devem ser atendidos."
                        : "Before advancing: verify all mandatory checklist items are complete. Each stage has specific requirements that must be met.")}
                    whyMatters={language === "pt"
                      ? "Avançar sem documentação adequada pode causar atrasos no contrato, problemas de compliance ou perda de comissão."
                      : "Advancing without proper documentation can cause contract delays, compliance issues, or commission loss."}
                    mode="hover"
                  >
                    <Button 
                      className={canTransition ? "bg-violet-600 hover:bg-violet-700" : "bg-gray-400 cursor-not-allowed"} 
                      disabled={!canTransition || gatesLoading}
                      data-testid="button-advance-state"
                    >
                      {gatesLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      {language === "pt" ? "Avançar para" : "Advance to"} {stateLabels[validTransitions[0] as DealState]?.[language as "en" | "pt"]}
                    </Button>
                  </ContextualTooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === "pt" ? "Confirmar Transição" : "Confirm Transition"}
                    </DialogTitle>
                    <DialogDescription>
                      {language === "pt" 
                        ? `Mover deal de ${stateLabels[currentState as DealState]?.[language]} para ${stateLabels[validTransitions[0] as DealState]?.[language]}`
                        : `Move deal from ${stateLabels[currentState as DealState]?.[language]} to ${stateLabels[validTransitions[0] as DealState]?.[language]}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === "pt" ? "Motivo *" : "Reason *"}</Label>
                      <Input 
                        value={transitionForm.reason}
                        onChange={(e) => setTransitionForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder={language === "pt" ? "Ex: Cliente aprovou proposta" : "Ex: Client approved proposal"}
                        data-testid="input-transition-reason"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "pt" ? "Notas (opcional)" : "Notes (optional)"}</Label>
                      <Textarea 
                        value={transitionForm.notes}
                        onChange={(e) => setTransitionForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={language === "pt" ? "Detalhes adicionais..." : "Additional details..."}
                        data-testid="input-transition-notes"
                      />
                    </div>
                    <Button 
                      onClick={() => handleTransition(validTransitions[0])}
                      disabled={transitionMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-transition"
                    >
                      {transitionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {language === "pt" ? "Confirmar Transição" : "Confirm Transition"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ops Guardrails: Next Action Widget */}
      <NextActionWidget entityType="deal" entityId={dealId} />
      
      {/* Ops Guardrails: Next Steps Widget with workflow gates */}
      <NextStepsWidget 
        dealId={dealId} 
        currentStage={deal.status} 
        onActionClick={(action) => {
          if (action === "open_checklist") {
            const checklistBtn = document.querySelector('[data-testid="checklist-drawer-trigger"]');
            if (checklistBtn) (checklistBtn as HTMLButtonElement).click();
          }
        }}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assembly" className="flex items-center gap-2" data-testid="tab-assembly">
            <Zap className="w-4 h-4" />
            {language === "pt" ? "Montagem" : "Assembly"}
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {language === "pt" ? "Visão Geral" : "Overview"}
          </TabsTrigger>
          <ContextualTooltip
            tooltipKey="tab_rfq_overview"
            title={language === "pt" ? "Solicitação de Cotação (RFQ)" : "Request for Quote (RFQ)"}
            content={language === "pt" 
              ? "Gerencie o envio de RFQs aos fornecedores. Cada fornecedor recebe uma solicitação cega - eles não veem ofertas concorrentes."
              : "Manage RFQ dispatches to suppliers. Each supplier receives a blind request - they don't see competing offers."}
            whyMatters={language === "pt"
              ? "RFQs cegos garantem preços competitivos sem colusão entre fornecedores."
              : "Blind RFQs ensure competitive pricing without supplier collusion."}
            mode="hover"
          >
            <TabsTrigger value="rfq" className="flex items-center gap-2" data-testid="tab-rfq">
              <Send className="w-4 h-4" />
              {language === "pt" ? "RFQ" : "RFQ"}
            </TabsTrigger>
          </ContextualTooltip>
          <ContextualTooltip
            tooltipKey="tab_quotes_overview"
            title={language === "pt" ? "Seleção de Cotação" : "Quote Selection"}
            content={language === "pt" 
              ? "Compare cotações recebidas e selecione a melhor oferta. Considere preço, termos e qualidade do fornecedor."
              : "Compare received quotes and select the best offer. Consider price, terms, and supplier quality."}
            whyMatters={language === "pt"
              ? "A escolha da cotação determina a comissão e a relação de longo prazo do cliente."
              : "Quote choice determines commission and client's long-term relationship."}
            mode="hover"
          >
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              {language === "pt" ? "Cotações" : "Quotes"} ({deal.quotes?.length || 0})
            </TabsTrigger>
          </ContextualTooltip>
          <TabsTrigger value="proposals" className="flex items-center gap-2" data-testid="tab-proposals">
            <FileText className="w-4 h-4" />
            {language === "pt" ? "Propostas" : "Proposals"}
          </TabsTrigger>
          <TabsTrigger value="commission" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {language === "pt" ? "Comissões" : "Commissions"} ({deal.commissionEvents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {language === "pt" ? "Documentos" : "Documents"} ({deal.documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            {language === "pt" ? "Histórico" : "History"}
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {language === "pt" ? "Casos" : "Cases"}
          </TabsTrigger>
          <TabsTrigger value="tracks" className="flex items-center gap-2" data-testid="tab-tracks">
            <GitBranch className="w-4 h-4" />
            {language === "pt" ? "Trilhas" : "Tracks"}
          </TabsTrigger>
          <ContextualTooltip
            tooltipKey="tab_compliance_overview"
            title={language === "pt" ? "Verificação de Conformidade" : "Compliance Check"}
            content={language === "pt" 
              ? "Valide que todos os documentos e requisitos regulatórios estão em ordem antes de avançar o deal."
              : "Validate that all documents and regulatory requirements are in order before advancing the deal."}
            whyMatters={language === "pt"
              ? "Falhas de compliance podem invalidar contratos e bloquear comissões."
              : "Compliance failures can invalidate contracts and block commissions."}
            mode="hover"
          >
            <TabsTrigger value="compliance" className="flex items-center gap-2" data-testid="tab-compliance">
              <ShieldCheck className="w-4 h-4" />
              {language === "pt" ? "Conformidade" : "Compliance"}
            </TabsTrigger>
          </ContextualTooltip>
          <ContextualTooltip
            tooltipKey="tab_ecos_overview"
            title={language === "pt" ? "Análise ECOS" : "ECOS Analysis"}
            content={language === "pt" 
              ? "Veja a análise de mercado e compare o preço do cliente com benchmarks atuais."
              : "View market analysis and compare client pricing against current benchmarks."}
            whyMatters={language === "pt"
              ? "ECOS ajuda a identificar oportunidades de economia e preparar a argumentação comercial."
              : "ECOS helps identify savings opportunities and prepare sales talk tracks."}
            mode="hover"
          >
            <TabsTrigger value="ecos" className="flex items-center gap-2" data-testid="tab-ecos">
              <BarChart3 className="w-4 h-4" />
              {language === "pt" ? "ECOS" : "ECOS"}
            </TabsTrigger>
          </ContextualTooltip>
        </TabsList>

        <TabsContent value="assembly">
          <DealAssemblyTab dealId={dealId} />
        </TabsContent>

        <TabsContent value="rfq">
          <BlindAuctionPanel dealId={dealId} />
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {language === "pt" ? "Informações do Cliente" : "Client Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">{language === "pt" ? "Empresa" : "Company"}</p>
                  <p className="font-medium">{deal.client?.companyName}</p>
                </div>
                {deal.client?.cnpj && (
                  <div>
                    <p className="text-sm text-gray-500">CNPJ</p>
                    <p className="font-medium">{deal.client.cnpj}</p>
                  </div>
                )}
                {deal.client?.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{deal.client.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">{language === "pt" ? "Responsável" : "Owner"}</p>
                  <p className="font-medium">{deal.internalOwner}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {language === "pt" ? "Detalhes Comerciais" : "Commercial Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Tipo de Energia" : "Energy Type"}</p>
                    <p className="font-medium capitalize">{deal.energyType?.replace("_", " ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submercado</p>
                    <p className="font-medium">{deal.submarket || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Tipo de Volume" : "Volume Type"}</p>
                    <p className="font-medium capitalize">{deal.volumeType?.replace("_", " ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Estrutura de Preço" : "Price Structure"}</p>
                    <p className="font-medium capitalize">{deal.priceStructure?.replace("_", " ") || "-"}</p>
                  </div>
                </div>
                {deal.baseEnergyPriceRmwh && (
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Preço Base" : "Base Price"}</p>
                    <p className="font-medium text-lg text-green-600">
                      R$ {parseFloat(deal.baseEnergyPriceRmwh).toFixed(2)}/MWh
                    </p>
                  </div>
                )}
                {deal.supplier && (
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Fornecedor" : "Supplier"}</p>
                    <p className="font-medium">{deal.supplier.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {language === "pt" ? "Datas do Contrato" : "Contract Dates"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Início" : "Start"}</p>
                    <p className="font-medium">
                      {deal.contractStartDate 
                        ? new Date(deal.contractStartDate).toLocaleDateString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Término" : "End"}</p>
                    <p className="font-medium">
                      {deal.contractEndDate 
                        ? new Date(deal.contractEndDate).toLocaleDateString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                </div>
                {deal.contractTermMonths && (
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Prazo" : "Term"}</p>
                    <p className="font-medium">{deal.contractTermMonths} {language === "pt" ? "meses" : "months"}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {language === "pt" ? "Comissão" : "Commission"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Modelo" : "Model"}</p>
                    <p className="font-medium capitalize">{deal.commissionModel?.replace("_", " ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Tipo Pagamento" : "Payment Type"}</p>
                    <p className="font-medium capitalize">{deal.commissionPaymentType?.replace("_", " ") || "-"}</p>
                  </div>
                </div>
                {deal.commissionValueRmwh && (
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Valor R$/MWh" : "Value R$/MWh"}</p>
                    <p className="font-medium text-green-600">R$ {parseFloat(deal.commissionValueRmwh).toFixed(4)}/MWh</p>
                  </div>
                )}
                {deal.expectedCommissionTotal && (
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Total Esperado" : "Expected Total"}</p>
                    <p className="font-medium text-lg text-green-600">
                      R$ {parseFloat(deal.expectedCommissionTotal).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
                {deal.expectedCommissionMonthly && (
                  <div>
                    <p className="text-sm text-gray-500">{language === "pt" ? "Mensal Esperado" : "Expected Monthly"}</p>
                    <p className="font-medium text-green-600">
                      R$ {parseFloat(deal.expectedCommissionMonthly).toLocaleString("pt-BR")}/mês
                    </p>
                  </div>
                )}
                
                {/* Gerar Fatura Button */}
                <div className="pt-4 border-t mt-4">
                  <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={openInvoiceDialog}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-generate-invoice"
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        {language === "pt" ? "Gerar Fatura (Comissão)" : "Generate Invoice (Commission)"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {language === "pt" ? "Gerar Fatura de Comissão" : "Generate Commission Invoice"}
                        </DialogTitle>
                        <DialogDescription>
                          {language === "pt" 
                            ? "Preencha os dados da fatura. Valores pré-preenchidos com base no deal."
                            : "Fill in invoice details. Values pre-filled based on deal data."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>{language === "pt" ? "Tipo de Fatura" : "Invoice Type"}</Label>
                          <Select 
                            value={invoiceForm.invoiceType} 
                            onValueChange={(val) => setInvoiceForm(f => ({ ...f, invoiceType: val as any }))}
                          >
                            <SelectTrigger data-testid="select-invoice-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MILESTONE_1">{language === "pt" ? "M1: Contrato Assinado" : "M1: Contract Signed"}</SelectItem>
                              <SelectItem value="MILESTONE_2">{language === "pt" ? "M2: Fornecimento Ativo" : "M2: Supply Live"}</SelectItem>
                              <SelectItem value="ADJUSTMENT">{language === "pt" ? "Ajuste" : "Adjustment"}</SelectItem>
                              <SelectItem value="MONTHLY">{language === "pt" ? "Mensal" : "Monthly"}</SelectItem>
                              <SelectItem value="QUARTERLY">{language === "pt" ? "Trimestral" : "Quarterly"}</SelectItem>
                              <SelectItem value="FINAL">{language === "pt" ? "Final" : "Final"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{language === "pt" ? "Valor (R$)" : "Amount (R$)"}</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={invoiceForm.grossAmountBrl}
                            onChange={(e) => setInvoiceForm(f => ({ ...f, grossAmountBrl: e.target.value }))}
                            placeholder="0.00"
                            data-testid="input-invoice-amount"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{language === "pt" ? "Gatilho de Pagamento" : "Payment Trigger"} *</Label>
                          <Select 
                            value={invoiceForm.paymentTrigger} 
                            onValueChange={(val) => setInvoiceForm(f => ({ ...f, paymentTrigger: val }))}
                          >
                            <SelectTrigger data-testid="select-payment-trigger">
                              <SelectValue placeholder={language === "pt" ? "Selecione o gatilho" : "Select trigger"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ativação na CCEE">{language === "pt" ? "Ativação na CCEE" : "CCEE Activation"}</SelectItem>
                              <SelectItem value="Assinatura do contrato">{language === "pt" ? "Assinatura do contrato" : "Contract Signed"}</SelectItem>
                              <SelectItem value="Primeiro faturamento do cliente">{language === "pt" ? "Primeiro faturamento do cliente" : "First Client Billing"}</SelectItem>
                              <SelectItem value="Mensal - conforme relatório">{language === "pt" ? "Mensal - conforme relatório" : "Monthly - per report"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{language === "pt" ? "Data de Vencimento" : "Due Date"}</Label>
                          <Input 
                            type="date"
                            value={invoiceForm.dueDate}
                            onChange={(e) => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
                            data-testid="input-invoice-due-date"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{language === "pt" ? "Descrição do Serviço" : "Service Description"}</Label>
                          <Textarea 
                            value={invoiceForm.serviceDescription}
                            onChange={(e) => setInvoiceForm(f => ({ ...f, serviceDescription: e.target.value }))}
                            rows={2}
                            data-testid="input-service-description"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{language === "pt" ? "Notas" : "Notes"}</Label>
                          <Textarea 
                            value={invoiceForm.notes}
                            onChange={(e) => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2}
                            data-testid="input-invoice-notes"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                          {language === "pt" ? "Cancelar" : "Cancel"}
                        </Button>
                        <Button 
                          onClick={handleCreateInvoice}
                          disabled={createInvoiceMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-confirm-create-invoice"
                        >
                          {createInvoiceMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Receipt className="w-4 h-4 mr-2" />
                          )}
                          {language === "pt" ? "Criar Fatura" : "Create Invoice"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "pt" ? "Cotações de Fornecedores" : "Supplier Quotes"}</CardTitle>
                  <CardDescription>
                    {language === "pt" 
                      ? "Cotações recebidas para este deal"
                      : "Quotes received for this deal"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {language === "pt" ? "Uso interno" : "Internal use"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!deal.quotes || deal.quotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "pt" ? "Nenhuma cotação recebida ainda" : "No quotes received yet"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deal.quotes.map((quote: any) => (
                    <div 
                      key={quote.id}
                      className={`border rounded-lg p-4 ${quote.isSelected ? "border-green-500 bg-green-50" : quote.isRejected ? "border-red-300 bg-red-50" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{quote.supplier?.name || `Supplier #${quote.supplierId}`}</h4>
                        <div className="flex items-center gap-2">
                          {quote.isSelected && (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              {language === "pt" ? "Selecionada" : "Selected"}
                            </Badge>
                          )}
                          {quote.isRejected && (
                            <Badge className="bg-red-100 text-red-800">
                              <X className="w-3 h-3 mr-1" />
                              {language === "pt" ? "Rejeitada" : "Rejected"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{language === "pt" ? "Cotação do fornecedor" : "Supplier quote"} <span className="text-amber-600 text-[10px]">(uso interno)</span></p>
                          <p className="font-medium text-gray-600">
                            {quote.baseEnergyPriceRmwh 
                              ? `R$ ${parseFloat(quote.baseEnergyPriceRmwh).toFixed(2)}/MWh`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{language === "pt" ? "Preço ao Cliente" : "Client Price"}</p>
                          {quote.clientEnergyPriceRmwh ? (
                            <p className="font-semibold text-green-700">
                              R$ {parseFloat(quote.clientEnergyPriceRmwh).toFixed(2)}/MWh
                            </p>
                          ) : (
                            <p className="text-orange-600 text-xs">
                              {language === "pt" ? "Não definido" : "Not set"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">{language === "pt" ? "Margem" : "Margin"} <span className="text-amber-600 text-[10px]">(uso interno)</span></p>
                          <p className="font-medium">
                            {quote.upliftValue 
                              ? `${quote.upliftType === "PERCENT" ? "" : "R$ "}${parseFloat(quote.upliftValue).toFixed(2)}${quote.upliftType === "PERCENT" ? "%" : "/MWh"}`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{language === "pt" ? "Validade" : "Valid Until"}</p>
                          <p className="font-medium">
                            {quote.validUntil 
                              ? new Date(quote.validUntil).toLocaleDateString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{language === "pt" ? "Status" : "Status"}</p>
                          {quote.isProposalEligible ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {language === "pt" ? "Elegível" : "Eligible"}
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              {language === "pt" ? "Sem preço cliente" : "No client price"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!quote.isRejected && !quote.isSelected && (
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button
                            size="sm"
                            variant={quote.clientEnergyPriceRmwh ? "outline" : "default"}
                            onClick={() => {
                              setClientPriceQuote({ ...quote, dealId: dealId });
                              setClientPriceModalOpen(true);
                            }}
                            data-testid={`set-client-price-btn-${quote.id}`}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            {quote.clientEnergyPriceRmwh 
                              ? (language === "pt" ? "Ajustar Preço" : "Adjust Price")
                              : (language === "pt" ? "Definir Preço ao Cliente" : "Set Client Price")
                            }
                          </Button>
                        </div>
                      )}
                      {quote.selectionReason && (
                        <p className="text-sm text-green-600 mt-2">
                          <strong>{language === "pt" ? "Motivo seleção:" : "Selection reason:"}</strong> {quote.selectionReason}
                        </p>
                      )}
                      {quote.rejectionReason && (
                        <p className="text-sm text-red-600 mt-2">
                          <strong>{language === "pt" ? "Motivo rejeição:" : "Rejection reason:"}</strong> {quote.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <DealProposalsTab dealId={dealId} />
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>{language === "pt" ? "Eventos de Comissão" : "Commission Events"}</CardTitle>
              <CardDescription>
                {language === "pt" 
                  ? "Cronograma de pagamentos de comissão"
                  : "Commission payment schedule"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!deal.commissionEvents || deal.commissionEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "pt" ? "Nenhum evento de comissão registrado" : "No commission events recorded"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deal.commissionEvents.map((event: any) => {
                    const getMilestoneBadge = (type: string) => {
                      if (type === 'MILESTONE_1') return { label: 'M1: Contract Signed', class: 'bg-violet-100 text-violet-800' };
                      if (type === 'MILESTONE_2') return { label: 'M2: Supply Live', class: 'bg-blue-100 text-blue-800' };
                      if (type === 'ADJUSTMENT') return { label: 'Adjustment', class: 'bg-orange-100 text-orange-800' };
                      return { label: type?.replace(/_/g, ' ') || 'Unknown', class: 'bg-gray-100 text-gray-800' };
                    };
                    const milestoneInfo = getMilestoneBadge(event.eventType);
                    
                    return (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={milestoneInfo.class}>{milestoneInfo.label}</Badge>
                            {event.paymentTrigger && (
                              <span className="text-sm text-gray-600">{event.paymentTrigger}</span>
                            )}
                          </div>
                          <Badge className={
                            event.status === "PAID" ? "bg-green-100 text-green-800" :
                            event.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" :
                            event.status === "INVOICED" ? "bg-purple-100 text-purple-800" :
                            event.status === "OVERDUE" ? "bg-red-100 text-red-800" :
                            event.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">{language === "pt" ? "Valor" : "Amount"}</p>
                            <p className="font-medium">
                              {event.amountBrl 
                                ? `R$ ${parseFloat(event.amountBrl).toLocaleString("pt-BR")}`
                                : event.amountRmwh 
                                  ? `${parseFloat(event.amountRmwh).toFixed(4)} R$/MWh`
                                  : event.amountFormula || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">{language === "pt" ? "Data Esperada" : "Expected Date"}</p>
                            <p className="font-medium">
                              {event.expectedDate 
                                ? new Date(event.expectedDate).toLocaleDateString("pt-BR")
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">{language === "pt" ? "Gatilho" : "Trigger"}</p>
                            <p className="font-medium">{event.paymentTrigger || event.dueCondition || "-"}</p>
                          </div>
                          {event.paidAt && (
                            <div>
                              <p className="text-gray-500">{language === "pt" ? "Pago em" : "Paid on"}</p>
                              <p className="font-medium text-green-600">
                                {new Date(event.paidAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          )}
                          {event.confirmedAt && !event.paidAt && (
                            <div>
                              <p className="text-gray-500">{language === "pt" ? "Confirmado em" : "Confirmed on"}</p>
                              <p className="font-medium text-blue-600">
                                {new Date(event.confirmedAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>{language === "pt" ? "Documentos" : "Documents"}</CardTitle>
              <CardDescription>
                {language === "pt" 
                  ? "Contratos, cotações e evidências"
                  : "Contracts, quotes and evidence"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!deal.documents || deal.documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "pt" ? "Nenhum documento anexado" : "No documents attached"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deal.documents.map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline">{doc.documentType}</Badge>
                            {doc.documentSubtype && <span>{doc.documentSubtype}</span>}
                            <span>{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            {language === "pt" ? "Verificado" : "Verified"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {language === "pt" ? "Pendente" : "Pending"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{language === "pt" ? "Histórico de Transições" : "Transition History"}</CardTitle>
              <CardDescription>
                {language === "pt" 
                  ? "Registro completo de todas as mudanças de estado"
                  : "Complete record of all state changes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!deal.transitions || deal.transitions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "pt" ? "Nenhuma transição registrada ainda" : "No transitions recorded yet"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deal.transitions.map((transition: any, index: number) => (
                    <div key={transition.id} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-violet-500 border-2 border-white" />
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={stateColors[transition.fromState as DealState]}>
                            {stateLabels[transition.fromState as DealState]?.[language as "en" | "pt"]}
                          </Badge>
                          <ArrowRight className="w-4 h-4" />
                          <Badge className={stateColors[transition.toState as DealState]}>
                            {stateLabels[transition.toState as DealState]?.[language as "en" | "pt"]}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {transition.triggeredBy} ({transition.triggeredByType})
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(transition.timestamp).toLocaleString("pt-BR")}
                          </p>
                          {transition.reason && (
                            <p><strong>{language === "pt" ? "Motivo:" : "Reason:"}</strong> {transition.reason}</p>
                          )}
                          {transition.notes && (
                            <p><strong>{language === "pt" ? "Notas:" : "Notes:"}</strong> {transition.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <DealCasesTab dealId={dealId} />
        </TabsContent>

        <TabsContent value="tracks">
          <DealTracksTab dealId={dealId} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceChecklistTab 
            dealId={dealId}
            currentState={deal.status}
            targetState={validTransitions.length > 0 ? validTransitions[0] : undefined}
          />
        </TabsContent>

        <TabsContent value="ecos">
          <DealEcosTab dealId={dealId} />
        </TabsContent>
      </Tabs>

      <SetClientPriceModal
        quote={clientPriceQuote}
        open={clientPriceModalOpen}
        onOpenChange={setClientPriceModalOpen}
      />
    </div>
  );
}