import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Plus,
  TrendingUp,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  Clock
} from "lucide-react";
import type { MarketPriceBenchmark } from "@shared/schema";

const SEGMENTS = ["SME", "Industrial"];
const REGIONS = ["Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"];
const CONTRACT_LENGTHS = [12, 24, 36];

interface BenchmarkFormData {
  segment: string;
  region: string;
  contractLengthMonths: number;
  lowerBoundRmwh: string;
  upperBoundRmwh: string;
  effectiveDate: string;
  expiresAt: string;
  notes: string;
}

const defaultFormData: BenchmarkFormData = {
  segment: "",
  region: "",
  contractLengthMonths: 12,
  lowerBoundRmwh: "",
  upperBoundRmwh: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  expiresAt: "",
  notes: ""
};

export default function BenchmarkManager() {
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<MarketPriceBenchmark | null>(null);
  const [formData, setFormData] = useState<BenchmarkFormData>(defaultFormData);
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [benchmarkToDelete, setBenchmarkToDelete] = useState<MarketPriceBenchmark | null>(null);

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
        expiresAt: data.expiresAt || null
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
        expiresAt: data.expiresAt || null
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/ecos/benchmarks/${id}`, {
        method: "DELETE"
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/ecos/benchmarks"] });
        toast({ title: t("benchmarks.toast.deleted") });
      } else {
        toast({ title: t("benchmarks.toast.error"), description: data.error, variant: "destructive" });
      }
    }
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingBenchmark(null);
  };

  const handleDeleteClick = (benchmark: MarketPriceBenchmark) => {
    setBenchmarkToDelete(benchmark);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (benchmarkToDelete) {
      deleteMutation.mutate(benchmarkToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setBenchmarkToDelete(null);
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
      notes: benchmark.notes || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.segment || !formData.region || !formData.lowerBoundRmwh || !formData.upperBoundRmwh) {
      toast({ title: t("benchmarks.toast.fill_required"), variant: "destructive" });
      return;
    }

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

  const groupedBySegment = filteredBenchmarks.reduce((acc, b) => {
    if (!acc[b.segment]) acc[b.segment] = [];
    acc[b.segment].push(b);
    return acc;
  }, {} as Record<string, MarketPriceBenchmark[]>);

  const isExpired = (b: MarketPriceBenchmark) => {
    if (!b.expiresAt) return false;
    return new Date(b.expiresAt) < new Date();
  };

  const isExpiringSoon = (b: MarketPriceBenchmark) => {
    if (!b.expiresAt) return false;
    const exp = new Date(b.expiresAt);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return exp <= soon && exp >= new Date();
  };

  return (
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
              <p className="text-violet-200 text-sm">{t("benchmarks.subtitle")}</p>
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingBenchmark ? t("benchmarks.dialog.edit_title") : t("benchmarks.dialog.title")}
                </DialogTitle>
                <DialogDescription>{t("benchmarks.dialog.description")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("benchmarks.segment")} *</Label>
                    <Select
                      value={formData.segment}
                      onValueChange={(v) => setFormData({ ...formData, segment: v })}
                    >
                      <SelectTrigger data-testid="select-segment">
                        <SelectValue placeholder={t("benchmarks.select_segment")} />
                      </SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("benchmarks.region")} *</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(v) => setFormData({ ...formData, region: v })}
                    >
                      <SelectTrigger data-testid="select-region">
                        <SelectValue placeholder={t("benchmarks.select_region")} />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t("benchmarks.contract_length")} *</Label>
                  <Select
                    value={String(formData.contractLengthMonths)}
                    onValueChange={(v) => setFormData({ ...formData, contractLengthMonths: Number(v) })}
                  >
                    <SelectTrigger data-testid="select-contract-length">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_LENGTHS.map((m) => (
                        <SelectItem key={m} value={String(m)}>{m} {t("benchmarks.months")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("benchmarks.lower_bound")} (R$/MWh) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.lowerBoundRmwh}
                      onChange={(e) => setFormData({ ...formData, lowerBoundRmwh: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-lower-bound"
                    />
                  </div>
                  <div>
                    <Label>{t("benchmarks.upper_bound")} (R$/MWh) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.upperBoundRmwh}
                      onChange={(e) => setFormData({ ...formData, upperBoundRmwh: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-upper-bound"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("benchmarks.effective_date")} *</Label>
                    <Input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                      data-testid="input-effective-date"
                    />
                  </div>
                  <div>
                    <Label>{t("benchmarks.expires_at")}</Label>
                    <Input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      data-testid="input-expires-at"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t("benchmarks.notes")}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("benchmarks.notes_placeholder")}
                    data-testid="input-notes"
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-benchmark"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingBenchmark ? t("benchmarks.save_changes") : t("benchmarks.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger className="w-40" data-testid="filter-segment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("benchmarks.all_segments")}</SelectItem>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-48" data-testid="filter-region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("benchmarks.all_regions")}</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <p className="text-gray-500">{t("benchmarks.empty")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("benchmarks.empty_hint")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedBySegment).map(([segment, items]) => (
              <div key={segment}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {segment}
                  <Badge variant="secondary">{items.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((benchmark) => (
                    <Card 
                      key={benchmark.id}
                      className={`relative ${isExpired(benchmark) ? "opacity-60 border-red-200" : isExpiringSoon(benchmark) ? "border-yellow-300" : ""}`}
                      data-testid={`benchmark-card-${benchmark.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-violet-600" />
                              {benchmark.region}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {benchmark.contractLengthMonths} {t("benchmarks.months")}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            {isExpired(benchmark) && (
                              <Badge variant="destructive" className="text-xs">{t("benchmarks.expired")}</Badge>
                            )}
                            {isExpiringSoon(benchmark) && !isExpired(benchmark) && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">{t("benchmarks.expiring_soon")}</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gradient-to-r from-green-50 to-red-50 rounded-lg p-4 mb-3">
                          <div className="flex justify-between items-center">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">{t("benchmarks.lower")}</p>
                              <p className="text-lg font-bold text-green-700">R$ {benchmark.lowerBoundRmwh}</p>
                            </div>
                            <div className="text-gray-300">→</div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">{t("benchmarks.upper")}</p>
                              <p className="text-lg font-bold text-red-700">R$ {benchmark.upperBoundRmwh}</p>
                            </div>
                          </div>
                          <p className="text-xs text-center text-gray-400 mt-2">MWh</p>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t("benchmarks.effective")}: {new Date(benchmark.effectiveDate).toLocaleDateString("pt-BR")}
                          </div>
                          {benchmark.expiresAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {t("benchmarks.expires")}: {new Date(benchmark.expiresAt).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>

                        {benchmark.notes && (
                          <p className="text-xs text-gray-400 mt-2 italic truncate" title={benchmark.notes}>
                            {benchmark.notes}
                          </p>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openEditDialog(benchmark)}
                            data-testid={`button-edit-${benchmark.id}`}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            {t("benchmarks.edit")}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteClick(benchmark)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${benchmark.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {t("benchmarks.delete")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("benchmarks.delete_dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("benchmarks.delete_dialog.description")}
              {benchmarkToDelete && (
                <span className="block mt-2 font-medium">
                  {benchmarkToDelete.segment} - {benchmarkToDelete.region} ({benchmarkToDelete.contractLengthMonths} {t("benchmarks.months")})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("benchmarks.delete_dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {t("benchmarks.delete_dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
