import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Plus, 
  FileText, 
  Send, 
  Eye, 
  Check, 
  X,
  Loader2,
  ExternalLink,
  Star,
  DollarSign,
  Trash2,
  Clock,
  Copy,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EligibleQuote {
  id: string;
  supplierId: number;
  supplierName?: string;
  energyType: string;
  clientEnergyPriceRmwh: string;
  validUntil: string;
  termMonths: number;
  priceStructure: string | null;
}

interface ProposalItem {
  id: number;
  proposalId: string;
  dealQuoteId: string;
  supplierId: number;
  supplierName: string;
  productType: string | null;
  marginType: string;
  marginValue: string;
  finalEnergyPriceRmwh: string;
  isRecommended: boolean;
  publicNotes: string | null;
}

interface Proposal {
  id: string;
  publicId: string;
  dealId: string;
  status: string;
  title: string | null;
  sentAt: string | null;
  publicEnabled: boolean;
  viewCount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATED: "bg-blue-100 text-blue-800",
  SENT: "bg-indigo-100 text-indigo-800",
  VIEWED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800"
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  GENERATED: "Gerada",
  SENT: "Enviada",
  VIEWED: "Visualizada",
  ACCEPTED: "Aceita",
  REJECTED: "Rejeitada",
  EXPIRED: "Expirada"
};

interface DealProposalsTabProps {
  dealId: string;
}

