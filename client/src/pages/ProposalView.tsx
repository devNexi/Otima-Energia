import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Building, Zap, Calendar, DollarSign, CheckCircle } from "lucide-react";
import type { Proposal } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  negotiating: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  viewed: "Visualizada",
  negotiating: "Em Negociação",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
};

export default function ProposalView() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/proposal/view/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/proposal/view/${token}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Proposal not found");
      }
      return res.json();
    },
    enabled: !!token,
  });

  const proposal: Proposal | undefined = data?.proposal;

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return parseFloat(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Proposta não encontrada</h2>
            <p className="text-gray-600">
              {error instanceof Error ? error.message : "Esta proposta pode ter expirado ou não existe."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-emerald-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Proposta Comercial
                  </h1>
                  <p className="text-sm text-gray-500">{proposal.proposalNumber}</p>
                </div>
              </div>
            </div>
            <Badge className={statusColors[proposal.status || "draft"]}>
              {statusLabels[proposal.status || "draft"] || proposal.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-500" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Empresa:</span>
              <span className="font-medium">{proposal.clientName}</span>
            </div>
            {proposal.clientCnpj && (
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJ:</span>
                <span className="font-medium">{proposal.clientCnpj}</span>
              </div>
            )}
            {proposal.distribuidora && (
              <div className="flex justify-between">
                <span className="text-gray-600">Distribuidora:</span>
                <span className="font-medium">{proposal.distribuidora}</span>
              </div>
            )}
            {proposal.consumptionMwh && (
              <div className="flex justify-between">
                <span className="text-gray-600">Consumo:</span>
                <span className="font-medium">{proposal.consumptionMwh} MWh/ano</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gray-500" />
              Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Fornecedor:</span>
              <span className="font-medium">{proposal.supplierName}</span>
            </div>
            {proposal.priceStructure && (
              <div className="flex justify-between">
                <span className="text-gray-600">Estrutura de Preço:</span>
                <span className="font-medium">{proposal.priceStructure}</span>
              </div>
            )}
            {proposal.contractDuration && (
              <div className="flex justify-between">
                <span className="text-gray-600">Duração do Contrato:</span>
                <span className="font-medium">{proposal.contractDuration} meses</span>
              </div>
            )}
            {proposal.contractStart && (
              <div className="flex justify-between">
                <span className="text-gray-600">Início:</span>
                <span className="font-medium">{formatDate(proposal.contractStart)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {(proposal.currentAnnualCost || proposal.proposedAnnualCost || proposal.annualSavings) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                Economia Projetada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.currentAnnualCost && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Atual (Anual):</span>
                  <span className="font-medium">{formatCurrency(proposal.currentAnnualCost)}</span>
                </div>
              )}
              {proposal.proposedAnnualCost && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Proposto (Anual):</span>
                  <span className="font-medium">{formatCurrency(proposal.proposedAnnualCost)}</span>
                </div>
              )}
              {proposal.annualSavings && (
                <div className="flex justify-between bg-emerald-50 p-3 rounded-lg -mx-3">
                  <span className="text-emerald-700 font-medium">Economia Anual:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(proposal.annualSavings)}
                    {proposal.savingsPercentage && ` (${proposal.savingsPercentage}%)`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              Validade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Data da Proposta:</span>
              <span className="font-medium">{formatDate(proposal.proposalDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Válida até:</span>
              <span className="font-medium">{formatDate(proposal.validUntil)}</span>
            </div>
          </CardContent>
        </Card>

        {proposal.status === "accepted" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Proposta Aceita</p>
              <p className="text-sm text-emerald-600">
                Esta proposta foi aceita pelo cliente.
              </p>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Ótima Energia - Sua parceira no mercado livre de energia</p>
        </div>
      </div>
    </div>
  );
}
