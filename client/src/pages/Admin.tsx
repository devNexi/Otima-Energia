import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Inbox, 
  FileText, 
  RefreshCw, 
  Plus, 
  Link as LinkIcon, 
  ArrowRight,
  Building2,
  Mail,
  Phone,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";

const statusColors: Record<string, string> = {
  prospect: "bg-blue-100 text-blue-800",
  awaiting_quote: "bg-yellow-100 text-yellow-800",
  negotiating: "bg-purple-100 text-purple-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800"
};

const statusLabels: Record<string, string> = {
  prospect: "Prospecto",
  awaiting_quote: "Aguardando Cotação",
  negotiating: "Negociando",
  active: "Ativo",
  closed: "Fechado",
  lost: "Perdido"
};

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    companyName: "",
    cnpj: "",
    email: "",
    phone: "",
    contactPerson: "",
    ucCode: ""
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads");
      return res.json();
    }
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    }
  });

  const { data: rfqsData, isLoading: rfqsLoading } = useQuery({
    queryKey: ["/api/quote-requests"],
    queryFn: async () => {
      const res = await fetch("/api/quote-requests");
      return res.json();
    }
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: typeof newClientForm) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setNewClientOpen(false);
      setNewClientForm({ companyName: "", cnpj: "", email: "", phone: "", contactPerson: "", ucCode: "" });
      toast({ title: "Cliente criado com sucesso!" });
    }
  });

  const convertLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Lead convertido em cliente!" });
    }
  });

  const generateUploadLinkMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await fetch(`/api/clients/${clientId}/upload-link`, { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.uploadUrl}`;
      navigator.clipboard.writeText(fullUrl);
      toast({ 
        title: "Link de upload gerado!", 
        description: `Código de acesso: ${data.accessCode}. Link copiado!`
      });
    }
  });

  const syncToZohoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/sync-to-zoho", { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Sincronização Zoho", 
        description: data.message
      });
    }
  });

  const leads = leadsData?.leads || [];
  const clients = clientsData?.clients || [];
  const rfqs = rfqsData?.requests || [];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-page">
      <header className="bg-violet-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Ótima Energia</h1>
            <p className="text-violet-200 text-sm">Painel Administrativo</p>
          </div>
          <Button 
            variant="outline" 
            className="text-violet-900 border-white hover:bg-violet-800 hover:text-white"
            onClick={() => syncToZohoMutation.mutate()}
            disabled={syncToZohoMutation.isPending}
            data-testid="button-sync-zoho"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncToZohoMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar com Zoho
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900" data-testid="stat-leads">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900" data-testid="stat-clients">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Cotações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900" data-testid="stat-rfqs">{rfqs.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads" className="flex items-center gap-2" data-testid="tab-leads">
              <Inbox className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2" data-testid="tab-clients">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="rfqs" className="flex items-center gap-2" data-testid="tab-rfqs">
              <FileText className="w-4 h-4" />
              Cotações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads Recebidos</CardTitle>
                <CardDescription>Leads capturados do site</CardDescription>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : leads.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum lead ainda</p>
                ) : (
                  <div className="space-y-4">
                    {leads.map((lead: any) => (
                      <div 
                        key={lead.id} 
                        className="border rounded-lg p-4 flex items-center justify-between"
                        data-testid={`lead-row-${lead.id}`}
                      >
                        <div>
                          <h3 className="font-medium">{lead.name}</h3>
                          <div className="text-sm text-gray-500 space-x-4">
                            {lead.email && <span><Mail className="w-3 h-3 inline mr-1" />{lead.email}</span>}
                            {lead.phone && <span><Phone className="w-3 h-3 inline mr-1" />{lead.phone}</span>}
                            {lead.companyName && <span><Building2 className="w-3 h-3 inline mr-1" />{lead.companyName}</span>}
                          </div>
                          {lead.message && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{lead.message}"</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => convertLeadMutation.mutate(lead.id)}
                          disabled={convertLeadMutation.isPending}
                          data-testid={`button-convert-lead-${lead.id}`}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Converter
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clientes</CardTitle>
                  <CardDescription>Gerenciar clientes e gerar links de upload</CardDescription>
                </div>
                <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-client">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                      <DialogDescription>Preencha os dados do cliente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="companyName">Empresa *</Label>
                        <Input
                          id="companyName"
                          value={newClientForm.companyName}
                          onChange={(e) => setNewClientForm({ ...newClientForm, companyName: e.target.value })}
                          data-testid="input-company-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          value={newClientForm.cnpj}
                          onChange={(e) => setNewClientForm({ ...newClientForm, cnpj: e.target.value })}
                          data-testid="input-cnpj"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPerson">Contato</Label>
                        <Input
                          id="contactPerson"
                          value={newClientForm.contactPerson}
                          onChange={(e) => setNewClientForm({ ...newClientForm, contactPerson: e.target.value })}
                          data-testid="input-contact-person"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClientForm.email}
                          onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                          data-testid="input-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={newClientForm.phone}
                          onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                          data-testid="input-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ucCode">Código UC</Label>
                        <Input
                          id="ucCode"
                          value={newClientForm.ucCode}
                          onChange={(e) => setNewClientForm({ ...newClientForm, ucCode: e.target.value })}
                          data-testid="input-uc-code"
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => createClientMutation.mutate(newClientForm)}
                        disabled={!newClientForm.companyName || createClientMutation.isPending}
                        data-testid="button-save-client"
                      >
                        Salvar Cliente
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : clients.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum cliente ainda</p>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client: any) => (
                      <div 
                        key={client.id} 
                        className="border rounded-lg p-4"
                        data-testid={`client-row-${client.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{client.companyName}</h3>
                              <Badge className={statusColors[client.status] || "bg-gray-100"}>
                                {statusLabels[client.status] || client.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 space-x-4 mt-1">
                              {client.contactPerson && <span>{client.contactPerson}</span>}
                              {client.email && <span><Mail className="w-3 h-3 inline mr-1" />{client.email}</span>}
                              {client.phone && <span><Phone className="w-3 h-3 inline mr-1" />{client.phone}</span>}
                            </div>
                            {client.cnpj && <p className="text-xs text-gray-400 mt-1">CNPJ: {client.cnpj}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateUploadLinkMutation.mutate(client.id)}
                              disabled={generateUploadLinkMutation.isPending}
                              data-testid={`button-upload-link-${client.id}`}
                            >
                              <LinkIcon className="w-4 h-4 mr-1" />
                              Gerar Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfqs">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Cotação</CardTitle>
                <CardDescription>Gerenciar RFQs e cotações de fornecedores</CardDescription>
              </CardHeader>
              <CardContent>
                {rfqsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : rfqs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma cotação ainda</p>
                ) : (
                  <div className="space-y-4">
                    {rfqs.map((rfq: any) => (
                      <div 
                        key={rfq.id} 
                        className="border rounded-lg p-4"
                        data-testid={`rfq-row-${rfq.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">RFQ #{rfq.id}</h3>
                            <Badge className={
                              rfq.status === "quotes_ready" ? "bg-green-100 text-green-800" :
                              rfq.status === "pending_quotes" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {rfq.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
