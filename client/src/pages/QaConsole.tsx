import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Clipboard,
  Server,
  Database,
  Zap,
  FileText,
  Users,
  Settings,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type TestStatus = "pending" | "running" | "passed" | "failed";

interface TestCase {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  category: string;
  status: TestStatus;
  duration?: number;
  error?: string;
}

const defaultTestCases: TestCase[] = [
  {
    id: "auth-1",
    name: "Auth - Get Current User",
    description: "Verify /api/auth/me returns authenticated user",
    endpoint: "/api/auth/me",
    method: "GET",
    category: "auth",
    status: "pending",
  },
  {
    id: "clients-1",
    name: "Clients - List All",
    description: "Verify /api/clients returns client list",
    endpoint: "/api/clients",
    method: "GET",
    category: "clients",
    status: "pending",
  },
  {
    id: "deals-1",
    name: "Deals - List All",
    description: "Verify /api/deals returns deal list",
    endpoint: "/api/deals",
    method: "GET",
    category: "deals",
    status: "pending",
  },
  {
    id: "suppliers-1",
    name: "Suppliers - List All",
    description: "Verify /api/suppliers returns supplier list",
    endpoint: "/api/suppliers",
    method: "GET",
    category: "suppliers",
    status: "pending",
  },
  {
    id: "quotes-1",
    name: "Supplier Quotes - List All",
    description: "Verify /api/supplier-quotes returns quotes list",
    endpoint: "/api/supplier-quotes",
    method: "GET",
    category: "quotes",
    status: "pending",
  },
  {
    id: "proposals-1",
    name: "Proposals - List All",
    description: "Verify /api/proposals returns proposals list",
    endpoint: "/api/proposals",
    method: "GET",
    category: "proposals",
    status: "pending",
  },
  {
    id: "prc-1",
    name: "PRC Documents - List All",
    description: "Verify /api/prc/documents returns PRC documents",
    endpoint: "/api/prc/documents",
    method: "GET",
    category: "prc",
    status: "pending",
  },
  {
    id: "commission-1",
    name: "Commission Events - List All",
    description: "Verify /api/commission-events returns commission data",
    endpoint: "/api/commission-events",
    method: "GET",
    category: "finance",
    status: "pending",
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  auth: <Settings className="h-4 w-4" />,
  clients: <Users className="h-4 w-4" />,
  deals: <FileText className="h-4 w-4" />,
  suppliers: <Server className="h-4 w-4" />,
  quotes: <Zap className="h-4 w-4" />,
  proposals: <FileText className="h-4 w-4" />,
  prc: <Database className="h-4 w-4" />,
  finance: <Clipboard className="h-4 w-4" />,
};

const statusColors: Record<TestStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-700",
  passed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export default function QaConsole() {
  const { toast } = useToast();
  const { sessionId, user } = useAuth();
  const [testCases, setTestCases] = useState<TestCase[]>(defaultTestCases);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customMethod, setCustomMethod] = useState("GET");
  const [customBody, setCustomBody] = useState("");
  const [customResult, setCustomResult] = useState<string>("");
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runTest = async (test: TestCase): Promise<TestCase> => {
    const startTime = Date.now();
    
    try {
      const res = await fetch(test.endpoint, {
        method: test.method,
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
      });
      
      const duration = Date.now() - startTime;
      
      if (res.ok) {
        return { ...test, status: "passed", duration };
      } else {
        const errorData = await res.json().catch(() => ({}));
        return { 
          ...test, 
          status: "failed", 
          duration,
          error: errorData.error || `HTTP ${res.status}` 
        };
      }
    } catch (error: any) {
      return { 
        ...test, 
        status: "failed", 
        duration: Date.now() - startTime,
        error: error.message 
      };
    }
  };

  const handleRunTest = async (testId: string) => {
    setTestCases((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: "running" as TestStatus } : t))
    );

    const test = testCases.find((t) => t.id === testId);
    if (!test) return;

    const result = await runTest(test);
    setTestCases((prev) => prev.map((t) => (t.id === testId ? result : t)));

    toast({
      title: result.status === "passed" ? "Test Passed" : "Test Failed",
      description: result.error || `${result.name} - ${result.duration}ms`,
      variant: result.status === "passed" ? "default" : "destructive",
    });
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    setTestCases((prev) => prev.map((t) => ({ ...t, status: "running" as TestStatus })));

    const results = await Promise.all(testCases.map(runTest));
    setTestCases(results);

    const passed = results.filter((t) => t.status === "passed").length;
    const failed = results.filter((t) => t.status === "failed").length;

    toast({
      title: "Test Suite Complete",
      description: `${passed} passed, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default",
    });

    setIsRunningAll(false);
  };

  const handleReset = () => {
    setTestCases(defaultTestCases);
  };

  const handleCustomRequest = async () => {
    if (!customEndpoint) {
      toast({ title: "Enter an endpoint", variant: "destructive" });
      return;
    }

    setCustomResult("Loading...");

    try {
      const res = await fetch(customEndpoint, {
        method: customMethod,
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        ...(customMethod !== "GET" && customBody ? { body: customBody } : {}),
      });

      const data = await res.json();
      setCustomResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setCustomResult(`Error: ${error.message}`);
    }
  };

  const stats = {
    total: testCases.length,
    passed: testCases.filter((t) => t.status === "passed").length,
    failed: testCases.filter((t) => t.status === "failed").length,
    pending: testCases.filter((t) => t.status === "pending").length,
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">QA Console is only available to administrators.</p>
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
              <Link href="/admin">
                <Button variant="ghost" size="sm" data-testid="link-back-admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-violet-600" />
                  QA Console
                </h1>
                <p className="text-sm text-gray-500">Workflow testing and API diagnostics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                data-testid="button-reset-tests"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleRunAll}
                disabled={isRunningAll}
                data-testid="button-run-all-tests"
              >
                {isRunningAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run All Tests
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Tests</p>
                  <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-emerald-600" data-testid="stat-passed">{stats.passed}</p>
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
                  <p className="text-2xl font-bold text-red-600" data-testid="stat-failed">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tests">Test Suite</TabsTrigger>
            <TabsTrigger value="custom">Custom Request</TabsTrigger>
          </TabsList>

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle>API Test Suite</CardTitle>
                <CardDescription>
                  Run automated tests against system endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testCases.map((test) => (
                    <div 
                      key={test.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      data-testid={`test-row-${test.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-500">
                          {categoryIcons[test.category]}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {test.name}
                            <Badge variant="outline" className="text-xs">
                              {test.method}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">{test.endpoint}</div>
                          {test.error && (
                            <div className="text-sm text-red-600 mt-1">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {test.duration && (
                          <span className="text-sm text-gray-500">{test.duration}ms</span>
                        )}
                        <Badge className={statusColors[test.status]}>
                          {test.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {test.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRunTest(test.id)}
                          disabled={test.status === "running" || isRunningAll}
                          data-testid={`button-run-${test.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Custom API Request</CardTitle>
                <CardDescription>
                  Send custom requests to any endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="/api/clients"
                      data-testid="input-custom-endpoint"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <select 
                      id="method"
                      value={customMethod}
                      onChange={(e) => setCustomMethod(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      data-testid="select-method"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </div>

                {customMethod !== "GET" && (
                  <div className="space-y-2">
                    <Label htmlFor="body">Request Body (JSON)</Label>
                    <Textarea
                      id="body"
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={4}
                      className="font-mono text-sm"
                      data-testid="textarea-custom-body"
                    />
                  </div>
                )}

                <Button onClick={handleCustomRequest} data-testid="button-send-request">
                  <Play className="h-4 w-4 mr-2" />
                  Send Request
                </Button>

                {customResult && (
                  <div className="space-y-2">
                    <Label>Response</Label>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto max-h-96 text-sm">
                      {customResult}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
