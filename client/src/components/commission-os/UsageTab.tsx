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
import { Loader2, Plus, CheckCircle, Filter, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UsagePeriod {
  id: string;
  clientId: number;
  dealId?: string;
  ucCode?: string;
  periodStartDate: string;
  periodEndDate: string;
  energyKwh: string;
  demandKw?: string;
  billedAmountBrl?: string;
  sourceType: string;
  status: string;
  verifiedByUserId?: string;
  verifiedAt?: string;
  notes?: string;
}

export function UsageTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterClientId, setFilterClientId] = useState("");
  const [filterDealId, setFilterDealId] = useState("");

  const { data: usageData, isLoading, error: usageError } = useQuery({
    queryKey: ["/api/usage", filterClientId, filterDealId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterClientId) params.append("clientId", filterClientId);
      if (filterDealId) params.append("dealId", filterDealId);
      const res = await fetch(`/api/usage?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch usage data");
      }
      return res.json();
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients", { credentials: "include" });
      return res.json();
    },
  });

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });

  const [newUsage, setNewUsage] = useState({
    clientId: "",
    dealId: "",
    ucCode: "",
    periodStartDate: "",
    periodEndDate: "",
    energyKwh: "",
    demandKw: "",
    billedAmountBrl: "",
    sourceType: "MANUAL",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newUsage) => {
      const payload: Record<string, any> = {
        clientId: parseInt(data.clientId, 10),
        periodStartDate: data.periodStartDate,
        periodEndDate: data.periodEndDate,
        energyKwh: data.energyKwh,
        sourceType: data.sourceType,
        status: "DRAFT",
      };
      if (data.dealId) payload.dealId = data.dealId;
      if (data.ucCode) payload.ucCode = data.ucCode;
      if (data.demandKw) payload.demandKw = data.demandKw;
      if (data.billedAmountBrl) payload.billedAmountBrl = data.billedAmountBrl;
      if (data.notes) payload.notes = data.notes;

      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create usage period");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      setShowAddModal(false);
      setNewUsage({
        clientId: "",
        dealId: "",
        ucCode: "",
        periodStartDate: "",
        periodEndDate: "",
        energyKwh: "",
        demandKw: "",
        billedAmountBrl: "",
        sourceType: "MANUAL",
        notes: "",
      });
      toast({ title: "Usage period created", description: "The usage record has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const userId = authData?.user?.id || "unknown";
      const res = await fetch(`/api/usage/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verifiedByUserId: userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to verify usage period");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({ title: "Usage verified", description: "The usage period has been verified." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const periods: UsagePeriod[] = usageData?.periods || [];
  const clients = clientsData?.clients || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "INVALID":
        return <Badge className="bg-red-100 text-red-800">Invalid</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      BILL_OCR: "bg-blue-100 text-blue-800",
      CLIENT_CSV: "bg-purple-100 text-purple-800",
      SUPPLIER_REPORT: "bg-orange-100 text-orange-800",
      MANUAL: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[source] || "bg-gray-100"}>{source}</Badge>;
  };

  const isFormValid = newUsage.clientId && newUsage.periodStartDate && newUsage.periodEndDate && newUsage.energyKwh;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Energy Usage Tracking
            </CardTitle>
            <CardDescription>Track and verify monthly client energy consumption</CardDescription>
          </div>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-usage">
                <Plus className="w-4 h-4 mr-2" />
                Add Usage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Usage Period</DialogTitle>
                <DialogDescription>Record monthly energy consumption for a client</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Client *</Label>
                  <Select value={newUsage.clientId} onValueChange={(v) => setNewUsage({ ...newUsage, clientId: v })}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period Start *</Label>
                    <Input type="date" value={newUsage.periodStartDate} onChange={(e) => setNewUsage({ ...newUsage, periodStartDate: e.target.value })} data-testid="input-period-start" />
                  </div>
                  <div>
                    <Label>Period End *</Label>
                    <Input type="date" value={newUsage.periodEndDate} onChange={(e) => setNewUsage({ ...newUsage, periodEndDate: e.target.value })} data-testid="input-period-end" />
                  </div>
                </div>
                <div>
                  <Label>Energy (kWh) *</Label>
                  <Input type="number" value={newUsage.energyKwh} onChange={(e) => setNewUsage({ ...newUsage, energyKwh: e.target.value })} placeholder="e.g. 15000" data-testid="input-energy-kwh" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Demand (kW)</Label>
                    <Input type="number" value={newUsage.demandKw} onChange={(e) => setNewUsage({ ...newUsage, demandKw: e.target.value })} placeholder="Optional" />
                  </div>
                  <div>
                    <Label>Billed (BRL)</Label>
                    <Input type="number" value={newUsage.billedAmountBrl} onChange={(e) => setNewUsage({ ...newUsage, billedAmountBrl: e.target.value })} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <Label>Source Type</Label>
                  <Select value={newUsage.sourceType} onValueChange={(v) => setNewUsage({ ...newUsage, sourceType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual Entry</SelectItem>
                      <SelectItem value="BILL_OCR">Bill OCR</SelectItem>
                      <SelectItem value="CLIENT_CSV">Client CSV</SelectItem>
                      <SelectItem value="SUPPLIER_REPORT">Supplier Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>UC Code</Label>
                  <Input value={newUsage.ucCode} onChange={(e) => setNewUsage({ ...newUsage, ucCode: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(newUsage)} disabled={createMutation.isPending || !isFormValid} data-testid="button-save-usage">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 items-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Filters:</span>
          </div>
          <div className="w-48">
            <Select value={filterClientId} onValueChange={setFilterClientId}>
              <SelectTrigger data-testid="filter-client">
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All clients</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Deal ID" value={filterDealId} onChange={(e) => setFilterDealId(e.target.value)} className="w-48" data-testid="filter-deal" />
        </div>

        {usageError && (
          <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{(usageError as Error).message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : periods.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No usage periods recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Energy (kWh)</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => {
                const client = clients.find((c: any) => c.id === period.clientId);
                const energyValue = parseFloat(period.energyKwh);
                return (
                  <TableRow key={period.id} data-testid={`usage-row-${period.id}`}>
                    <TableCell className="font-medium">{client?.companyName || `Client #${period.clientId}`}</TableCell>
                    <TableCell>{new Date(period.periodStartDate).toLocaleDateString()} - {new Date(period.periodEndDate).toLocaleDateString()}</TableCell>
                    <TableCell>{isNaN(energyValue) ? period.energyKwh : energyValue.toLocaleString()}</TableCell>
                    <TableCell>{getSourceBadge(period.sourceType)}</TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell>
                      {period.status === "DRAFT" && (
                        <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate(period.id)} disabled={verifyMutation.isPending} data-testid={`button-verify-${period.id}`}>
                          {verifyMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
