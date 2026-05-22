import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, AlertCircle, CheckCircle, X,
  Loader2, Eye, ExternalLink, AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

interface ExtractedFields {
  distributor:       string | null;
  referenceMonth:    string | null;
  totalEnergyKwh:    number | null;
  totalAmount:       number | null;
  customerId:        string | null;
  ucCode:            string | null;
  tariffGroup:       string | null;
  grupo:             string | null;
  subgrupo:          string | null;
  modalidade:        string | null;
  bandeira:          string | null;
  endereco:          string | null;
  invoiceKey:        string | null;
  consumoPonta:      number | null;
  consumoForaPonta:  number | null;
  demandaContratada: number | null;
  demandaMedida:     number | null;
  confidence:        number;
  warnings:          string[];
}

interface PreviewResult {
  success: true;
  previewOnly: true;
  extracted: ExtractedFields;
  parserHealthy: boolean;
  ocrDegraded: boolean;
}

interface BillUploadSectionProps {
  clientId: number;
  clientName: string;
  onClose?: () => void;
}

type FieldRow = { label: string; value: string | number | null; key: string };

function buildGroups(e: ExtractedFields): { title: string; fields: FieldRow[] }[] {
  const fmt = (v: number | null, decimals = 2) =>
    v != null ? v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : null;

  return [
    {
      title: "Identidade",
      fields: [
        { key: "distributor",    label: "Distribuidora",           value: e.distributor },
        { key: "referenceMonth", label: "Mês de Referência",       value: e.referenceMonth },
        { key: "customerId",     label: "CNPJ do Cliente",         value: e.customerId },
        { key: "ucCode",         label: "Unidade Consumidora (UC)", value: e.ucCode },
        { key: "endereco",       label: "Endereço",                value: e.endereco },
        { key: "invoiceKey",     label: "Chave da Nota",           value: e.invoiceKey },
      ],
    },
    {
      title: "Tarifa",
      fields: [
        { key: "tariffGroup", label: "Grupo Tarifário", value: e.tariffGroup },
        { key: "grupo",       label: "Grupo",           value: e.grupo },
        { key: "subgrupo",    label: "Subgrupo",        value: e.subgrupo },
        { key: "modalidade",  label: "Modalidade",      value: e.modalidade },
        { key: "bandeira",    label: "Bandeira",        value: e.bandeira },
      ],
    },
    {
      title: "Consumo",
      fields: [
        { key: "totalEnergyKwh",   label: "Consumo Total (kWh)",      value: fmt(e.totalEnergyKwh) },
        { key: "consumoPonta",     label: "Consumo Ponta (kWh)",      value: fmt(e.consumoPonta) },
        { key: "consumoForaPonta", label: "Consumo Fora Ponta (kWh)", value: fmt(e.consumoForaPonta) },
      ],
    },
    {
      title: "Demanda",
      fields: [
        { key: "demandaContratada", label: "Demanda Contratada (kW)", value: fmt(e.demandaContratada) },
        { key: "demandaMedida",     label: "Demanda Medida (kW)",     value: fmt(e.demandaMedida) },
      ],
    },
    {
      title: "Pagamento",
      fields: [
        { key: "totalAmount", label: "Valor Total (R$)", value: fmt(e.totalAmount) },
      ],
    },
  ].map(g => ({ ...g, fields: g.fields.filter(f => f.value != null) }))
   .filter(g => g.fields.length > 0);
}

function confidenceLabel(c: number): { text: string; color: string } {
  const pct = c > 1 ? Math.round(c) : Math.round(c * 100);
  if (pct >= 80) return { text: `Alta confiança (${pct}%)`, color: "text-green-700" };
  if (pct >= 55) return { text: `Confiança média (${pct}%)`, color: "text-yellow-700" };
  return { text: `Baixa confiança (${pct}%)`, color: "text-red-700" };
}