export function DealProposalsTab({ dealId }: DealProposalsTabProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    dealQuoteId: "",
    isRecommended: false,
    publicNotes: ""
  });

  const { data: proposalsData, isLoading: loadingProposals } = useQuery<any>({
    queryKey: [`/api/deals/${dealId}/proposals`],
  });

  const { data: eligibleQuotesData } = useQuery<any>({
    queryKey: [`/api/deals/${dealId}/eligible-quotes`],
  });

  const { data: proposalDetails } = useQuery<any>({
    queryKey: [`/api/proposals/${selectedProposal?.id}`],
    enabled: !!selectedProposal
  });

  const proposals: Proposal[] = proposalsData?.proposals || [];
  const eligibleQuotes: EligibleQuote[] = eligibleQuotesData?.quotes || [];
  const items: ProposalItem[] = proposalDetails?.items || [];

  const createProposalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/proposals`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Proposta criada com sucesso");
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/proposals`] });
        setCreateDialogOpen(false);
        setSelectedProposal(data.proposal);
      } else {
        toast.error(data.error || "Erro ao criar proposta");
      }
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: typeof newItemForm) => {
      const res = await apiRequest("POST", `/api/proposals/${selectedProposal!.id}/items`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Item adicionado");
        queryClient.invalidateQueries({ queryKey: [`/api/proposals/${selectedProposal?.id}`] });
        setAddItemDialogOpen(false);
        setNewItemForm({
          dealQuoteId: "",
          isRecommended: false,
          publicNotes: ""
        });
      } else {
        toast.error(data.error || "Erro ao adicionar item");
      }
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("DELETE", `/api/proposals/${selectedProposal!.id}/items/${itemId}`);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Item removido");
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${selectedProposal?.id}`] });
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/proposals/${selectedProposal!.id}/generate`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Proposta gerada com sucesso");
        queryClient.invalidateQueries({ queryKey: [`/api/proposals/${selectedProposal?.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/proposals`] });
        setSelectedProposal(data.proposal);
      } else {
        toast.error(data.error || "Erro ao gerar proposta");
      }
    }
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/proposals/${selectedProposal!.id}/send`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Proposta marcada como enviada");
        queryClient.invalidateQueries({ queryKey: [`/api/proposals/${selectedProposal?.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/proposals`] });
        setSelectedProposal(data.proposal);
      } else {
        toast.error(data.error || "Erro ao marcar como enviada");
      }
    }
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("POST", `/api/proposals/${selectedProposal!.id}/status`, { status });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Status atualizado");
        queryClient.invalidateQueries({ queryKey: [`/api/proposals/${selectedProposal?.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/proposals`] });
        setSelectedProposal(data.proposal);
      }
    }
  });

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/proposta/${selectedProposal?.publicId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  if (loadingProposals) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Propostas Comerciais</h3>
          <p className="text-sm text-muted-foreground">
            Crie propostas com base em cotações com preço ao cliente definido
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-proposal-btn" disabled={eligibleQuotes.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Proposta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Proposta</DialogTitle>
              <DialogDescription>
                Crie uma nova proposta comercial para enviar ao cliente
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                A proposta será criada em modo rascunho. Você poderá adicionar cotações, 
                configurar margens e visualizar antes de enviar ao cliente.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createProposalMutation.mutate()}
                disabled={createProposalMutation.isPending}
              >
                {createProposalMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Criar Proposta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {eligibleQuotes.length === 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">
              Nenhuma cotação elegível para propostas
            </p>
            <p className="text-sm text-orange-600 mt-1">
              Antes de criar propostas, acesse a aba "Cotações" e defina o preço ao cliente 
              clicando em "Definir Preço ao Cliente" em cada cotação que deseja incluir.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Propostas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma proposta criada
                </p>
              ) : (
                proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProposal?.id === proposal.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    data-testid={`proposal-item-${proposal.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {proposal.title || `Proposta ${proposal.id.slice(-6)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className={statusColors[proposal.status]}>
                        {statusLabels[proposal.status]}
                      </Badge>
                    </div>
                    {proposal.viewCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {proposal.viewCount} visualização{proposal.viewCount !== 1 ? "ões" : ""}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedProposal ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedProposal.title || `Proposta ${selectedProposal.id.slice(-6)}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[selectedProposal.status]}>
                        {statusLabels[selectedProposal.status]}
                      </Badge>
                      {selectedProposal.viewCount > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <Eye className="w-3 h-3" />
                          {selectedProposal.viewCount} views
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedProposal.status === "DRAFT" && (
                      <Button
                        size="sm"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending || items.length === 0}
                        data-testid="generate-proposal-btn"
                      >
                        {generateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Gerar
                          </>
                        )}
                      </Button>
                    )}
                    {["GENERATED", "SENT", "VIEWED"].includes(selectedProposal.status) && (
                      <>
                        {selectedProposal.status === "GENERATED" && (
                          <Button
                            size="sm"
                            onClick={() => sendMutation.mutate()}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Marcar Enviada
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyPublicUrl}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a 
                            href={`/proposta/${selectedProposal.publicId}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Visualizar
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a 
                            href={`/api/proposals/${selectedProposal.id}/pdf`}
                            download
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      </>
                    )}
                    {["SENT", "VIEWED"].includes(selectedProposal.status) && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => statusMutation.mutate("ACCEPTED")}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => statusMutation.mutate("REJECTED")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProposal.status === "DRAFT" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Itens da Proposta</h4>
                      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={eligibleQuotes.length === 0}>
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar Cotação
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Cotação à Proposta</DialogTitle>
                            <DialogDescription>
                              Selecione uma cotação com preço ao cliente já definido
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {eligibleQuotes.length === 0 ? (
                              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                                <DollarSign className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                                <p className="text-sm font-medium text-orange-800">
                                  Nenhuma cotação elegível
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                  Defina o preço ao cliente nas cotações antes de criar propostas
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label>Cotação Elegível</Label>
                                  <Select
                                    value={newItemForm.dealQuoteId}
                                    onValueChange={(v) => setNewItemForm(f => ({ ...f, dealQuoteId: v }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma cotação" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {eligibleQuotes.map((q) => (
                                        <SelectItem key={q.id} value={q.id}>
                                          {q.supplierName || `Fornecedor ${q.supplierId}`} - R$ {parseFloat(q.clientEnergyPriceRmwh).toFixed(2)}/MWh
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {newItemForm.dealQuoteId && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-green-700">Preço ao Cliente:</span>
                                      <span className="text-lg font-bold text-green-800">
                                        R$ {parseFloat(eligibleQuotes.find(q => q.id === newItemForm.dealQuoteId)?.clientEnergyPriceRmwh || "0").toFixed(2)}/MWh
                                      </span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                      Este valor inclui a margem Ótima e será exibido ao cliente
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="isRecommended"
                                    checked={newItemForm.isRecommended}
                                    onCheckedChange={(c) => setNewItemForm(f => ({ ...f, isRecommended: !!c }))}
                                  />
                                  <Label htmlFor="isRecommended" className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    Marcar como recomendada
                                  </Label>
                                </div>

                                <div className="space-y-2">
                                  <Label>Notas para o cliente (opcional)</Label>
                                  <Textarea
                                    value={newItemForm.publicNotes}
                                    onChange={(e) => setNewItemForm(f => ({ ...f, publicNotes: e.target.value }))}
                                    placeholder="Observações que aparecerão na proposta"
                                    rows={2}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => addItemMutation.mutate(newItemForm)}
                              disabled={!newItemForm.dealQuoteId || addItemMutation.isPending}
                            >
                              {addItemMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              )}
                              Adicionar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Adicione cotações para criar a proposta</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-lg border ${item.isRecommended ? "border-amber-300 bg-amber-50" : ""}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{item.supplierName}</p>
                                  {item.isRecommended && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                      <Star className="w-3 h-3 mr-1 fill-amber-500" />
                                      Recomendada
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.productType || "Energia"}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">
                                    R$ {parseFloat(item.finalEnergyPriceRmwh).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">por MWh</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => deleteItemMutation.mutate(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {item.publicNotes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                "{item.publicNotes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {items.length > 0 && !items.some(i => i.isRecommended) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Marque pelo menos uma cotação como "recomendada" para gerar a proposta.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedProposal.status !== "DRAFT" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Esta proposta foi gerada e está disponível para o cliente.
                      </p>
                      {selectedProposal.sentAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviada {formatDistanceToNow(new Date(selectedProposal.sentAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Itens da Proposta</h4>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-lg border ${item.isRecommended ? "border-amber-300 bg-amber-50" : ""}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.supplierName}</p>
                                {item.isRecommended && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                                    <Star className="w-3 h-3 mr-1 fill-amber-500" />
                                    Recomendada
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.productType || "Energia"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                R$ {parseFloat(item.finalEnergyPriceRmwh).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">por MWh</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Selecione uma proposta para ver os detalhes
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou crie uma nova proposta para começar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
