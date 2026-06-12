import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, AlertTriangle, CheckCircle2, Save } from "lucide-react";

// A supplier only appears in the RFQ picker if it has a GD coverage row
// (server getEligibleGdSuppliers). This editor lets ops set covered states +
// distributors so new/edited suppliers actually become RFQ-eligible.

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface SupplierGdCoverageEditorProps {
  supplierId: number;
  supplierName: string;
}

export function SupplierGdCoverageEditor({ supplierId, supplierName }: SupplierGdCoverageEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}/gd-coverage`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/suppliers/${supplierId}/gd-coverage`);
      return res.json();
    },
  });
  const coverage = data?.coverage;

  const [states, setStates] = useState<string[]>([]);
  const [nationwide, setNationwide] = useState(false);
  const [distributors, setDistributors] = useState("");

  useEffect(() => {
    if (coverage) {
      const cs: string[] = coverage.coveredStates || [];
      setNationwide(cs.includes("ALL"));
      setStates(cs.filter((s: string) => s !== "ALL"));
      setDistributors((coverage.coveredDistributors || []).join(", "));
    }
  }, [coverage]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const coveredStates = nationwide ? ["ALL"] : states;
      const coveredDistributors = distributors
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const res = await apiRequest("PUT", `/api/suppliers/${supplierId}/gd-coverage`, {
        coveredStates,
        coveredDistributors,
        isActive: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/gd-coverage`] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/gd-eligible"] });
      toast({ title: "Cobertura salva", description: `${supplierName} já pode receber RFQs.` });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
    },
  });

  const toggleState = (s: string) =>
    setStates((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const hasCoverage = !!coverage && ((coverage.coveredStates?.length || 0) > 0);

  return (
    <Card data-testid={`supplier-gd-coverage-${supplierId}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cobertura GD
          </CardTitle>
          {hasCoverage ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Elegível para RFQ
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Sem cobertura
            </Badge>
          )}
        </div>
        <CardDescription>
          Estados e distribuidoras que este fornecedor atende — sem isso ele não aparece nas RFQs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasCoverage && !isLoading && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Este fornecedor ainda não tem cobertura GD configurada, por isso não aparece como opção ao enviar RFQs.
            Configure abaixo e salve.
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`nationwide-${supplierId}`}
            checked={nationwide}
            onChange={(e) => setNationwide(e.target.checked)}
            data-testid={`nationwide-${supplierId}`}
          />
          <Label htmlFor={`nationwide-${supplierId}`} className="cursor-pointer text-sm">
            Cobertura nacional (todos os estados)
          </Label>
        </div>

        {!nationwide && (
          <div>
            <Label className="text-xs text-muted-foreground">Estados atendidos</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {BR_STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleState(s)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    states.includes(s)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/30"
                  }`}
                  data-testid={`state-${s}-${supplierId}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">
            Distribuidoras atendidas (separadas por vírgula)
          </Label>
          <Input
            value={distributors}
            onChange={(e) => setDistributors(e.target.value)}
            placeholder="Light, CEMIG, CPFL Paulista…"
            className="mt-1"
            data-testid={`distributors-${supplierId}`}
          />
        </div>

        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid={`save-coverage-${supplierId}`}
        >
          <Save className="h-4 w-4 mr-1" />
          {saveMutation.isPending ? "Salvando…" : "Salvar cobertura"}
        </Button>
      </CardContent>
    </Card>
  );
}
