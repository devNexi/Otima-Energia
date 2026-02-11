import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Plus,
  TrendingUp,
  Loader2,
  Pencil,
  Eye,
  Calendar,
  CheckCircle2,
  Info,
  ExternalLink
} from "lucide-react";
import type { MarketPriceBenchmark } from "@shared/schema";

const SEGMENTS = ["SME", "Industrial"];
const REGIONS = ["Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"];
const CONTRACT_LENGTHS = [12, 24, 36];
const SOURCE_TYPES = ["SupplierQuote", "BrokerIntel", "PublicSignal", "InternalDeal", "Other"];
const CONFIDENCE_LEVELS = ["Low", "Medium", "High"];
const REVIEW_CADENCES = ["Monthly", "Quarterly"];

interface BenchmarkFormData {
  segment: string;
  region: string;
  contractLengthMonths: number;
  lowerBoundRmwh: string;
  upperBoundRmwh: string;
  effectiveDate: string;
  expiresAt: string;
  source: string;
  notes: string;
  sourceType: string;
  sourceDetails: string;
  sourceUrl: string;
  confidence: string;
  reviewCadence: string;
  nextReviewDate: string;
}

const defaultFormData: BenchmarkFormData = {
  segment: "",
  region: "",
  contractLengthMonths: 12,
  lowerBoundRmwh: "",
  upperBoundRmwh: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  expiresAt: "",
  source: "",
  notes: "",
  sourceType: "",
  sourceDetails: "",
  sourceUrl: "",
  confidence: "Medium",
  reviewCadence: "Quarterly",
  nextReviewDate: ""
};

