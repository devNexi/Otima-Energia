import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  Calendar, 
  Zap,
  AlertTriangle,
  AlertCircle,
  Clock
} from "lucide-react";

interface PortalSession {
  id: number;
  requiresCode: boolean;
}

interface ClientInfo {
  id: number;
  companyName: string;
}

const statusConfig: Record<string, { label: string; color: string; Icon: any }> = {
  within_band: { label: "Dentro da Faixa", color: "bg-green-100 text-green-800 border-green-300", Icon: CheckCircle },
  at_risk: { label: "Em Risco", color: "bg-yellow-100 text-yellow-800 border-yellow-300", Icon: AlertTriangle },
  above_band: { label: "Acima da Faixa", color: "bg-red-100 text-red-800 border-red-300", Icon: AlertCircle },
  no_data: { label: "Sem Dados", color: "bg-gray-100 text-gray-600 border-gray-300", Icon: Clock }
};

function EcosStatusCard({ clientId }: { clientId?: number }) {
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: [`/api/ecos/status/${clientId}`],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/ecos/status/${clientId}`);
      return res.json();
    },
    enabled: !!clientId
  });

  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: [`/api/ecos/contracts/${clientId}`],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/ecos/contracts/${clientId}`);
      return res.json();
    },
    enabled: !!clientId
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: [`/api/ecos/reports/client/${clientId}`],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/ecos/reports/client/${clientId}`);
      return res.json();
    },
    enabled: !!clientId
  });

  const isLoading = statusLoading || contractsLoading || reportsLoading;
  const ecosStatus = statusData?.success ? statusData.status : null;
  const contracts = contractsData?.contracts || [];
  const reports = reportsData?.reports || [];
  
  const activeContract = contracts.find((c: any) => c.status === "active");
  const latestReport = reports.length > 0 ? reports[0] : null;
  
  const status = ecosStatus?.statusResult || "no_data";
  const { label: statusLabel, color: statusColor, Icon: StatusIcon } = statusConfig[status] || statusConfig.no_data;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getNextReviewDate = () => {
    if (!activeContract?.contractEnd) return null;
    const expiry = new Date(activeContract.contractEnd);
    const reviewDate = new Date(expiry);
    reviewDate.setMonth(reviewDate.getMonth() - 3);
    if (reviewDate <= new Date()) return "Em breve";
    return reviewDate.toLocaleDateString("pt-BR");
  };

  if (!clientId) return null;

  if (isLoading) {
    return (
      <Card data-testid="portal-ecos-loading">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="portal-ecos-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          Resumo Energético
        </CardTitle>
        <CardDescription>
          Acompanhe seu contrato e status de energia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted" data-testid="ecos-status-indicator">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium">Status:</span>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>

        {/* Contract Summary */}
        {activeContract ? (
          <div className="p-3 rounded-lg border" data-testid="ecos-contract-summary">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Contrato Ativo</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Fornecedor:</span>
                <p className="font-medium">{activeContract.supplierName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vencimento:</span>
                <p className="font-medium">{formatDate(activeContract.contractEnd)}</p>
              </div>
              {ecosStatus?.contractRemainingMonths && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Tempo restante:</span>
                  <p className="font-medium">{ecosStatus.contractRemainingMonths} meses</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed text-center text-muted-foreground" data-testid="ecos-no-contract">
            <FileText className="w-5 h-5 mx-auto mb-1" />
            <p className="text-sm">Nenhum contrato ativo</p>
          </div>
        )}

        {/* Last Report */}
        {latestReport ? (
          <div className="p-3 rounded-lg border" data-testid="ecos-last-report">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Último Relatório</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Período:</span>
                <p className="font-medium">{latestReport.quarter} {latestReport.year}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Score:</span>
                <p className="font-medium">{latestReport.healthScore}/100</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Next Review Date */}
        {getNextReviewDate() && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200" data-testid="ecos-next-review">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Próxima revisão:</span>
            </div>
            <span className="text-sm font-medium text-blue-700">{getNextReviewDate()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Portal() {
  const params = useParams<{ token: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, [params.token]);

  async function validateToken() {
    try {
      const response = await fetch(`/api/portal/upload/validate/${params.token}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || "Link inválido ou expirado");
        setLoading(false);
        return;
      }

      setSession(data.session);
      setClient(data.client);
      
      if (!data.session.requiresCode) {
        setVerified(true);
      }
      
      setLoading(false);
    } catch (err) {
      setError("Erro ao validar link");
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    try {
      const response = await fetch(`/api/portal/upload/verify/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode })
      });
      const data = await response.json();
      
      if (data.success) {
        setVerified(true);
      } else {
        toast({
          title: "Código inválido",
          description: "Por favor, verifique o código e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar o código.",
        variant: "destructive"
      });
    }
  }

  async function handleGetUploadParameters() {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL
    };
  }

  async function handleUploadComplete(result: any) {
    const uploaded = result.successful || [];
    
    if (!client?.id || !session?.id) {
      toast({
        title: "Erro no upload",
        description: "Sessão inválida. Por favor, recarregue a página.",
        variant: "destructive"
      });
      return;
    }
    
    for (const file of uploaded) {
      try {
        const response = await fetch("/api/consumption-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client.id,
            dataSource: "bill_upload",
            fileUrl: file.uploadURL,
            originalFilename: file.name,
            uploadSessionId: session.id
          })
        });
        
        if (response.ok) {
          setUploadedFiles(prev => [...prev, file.name]);
        } else {
          console.error("Error registering file:", await response.text());
        }
      } catch (err) {
        console.error("Error registering file:", err);
      }
    }

    toast({
      title: "Upload concluído!",
      description: `${uploaded.length} arquivo(s) enviado(s) com sucesso.`
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted" data-testid="portal-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="max-w-md w-full" data-testid="portal-error">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-4 md:p-8" data-testid="portal-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary tracking-tight">ÓTIMA ENERGIA</h1>
          <p className="text-muted-foreground mt-2">Portal do Cliente</p>
        </div>

        {/* Company Info */}
        {client && (
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">Bem-vindo</p>
            <h2 className="text-xl font-semibold text-foreground">{client.companyName}</h2>
          </div>
        )}

        {!verified ? (
          <Card data-testid="portal-verify-card">
            <CardHeader>
              <CardTitle>Verificação de Acesso</CardTitle>
              <CardDescription>
                Digite o código de acesso de 6 dígitos enviado para você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accessCode">Código de Acesso</Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  data-testid="input-access-code"
                />
              </div>
              <Button 
                onClick={handleVerifyCode} 
                className="btn-primary w-full"
                disabled={accessCode.length !== 6}
                data-testid="button-verify-code"
              >
                Verificar
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* ECOS Status Summary */}
            <EcosStatusCard clientId={client?.id} />

            <Card data-testid="portal-upload-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload de Faturas
                </CardTitle>
                <CardDescription>
                  Envie suas faturas de energia para análise. Aceitos: PDF, JPG, PNG (máx. 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ObjectUploader
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  maxFileSize={10 * 1024 * 1024}
                  buttonTestId="button-upload-files"
                >
                  Selecionar Arquivos
                </ObjectUploader>
              </CardContent>
            </Card>

            {uploadedFiles.length > 0 && (
              <Card data-testid="portal-uploaded-files">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Arquivos Enviados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {file}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>Após o envio, nossa equipe analisará suas faturas e entrará em contato.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
