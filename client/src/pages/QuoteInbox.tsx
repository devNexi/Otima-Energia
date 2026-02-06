import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import {
  Mail,
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  FileText,
  Zap,
  AlertCircle,
  Eye,
  Paperclip,
  RefreshCw,
  Search,
  ChevronRight,
  Building,
  Calendar,
  DollarSign,
  BarChart3,
  Check,
  X,
  Info,
} from "lucide-react";

interface InboundEmail {
  id: number;
  fromEmail: string | null;
  fromName: string | null;
  toEmail: string | null;
  subject: string | null;
  textBody: string | null;
  htmlBody: string | null;
  attachmentCount: number;
  attachmentNames: string[] | null;
  status: string;
  dealId: string | null;
  quoteId: string | null;
  processedAt: string | null;
  errorMessage: string | null;
  receivedAt: string;
}

interface ParsedFields {
  supplierName: string | null;
  energyPriceRmwh: string | null;
  contractDurationMonths: number | null;
  energyType: string | null;
  priceStructure: string | null;
  contractStart: string | null;
  validUntil: string | null;
  volume: string | null;
  submarket: string | null;
  quoteReference: string | null;
  confidence: number;
  extractedPairs: Record<string, string>;
}

interface Deal {
  id: string;
  clientName: string;
  currentState: string;
}

