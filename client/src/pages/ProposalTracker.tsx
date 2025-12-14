import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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
  ExternalLink
} from "lucide-react";
import type { Proposal } from "@shared/schema";

type ProposalStatus = "all" | "draft" | "sent" | "viewed" | "negotiating" | "accepted" | "rejected" | "expired";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  negotiating: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function ProposalTracker() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ProposalStatus>("all");

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ["/api/proposals"],
    queryFn: async () => {
      const res = await fetch("/api/proposals");
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/proposals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({ title: t("proposal.toast.status_updated") });
    },
  });

  const proposals: Proposal[] = proposalsData?.proposals || [];

  const filteredProposals = proposals.filter((p: Proposal) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const stats = {
    total: proposals.length,
    sent: proposals.filter((p: Proposal) => ["sent", "viewed", "negotiating", "accepted", "rejected"].includes(p.status || "")).length,
    viewed: proposals.filter((p: Proposal) => (p.viewedCount || 0) > 0).length,
    accepted: proposals.filter((p: Proposal) => p.status === "accepted").length,
    conversionRate: proposals.length > 0 
      ? ((proposals.filter((p: Proposal) => p.status === "accepted").length / proposals.length) * 100).toFixed(1)
      : "0",
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/proposal/view/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: t("proposal.toast.copied") });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return parseFloat(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
                  {t("proposal.tracker.title")}
                </h1>
                <p className="text-sm text-gray-500">Acompanhe suas propostas comerciais</p>
              </div>
            </div>
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
                  <p className="text-sm text-gray-500">{t("proposal.tracker.total")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.sent")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-sent">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.viewed")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-viewed">{stats.viewed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.accepted")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-accepted">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">{t("proposal.tracker.conversion")}</p>
                  <p className="text-2xl font-bold" data-testid="stat-conversion">{stats.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("proposal.tracker.title")}</CardTitle>
              <Select value={filter} onValueChange={(v) => setFilter(v as ProposalStatus)}>
                <SelectTrigger className="w-40" data-testid="select-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("proposal.tracker.filter.all")}</SelectItem>
                  <SelectItem value="draft">{t("proposal.tracker.filter.draft")}</SelectItem>
                  <SelectItem value="sent">{t("proposal.tracker.filter.sent")}</SelectItem>
                  <SelectItem value="viewed">{t("proposal.tracker.filter.viewed")}</SelectItem>
                  <SelectItem value="accepted">{t("proposal.tracker.filter.accepted")}</SelectItem>
                  <SelectItem value="rejected">{t("proposal.tracker.filter.rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma proposta encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Proposta</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Valor</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Economia</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Views</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Validade</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProposals.map((proposal: Proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50" data-testid={`row-proposal-${proposal.id}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{proposal.proposalNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(proposal.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {proposal.clientName || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(proposal.proposedAnnualCost)}
                          <div className="text-xs text-gray-500">/ano</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-600 font-medium">
                            {formatCurrency(proposal.annualSavings)}
                          </span>
                          <div className="text-xs text-gray-500">{proposal.savingsPercentage}%</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[proposal.status || "draft"]}>
                            {t(`proposal.status.${proposal.status}` as any) || proposal.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span>{proposal.viewedCount || 0}</span>
                          </div>
                          {proposal.lastViewed && (
                            <div className="text-xs text-gray-500">
                              {formatDate(proposal.lastViewed)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatDate(proposal.validUntil)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${proposal.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyLink(proposal.trackingToken || "")}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => window.open(`/proposal/view/${proposal.trackingToken}`, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {proposal.status === "draft" && (
                                <DropdownMenuItem 
                                  onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "sent" })}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Marcar Enviada
                                </DropdownMenuItem>
                              )}
                              {["sent", "viewed", "negotiating"].includes(proposal.status || "") && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "accepted" })}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                    Marcar Aceita
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "rejected" })}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                    Marcar Recusada
                                  </DropdownMenuItem>
                                </>
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
    </div>
  );
}
