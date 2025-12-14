import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { 
  Send, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Building2,
  FileText,
  Eye,
  RefreshCw,
  X,
  MessageCircle,
  Globe,
  Phone,
  Copy,
  ExternalLink
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: number;
  companyName: string;
  ucCode?: string | null;
  avgConsumptionKwh?: string | null;
  currentSupplier?: string | null;
}

interface SupplierContact {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  preferredFormat: string;
  formatDetails?: Record<string, unknown> | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface Supplier {
  id: number;
  name: string;
  shortCode: string;
  category?: string | null;
  contactEmail?: string | null;
  contacts?: SupplierContact[];
}

type ContactFormat = "email" | "whatsapp" | "portal" | "phone";

const FORMAT_COLORS: Record<ContactFormat, string> = {
  email: "bg-red-100 text-red-700 border-red-300",
  whatsapp: "bg-green-100 text-green-700 border-green-300",
  portal: "bg-blue-100 text-blue-700 border-blue-300",
  phone: "bg-emerald-100 text-emerald-700 border-emerald-300"
};

const FORMAT_ICONS: Record<ContactFormat, React.ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  whatsapp: <MessageCircle className="h-3 w-3" />,
  portal: <Globe className="h-3 w-3" />,
  phone: <Phone className="h-3 w-3" />
};

interface RFOGeneratorProps {
  client: Client;
  onClose: () => void;
}

type Priority = "baixa" | "normal" | "alta" | "urgente";

const DEADLINE_PRESETS = [
  { days: 1, labelKey: "rfo.deadline.24h" as const },
  { days: 3, labelKey: "rfo.deadline.3d" as const },
  { days: 7, labelKey: "rfo.deadline.7d" as const },
];

const PRIORITY_OPTIONS: Priority[] = ["baixa", "normal", "alta", "urgente"];

const PRIORITY_COLORS: Record<Priority, string> = {
  baixa: "bg-gray-100 text-gray-700 border-gray-300",
  normal: "bg-blue-100 text-blue-700 border-blue-300",
  alta: "bg-orange-100 text-orange-700 border-orange-300",
  urgente: "bg-red-100 text-red-700 border-red-300"
};