export function BillUploadSection({ clientId, clientName, onClose }: BillUploadSectionProps) {
  const { toast } = useToast();
  const [uploading, setUploading]     = useState(false);
  const [result, setResult]           = useState<PreviewResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("Enviando arquivo...");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setProgressMsg("Enviando arquivo...");

    try {
      const fd = new FormData();
      fd.append("bill", file);

      const progressTimer = setTimeout(() => setProgressMsg("Analisando fatura com IA..."), 3000);

      const resp = await fetch(`/api/clients/${clientId}/upload-bill`, {
        method: "POST",
        body: fd,
      });

      clearTimeout(progressTimer);

      const data = await resp.json();

      if (data.success && data.previewOnly) {
        setResult(data as PreviewResult);
      } else {
        const cat = data.errorCategory || "";
        let msg = data.error || "Erro ao processar arquivo.";
        if (cat === "TIMEOUT")            msg = "A análise demorou mais que o esperado. Tente novamente.";
        if (cat === "PARSER_UNREACHABLE") msg = "Serviço de análise indisponível. Tente mais tarde.";
        if (cat === "FORMAT_NOT_RECOGNIZED") msg = "Formato não reconhecido. Envie uma fatura de energia em PDF.";
        setError(msg);
      }
    } catch {
      setError("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setResult(null);
    setError(null);
    const input = document.getElementById("bill-preview-input") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <Card className="border-2 border-violet-200" data-testid="bill-upload-section">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-600" />
          Upload de Fatura — {clientName}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-upload">
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Preview-only banner — always visible once a result is shown */}
        {result && (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-800 text-sm"
            data-testid="preview-only-banner"
          >
            <Eye className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Visualização apenas</strong> — esta fatura não foi adicionada a nenhum negócio.
              Os dados abaixo são para conferência; nenhuma tabela do pipeline foi alterada.
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-red-700 text-sm"
            data-testid="upload-error"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Upload zone — hidden after success */}
        {!result && (
          <div
            className="border-2 border-dashed border-violet-300 rounded-lg p-8 text-center cursor-pointer hover:bg-violet-50 transition-colors"
            onClick={() => !uploading && document.getElementById("bill-preview-input")?.click()}
            data-testid="upload-area"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                <p className="text-sm font-medium text-gray-600">{progressMsg}</p>
                <p className="text-xs text-gray-400">Aguarde — pode levar até 30 segundos</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-violet-400" />
                <p className="font-medium text-gray-700">Clique para enviar fatura</p>
                <p className="text-sm text-gray-500 mt-1">Apenas PDF · Máximo 10 MB</p>
              </>
            )}
            <input
              id="bill-preview-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
              data-testid="input-bill-file"
            />
          </div>
        )}

        {/* Parsed field tables */}
        {result && (
          <div className="space-y-4" data-testid="preview-result">

            {/* Confidence + OCR status row */}
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const { text, color } = confidenceLabel(result.extracted.confidence);
                const isHigh = color.includes("green");
                return (
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${color}`}>
                    {isHigh
                      ? <CheckCircle className="w-4 h-4" />
                      : <AlertTriangle className="w-4 h-4" />}
                    {text}
                  </div>
                );
              })()}
              {result.ocrDegraded && (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300 text-xs">
                  OCR degradado
                </Badge>
              )}
            </div>

            {/* Warnings */}
            {result.extracted.warnings?.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 space-y-0.5">
                {result.extracted.warnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}

            {/* Field groups */}
            {buildGroups(result.extracted).map(group => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                  {group.title}
                </p>
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  {group.fields.map((field, idx) => (
                    <div
                      key={field.key}
                      className={`flex justify-between items-center px-3 py-2 text-sm ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      data-testid={`field-${field.key}`}
                    >
                      <span className="text-gray-500">{field.label}</span>
                      <span className="font-medium text-gray-800 text-right max-w-[60%] break-words">
                        {String(field.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetState}
                data-testid="button-upload-another"
              >
                Enviar outra fatura
              </Button>

              <Link href={`/admin/deals?clientId=${clientId}`}>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 gap-1.5"
                  data-testid="button-create-deal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Criar Negócio com esta Fatura
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
