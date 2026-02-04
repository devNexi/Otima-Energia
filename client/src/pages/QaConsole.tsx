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
  Target,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
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

type SmokeStep = {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  checkEndpoint?: string;
  checkMethod?: string;
  link?: string;
  status: "pending" | "in_progress" | "passed" | "skipped";
  notes?: string;
};

type SmokeWorkflow = {
  id: string;
  name: string;
  description: string;
  steps: SmokeStep[];
};

const smokeWorkflows: SmokeWorkflow[] = [
  {
    id: "deal_lifecycle",
    name: "Deal Lifecycle",
    description: "Test end-to-end deal creation, qualification, and progression",
    steps: [
      {
        id: "dl_1",
        title: "Navigate to Deals",
        description: "Open the Deals page and verify it loads correctly",
        instructions: [
          "Click 'Deals' in the navigation menu",
          "Verify the deal list loads without errors",
          "Check that filters (status, owner) are visible",
        ],
        link: "/admin?tab=deals",
        status: "pending",
      },
      {
        id: "dl_2",
        title: "Create New Deal",
        description: "Create a test deal with required fields",
        instructions: [
          "Click 'New Deal' button",
          "Fill in client name, contact, and company",
          "Select a deal owner",
          "Save the deal",
        ],
        link: "/admin?tab=deals",
        status: "pending",
      },
      {
        id: "dl_3",
        title: "Open Deal Details",
        description: "View and verify deal detail page",
        instructions: [
          "Click on the newly created deal",
          "Verify all sections load: Overview, Dossier, Quotes, Timeline",
          "Check that actions menu shows available transitions",
        ],
        status: "pending",
      },
      {
        id: "dl_4",
        title: "Advance Deal Stage",
        description: "Progress the deal through qualification",
        instructions: [
          "Click on 'Mark Qualified' or similar action",
          "Verify the stage updates in the UI",
          "Check that the audit timeline shows the transition",
        ],
        status: "pending",
      },
    ],
  },
  {
    id: "supplier_quotes",
    name: "Supplier Quotes",
    description: "Test quote request, entry, and management",
    steps: [
      {
        id: "sq_1",
        title: "Navigate to Supplier Quotes",
        description: "Open the Supplier Quotes page",
        instructions: [
          "Click 'Supplier Quotes' in the navigation",
          "Verify the quotes list loads",
          "Check filters work (supplier, status)",
        ],
        link: "/admin?tab=supplier-quotes",
        status: "pending",
      },
      {
        id: "sq_2",
        title: "Create Quote Request",
        description: "Initiate a new quote request for a deal",
        instructions: [
          "Select a deal that needs quotes",
          "Click 'Request Quote' or similar",
          "Select suppliers to request quotes from",
          "Verify RFQ records are created",
        ],
        status: "pending",
      },
      {
        id: "sq_3",
        title: "Enter Quote Details",
        description: "Record a supplier's quote response",
        instructions: [
          "Open a pending quote request",
          "Enter pricing details: base price, term, product type",
          "Save the quote",
          "Verify it appears in the quotes list",
        ],
        status: "pending",
      },
    ],
  },
  {
    id: "three_tier_pricing",
    name: "Three-Tier Pricing Workflow",
    description: "Test Quote → Client Price → Proposal → PDF revenue protection workflow",
    steps: [
      {
        id: "ttp_1",
        title: "Verify Quote Has Base Price",
        description: "Open a deal and check quotes have base price (internal)",
        instructions: [
          "Click 'Negócios' in sidebar to view deals list",
          "Click any deal row to open DealDetail page",
          "Click 'Cotações' tab (shows quote count)",
          "Verify each quote shows 'Preço Base' value",
          "Verify 'Preço ao Cliente' shows 'Não definido' for new quotes",
        ],
        link: "/admin?tab=deals",
        status: "pending",
      },
      {
        id: "ttp_2",
        title: "Set Client Price (Margin)",
        description: "Define Ótima's margin on a supplier quote",
        instructions: [
          "In Cotações tab, find a quote without client price",
          "Click 'Definir Preço ao Cliente' button on that quote",
          "Modal opens: select 'Tipo de Margem' (R$/MWh or Percentual)",
          "Enter 'Valor da Margem' (e.g., 5.00 for R$/MWh, 3 for %)",
          "Preview shows calculated 'Preço ao Cliente'",
          "Click 'Confirmar Preço' button to save",
          "Quote card now shows green 'Pronto' badge",
        ],
        status: "pending",
      },
      {
        id: "ttp_3",
        title: "Verify Proposal Eligibility Gate",
        description: "Confirm proposals require client price",
        instructions: [
          "In DealDetail, click 'Propostas' tab",
          "WITHOUT eligible quotes, verify:",
          "  - Amber warning banner with AlertTriangle icon",
          "  - Message: pricing must be defined before proposals",
          "  - 'Criar Nova Proposta' button is disabled",
          "WITH eligible quotes (after step 2), verify:",
          "  - Info banner shows X eligible quotes",
          "  - 'Criar Nova Proposta' button is enabled",
        ],
        status: "pending",
      },
      {
        id: "ttp_4",
        title: "Create Proposal from Eligible Quote",
        description: "Create proposal using pre-priced quote",
        instructions: [
          "Click 'Criar Nova Proposta' button",
          "New proposal card appears in DRAFT status",
          "Click 'Adicionar Cotação' button on the proposal card",
          "In dialog ('Adicionar Cotação à Proposta'): Select quote from dropdown",
          "Note: Only eligible quotes (with client price) appear",
          "Note: No margin input - price is already set",
          "Toggle 'Recomendado' if applicable",
          "Click 'Adicionar' to add item to proposal",
          "Click 'Gerar' button (with checkmark icon) to finalize",
          "Status changes to GENERATED",
        ],
        status: "pending",
      },
      {
        id: "ttp_5",
        title: "Download and Verify PDF Security",
        description: "Download PDF and confirm no internal data leaks",
        instructions: [
          "On GENERATED proposal, click 'PDF' button (Download icon)",
          "Open downloaded 'proposta-*.pdf' file",
          "MUST VERIFY in PDF content:",
          "  OK: 'Preço Final' shows client price value",
          "  OK: Supplier name, product type visible",
          "  FAIL: Any 'Preço Base' or base price visible",
          "  FAIL: Any margin/uplift values visible",
          "  FAIL: Any internal IDs (supplierId, dealQuoteId)",
        ],
        status: "pending",
      },
      {
        id: "ttp_6",
        title: "Verify Public View Security",
        description: "Check client-facing view exposes only safe data",
        instructions: [
          "On GENERATED proposal, click 'Copiar Link' button (Copy icon)",
          "Or click 'Visualizar' button to open in new tab",
          "Open URL in incognito/private browser window",
          "Visual check - client sees only:",
          "  OK: Supplier name, 'Preço Final', product type",
          "  OK: Public notes if entered",
          "Technical check (F12 > Network > XHR):",
          "  Find /api/public/proposals/* response",
          "  MUST NOT contain: supplierBaseEnergyPriceRmwh",
          "  MUST NOT contain: marginType, marginValue",
          "  MUST NOT contain: supplierId, dealQuoteId",
        ],
        status: "pending",
      },
    ],
  },
  {
    id: "proposals",
    name: "Proposals (Legacy)",
    description: "Basic proposal generation flow",
    steps: [
      {
        id: "pr_1",
        title: "Navigate to Proposals",
        description: "Open the Proposals page",
        instructions: [
          "Click 'Proposals' in the navigation",
          "Verify the proposals list loads",
          "Check status badges display correctly",
        ],
        link: "/admin/proposals",
        status: "pending",
      },
      {
        id: "pr_2",
        title: "Generate PDF",
        description: "Generate and preview the proposal PDF",
        instructions: [
          "Open the draft proposal",
          "Click 'Generate PDF' button",
          "Verify PDF generates successfully",
          "Check status updates to GENERATED",
        ],
        status: "pending",
      },
      {
        id: "pr_3",
        title: "Send to Client",
        description: "Send the proposal to the client",
        instructions: [
          "Click 'Send' button",
          "Verify email is sent",
          "Check status updates to SENT",
          "Verify public link is generated",
        ],
        status: "pending",
      },
      {
        id: "pr_4",
        title: "Verify Public View",
        description: "Test the client-facing proposal view",
        instructions: [
          "Copy the public link",
          "Open in incognito window",
          "Verify proposal displays correctly",
          "Confirm NO internal data visible (base prices, margins)",
        ],
        status: "pending",
      },
    ],
  },
  {
    id: "commission",
    name: "Commission Tracking",
    description: "Test commission event creation and milestone tracking",
    steps: [
      {
        id: "cm_1",
        title: "Navigate to Commission",
        description: "Open the Commission page",
        instructions: [
          "Click 'Commission' in the navigation",
          "Verify commission events load",
          "Check milestone filters work",
        ],
        link: "/admin?tab=revenue",
        status: "pending",
      },
      {
        id: "cm_2",
        title: "View Commission Details",
        description: "Open a commission event to view details",
        instructions: [
          "Click on a commission event",
          "Verify milestone info displays (M1/M2)",
          "Check amount calculations are correct",
          "Verify linked deal information",
        ],
        status: "pending",
      },
      {
        id: "cm_3",
        title: "Generate Invoice",
        description: "Test invoice generation for a commission",
        instructions: [
          "Select a commission event with PENDING status",
          "Click 'Generate Invoice' button",
          "Verify invoice is created",
          "Check status updates correctly",
        ],
        status: "pending",
      },
    ],
  },
  {
    id: "assembly_queue",
    name: "Assembly Queue",
    description: "Test the assembly queue for blocked deals",
    steps: [
      {
        id: "aq_1",
        title: "Navigate to Assembly",
        description: "Open the Assembly Queue page",
        instructions: [
          "Click 'Assembly' in the navigation",
          "Verify blocked deals list loads",
          "Check that block reasons are visible",
        ],
        link: "/admin?tab=assembly-queue",
        status: "pending",
      },
      {
        id: "aq_2",
        title: "Filter Blocked Deals",
        description: "Test filtering capabilities",
        instructions: [
          "Use status filter to show different block types",
          "Filter by owner if available",
          "Verify counts update correctly",
        ],
        status: "pending",
      },
      {
        id: "aq_3",
        title: "Resolve a Block",
        description: "Take action on a blocked deal",
        instructions: [
          "Click on a blocked deal",
          "Review the required action",
          "Complete the required step or mark as resolved",
          "Verify deal leaves the queue",
        ],
        status: "pending",
      },
    ],
  },
  {
    id: "button_integrity",
    name: "UI Button Integrity",
    description: "Verify all critical action buttons exist and are clickable",
    steps: [
      {
        id: "bi_1",
        title: "Navigation Buttons",
        description: "Verify main navigation links work",
        instructions: [
          "Click each item in the navigation menu",
          "Verify each page loads without errors",
          "Check that back buttons return to previous page",
          "Verify logout button works correctly",
        ],
        link: "/admin",
        status: "pending",
      },
      {
        id: "bi_2",
        title: "Deal Action Buttons",
        description: "Test deal-related action buttons",
        instructions: [
          "Open a deal detail page",
          "Test 'Edit' button opens edit form",
          "Test stage transition buttons are clickable",
          "Test 'Create Proposal' button",
          "Verify all modals close properly",
        ],
        link: "/admin?tab=deals",
        status: "pending",
      },
      {
        id: "bi_3",
        title: "Proposal Action Buttons",
        description: "Test proposal management buttons",
        instructions: [
          "Navigate to Proposals page",
          "Test 'New Proposal' button",
          "Test 'Generate PDF' button on a draft",
          "Test 'Send' button on a generated proposal",
          "Test 'View' button to preview public link",
        ],
        link: "/admin/proposals",
        status: "pending",
      },
      {
        id: "bi_4",
        title: "Quote Entry Buttons",
        description: "Test supplier quote entry buttons",
        instructions: [
          "Navigate to Supplier Quotes page",
          "Test 'Add Quote' or 'New Quote' button",
          "Test 'Edit' button on existing quote",
          "Test 'Approve' and 'Reject' buttons",
          "Verify form submit buttons work",
        ],
        link: "/admin?tab=supplier-quotes",
        status: "pending",
      },
      {
        id: "bi_5",
        title: "Admin Action Buttons",
        description: "Test administrative action buttons",
        instructions: [
          "Navigate to Governance > PRC tab",
          "Test PRC upload button and document actions",
          "Check audit trail loads correctly",
          "Test integrations settings if available",
          "Verify dangerous actions have confirmation dialogs",
        ],
        link: "/admin?tab=prc",
        status: "pending",
      },
    ],
  },
  {
    id: "data_display",
    name: "Data Display Verification",
    description: "Verify data displays correctly across all views",
    steps: [
      {
        id: "dd_1",
        title: "Dashboard Stats",
        description: "Verify dashboard statistics are accurate",
        instructions: [
          "Navigate to the main dashboard",
          "Check that deal counts match actual deals",
          "Verify revenue figures format correctly",
          "Check that charts load properly",
        ],
        link: "/admin",
        status: "pending",
      },
      {
        id: "dd_2",
        title: "List Pagination",
        description: "Test list views with many records",
        instructions: [
          "Go to Clients or Deals list",
          "Verify pagination works if many records",
          "Test sorting by different columns",
          "Verify search/filter updates results",
        ],
        link: "/admin?tab=clients",
        status: "pending",
      },
      {
        id: "dd_3",
        title: "Detail Views",
        description: "Verify detail pages show complete data",
        instructions: [
          "Open a deal detail page",
          "Check all sections expand/collapse",
          "Verify linked data (client, quotes) displays",
          "Check timestamps format correctly",
        ],
        status: "pending",
      },
    ],
  },
];

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
  
  const [workflows, setWorkflows] = useState<SmokeWorkflow[]>(smokeWorkflows);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<{ workflowId: string; stepId: string } | null>(null);

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

  const handleStartStep = (workflowId: string, stepId: string) => {
    setCurrentStep({ workflowId, stepId });
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: w.steps.map(s => s.id === stepId ? { ...s, status: "in_progress" as const } : s) }
        : w
    ));
    setExpandedWorkflow(workflowId);
  };

  const handlePassStep = (workflowId: string, stepId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id !== workflowId) return w;
      const stepIndex = w.steps.findIndex(s => s.id === stepId);
      const updatedSteps = w.steps.map((s, i) => {
        if (s.id === stepId) return { ...s, status: "passed" as const };
        if (i === stepIndex + 1 && s.status === "pending") return { ...s, status: "in_progress" as const };
        return s;
      });
      return { ...w, steps: updatedSteps };
    }));
    
    const workflow = workflows.find(w => w.id === workflowId);
    const stepIndex = workflow?.steps.findIndex(s => s.id === stepId) ?? -1;
    const nextStep = workflow?.steps[stepIndex + 1];
    
    if (nextStep) {
      setCurrentStep({ workflowId, stepId: nextStep.id });
    } else {
      setCurrentStep(null);
      toast({
        title: "Workflow Complete",
        description: `${workflow?.name} smoke test passed!`,
      });
    }
  };

  const handleSkipStep = (workflowId: string, stepId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id !== workflowId) return w;
      const stepIndex = w.steps.findIndex(s => s.id === stepId);
      const updatedSteps = w.steps.map((s, i) => {
        if (s.id === stepId) return { ...s, status: "skipped" as const };
        if (i === stepIndex + 1 && s.status === "pending") return { ...s, status: "in_progress" as const };
        return s;
      });
      return { ...w, steps: updatedSteps };
    }));
    
    const workflow = workflows.find(w => w.id === workflowId);
    const stepIndex = workflow?.steps.findIndex(s => s.id === stepId) ?? -1;
    const nextStep = workflow?.steps[stepIndex + 1];
    
    if (nextStep) {
      setCurrentStep({ workflowId, stepId: nextStep.id });
    } else {
      setCurrentStep(null);
    }
  };

  const handleResetWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: w.steps.map(s => ({ ...s, status: "pending" as const })) }
        : w
    ));
    setCurrentStep(null);
  };

  const getWorkflowProgress = (workflow: SmokeWorkflow) => {
    const passed = workflow.steps.filter(s => s.status === "passed").length;
    const skipped = workflow.steps.filter(s => s.status === "skipped").length;
    const total = workflow.steps.length;
    return { passed, skipped, total, percentage: Math.round(((passed + skipped) / total) * 100) };
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

        <Tabs defaultValue="smoke" className="space-y-4">
          <TabsList>
            <TabsTrigger value="smoke" data-testid="tab-smoke-test">
              <Target className="h-4 w-4 mr-2" />
              Guided Smoke Test
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tab-api-tests">Test Suite</TabsTrigger>
            <TabsTrigger value="custom" data-testid="tab-custom">Custom Request</TabsTrigger>
          </TabsList>

          <TabsContent value="smoke">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-600" />
                    Guided Smoke Tests
                  </CardTitle>
                  <CardDescription>
                    Step-by-step workflow validation. Follow each step and mark as passed or skipped.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflows.map(workflow => {
                    const progress = getWorkflowProgress(workflow);
                    const isExpanded = expandedWorkflow === workflow.id;
                    
                    return (
                      <div key={workflow.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => setExpandedWorkflow(isExpanded ? null : workflow.id)}
                          data-testid={`workflow-header-${workflow.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600">
                              {progress.percentage === 100 ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : progress.percentage > 0 ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <Target className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{workflow.name}</div>
                              <div className="text-sm text-gray-500">{workflow.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500">
                              {progress.passed}/{progress.total} passed
                              {progress.skipped > 0 && `, ${progress.skipped} skipped`}
                            </div>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t">
                            <div className="p-4 space-y-3">
                              {workflow.steps.map((step, idx) => (
                                <div 
                                  key={step.id}
                                  className={`p-4 rounded-lg border ${
                                    step.status === "in_progress" 
                                      ? "border-violet-300 bg-violet-50" 
                                      : step.status === "passed"
                                      ? "border-emerald-200 bg-emerald-50"
                                      : step.status === "skipped"
                                      ? "border-gray-200 bg-gray-50"
                                      : "border-gray-200"
                                  }`}
                                  data-testid={`step-${step.id}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-medium">
                                          {idx + 1}
                                        </span>
                                        <span className="font-medium">{step.title}</span>
                                        {step.status === "passed" && (
                                          <Badge className="bg-emerald-100 text-emerald-700">Passed</Badge>
                                        )}
                                        {step.status === "skipped" && (
                                          <Badge className="bg-gray-100 text-gray-600">Skipped</Badge>
                                        )}
                                        {step.status === "in_progress" && (
                                          <Badge className="bg-violet-100 text-violet-700">In Progress</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1 ml-8">{step.description}</p>
                                      
                                      {step.status === "in_progress" && (
                                        <div className="mt-3 ml-8">
                                          <div className="text-sm font-medium text-gray-700 mb-2">Instructions:</div>
                                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                            {step.instructions.map((instruction, i) => (
                                              <li key={i}>{instruction}</li>
                                            ))}
                                          </ol>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                      {step.link && step.status === "in_progress" && (
                                        <Link href={step.link}>
                                          <Button size="sm" variant="outline" data-testid={`button-go-${step.id}`}>
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Go
                                          </Button>
                                        </Link>
                                      )}
                                      {step.status === "pending" && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleStartStep(workflow.id, step.id)}
                                          data-testid={`button-start-${step.id}`}
                                        >
                                          <Play className="h-4 w-4 mr-1" />
                                          Start
                                        </Button>
                                      )}
                                      {step.status === "in_progress" && (
                                        <>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleSkipStep(workflow.id, step.id)}
                                            data-testid={`button-skip-${step.id}`}
                                          >
                                            Skip
                                          </Button>
                                          <Button 
                                            size="sm"
                                            onClick={() => handlePassStep(workflow.id, step.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            data-testid={`button-pass-${step.id}`}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Pass
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="p-4 border-t bg-gray-50 flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleResetWorkflow(workflow.id)}
                                data-testid={`button-reset-${workflow.id}`}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset Workflow
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
