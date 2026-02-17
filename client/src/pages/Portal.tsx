import { useEffect, useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Clock,
  Check,
  ShieldCheck,
  FileSignature,
  Send,
  PartyPopper
} from "lucide-react";

const LGPD_CONSENT_TEXT = `A Ótima Energia Ltda. ("Ótima"), inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, na qualidade de Controladora de Dados, coleta e trata seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018).

Dados coletados: nome, e-mail, telefone, CNPJ/CPF, dados de consumo energético (faturas), informações contratuais.

Finalidades: (i) análise de viabilidade para migração ao mercado livre de energia; (ii) elaboração de propostas comerciais; (iii) comunicação sobre o andamento do processo; (iv) cumprimento de obrigações legais e regulatórias.

Base legal: consentimento do titular (Art. 7º, I, LGPD) e execução de contrato ou procedimentos preliminares (Art. 7º, V, LGPD).

Seus direitos: acesso, correção, exclusão, portabilidade e revogação do consentimento, mediante solicitação ao e-mail privacidade@otimaenergia.com.

Os dados serão armazenados pelo prazo necessário ao cumprimento das finalidades descritas e poderão ser compartilhados com parceiros comercializadores de energia estritamente para a prestação dos serviços contratados.`;

const LOA_TEXT = `Eu, abaixo identificado(a), na qualidade de representante legal da empresa cliente, AUTORIZO a Ótima Energia Ltda. ("Ótima"), inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, a:

1. Solicitar e receber informações junto a distribuidoras de energia elétrica, comercializadoras e à Câmara de Comercialização de Energia Elétrica (CCEE) em nome da empresa;

2. Representar a empresa em processos de migração para o mercado livre de energia, incluindo adesão à CCEE, contratação de energia e gestão de contratos;

3. Acessar dados de consumo, faturamento e perfil energético da empresa junto aos órgãos competentes;

4. Negociar condições comerciais junto a fornecedores de energia em nome da empresa.

Esta autorização é válida pelo prazo de 12 (doze) meses a partir da data de assinatura, podendo ser revogada a qualquer momento mediante comunicação por escrito ao e-mail contato@otimaenergia.com.`;

interface PortalSession {
  id: number;
  requiresCode: boolean;
  expectedBillsCount?: number;
  requireLOA?: boolean;
  requireLGPD?: boolean;
  trackId?: number;
  dealId?: number;
  intakeType?: string;
}

interface ClientInfo {
  id: number;
  companyName: string;
}

