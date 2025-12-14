import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Copy, MessageCircle, Eye, Edit, Loader2 } from "lucide-react";
import type { Client, SupplierQuote } from "@shared/schema";

interface ProposalGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  quote: SupplierQuote;
}

export function ProposalGenerator({ open, onOpenChange, client, quote }: ProposalGeneratorProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("preview");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [proposalCreated, setProposalCreated] = useState<{ id: number; trackingToken: string; proposalNumber: string } | null>(null);
  
  const [editableValues, setEditableValues] = useState({
    validityDays: 15,
    customNotes: "",
  });

  const priceType = quote.priceRmwh ? "fixed" : "pld_spread";
  const currentCostMonthly = parseFloat(client.avgConsumptionKwh || "0") * parseFloat(client.currentPriceRmwh || "0") / 1000;
  const proposedCostMonthly = parseFloat(client.avgConsumptionKwh || "0") * parseFloat(quote.priceRmwh || "0") / 1000;
  const monthlySavings = currentCostMonthly - proposedCostMonthly;
  const annualSavings = monthlySavings * 12;
  const savingsPercent = currentCostMonthly > 0 ? (monthlySavings / currentCostMonthly * 100) : 0;

  const createProposalMutation = useMutation({
    mutationFn: async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + editableValues.validityDays);
      
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          quoteId: quote.id,
          rfoId: quote.rfqId || null,
          validUntil: validUntil.toISOString(),
          clientName: client.companyName,
          clientCnpj: client.cnpj,
          ucCode: client.ucCode,
          consumptionMwh: client.avgConsumptionKwh ? (parseFloat(client.avgConsumptionKwh) / 1000).toFixed(2) : null,
          supplierName: quote.supplierName,
          priceStructure: priceType === "fixed" ? `R$ ${quote.priceRmwh}/MWh` : `PLD + ${quote.pldSpreadRmwh}/MWh`,
          contractDuration: quote.contractDuration,
          contractType: quote.contractType,
          currentAnnualCost: (currentCostMonthly * 12).toFixed(2),
          proposedAnnualCost: (proposedCostMonthly * 12).toFixed(2),
          annualSavings: annualSavings.toFixed(2),
          savingsPercentage: savingsPercent.toFixed(1),
          priceRmwh: quote.priceRmwh,
          priceType: priceType,
          contractDurationMonths: quote.contractDuration,
          contractType: quote.contractType,
          notes: editableValues.customNotes || null,
          status: "draft",
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create proposal");
      return response.json();
    },
    onSuccess: (data) => {
      setProposalCreated({
        id: data.proposal.id,
        trackingToken: data.proposal.trackingToken,
        proposalNumber: data.proposal.proposalNumber,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: t("proposal.toast.created"),
        description: `Proposta ${data.proposal.proposalNumber} criada`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar proposta",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("proposal-preview-content");
      if (!element) throw new Error("Preview element not found");
      
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `proposta-${proposalCreated?.proposalNumber || "rascunho"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };
      
      await html2pdf().set(opt).from(element).save();
      toast({ title: t("proposal.toast.pdf_generated") });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    if (!proposalCreated) return;
    const link = `${window.location.origin}/proposal/view/${proposalCreated.trackingToken}`;
    navigator.clipboard.writeText(link);
    toast({ title: t("proposal.toast.copied") });
  };

  const handleWhatsApp = () => {
    if (!proposalCreated) return;
    const link = `${window.location.origin}/proposal/view/${proposalCreated.trackingToken}`;
    const phone = client.phone?.replace(/\D/g, "") || "";
    const message = encodeURIComponent(
      `Olá ${client.contactPerson || client.companyName}!\n\n` +
      `Segue sua proposta comercial da Ótima Energia:\n${link}\n\n` +
      `Proposta nº ${proposalCreated.proposalNumber}\n` +
      `Economia estimada: ${savingsPercent.toFixed(1)}% (R$ ${annualSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por ano)`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
  };

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + editableValues.validityDays);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("proposal.title")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("proposal.preview")}
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              {t("proposal.edit_values")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div id="proposal-preview-content" className="bg-white p-8 rounded-lg border" style={{ fontFamily: "Arial, sans-serif" }}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-emerald-700">ÓTIMA ENERGIA</h1>
                <p className="text-sm text-gray-500">Corretora de Energia do Mercado Livre</p>
              </div>

              <div className="border-b-2 border-emerald-600 pb-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{t("proposal.title")}</h2>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-500">{t("proposal.number")}:</span>{" "}
                    <strong>{proposalCreated?.proposalNumber || "RASCUNHO"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("proposal.date")}:</span>{" "}
                    <strong>{formatDate(new Date())}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("proposal.valid_until")}:</span>{" "}
                    <strong>{formatDate(validUntilDate)}</strong>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">{t("proposal.client")}</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-medium">{client.companyName}</p>
                  {client.cnpj && <p className="text-sm text-gray-600">CNPJ: {client.cnpj}</p>}
                  {client.contactPerson && <p className="text-sm text-gray-600">Contato: {client.contactPerson}</p>}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">{t("proposal.supplier")}</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-medium">{quote.supplierName}</p>
                  <p className="text-sm text-gray-600">
                    {priceType === "fixed" ? t("proposal.fixed_price") : t("proposal.pld_spread")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h4 className="text-sm font-medium text-red-700 mb-1">{t("proposal.current_cost")}</h4>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(currentCostMonthly * 12)}/ano</p>
                  <p className="text-sm text-gray-500">{formatCurrency(currentCostMonthly)}/mês</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
                  <h4 className="text-sm font-medium text-emerald-700 mb-1">{t("proposal.proposed_cost")}</h4>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(proposedCostMonthly * 12)}/ano</p>
                  <p className="text-sm text-gray-500">{formatCurrency(proposedCostMonthly)}/mês</p>
                </div>
              </div>

              <div className="bg-emerald-100 p-6 rounded-lg text-center mb-6">
                <h4 className="text-lg font-medium text-emerald-800 mb-2">{t("proposal.annual_savings")}</h4>
                <p className="text-3xl font-bold text-emerald-700">{formatCurrency(annualSavings)}</p>
                <p className="text-lg text-emerald-600">{savingsPercent.toFixed(1)}% de economia</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Condições Comerciais</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">{t("proposal.price_rmwh")}</td>
                      <td className="py-2 font-medium text-right">R$ {parseFloat(quote.priceRmwh || "0").toFixed(2)}/MWh</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">{t("proposal.contract_duration")}</td>
                      <td className="py-2 font-medium text-right">{quote.contractDuration || 12} meses</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">{t("proposal.modulation")}</td>
                      <td className="py-2 font-medium text-right">Flat</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">{t("proposal.flexibility")}</td>
                      <td className="py-2 font-medium text-right">±10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4 mt-6 text-xs text-gray-500">
                <h4 className="font-medium text-gray-700 mb-2">{t("proposal.terms_title")}</h4>
                <ul className="space-y-1">
                  <li>• {t("proposal.terms_aneel")}</li>
                  <li>• {t("proposal.terms_ccee")}</li>
                  <li>• {t("proposal.terms_lei")}</li>
                </ul>
                <p className="mt-4 text-center italic">{t("proposal.commission_note")}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Validade (dias)</Label>
                <Input
                  type="number"
                  value={editableValues.validityDays}
                  onChange={(e) => setEditableValues({ ...editableValues, validityDays: parseInt(e.target.value) || 15 })}
                  min={1}
                  max={90}
                />
              </div>
            </div>
            <div>
              <Label>Observações Personalizadas</Label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                value={editableValues.customNotes}
                onChange={(e) => setEditableValues({ ...editableValues, customNotes: e.target.value })}
                placeholder="Adicione notas ou condições especiais..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
          {!proposalCreated ? (
            <Button
              onClick={() => createProposalMutation.mutate()}
              disabled={createProposalMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-create-proposal"
            >
              {createProposalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Criar Proposta
            </Button>
          ) : (
            <>
              <Button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                variant="outline"
                data-testid="button-download-pdf"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {t("proposal.download_pdf")}
              </Button>
              <Button onClick={handleCopyLink} variant="outline" data-testid="button-copy-link">
                <Copy className="h-4 w-4 mr-2" />
                {t("proposal.copy_link")}
              </Button>
              <Button onClick={handleWhatsApp} variant="outline" className="text-green-600" data-testid="button-send-whatsapp">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("proposal.send_whatsapp")}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
