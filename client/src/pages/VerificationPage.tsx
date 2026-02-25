import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield, Cpu, Loader2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

interface DiagnosticsResult {
  success: boolean;
  parserBaseUrl: string;
  attemptedUrl: string;
  reachable: boolean;
  healthy: boolean;
  degraded: boolean;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
  bodySnippet: string | null;
  json: Record<string, any> | null;
  parserVersion: string | null;
  ocrAvailable: boolean | null;
  state: 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'UNREACHABLE';
  checkedAt: string;
}

interface TestParseResult {
  passed: boolean;
  steps: Array<{ name: string; passed: boolean; detail: string }>;
  rawResponse?: any;
}

export default function VerificationPage() {
  const [testParseResult, setTestParseResult] = useState<TestParseResult | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<VerifyResult>({
    queryKey: ['/api/admin/verify'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/verify");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: diagData, refetch: refetchDiag, isFetching: isDiagFetching } = useQuery<DiagnosticsResult>({
    queryKey: ['/api/parser/diagnostics'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/parser/diagnostics");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const testParseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/parser/test");
      return res.json();
    },
    onSuccess: (data) => setTestParseResult(data),
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

            <Card data-testid="card-parser-diagnostics">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-600" />
                    Parser Diagnostics
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testParseMutation.mutate()}
                      disabled={testParseMutation.isPending || !diagData?.healthy}
                      data-testid="button-test-parse"
                    >
                      {testParseMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FlaskConical className="w-3 h-3 mr-1" />}
                      Test Parse
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchDiag()}
                      disabled={isDiagFetching}
                      data-testid="button-refresh-diagnostics"
                    >
                      <RefreshCw className={cn("w-3 h-3 mr-1", isDiagFetching && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {diagData ? (
                  <div className="space-y-3">
                    <div className={cn("flex items-center gap-2 p-3 rounded-lg border",
                      diagData.state === 'HEALTHY' ? 'bg-emerald-50 border-emerald-200' :
                      diagData.state === 'DEGRADED' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    )}>
                      {diagData.state === 'HEALTHY' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {diagData.state === 'DEGRADED' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                      {(diagData.state === 'UNREACHABLE' || diagData.state === 'ERROR') && <XCircle className="w-5 h-5 text-red-600" />}
                      <span className={cn("text-sm font-bold",
                        diagData.state === 'HEALTHY' ? 'text-emerald-800' :
                        diagData.state === 'DEGRADED' ? 'text-amber-800' :
                        'text-red-800'
                      )} data-testid="text-parser-state">
                        {diagData.state}
                      </span>
                      {diagData.parserVersion && (
                        <Badge variant="outline" className="ml-auto text-[10px]" data-testid="text-parser-version">v{diagData.parserVersion}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="text-xs text-muted-foreground block">Parser Base URL</span>
                        <code className="text-xs font-mono break-all" data-testid="text-parser-url">{diagData.parserBaseUrl}</code>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="text-xs text-muted-foreground block">Attempted URL</span>
                        <code className="text-xs font-mono break-all" data-testid="text-parser-attempted-url">{diagData.attemptedUrl}</code>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="text-xs text-muted-foreground block">Reachable</span>
                        <span className="text-sm" data-testid="text-parser-reachable">{diagData.reachable ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="text-xs text-muted-foreground block">Latency</span>
                        <span className="text-sm font-mono" data-testid="text-parser-latency">{diagData.latencyMs != null ? `${diagData.latencyMs}ms` : 'N/A'}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="text-xs text-muted-foreground block">HTTP Status</span>
                        <span className="text-sm font-mono" data-testid="text-parser-http">{diagData.httpStatus ?? 'N/A'}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="text-xs text-muted-foreground block">OCR Available</span>
                        <span className="text-sm" data-testid="text-parser-ocr">
                          {diagData.ocrAvailable === true ? 'Yes' : diagData.ocrAvailable === false ? 'No (degraded)' : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {diagData.error && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700" data-testid="text-parser-error">
                        <span className="font-medium">Error: </span>{diagData.error}
                      </div>
                    )}
                    {diagData.bodySnippet && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700" data-testid="text-parser-body-snippet">
                        <span className="font-medium">Body snippet: </span>{diagData.bodySnippet}
                      </div>
                    )}
                    {diagData.json && (
                      <details className="text-xs" open>
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">Raw health JSON</summary>
                        <pre className="mt-1 p-2 bg-slate-100 rounded border text-[10px] overflow-x-auto" data-testid="text-parser-raw-health">
                          {JSON.stringify(diagData.json, null, 2)}
                        </pre>
                      </details>
                    )}
                    <p className="text-[10px] text-muted-foreground">Checked: {new Date(diagData.checkedAt).toLocaleString('pt-BR')}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading diagnostics...
                  </div>
                )}

                {testParseResult && (
                  <div className="mt-4 border-t pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Test Parse Result</span>
                      <Badge variant="outline" className={cn("text-[10px]",
                        testParseResult.passed ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                      )} data-testid="text-test-parse-result">
                        {testParseResult.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                    {testParseResult.steps.map((step, i) => (
                      <div key={i} className={cn("flex items-center gap-2 text-xs p-2 rounded border",
                        step.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                      )} data-testid={`test-step-${step.name}`}>
                        {step.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> : <XCircle className="w-3 h-3 text-red-600 shrink-0" />}
                        <span className="font-mono font-medium">{step.name}</span>
                        <span className="text-muted-foreground truncate">{step.detail}</span>
                      </div>
                    ))}
                    {testParseResult.rawResponse && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Raw parse response</summary>
                        <pre className="mt-1 p-2 bg-slate-100 rounded border text-[10px] overflow-x-auto">
                          {JSON.stringify(testParseResult.rawResponse, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                {testParseMutation.error && (
                  <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <span className="font-medium">Test parse error: </span>{(testParseMutation.error as Error).message}
                  </div>
                )}
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
