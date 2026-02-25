import { useRoute } from "wouter";
import { ClientDossierTab } from "@/components/dossier/ClientDossierTab";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function DossierPage() {
  const [, params] = useRoute("/admin/dossier/:clientId");
  const clientId = parseInt(params?.clientId || "0");

  const { data: clientData, isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${clientId}`);
      return res.json();
    },
    enabled: clientId > 0
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const client = clientData?.client || clientData;
  const clientName = client?.companyName || client?.contactPerson || `Client #${clientId}`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold" data-testid="text-dossier-title">
          Dossiê — {clientName}
        </h1>
      </div>
      <ClientDossierTab clientId={clientId} clientName={clientName} />
    </div>
  );
}
