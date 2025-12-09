import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileCheck, Loader2, CheckCircle } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50" data-testid="portal-loading">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50 p-4">
        <Card className="max-w-md w-full" data-testid="portal-error">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 p-4 md:p-8" data-testid="portal-page">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-violet-900">Ótima Energia</h1>
          <p className="text-violet-600 mt-2">Portal do Cliente</p>
        </div>

        {!verified ? (
          <Card data-testid="portal-verify-card">
            <CardHeader>
              <CardTitle>Verificação de Acesso</CardTitle>
              <CardDescription>
                Digite o código de acesso enviado para você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accessCode">Código de Acesso</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="000000"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  data-testid="input-access-code"
                />
              </div>
              <Button 
                onClick={handleVerifyCode} 
                className="w-full bg-violet-600 hover:bg-violet-700"
                data-testid="button-verify"
              >
                Verificar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="portal-upload-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Envio de Faturas de Energia
              </CardTitle>
              <CardDescription>
                {client?.companyName && (
                  <span className="font-medium text-violet-600">{client.companyName}</span>
                )}
                <br />
                Envie suas faturas de energia para análise do seu perfil de consumo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-violet-200 rounded-lg p-8 text-center bg-violet-50/50">
                <ObjectUploader
                  maxNumberOfFiles={10}
                  maxFileSize={20 * 1024 * 1024}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="bg-violet-600 hover:bg-violet-700"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Selecionar Arquivos</span>
                  </div>
                </ObjectUploader>
                <p className="text-sm text-gray-500 mt-4">
                  Formatos aceitos: PDF, JPG, PNG (máx. 20MB por arquivo)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2" data-testid="uploaded-files-list">
                  <h3 className="font-medium text-sm text-gray-700">Arquivos Enviados:</h3>
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded"
                      data-testid={`uploaded-file-${index}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {file}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-violet-50 rounded-lg p-4">
                <h3 className="font-medium text-violet-900 mb-2">
                  <FileCheck className="w-4 h-4 inline mr-2" />
                  Próximos Passos
                </h3>
                <ol className="text-sm text-violet-700 space-y-1 list-decimal list-inside">
                  <li>Nossa equipe analisará suas faturas</li>
                  <li>Identificaremos oportunidades de economia</li>
                  <li>Você receberá uma proposta personalizada</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