export function RFOGenerator({ client, onClose }: RFOGeneratorProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [customDays, setCustomDays] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [replyEmail, setReplyEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [whatsappBody, setWhatsappBody] = useState("");
  const [activePreviewTab, setActivePreviewTab] = useState<string>("email");
  const [copiedSupplier, setCopiedSupplier] = useState<number | null>(null);
  const [sentRfo, setSentRfo] = useState<{
    rfoNumber: string;
    sentCount: number;
    deadline: string;
    byChannel: { email: number; whatsapp: number; portal: number };
  } | null>(null);

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers-with-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers-with-contacts");
      if (!res.ok) {
        const fallback = await fetch("/api/suppliers");
        return fallback.json();
      }
      return res.json();
    }
  });

  const suppliers: Supplier[] = suppliersData?.suppliers || [];
  
  const getSupplierPrimaryContact = (supplier: Supplier): SupplierContact | null => {
    if (!supplier.contacts || supplier.contacts.length === 0) return null;
    const primary = supplier.contacts.find(c => c.isPrimary && c.isActive);
    return primary || supplier.contacts.find(c => c.isActive) || supplier.contacts[0];
  };

  const getSupplierFormat = (supplier: Supplier): ContactFormat => {
    const contact = getSupplierPrimaryContact(supplier);
    if (contact?.preferredFormat) {
      return contact.preferredFormat as ContactFormat;
    }
    if (contact?.phone) return "whatsapp";
    return "email";
  };

  const suppliersByFormat = useMemo(() => {
    const result: Record<ContactFormat, Supplier[]> = {
      email: [],
      whatsapp: [],
      portal: [],
      phone: []
    };
    
    selectedSuppliers.forEach(id => {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) {
        const format = getSupplierFormat(supplier);
        result[format].push(supplier);
      }
    });
    
    return result;
  }, [selectedSuppliers, suppliers]);

  const hasAnySelected = selectedSuppliers.length > 0;

  const renewableSuppliers = useMemo(() => 
    suppliers.filter(s => s.category === "renewable").map(s => s.id),
    [suppliers]
  );

  const top3Suppliers = useMemo(() => 
    suppliers.slice(0, 3).map(s => s.id),
    [suppliers]
  );

  const handleSelectAll = () => setSelectedSuppliers(suppliers.map(s => s.id));
  const handleSelectTop3 = () => setSelectedSuppliers(top3Suppliers);
  const handleSelectRenewables = () => setSelectedSuppliers(renewableSuppliers);
  const handleClearSelection = () => setSelectedSuppliers([]);

  const toggleSupplier = (supplierId: number) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const effectiveDays = customDays ? parseInt(customDays) || deadlineDays : deadlineDays;
  const deadlineDate = addDays(new Date(), effectiveDays);

  const generateEmailBody = () => {
    const consumption = client.avgConsumptionKwh 
      ? `${parseFloat(client.avgConsumptionKwh).toLocaleString('pt-BR')} kWh/mês`
      : "A informar";
    
    const emailText = `Prezado(a),

Solicitamos proposta comercial para o cliente abaixo:

📍 Cliente: ${client.companyName}
🔌 UC: ${client.ucCode || "A informar"}
⚡ Consumo Médio: ${consumption}
📅 Prazo para Resposta: ${format(deadlineDate, "dd/MM/yyyy", { locale: ptBR })}
🚨 Prioridade: ${priority.toUpperCase()}

Favor enviar proposta contendo:
- Preço fixo (R$/MWh) ou spread sobre PLD
- Preço de demanda (R$/kW/mês)
- Vigência e condições contratuais
- Flexibilidade e modulação (se aplicável)

Aguardamos retorno.

Atenciosamente,
Equipe Ótima Energia`;
    
    const whatsappText = `*Solicitação de Proposta - Ótima Energia*

📍 *Cliente:* ${client.companyName}
🔌 *UC:* ${client.ucCode || "A informar"}
⚡ *Consumo Médio:* ${consumption}
📅 *Prazo:* ${format(deadlineDate, "dd/MM/yyyy", { locale: ptBR })}
🚨 *Prioridade:* ${priority.toUpperCase()}

Favor enviar proposta com:
• Preço (R$/MWh) ou spread PLD
• Demanda (R$/kW/mês)
• Vigência e condições

Aguardamos retorno!
_Equipe Ótima Energia_`;
    
    setEmailBody(emailText);
    setWhatsappBody(whatsappText);
    setShowPreview(true);
  };

  const copyToClipboard = async (text: string, supplierId?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (supplierId) {
        setCopiedSupplier(supplierId);
        setTimeout(() => setCopiedSupplier(null), 2000);
      }
      toast({
        title: t("admin.toast.link_copied"),
        description: t("rfo.copied_clipboard")
      });
    } catch {
      toast({
        title: t("rfo.toast.error"),
        description: "Failed to copy",
        variant: "destructive"
      });
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const openPortal = (portalUrl: string) => {
    window.open(portalUrl, "_blank");
  };

  const createRfoMutation = useMutation({
    mutationFn: async () => {
      const createRes = await fetch(`/api/clients/${client.id}/rfo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadlineDays: effectiveDays,
          priority,
          replyEmail: replyEmail || undefined,
          emailSubject: `[RFO] Solicitação de Proposta - ${client.companyName}`,
          emailBody
        })
      });
      
      if (!createRes.ok) throw new Error("Failed to create RFO");
      const { rfo } = await createRes.json();
      
      const sendRes = await fetch(`/api/rfo/${rfo.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierIds: selectedSuppliers })
      });
      
      if (!sendRes.ok) throw new Error("Failed to send RFO");
      const sendData = await sendRes.json();
      
      return {
        rfoNumber: rfo.rfoNumber,
        sentCount: sendData.sent,
        deadline: format(deadlineDate, "dd/MM/yyyy", { locale: ptBR }),
        byChannel: {
          email: suppliersByFormat.email.length,
          whatsapp: suppliersByFormat.whatsapp.length,
          portal: suppliersByFormat.portal.length
        }
      };
    },
    onSuccess: (data) => {
      setSentRfo(data);
      queryClient.invalidateQueries({ queryKey: ["/api/rfo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id, "rfo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers-with-contacts"] });
      toast({
        title: t("rfo.toast.sent"),
        description: `${data.rfoNumber} - ${data.sentCount} ${t("rfo.suppliers")}`
      });
    },
    onError: (error) => {
      toast({
        title: t("rfo.toast.error"),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: t("rfo.select_supplier"),
        variant: "destructive"
      });
      return;
    }
    createRfoMutation.mutate();
  };

  const handleRedo = () => {
    setSentRfo(null);
    setShowPreview(false);
    setSelectedSuppliers([]);
    setEmailBody("");
    setWhatsappBody("");
    setActivePreviewTab("email");
  };

  if (sentRfo) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              {t("rfo.sent_success")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rfo.number")}:</span>
                <Badge variant="outline">{sentRfo.rfoNumber}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rfo.sent_to")}:</span>
                <span className="font-medium">{sentRfo.sentCount} {t("rfo.suppliers")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rfo.deadline_label")}:</span>
                <span className="font-medium">{sentRfo.deadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rfo.status")}:</span>
                <Badge className="bg-green-100 text-green-700">{t("rfo.status.sent")}</Badge>
              </div>
            </div>
            
            {(sentRfo.byChannel.email > 0 || sentRfo.byChannel.whatsapp > 0 || sentRfo.byChannel.portal > 0) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">{t("rfo.by_channel")}:</span>
                  <div className="flex flex-wrap gap-2">
                    {sentRfo.byChannel.email > 0 && (
                      <Badge className={FORMAT_COLORS.email}>
                        <Mail className="h-3 w-3 mr-1" />
                        {sentRfo.byChannel.email} Email
                      </Badge>
                    )}
                    {sentRfo.byChannel.whatsapp > 0 && (
                      <Badge className={FORMAT_COLORS.whatsapp}>
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {sentRfo.byChannel.whatsapp} WhatsApp
                      </Badge>
                    )}
                    {sentRfo.byChannel.portal > 0 && (
                      <Badge className={FORMAT_COLORS.portal}>
                        <Globe className="h-3 w-3 mr-1" />
                        {sentRfo.byChannel.portal} Portal
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleRedo}
                data-testid="button-rfo-redo"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("rfo.redo")}
              </Button>
              <Button 
                className="flex-1"
                onClick={onClose}
                data-testid="button-rfo-close"
              >
                {t("rfo.close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {t("rfo.title")}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("rfo.step1")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAll}
                    data-testid="button-preset-all"
                  >
                    {t("rfo.preset.all")}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectTop3}
                    data-testid="button-preset-top3"
                  >
                    {t("rfo.preset.top3")}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectRenewables}
                    data-testid="button-preset-renewables"
                  >
                    {t("rfo.preset.renewables")}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearSelection}
                    data-testid="button-preset-clear"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("rfo.preset.clear")}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mb-3">
                  {t("rfo.selected")} <Badge variant="secondary">{selectedSuppliers.length}</Badge> {t("rfo.suppliers")}
                </div>
                
                {suppliersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {suppliers.map((supplier) => {
                      const format = getSupplierFormat(supplier);
                      const contact = getSupplierPrimaryContact(supplier);
                      return (
                        <div 
                          key={supplier.id}
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                            selectedSuppliers.includes(supplier.id) 
                              ? "bg-primary/10 border-primary" 
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleSupplier(supplier.id)}
                          data-testid={`checkbox-supplier-${supplier.id}`}
                        >
                          <Checkbox 
                            checked={selectedSuppliers.includes(supplier.id)}
                            onCheckedChange={() => toggleSupplier(supplier.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate flex items-center gap-1">
                              {supplier.name}
                              <Badge 
                                variant="outline" 
                                className={`${FORMAT_COLORS[format]} text-xs px-1 py-0`}
                              >
                                {FORMAT_ICONS[format]}
                              </Badge>
                            </div>
                            {contact ? (
                              <div className="text-xs text-muted-foreground truncate">
                                {contact.name} {contact.email && `• ${contact.email}`}
                              </div>
                            ) : supplier.contactEmail && (
                              <div className="text-xs text-muted-foreground truncate">
                                {supplier.contactEmail}
                              </div>
                            )}
                          </div>
                          {supplier.category === "renewable" && (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                              🌱
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("rfo.step2")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t("rfo.deadline")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEADLINE_PRESETS.map((preset) => (
                      <Button
                        key={preset.days}
                        variant={deadlineDays === preset.days && !customDays ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setDeadlineDays(preset.days);
                          setCustomDays("");
                        }}
                        data-testid={`button-deadline-${preset.days}`}
                      >
                        {t(preset.labelKey)}
                      </Button>
                    ))}
                    <span className="flex items-center text-sm text-muted-foreground">{t("rfo.deadline.custom")}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className="w-16 h-8"
                        data-testid="input-custom-days"
                      />
                      <span className="text-sm text-muted-foreground">{t("rfo.deadline.days")}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("rfo.deadline.final")} <strong>{format(deadlineDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}</strong>
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">{t("rfo.priority")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRIORITY_OPTIONS.map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className={priority === p ? PRIORITY_COLORS[p] : ""}
                        onClick={() => setPriority(p)}
                        data-testid={`button-priority-${p}`}
                      >
                        {p === "urgente" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {t(`rfo.priority.${p}` as const)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">{t("rfo.email_reply")}</Label>
                  <Input
                    type="email"
                    placeholder="renan@otimaenergia.com.br"
                    value={replyEmail}
                    onChange={(e) => setReplyEmail(e.target.value)}
                    className="mt-2"
                    data-testid="input-reply-email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("rfo.email_hint")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("rfo.step3")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showPreview ? (
                  <div className="text-center py-6">
                    <Button 
                      onClick={generateEmailBody}
                      disabled={selectedSuppliers.length === 0}
                      data-testid="button-generate-preview"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t("rfo.generate_preview")}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">{t("rfo.preview_hint")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {suppliersByFormat.email.length > 0 && (
                        <Badge className={FORMAT_COLORS.email}>
                          <Mail className="h-3 w-3 mr-1" />
                          {suppliersByFormat.email.length} Email
                        </Badge>
                      )}
                      {suppliersByFormat.whatsapp.length > 0 && (
                        <Badge className={FORMAT_COLORS.whatsapp}>
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {suppliersByFormat.whatsapp.length} WhatsApp
                        </Badge>
                      )}
                      {suppliersByFormat.portal.length > 0 && (
                        <Badge className={FORMAT_COLORS.portal}>
                          <Globe className="h-3 w-3 mr-1" />
                          {suppliersByFormat.portal.length} Portal
                        </Badge>
                      )}
                    </div>

                    <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
                      <TabsList className="w-full">
                        <TabsTrigger value="email" className="flex-1" data-testid="tab-email">
                          <Mail className="h-4 w-4 mr-1" />
                          Email {suppliersByFormat.email.length > 0 && `(${suppliersByFormat.email.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="whatsapp" className="flex-1" data-testid="tab-whatsapp">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp {suppliersByFormat.whatsapp.length > 0 && `(${suppliersByFormat.whatsapp.length})`}
                        </TabsTrigger>
                        {suppliersByFormat.portal.length > 0 && (
                          <TabsTrigger value="portal" className="flex-1" data-testid="tab-portal">
                            <Globe className="h-4 w-4 mr-1" />
                            Portal ({suppliersByFormat.portal.length})
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="email" className="mt-4">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Assunto: [RFO] Solicitação de Proposta - {client.companyName}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(emailBody)}
                              data-testid="button-copy-email"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                            data-testid="textarea-email-body"
                          />
                        </div>
                        {suppliersByFormat.email.length > 0 && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            {t("rfo.email_recipients")}: {suppliersByFormat.email.map(s => s.name).join(", ")}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="whatsapp" className="mt-4">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              {t("rfo.whatsapp_message")}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(whatsappBody)}
                              data-testid="button-copy-whatsapp"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={whatsappBody}
                            onChange={(e) => setWhatsappBody(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                            data-testid="textarea-whatsapp-body"
                          />
                        </div>
                        {suppliersByFormat.whatsapp.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-sm font-medium">{t("rfo.send_whatsapp")}:</div>
                            <div className="flex flex-wrap gap-2">
                              {suppliersByFormat.whatsapp.map(supplier => {
                                const contact = getSupplierPrimaryContact(supplier);
                                const phone = contact?.phone || (contact?.formatDetails as Record<string, string>)?.whatsappNumber;
                                return (
                                  <Button
                                    key={supplier.id}
                                    variant="outline"
                                    size="sm"
                                    className={`${copiedSupplier === supplier.id ? "bg-green-100" : ""}`}
                                    onClick={() => {
                                      if (phone) {
                                        openWhatsApp(phone, whatsappBody);
                                      } else {
                                        copyToClipboard(whatsappBody, supplier.id);
                                      }
                                    }}
                                    data-testid={`button-whatsapp-${supplier.id}`}
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    {supplier.name}
                                    {copiedSupplier === supplier.id && (
                                      <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />
                                    )}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {suppliersByFormat.portal.length > 0 && (
                        <TabsContent value="portal" className="mt-4">
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">{t("rfo.portal_instructions")}</p>
                            <div className="space-y-2">
                              {suppliersByFormat.portal.map(supplier => {
                                const contact = getSupplierPrimaryContact(supplier);
                                const portalUrl = (contact?.formatDetails as Record<string, string>)?.portalUrl || "";
                                return (
                                  <div 
                                    key={supplier.id}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                  >
                                    <div>
                                      <div className="font-medium">{supplier.name}</div>
                                      {portalUrl && (
                                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                          {portalUrl}
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => portalUrl && openPortal(portalUrl)}
                                      disabled={!portalUrl}
                                      data-testid={`button-portal-${supplier.id}`}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      {t("rfo.open_portal")}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedSuppliers.length} {t("rfo.suppliers")}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPreview(false)}
                          data-testid="button-edit-config"
                        >
                          {t("rfo.back")}
                        </Button>
                        <Button 
                          onClick={handleSend}
                          disabled={createRfoMutation.isPending}
                          data-testid="button-send-rfo"
                        >
                          {createRfoMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t("rfo.sending")}
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              {t("rfo.send")}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
