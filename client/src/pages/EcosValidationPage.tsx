import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Activity,
  Camera,
  ChevronRight,
  Target,
  Database,
  FileText
} from "lucide-react";

interface Deal {
  id: string;
  clientName: string;
  stage: string;
  clientId: number | null;
  createdAt: string;
}

interface EcosEvaluation {
  status: "BELOW_BAND" | "WITHIN_BAND" | "ABOVE_BAND" | "NO_DATA";
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceReasons: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    descriptionEn: string;
  }>;
  clientPriceRmwh: number | null;
  benchmarkLowerRmwh: number | null;
  benchmarkUpperRmwh: number | null;
  priceGapPercent: number | null;
  potentialSavingsAnnual: number | null;
  talkTrackEn: string;
  recommendedNextStep: string;
  frozenInputs: {
    annualConsumptionMwh: number | null;
    segment: string | null;
    region: string | null;
    contractLengthMonths: number | null;
    distributor: string | null;
    submarket: string | null;
    tariffClass: string | null;
  };
  benchmarkMatch: {
    benchmarkId: number;
    segment: string;
    region: string;
    contractLength: number;
    lowerBoundRmwh: number;
    upperBoundRmwh: number;
    lastUpdated: string | null;
    confidence: string | null;
  } | null;
}

interface EcosSnapshot {
  id: number;
  dealId: string;
  version: number;
  triggerType: string;
  status: string;
  confidenceLevel: string;
  createdAt: string;
}

