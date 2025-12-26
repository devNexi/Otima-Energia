import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Settings, History, Mail, MessageSquare, Globe, FileText, Eye, Copy, Check, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface SubmissionChannels {
  email: { enabled: boolean };
  whatsapp: { enabled: boolean };
  portal: { enabled: boolean };
  excelTemplate: { enabled: boolean };
}

interface EmailConfig {
  to: string[];
  cc: string[];
  subjectTemplate: string;
  bodyTemplate: string;
}

interface WhatsAppConfig {
  messageTemplate: string;
}

interface PortalConfig {
  url: string;
  instructions: string;
}

interface RequiredField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "list" | "dropdown";
  required: boolean;
  validation?: { regex?: string; min?: number; max?: number };
  minItems?: number;
}

interface RequiredAttachment {
  key: string;
  label: string;
  required: boolean;
}

interface SupplierRfqAdapter {
  id: number;
  supplierId: number;
  version: number;
  status: "ACTIVE" | "RETIRED";
  name: string;
  submissionChannels: SubmissionChannels;
  emailConfig: EmailConfig;
  whatsappConfig: WhatsAppConfig;
  portalConfig: PortalConfig;
  requiredFieldsSchema: RequiredField[];
  requiredAttachmentsSchema: RequiredAttachment[];
  responseFormatHints: { expected: string; notes: string };
  internalNotes: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface Supplier {
  id: number;
  name: string;
  status: string;
}

const SAMPLE_TOKEN_DATA = {
  CLIENT_NAME: "Empresa ABC Ltda",
  CNPJ: "12.345.678/0001-90",
  UCS: "UC-123456",
  DISTRIBUTOR: "CEMIG",
  ANNUAL_MWH: "1,200",
  RFO_NUMBER: "RFO-2024-001",
  CONTACT_NAME: "João Silva",
  START_DATE: "01/04/2025",
  DEADLINE_HOURS: "48",
  OTIMA_CONTACT: "Equipe Ótima Energia",
};

function replaceTokensPreview(template: string): string {
  let result = template;
  for (const [key, value] of Object.entries(SAMPLE_TOKEN_DATA)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export function RFQAdaptersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId, user } = useAuth();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<"email" | "whatsapp">("email");

  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
  });

  const { data: adaptersData, isLoading: adaptersLoading } = useQuery({
    queryKey: ["/api/suppliers", selectedSupplierId, "rfq-adapters", sessionId],
    queryFn: async () => {
      if (!selectedSupplierId) return { adapters: [] };
      const res = await fetch(`/api/suppliers/${selectedSupplierId}/rfq-adapters`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch adapters");
      return res.json();
    },
    enabled: !!selectedSupplierId && !!sessionId,
  });

  const suppliers: Supplier[] = suppliersData?.suppliers || [];
  const adapters: SupplierRfqAdapter[] = adaptersData?.adapters || [];
  const activeAdapter = adapters.find(a => a.status === "ACTIVE");

  const [formData, setFormData] = useState({
    name: "Default RFQ Method",
    submissionChannels: {
      email: { enabled: true },
      whatsapp: { enabled: false },
      portal: { enabled: false },
      excelTemplate: { enabled: false },
    },
    emailConfig: {
      to: [] as string[],
      cc: [] as string[],
      subjectTemplate: "RFQ #{{RFO_NUMBER}} - {{CLIENT_NAME}} - Solicitação de Cotação",
      bodyTemplate: `Prezado(a) {{CONTACT_NAME}},

Solicitamos cotação para o cliente {{CLIENT_NAME}} (CNPJ: {{CNPJ}}).

Consumo anual: {{ANNUAL_MWH}} MWh
Início do suprimento: {{START_DATE}}
Prazo para resposta: {{DEADLINE_HOURS}} horas

Atenciosamente,
{{OTIMA_CONTACT}}`,
    },
    whatsappConfig: {
      messageTemplate: `Olá {{CONTACT_NAME}}, tudo bem?

Envio RFQ #{{RFO_NUMBER}} para {{CLIENT_NAME}}.
Consumo: {{ANNUAL_MWH}} MWh/ano
Início: {{START_DATE}}

Prazo: {{DEADLINE_HOURS}}h

Obrigado!`,
    },
    portalConfig: {
      url: "",
      instructions: "",
    },
    requiredFieldsSchema: [
      { key: "client_company_name", label: "Razão Social", type: "text" as const, required: true },
      { key: "cnpj", label: "CNPJ", type: "text" as const, required: true },
      { key: "ucs", label: "UC(s)", type: "list" as const, required: true, minItems: 1 },
      { key: "annual_mwh", label: "Consumo Anual (MWh)", type: "number" as const, required: true },
      { key: "start_date", label: "Início do Suprimento", type: "date" as const, required: true },
    ],
    requiredAttachmentsSchema: [
      { key: "bill_pdf_last_12_months", label: "Últimas 12 faturas (PDF)", required: true },
      { key: "load_dossier_pdf", label: "Dossiê de Consumo (PDF)", required: false },
      { key: "credit_docs", label: "Documentos de Crédito (se aplicável)", required: false },
    ],
    responseFormatHints: {
      expected: "EMAIL_PDF_OR_EXCEL",
      notes: "",
    },
    internalNotes: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSupplierId) throw new Error("No supplier selected");
      const res = await fetch(`/api/suppliers/${selectedSupplierId}/rfq-adapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create adapter");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplierId, "rfq-adapters"] });
      setShowCreateModal(false);
      toast({ title: "Success", description: "RFQ Adapter created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const retireMutation = useMutation({
    mutationFn: async (adapterId: number) => {
      const res = await fetch(`/api/rfq-adapters/${adapterId}/retire`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to retire adapter");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplierId, "rfq-adapters"] });
      toast({ title: "Success", description: "Adapter retired" });
    },
  });

  const loadAdapterForEdit = (adapter: SupplierRfqAdapter) => {
    setFormData({
      name: adapter.name,
      submissionChannels: adapter.submissionChannels,
      emailConfig: adapter.emailConfig,
      whatsappConfig: adapter.whatsappConfig,
      portalConfig: adapter.portalConfig,
      requiredFieldsSchema: adapter.requiredFieldsSchema,
      requiredAttachmentsSchema: adapter.requiredAttachmentsSchema,
      responseFormatHints: adapter.responseFormatHints,
      internalNotes: adapter.internalNotes || "",
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RFQ Adapters</h2>
          <p className="text-muted-foreground">
            Configure how to request quotes from each supplier (email/WhatsApp/portal templates)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Select Supplier
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suppliersLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Select
              value={selectedSupplierId?.toString() || ""}
              onValueChange={(val) => setSelectedSupplierId(parseInt(val))}
            >
              <SelectTrigger className="w-full max-w-md" data-testid="select-supplier">
                <SelectValue placeholder="Select a supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedSupplierId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Adapter Configuration</CardTitle>
                <CardDescription>
                  {activeAdapter
                    ? `Active: ${activeAdapter.name} (v${activeAdapter.version})`
                    : "No active adapter configured"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionHistory(true)}
                  data-testid="btn-version-history"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                <Button
                  onClick={() => {
                    if (activeAdapter) {
                      loadAdapterForEdit(activeAdapter);
                    } else {
                      setShowCreateModal(true);
                    }
                  }}
                  data-testid="btn-create-adapter"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeAdapter ? "Clone & Edit" : "Create Adapter"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adaptersLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : activeAdapter ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className={`w-5 h-5 ${activeAdapter.submissionChannels.email?.enabled ? "text-green-600" : "text-gray-400"}`} />
                    <span className={activeAdapter.submissionChannels.email?.enabled ? "" : "text-muted-foreground"}>
                      Email {activeAdapter.submissionChannels.email?.enabled && <Badge variant="secondary">Active</Badge>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className={`w-5 h-5 ${activeAdapter.submissionChannels.whatsapp?.enabled ? "text-green-600" : "text-gray-400"}`} />
                    <span className={activeAdapter.submissionChannels.whatsapp?.enabled ? "" : "text-muted-foreground"}>
                      WhatsApp {activeAdapter.submissionChannels.whatsapp?.enabled && <Badge variant="secondary">Active</Badge>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className={`w-5 h-5 ${activeAdapter.submissionChannels.portal?.enabled ? "text-green-600" : "text-gray-400"}`} />
                    <span className={activeAdapter.submissionChannels.portal?.enabled ? "" : "text-muted-foreground"}>
                      Portal {activeAdapter.submissionChannels.portal?.enabled && <Badge variant="secondary">Active</Badge>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className={`w-5 h-5 ${activeAdapter.submissionChannels.excelTemplate?.enabled ? "text-green-600" : "text-gray-400"}`} />
                    <span className={activeAdapter.submissionChannels.excelTemplate?.enabled ? "" : "text-muted-foreground"}>
                      Excel {activeAdapter.submissionChannels.excelTemplate?.enabled && <Badge variant="secondary">Active</Badge>}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Required Fields</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeAdapter.requiredFieldsSchema?.filter(f => f.required).map((field) => (
                      <Badge key={field.key} variant="outline">
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Required Attachments</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeAdapter.requiredAttachmentsSchema?.filter(a => a.required).map((att) => (
                      <Badge key={att.key} variant="outline">
                        {att.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewType("email");
                      setShowPreview(true);
                    }}
                    data-testid="btn-preview-email"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Email
                  </Button>
                  {activeAdapter.submissionChannels.whatsapp?.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewType("whatsapp");
                        setShowPreview(true);
                      }}
                      data-testid="btn-preview-whatsapp"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No RFQ adapter configured for this supplier.</p>
                <p className="text-sm mt-2">Create one to enable packet generation.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeAdapter ? "Create New Adapter Version" : "Create RFQ Adapter"}
            </DialogTitle>
            <DialogDescription>
              Configure how RFQ requests are sent to this supplier. Creating a new version will retire the current one.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="channels" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <Label>Email</Label>
                  </div>
                  <Switch
                    checked={formData.submissionChannels.email.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        submissionChannels: {
                          ...formData.submissionChannels,
                          email: { enabled: checked },
                        },
                      })
                    }
                    data-testid="switch-email"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <Label>WhatsApp</Label>
                  </div>
                  <Switch
                    checked={formData.submissionChannels.whatsapp.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        submissionChannels: {
                          ...formData.submissionChannels,
                          whatsapp: { enabled: checked },
                        },
                      })
                    }
                    data-testid="switch-whatsapp"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <Label>Portal Submission</Label>
                  </div>
                  <Switch
                    checked={formData.submissionChannels.portal.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        submissionChannels: {
                          ...formData.submissionChannels,
                          portal: { enabled: checked },
                        },
                      })
                    }
                    data-testid="switch-portal"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Label htmlFor="adapterName">Adapter Name</Label>
                <Input
                  id="adapterName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  data-testid="input-adapter-name"
                />
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="emailSubject">Subject Template</Label>
                <Input
                  id="emailSubject"
                  value={formData.emailConfig.subjectTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailConfig: { ...formData.emailConfig, subjectTemplate: e.target.value },
                    })
                  }
                  className="mt-1 font-mono text-sm"
                  data-testid="input-email-subject"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use tokens like {"{{CLIENT_NAME}}"}, {"{{RFO_NUMBER}}"}, {"{{CNPJ}}"}
                </p>
              </div>
              <div>
                <Label htmlFor="emailBody">Body Template</Label>
                <Textarea
                  id="emailBody"
                  value={formData.emailConfig.bodyTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailConfig: { ...formData.emailConfig, bodyTemplate: e.target.value },
                    })
                  }
                  className="mt-1 font-mono text-sm min-h-[200px]"
                  data-testid="input-email-body"
                />
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </h4>
                <div className="text-sm space-y-2">
                  <p className="font-medium">{replaceTokensPreview(formData.emailConfig.subjectTemplate)}</p>
                  <div className="whitespace-pre-wrap text-muted-foreground">
                    {replaceTokensPreview(formData.emailConfig.bodyTemplate)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="whatsappMessage">Message Template</Label>
                <Textarea
                  id="whatsappMessage"
                  value={formData.whatsappConfig.messageTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappConfig: { messageTemplate: e.target.value },
                    })
                  }
                  className="mt-1 font-mono text-sm min-h-[150px]"
                  data-testid="input-whatsapp-message"
                />
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </h4>
                <div className="whitespace-pre-wrap text-sm">
                  {replaceTokensPreview(formData.whatsappConfig.messageTemplate)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Required Fields</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.requiredFieldsSchema.map((field, idx) => (
                      <TableRow key={field.key}>
                        <TableCell>{field.label}</TableCell>
                        <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                        <TableCell>
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => {
                              const updated = [...formData.requiredFieldsSchema];
                              updated[idx] = { ...updated[idx], required: checked };
                              setFormData({ ...formData, requiredFieldsSchema: updated });
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-medium mb-2">Required Attachments</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attachment</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.requiredAttachmentsSchema.map((att, idx) => (
                      <TableRow key={att.key}>
                        <TableCell>{att.label}</TableCell>
                        <TableCell>
                          <Switch
                            checked={att.required}
                            onCheckedChange={(checked) => {
                              const updated = [...formData.requiredAttachmentsSchema];
                              updated[idx] = { ...updated[idx], required: checked };
                              setFormData({ ...formData, requiredAttachmentsSchema: updated });
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="responseFormat">Expected Response Format</Label>
                <Select
                  value={formData.responseFormatHints.expected}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      responseFormatHints: { ...formData.responseFormatHints, expected: val },
                    })
                  }
                >
                  <SelectTrigger className="mt-1" data-testid="select-response-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL_PDF_OR_EXCEL">Email with PDF or Excel</SelectItem>
                    <SelectItem value="PORTAL_DOWNLOAD">Portal Download</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="WHATSAPP_REPLY">WhatsApp Reply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="mt-1"
                  placeholder="Notes about this supplier's preferences..."
                  data-testid="input-internal-notes"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              data-testid="btn-save-adapter"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Adapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adapters.map((adapter) => (
                <TableRow key={adapter.id}>
                  <TableCell>v{adapter.version}</TableCell>
                  <TableCell>{adapter.name}</TableCell>
                  <TableCell>
                    <Badge variant={adapter.status === "ACTIVE" ? "default" : "secondary"}>
                      {adapter.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(adapter.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {adapter.status === "ACTIVE" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retireMutation.mutate(adapter.id)}
                        disabled={retireMutation.isPending}
                      >
                        Retire
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewType === "email" ? "Email Preview" : "WhatsApp Preview"}
            </DialogTitle>
          </DialogHeader>
          {activeAdapter && (
            <div className="space-y-4">
              {previewType === "email" ? (
                <>
                  <div>
                    <Label>Subject</Label>
                    <p className="font-medium mt-1">
                      {replaceTokensPreview(activeAdapter.emailConfig.subjectTemplate)}
                    </p>
                  </div>
                  <div>
                    <Label>Body</Label>
                    <div className="mt-1 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                      {replaceTokensPreview(activeAdapter.emailConfig.bodyTemplate)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg whitespace-pre-wrap">
                  {replaceTokensPreview(activeAdapter.whatsappConfig.messageTemplate)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
