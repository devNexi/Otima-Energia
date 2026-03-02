import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  Loader2,
  RefreshCw,
  Download,
  Save,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { DictionaryTooltip } from "@/components/dictionary/DictionaryTooltip";
import { useI18n } from "@/lib/i18n";

interface ClientDossierTabProps {
  clientId: number;
  clientName: string;
}

const STATUS_BADGES: Record<string, { class: string; icon: any; label: string }> = {
  DRAFT: { class: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle, label: "Rascunho" },
  READY: { class: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2, label: "Pronto" },
  LOCKED: { class: "bg-blue-100 text-blue-800 border-blue-300", icon: Lock, label: "Bloqueado" }
};

const ELIGIBILITY_OPTIONS = [
  { value: 'ACL_DIRECT', label: 'Elegível ACL (Consumidor Livre)' },
  { value: 'ACL_VAREJISTA', label: 'Elegível ACL via Varejista' },
  { value: 'NOT_ELIGIBLE_YET', label: 'Não elegível / Em análise' }
];

const CONNECTION_OPTIONS = [
  { value: 'GROUP_A', label: 'Grupo A (Alta/Média Tensão)' },
  { value: 'GROUP_B', label: 'Grupo B (Baixa Tensão)' }
];

const SUBMARKET_OPTIONS = [
  { value: 'SE/CO', label: 'Sudeste/Centro-Oeste' },
  { value: 'S', label: 'Sul' },
  { value: 'NE', label: 'Nordeste' },
  { value: 'N', label: 'Norte' }
];

const CONFIDENCE_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' }
];