function BenchmarkUsagesSection({ benchmarkId, t }: { benchmarkId: number; t: (key: string) => string }) {
  const { data: usagesData, isLoading, isError } = useQuery({
    queryKey: ["/api/ecos/benchmarks", benchmarkId, "usages"],
    queryFn: async () => {
      const res = await fetch(`/api/ecos/benchmarks/${benchmarkId}/usages`);
      if (!res.ok) throw new Error("Failed to fetch usages");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch usages");
      return data;
    }
  });

  const usages = usagesData?.snapshots || [];

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">{t("benchmarks.detail.usage_title")}</h3>
      <Card>
        {isLoading ? (
          <CardContent className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-600" />
          </CardContent>
        ) : isError ? (
          <CardContent className="py-8 text-center text-red-500">
            Failed to load usage data
          </CardContent>
        ) : usages.length === 0 ? (
          <CardContent className="py-8 text-center text-gray-500">
            {t("benchmarks.detail.usage_empty")}
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("benchmarks.detail.client_lead")}</TableHead>
                <TableHead>{t("benchmarks.detail.date")}</TableHead>
                <TableHead>{t("benchmarks.detail.result")}</TableHead>
                <TableHead className="text-right">{t("benchmarks.detail.link")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usages.map((usage: any) => (
                <TableRow key={usage.id}>
                  <TableCell className="font-medium">Lead #{usage.leadId}</TableCell>
                  <TableCell>{new Date(usage.generatedAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge className={
                      usage.bandResult === "within_band" ? "bg-green-100 text-green-800" :
                      usage.bandResult === "at_risk" ? "bg-yellow-100 text-yellow-800" :
                      usage.bandResult === "above_band" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }>
                      {usage.bandResult?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/leads/${usage.leadId}`}>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default function BenchmarkManager() {
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<MarketPriceBenchmark | null>(null);
  const [viewingBenchmark, setViewingBenchmark] = useState<MarketPriceBenchmark | null>(null);
  const [benchmarkToReview, setBenchmarkToReview] = useState<MarketPriceBenchmark | null>(null);
  const [formData, setFormData] = useState<BenchmarkFormData>(defaultFormData);
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [boundError, setBoundError] = useState(false);

  const { data: benchmarksData, isLoading } = useQuery({
    queryKey: ["/api/ecos/benchmarks"],
    queryFn: async () => {
      const res = await fetch("/api/ecos/benchmarks");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: BenchmarkFormData) => {
      const payload = {
        ...data,
        contractLengthMonths: Number(data.contractLengthMonths),
        expiresAt: data.expiresAt || null,
        sourceType: data.sourceType || null,
        sourceDetails: data.sourceDetails || null,
        sourceUrl: data.sourceUrl || null,
        confidence: data.confidence || "Medium",
        reviewCadence: data.reviewCadence || "Quarterly",
        nextReviewDate: data.nextReviewDate || null
      };
      const res = await fetch("/api/ecos/benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/ecos/benchmarks"] });
        setDialogOpen(false);
        resetForm();
        toast({ title: t("benchmarks.toast.created") });
      } else {
        toast({ title: t("benchmarks.toast.error"), description: data.error, variant: "destructive" });
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BenchmarkFormData> }) => {
      const payload = {
        ...data,
        contractLengthMonths: data.contractLengthMonths ? Number(data.contractLengthMonths) : undefined,
        expiresAt: data.expiresAt || null,
        sourceType: data.sourceType || null,
        sourceDetails: data.sourceDetails || null,
        sourceUrl: data.sourceUrl || null,
        confidence: data.confidence || "Medium",
        reviewCadence: data.reviewCadence || "Quarterly",
        nextReviewDate: data.nextReviewDate || null
      };
      const res = await fetch(`/api/ecos/benchmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/ecos/benchmarks"] });
        setDialogOpen(false);
        setEditingBenchmark(null);
        resetForm();
        toast({ title: t("benchmarks.toast.updated") });
      } else {
        toast({ title: t("benchmarks.toast.error"), description: data.error, variant: "destructive" });
      }
    }
  });

  const markReviewedMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/ecos/benchmarks/${id}/mark-reviewed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: "admin" })
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/ecos/benchmarks"] });
        setReviewConfirmOpen(false);
        setBenchmarkToReview(null);
        toast({ title: t("benchmarks.toast.reviewed") });
      } else {
        toast({ title: t("benchmarks.toast.error"), description: data.error, variant: "destructive" });
      }
    }
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingBenchmark(null);
    setBoundError(false);
  };

  const openEditDialog = (benchmark: MarketPriceBenchmark) => {
    setEditingBenchmark(benchmark);
    setFormData({
      segment: benchmark.segment,
      region: benchmark.region,
      contractLengthMonths: benchmark.contractLengthMonths,
      lowerBoundRmwh: benchmark.lowerBoundRmwh,
      upperBoundRmwh: benchmark.upperBoundRmwh,
      effectiveDate: benchmark.effectiveDate,
      expiresAt: benchmark.expiresAt || "",
      source: benchmark.source || "",
      notes: benchmark.notes || "",
      sourceType: benchmark.sourceType || "",
      sourceDetails: benchmark.sourceDetails || "",
      sourceUrl: benchmark.sourceUrl || "",
      confidence: benchmark.confidence || "Medium",
      reviewCadence: benchmark.reviewCadence || "Quarterly",
      nextReviewDate: benchmark.nextReviewDate || ""
    });
    setDialogOpen(true);
  };

  const openDetailDialog = (benchmark: MarketPriceBenchmark) => {
    setViewingBenchmark(benchmark);
    setDetailDialogOpen(true);
  };

  const openReviewConfirm = (benchmark: MarketPriceBenchmark) => {
    setBenchmarkToReview(benchmark);
    setReviewConfirmOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.segment || !formData.region || !formData.lowerBoundRmwh || !formData.upperBoundRmwh) {
      toast({ title: t("benchmarks.toast.fill_required"), variant: "destructive" });
      return;
    }

    const lower = parseFloat(formData.lowerBoundRmwh);
    const upper = parseFloat(formData.upperBoundRmwh);
    if (upper < lower) {
      setBoundError(true);
      return;
    }
    setBoundError(false);

    if (editingBenchmark) {
      updateMutation.mutate({ id: editingBenchmark.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const benchmarks: MarketPriceBenchmark[] = benchmarksData?.benchmarks || [];
  
  const filteredBenchmarks = benchmarks.filter((b) => {
    if (filterSegment !== "all" && b.segment !== filterSegment) return false;
    if (filterRegion !== "all" && b.region !== filterRegion) return false;
    return true;
  });

  const getStatus = (b: MarketPriceBenchmark): "active" | "review_due" | "overdue" => {
    if (!b.nextReviewDate) return "active";
    const reviewDate = new Date(b.nextReviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reviewDate < today) return "overdue";
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 14);
    if (reviewDate <= soon) return "review_due";
    return "active";
  };

  const getStatusBadge = (status: "active" | "review_due" | "overdue") => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-status-active">{t("benchmarks.status.active")}</Badge>;
      case "review_due":
        return <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-status-review-due">{t("benchmarks.status.review_due")}</Badge>;
      case "overdue":
        return <Badge variant="destructive" data-testid="badge-status-overdue">{t("benchmarks.status.overdue")}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "High":
        return <Badge className="bg-green-100 text-green-800">{t("benchmarks.confidence.High")}</Badge>;
      case "Low":
        return <Badge className="bg-red-100 text-red-800">{t("benchmarks.confidence.Low")}</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">{t("benchmarks.confidence.Medium")}</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="benchmark-manager-page">
        <header className="bg-violet-900 text-white p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white hover:bg-violet-800" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("benchmarks.back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t("benchmarks.title")}
                </h1>
                <p className="text-violet-200 text-sm max-w-2xl">{t("benchmarks.subtitle")}</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-white text-violet-900 hover:bg-violet-100" data-testid="button-new-benchmark">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("benchmarks.new")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBenchmark ? t("benchmarks.dialog.edit_title") : t("benchmarks.dialog.title")}
                  </DialogTitle>
                  <DialogDescription>{t("benchmarks.dialog.description")}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{t("benchmarks.section.scope")}</h3>
                      <Tooltip>
                        <TooltipTrigger><Info className="w-4 h-4 text-gray-400" /></TooltipTrigger>
                        <TooltipContent><p className="max-w-xs">{t("benchmarks.section.scope_helper")}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>{t("benchmarks.segment")} *</Label>
                        <Select value={formData.segment} onValueChange={(v) => setFormData({ ...formData, segment: v })}>
                          <SelectTrigger data-testid="select-segment"><SelectValue placeholder={t("benchmarks.select_segment")} /></SelectTrigger>
                          <SelectContent>
                            {SEGMENTS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">{t("benchmarks.segment_helper")}</p>
                      </div>
                      <div>
                        <Label>{t("benchmarks.region")} *</Label>
                        <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                          <SelectTrigger data-testid="select-region"><SelectValue placeholder={t("benchmarks.select_region")} /></SelectTrigger>
                          <SelectContent>
                            {REGIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">{t("benchmarks.region_helper")}</p>
                      </div>
                      <div>
                        <Label>{t("benchmarks.contract_length")} *</Label>
                        <Select value={String(formData.contractLengthMonths)} onValueChange={(v) => setFormData({ ...formData, contractLengthMonths: Number(v) })}>
                          <SelectTrigger data-testid="select-contract-length"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTRACT_LENGTHS.map((m) => (<SelectItem key={m} value={String(m)}>{m} {t("benchmarks.months")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">{t("benchmarks.contract_length_helper")}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{t("benchmarks.section.scope_helper")}</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">{t("benchmarks.section.range")}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("benchmarks.lower_bound")} (R$/MWh) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.lowerBoundRmwh}
                          onChange={(e) => { setFormData({ ...formData, lowerBoundRmwh: e.target.value }); setBoundError(false); }}
                          placeholder="0.00"
                          data-testid="input-lower-bound"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t("benchmarks.lower_bound_helper")}</p>
                      </div>
                      <div>
                        <Label>{t("benchmarks.upper_bound")} (R$/MWh) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.upperBoundRmwh}
                          onChange={(e) => { setFormData({ ...formData, upperBoundRmwh: e.target.value }); setBoundError(false); }}
                          placeholder="0.00"
                          className={boundError ? "border-red-500" : ""}
                          data-testid="input-upper-bound"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t("benchmarks.upper_bound_helper")}</p>
                      </div>
                    </div>
                    {boundError && (
                      <p className="text-sm text-red-600">{t("benchmarks.bound_error")}</p>
                    )}
                    <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 p-2 rounded">{t("benchmarks.section.range_helper")}</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">{t("benchmarks.section.source")}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("benchmarks.source_type")}</Label>
                        <Select value={formData.sourceType} onValueChange={(v) => setFormData({ ...formData, sourceType: v })}>
                          <SelectTrigger data-testid="select-source-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                          <SelectContent>
                            {SOURCE_TYPES.map((st) => (<SelectItem key={st} value={st}>{t(`benchmarks.source_type.${st}` as any)}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("benchmarks.confidence")}</Label>
                        <Select value={formData.confidence} onValueChange={(v) => setFormData({ ...formData, confidence: v })}>
                          <SelectTrigger data-testid="select-confidence"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONFIDENCE_LEVELS.map((cl) => (<SelectItem key={cl} value={cl}>{t(`benchmarks.confidence.${cl}` as any)}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>{t("benchmarks.source_details")}</Label>
                      <Input
                        value={formData.sourceDetails}
                        onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
                        placeholder={t("benchmarks.source_details_placeholder")}
                        data-testid="input-source-details"
                      />
                    </div>
                    <div>
                      <Label>{t("benchmarks.source_url")}</Label>
                      <Input
                        value={formData.sourceUrl}
                        onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                        placeholder={t("benchmarks.source_url_placeholder")}
                        data-testid="input-source-url"
                      />
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{t("benchmarks.confidence_helper")}</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">{t("benchmarks.section.review")}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("benchmarks.review_cadence")}</Label>
                        <Select value={formData.reviewCadence} onValueChange={(v) => setFormData({ ...formData, reviewCadence: v })}>
                          <SelectTrigger data-testid="select-review-cadence"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REVIEW_CADENCES.map((rc) => (<SelectItem key={rc} value={rc}>{t(`benchmarks.review_cadence.${rc}` as any)}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("benchmarks.next_review")}</Label>
                        <Input
                          type="date"
                          value={formData.nextReviewDate}
                          onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                          data-testid="input-next-review"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{t("benchmarks.next_review_helper")}</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">{t("benchmarks.section.notes")}</h3>
                    <div>
                      <Label>{t("benchmarks.notes")}</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder={t("benchmarks.notes_placeholder")}
                        data-testid="input-notes"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">{t("benchmarks.notes_helper")}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("benchmarks.delete_dialog.cancel")}</Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-benchmark"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (<Loader2 className="w-4 h-4 mr-2 animate-spin" />)}
                    {t("benchmarks.save")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger className="w-40" data-testid="filter-segment"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("benchmarks.all_segments")}</SelectItem>
                {SEGMENTS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-48" data-testid="filter-region"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("benchmarks.all_regions")}</SelectItem>
                {REGIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="ml-auto text-sm text-gray-500">
              {filteredBenchmarks.length} {t("benchmarks.records")}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : filteredBenchmarks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("benchmarks.empty_title")}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">{t("benchmarks.empty_body")}</p>
                <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("benchmarks.add_first")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("benchmarks.segment")}</TableHead>
                    <TableHead>{t("benchmarks.region")}</TableHead>
                    <TableHead>{t("benchmarks.term")}</TableHead>
                    <TableHead>{t("benchmarks.reference_range")}</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        {t("benchmarks.confidence")}
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-gray-400" /></TooltipTrigger>
                          <TooltipContent><p>{t("benchmarks.confidence_tooltip")}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>{t("benchmarks.source")}</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        {t("benchmarks.next_review")}
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-gray-400" /></TooltipTrigger>
                          <TooltipContent><p>{t("benchmarks.next_review_tooltip")}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBenchmarks.map((benchmark) => {
                    const status = getStatus(benchmark);
                    return (
                      <TableRow key={benchmark.id} data-testid={`benchmark-row-${benchmark.id}`}>
                        <TableCell className="font-medium">{benchmark.segment}</TableCell>
                        <TableCell>{benchmark.region}</TableCell>
                        <TableCell>{benchmark.contractLengthMonths}m</TableCell>
                        <TableCell>
                          <span className="font-mono">
                            R$ {benchmark.lowerBoundRmwh} – R$ {benchmark.upperBoundRmwh}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">/MWh</span>
                        </TableCell>
                        <TableCell>{benchmark.confidence ? getConfidenceBadge(benchmark.confidence) : "-"}</TableCell>
                        <TableCell>
                          {benchmark.sourceType ? (
                            <span className="text-sm">{t(`benchmarks.source_type.${benchmark.sourceType}` as any)}</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {benchmark.nextReviewDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(benchmark.nextReviewDate).toLocaleDateString("pt-BR")}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => openDetailDialog(benchmark)}
                              data-testid={`button-view-${benchmark.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="ml-1">{t("benchmarks.view")}</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => openEditDialog(benchmark)}
                              data-testid={`button-edit-${benchmark.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="ml-1">{t("benchmarks.edit")}</span>
                            </Button>
                            {(status === "overdue" || status === "review_due") && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => openReviewConfirm(benchmark)}
                                data-testid={`button-mark-reviewed-${benchmark.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="ml-1">{t("benchmarks.mark_reviewed")}</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </main>

        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            {viewingBenchmark && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {t("benchmarks.detail.header")}, {viewingBenchmark.segment} · {viewingBenchmark.region} · {viewingBenchmark.contractLengthMonths}m
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">{t("benchmarks.reference_range")}</p>
                          <p className="font-semibold text-lg">R$ {viewingBenchmark.lowerBoundRmwh} – R$ {viewingBenchmark.upperBoundRmwh} /MWh</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("benchmarks.confidence")}</p>
                          <div className="mt-1">{viewingBenchmark.confidence ? getConfidenceBadge(viewingBenchmark.confidence) : "-"}</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("benchmarks.source")}</p>
                          <p className="font-medium">
                            {viewingBenchmark.sourceType ? t(`benchmarks.source_type.${viewingBenchmark.sourceType}` as any) : "-"}
                          </p>
                          {viewingBenchmark.sourceDetails && (
                            <p className="text-sm text-gray-600">{viewingBenchmark.sourceDetails}</p>
                          )}
                          {viewingBenchmark.sourceUrl && (
                            <a 
                              href={viewingBenchmark.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-violet-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View source
                            </a>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("benchmarks.last_reviewed")}</p>
                          <p className="font-medium">
                            {viewingBenchmark.lastReviewedAt 
                              ? new Date(viewingBenchmark.lastReviewedAt).toLocaleDateString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("benchmarks.next_review")}</p>
                          <p className="font-medium">
                            {viewingBenchmark.nextReviewDate 
                              ? new Date(viewingBenchmark.nextReviewDate).toLocaleDateString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <div className="mt-1">{getStatusBadge(getStatus(viewingBenchmark))}</div>
                        </div>
                      </div>
                      {viewingBenchmark.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-500">{t("benchmarks.notes")}</p>
                          <p className="text-gray-700 mt-1">{viewingBenchmark.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <BenchmarkUsagesSection benchmarkId={viewingBenchmark.id} t={t} />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { openEditDialog(viewingBenchmark); setDetailDialogOpen(false); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    {t("benchmarks.edit")} {t("benchmarks.detail.header")}
                  </Button>
                  {(getStatus(viewingBenchmark) === "overdue" || getStatus(viewingBenchmark) === "review_due") && (
                    <Button onClick={() => { openReviewConfirm(viewingBenchmark); setDetailDialogOpen(false); }}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("benchmarks.mark_reviewed")}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={reviewConfirmOpen} onOpenChange={setReviewConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("benchmarks.review_modal.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("benchmarks.review_modal.body")}
                {benchmarkToReview && (
                  <span className="block mt-2 font-medium text-gray-900">
                    {benchmarkToReview.segment} · {benchmarkToReview.region} · {benchmarkToReview.contractLengthMonths}m
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-review">
                {t("benchmarks.review_modal.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => benchmarkToReview && markReviewedMutation.mutate(benchmarkToReview.id)}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-review"
              >
                {markReviewedMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("benchmarks.review_modal.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