export default function EcosValidationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deals");
      return res.json();
    }
  });

  const deals: Deal[] = dealsData?.deals || [];

  const { data: evaluationData, isLoading: evaluationLoading, refetch: refetchEvaluation } = useQuery({
    queryKey: ["/api/deals", selectedDealId, "ecos-evaluation"],
    queryFn: async () => {
      if (!selectedDealId) return null;
      const res = await fetch(`/api/deals/${selectedDealId}/ecos-evaluation`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch evaluation");
      return res.json();
    },
    enabled: !!selectedDealId
  });

  const { data: snapshotsData, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["/api/deals", selectedDealId, "ecos-snapshots"],
    queryFn: async () => {
      if (!selectedDealId) return null;
      const res = await fetch(`/api/deals/${selectedDealId}/ecos-snapshots`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch snapshots");
      return res.json();
    },
    enabled: !!selectedDealId
  });

  const evaluation: EcosEvaluation | null = evaluationData?.evaluation || null;
  const snapshots: EcosSnapshot[] = snapshotsData?.snapshots || [];

  const createSnapshotMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const res = await fetch(`/api/deals/${dealId}/ecos-snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ triggerType: "ADMIN_VALIDATION" })
      });
      if (!res.ok) throw new Error("Failed to create snapshot");
      return res.json();
    },
    onSuccess: () => {
      toast.success("ECOS snapshot created successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/deals", selectedDealId, "ecos-evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals", selectedDealId, "ecos-snapshots"] });
    },
    onError: () => {
      toast.error("Failed to create ECOS snapshot");
    }
  });

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = deal.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ABOVE_BAND":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Above Band</Badge>;
      case "WITHIN_BAND":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Within Band</Badge>;
      case "BELOW_BAND":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Below Band</Badge>;
      case "NO_DATA":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">No Data</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case "HIGH":
        return <Badge className="bg-green-100 text-green-700">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case "LOW":
        return <Badge className="bg-red-100 text-red-700">Low</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ABOVE_BAND":
        return <TrendingUp className="h-8 w-8 text-red-600" />;
      case "WITHIN_BAND":
        return <Activity className="h-8 w-8 text-green-600" />;
      case "BELOW_BAND":
        return <TrendingDown className="h-8 w-8 text-blue-600" />;
      case "NO_DATA":
        return <AlertCircle className="h-8 w-8 text-gray-400" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    }
  };

  const openEvaluationDialog = (dealId: string) => {
    setSelectedDealId(dealId);
    setShowEvaluationDialog(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">ECOS Validation</h1>
            <p className="text-muted-foreground mt-1">
              Preview and validate ECOS evaluations for deals before final review
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Deal Selection
            </CardTitle>
            <CardDescription>
              Select a deal to preview its ECOS evaluation and benchmark matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by deal ID or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-48" data-testid="select-stage-filter">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="DISCOVERY">Discovery</SelectItem>
                  <SelectItem value="DOSSIER_READY">Dossier Ready</SelectItem>
                  <SelectItem value="RFQ_SENT">RFQ Sent</SelectItem>
                  <SelectItem value="QUOTES_IN">Quotes In</SelectItem>
                  <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="VERBAL_COMMIT">Verbal Commit</SelectItem>
                  <SelectItem value="CONTRACT_SIGNED">Contract Signed</SelectItem>
                  <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                  <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dealsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deals found matching your criteria
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.slice(0, 20).map((deal) => (
                      <TableRow key={deal.id} data-testid={`row-deal-${deal.id}`}>
                        <TableCell className="font-mono text-sm">{deal.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium">{deal.clientName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{deal.stage?.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEvaluationDialog(deal.id)}
                            data-testid={`button-evaluate-${deal.id}`}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Evaluate
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                ECOS Evaluation Preview
              </DialogTitle>
              <DialogDescription>
                Deal: {selectedDealId?.slice(0, 8)}...
              </DialogDescription>
            </DialogHeader>

            {evaluationLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : evaluation ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(evaluation.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{evaluation.status.replace(/_/g, " ")}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(evaluation.status)}
                        {getConfidenceBadge(evaluation.confidenceLevel)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Recommended Next Step</p>
                    <Badge variant="outline" className="mt-1">
                      {evaluation.recommendedNextStep.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Client Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-client-price">
                        {evaluation.clientPriceRmwh !== null 
                          ? `R$ ${evaluation.clientPriceRmwh.toFixed(2)}/MWh`
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Market Band</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-market-band">
                        {evaluation.benchmarkLowerRmwh !== null && evaluation.benchmarkUpperRmwh !== null
                          ? `R$ ${evaluation.benchmarkLowerRmwh.toFixed(0)} - ${evaluation.benchmarkUpperRmwh.toFixed(0)}`
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Potential Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-savings">
                        {evaluation.potentialSavingsAnnual !== null && evaluation.potentialSavingsAnnual > 0
                          ? `R$ ${evaluation.potentialSavingsAnnual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/yr`
                          : "-"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Talk Track
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic" data-testid="text-talk-track">
                      "{evaluation.talkTrackEn}"
                    </p>
                  </CardContent>
                </Card>

                {evaluation.benchmarkMatch && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Benchmark Match
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Segment</p>
                          <p className="font-medium">{evaluation.benchmarkMatch.segment}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Region</p>
                          <p className="font-medium">{evaluation.benchmarkMatch.region}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contract Length</p>
                          <p className="font-medium">{evaluation.benchmarkMatch.contractLength} months</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-medium">{evaluation.benchmarkMatch.confidence || "N/A"}</p>
                        </div>
                      </div>
                      {evaluation.benchmarkMatch.lastUpdated && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Last updated: {new Date(evaluation.benchmarkMatch.lastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Confidence Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {evaluation.confidenceReasons.map((reason, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            reason.impact === "positive" 
                              ? "bg-green-50 text-green-700" 
                              : reason.impact === "negative"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-700"
                          }`}
                          data-testid={`confidence-factor-${idx}`}
                        >
                          {reason.impact === "positive" ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                          ) : reason.impact === "negative" ? (
                            <AlertCircle className="h-4 w-4 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                          )}
                          <span>{reason.descriptionEn}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Input Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Annual Consumption</p>
                        <p className="font-medium">
                          {evaluation.frozenInputs.annualConsumptionMwh 
                            ? `${evaluation.frozenInputs.annualConsumptionMwh} MWh`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Segment</p>
                        <p className="font-medium">{evaluation.frozenInputs.segment || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submarket</p>
                        <p className="font-medium">{evaluation.frozenInputs.submarket || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Distributor</p>
                        <p className="font-medium">{evaluation.frozenInputs.distributor || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {snapshotsLoading ? (
                        "Loading snapshots..."
                      ) : snapshots.length > 0 ? (
                        `${snapshots.length} snapshot(s) exist for this deal`
                      ) : (
                        "No snapshots yet"
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => refetchEvaluation()}
                      disabled={evaluationLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${evaluationLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => selectedDealId && createSnapshotMutation.mutate(selectedDealId)}
                      disabled={createSnapshotMutation.isPending}
                      data-testid="button-create-snapshot"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {createSnapshotMutation.isPending ? "Creating..." : "Create Snapshot"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Unable to load evaluation data</p>
                <p className="text-sm mt-1">This deal may not have a linked client dossier</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
