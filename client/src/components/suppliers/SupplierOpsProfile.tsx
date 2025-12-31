import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ContextualTooltip } from "@/components/ops/ContextualTooltip";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  FileText, 
  Mail, 
  MessageSquare, 
  Phone, 
  Globe, 
  Building2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ShieldCheck,
  DollarSign,
  Calendar,
  FileCheck,
  Settings
} from "lucide-react";

interface SupplierOpsProfileProps {
  supplierId: number;
  supplierName: string;
}

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  PHONE: Phone,
  PORTAL: Globe
};

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  PHONE: "Telefone",
  PORTAL: "Portal"
};

export function SupplierOpsProfile({ supplierId, supplierName }: SupplierOpsProfileProps) {
  const { data: playbookData, isLoading } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}/rfq-playbook`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/suppliers/${supplierId}/rfq-playbook`);
      return res.json();
    }
  });

  const playbook = playbookData?.playbook;
  const ChannelIcon = playbook?.preferredChannel ? CHANNEL_ICONS[playbook.preferredChannel] : Mail;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!playbook) {
    return (
      <Card className="border-dashed border-amber-300">
        <CardContent className="py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Nenhum playbook operacional configurado para {supplierName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Configure o playbook para garantir processos de RFQ padronizados
          </p>
        </CardContent>
      </Card>
    );
  }

  const slaConfig = playbook.slaConfig || {};
  const products = playbook.products || [];
  const submarkets = playbook.submarkets || [];
  const requiredDocs = playbook.requiredDocs || [];
  const guarantees = playbook.guarantees || [];

  return (
    <Card data-testid={`supplier-ops-profile-${supplierId}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferências Operacionais
          </CardTitle>
          {playbook.isActive && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          )}
        </div>
        <CardDescription>
          Configurações de RFQ e requisitos operacionais do fornecedor
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ContextualTooltip
            tooltipKey="ops_preferred_channel"
            title="Canal Preferido"
            content="O canal que o fornecedor prefere para receber solicitações de cotação. Use este canal para maximizar taxas de resposta."
            whyMatters="Enviar pelo canal errado pode atrasar ou perder a resposta."
            mode="hover"
          >
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ChannelIcon className="h-4 w-4" />
                Canal Preferido
              </div>
              <p className="font-medium">
                {CHANNEL_LABELS[playbook.preferredChannel] || playbook.preferredChannel}
              </p>
            </div>
          </ContextualTooltip>

          <ContextualTooltip
            tooltipKey="ops_response_sla"
            title="SLA de Resposta"
            content="Tempo esperado para o fornecedor responder RFQs. Após este prazo, considere follow-up ou escalar."
            whyMatters="Saber o SLA ajuda a planejar follow-ups e definir expectativas do cliente."
            mode="hover"
          >
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                SLA Resposta
              </div>
              <p className="font-medium">
                {slaConfig.responseDaysDefault || 3} dias
                {slaConfig.responseMaxDays && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (máx {slaConfig.responseMaxDays}d)
                  </span>
                )}
              </p>
            </div>
          </ContextualTooltip>

          <ContextualTooltip
            tooltipKey="ops_onboarding_sla"
            title="SLA Onboarding"
            content="Tempo médio desde a assinatura do contrato até o início do fornecimento. Use para informar expectativas do cliente."
            whyMatters="Clientes precisam planejar a transição. SLA incorreto = insatisfação."
            mode="hover"
          >
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Onboarding
              </div>
              <p className="font-medium">
                {playbook.onboardingSlaDays || "N/A"} dias
              </p>
            </div>
          </ContextualTooltip>

          <ContextualTooltip
            tooltipKey="ops_commission_format"
            title="Formato Comissão"
            content="Como o fornecedor reporta e paga comissões. Importante para reconciliação financeira."
            whyMatters="Formato incorreto = dificuldade de rastreamento e possível perda de receita."
            mode="hover"
          >
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Comissão
              </div>
              <p className="font-medium text-sm">
                {playbook.commissionReportingFormat || "Não definido"}
              </p>
            </div>
          </ContextualTooltip>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Produtos Oferecidos
            </h4>
            <div className="flex flex-wrap gap-1">
              {products.length > 0 ? products.map((product: string) => (
                <Badge key={product} variant="secondary" className="text-xs">
                  {product}
                </Badge>
              )) : (
                <span className="text-xs text-muted-foreground">Não especificado</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Submercados
            </h4>
            <div className="flex flex-wrap gap-1">
              {submarkets.length > 0 ? submarkets.map((submarket: string) => (
                <Badge key={submarket} variant="outline" className="text-xs">
                  {submarket}
                </Badge>
              )) : (
                <span className="text-xs text-muted-foreground">Todos</span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-green-500" />
              Documentos Exigidos
            </h4>
            {requiredDocs.length > 0 ? (
              <ul className="space-y-1">
                {requiredDocs.map((doc: string, idx: number) => (
                  <li key={idx} className="text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {doc}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-xs text-muted-foreground">Documentação padrão</span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
              Garantias Requeridas
            </h4>
            {guarantees.length > 0 ? (
              <ul className="space-y-1">
                {guarantees.map((guarantee: string, idx: number) => (
                  <li key={idx} className="text-xs flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-violet-500" />
                    {guarantee}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-xs text-muted-foreground">Verificar caso a caso</span>
            )}
          </div>
        </div>

        {playbook.rfqFormatNotes && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Formato de RFQ Preferido
              </h4>
              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                {playbook.rfqFormatNotes}
              </p>
            </div>
          </>
        )}

        {playbook.varianceTreatment && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Tratamento de Variância
            </h4>
            <p className="text-xs text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
              {playbook.varianceTreatment}
            </p>
          </div>
        )}

        {playbook.internalNotes && (
          <div className="mt-2 pt-2 border-t border-dashed">
            <p className="text-xs text-muted-foreground italic">
              <strong>Notas internas:</strong> {playbook.internalNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
