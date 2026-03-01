import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from "lucide-react";

interface ExtractedData {
  uc: string;
  consumo: string;
  demanda: string;
  valor: string;
  distribuidora: string;
  mes: string;
}

interface OcrResult {
  success: boolean;
  upload_id: number;
  data: ExtractedData;
  confidence: number;
  needs_manual: boolean;
  message: string;
}

interface BillUploadSectionProps {
  clientId: number;
  clientName: string;
  onClose?: () => void;
}

const DISTRIBUTORS = [
  { value: "CPFL", label: "CPFL Energia" },
  { value: "EDP", label: "EDP São Paulo" },
  { value: "Enel", label: "Enel Distribuição" },
  { value: "Cemig", label: "Cemig" },
  { value: "Light", label: "Light" },
  { value: "Neoenergia", label: "Neoenergia" },
  { value: "Energisa", label: "Energisa" },
  { value: "Celesc", label: "Celesc" },
  { value: "CEB", label: "CEB Distribuição" },
  { value: "Copel", label: "Copel" },
  { value: "Equatorial", label: "Equatorial" },
];

export function BillUploadSection({ clientId, clientName, onClose }: BillUploadSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExtractedData>({
    uc: "",
    consumo: "",
    demanda: "",
    valor: "",
    distribuidora: "",
    mes: ""
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Tipo de arquivo inválido. Use PDF, JPG ou PNG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const uploadData = new FormData();
      uploadData.append("bill", file);

      setProgress(30);

      const response = await fetch(`/api/clients/${clientId}/upload-bill`, {
        method: "POST",
        body: uploadData,
      });

      setProgress(70);

      const data = await response.json();

      if (data.success) {
        setProgress(100);
        setOcrResult(data);
        setFormData({
          uc: data.data.uc || "",
          consumo: data.data.consumo || "",
          demanda: data.data.demanda || "",
          valor: data.data.valor || "",
          distribuidora: data.data.distribuidora || "",
          mes: data.data.mes || ""
        });
      } else {
        setError(data.error || "Erro no processamento do arquivo.");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const saveManualMutation = useMutation({
    mutationFn: async () => {
      if (!ocrResult) return;
      const response = await fetch(`/api/bill-uploads/${ocrResult.upload_id}/save-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Dados salvos com sucesso!" });
      setOcrResult(null);
      setFormData({ uc: "", consumo: "", demanda: "", valor: "", distribuidora: "", mes: "" });
      onClose?.();
    },
    onError: () => {
      toast({ title: "Erro ao salvar dados.", variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!formData.uc || !formData.consumo || !formData.valor) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Por favor, preencha UC, Consumo e Valor Total.",
        variant: "destructive"
      });
      return;
    }
    saveManualMutation.mutate();
  };

  const confidencePercent = ocrResult ? (() => { let c = ocrResult.confidence; if (c > 100) c = c / 10000; else if (c > 1) c = c / 100; return Math.round(c * 100); })() : 0;

  return (
    <Card className="border-2 border-violet-200" data-testid="bill-upload-section">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-600" />
          Upload de Fatura - {clientName}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-upload">
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-red-700" data-testid="upload-error">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!ocrResult && (
          <div 
            className="border-2 border-dashed border-violet-300 rounded-lg p-8 text-center cursor-pointer hover:bg-violet-50 transition-colors"
            onClick={() => document.getElementById("bill-file-input")?.click()}
            data-testid="upload-area"
          >
            <Upload className="w-12 h-12 mx-auto mb-3 text-violet-400" />
            <p className="font-medium text-gray-700">Clique para enviar fatura</p>
            <p className="text-sm text-gray-500 mt-1">
              Arraste ou clique para enviar PDF, JPG ou PNG
            </p>
            <p className="text-xs text-gray-400 mt-2">Máximo: 10MB</p>
            <input
              id="bill-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
              data-testid="input-bill-file"
            />
          </div>
        )}

        {uploading && (
          <div className="space-y-2" data-testid="upload-progress">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-gray-600">
              {progress < 50 ? "Enviando arquivo..." : "Processando OCR..."} {progress}%
            </p>
          </div>
        )}

        {ocrResult && (
          <div className="space-y-4" data-testid="ocr-result">
            <div className={`rounded-md p-3 flex items-center gap-2 ${
              confidencePercent >= 70 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            }`}>
              {confidencePercent >= 70 ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <div>
                <p className="font-medium">
                  {confidencePercent >= 70 
                    ? `Dados Extraídos (${confidencePercent}% de confiança)` 
                    : `OCR de Baixa Confiança (${confidencePercent}%)`}
                </p>
                <p className="text-sm opacity-80">
                  {ocrResult.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uc">UC (Unidade Consumidora) *</Label>
                <Input
                  id="uc"
                  value={formData.uc}
                  onChange={(e) => setFormData({ ...formData, uc: e.target.value })}
                  placeholder="Ex: 123.456.789.0"
                  className={formData.uc ? "border-green-300" : ""}
                  data-testid="input-uc"
                />
              </div>
              <div>
                <Label htmlFor="consumo">Consumo (kWh) *</Label>
                <Input
                  id="consumo"
                  value={formData.consumo}
                  onChange={(e) => setFormData({ ...formData, consumo: e.target.value })}
                  placeholder="Ex: 1.234,56"
                  className={formData.consumo ? "border-green-300" : ""}
                  data-testid="input-consumo"
                />
              </div>
              <div>
                <Label htmlFor="demanda">Demanda (kW)</Label>
                <Input
                  id="demanda"
                  value={formData.demanda}
                  onChange={(e) => setFormData({ ...formData, demanda: e.target.value })}
                  placeholder="Ex: 123,45"
                  className={formData.demanda ? "border-green-300" : ""}
                  data-testid="input-demanda"
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor Total (R$) *</Label>
                <Input
                  id="valor"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="Ex: 1.234,56"
                  className={formData.valor ? "border-green-300" : ""}
                  data-testid="input-valor"
                />
              </div>
              <div>
                <Label htmlFor="distribuidora">Distribuidora</Label>
                <Select 
                  value={formData.distribuidora} 
                  onValueChange={(value) => setFormData({ ...formData, distribuidora: value })}
                >
                  <SelectTrigger data-testid="select-distribuidora">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRIBUTORS.map((dist) => (
                      <SelectItem key={dist.value} value={dist.value}>
                        {dist.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mes">Mês Referência</Label>
                <Input
                  id="mes"
                  value={formData.mes}
                  onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                  placeholder="MM/AAAA (Ex: 12/2024)"
                  className={formData.mes ? "border-green-300" : ""}
                  data-testid="input-mes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setOcrResult(null);
                  setFormData({ uc: "", consumo: "", demanda: "", valor: "", distribuidora: "", mes: "" });
                }}
                data-testid="button-cancel-bill"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveManualMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700"
                data-testid="button-save-bill"
              >
                {saveManualMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Dados da Fatura
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
