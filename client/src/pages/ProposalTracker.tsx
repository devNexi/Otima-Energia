import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { 
  FileText, 
  ArrowLeft, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  MoreVertical,
  Copy,
  ExternalLink,
  Plus,
  ChevronRight,
  ChevronLeft,
  Building,
  Zap,
  DollarSign
} from "lucide-react";
import type { Proposal, Client, SupplierQuote } from "@shared/schema";

type ProposalStatus = "all" | "draft" | "sent" | "viewed" | "negotiating" | "accepted" | "rejected" | "expired";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  negotiating: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function ProposalTracker() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { sessionId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ProposalStatus>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [validityDays, setValidityDays] = useState("30");

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients", {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) return { clients: [] };
      return res.json();
    },
  });
  const clients: Client[] = clientsData?.clients || [];

  const { data: quotesData } = useQuery({
    queryKey: ["/api/supplier-quotes"],
    queryFn: async () => {
      const res = await fetch("/api/supplier-quotes", {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) return { quotes: [] };
      return res.json();
    },
  });
  const quotes: SupplierQuote[] = quotesData?.quotes || [];

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ["/api/proposals"],
    queryFn: async () => {
      const res = await fetch("/api/proposals", {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/proposals/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({ title: t("proposal.toast.status_updated") });
    },
  });

  const proposals: Proposal[] = proposalsData?.proposals || [];

  const filteredProposals = proposals.filter((p: Proposal) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const stats = {
    total: proposals.length,
    sent: proposals.filter((p: Proposal) => ["sent", "viewed", "negotiating", "accepted", "rejected"].includes(p.status || "")).length,
    viewed: proposals.filter((p: Proposal) => (p.viewedCount || 0) > 0).length,
    accepted: proposals.filter((p: Proposal) => p.status === "accepted").length,
    conversionRate: proposals.length > 0 
      ? ((proposals.filter((p: Proposal) => p.status === "accepted").length / proposals.length) * 100).toFixed(1)
      : "0",
  };

  const createProposalMutation = useMutation({
    mutationFn: async (data: {
      clientId: number;
      quoteId: number;
      validUntil: string;
    }) => {
      const selectedClient = clients.find((c) => c.id === data.clientId);
      const selectedQuote = quotes.find((q) => q.id === data.quoteId);
      
      if (!selectedClient || !selectedQuote) {
        throw new Error("Client or quote not found");
      }

      const payload = {
        clientId: data.clientId,
        quoteId: data.quoteId,
        validUntil: data.validUntil,
        proposalDate: new Date().toISOString().split("T")[0],
        clientName: selectedClient.companyName,
        clientCnpj: selectedClient.cnpj || undefined,
        supplierName: (selectedQuote as any).supplierName || "Unknown Supplier",
        status: "draft",
      };

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      setCreateDialogOpen(false);
      setWizardStep(1);
      setSelectedClientId("");
      setSelectedQuoteId("");
      toast({ title: "Proposta criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar proposta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCreateProposal = () => {
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + parseInt(validityDays));
    
    createProposalMutation.mutate({
      clientId: parseInt(selectedClientId),
      quoteId: parseInt(selectedQuoteId),
      validUntil: validUntilDate.toISOString().split("T")[0],
    });
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/proposal/view/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: t("proposal.toast.copied") });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return parseFloat(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" data-testid="link-back-admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-emerald-600" />
                  {t("proposal.tracker.title")}
                </h1>
                <p className="text-sm text-gray-500">Acompanhe suas propostas comerciais</p>
              </div>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="gap-2"
              data-testid="button-create-proposal"
            >
              <Plus className="h-4 w-4" />
              Nova Proposta
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.total")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.sent")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-sent">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.viewed")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-viewed">{stats.viewed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.accepted")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-accepted">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.conversion")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-conversion">{stats.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("proposal.tracker.title")}</CardTitle>
              <Select value={filter} onValueChange={(v) => setFilter(v as ProposalStatus)}>
                <SelectTrigger className="w-40" data-testid="select-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("proposal.tracker.filter.all")}</SelectItem>
                  <SelectItem value="draft">{t("proposal.tracker.filter.draft")}</SelectItem>
                  <SelectItem value="sent">{t("proposal.tracker.filter.sent")}</SelectItem>
                  <SelectItem value="viewed">{t("proposal.tracker.filter.viewed")}</SelectItem>
                  <SelectItem value="accepted">{t("proposal.tracker.filter.accepted")}</SelectItem>
                  <SelectItem value="rejected">{t("proposal.tracker.filter.rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma proposta encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Proposta</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Valor</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Economia</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Views</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Validade</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProposals.map((proposal: Proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50" data-testid={`row-proposal-${proposal.id}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{proposal.proposalNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(proposal.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {proposal.clientName || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(proposal.proposedAnnualCost)}
                          <div className="text-xs text-gray-500">/ano</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-600 font-medium">
                            {formatCurrency(proposal.annualSavings)}
                          </span>
                          <div className="text-xs text-gray-500">{proposal.savingsPercentage}%</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[proposal.status || "draft"]}>
                            {t(`proposal.status.${proposal.status}` as any) || proposal.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span>{proposal.viewedCount || 0}</span>
                          </div>
                          {proposal.lastViewed && (
                            <div className="text-xs text-gray-500">
                              {formatDate(proposal.lastViewed)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatDate(proposal.validUntil)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${proposal.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyLink(proposal.trackingToken || "")}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => window.open(`/proposal/view/${proposal.trackingToken}`, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {proposal.status === "draft" && (
                                <DropdownMenuItem 
                                  onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "sent" })}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Marcar Enviada
                                </DropdownMenuItem>
                              )}
                              {["sent", "viewed", "negotiating"].includes(proposal.status || "") && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "accepted" })}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                    Marcar Aceita
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "rejected" })}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                    Marcar Recusada
                                  </DropdownMenuItem>
                                </>
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

      {/* Create Proposal Wizard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Nova Proposta Comercial
            </DialogTitle>
            <DialogDescription>
              Passo {wizardStep} de 3 - {wizardStep === 1 ? "Selecione o cliente" : wizardStep === 2 ? "Selecione a cotação" : "Confirme os dados"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === wizardStep 
                      ? "bg-emerald-600 text-white" 
                      : step < wizardStep 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    {step < wizardStep ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-0.5 ${step < wizardStep ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Select Client */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Building className="h-4 w-4" />
                  Selecione o cliente para a proposta
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.companyName} - {client.cnpj || "Sem CNPJ"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {clients.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Nenhum cliente cadastrado. Crie um cliente antes de criar propostas.
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Select Quote */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Zap className="h-4 w-4" />
                  Selecione a cotação de fornecedor
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote">Cotação</Label>
                  <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                    <SelectTrigger data-testid="select-quote">
                      <SelectValue placeholder="Selecione uma cotação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {quotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id.toString()}>
                          {(quote as any).supplierName || `Quote #${quote.id}`} - 
                          {quote.pricePerMwh ? ` R$ ${quote.pricePerMwh}/MWh` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {quotes.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Nenhuma cotação disponível. Solicite cotações aos fornecedores primeiro.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Confirm & Settings */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <DollarSign className="h-4 w-4" />
                  Confirme os dados da proposta
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cliente:</span>
                    <span className="font-medium">
                      {clients.find(c => c.id === parseInt(selectedClientId))?.companyName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cotação:</span>
                    <span className="font-medium">
                      {quotes.find(q => q.id === parseInt(selectedQuoteId))?.id || "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity">Validade da proposta (dias)</Label>
                  <Select value={validityDays} onValueChange={setValidityDays}>
                    <SelectTrigger data-testid="select-validity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="45">45 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {wizardStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setWizardStep(wizardStep - 1)}
                  data-testid="button-wizard-back"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setCreateDialogOpen(false);
                  setWizardStep(1);
                  setSelectedClientId("");
                  setSelectedQuoteId("");
                }}
              >
                Cancelar
              </Button>
              {wizardStep < 3 ? (
                <Button 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={
                    (wizardStep === 1 && !selectedClientId) ||
                    (wizardStep === 2 && !selectedQuoteId)
                  }
                  data-testid="button-wizard-next"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateProposal}
                  disabled={createProposalMutation.isPending}
                  data-testid="button-create-proposal-submit"
                >
                  {createProposalMutation.isPending ? "Criando..." : "Criar Proposta"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