interface StepDef {
  key: string;
  label: string;
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted" data-testid="ecos-status-indicator">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium">Status:</span>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>

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

function StepperProgressBar({ steps, currentStepIndex }: { steps: StepDef[]; currentStepIndex: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6" data-testid="stepper-progress">
      {steps.map((step, i) => {
        const isCompleted = i < currentStepIndex;
        const isCurrent = i === currentStepIndex;
        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div className={`w-6 sm:w-10 h-0.5 ${isCompleted ? "bg-emerald-500" : "bg-gray-300"}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                data-testid={`stepper-dot-${step.key}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] sm:text-xs leading-tight text-center ${isCurrent ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Portal() {
  const params = useParams<{ token: string }>();
  const token = params.token!;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [lgpdSubmitting, setLgpdSubmitting] = useState(false);
  const [lgpdDone, setLgpdDone] = useState(false);

  const [loaAccepted, setLoaAccepted] = useState(false);
  const [loaSubmitting, setLoaSubmitting] = useState(false);
  const [loaDone, setLoaDone] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerDocument, setSignerDocument] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const isNewIntake = !!(session?.trackId || session?.requireLGPD || session?.requireLOA);
  const expectedBills = session?.expectedBillsCount || 6;

  const steps = useMemo<StepDef[]>(() => {
    if (!isNewIntake) return [];
    const s: StepDef[] = [{ key: "faturas", label: "Faturas" }];
    if (session?.requireLGPD) s.push({ key: "lgpd", label: "LGPD" });
    if (session?.requireLOA) s.push({ key: "loa", label: "LOA" });
    s.push({ key: "envio", label: "Envio" });
    return s;
  }, [isNewIntake, session?.requireLGPD, session?.requireLOA]);

  useEffect(() => {
    validateToken();
  }, [token]);

  async function validateToken() {
    try {
      const response = await fetch(`/api/portal/upload/validate/${token}`);
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
      const response = await fetch(`/api/portal/upload/verify/${token}`, {
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
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "x-portal-token": token }
    });
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
          headers: {
            "Content-Type": "application/json",
            "x-portal-token": token
          },
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

  async function handleLgpdSubmit() {
    setLgpdSubmitting(true);
    try {
      const response = await fetch(`/api/portal/intake/${token}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentType: "LGPD",
          consentVersion: "v1",
          consentText: LGPD_CONSENT_TEXT,
          signatureMethod: "checkbox"
        })
      });
      const data = await response.json();
      if (data.success) {
        setLgpdDone(true);
        goToNextStep();
      } else {
        toast({ title: "Erro", description: "Não foi possível registrar o consentimento.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar consentimento LGPD.", variant: "destructive" });
    } finally {
      setLgpdSubmitting(false);
    }
  }

  async function handleLoaSubmit() {
    setLoaSubmitting(true);
    try {
      const consentRes = await fetch(`/api/portal/intake/${token}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentType: "LOA",
          consentVersion: "v1",
          consentText: LOA_TEXT,
          signatureMethod: "checkbox",
          signerName,
          signerRole,
          signerEmail,
          signerDocument: signerDocument || undefined
        })
      });
      const consentData = await consentRes.json();
      if (!consentData.success) {
        toast({ title: "Erro", description: "Não foi possível registrar a autorização.", variant: "destructive" });
        return;
      }

      await fetch(`/api/portal/intake/${token}/generate-loa-pdf`, { method: "POST" });

      setLoaDone(true);
      goToNextStep();
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar autorização LOA.", variant: "destructive" });
    } finally {
      setLoaSubmitting(false);
    }
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/portal/intake/${token}/complete`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setCompleted(true);
      } else {
        toast({ title: "Erro", description: "Não foi possível finalizar o envio.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao finalizar.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function goToNextStep() {
    setCurrentStep(prev => prev + 1);
  }

  function currentStepKey() {
    if (!isNewIntake) return "faturas";
    return steps[currentStep]?.key || "faturas";
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

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4" data-testid="portal-complete">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="py-12 space-y-4">
            <PartyPopper className="w-16 h-16 mx-auto text-emerald-500" />
            <h2 className="text-2xl font-bold">Obrigado!</h2>
            <p className="text-muted-foreground">
              Seus documentos foram recebidos com sucesso. Nossa equipe entrará em contato em breve para dar continuidade ao seu processo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-4 md:p-8" data-testid="portal-page">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight">ÓTIMA ENERGIA</h1>
          <p className="text-muted-foreground mt-1">Portal do Cliente</p>
        </div>

        {client && (
          <div className="text-center mb-6">
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
        ) : isNewIntake ? (
          <div className="space-y-6">
            <StepperProgressBar steps={steps} currentStepIndex={currentStep} />

            {currentStepKey() === "faturas" && (
              <div className="space-y-4">
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
                  <CardContent className="space-y-4">
                    <ObjectUploader
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      maxNumberOfFiles={expectedBills}
                      maxFileSize={10 * 1024 * 1024}
                      buttonTestId="button-upload-files"
                    >
                      Selecionar Arquivos
                    </ObjectUploader>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium" data-testid="upload-progress">
                          Enviadas {uploadedFiles.length} de {expectedBills}
                        </p>
                        <ul className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm" data-testid={`uploaded-file-${index}`}>
                              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                              <span className="truncate">{file}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={goToNextStep}
                      className="w-full"
                      disabled={uploadedFiles.length < 1}
                      data-testid="button-next-step"
                    >
                      Próximo
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStepKey() === "lgpd" && (
              <Card data-testid="portal-lgpd-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Consentimento LGPD
                  </CardTitle>
                  <CardDescription>
                    Leia atentamente a política de privacidade e uso de dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="max-h-48 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground whitespace-pre-line bg-white"
                    data-testid="lgpd-consent-text"
                  >
                    {LGPD_CONSENT_TEXT}
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="lgpd-check"
                      checked={lgpdAccepted}
                      onCheckedChange={(v) => setLgpdAccepted(v === true)}
                      data-testid="checkbox-lgpd"
                    />
                    <Label htmlFor="lgpd-check" className="text-sm leading-tight cursor-pointer">
                      Li e concordo com a política de privacidade e uso de dados
                    </Label>
                  </div>

                  <Button
                    onClick={handleLgpdSubmit}
                    className="w-full"
                    disabled={!lgpdAccepted || lgpdSubmitting}
                    data-testid="button-lgpd-accept"
                  >
                    {lgpdSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                    Aceitar e Continuar
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStepKey() === "loa" && (
              <Card data-testid="portal-loa-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-primary" />
                    Carta de Autorização (LOA)
                  </CardTitle>
                  <CardDescription>
                    Autorize a Ótima Energia a atuar em nome da sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="max-h-48 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground whitespace-pre-line bg-white"
                    data-testid="loa-consent-text"
                  >
                    {LOA_TEXT}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="signerName">Nome completo *</Label>
                      <Input
                        id="signerName"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Nome do representante legal"
                        data-testid="input-signer-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signerRole">Cargo *</Label>
                      <Input
                        id="signerRole"
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        placeholder="Ex: Diretor, Sócio"
                        data-testid="input-signer-role"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signerEmail">E-mail *</Label>
                      <Input
                        id="signerEmail"
                        type="email"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        data-testid="input-signer-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signerDocument">CPF (opcional)</Label>
                      <Input
                        id="signerDocument"
                        value={signerDocument}
                        onChange={(e) => setSignerDocument(e.target.value)}
                        placeholder="000.000.000-00"
                        data-testid="input-signer-document"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="loa-check"
                      checked={loaAccepted}
                      onCheckedChange={(v) => setLoaAccepted(v === true)}
                      data-testid="checkbox-loa"
                    />
                    <Label htmlFor="loa-check" className="text-sm leading-tight cursor-pointer">
                      Autorizo a Ótima Energia a atuar em meu nome
                    </Label>
                  </div>

                  <Button
                    onClick={handleLoaSubmit}
                    className="w-full"
                    disabled={!loaAccepted || !signerName || !signerRole || !signerEmail || loaSubmitting}
                    data-testid="button-loa-sign"
                  >
                    {loaSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                    Assinar e Continuar
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStepKey() === "envio" && (
              <Card data-testid="portal-review-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Revisão e Envio
                  </CardTitle>
                  <CardDescription>
                    Confirme os itens abaixo e finalize o envio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3" data-testid="review-bills">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      <span className="text-sm">Faturas enviadas: {uploadedFiles.length}/{expectedBills}</span>
                    </li>
                    {session?.requireLGPD && (
                      <li className="flex items-center gap-3" data-testid="review-lgpd">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <span className="text-sm">LGPD: Aceito</span>
                      </li>
                    )}
                    {session?.requireLOA && (
                      <li className="flex items-center gap-3" data-testid="review-loa">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <span className="text-sm">LOA: Assinado</span>
                      </li>
                    )}
                  </ul>

                  <Button
                    onClick={handleFinalSubmit}
                    className="w-full"
                    disabled={submitting}
                    data-testid="button-submit-final"
                  >
                    {submitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                    Enviar
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
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
