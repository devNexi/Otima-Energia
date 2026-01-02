import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users,
  Building2,
  FileText,
  TrendingUp,
  Phone,
  Mail,
  MessageSquare,
  ArrowRight,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send
} from "lucide-react";

interface WorklistItem {
  id: number;
  entityType: 'client' | 'deal' | 'proposal';
  name: string;
  status: string;
  nextAction: string;
  actionLabel: string;
  blocker?: string;
  priority: 'high' | 'medium' | 'low';
  deepLink: string;
}

export function SalesDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['/api/sales/kpis'],
    queryFn: async () => {
      const res = await fetch('/api/sales/kpis');
      return res.json();
    }
  });

  const { data: worklist, isLoading: worklistLoading } = useQuery({
    queryKey: ['/api/sales/worklist'],
    queryFn: async () => {
      const res = await fetch('/api/sales/worklist');
      return res.json();
    }
  });

  const kpiCards = [
    {
      title: "Deals Ativos",
      description: "Em andamento",
      value: kpis?.activeDeals ?? 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Aguardando Cotação",
      description: "Sem resposta",
      value: kpis?.dealsAwaitingQuote ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Clientes s/ Dossiê",
      description: "Aguardando contas",
      value: kpis?.clientsAwaitingDossier ?? 0,
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Propostas Enviadas",
      description: "Aguardando decisão",
      value: kpis?.proposalsSent ?? 0,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const entityIcons = {
    client: Building2,
    deal: FileText,
    proposal: Send
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">Seu resumo diário de atividades</p>
        </div>
      </div>

      {kpisLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title} data-testid={`kpi-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Próximas Ações
          </CardTitle>
          <CardDescription>
            Tarefas prioritárias para hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          {worklistLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !worklist?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>Nenhuma ação pendente. Bom trabalho!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worklist.items.map((item: WorklistItem) => {
                const Icon = entityIcons[item.entityType];
                return (
                  <div
                    key={`${item.entityType}-${item.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`worklist-item-${item.entityType}-${item.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.entityType === 'client' ? 'Cliente' :
                             item.entityType === 'deal' ? 'Negócio' : 'Proposta'}
                          </Badge>
                          <Badge className={priorityColors[item.priority]}>
                            {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.nextAction}
                        </p>
                        {item.blocker && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {item.blocker}
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={item.deepLink}>
                      <Button size="sm" data-testid={`action-${item.entityType}-${item.id}`}>
                        {item.actionLabel}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
