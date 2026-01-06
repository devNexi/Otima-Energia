import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  Receipt, 
  Clock, 
  AlertTriangle, 
  Send, 
  Check, 
  X, 
  Download,
  Plus,
  FileText,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Invoice {
  id: number;
  dealId: string;
  supplierId: number | null;
  clientId: number | null;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  issueDate: string | null;
  dueDate: string;
  grossAmountBrl: string;
  currency: string;
  serviceDescription: string | null;
  contractReference: string | null;
  paymentTrigger: string | null;
  sentAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string | null;
  isDemo: boolean | null;
}

interface InvoiceSummary {
  totalInvoiced: number;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  countByStatus: Record<string, number>;
}

interface FinanceTabProps {
  language?: 'en' | 'pt';
  userRole?: string;
}

const translations = {
  en: {
    title: "Finance Dashboard",
    totalInvoiced: "Total Invoiced",
    received: "Received",
    pending: "Pending",
    overdue: "Overdue",
    invoices: "Invoices",
    createInvoice: "Create Invoice",
    exportCsv: "Export CSV",
    filterByStatus: "Filter by Status",
    allStatuses: "All Statuses",
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    cancelled: "Cancelled",
    noInvoices: "No invoices found",
    send: "Send",
    markPaid: "Mark Paid",
    cancel: "Cancel",
    dealId: "Deal ID",
    invoiceType: "Invoice Type",
    amount: "Amount",
    dueDate: "Due Date",
    status: "Status",
    actions: "Actions",
    upfront: "Upfront",
    monthly: "Monthly",
    quarterly: "Quarterly",
    final: "Final",
    successFee: "Success Fee",
    paymentTrigger: "Payment Trigger",
    selectTrigger: "Select trigger reason",
    triggerCceeActivation: "CCEE Activation",
    triggerContractSigned: "Contract Signed",
    triggerFirstBilling: "First Client Billing",
    triggerMonthlyReport: "Monthly - per report"
  },
  pt: {
    title: "Painel Financeiro",
    totalInvoiced: "Total Faturado",
    received: "Recebido",
    pending: "Pendente",
    overdue: "Em Atraso",
    invoices: "Faturas",
    createInvoice: "Criar Fatura",
    exportCsv: "Exportar CSV",
    filterByStatus: "Filtrar por Status",
    allStatuses: "Todos os Status",
    draft: "Rascunho",
    sent: "Enviada",
    paid: "Paga",
    cancelled: "Cancelada",
    noInvoices: "Nenhuma fatura encontrada",
    send: "Enviar",
    markPaid: "Marcar Paga",
    cancel: "Cancelar",
    dealId: "ID do Negócio",
    invoiceType: "Tipo de Fatura",
    amount: "Valor",
    dueDate: "Vencimento",
    status: "Status",
    actions: "Ações",
    upfront: "Adiantamento",
    monthly: "Mensal",
    quarterly: "Trimestral",
    final: "Final",
    successFee: "Taxa de Sucesso",
    paymentTrigger: "Gatilho de Pagamento",
    selectTrigger: "Selecione o gatilho",
    triggerCceeActivation: "Ativação na CCEE",
    triggerContractSigned: "Assinatura do contrato",
    triggerFirstBilling: "Primeiro faturamento do cliente",
    triggerMonthlyReport: "Mensal - conforme relatório"
  }
};

