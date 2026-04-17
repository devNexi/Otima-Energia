import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, PlayCircle, Package, Presentation, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { GuidedTestModal } from "./GuidedTestModal";

interface DemoStats {
  clients: number;
  suppliers: number;
  deals: number;
  quotes: number;
  dispatches: number;
  cases: number;
  commissionEvents: number;
  usagePeriods: number;
}

interface SeedResult {
  success: boolean;
  summary: Record<string, number>;
}

interface NukeResult {
  success: boolean;
  deleted: Record<string, number>;
}

type ScenarioPack = 
  | 'FULL_DATASET'
  | 'HAPPY_PATH'
  | 'SLA_BREACH'
  | 'CREDIT_REJECTED'
  | 'WRONG_SIGNER'
  | 'COMMISSION_DISPUTE'
  | 'OVERDUE_PAYMENT';

const SCENARIO_DESCRIPTIONS: Record<ScenarioPack, { label: string; description: string }> = {
  FULL_DATASET: { 
    label: 'Full Demo Dataset', 
    description: '10 clients, 8 suppliers, deals across all stages' 
  },
  HAPPY_PATH: { 
    label: 'Happy Path Deal', 
    description: 'Complete CLOSED_WON deal with RFQ, quotes, commissions' 
  },
  SLA_BREACH: { 
    label: 'Supplier Silent / SLA Breach', 
    description: 'Deal with overdue RFQ response' 
  },
  CREDIT_REJECTED: { 
    label: 'Credit Rejected', 
    description: 'Deal blocked at PROPOSAL due to credit check' 
  },
  WRONG_SIGNER: { 
    label: 'Wrong Signer Risk', 
    description: 'Deal blocked at DOC_COLLECTION for signer verification' 
  },
  COMMISSION_DISPUTE: { 
    label: 'Commission Dispute', 
    description: 'CLOSED_WON with DISPUTED commission event' 
  },
  OVERDUE_PAYMENT: { 
    label: 'Overdue Payment Recovery', 
    description: 'Deal with 3 OVERDUE commission payments' 
  }
};

