import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { 
  FileText, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  MoreVertical,
  Copy,
  ExternalLink,
  Plus,
  Building,
  Zap,
  DollarSign,
  Download,
  Star,
  Loader2,
  AlertCircle,
  Mail,
  FileDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Shield,
  Calendar
} from "lucide-react";

interface DealProposal {
  id: string;
  dealId: string;
  clientId: number;
  status: string;
  publicId: string | null;
  validUntil: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  proposalTitle: string | null;
  preparedByName: string | null;
  recommendedItemId: number | null;
  recommendedReason: string | null;
  pdfDocId: number | null;
  baselineConsumptionMwh12m: string | null;
  baselineEnergySupplyCost12m: string | null;
}

interface ProposalItem {
  id: number;
  proposalId: string;
  supplierName: string;
  productType: string;
  termMonths: number;
  finalPriceRmwh: string;
  finalEnergyPriceRmwh: string;
  annualEnergyCost: string | null;
  savingsAnnual: string | null;
  savingsPercent: string | null;
  isRecommended?: boolean;
  publicNotes?: string | null;
}

interface Deal {
  id: string;
  clientId: number;
  clientName?: string;
  companyName?: string;
  status: string;
}

interface EligibleQuote {
  id: string;
  dealId: string;
  supplierId: number;
  supplier?: { name: string };
  supplierName?: string;
  energyType?: string;
  termMonths?: number;
  clientEnergyPriceRmwh: string;
  validUntil?: string;
  isProposalEligible: boolean;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  GENERATED: "bg-blue-100 text-blue-700",
  SENT: "bg-purple-100 text-purple-700",
  VIEWED: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  GENERATED: "Gerada",
  SENT: "Enviada",
  VIEWED: "Visualizada",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  EXPIRED: "Expirada",
};

const validityPresets = [
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
  { label: "45 dias", days: 45 },
  { label: "60 dias", days: 60 },
];

const recommendedReasons = [
  "Melhor custo-benefício no período contratual",
  "Menor preço por MWh entre as opções apresentadas",
  "Fornecedor com melhor histórico de atendimento",
  "Prazo contratual mais adequado ao perfil de consumo",
  "Melhor combinação de preço, prazo e confiabilidade",
  "Economia significativa em comparação ao mercado cativo",
];