export function FinanceTab({ language = 'en', userRole = 'admin' }: FinanceTabProps) {
  const t = translations[language];
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const sessionId = localStorage.getItem("adminSessionId") || "";

  const { data: summary, isLoading: summaryLoading } = useQuery<InvoiceSummary>({
    queryKey: ["/api/invoices/summary"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/summary", {
        headers: { "x-session-id": sessionId }
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!sessionId
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all" 
        ? `/api/invoices?status=${statusFilter}` 
        : "/api/invoices";
      const res = await fetch(url, {
        headers: { "x-session-id": sessionId }
      });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!sessionId
  });

  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId 
        }
      });
      if (!res.ok) throw new Error("Failed to send invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
    }
  });

  const settleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/invoices/${id}/settle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId 
        },
        body: JSON.stringify({ paidAt: new Date().toISOString() })
      });
      if (!res.ok) throw new Error("Failed to settle invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/invoices/${id}/cancel`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId 
        },
        body: JSON.stringify({ reason: "Cancelled by user" })
      });
      if (!res.ok) throw new Error("Failed to cancel invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
    }
  });

  const handleExportCsv = async () => {
    try {
      const response = await fetch("/api/invoices/export/csv", {
        method: "GET",
        headers: {
          "x-session-id": sessionId || "",
        },
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      SENT: "bg-blue-100 text-blue-800",
      PAID: "bg-green-100 text-green-800",
      OVERDUE: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-200 text-gray-600"
    };
    const labels: Record<string, string> = {
      DRAFT: t.draft,
      SENT: t.sent,
      PAID: t.paid,
      OVERDUE: t.overdue,
      CANCELLED: t.cancelled
    };
    return (
      <Badge className={variants[status] || "bg-gray-100"} data-testid={`status-badge-${status.toLowerCase()}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getInvoiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      UPFRONT: t.upfront,
      MONTHLY: t.monthly,
      QUARTERLY: t.quarterly,
      FINAL: t.final,
      SUCCESS_FEE: t.successFee
    };
    return labels[type] || type;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(num || 0);
  };

  const canManage = userRole === "admin";
  const canSend = userRole === "admin" || userRole === "ops";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="finance-title">
          <DollarSign className="w-6 h-6" />
          {t.title}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCsv}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.exportCsv}
          </Button>
          {canManage && (
            <Button data-testid="button-create-invoice" disabled>
              <Plus className="w-4 h-4 mr-2" />
              {t.createInvoice}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-total-invoiced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.totalInvoiced}
            </CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? "..." : formatCurrency(summary?.totalInvoiced || 0)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-received">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.received}
            </CardTitle>
            <Check className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryLoading ? "..." : formatCurrency(summary?.totalReceived || 0)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-pending">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.pending}
            </CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryLoading ? "..." : formatCurrency(summary?.totalPending || 0)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-overdue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.overdue}
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryLoading ? "..." : formatCurrency(summary?.totalOverdue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t.invoices}
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder={t.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="DRAFT">{t.draft}</SelectItem>
                <SelectItem value="SENT">{t.sent}</SelectItem>
                <SelectItem value="PAID">{t.paid}</SelectItem>
                <SelectItem value="OVERDUE">{t.overdue}</SelectItem>
                <SelectItem value="CANCELLED">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-invoices">
              {t.noInvoices}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">#</th>
                    <th className="text-left py-3 px-2 font-medium">{t.dealId}</th>
                    <th className="text-left py-3 px-2 font-medium">{t.invoiceType}</th>
                    <th className="text-right py-3 px-2 font-medium">{t.amount}</th>
                    <th className="text-left py-3 px-2 font-medium">{t.paymentTrigger}</th>
                    <th className="text-left py-3 px-2 font-medium">{t.dueDate}</th>
                    <th className="text-left py-3 px-2 font-medium">{t.status}</th>
                    <th className="text-right py-3 px-2 font-medium">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50" data-testid={`row-invoice-${invoice.id}`}>
                      <td className="py-3 px-2 font-mono text-sm">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-2 font-mono text-sm">{invoice.dealId.substring(0, 8)}...</td>
                      <td className="py-3 px-2">{getInvoiceTypeLabel(invoice.invoiceType)}</td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(invoice.grossAmountBrl)}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {invoice.paymentTrigger || "-"}
                      </td>
                      <td className="py-3 px-2">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "dd/MM/yyyy") : "-"}
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex gap-1 justify-end">
                          {invoice.status === "DRAFT" && canSend && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendMutation.mutate(invoice.id)}
                              disabled={sendMutation.isPending}
                              data-testid={`button-send-${invoice.id}`}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              {t.send}
                            </Button>
                          )}
                          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && canManage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => settleMutation.mutate(invoice.id)}
                              disabled={settleMutation.isPending}
                              data-testid={`button-settle-${invoice.id}`}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {t.markPaid}
                            </Button>
                          )}
                          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && canManage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => cancelMutation.mutate(invoice.id)}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${invoice.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
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
  );
}