interface Supplier {
  id: number;
  name: string;
  shortCode: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: <Clock className="w-3 h-3" /> },
  PROCESSED: { label: "Confirmed", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  DISMISSED: { label: "Dismissed", color: "bg-gray-100 text-gray-600", icon: <XCircle className="w-3 h-3" /> },
  ERROR: { label: "Error", color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function QuoteInbox() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [confirmForm, setConfirmForm] = useState({
    dealId: "",
    supplierId: "",
    energyPriceRmwh: "",
    contractDurationMonths: "",
    energyType: "",
    priceStructure: "",
    validUntil: "",
    quoteReference: "",
    volume: "",
  });

  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/inbound/emails"],
    queryFn: async () => {
      const res = await fetch("/api/inbound/emails", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: dealsData } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deals");
      return res.json();
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
  });

  const parseMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const res = await fetch(`/api/inbound/emails/${emailId}/parse`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to parse email");
      return res.json();
    },
    onSuccess: (data) => {
      setParsedFields(data.parsed);
      setConfirmForm({
        dealId: "",
        supplierId: "",
        energyPriceRmwh: data.parsed.energyPriceRmwh || "",
        contractDurationMonths: data.parsed.contractDurationMonths?.toString() || "",
        energyType: data.parsed.energyType || "",
        priceStructure: data.parsed.priceStructure || "",
        validUntil: data.parsed.validUntil || "",
        quoteReference: data.parsed.quoteReference || "",
        volume: data.parsed.volume || "",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ emailId, formData }: { emailId: number; formData: typeof confirmForm }) => {
      const res = await fetch(`/api/inbound/emails/${emailId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Quote created", description: "Email confirmed and added to deal quote matrix." });
      queryClient.invalidateQueries({ queryKey: ["/api/inbound/emails"] });
      setShowConfirmDialog(false);
      setSelectedEmail(null);
      setParsedFields(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const res = await fetch(`/api/inbound/emails/${emailId}/dismiss`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to dismiss");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dismissed", description: "Email archived." });
      queryClient.invalidateQueries({ queryKey: ["/api/inbound/emails"] });
      setSelectedEmail(null);
      setParsedFields(null);
    },
  });

  if (authLoading) return null;
  if (!user || !['admin', 'ops', 'sales'].includes(user.role)) return <Redirect to="/admin/deals" />;

  const emails: InboundEmail[] = emailsData?.emails || [];
  const deals: Deal[] = dealsData?.deals || dealsData || [];
  const suppliers: Supplier[] = suppliersData?.suppliers || suppliersData || [];

  const filteredEmails = filterStatus === "ALL" ? emails : emails.filter(e => e.status === filterStatus);

  const pendingCount = emails.filter(e => e.status === "PENDING").length;
  const processedCount = emails.filter(e => e.status === "PROCESSED").length;

  const handleSelectEmail = async (email: InboundEmail) => {
    setSelectedEmail(email);
    setParsedFields(null);

    if (email.status === "PENDING") {
      setIsParsing(true);
      try {
        await parseMutation.mutateAsync(email.id);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedEmail) return;
    if (!confirmForm.dealId || !confirmForm.supplierId) {
      toast({ title: "Required fields", description: "Please select a Deal and Supplier.", variant: "destructive" });
      return;
    }
    confirmMutation.mutate({ emailId: selectedEmail.id, formData: confirmForm });
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return d; }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-quote-inbox-title">
              <Inbox className="w-6 h-6 text-teal-600" />
              Quote Inbox
            </h1>
            <p className="text-gray-500 mt-1">
              Inbound quotes from rfq@otimaenergia.com — parse, review, and confirm into deals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-teal-100 text-teal-800 text-sm px-3 py-1" data-testid="badge-pending-count">
              {pendingCount} pending
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1" data-testid="badge-processed-count">
              {processedCount} confirmed
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/inbound/emails"] })}
              data-testid="button-refresh-inbox"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {["ALL", "PENDING", "PROCESSED", "DISMISSED"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              data-testid={`filter-${status.toLowerCase()}`}
            >
              {status === "ALL" ? "All" : STATUS_CONFIG[status]?.label || status}
              {status !== "ALL" && (
                <span className="ml-1 text-xs">
                  ({emails.filter(e => status === "ALL" || e.status === status).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Email List - Left Panel */}
          <div className="col-span-4 space-y-2">
            {emailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No emails found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Quotes sent to rfq@otimaenergia.com will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEmails.map((email) => {
                const statusCfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.PENDING;
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <Card
                    key={email.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-teal-500 bg-teal-50/30" : ""
                    }`}
                    onClick={() => handleSelectEmail(email)}
                    data-testid={`email-card-${email.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" data-testid={`email-from-${email.id}`}>
                            {email.fromName || email.fromEmail || "Unknown sender"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {email.fromEmail}
                          </p>
                        </div>
                        <Badge className={`${statusCfg.color} text-xs ml-2 flex-shrink-0`}>
                          {statusCfg.icon}
                          <span className="ml-1">{statusCfg.label}</span>
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mb-1" data-testid={`email-subject-${email.id}`}>
                        {email.subject || "(No subject)"}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {email.textBody?.substring(0, 120) || "(No body)"}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span>{formatDate(email.receivedAt)}</span>
                        <div className="flex items-center gap-2">
                          {email.attachmentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {email.attachmentCount}
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Detail / Review Panel - Right Panel */}
          <div className="col-span-8">
            {!selectedEmail ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <Eye className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Select an email to review</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click on an email from the list to see its content and parsed fields
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Email Header */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg" data-testid="text-email-detail-subject">
                          {selectedEmail.subject || "(No subject)"}
                        </CardTitle>
                        <CardDescription>
                          From: <strong>{selectedEmail.fromName || "Unknown"}</strong> &lt;{selectedEmail.fromEmail}&gt;
                          <span className="mx-2">|</span>
                          {formatDate(selectedEmail.receivedAt)}
                          {selectedEmail.attachmentCount > 0 && (
                            <span className="ml-2">
                              <Paperclip className="w-3 h-3 inline" /> {selectedEmail.attachmentCount} attachment(s)
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedEmail.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => dismissMutation.mutate(selectedEmail.id)}
                              disabled={dismissMutation.isPending}
                              data-testid="button-dismiss-email"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setShowConfirmDialog(true)}
                              disabled={!parsedFields}
                              data-testid="button-confirm-quote"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Confirm Quote
                            </Button>
                          </>
                        )}
                        {selectedEmail.status === "PROCESSED" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirmed → Deal {selectedEmail.dealId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Side-by-side: Original + Parsed */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original Email Content */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Original Email
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700" data-testid="text-email-body">
                          {selectedEmail.textBody || selectedEmail.htmlBody || "(Empty body)"}
                        </pre>
                      </div>
                      {selectedEmail.attachmentNames && (selectedEmail.attachmentNames as string[]).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Attachments:</p>
                          <div className="space-y-1">
                            {(selectedEmail.attachmentNames as string[]).map((name, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">
                                <Paperclip className="w-3 h-3" />
                                {name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Parsed Fields */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-teal-600" />
                        Parsed Fields
                        {parsedFields && (
                          <Badge className={`ml-2 ${
                            parsedFields.confidence >= 0.5 ? "bg-green-100 text-green-800" :
                            parsedFields.confidence >= 0.3 ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {Math.round(parsedFields.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isParsing ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                          <span className="ml-2 text-sm text-gray-500">Parsing email...</span>
                        </div>
                      ) : parsedFields ? (
                        <div className="space-y-3">
                          <ParsedFieldRow
                            icon={<Building className="w-4 h-4" />}
                            label="Supplier"
                            value={parsedFields.supplierName}
                            matchKey={parsedFields.extractedPairs.supplier_match}
                          />
                          <ParsedFieldRow
                            icon={<DollarSign className="w-4 h-4" />}
                            label="Price (R$/MWh)"
                            value={parsedFields.energyPriceRmwh}
                            matchKey={parsedFields.extractedPairs.price_match}
                          />
                          <ParsedFieldRow
                            icon={<Calendar className="w-4 h-4" />}
                            label="Duration (months)"
                            value={parsedFields.contractDurationMonths?.toString()}
                            matchKey={parsedFields.extractedPairs.duration_match}
                          />
                          <ParsedFieldRow
                            icon={<Zap className="w-4 h-4" />}
                            label="Energy Type"
                            value={parsedFields.energyType}
                            matchKey={parsedFields.extractedPairs.energy_type_match}
                          />
                          <ParsedFieldRow
                            icon={<BarChart3 className="w-4 h-4" />}
                            label="Price Structure"
                            value={parsedFields.priceStructure}
                          />
                          <ParsedFieldRow
                            icon={<BarChart3 className="w-4 h-4" />}
                            label="Volume"
                            value={parsedFields.volume}
                            matchKey={parsedFields.extractedPairs.volume_match}
                          />
                          <ParsedFieldRow
                            icon={<FileText className="w-4 h-4" />}
                            label="Reference"
                            value={parsedFields.quoteReference}
                            matchKey={parsedFields.extractedPairs.reference_match}
                          />
                          <ParsedFieldRow
                            icon={<Calendar className="w-4 h-4" />}
                            label="Valid Until"
                            value={parsedFields.validUntil}
                          />
                          <ParsedFieldRow
                            icon={<Calendar className="w-4 h-4" />}
                            label="Contract Start"
                            value={parsedFields.contractStart}
                          />

                          {selectedEmail.status === "PENDING" && (
                            <div className="pt-3 border-t">
                              <Button
                                className="w-full"
                                onClick={() => setShowConfirmDialog(true)}
                                data-testid="button-open-confirm-dialog"
                              >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Confirm & Create Deal Quote
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : selectedEmail.status !== "PENDING" ? (
                        <div className="text-center py-8 text-gray-400">
                          <Info className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">This email has already been {selectedEmail.status.toLowerCase()}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Zap className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Parsing not yet run</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Dialog - Full form to map parsed fields to a deal */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-600" />
                Confirm Quote into Deal
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Deal *</Label>
                <Select value={confirmForm.dealId} onValueChange={(v) => setConfirmForm(f => ({ ...f, dealId: v }))}>
                  <SelectTrigger data-testid="select-deal">
                    <SelectValue placeholder="Select a deal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(deals) ? deals : []).map((deal: any) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.clientName || deal.client_name || deal.id} — {deal.currentState || deal.current_state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Supplier *</Label>
                <Select value={confirmForm.supplierId} onValueChange={(v) => setConfirmForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(suppliers) ? suppliers : []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.shortCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Energy Price (R$/MWh)</Label>
                  <Input
                    value={confirmForm.energyPriceRmwh}
                    onChange={(e) => setConfirmForm(f => ({ ...f, energyPriceRmwh: e.target.value }))}
                    placeholder="e.g. 150.00"
                    data-testid="input-energy-price"
                  />
                </div>
                <div>
                  <Label>Duration (months)</Label>
                  <Input
                    value={confirmForm.contractDurationMonths}
                    onChange={(e) => setConfirmForm(f => ({ ...f, contractDurationMonths: e.target.value }))}
                    placeholder="e.g. 36"
                    data-testid="input-duration"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Energy Type</Label>
                  <Select value={confirmForm.energyType} onValueChange={(v) => setConfirmForm(f => ({ ...f, energyType: v }))}>
                    <SelectTrigger data-testid="select-energy-type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Convencional">Convencional</SelectItem>
                      <SelectItem value="Incentivada 50%">Incentivada 50%</SelectItem>
                      <SelectItem value="Incentivada 100%">Incentivada 100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Price Structure</Label>
                  <Select value={confirmForm.priceStructure} onValueChange={(v) => setConfirmForm(f => ({ ...f, priceStructure: v }))}>
                    <SelectTrigger data-testid="select-price-structure">
                      <SelectValue placeholder="Select structure..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="PLD+Spread">PLD+Spread</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quote Reference</Label>
                  <Input
                    value={confirmForm.quoteReference}
                    onChange={(e) => setConfirmForm(f => ({ ...f, quoteReference: e.target.value }))}
                    placeholder="e.g. COT-2026-001"
                    data-testid="input-quote-ref"
                  />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    value={confirmForm.validUntil}
                    onChange={(e) => setConfirmForm(f => ({ ...f, validUntil: e.target.value }))}
                    placeholder="e.g. 2026-03-15"
                    data-testid="input-valid-until"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending || !confirmForm.dealId || !confirmForm.supplierId}
                data-testid="button-confirm-create-quote"
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Create Deal Quote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function ParsedFieldRow({ icon, label, value, matchKey }: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  matchKey?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        {value ? (
          <p className="text-sm font-medium text-gray-900" data-testid={`parsed-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">Not detected</p>
        )}
        {matchKey && (
          <p className="text-xs text-teal-600 mt-0.5">
            Matched: "{matchKey}"
          </p>
        )}
      </div>
      {value ? (
        <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
      ) : (
        <AlertCircle className="w-4 h-4 text-gray-300 mt-1" />
      )}
    </div>
  );
}