export default function ProposalsManager() {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const { sessionId, user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<DealProposal | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendMessage, setSendMessage] = useState("");

  // Wizard state
  const [wizSelectedDealId, setWizSelectedDealId] = useState("");
  const [wizSelectedQuotes, setWizSelectedQuotes] = useState<string[]>([]);
  const [wizRecommendedQuoteId, setWizRecommendedQuoteId] = useState("");
  const [wizValidityDays, setWizValidityDays] = useState("30");
  const [wizRecommendedReason, setWizRecommendedReason] = useState("");
  const [wizCustomReason, setWizCustomReason] = useState("");
  const [wizPreparedBy, setWizPreparedBy] = useState(user?.username || "");
  const [wizProposalTitle, setWizProposalTitle] = useState("");
  const [wizCustomNotes, setWizCustomNotes] = useState("");

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ["/api/deal-proposals"],
    queryFn: async () => {
      const res = await fetch("/api/deal-proposals", {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) return { proposals: [] };
      return res.json();
    },
  });
  const proposals: DealProposal[] = proposalsData?.proposals || [];

  const { data: dealsData } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals", {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) return { deals: [] };
      return res.json();
    },
  });
  const deals: Deal[] = dealsData?.deals || [];

  const { data: eligibleQuotesData } = useQuery({
    queryKey: [`/api/deals/${wizSelectedDealId}/eligible-quotes`],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${wizSelectedDealId}/eligible-quotes`, {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) return { quotes: [] };
      return res.json();
    },
    enabled: !!wizSelectedDealId,
  });
  const eligibleQuotes: EligibleQuote[] = eligibleQuotesData?.quotes || [];

  const { data: proposalDetailData } = useQuery({
    queryKey: ["/api/deal-proposals", selectedProposal?.id],
    queryFn: async () => {
      if (!selectedProposal) return null;
      const res = await fetch(`/api/deal-proposals/${selectedProposal.id}`, {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedProposal,
  });

  const createAndBuildMutation = useMutation({
    mutationFn: async () => {
      const validUntil = new Date(Date.now() + parseInt(wizValidityDays) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const reason = wizRecommendedReason === "custom" ? wizCustomReason : wizRecommendedReason;

      const createRes = await fetch(`/api/deals/${wizSelectedDealId}/proposals`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
        body: JSON.stringify({
          validUntil,
          proposalTitle: wizProposalTitle || undefined,
          preparedByName: wizPreparedBy || undefined,
          customNotes: wizCustomNotes || undefined,
          recommendedReason: reason || undefined,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create proposal");
      }
      const { proposal } = await createRes.json();

      for (const quoteId of wizSelectedQuotes) {
        const addRes = await fetch(`/api/proposals/${proposal.id}/items`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-session-id": sessionId || "" 
          },
          body: JSON.stringify({
            dealQuoteId: quoteId,
            isRecommended: quoteId === wizRecommendedQuoteId,
          }),
        });
        if (!addRes.ok) {
          const err = await addRes.json();
          throw new Error(err.error || `Failed to add quote ${quoteId}`);
        }
      }

      const genRes = await fetch(`/api/proposals/${proposal.id}/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
      });
      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Failed to generate proposal");
      }

      return proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deal-proposals"] });
      resetWizard();
      toast({ title: "Proposta criada e gerada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar proposta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const sendProposalMutation = useMutation({
    mutationFn: async ({ proposalId, email, message }: { proposalId: string; email: string; message: string }) => {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
        body: JSON.stringify({ recipientEmail: email, customMessage: message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deal-proposals"] });
      setSendDialogOpen(false);
      setSendEmail("");
      setSendMessage("");
      toast({ title: "Proposta enviada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao enviar proposta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setWizSelectedDealId("");
    setWizSelectedQuotes([]);
    setWizRecommendedQuoteId("");
    setWizValidityDays("30");
    setWizRecommendedReason("");
    setWizCustomReason("");
    setWizPreparedBy(user?.username || "");
    setWizProposalTitle("");
    setWizCustomNotes("");
  };

  const filteredProposals = proposals.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const stats = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === "DRAFT").length,
    sent: proposals.filter((p) => ["SENT", "VIEWED"].includes(p.status)).length,
    accepted: proposals.filter((p) => p.status === "ACCEPTED").length,
    rejected: proposals.filter((p) => p.status === "REJECTED").length,
  };

  const copyLink = (publicId: string) => {
    const link = `${window.location.origin}/proposta/${publicId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return parseFloat(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getDealName = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    return deal?.companyName || deal?.clientName || `Deal ${dealId.slice(0, 8)}`;
  };

  const toggleQuoteSelection = (quoteId: string) => {
    setWizSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
    if (wizRecommendedQuoteId === quoteId && wizSelectedQuotes.includes(quoteId)) {
      setWizRecommendedQuoteId("");
    }
  };

  const activeDeals = deals.filter(d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.status));

  const canProceedStep1 = !!wizSelectedDealId;
  const canProceedStep2 = wizSelectedQuotes.length > 0;
  const canProceedStep3 = !!wizValidityDays && (wizSelectedQuotes.length === 1 || !!wizRecommendedQuoteId);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2" data-testid="text-page-title">
              <FileText className="h-6 w-6 text-emerald-600" />
              Propostas Comerciais
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie e envie propostas para clientes
            </p>
          </div>
          <Button 
            onClick={() => setWizardOpen(true)} 
            className="gap-2"
            data-testid="button-nova-proposta"
          >
            <Plus className="h-4 w-4" />
            Nova Proposta
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Rascunhos</p>
                  <p className="text-2xl font-bold" data-testid="stat-draft">{stats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Enviadas</p>
                  <p className="text-2xl font-bold" data-testid="stat-sent">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">Aceitas</p>
                  <p className="text-2xl font-bold text-emerald-600" data-testid="stat-accepted">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Recusadas</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="stat-rejected">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Todas as Propostas</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40" data-testid="select-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="DRAFT">Rascunhos</SelectItem>
                  <SelectItem value="GENERATED">Geradas</SelectItem>
                  <SelectItem value="SENT">Enviadas</SelectItem>
                  <SelectItem value="VIEWED">Visualizadas</SelectItem>
                  <SelectItem value="ACCEPTED">Aceitas</SelectItem>
                  <SelectItem value="REJECTED">Recusadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Nenhuma proposta encontrada</p>
                <p className="text-sm mt-2 text-gray-400">
                  Clique em "Nova Proposta" para criar sua primeira proposta comercial
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Negócio / Cliente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Views</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Validade</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Criada</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProposals.map((proposal) => (
                      <tr 
                        key={proposal.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedProposal(proposal)}
                        data-testid={`row-proposal-${proposal.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{getDealName(proposal.dealId)}</div>
                          <div className="text-xs text-gray-400">#{proposal.publicId?.substring(0, 8) || proposal.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[proposal.status] || "bg-gray-100"}>
                            {statusLabels[proposal.status] || proposal.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span>{proposal.viewCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(proposal.validUntil)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(proposal.createdAt)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${proposal.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {proposal.publicId && (
                                <>
                                  <DropdownMenuItem onClick={() => copyLink(proposal.publicId!)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copiar Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => window.open(`/proposta/${proposal.publicId}`, "_blank")}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {["GENERATED", "SENT", "VIEWED"].includes(proposal.status) && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setSendDialogOpen(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Enviar por Email
                                </DropdownMenuItem>
                              )}
                              {proposal.pdfDocId && (
                                <DropdownMenuItem onClick={() => window.open(`/api/proposals/${proposal.id}/pdf`, "_blank")}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar PDF
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Multi-Step Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) resetWizard(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Nova Proposta, Passo {wizardStep} de 4
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && "Selecione o negócio para a proposta"}
              {wizardStep === 2 && "Selecione as opções de preço ao cliente"}
              {wizardStep === 3 && "Configure os detalhes da proposta"}
              {wizardStep === 4 && "Revise e gere a proposta"}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-1 px-2">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex-1 flex items-center gap-1">
                <div className={`h-2 flex-1 rounded-full ${
                  step <= wizardStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>

          <div className="py-4 min-h-[300px]">
            {/* Step 1: Select Deal */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Negócio</Label>
                  <p className="text-sm text-gray-500">Selecione o negócio que contém as cotações com preço ao cliente definido.</p>
                  <Select value={wizSelectedDealId} onValueChange={(v) => { setWizSelectedDealId(v); setWizSelectedQuotes([]); setWizRecommendedQuoteId(""); }}>
                    <SelectTrigger data-testid="wizard-select-deal">
                      <SelectValue placeholder="Selecione um negócio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDeals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.companyName || deal.clientName || `Deal ${deal.id.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeDeals.length === 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Nenhum negócio ativo</p>
                      <p className="text-sm text-amber-600">
                        Crie um negócio com cotações de fornecedores antes de gerar propostas.
                      </p>
                    </div>
                  </div>
                )}

                {wizSelectedDealId && eligibleQuotes.length === 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Nenhuma cotação com preço ao cliente</p>
                      <p className="text-sm text-amber-600">
                        Acesse o negócio, vá na aba "Cotações" e clique em "Definir Preço ao Cliente" em pelo menos uma cotação.
                      </p>
                      <Link href={`/admin/deals`}>
                        <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-amber-700">
                          Ir para Negócios <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {wizSelectedDealId && eligibleQuotes.length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-lg flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">
                      {eligibleQuotes.length} {eligibleQuotes.length === 1 ? 'cotação elegível' : 'cotações elegíveis'} encontrada{eligibleQuotes.length === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Client Price Options */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Opções de Preço ao Cliente</Label>
                  <p className="text-sm text-gray-500 mt-1">Selecione as cotações que deseja incluir na proposta. Apenas cotações com preço ao cliente definido são exibidas.</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Os preços abaixo já incluem a comissão da Ótima. O cliente verá apenas o "Preço Final".
                  </p>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {eligibleQuotes.map(quote => {
                    const isSelected = wizSelectedQuotes.includes(quote.id);
                    return (
                      <div
                        key={quote.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleQuoteSelection(quote.id)}
                        data-testid={`wizard-quote-${quote.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium">{quote.supplier?.name || quote.supplierName || 'Fornecedor'}</p>
                              <p className="text-xs text-gray-500">
                                {quote.energyType || 'Convencional'} • {quote.termMonths || 12} meses
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-emerald-700">
                              R$ {parseFloat(quote.clientEnergyPriceRmwh).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">por MWh</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {wizSelectedQuotes.length === 0 && (
                  <p className="text-sm text-amber-600">Selecione pelo menos uma cotação para continuar.</p>
                )}
              </div>
            )}

            {/* Step 3: Settings */}
            {wizardStep === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Validade da Proposta</Label>
                  <div className="flex gap-2 flex-wrap">
                    {validityPresets.map(preset => (
                      <Button
                        key={preset.days}
                        size="sm"
                        variant={wizValidityDays === String(preset.days) ? "default" : "outline"}
                        onClick={() => setWizValidityDays(String(preset.days))}
                        data-testid={`wizard-validity-${preset.days}`}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {wizSelectedQuotes.length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Opção Recomendada</Label>
                    <p className="text-sm text-gray-500">Qual cotação será destacada como "Recomendada" para o cliente?</p>
                    <Select value={wizRecommendedQuoteId} onValueChange={setWizRecommendedQuoteId}>
                      <SelectTrigger data-testid="wizard-recommended-quote">
                        <SelectValue placeholder="Selecione a opção recomendada..." />
                      </SelectTrigger>
                      <SelectContent>
                        {wizSelectedQuotes.map(qId => {
                          const q = eligibleQuotes.find(eq => eq.id === qId);
                          return (
                            <SelectItem key={qId} value={qId}>
                              {q?.supplier?.name || q?.supplierName || 'Fornecedor'}, R$ {q ? parseFloat(q.clientEnergyPriceRmwh).toFixed(2) : '?'}/MWh
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-base font-medium">Por que recomendamos?</Label>
                  <Select value={wizRecommendedReason} onValueChange={setWizRecommendedReason}>
                    <SelectTrigger data-testid="wizard-recommended-reason">
                      <SelectValue placeholder="Selecione um motivo (opcional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recommendedReasons.map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                      <SelectItem value="custom">Outro (personalizado)</SelectItem>
                    </SelectContent>
                  </Select>
                  {wizRecommendedReason === "custom" && (
                    <Input
                      value={wizCustomReason}
                      onChange={(e) => setWizCustomReason(e.target.value)}
                      placeholder="Digite o motivo da recomendação..."
                      data-testid="wizard-custom-reason"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Preparado por</Label>
                  <Input
                    value={wizPreparedBy}
                    onChange={(e) => setWizPreparedBy(e.target.value)}
                    placeholder="Nome do consultor"
                    data-testid="wizard-prepared-by"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas para o cliente (opcional)</Label>
                  <Textarea
                    value={wizCustomNotes}
                    onChange={(e) => setWizCustomNotes(e.target.value)}
                    placeholder="Informações adicionais que serão exibidas na proposta..."
                    rows={2}
                    data-testid="wizard-notes"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h3 className="font-medium text-emerald-800 mb-3">Resumo da Proposta</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Negócio</p>
                      <p className="font-medium">{getDealName(wizSelectedDealId)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Validade</p>
                      <p className="font-medium">{wizValidityDays} dias</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Opções incluídas</p>
                      <p className="font-medium">{wizSelectedQuotes.length} cotação(ões)</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Preparado por</p>
                      <p className="font-medium">{wizPreparedBy || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Opções selecionadas</h4>
                  {wizSelectedQuotes.map(qId => {
                    const q = eligibleQuotes.find(eq => eq.id === qId);
                    const isRec = qId === wizRecommendedQuoteId || (wizSelectedQuotes.length === 1);
                    return (
                      <div key={qId} className={`p-3 rounded-lg border ${isRec ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{q?.supplier?.name || q?.supplierName || 'Fornecedor'}</span>
                            {isRec && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Recomendada
                              </Badge>
                            )}
                          </div>
                          <span className="font-bold text-emerald-700">
                            R$ {q ? parseFloat(q.clientEnergyPriceRmwh).toFixed(2) : '?'}/MWh
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Proteção de receita ativa</p>
                    <p>A proposta mostrará apenas o preço final ao cliente. Nenhum preço base ou margem será exposto.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {wizardStep > 1 && (
                <Button variant="ghost" onClick={() => setWizardStep(s => s - 1)} data-testid="wizard-btn-back">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={resetWizard}>
                Cancelar
              </Button>
              {wizardStep < 4 ? (
                <Button
                  onClick={() => setWizardStep(s => s + 1)}
                  disabled={
                    (wizardStep === 1 && !canProceedStep1) ||
                    (wizardStep === 1 && eligibleQuotes.length === 0) ||
                    (wizardStep === 2 && !canProceedStep2) ||
                    (wizardStep === 3 && !canProceedStep3)
                  }
                  data-testid="wizard-btn-next"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => createAndBuildMutation.mutate()}
                  disabled={createAndBuildMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="wizard-btn-generate"
                >
                  {createAndBuildMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Gerar Proposta
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Proposal Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Enviar Proposta
            </DialogTitle>
            <DialogDescription>
              Envie a proposta por email para o cliente
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do destinatário</Label>
              <Input
                id="email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="cliente@empresa.com.br"
                data-testid="input-send-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
              <Textarea
                id="message"
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Adicione uma mensagem personalizada..."
                rows={3}
                data-testid="textarea-send-message"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedProposal && sendProposalMutation.mutate({
                proposalId: selectedProposal.id,
                email: sendEmail,
                message: sendMessage,
              })}
              disabled={!sendEmail || sendProposalMutation.isPending}
              data-testid="button-send-proposal-submit"
            >
              {sendProposalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Detail Dialog */}
      <Dialog open={!!selectedProposal && !sendDialogOpen} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              {selectedProposal?.proposalTitle || "Proposta Comercial"}
            </DialogTitle>
            <DialogDescription>
              {getDealName(selectedProposal?.dealId || "")} • {statusLabels[selectedProposal?.status || ""] || selectedProposal?.status}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">Opções de Cotação</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4">
                {proposalDetailData?.items?.length > 0 ? (
                  <div className="space-y-3">
                    {proposalDetailData.items.map((item: ProposalItem) => (
                      <Card key={item.id} className={item.isRecommended ? "border-emerald-500 border-2" : ""}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{item.supplierName}</span>
                              {item.isRecommended && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  <Star className="h-3 w-3 mr-1" />
                                  Recomendada
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline">{item.productType}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Prazo</p>
                              <p className="font-medium">{item.termMonths} meses</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Preço Final</p>
                              <p className="font-medium text-emerald-700">R$ {parseFloat(item.finalEnergyPriceRmwh || item.finalPriceRmwh).toFixed(2)}/MWh</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Economia Anual</p>
                              <p className="font-medium text-emerald-600">
                                {formatCurrency(item.savingsAnnual)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma opção de cotação adicionada</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Consumo Anual (baseline)</p>
                      <p className="font-medium">
                        {selectedProposal?.baselineConsumptionMwh12m 
                          ? `${parseFloat(selectedProposal.baselineConsumptionMwh12m).toFixed(2)} MWh`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Custo Atual (baseline)</p>
                      <p className="font-medium">{formatCurrency(selectedProposal?.baselineEnergySupplyCost12m || null)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preparado por</p>
                      <p className="font-medium">{selectedProposal?.preparedByName || "-"}</p>
                    </div>
                    {selectedProposal?.recommendedReason && (
                      <div>
                        <p className="text-sm text-gray-500">Por que recomendamos</p>
                        <p className="font-medium text-emerald-700">{selectedProposal.recommendedReason}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Validade</p>
                      <p className="font-medium">{formatDate(selectedProposal?.validUntil || null)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visualizações</p>
                      <p className="font-medium">{selectedProposal?.viewCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Última visualização</p>
                      <p className="font-medium">{formatDate(selectedProposal?.lastViewedAt || null)}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {selectedProposal?.publicId && (
                <Button variant="outline" onClick={() => copyLink(selectedProposal.publicId!)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {["GENERATED", "SENT", "VIEWED"].includes(selectedProposal?.status || "") && (
                <>
                  <Button variant="outline" asChild>
                    <a href={`/api/proposals/${selectedProposal?.id}/pdf`} download>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </a>
                  </Button>
                  <Button
                    onClick={() => setSendDialogOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Proposta
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
