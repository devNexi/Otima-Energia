import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ContextualTooltip } from "@/components/ops/ContextualTooltip";
import { 
  Loader2, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  Eye,
  Timer,
  AlertTriangle,
  DollarSign
} from "lucide-react";

interface BlindAuctionPanelProps {
  dealId: string;
}

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  PHONE: Phone,
  PORTAL: Globe
};

const DISPATCH_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  RESPONDED: "bg-green-100 text-green-800",
  NO_RESPONSE: "bg-red-100 text-red-800"
};

export function BlindAuctionPanel({ dealId }: BlindAuctionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDispatch, setPreviewDispatch] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("EMAIL");
  const [quoteIntakeDispatch, setQuoteIntakeDispatch] = useState<any>(null);
  const [quoteForm, setQuoteForm] = useState({
    pricePerMwh: "",
    priceStructure: "FIXED",
    termMonths: "12",
    validUntil: "",
    notes: ""
  });

  const { data: auctionData, isLoading, refetch } = useQuery<any>({
    queryKey: [`/api/deals/${dealId}/blind-auction`],
  });

  const createDispatchMutation = useMutation({
    mutationFn: async (data: { supplierId: number; channelUsed: string; messageBody?: string }) => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/rfq-dispatches`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "RFQ draft created", description: "Dispatch prepared for sending" });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/blind-auction`] });
        setCreateDialogOpen(false);
        setSelectedSuppliers([]);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    }
  });

  const markSentMutation = useMutation({
    mutationFn: async (dispatchId: number) => {
      const res = await apiRequest("POST", `/api/rfq-dispatches/${dispatchId}/mark-sent`, {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Marked as sent", description: "SLA timer started" });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/blind-auction`] });
      }
    }
  });

  const markRespondedMutation = useMutation({
    mutationFn: async (dispatchId: number) => {
      const res = await apiRequest("POST", `/api/rfq-dispatches/${dispatchId}/mark-responded`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Quote received", description: "Dispatch marked as responded" });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/blind-auction`] });
      }
    }
  });

  const followupMutation = useMutation({
    mutationFn: async (dispatchId: number) => {
      const res = await apiRequest("POST", `/api/rfq-dispatches/${dispatchId}/followup`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Follow-up logged", description: `Total follow-ups: ${data.dispatch.followupCount}` });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/blind-auction`] });
      }
    }
  });

  const recordQuoteMutation = useMutation({
    mutationFn: async (data: { supplierId: number; dispatchId: number }) => {
      const res = await apiRequest("POST", `/api/deals/${dealId}/quotes`, {
        supplierId: data.supplierId,
        rfqDispatchId: data.dispatchId,
        pricePerMwh: parseFloat(quoteForm.pricePerMwh),
        priceStructure: quoteForm.priceStructure,
        termMonths: parseInt(quoteForm.termMonths),
        validUntil: quoteForm.validUntil || null,
        internalNotes: quoteForm.notes || null,
        receivedVia: "RFQ_DISPATCH"
      });
      return res.json();
    },
    onSuccess: async (data, variables) => {
      if (data.success) {
        await markRespondedMutation.mutateAsync(variables.dispatchId);
        toast({ title: "Quote recorded", description: "Quote saved and dispatch marked as responded" });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/blind-auction`] });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}`] });
        setQuoteIntakeDispatch(null);
        setQuoteForm({ pricePerMwh: "", priceStructure: "FIXED", termMonths: "12", validUntil: "", notes: "" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const { deal, client, dossier, dossierReady, dispatches, availableSuppliers, stats } = auctionData || {};

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Text copied to clipboard" });
  };

  const generateRfqMessage = (supplier: any) => {
    return `Dear ${supplier?.name || 'Supplier'},

We are requesting a quote for energy supply on behalf of our client.

Client Details:
- Company: ${client?.companyName || 'N/A'}
- Estimated Consumption: ${dossier?.consumptionMwh || 'TBD'} MWh/month
- Contract Start: ${deal?.contractStartDate || 'Flexible'}
- Contract Term: ${deal?.contractMonths || 12} months

Please provide your best offer including:
1. Price per MWh (R$)
2. Price structure (fixed/indexed)
3. Contract terms and conditions
4. Validity period of the quote

Response Deadline: Within 3 business days

Best regards,
Ótima Energia Team`;
  };

  const alreadySentSupplierIds = dispatches?.map((d: any) => d.supplierId) || [];
  const availableToSend = availableSuppliers?.filter((s: any) => !alreadySentSupplierIds.includes(s.id)) || [];

  const handleCreateDispatches = async () => {
    for (const supplierId of selectedSuppliers) {
      await createDispatchMutation.mutateAsync({
        supplierId,
        channelUsed: selectedChannel,
        messageBody: customMessage || undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Compare Offers - RFQ Distribution</h2>
          <p className="text-sm text-gray-500">
            Request quotes from eligible suppliers and compare offers
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          data-testid="button-refresh-auction"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-gray-500">Eligible Suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats?.sent || 0}</div>
            <p className="text-xs text-gray-500">RFQs Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats?.responded || 0}</div>
            <p className="text-xs text-gray-500">Responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats?.awaitingResponse || 0}</div>
            <p className="text-xs text-gray-500">Awaiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
            <p className="text-xs text-gray-500">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            {dossierReady ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Client Dossier is ready (status: {dossier?.status})</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  Client Dossier needs to be marked READY before sending RFQs
                </span>
              </>
            )}
          </div>
          {dossier?.status === 'LOCKED' && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">Dossier is locked - snapshot preserved for this RFQ</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Request Quotes</CardTitle>
            <CardDescription>Select eligible suppliers to compare offers</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <ContextualTooltip
                tooltipKey="rfq_prepare_dispatch"
                title="Preparar Envio de RFQs"
                content="Selecione os fornecedores e configure a mensagem antes de enviar. Cada fornecedor receberá uma cópia da mensagem pelo canal escolhido."
                whyMatters="Enviar RFQs incompletos ou incorretos atrasa o processo e pode prejudicar relações com fornecedores."
                mode="hover"
              >
                <Button 
                  disabled={selectedSuppliers.length === 0 || !dossierReady}
                  data-testid="button-prepare-rfqs"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Prepare RFQs ({selectedSuppliers.length})
                </Button>
              </ContextualTooltip>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Prepare RFQ Dispatches</DialogTitle>
                <DialogDescription>
                  Configure the message and channel for {selectedSuppliers.length} suppliers
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Channel</label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="PORTAL">Portal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message Template</label>
                  <Textarea 
                    value={customMessage || generateRfqMessage(availableSuppliers?.[0])}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="input-rfq-message"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(customMessage || generateRfqMessage(availableSuppliers?.[0]))}
                    data-testid="button-copy-message"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Message
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDispatches}
                  disabled={createDispatchMutation.isPending}
                  data-testid="button-create-dispatches"
                >
                  {createDispatchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Dispatches
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {availableToSend?.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              All eligible suppliers have been contacted.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableToSend?.map((supplier: any) => {
                const isSelected = selectedSuppliers.includes(supplier.id);
                return (
                  <div 
                    key={supplier.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSuppliers(prev => prev.filter(id => id !== supplier.id));
                      } else {
                        setSelectedSuppliers(prev => [...prev, supplier.id]);
                      }
                    }}
                    data-testid={`supplier-select-${supplier.id}`}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.tradingName || 'Energy Supplier'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Dispatches ({dispatches?.length || 0})
          </CardTitle>
          <CardDescription>Track sent RFQs and their response status</CardDescription>
        </CardHeader>
        <CardContent>
          {dispatches?.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No RFQ dispatches yet. Select eligible suppliers above to begin comparing offers.</p>
          ) : (
            <div className="space-y-3">
              {dispatches?.map((dispatch: any) => {
                const ChannelIcon = CHANNEL_ICONS[dispatch.channelUsed] || Mail;
                const isOverdue = dispatch.status === 'SENT' && dispatch.dueAt && new Date(dispatch.dueAt) < new Date();
                const hoursRemaining = dispatch.dueAt 
                  ? Math.round((new Date(dispatch.dueAt).getTime() - Date.now()) / (1000 * 60 * 60))
                  : null;
                
                return (
                  <div 
                    key={dispatch.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isOverdue ? 'border-red-300 bg-red-50' : ''
                    }`}
                    data-testid={`dispatch-row-${dispatch.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <ChannelIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{dispatch.supplier?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge className={DISPATCH_STATUS_COLORS[dispatch.status]}>
                            {dispatch.status}
                          </Badge>
                          {dispatch.sentAt && (
                            <span>Sent: {new Date(dispatch.sentAt).toLocaleDateString()}</span>
                          )}
                          {dispatch.followupCount > 0 && (
                            <span className="text-amber-600">+{dispatch.followupCount} follow-ups</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {dispatch.status === 'SENT' && hoursRemaining !== null && (
                        <div className={`flex items-center gap-1 text-sm ${
                          isOverdue ? 'text-red-600' : hoursRemaining < 24 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          <Timer className="h-4 w-4" />
                          {isOverdue ? (
                            <span>Overdue by {Math.abs(hoursRemaining)}h</span>
                          ) : (
                            <span>{hoursRemaining}h left</span>
                          )}
                        </div>
                      )}
                      
                      {dispatch.status === 'DRAFT' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPreviewDispatch(dispatch)}
                            data-testid={`button-preview-${dispatch.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => markSentMutation.mutate(dispatch.id)}
                            disabled={markSentMutation.isPending}
                            data-testid={`button-mark-sent-${dispatch.id}`}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Mark Sent
                          </Button>
                        </>
                      )}
                      
                      {dispatch.status === 'SENT' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => followupMutation.mutate(dispatch.id)}
                            disabled={followupMutation.isPending}
                            data-testid={`button-followup-${dispatch.id}`}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Log Follow-up
                          </Button>
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => setQuoteIntakeDispatch(dispatch)}
                            data-testid={`button-record-quote-${dispatch.id}`}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Record Quote
                          </Button>
                        </>
                      )}
                      
                      {dispatch.status === 'RESPONDED' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewDispatch} onOpenChange={() => setPreviewDispatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>RFQ Preview - {previewDispatch?.supplier?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Channel</label>
              <p className="font-medium">{previewDispatch?.channelUsed}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Message</label>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {previewDispatch?.messageBody || generateRfqMessage(previewDispatch?.supplier)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(previewDispatch?.messageBody || generateRfqMessage(previewDispatch?.supplier))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Message
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDispatch(null)}>Close</Button>
            <Button 
              onClick={() => {
                markSentMutation.mutate(previewDispatch.id);
                setPreviewDispatch(null);
              }}
            >
              <Send className="h-4 w-4 mr-1" />
              Mark as Sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!quoteIntakeDispatch} onOpenChange={() => setQuoteIntakeDispatch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Record Quote - {quoteIntakeDispatch?.supplier?.name}
            </DialogTitle>
            <DialogDescription>
              Enter the quote details received from this supplier
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerMwh">Price per MWh (R$)</Label>
                <Input 
                  id="pricePerMwh"
                  type="number"
                  step="0.01"
                  placeholder="250.00"
                  value={quoteForm.pricePerMwh}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, pricePerMwh: e.target.value }))}
                  data-testid="input-quote-price"
                />
              </div>
              <div>
                <Label htmlFor="termMonths">Term (Months)</Label>
                <Select 
                  value={quoteForm.termMonths} 
                  onValueChange={(v) => setQuoteForm(prev => ({ ...prev, termMonths: v }))}
                >
                  <SelectTrigger id="termMonths">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="48">48 months</SelectItem>
                    <SelectItem value="60">60 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceStructure">Price Structure</Label>
                <Select 
                  value={quoteForm.priceStructure} 
                  onValueChange={(v) => setQuoteForm(prev => ({ ...prev, priceStructure: v }))}
                >
                  <SelectTrigger id="priceStructure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Price</SelectItem>
                    <SelectItem value="INDEXED">Indexed (IPCA)</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input 
                  id="validUntil"
                  type="date"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, validUntil: e.target.value }))}
                  data-testid="input-quote-valid-until"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea 
                id="notes"
                placeholder="Any additional notes about this quote..."
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                data-testid="input-quote-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteIntakeDispatch(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => recordQuoteMutation.mutate({
                supplierId: quoteIntakeDispatch.supplierId,
                dispatchId: quoteIntakeDispatch.id
              })}
              disabled={!quoteForm.pricePerMwh || recordQuoteMutation.isPending}
              data-testid="button-save-quote"
            >
              {recordQuoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
