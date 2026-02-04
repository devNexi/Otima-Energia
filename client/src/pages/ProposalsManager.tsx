import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Building,
  Zap,
  DollarSign,
  Download,
  Star,
  Loader2,
  AlertCircle,
  Mail,
  FileDown
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
  annualEnergyCost: string | null;
  savingsAnnual: string | null;
  savingsPercent: string | null;
  isRecommended?: boolean;
}

interface Deal {
  id: string;
  clientId: number;
  clientName?: string;
  companyName?: string;
  status: string;
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

export default function ProposalsManager() {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const { sessionId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<DealProposal | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendMessage, setSendMessage] = useState("");

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

  const createProposalMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const res = await fetch(`/api/deals/${dealId}/proposals`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
        body: JSON.stringify({
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deal-proposals"] });
      setCreateDialogOpen(false);
      setSelectedDealId("");
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

  const generatePdfMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const res = await fetch(`/api/proposals/${proposalId}/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate PDF");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deal-proposals"] });
      toast({ title: "PDF gerado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao gerar PDF", 
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
                  {language === "pt" ? "Propostas Comerciais" : "Commercial Proposals"}
                </h1>
                <p className="text-sm text-gray-500">
                  {language === "pt" ? "Gerencie e envie propostas para clientes" : "Manage and send proposals to clients"}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="gap-2"
              data-testid="button-create-proposal"
            >
              <Plus className="h-4 w-4" />
              {language === "pt" ? "Nova Proposta" : "New Proposal"}
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
              <CardTitle>{language === "pt" ? "Todas as Propostas" : "All Proposals"}</CardTitle>
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
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{language === "pt" ? "Nenhuma proposta encontrada" : "No proposals found"}</p>
                <p className="text-sm mt-2">
                  {language === "pt" 
                    ? "Crie uma proposta a partir de um negócio com cotações" 
                    : "Create a proposal from a deal with quotes"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Negócio/Cliente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Título</th>
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
                          <div className="text-xs text-gray-500">ID: {proposal.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3">
                          {proposal.proposalTitle || "Proposta Comercial"}
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
                              {proposal.status === "DRAFT" && (
                                <DropdownMenuItem 
                                  onClick={() => generatePdfMutation.mutate(proposal.id)}
                                  disabled={generatePdfMutation.isPending}
                                >
                                  <FileDown className="h-4 w-4 mr-2" />
                                  Gerar PDF
                                </DropdownMenuItem>
                              )}
                              {["DRAFT", "GENERATED"].includes(proposal.status) && (
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
                                <DropdownMenuItem onClick={() => window.open(`/api/documents/${proposal.pdfDocId}/download`, "_blank")}>
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

      {/* Create Proposal Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              {language === "pt" ? "Nova Proposta" : "New Proposal"}
            </DialogTitle>
            <DialogDescription>
              {language === "pt" 
                ? "Selecione um negócio para criar uma proposta" 
                : "Select a deal to create a proposal"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>{language === "pt" ? "Negócio" : "Deal"}</Label>
              <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                <SelectTrigger data-testid="select-deal">
                  <SelectValue placeholder={language === "pt" ? "Selecione um negócio..." : "Select a deal..."} />
                </SelectTrigger>
                <SelectContent>
                  {deals.filter(d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.status)).map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.companyName || deal.clientName || `Deal ${deal.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {deals.filter(d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.status)).length === 0 && (
              <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    {language === "pt" ? "Nenhum negócio ativo" : "No active deals"}
                  </p>
                  <p className="text-sm text-amber-600">
                    {language === "pt" 
                      ? "Crie um negócio com cotações de fornecedores antes de gerar propostas." 
                      : "Create a deal with supplier quotes before generating proposals."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createProposalMutation.mutate(selectedDealId)}
              disabled={!selectedDealId || createProposalMutation.isPending}
              data-testid="button-create-proposal-submit"
            >
              {createProposalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Proposta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Proposal Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              {language === "pt" ? "Enviar Proposta" : "Send Proposal"}
            </DialogTitle>
            <DialogDescription>
              {language === "pt" 
                ? "Envie a proposta por email para o cliente" 
                : "Send the proposal via email to the client"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{language === "pt" ? "Email do destinatário" : "Recipient email"}</Label>
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
              <Label htmlFor="message">{language === "pt" ? "Mensagem personalizada (opcional)" : "Custom message (optional)"}</Label>
              <Textarea
                id="message"
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder={language === "pt" ? "Adicione uma mensagem personalizada..." : "Add a custom message..."}
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
                      <Card key={item.id} className={item.id === selectedProposal?.recommendedItemId ? "border-emerald-500 border-2" : ""}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{item.supplierName}</span>
                              {item.id === selectedProposal?.recommendedItemId && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  <Star className="h-3 w-3 mr-1" />
                                  Recomendada
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline">{item.productType}</Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Prazo</p>
                              <p className="font-medium">{item.termMonths} meses</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Preço</p>
                              <p className="font-medium">R$ {parseFloat(item.finalPriceRmwh).toFixed(2)}/MWh</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Custo Anual</p>
                              <p className="font-medium">{formatCurrency(item.annualEnergyCost)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Economia</p>
                              <p className="font-medium text-emerald-600">
                                {formatCurrency(item.savingsAnnual)}
                                {item.savingsPercent && ` (${parseFloat(item.savingsPercent).toFixed(1)}%)`}
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
                    <p className="text-sm mt-2">Adicione cotações de fornecedores a esta proposta</p>
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
              {selectedProposal?.status === "DRAFT" && (
                <Button 
                  variant="outline"
                  onClick={() => generatePdfMutation.mutate(selectedProposal.id)}
                  disabled={generatePdfMutation.isPending}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              )}
              {selectedProposal && ["DRAFT", "GENERATED"].includes(selectedProposal.status) && (
                <Button onClick={() => setSendDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
