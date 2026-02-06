import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  History,
  AlertTriangle,
  Filter,
  RotateCcw,
} from "lucide-react";

const TEST_KEYS = [
  { value: "all", label: "All Tests" },
  { value: "bills.upload_ocr_flow", label: "Bills / OCR / Dossier" },
  { value: "quotes.immutable_intake", label: "Quotes Immutable Intake" },
  { value: "proposals.client_price_gate", label: "Proposals Client Price Gate" },
  { value: "proposals.pdf_security", label: "Proposals PDF Security" },
  { value: "prc.supplier_dropdown", label: "PRC Supplier Dropdown" },
  { value: "finance.commission_triggers", label: "Commission Triggers (50/50)" },
  { value: "zoho.intake_banner", label: "Zoho Intake Banner" },
];

export default function QaHistory() {
  const { toast } = useToast();
  const { sessionId, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterDemo, setFilterDemo] = useState("all");
  const [filterTestKey, setFilterTestKey] = useState("all");
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (filterDemo !== "all") params.set("isDemo", filterDemo);
    if (filterTestKey !== "all") params.set("testKey", filterTestKey);
    return params.toString();
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/qa/history", dateFrom, dateTo, filterDemo, filterTestKey],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/qa/history${qs ? `?${qs}` : ""}`, {
        headers: { "x-session-id": sessionId || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch QA history");
      return res.json();
    },
  });

  const runSingleTest = async (testKey: string) => {
    setRunningTest(testKey);
    try {
      const res = await fetch(`/api/qa/run/${testKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        body: JSON.stringify({ isDemo: false }),
      });
      const result = await res.json();
      
      toast({
        title: result.status === "PASS" ? "Test Passed" : "Test Failed",
        description: result.errorMessage || `${testKey} - ${result.duration}ms`,
        variant: result.status === "PASS" ? "default" : "destructive",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRunningTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    const testKeys = TEST_KEYS.filter(t => t.value !== "all").map(t => t.value);
    
    let passed = 0;
    let failed = 0;
    
    for (const testKey of testKeys) {
      try {
        const res = await fetch(`/api/qa/run/${testKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId || "",
          },
          body: JSON.stringify({ isDemo: false }),
        });
        const result = await res.json();
        if (result.status === "PASS") passed++;
        else failed++;
      } catch {
        failed++;
      }
    }
    
    toast({
      title: "All Tests Complete",
      description: `${passed} passed, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default",
    });
    
    refetch();
    setIsRunningAll(false);
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterDemo("all");
    setFilterTestKey("all");
  };

  const runs = data?.runs || [];

  const passCount = runs.filter((r: any) => r.status === "PASS").length;
  const failCount = runs.filter((r: any) => r.status === "FAIL").length;

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">QA History is only available to administrators.</p>
            <Link href="/admin">
              <Button>Back to Admin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/qa">
                <Button variant="ghost" size="sm" data-testid="link-back-qa">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  QA Console
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-6 w-6 text-violet-600" />
                  QA Test History
                </h1>
                <p className="text-sm text-gray-500">Timestamped log of every validation test run</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                data-testid="button-refresh-history"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={runAllTests}
                disabled={isRunningAll}
                data-testid="button-run-all-tests"
              >
                {isRunningAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run All 7 Tests
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Runs</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-runs">{runs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">Passed</p>
                  <p className="text-2xl font-bold text-emerald-600" data-testid="stat-passed">{passCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="stat-failed">{failCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                  data-testid="input-date-from"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                  data-testid="input-date-to"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Demo Flag</Label>
                <Select value={filterDemo} onValueChange={setFilterDemo}>
                  <SelectTrigger className="w-32" data-testid="select-demo-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Demo Only</SelectItem>
                    <SelectItem value="false">Production Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Test Key</Label>
                <Select value={filterTestKey} onValueChange={setFilterTestKey}>
                  <SelectTrigger className="w-64" data-testid="select-test-key-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_KEYS.map((tk) => (
                      <SelectItem key={tk.value} value={tk.value}>
                        {tk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters} data-testid="button-reset-filters">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Critical Workflow Tests</CardTitle>
            <CardDescription>Run individual validation tests. Results are persisted to the history log.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {TEST_KEYS.filter(t => t.value !== "all").map((tk) => (
                <div
                  key={tk.value}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  data-testid={`test-runner-${tk.value}`}
                >
                  <div>
                    <div className="font-medium text-sm">{tk.label}</div>
                    <div className="text-xs text-gray-500 font-mono">{tk.value}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runSingleTest(tk.value)}
                    disabled={runningTest === tk.value || isRunningAll}
                    data-testid={`button-run-${tk.value}`}
                  >
                    {runningTest === tk.value ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Test Run Log</CardTitle>
            <CardDescription>
              {runs.length} test run{runs.length !== 1 ? "s" : ""} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No test runs recorded yet</p>
                <p className="text-sm mt-1">Run the critical workflow tests above to start building your QA history.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {runs.map((run: any) => (
                  <div
                    key={run.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                    data-testid={`history-row-${run.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={
                            run.status === "PASS"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }
                          data-testid={`status-${run.id}`}
                        >
                          {run.status === "PASS" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {run.status}
                        </Badge>
                        <span className="font-mono text-sm font-medium">{run.testKey}</span>
                        {run.isDemo && (
                          <Badge variant="outline" className="text-xs">DEMO</Badge>
                        )}
                      </div>
                      {run.errorMessage && (
                        <p className="text-sm text-red-600 mt-1 truncate">{run.errorMessage}</p>
                      )}
                      {run.metadataJson?.assertion && (
                        <p className="text-xs text-gray-500 mt-1">{run.metadataJson.assertion}</p>
                      )}
                      {run.metadataJson?.durationMs && (
                        <span className="text-xs text-gray-400">{run.metadataJson.durationMs}ms</span>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-4 shrink-0">
                      <div>{new Date(run.ranAt).toLocaleDateString("pt-BR")}</div>
                      <div>{new Date(run.ranAt).toLocaleTimeString("pt-BR")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
