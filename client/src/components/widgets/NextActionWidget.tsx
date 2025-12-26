import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap
} from "lucide-react";

interface NextActionWidgetProps {
  entityType: 'client' | 'deal';
  entityId: number;
  compact?: boolean;
}

export function NextActionWidget({ entityType, entityId, compact = false }: NextActionWidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/next-action/${entityType}/${entityId}`],
    queryFn: async () => {
      const res = await fetch(`/api/next-action/${entityType}/${entityId}`);
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.success) {
    return null;
  }

  const hasBlockers = data.blockers && data.blockers.length > 0;
  const isBlocked = data.blockers?.some((b: any) => b.severity === 'error');

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <Zap className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Próximo passo</p>
          {hasBlockers && (
            <p className="text-xs text-orange-600">{data.blockers[0].title}</p>
          )}
        </div>
        <Link href={data.deepLink}>
          <Button size="sm" variant={isBlocked ? "outline" : "default"}>
            {data.actionLabel}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          Próximo Passo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasBlockers ? (
          <div className="space-y-3">
            {data.blockers.map((blocker: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  blocker.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 ${
                      blocker.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{blocker.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{blocker.description}</p>
                  </div>
                  <Link href={blocker.deepLink}>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Corrigir
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm">Pronto para avançar</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Ação: <span className="font-medium text-foreground">{data.actionLabel}</span>
          </p>
          <Link href={data.deepLink}>
            <Button disabled={isBlocked} data-testid="button-next-action">
              {data.actionLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface BlockerBannerProps {
  dealId?: number;
  clientId?: number;
  action?: string;
}

export function BlockerBanner({ dealId, clientId, action }: BlockerBannerProps) {
  const endpoint = dealId
    ? `/api/blockers/send-rfq/${dealId}`
    : clientId
    ? `/api/blockers/create-deal/${clientId}`
    : null;

  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      if (!endpoint) return { isBlocked: false, blockers: [] };
      const res = await fetch(endpoint);
      return res.json();
    },
    enabled: !!endpoint
  });

  if (isLoading || !data?.isBlocked) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-red-800">Ação bloqueada</p>
          <p className="text-sm text-red-700 mt-1">
            Os seguintes requisitos precisam ser atendidos antes de continuar:
          </p>
          <ul className="mt-2 space-y-2">
            {data.blockers.map((blocker: any, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-red-600">•</span>
                <span>{blocker.title}</span>
                <Link href={blocker.deepLink}>
                  <Button size="sm" variant="link" className="text-red-700 h-auto p-0">
                    Corrigir agora
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
