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
  X
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

interface Supplier {
  id: number;
  name: string;
  shortCode: string;
  category?: string | null;
  contactEmail?: string | null;
}

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
  const [sentRfo, setSentRfo] = useState<{
    rfoNumber: string;
    sentCount: number;
    deadline: string;
  } | null>(null);

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      return res.json();
    }
  });

  const suppliers: Supplier[] = suppliersData?.suppliers || [];

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
    
    const body = `Prezado(a),

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
    
    setEmailBody(body);
    setShowPreview(true);
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
        deadline: format(deadlineDate, "dd/MM/yyyy", { locale: ptBR })
      };
    },
    onSuccess: (data) => {
      setSentRfo(data);
      queryClient.invalidateQueries({ queryKey: ["/api/rfo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id, "rfo"] });
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
                    {suppliers.map((supplier) => (
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
                          <div className="font-medium text-sm truncate">{supplier.name}</div>
                          {supplier.contactEmail && (
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
                    ))}
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
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Mail className="h-4 w-4" />
                        <span>Assunto: [RFO] Solicitação de Proposta - {client.companyName}</span>
                      </div>
                      <Textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                        data-testid="textarea-email-body"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
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
                          Voltar
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