export function DemoDataPanel() {
  const queryClient = useQueryClient();
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [nukeResult, setNukeResult] = useState<NukeResult | null>(null);
  const [confDemoResult, setConfDemoResult] = useState<{ success: boolean; summary: Record<string, number> } | null>(null);
  const [playbooksResult, setPlaybooksResult] = useState<{ success: boolean; summary: Record<string, number> } | null>(null);
  const [guidedTestOpen, setGuidedTestOpen] = useState(false);
  const [selectedPacks, setSelectedPacks] = useState<ScenarioPack[]>(['HAPPY_PATH', 'SLA_BREACH', 'COMMISSION_DISPUTE']);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery<{ stats: DemoStats }>({
    queryKey: ["/api/admin/demo/stats"],
    refetchOnWindowFocus: false,
  });

  const seedMutation = useMutation({
    mutationFn: async (packs: ScenarioPack[]) => {
      const response = await apiRequest("POST", "/api/admin/demo/seed", { scenarioPacks: packs });
      return response.json();
    },
    onSuccess: (data) => {
      setSeedResult(data);
      setNukeResult(null);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/demo/deals"] });
    },
  });

  const nukeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/demo/nuke");
      return response.json();
    },
    onSuccess: (data) => {
      setNukeResult(data);
      setSeedResult(null);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/demo/deals"] });
    },
  });

  const confDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/seed-conference-demo");
      return response.json();
    },
    onSuccess: (data) => {
      setConfDemoResult(data);
      setSeedResult(null);
      setNukeResult(null);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
  });

  const playbooksMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/seed-playbooks");
      return response.json();
    },
    onSuccess: (data) => {
      setPlaybooksResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
  });

  const togglePack = (pack: ScenarioPack) => {
    setSelectedPacks(prev => 
      prev.includes(pack) 
        ? prev.filter(p => p !== pack)
        : [...prev, pack]
    );
  };

  const selectAllScenarios = () => {
    setSelectedPacks(['HAPPY_PATH', 'SLA_BREACH', 'CREDIT_REJECTED', 'WRONG_SIGNER', 'COMMISSION_DISPUTE', 'OVERDUE_PAYMENT']);
  };

  const selectRecommended = () => {
    setSelectedPacks(['HAPPY_PATH', 'SLA_BREACH', 'COMMISSION_DISPUTE']);
  };

  const stats = statsData?.stats;
  const totalDemoRecords = stats 
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Card data-testid="demo-data-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Data Manager
        </CardTitle>
        <CardDescription>
          Seed targeted scenario packs for QA testing and sales demos. All demo data is clearly labeled (TEST -, DEMO_).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Demo Records</p>
            <p className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                totalDemoRecords
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
              disabled={statsLoading}
              data-testid="button-refresh-stats"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {totalDemoRecords > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuidedTestOpen(true)}
                data-testid="button-guided-test"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Open Tours
              </Button>
            )}
          </div>
        </div>

        {stats && totalDemoRecords > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-2">
                <span className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Badge variant="secondary">{value}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="font-medium">Scenario Packs</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectRecommended} data-testid="button-recommended-packs">
                Recommended
              </Button>
              <Button variant="ghost" size="sm" onClick={selectAllScenarios} data-testid="button-all-scenarios">
                All Scenarios
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(SCENARIO_DESCRIPTIONS) as [ScenarioPack, typeof SCENARIO_DESCRIPTIONS[ScenarioPack]][]).map(([pack, info]) => (
              <div 
                key={pack} 
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPacks.includes(pack) 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => togglePack(pack)}
              >
                <Checkbox 
                  checked={selectedPacks.includes(pack)}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => togglePack(pack)}
                  data-testid={`checkbox-pack-${pack}`}
                />
                <div className="flex-1 min-w-0">
                  <Label className="font-medium cursor-pointer">{info.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => confDemoMutation.mutate()}
            disabled={confDemoMutation.isPending || seedMutation.isPending || nukeMutation.isPending}
            data-testid="button-seed-conference-demo"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {confDemoMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Presentation className="h-4 w-4 mr-2" />
            )}
            Seed Conference Demo
          </Button>

          <Button
            variant="outline"
            onClick={() => playbooksMutation.mutate()}
            disabled={playbooksMutation.isPending}
            data-testid="button-import-supplier-playbooks"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {playbooksMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            Update Supplier Playbooks v5.0
          </Button>

          <Button
            onClick={() => seedMutation.mutate(selectedPacks.length > 0 ? selectedPacks : ['FULL_DATASET'])}
            disabled={seedMutation.isPending || nukeMutation.isPending}
            data-testid="button-seed-demo"
          >
            {seedMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Seed {selectedPacks.length} Scenario{selectedPacks.length !== 1 ? 's' : ''}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={seedMutation.isPending || nukeMutation.isPending || totalDemoRecords === 0}
                data-testid="button-nuke-demo"
              >
                {nukeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Nuke Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Demo Data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {totalDemoRecords} demo records including clients, deals, quotes, 
                  commission events, and usage periods. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => nukeMutation.mutate()}
                >
                  Delete Demo Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {confDemoResult && (
          <div className="rounded-lg border border-blue-500/50 bg-blue-50 p-4 dark:bg-blue-950/30">
            <div className="flex items-center gap-2 mb-2">
              <Presentation className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                {confDemoResult.summary?.skipped ? 'Conference Demo Already Seeded' : 'Conference Demo Seeded Successfully'}
              </span>
            </div>
            {!confDemoResult.summary?.skipped && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(confDemoResult.summary).map(([key, value]) => (
                  <div key={key} className="text-blue-700 dark:text-blue-300">
                    {key}: <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {playbooksResult && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                {playbooksResult.success ? 'Supplier Playbooks v5.0 Applied' : 'Update Failed'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(playbooksResult.summary).map(([key, value]) => (
                <div key={key} className="text-emerald-700 dark:text-emerald-300">
                  {key}: <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {seedResult && (
          <div className="rounded-lg border border-green-500/50 bg-green-50 p-4 dark:bg-green-950/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">Demo Data Seeded Successfully</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(seedResult.summary).map(([key, value]) => (
                <div key={key} className="text-green-700 dark:text-green-300">
                  {key}: <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {nukeResult && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800 dark:text-amber-200">Demo Data Deleted</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(nukeResult.deleted).map(([key, value]) => (
                <div key={key} className="text-amber-700 dark:text-amber-300">
                  {key}: <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <GuidedTestModal open={guidedTestOpen} onOpenChange={setGuidedTestOpen} />
    </Card>
  );
}
