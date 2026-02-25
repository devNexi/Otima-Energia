import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifyCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

interface VerifyRoute {
  method: string;
  path: string;
  desc: string;
}

interface VerifyResult {
  success: boolean;
  summary: { total: number; pass: number; fail: number; warn: number };
  checks: VerifyCheck[];
  routes: VerifyRoute[];
  timestamp: string;
}

export default function VerificationPage() {
  const { data, isLoading, refetch, isFetching } = useQuery<VerifyResult>({
    queryKey: ['/api/admin/verify'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/verify");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warn': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'fail': return 'bg-red-50 text-red-700 border-red-200';
      case 'warn': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return '';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Shield className="w-6 h-6 text-blue-600" />
              Stage 1 Verification
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Bill-First Architecture end-to-end checks</p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-rerun-checks"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            Re-run Checks
          </Button>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              Running verification checks...
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <Card data-testid="card-summary">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-emerald-700" data-testid="text-pass-count">{data.summary.pass}</span>
                    <span className="text-sm text-muted-foreground">passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-700" data-testid="text-fail-count">{data.summary.fail}</span>
                    <span className="text-sm text-muted-foreground">failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-600" data-testid="text-warn-count">{data.summary.warn}</span>
                    <span className="text-sm text-muted-foreground">warnings</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Last run: {new Date(data.timestamp).toLocaleString('pt-BR')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-checks">
              <CardHeader>
                <CardTitle className="text-lg">Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.checks.map((check) => (
                  <div
                    key={check.id}
                    className={cn("flex items-start gap-3 p-3 rounded-lg border", statusColor(check.status))}
                    data-testid={`check-${check.id}`}
                  >
                    {statusIcon(check.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{check.id}</span>
                        <span className="text-sm">{check.name}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-5 ml-auto", 
                          check.status === 'pass' ? 'bg-emerald-100 text-emerald-800' :
                          check.status === 'fail' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        )}>
                          {check.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs mt-1 opacity-80">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card data-testid="card-routes">
              <CardHeader>
                <CardTitle className="text-lg">Canonical API Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.routes.map((route, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded border" data-testid={`route-row-${i}`}>
                      <Badge variant="outline" className={cn("font-mono text-[10px] w-14 justify-center",
                        route.method === 'POST' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                      )}>
                        {route.method}
                      </Badge>
                      <code className="font-mono text-xs flex-1 truncate">{route.path}</code>
                      <span className="text-xs text-muted-foreground">{route.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-user-journeys">
              <CardHeader>
                <CardTitle className="text-lg">Core User Journeys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-sm text-blue-800">1. Sales Bill-First Flow</p>
                  <ol className="text-xs text-blue-700 mt-1 space-y-1 list-decimal list-inside">
                    <li>Open /admin/deals/:dealId &rarr; Assembly tab</li>
                    <li>Upload BILL PDF &rarr; see extracted fields immediately</li>
                    <li>Click Generate ECOS &rarr; see snapshot or NO_PRC blocker</li>
                    <li>Click View Dossier &rarr; auto-creates, no 404</li>
                  </ol>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="font-medium text-sm text-purple-800">2. Ops PRC Dependency Flow</p>
                  <ol className="text-xs text-purple-700 mt-1 space-y-1 list-decimal list-inside">
                    <li>No PRC published &rarr; Generate ECOS shows NO_PRC blocker</li>
                    <li>Upload PRC at /admin/prc &rarr; publish &rarr; Generate ECOS succeeds</li>
                  </ol>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="font-medium text-sm text-amber-800">3. RFQ Gating Flow</p>
                  <ol className="text-xs text-amber-700 mt-1 space-y-1 list-decimal list-inside">
                    <li>"Advance to RFQ" must return blockers (NO_BILL, NO_ECOS, DOSSIER_NOT_READY)</li>
                    <li>Never silent no-op — always red blocker cards with fix links</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
