import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, CheckCircle, AlertTriangle, TrendingDown, TrendingUp, Scale, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface ReconciliationRun {
  id: number;
  runType: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalExpected?: string;
  totalReported?: string;
  totalPaid?: string;
  totalVariance?: string;
  lineCount: number;
  createdAt: string;
}

interface ReconciliationLine {
  id: number;
  dealId: string;
  clientId: number;
  supplierId: number;
  periodStart: string;
  periodEnd: string;
  expectedAmountBrl: string;
  supplierReportedAmountBrl?: string;
  paidAmountBrl?: string;
  varianceAmountBrl?: string;
  varianceReason?: string;
  status: string;
}

export function ReconciliationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const { data: runsData, isLoading: runsLoading, error: runsError } = useQuery({
    queryKey: ["/api/reconciliation-runs", sessionId],
    queryFn: async () => {
      const res = await fetch("/api/reconciliation-runs", { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch reconciliation runs");
      }
      return res.json();
    },
    enabled: !!sessionId,
  });

  const { data: runDetailData, isLoading: detailLoading, error: detailError } = useQuery({
    queryKey: ["/api/reconciliation-runs", selectedRunId, sessionId],
    queryFn: async () => {
      if (!selectedRunId) return null;
      const res = await fetch(`/api/reconciliation-runs/${selectedRunId}`, { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch run details");
      }
      return res.json();
    },
    enabled: !!selectedRunId && !!sessionId,
  });

  const [newRun, setNewRun] = useState({
    runType: "MONTHLY_CLOSE",
    periodStart: "",
    periodEnd: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newRun) => {
      const userId = user?.id || "system";
      const payload = {
        runType: data.runType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        notes: data.notes || null,
        createdBy: userId,
        status: "OPEN",
      };

      const res = await fetch("/api/reconciliation-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create reconciliation run");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation-runs"] });
      setShowCreateModal(false);
      setNewRun({ runType: "MONTHLY_CLOSE", periodStart: "", periodEnd: "", notes: "" });
      if (data.run?.id) {
        setSelectedRunId(data.run.id);
      }
      toast({ title: "Run created", description: "New reconciliation run started." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (runId: number) => {
      const userId = user?.id || "system";
      const res = await fetch(`/api/reconciliation-runs/${runId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ finalizedBy: userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to finalize run");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation-runs"] });
      toast({ title: "Run finalized", description: "The reconciliation run has been closed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const runs: ReconciliationRun[] = runsData?.runs || [];
  const selectedRun = runDetailData?.run;
  const lines: ReconciliationLine[] = runDetailData?.lines || [];

  const safeParseFloat = (value: string | undefined | null): number => {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalExpected = lines.reduce((sum, l) => sum + safeParseFloat(l.expectedAmountBrl), 0);
  const totalReported = lines.reduce((sum, l) => sum + safeParseFloat(l.supplierReportedAmountBrl), 0);
  const totalPaid = lines.reduce((sum, l) => sum + safeParseFloat(l.paidAmountBrl), 0);
  const totalVariance = totalExpected - totalPaid;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FINALIZED":
        return <Badge className="bg-gray-100 text-gray-800"><Lock className="w-3 h-3 mr-1" />Finalized</Badge>;
      case "RECONCILED":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Reconciled</Badge>;
      case "DISPUTED":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Disputed</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>;
    }
  };

  const getVarianceBadge = (variance: string | undefined) => {
    if (!variance) return null;
    const v = safeParseFloat(variance);
    if (v > 0) return <Badge className="bg-red-100 text-red-800"><TrendingDown className="w-3 h-3 mr-1" />-{Math.abs(v).toLocaleString()}</Badge>;
    if (v < 0) return <Badge className="bg-green-100 text-green-800"><TrendingUp className="w-3 h-3 mr-1" />+{Math.abs(v).toLocaleString()}</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Match</Badge>;
  };

  const isFormValid = newRun.periodStart && newRun.periodEnd;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Commission Reconciliation
              </CardTitle>
              <CardDescription>Reconcile expected vs reported vs paid commissions</CardDescription>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-run">
                  <Plus className="w-4 h-4 mr-2" />
                  New Run
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Reconciliation Run</DialogTitle>
                  <DialogDescription>Start a new monthly or ad-hoc reconciliation</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Run Type</Label>
                    <Select value={newRun.runType} onValueChange={(v) => setNewRun({ ...newRun, runType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY_CLOSE">Monthly Close</SelectItem>
                        <SelectItem value="ADHOC">Ad-hoc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Period Start *</Label>
                      <Input type="date" value={newRun.periodStart} onChange={(e) => setNewRun({ ...newRun, periodStart: e.target.value })} data-testid="input-run-start" />
                    </div>
                    <div>
                      <Label>Period End *</Label>
                      <Input type="date" value={newRun.periodEnd} onChange={(e) => setNewRun({ ...newRun, periodEnd: e.target.value })} data-testid="input-run-end" />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input value={newRun.notes} onChange={(e) => setNewRun({ ...newRun, notes: e.target.value })} placeholder="Optional notes" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button onClick={() => createMutation.mutate(newRun)} disabled={createMutation.isPending || !isFormValid} data-testid="button-create-run">
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {runsError && (
            <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{(runsError as Error).message}</span>
            </div>
          )}

          {runsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No reconciliation runs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className={selectedRunId === run.id ? "bg-violet-50" : ""} data-testid={`run-row-${run.id}`}>
                    <TableCell className="font-mono">#{run.id}</TableCell>
                    <TableCell><Badge variant="outline">{run.runType === "MONTHLY_CLOSE" ? "Monthly" : "Ad-hoc"}</Badge></TableCell>
                    <TableCell>{new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell>{run.lineCount || 0}</TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={selectedRunId === run.id ? "default" : "outline"} onClick={() => setSelectedRunId(run.id)} data-testid={`button-view-${run.id}`}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedRun && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Run #{selectedRun.id} Details</CardTitle>
                <CardDescription>{new Date(selectedRun.periodStart).toLocaleDateString()} - {new Date(selectedRun.periodEnd).toLocaleDateString()}</CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedRun.status === "OPEN" && (
                  <Button variant="outline" onClick={() => finalizeMutation.mutate(selectedRun.id)} disabled={finalizeMutation.isPending} data-testid="button-finalize">
                    {finalizeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Lock className="w-4 h-4 mr-2" />
                    Finalize
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {detailError && (
              <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5" />
                <span>{(detailError as Error).message}</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Expected</div>
                  <div className="text-xl font-bold text-violet-900">R$ {totalExpected.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Reported</div>
                  <div className="text-xl font-bold text-blue-900">R$ {totalReported.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Paid</div>
                  <div className="text-xl font-bold text-green-900">R$ {totalPaid.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Variance</div>
                  <div className={`text-xl font-bold ${totalVariance > 0 ? "text-red-600" : totalVariance < 0 ? "text-green-600" : "text-gray-600"}`}>
                    R$ {Math.abs(totalVariance).toLocaleString()} {totalVariance > 0 ? "↓" : totalVariance < 0 ? "↑" : ""}
                  </div>
                </CardContent>
              </Card>
            </div>

            {detailLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : lines.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reconciliation lines yet. Generate lines from deals.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id} data-testid={`line-row-${line.id}`}>
                      <TableCell className="font-mono text-xs">{line.dealId.slice(0, 8)}...</TableCell>
                      <TableCell>{new Date(line.periodStart).toLocaleDateString()} - {new Date(line.periodEnd).toLocaleDateString()}</TableCell>
                      <TableCell>R$ {safeParseFloat(line.expectedAmountBrl).toLocaleString()}</TableCell>
                      <TableCell>{line.supplierReportedAmountBrl ? `R$ ${safeParseFloat(line.supplierReportedAmountBrl).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{line.paidAmountBrl ? `R$ ${safeParseFloat(line.paidAmountBrl).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{getVarianceBadge(line.varianceAmountBrl)}</TableCell>
                      <TableCell>{getStatusBadge(line.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
