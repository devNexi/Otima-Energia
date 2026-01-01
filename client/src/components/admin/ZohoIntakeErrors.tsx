import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Check, Clock, Eye, RefreshCw, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface ZohoIntakeError {
  id: number;
  zohoLeadId: string | null;
  receivedAt: string;
  payloadJson: any;
  errorType: string;
  errorMessage: string;
  errorDetails: any;
  ipAddress: string | null;
  userAgent: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedNotes: string | null;
}

const errorTypeColors: Record<string, string> = {
  AUTH_FAILED: "bg-red-100 text-red-800 border-red-300",
  VALIDATION_ERROR: "bg-yellow-100 text-yellow-800 border-yellow-300",
  INTERNAL_ERROR: "bg-purple-100 text-purple-800 border-purple-300",
  DUPLICATE_REJECTED: "bg-blue-100 text-blue-800 border-blue-300"
};

export function ZohoIntakeErrors() {
  const { toast } = useToast();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [selectedError, setSelectedError] = useState<ZohoIntakeError | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/zoho-intake-errors", showResolved],
    queryFn: async () => {
      const sessionId = localStorage.getItem("adminSessionId");
      const res = await fetch(`/api/admin/zoho-intake-errors?showResolved=${showResolved}`, {
        headers: { "x-session-id": sessionId || "" }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const sessionId = localStorage.getItem("adminSessionId");
      const res = await fetch(`/api/admin/zoho-intake-errors/${id}/resolve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || "" 
        },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) throw new Error("Failed to resolve");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "pt" ? "Sucesso" : "Success",
        description: language === "pt" ? "Erro marcado como resolvido" : "Error marked as resolved"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/zoho-intake-errors"] });
      setResolveDialogOpen(false);
      setResolveNotes("");
      setSelectedError(null);
    },
    onError: () => {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" ? "Falha ao resolver erro" : "Failed to resolve error",
        variant: "destructive"
      });
    }
  });

  const errors: ZohoIntakeError[] = data?.errors || [];
  const unresolvedCount = errors.filter(e => !e.resolved).length;

  return (
    <div className="space-y-4" data-testid="zoho-intake-errors">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {language === "pt" ? "Erros de Intake Zoho" : "Zoho Intake Errors"}
          </h2>
          <p className="text-sm text-gray-500">
            {language === "pt" 
              ? "Requests falhados do Zoho CRM para revisão" 
              : "Failed requests from Zoho CRM for review"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="show-resolved" 
              checked={showResolved} 
              onCheckedChange={setShowResolved}
              data-testid="switch-show-resolved"
            />
            <Label htmlFor="show-resolved" className="text-sm">
              {language === "pt" ? "Mostrar resolvidos" : "Show resolved"}
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-errors">
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "pt" ? "Atualizar" : "Refresh"}
          </Button>
        </div>
      </div>

      {!showResolved && unresolvedCount === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-700">
              <Check className="w-5 h-5" />
              <span>{language === "pt" ? "Nenhum erro pendente!" : "No pending errors!"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          {language === "pt" ? "Carregando..." : "Loading..."}
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((error) => (
            <Card 
              key={error.id} 
              className={error.resolved ? "opacity-60" : ""}
              data-testid={`card-error-${error.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={errorTypeColors[error.errorType] || "bg-gray-100"}>
                      {error.errorType}
                    </Badge>
                    {error.resolved && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        <Check className="w-3 h-3 mr-1" />
                        {language === "pt" ? "Resolvido" : "Resolved"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {new Date(error.receivedAt).toLocaleString()}
                  </div>
                </div>
                <CardTitle className="text-sm font-medium mt-2">
                  {error.zohoLeadId 
                    ? `Lead: ${error.zohoLeadId}` 
                    : (language === "pt" ? "Lead ID não disponível" : "Lead ID not available")}
                </CardTitle>
                <CardDescription className="text-red-600 font-mono text-xs">
                  {error.errorMessage}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    IP: {error.ipAddress || "Unknown"}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid={`button-view-error-${error.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          {language === "pt" ? "Detalhes" : "Details"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>{language === "pt" ? "Detalhes do Erro" : "Error Details"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-gray-500">Payload</Label>
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(error.payloadJson, null, 2)}
                            </pre>
                          </div>
                          {error.errorDetails && (
                            <div>
                              <Label className="text-xs text-gray-500">{language === "pt" ? "Detalhes do Erro" : "Error Details"}</Label>
                              <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-48 text-red-700">
                                {JSON.stringify(error.errorDetails, null, 2)}
                              </pre>
                            </div>
                          )}
                          {error.resolvedNotes && (
                            <div>
                              <Label className="text-xs text-gray-500">{language === "pt" ? "Notas de Resolução" : "Resolution Notes"}</Label>
                              <p className="bg-green-50 p-3 rounded text-sm">{error.resolvedNotes}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {language === "pt" ? "Resolvido por" : "Resolved by"} {error.resolvedBy} {language === "pt" ? "em" : "on"} {error.resolvedAt ? new Date(error.resolvedAt).toLocaleString() : ""}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {!error.resolved && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          setSelectedError(error);
                          setResolveDialogOpen(true);
                        }}
                        data-testid={`button-resolve-error-${error.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {language === "pt" ? "Resolver" : "Resolve"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "pt" ? "Resolver Erro" : "Resolve Error"}</DialogTitle>
            <DialogDescription>
              {language === "pt" 
                ? "Adicione notas sobre como este erro foi tratado" 
                : "Add notes about how this error was handled"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={language === "pt" ? "Notas de resolução..." : "Resolution notes..."}
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            data-testid="input-resolve-notes"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              {language === "pt" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={() => selectedError && resolveMutation.mutate({ id: selectedError.id, notes: resolveNotes })}
              disabled={resolveMutation.isPending}
              data-testid="button-confirm-resolve"
            >
              {resolveMutation.isPending 
                ? (language === "pt" ? "Resolvendo..." : "Resolving...")
                : (language === "pt" ? "Marcar Resolvido" : "Mark Resolved")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
