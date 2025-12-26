import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, PlayCircle } from "lucide-react";
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

export function DemoDataPanel() {
  const queryClient = useQueryClient();
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [nukeResult, setNukeResult] = useState<NukeResult | null>(null);
  const [guidedTestOpen, setGuidedTestOpen] = useState(false);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery<{ stats: DemoStats }>({
    queryKey: ["/api/admin/demo/stats"],
    refetchOnWindowFocus: false,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/demo/seed");
      return response.json();
    },
    onSuccess: (data) => {
      setSeedResult(data);
      setNukeResult(null);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
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
    },
  });

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
          Seed comprehensive test data covering the full Deal OS workflow lifecycle, or clear all demo records.
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

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || nukeMutation.isPending}
            data-testid="button-seed-demo"
          >
            {seedMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Seed Demo Data
          </Button>

          {totalDemoRecords > 0 && (
            <Button
              variant="outline"
              onClick={() => setGuidedTestOpen(true)}
              data-testid="button-guided-test"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Guided Tour
            </Button>
          )}

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

        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">Demo Data Includes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>10 clients across various industries and statuses</li>
            <li>8 energy suppliers with RFQ playbooks</li>
            <li>10 deals spanning all lifecycle stages (Draft → Closed)</li>
            <li>Client dossiers with consumption profiles</li>
            <li>RFQ dispatches and supplier quotes</li>
            <li>Commission events and usage periods</li>
            <li>Deal cases for exception handling testing</li>
          </ul>
        </div>
      </CardContent>

      <GuidedTestModal open={guidedTestOpen} onOpenChange={setGuidedTestOpen} />
    </Card>
  );
}