export function ClientDossierTab({ clientId, clientName }: ClientDossierTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const isPt = language === "pt";
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`/api/clients/${clientId}/dossier`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${clientId}/dossier`);
      return res.json();
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/clients/${clientId}/dossier/generate`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao gerar dossiê');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dossiê gerado!", description: "Dados extraídos automaticamente." });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/dossier`] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/clients/${clientId}/dossier`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar dossiê');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dossiê criado!" });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/dossier`] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/dossiers/${id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao atualizar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dossiê atualizado!" });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/dossier`] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const markReadyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/dossiers/${id}/mark-ready`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao marcar como pronto');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status atualizado!", description: "Dossiê marcado como PRONTO." });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/dossier`] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const handleDownloadPdf = async (dossierId: number) => {
    try {
      const res = await apiRequest("GET", `/api/dossiers/${dossierId}/pdf`);
      if (!res.ok) throw new Error('Falha ao gerar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dossie_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao baixar PDF", variant: "destructive" });
    }
  };

  const startEditing = (dossier: any) => {
    setFormData({
      legalName: dossier.legalName || '',
      tradeName: dossier.tradeName || '',
      cnpj: dossier.cnpj || '',
      distributor: dossier.distributor || '',
      submarket: dossier.submarket || '',
      connectionType: dossier.connectionType || '',
      eligibilityType: dossier.eligibilityType || 'NOT_ELIGIBLE_YET',
      annualConsumptionMWh: dossier.annualConsumptionMWh || '',
      averageMonthlyMWh: dossier.averageMonthlyMWh || '',
      peakDemandKW: dossier.peakDemandKW || '',
      numberOfUCs: dossier.numberOfUCs || 1,
      tariffClass: dossier.tariffClass || '',
      opsNotes: dossier.opsNotes || ''
    });
    setIsEditing(true);
  };

  const saveChanges = () => {
    if (data?.dossier) {
      updateMutation.mutate({ id: data.dossier.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, legalName: formData.legalName || clientName });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const dossier = data?.dossier;
  const statusInfo = dossier ? STATUS_BADGES[dossier.status] || STATUS_BADGES.DRAFT : null;
  const isLocked = dossier?.status === 'LOCKED';
  const isReady = dossier?.status === 'READY';

  // Check required fields for mark-ready
  const requiredFields = ['legalName', 'cnpj', 'distributor', 'eligibilityType', 'annualConsumptionMWh'];
  const missingFields = dossier 
    ? requiredFields.filter(f => !dossier[f])
    : requiredFields;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dossiê Energético
          </CardTitle>
          <CardDescription>
            Perfil de consumo padronizado para cotações
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {dossier && statusInfo && (
            <Badge className={statusInfo.class} data-testid="badge-dossier-status">
              <statusInfo.icon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          )}
          {dossier && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadPdf(dossier.id)}
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!dossier ? (
          <div className="text-center py-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">Nenhum dossiê encontrado</h3>
              <p className="text-muted-foreground text-sm">
                Crie um dossiê para habilitar o envio de RFQs.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                data-testid="button-generate-dossier"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Automaticamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFormData({ legalName: clientName });
                  setIsEditing(true);
                }}
                data-testid="button-create-manual"
              >
                Criar Manualmente
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Razão Social *</Label>
                <Input 
                  value={formData.legalName || ''} 
                  onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                  data-testid="input-legal-name"
                />
              </div>
              <div>
                <Label>Nome Fantasia</Label>
                <Input 
                  value={formData.tradeName || ''} 
                  onChange={(e) => setFormData({...formData, tradeName: e.target.value})}
                  data-testid="input-trade-name"
                />
              </div>
              <div>
                <Label>CNPJ *</Label>
                <Input 
                  value={formData.cnpj || ''} 
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  data-testid="input-cnpj"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">Distribuidora * <DictionaryTooltip termKey="distribuidora" /></Label>
                <Input 
                  value={formData.distributor || ''} 
                  onChange={(e) => setFormData({...formData, distributor: e.target.value})}
                  data-testid="input-distributor"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">Submercado <DictionaryTooltip termKey="submercado" /></Label>
                <Select 
                  value={formData.submarket || ''} 
                  onValueChange={(v) => setFormData({...formData, submarket: v})}
                >
                  <SelectTrigger data-testid="select-submarket">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBMARKET_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Conexão</Label>
                <Select 
                  value={formData.connectionType || ''} 
                  onValueChange={(v) => setFormData({...formData, connectionType: v})}
                >
                  <SelectTrigger data-testid="select-connection">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Elegibilidade *</Label>
                <Select 
                  value={formData.eligibilityType || 'NOT_ELIGIBLE_YET'} 
                  onValueChange={(v) => setFormData({...formData, eligibilityType: v})}
                >
                  <SelectTrigger data-testid="select-eligibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELIGIBILITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1">Consumo Anual (MWh) * <DictionaryTooltip termKey="consumo" /></Label>
                <Input 
                  type="number"
                  value={formData.annualConsumptionMWh || ''} 
                  onChange={(e) => setFormData({...formData, annualConsumptionMWh: e.target.value})}
                  data-testid="input-annual-consumption"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">Consumo Médio Mensal (MWh) <DictionaryTooltip termKey="consumo" /></Label>
                <Input 
                  type="number"
                  value={formData.averageMonthlyMWh || ''} 
                  onChange={(e) => setFormData({...formData, averageMonthlyMWh: e.target.value})}
                  data-testid="input-monthly-consumption"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">Demanda de Pico (kW) <DictionaryTooltip termKey="demanda" /></Label>
                <Input 
                  type="number"
                  value={formData.peakDemandKW || ''} 
                  onChange={(e) => setFormData({...formData, peakDemandKW: e.target.value})}
                  data-testid="input-peak-demand"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">Número de UCs <DictionaryTooltip termKey="uc" /></Label>
                <Input 
                  type="number"
                  value={formData.numberOfUCs || 1} 
                  onChange={(e) => setFormData({...formData, numberOfUCs: parseInt(e.target.value) || 1})}
                  data-testid="input-num-ucs"
                />
              </div>
              <div>
                <Label>Classe Tarifária</Label>
                <Input 
                  value={formData.tariffClass || ''} 
                  onChange={(e) => setFormData({...formData, tariffClass: e.target.value})}
                  placeholder="Ex: A4, A3, B3"
                  data-testid="input-tariff-class"
                />
              </div>
            </div>
            <div>
              <Label>Notas Internas (Ops)</Label>
              <Textarea 
                value={formData.opsNotes || ''} 
                onChange={(e) => setFormData({...formData, opsNotes: e.target.value})}
                placeholder="Observações internas..."
                data-testid="input-ops-notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={saveChanges} 
                disabled={updateMutation.isPending || createMutation.isPending}
                data-testid="button-save-dossier"
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Warning for missing fields */}
            {missingFields.length > 0 && dossier.status === 'DRAFT' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Campos obrigatórios faltando</p>
                  <p className="text-sm text-yellow-700">
                    Preencha os campos obrigatórios para marcar como PRONTO: {missingFields.join(', ')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Low confidence warning */}
            {dossier.confidenceScore === 'LOW' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Confiança Baixa</p>
                  <p className="text-sm text-orange-700">
                    Os dados precisam de validação manual antes de enviar RFQs.
                  </p>
                </div>
              </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Consumo Anual</div>
                  <div className="text-2xl font-bold" data-testid="value-annual-consumption">
                    {dossier.annualConsumptionMWh 
                      ? `${parseFloat(dossier.annualConsumptionMWh).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MWh`
                      : '—'
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Elegibilidade</div>
                  <div className="text-lg font-medium" data-testid="value-eligibility">
                    {ELIGIBILITY_OPTIONS.find(o => o.value === dossier.eligibilityType)?.label || dossier.eligibilityType}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Distribuidora</div>
                  <div className="text-lg font-medium" data-testid="value-distributor">
                    {dossier.distributor || '—'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details table */}
            <div className="border rounded-lg">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground w-1/3">Razão Social</td>
                    <td className="px-4 py-2">{dossier.legalName}</td>
                  </tr>
                  {dossier.tradeName && (
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium text-muted-foreground">Nome Fantasia</td>
                      <td className="px-4 py-2">{dossier.tradeName}</td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">CNPJ</td>
                    <td className="px-4 py-2">{dossier.cnpj || '—'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Submercado</td>
                    <td className="px-4 py-2">
                      {SUBMARKET_OPTIONS.find(o => o.value === dossier.submarket)?.label || dossier.submarket || '—'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Tipo de Conexão</td>
                    <td className="px-4 py-2">
                      {CONNECTION_OPTIONS.find(o => o.value === dossier.connectionType)?.label || dossier.connectionType || '—'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Consumo Médio Mensal</td>
                    <td className="px-4 py-2">
                      {dossier.averageMonthlyMWh 
                        ? `${parseFloat(dossier.averageMonthlyMWh).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MWh`
                        : '—'
                      }
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Demanda de Pico</td>
                    <td className="px-4 py-2">
                      {dossier.peakDemandKW 
                        ? `${parseFloat(dossier.peakDemandKW).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kW`
                        : '—'
                      }
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Número de UCs</td>
                    <td className="px-4 py-2">{dossier.numberOfUCs || 1}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Classe Tarifária</td>
                    <td className="px-4 py-2">{dossier.tariffClass || '—'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium text-muted-foreground">Confiança</td>
                    <td className="px-4 py-2">
                      <Badge variant={dossier.confidenceScore === 'HIGH' ? 'default' : dossier.confidenceScore === 'MEDIUM' ? 'secondary' : 'outline'}>
                        {CONFIDENCE_OPTIONS.find(o => o.value === dossier.confidenceScore)?.label || dossier.confidenceScore}
                      </Badge>
                    </td>
                  </tr>
                  {dossier.opsNotes && (
                    <tr>
                      <td className="px-4 py-2 font-medium text-muted-foreground">Notas Ops</td>
                      <td className="px-4 py-2 text-muted-foreground italic">{dossier.opsNotes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <div>
                {dossier.lastValidatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Última validação: {new Date(dossier.lastValidatedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!isLocked && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => startEditing(dossier)}
                      data-testid="button-edit-dossier"
                    >
                      Editar
                    </Button>
                    {dossier.status === 'DRAFT' && missingFields.length === 0 && (
                      <Button 
                        onClick={() => markReadyMutation.mutate(dossier.id)}
                        disabled={markReadyMutation.isPending}
                        data-testid="button-mark-ready"
                      >
                        {markReadyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Marcar como Pronto
                      </Button>
                    )}
                  </>
                )}
                {isLocked && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    Dossiê bloqueado (vinculado a RFQ)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
