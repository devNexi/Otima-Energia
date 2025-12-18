import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Settings, History, BookOpen, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface SupplierPlaybook {
  id: number;
  supplierId: number;
  commissionPayerEntity?: string;
  paymentCadence: string;
  reportFormatsSupported: string[];
  contacts: { ops?: string; finance?: string };
  slaTargets: { quoteResponseHours?: number; paymentDaysAfterInvoice?: number };
  rules: Record<string, any>;
  version: number;
  isActive: boolean;
  updatedAt: string;
}

export function PlaybooksTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId, user } = useAuth();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const { data: suppliersData, isLoading: suppliersLoading, error: suppliersError } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch suppliers");
      }
      return res.json();
    },
  });

  const { data: playbooksData, isLoading, error: playbooksError } = useQuery({
    queryKey: ["/api/supplier-playbooks", sessionId],
    queryFn: async () => {
      const res = await fetch("/api/supplier-playbooks", { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch playbooks");
      }
      return res.json();
    },
    enabled: !!sessionId,
  });

  const { data: versionsData, isLoading: versionsLoading, error: versionsError } = useQuery({
    queryKey: ["/api/suppliers", selectedSupplierId, "playbook", "versions", sessionId],
    queryFn: async () => {
      if (!selectedSupplierId) return { versions: [] };
      const res = await fetch(`/api/suppliers/${selectedSupplierId}/playbook/versions`, { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch versions");
      }
      return res.json();
    },
    enabled: !!selectedSupplierId && showVersionHistory && !!sessionId,
  });

  const [newPlaybook, setNewPlaybook] = useState({
    supplierId: "",
    commissionPayerEntity: "",
    paymentCadence: "MONTHLY",
    reportFormatsSupported: "xlsx,csv",
    opsContact: "",
    financeContact: "",
    quoteResponseHours: "48",
    paymentDaysAfterInvoice: "30",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newPlaybook) => {
      const formats = data.reportFormatsSupported
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        supplierId: parseInt(data.supplierId, 10),
        commissionPayerEntity: data.commissionPayerEntity || null,
        paymentCadence: data.paymentCadence,
        reportFormatsSupported: formats.length > 0 ? formats : ["xlsx"],
        contacts: {
          ops: data.opsContact || null,
          finance: data.financeContact || null,
        },
        slaTargets: {
          quoteResponseHours: parseInt(data.quoteResponseHours, 10) || 48,
          paymentDaysAfterInvoice: parseInt(data.paymentDaysAfterInvoice, 10) || 30,
        },
        rules: {},
        isActive: true,
        updatedBy: user?.id || null,
      };

      const res = await fetch(`/api/suppliers/${data.supplierId}/playbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create playbook");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-playbooks"] });
      setShowCreateModal(false);
      setNewPlaybook({
        supplierId: "",
        commissionPayerEntity: "",
        paymentCadence: "MONTHLY",
        reportFormatsSupported: "xlsx,csv",
        opsContact: "",
        financeContact: "",
        quoteResponseHours: "48",
        paymentDaysAfterInvoice: "30",
      });
      toast({ title: "Playbook created", description: "New supplier playbook version has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const suppliers = suppliersData?.suppliers || [];
  const playbooks: SupplierPlaybook[] = playbooksData?.playbooks || [];
  const versions: SupplierPlaybook[] = versionsData?.versions || [];

  const getCadenceBadge = (cadence: string) => {
    const colors: Record<string, string> = {
      UPFRONT: "bg-green-100 text-green-800",
      MONTHLY: "bg-blue-100 text-blue-800",
      QUARTERLY: "bg-purple-100 text-purple-800",
      MIXED: "bg-orange-100 text-orange-800",
    };
    return <Badge className={colors[cadence] || "bg-gray-100"}>{cadence}</Badge>;
  };

  const isFormValid = newPlaybook.supplierId && newPlaybook.paymentCadence;
  const hasError = suppliersError || playbooksError;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Supplier Playbooks
            </CardTitle>
            <CardDescription>Configure how each supplier calculates commissions and reports</CardDescription>
          </div>
          <Button 
            data-testid="button-add-playbook" 
            disabled={suppliers.length === 0}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Playbook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasError && (
          <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{(suppliersError as Error)?.message || (playbooksError as Error)?.message}</span>
          </div>
        )}

        {isLoading || suppliersLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : playbooks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No supplier playbooks configured yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Commission Payer</TableHead>
                <TableHead>Payment Cadence</TableHead>
                <TableHead>Report Formats</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playbooks.map((playbook) => {
                const supplier = suppliers.find((s: any) => s.id === playbook.supplierId);
                const formats = Array.isArray(playbook.reportFormatsSupported) ? playbook.reportFormatsSupported : [];
                return (
                  <TableRow key={playbook.id} data-testid={`playbook-row-${playbook.id}`}>
                    <TableCell className="font-medium">{supplier?.name || `Supplier #${playbook.supplierId}`}</TableCell>
                    <TableCell>{playbook.commissionPayerEntity || "-"}</TableCell>
                    <TableCell>{getCadenceBadge(playbook.paymentCadence)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {formats.map((f: string) => (
                          <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{playbook.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedSupplierId(playbook.supplierId); setShowVersionHistory(true); }} data-testid={`button-history-${playbook.id}`}>
                          <History className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-edit-${playbook.id}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Create Playbook Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Supplier Playbook</DialogTitle>
              <DialogDescription>Define how this supplier works with commissions</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Supplier *</Label>
                <Select value={newPlaybook.supplierId} onValueChange={(v) => setNewPlaybook({ ...newPlaybook, supplierId: v })}>
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Commission Payer Entity</Label>
                <Input value={newPlaybook.commissionPayerEntity} onChange={(e) => setNewPlaybook({ ...newPlaybook, commissionPayerEntity: e.target.value })} placeholder="Legal entity name" />
              </div>
              <div>
                <Label>Payment Cadence *</Label>
                <Select value={newPlaybook.paymentCadence} onValueChange={(v) => setNewPlaybook({ ...newPlaybook, paymentCadence: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPFRONT">Upfront</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Report Formats (comma-separated)</Label>
                <Input value={newPlaybook.reportFormatsSupported} onChange={(e) => setNewPlaybook({ ...newPlaybook, reportFormatsSupported: e.target.value })} placeholder="xlsx,csv,pdf" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ops Contact Email</Label>
                  <Input value={newPlaybook.opsContact} onChange={(e) => setNewPlaybook({ ...newPlaybook, opsContact: e.target.value })} placeholder="ops@supplier.com" />
                </div>
                <div>
                  <Label>Finance Contact Email</Label>
                  <Input value={newPlaybook.financeContact} onChange={(e) => setNewPlaybook({ ...newPlaybook, financeContact: e.target.value })} placeholder="finance@supplier.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quote Response SLA (hours)</Label>
                  <Input type="number" value={newPlaybook.quoteResponseHours} onChange={(e) => setNewPlaybook({ ...newPlaybook, quoteResponseHours: e.target.value })} />
                </div>
                <div>
                  <Label>Payment SLA (days after invoice)</Label>
                  <Input type="number" value={newPlaybook.paymentDaysAfterInvoice} onChange={(e) => setNewPlaybook({ ...newPlaybook, paymentDaysAfterInvoice: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(newPlaybook)} disabled={createMutation.isPending || !isFormValid} data-testid="button-save-playbook">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version History Modal */}
        <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>View all versions of this supplier playbook</DialogDescription>
            </DialogHeader>
            {versionsError && (
              <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{(versionsError as Error).message}</span>
              </div>
            )}
            {versionsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Payment Cadence</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell><Badge variant="outline">v{v.version}</Badge></TableCell>
                        <TableCell>{getCadenceBadge(v.paymentCadence)}</TableCell>
                        <TableCell>{v.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="outline">Retired</Badge>}</TableCell>
                        <TableCell>{new Date(v.updatedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
