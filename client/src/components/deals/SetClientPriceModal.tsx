import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calculator, DollarSign, Percent, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface Quote {
  id: string;
  dealId: string;
  supplierId: number;
  supplier?: { name: string };
  baseEnergyPriceRmwh: string | null;
  clientEnergyPriceRmwh?: string | null;
  upliftType?: string | null;
  upliftValue?: string | null;
  isProposalEligible?: boolean;
}

interface SetClientPriceModalProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetClientPriceModal({ quote, open, onOpenChange }: SetClientPriceModalProps) {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const isPt = language === "pt";

  const [upliftType, setUpliftType] = useState<"R_PER_MWH" | "PERCENT">("R_PER_MWH");
  const [upliftValue, setUpliftValue] = useState("");
  const [clientPrice, setClientPrice] = useState("");

  const basePrice = quote?.baseEnergyPriceRmwh ? parseFloat(quote.baseEnergyPriceRmwh) : 0;

  useEffect(() => {
    if (quote?.upliftValue && quote?.upliftType) {
      setUpliftType(quote.upliftType as "R_PER_MWH" | "PERCENT");
      setUpliftValue(quote.upliftValue);
    } else {
      setUpliftType("R_PER_MWH");
      setUpliftValue("");
    }
  }, [quote]);

  useEffect(() => {
    if (!upliftValue || isNaN(parseFloat(upliftValue))) {
      setClientPrice("");
      return;
    }

    const uplift = parseFloat(upliftValue);
    let calculatedPrice: number;

    if (upliftType === "R_PER_MWH") {
      calculatedPrice = basePrice + uplift;
    } else {
      calculatedPrice = basePrice * (1 + uplift / 100);
    }

    setClientPrice(calculatedPrice.toFixed(2));
  }, [upliftType, upliftValue, basePrice]);

  const setClientPriceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${quote!.dealId}/quotes/${quote!.id}/set-client-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upliftType,
          upliftValue
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: isPt ? "Preço ao cliente definido" : "Client price set",
          description: isPt 
            ? `Cotação agora elegível para propostas: R$ ${parseFloat(data.quote.clientEnergyPriceRmwh).toFixed(2)}/MWh`
            : `Quote now eligible for proposals: R$ ${parseFloat(data.quote.clientEnergyPriceRmwh).toFixed(2)}/MWh`,
        });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${quote!.dealId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/deals/${quote!.dealId}/eligible-quotes`] });
        onOpenChange(false);
      } else {
        toast({
          title: isPt ? "Erro" : "Error",
          description: data.error || (isPt ? "Falha ao definir preço" : "Failed to set price"),
          variant: "destructive"
        });
      }
    }
  });

  const handleSubmit = () => {
    if (!upliftValue || isNaN(parseFloat(upliftValue))) {
      toast({
        title: isPt ? "Valor inválido" : "Invalid value",
        description: isPt ? "Insira um valor de margem válido" : "Enter a valid margin value",
        variant: "destructive"
      });
      return;
    }
    setClientPriceMutation.mutate();
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {isPt ? "Definir Preço ao Cliente" : "Set Client Price"}
          </DialogTitle>
          <DialogDescription>
            {isPt 
              ? "Adicione sua margem sobre o preço base do fornecedor para gerar o preço final ao cliente."
              : "Add your margin on top of the supplier base price to generate the final client price."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{isPt ? "Fornecedor" : "Supplier"}</span>
              <span className="font-medium">{quote.supplier?.name || `#${quote.supplierId}`}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{isPt ? "Preço Base (interno)" : "Base Price (internal)"}</span>
              <span className="font-medium">R$ {basePrice.toFixed(2)}/MWh</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isPt ? "Tipo de Margem" : "Margin Type"}</Label>
              <Select value={upliftType} onValueChange={(v) => setUpliftType(v as "R_PER_MWH" | "PERCENT")}>
                <SelectTrigger data-testid="uplift-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="R_PER_MWH">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      R$/MWh
                    </div>
                  </SelectItem>
                  <SelectItem value="PERCENT">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      {isPt ? "Percentual %" : "Percentage %"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isPt ? "Valor da Margem" : "Margin Value"}</Label>
              <Input
                type="number"
                step="0.01"
                value={upliftValue}
                onChange={(e) => setUpliftValue(e.target.value)}
                placeholder={upliftType === "R_PER_MWH" ? "5.00" : "3.5"}
                data-testid="uplift-value-input"
              />
            </div>
          </div>

          {clientPrice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {isPt ? "Preço ao Cliente" : "Client Price"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">R$ {basePrice.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                    R$ {clientPrice}/MWh
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                {isPt 
                  ? "Este valor será mostrado ao cliente nas propostas. O preço base nunca é exposto."
                  : "This value will be shown to the client in proposals. Base price is never exposed."}
              </p>
            </div>
          )}

          {quote.isProposalEligible && (
            <Badge className="bg-blue-100 text-blue-800">
              {isPt ? "Já elegível para propostas" : "Already eligible for proposals"}
            </Badge>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isPt ? "Cancelar" : "Cancel"}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={setClientPriceMutation.isPending || !clientPrice}
            data-testid="confirm-client-price-btn"
          >
            {setClientPriceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPt ? "Confirmar Preço" : "Confirm Price"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
