import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Send,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from "lucide-react";

export function OpsDashboardQueues() {
  const { data: queues, isLoading } = useQuery({
    queryKey: ['/api/ops/queues'],
    queryFn: async () => {
      const res = await fetch('/api/ops/queues');
      return res.json();
    },
    refetchInterval: 60000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const blockedDeals = queues?.blockedDeals || [];
  const slaBreaches = queues?.slaBreaches || [];
  const overdueRevenue = queues?.overdueRevenue || [];
  const awaitingQuotes = queues?.awaitingQuotes || [];

  const totalIssues = blockedDeals.length + slaBreaches.length + overdueRevenue.length + awaitingQuotes.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Filas de Trabalho</h2>
          <p className="text-muted-foreground">
            {totalIssues === 0 ? 'Nenhum item pendente' : `${totalIssues} item(s) requerem atenção`}
          </p>
        </div>
        {totalIssues === 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Tudo em dia!</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="blocked" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="blocked" className="flex items-center gap-2" data-testid="queue-blocked">
            <ShieldAlert className="w-4 h-4" />
            Bloqueados
            {blockedDeals.length > 0 && (
              <Badge variant="destructive" className="ml-1">{blockedDeals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2" data-testid="queue-sla">
            <Clock className="w-4 h-4" />
            SLA
            {slaBreaches.length > 0 && (
              <Badge variant="destructive" className="ml-1">{slaBreaches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2" data-testid="queue-revenue">
            <DollarSign className="w-4 h-4" />
            Receita
            {overdueRevenue.length > 0 && (
              <Badge variant="destructive" className="ml-1">{overdueRevenue.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2" data-testid="queue-quotes">
            <Send className="w-4 h-4" />
            Cotações
            {awaitingQuotes.length > 0 && (
              <Badge className="ml-1 bg-yellow-500">{awaitingQuotes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Negócios Bloqueados
              </CardTitle>
              <CardDescription>
                Negócios travados por requisitos de compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedDeals.length === 0 ? (
                <EmptyQueue message="Nenhum negócio bloqueado" />
              ) : (
                <div className="space-y-3">
                  {blockedDeals.map((deal: any) => (
                    <QueueItem
                      key={deal.id}
                      title={deal.dealNumber || `Negócio #${deal.id}`}
                      subtitle={deal.clientName}
                      reason={deal.blockerReason}
                      deepLink={deal.deepLink}
                      actionLabel="Completar checklist"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-600" />
                Violações de SLA
              </CardTitle>
              <CardDescription>
                Fornecedores que não responderam dentro do prazo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slaBreaches.length === 0 ? (
                <EmptyQueue message="Nenhuma violação de SLA" />
              ) : (
                <div className="space-y-3">
                  {slaBreaches.map((breach: any) => (
                    <QueueItem
                      key={breach.id}
                      title={`Fornecedor #${breach.supplierId}`}
                      subtitle={`Tipo: ${breach.breachType}`}
                      reason={`Sem resposta há ${breach.ageHours}h`}
                      deepLink={breach.deepLink}
                      actionLabel="Cobrar fornecedor"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-red-600" />
                Receita Atrasada
              </CardTitle>
              <CardDescription>
                Comissões vencidas não pagas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueRevenue.length === 0 ? (
                <EmptyQueue message="Nenhuma receita atrasada" />
              ) : (
                <div className="space-y-3">
                  {overdueRevenue.map((event: any) => (
                    <QueueItem
                      key={event.id}
                      title={`Negócio #${event.dealId}`}
                      subtitle={`R$ ${parseFloat(event.amountR || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      reason={`Vencido: ${new Date(event.dueDate).toLocaleDateString('pt-BR')}`}
                      deepLink={event.deepLink}
                      actionLabel="Levantar disputa"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="w-5 h-5 text-yellow-600" />
                Aguardando Cotações
              </CardTitle>
              <CardDescription>
                RFQs enviados há mais de 48h sem resposta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {awaitingQuotes.length === 0 ? (
                <EmptyQueue message="Todas as cotações respondidas" />
              ) : (
                <div className="space-y-3">
                  {awaitingQuotes.map((rfo: any) => (
                    <QueueItem
                      key={rfo.id}
                      title={rfo.rfoNumber || `RFQ #${rfo.id}`}
                      subtitle={`Cliente #${rfo.clientId}`}
                      reason={`Enviado há ${rfo.ageHours}h`}
                      deepLink={rfo.deepLink}
                      actionLabel="Enviar follow-up"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyQueue({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
      <p>{message}</p>
    </div>
  );
}

function QueueItem({ 
  title, 
  subtitle, 
  reason, 
  deepLink, 
  actionLabel 
}: { 
  title: string; 
  subtitle: string; 
  reason: string; 
  deepLink: string; 
  actionLabel: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">· {subtitle}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-orange-600 mt-1">
          <AlertCircle className="w-3 h-3" />
          {reason}
        </div>
      </div>
      <Link href={deepLink}>
        <Button size="sm">
          {actionLabel}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
