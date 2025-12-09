import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, ArrowRight } from "lucide-react";

interface PortalSession {
  id: number;
  requiresCode: boolean;
}

interface ClientInfo {
  id: number;
  companyName: string;
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
