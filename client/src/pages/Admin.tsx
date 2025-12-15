import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { BillUploadSection } from "@/components/BillUploadSection";
import { SupplierQuoteManager } from "@/components/quotes/SupplierQuoteManager";
import { RFOGenerator } from "@/components/rfo/RFOGenerator";
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
  Languages,
  Upload,
  DollarSign,
  Send,
  TrendingUp
} from "lucide-react";

const statusColors: Record<string, string> = {
  prospect: "bg-blue-100 text-blue-800",
  awaiting_quote: "bg-yellow-100 text-yellow-800",
  negotiating: "bg-purple-100 text-purple-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800"
};

export default function Admin() {
  const { toast } = useToast();
  const { t, language, setLanguage } = useI18n();
  const queryClient = useQueryClient();
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [billUploadClient, setBillUploadClient] = useState<{ id: number; name: string } | null>(null);
  const [quotesClient, setQuotesClient] = useState<{ id: number; companyName: string; currentPriceRmwh?: string | null; avgConsumptionKwh?: string | null } | null>(null);
  const [rfoClient, setRfoClient] = useState<{ id: number; companyName: string; ucCode?: string | null; avgConsumptionKwh?: string | null; currentSupplier?: string | null } | null>(null);
  const [newClientForm, setNewClientForm] = useState({
    companyName: "",
    cnpj: "",
    email: "",
    phone: "",
    contactPerson: "",
    ucCode: ""
  });

  const statusLabels: Record<string, string> = {
    prospect: t("status.prospect"),
    awaiting_quote: t("status.awaiting_quote"),
    negotiating: t("status.negotiating"),
    active: t("status.active"),
    closed: t("status.closed"),
    lost: t("status.lost")
  };

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

  const { data: rfosData, isLoading: rfosLoading } = useQuery({
    queryKey: ["/api/rfo"],
    queryFn: async () => {
      const res = await fetch("/api/rfo");
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
      toast({ title: t("admin.toast.client_created") });
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
      toast({ title: t("admin.toast.lead_converted") });
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
        title: t("admin.toast.link_generated"), 
        description: (
          <div className="space-y-1">
            <p>{t("admin.toast.access_code")} <strong>{data.accessCode}</strong></p>
            <p className="text-xs break-all">{fullUrl}</p>
            <p className="text-xs text-green-600">{t("admin.toast.link_copied")}</p>
          </div>
        )
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
        title: t("admin.toast.sync_initiated"), 
        description: data.message
      });
    }
  });

  const leads = leadsData?.leads || [];
  const clients = clientsData?.clients || [];
  const rfqs = rfqsData?.requests || [];

  const toggleLanguage = () => {
    setLanguage(language === "pt" ? "en" : "pt");
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-page">
      <header className="bg-violet-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t("admin.title")}</h1>
            <p className="text-violet-200 text-sm">{t("admin.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/benchmarks">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-violet-800"
                data-testid="button-benchmarks"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t("benchmarks.title")}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-violet-800"
              onClick={toggleLanguage}
              data-testid="button-toggle-language"
            >
              <Languages className="w-4 h-4 mr-2" />
              {t("language.toggle")}
            </Button>
            <Button 
              variant="outline" 
              className="text-violet-900 border-white hover:bg-violet-800 hover:text-white"
              onClick={() => syncToZohoMutation.mutate()}
              disabled={syncToZohoMutation.isPending}
              data-testid="button-sync-zoho"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncToZohoMutation.isPending ? 'animate-spin' : ''}`} />
              {t("admin.sync_zoho")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t("admin.stats.leads")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900" data-testid="stat-leads">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t("admin.stats.clients")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900" data-testid="stat-clients">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t("admin.stats.rfqs")}</CardTitle>
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
              {t("admin.tab.leads")}
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2" data-testid="tab-clients">
              <Users className="w-4 h-4" />
              {t("admin.tab.clients")}
            </TabsTrigger>
            <TabsTrigger value="rfqs" className="flex items-center gap-2" data-testid="tab-rfqs">
              <FileText className="w-4 h-4" />
              {t("admin.tab.rfqs")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.leads.title")}</CardTitle>
                <CardDescription>{t("admin.leads.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : leads.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t("admin.leads.empty")}</p>
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
                          {t("admin.leads.convert")}
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
                  <CardTitle>{t("admin.clients.title")}</CardTitle>
                  <CardDescription>{t("admin.clients.description")}</CardDescription>
                </div>
                <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-client">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("admin.clients.new")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("admin.clients.dialog.title")}</DialogTitle>
                      <DialogDescription>{t("admin.clients.dialog.description")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="companyName">{t("admin.clients.dialog.company")}</Label>
                        <Input
                          id="companyName"
                          value={newClientForm.companyName}
                          onChange={(e) => setNewClientForm({ ...newClientForm, companyName: e.target.value })}
                          data-testid="input-company-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj">{t("admin.clients.dialog.cnpj")}</Label>
                        <Input
                          id="cnpj"
                          value={newClientForm.cnpj}
                          onChange={(e) => setNewClientForm({ ...newClientForm, cnpj: e.target.value })}
                          data-testid="input-cnpj"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPerson">{t("admin.clients.dialog.contact")}</Label>
                        <Input
                          id="contactPerson"
                          value={newClientForm.contactPerson}
                          onChange={(e) => setNewClientForm({ ...newClientForm, contactPerson: e.target.value })}
                          data-testid="input-contact-person"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">{t("admin.clients.dialog.email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClientForm.email}
                          onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                          data-testid="input-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">{t("admin.clients.dialog.phone")}</Label>
                        <Input
                          id="phone"
                          value={newClientForm.phone}
                          onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                          data-testid="input-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ucCode">{t("admin.clients.dialog.uc_code")}</Label>
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
                        {t("admin.clients.dialog.save")}
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
                  <p className="text-center text-gray-500 py-8">{t("admin.clients.empty")}</p>
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
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setQuotesClient({ 
                                id: client.id, 
                                companyName: client.companyName,
                                currentPriceRmwh: client.currentPriceRmwh,
                                avgConsumptionKwh: client.avgConsumptionKwh
                              })}
                              data-testid={`button-quotes-${client.id}`}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              {t("quotes.quotes_btn")}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-orange-500 hover:bg-orange-600"
                              onClick={() => setRfoClient({
                                id: client.id,
                                companyName: client.companyName,
                                ucCode: client.ucCode,
                                avgConsumptionKwh: client.avgConsumptionKwh,
                                currentSupplier: client.currentSupplier
                              })}
                              data-testid={`button-rfo-${client.id}`}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              {t("rfo.request_quotes")}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-violet-600 hover:bg-violet-700"
                              onClick={() => setBillUploadClient({ id: client.id, name: client.companyName })}
                              data-testid={`button-upload-bill-${client.id}`}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              {t("quotes.upload_bill")}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateUploadLinkMutation.mutate(client.id)}
                              disabled={generateUploadLinkMutation.isPending}
                              data-testid={`button-upload-link-${client.id}`}
                            >
                              <LinkIcon className="w-4 h-4 mr-1" />
                              {t("admin.clients.generate_link")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {billUploadClient && (
                  <div className="mt-6">
                    <BillUploadSection 
                      clientId={billUploadClient.id}
                      clientName={billUploadClient.name}
                      onClose={() => setBillUploadClient(null)}
                    />
                  </div>
                )}

                {quotesClient && (
                  <div className="mt-6">
                    <SupplierQuoteManager 
                      client={quotesClient}
                      onClose={() => setQuotesClient(null)}
                    />
                  </div>
                )}

                {rfoClient && (
                  <RFOGenerator 
                    client={rfoClient}
                    onClose={() => setRfoClient(null)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfqs">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-orange-500" />
                    {t("rfo.tracker.title")}
                  </CardTitle>
                  <CardDescription>{t("rfo.tracker.active")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {rfosLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : !rfosData?.rfos || rfosData.rfos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{t("admin.rfqs.empty")}</p>
                  ) : (
                    <div className="space-y-4">
                      {rfosData.rfos.map((rfo: any) => (
                        <div 
                          key={rfo.id} 
                          className="border rounded-lg p-4 bg-orange-50/50"
                          data-testid={`rfo-row-${rfo.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{rfo.rfoNumber}</h3>
                                <Badge className={
                                  rfo.status === "complete" ? "bg-green-100 text-green-800" :
                                  rfo.status === "sent" ? "bg-blue-100 text-blue-800" :
                                  rfo.status === "partial_response" ? "bg-yellow-100 text-yellow-800" :
                                  rfo.status === "expired" ? "bg-red-100 text-red-800" :
                                  "bg-gray-100 text-gray-800"
                                }>
                                  {t(`rfo.status.${rfo.status}` as const) || rfo.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {t("rfo.deadline_label")}: {rfo.responseDeadline} | 
                                {t("rfo.tracker.responses")}: {rfo.responseCount || 0}/{rfo.sentCount || 0}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" data-testid={`button-rfo-details-${rfo.id}`}>
                              {t("rfo.view_details")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.rfqs.title")}</CardTitle>
                  <CardDescription>{t("admin.rfqs.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {rfqsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : rfqs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{t("admin.rfqs.empty")}</p>
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
                              {t("admin.rfqs.view_details")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
