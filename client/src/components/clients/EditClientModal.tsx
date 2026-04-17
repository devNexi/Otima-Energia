import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

interface TrackWithPendingType {
  id: number;
  type: string;
  status: string;
  dealId: string;
  pendingType?: string;
}

interface DealWithTracks {
  id: string;
  title?: string;
  clientName?: string;
  tracks: TrackWithPendingType[];
}

interface EditClientModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
}

const CLIENT_STATUS_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "awaiting_quote", label: "Aguardando Proposta" },
  { value: "negotiating", label: "Negociando" },
  { value: "active", label: "Ativo" },
  { value: "closed", label: "Encerrado" },
  { value: "lost", label: "Perdido" },
];

const REGION_OPTIONS = [
  { value: "Sudeste", label: "Sudeste" },
  { value: "Sul", label: "Sul" },
  { value: "Nordeste", label: "Nordeste" },
  { value: "Norte", label: "Norte" },
  { value: "Centro-Oeste", label: "Centro-Oeste" },
];

const TRACK_TYPE_DISPLAY: Record<string, string> = {
  GDL: "GD",
  ACL: "ACL",
};

const TRACK_TYPE_COLORS: Record<string, string> = {
  GDL: "bg-green-100 text-green-800 border-green-300",
  ACL: "bg-blue-100 text-blue-800 border-blue-300",
};

function validateCnpj(cnpj: string): string | null {
  if (!cnpj) return null;
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return "CNPJ must have 14 digits";
  return null;
}

export function EditClientModal({ client, open, onClose }: EditClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    companyName: client.companyName || "",
    cnpj: client.cnpj || "",
    email: client.email || "",
    phone: client.phone || "",
    contactPerson: client.contactPerson || "",
    status: client.status || "prospect",
    currentSupplier: client.currentSupplier || "",
    ucCode: client.ucCode || "",
    segment: client.segment || "",
    region: client.region || "",
    salesOwner: client.salesOwner || "",
  });

  const [dealsWithTracks, setDealsWithTracks] = useState<DealWithTracks[]>([]);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [trackChanges, setTrackChanges] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        companyName: client.companyName || "",
        cnpj: client.cnpj || "",
        email: client.email || "",
        phone: client.phone || "",
        contactPerson: client.contactPerson || "",
        status: client.status || "prospect",
        currentSupplier: client.currentSupplier || "",
        ucCode: client.ucCode || "",
        segment: client.segment || "",
        region: client.region || "",
        salesOwner: client.salesOwner || "",
      });
      setTrackChanges({});
      setCnpjError(null);
    }
  }, [open, client]);

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: [`/api/clients/${client.id}/deals`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${client.id}/deals`);
      return res.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (!dealsData?.deals) return;
    const fetchTracks = async () => {
      const results: DealWithTracks[] = [];
      for (const deal of dealsData.deals) {
        try {
          const res = await apiRequest("GET", `/api/deals/${deal.id}/tracks`);
          const data = await res.json();
          const tracks: TrackWithPendingType[] = (data.tracks || data || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            status: t.status,
            dealId: t.dealId || deal.id,
          }));
          if (tracks.length > 0) {
            results.push({ id: deal.id, title: deal.title || deal.id, tracks });
          }
        } catch {
          // skip deals where tracks can't be fetched
        }
      }
      setDealsWithTracks(results);
    };
    fetchTracks();
  }, [dealsData]);

  const handleCnpjChange = (value: string) => {
    setForm(f => ({ ...f, cnpj: value }));
    if (value) setCnpjError(validateCnpj(value));
    else setCnpjError(null);
  };

  const handleTrackTypeChange = (trackId: number, newType: string) => {
    setTrackChanges(prev => ({ ...prev, [trackId]: newType }));
  };

  const hasPendingTrackChanges = Object.keys(trackChanges).length > 0;

  const handleSave = async () => {
    if (cnpjError) return;
    if (!form.companyName.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    let clientSaved = false;
    let trackErrors: string[] = [];

    try {
      const payload: Record<string, any> = {
        companyName: form.companyName.trim(),
        cnpj: form.cnpj.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        contactPerson: form.contactPerson.trim() || null,
        status: form.status,
        currentSupplier: form.currentSupplier.trim() || null,
        ucCode: form.ucCode.trim() || null,
        segment: form.segment || null,
        region: form.region || null,
        salesOwner: form.salesOwner.trim() || null,
      };

      const res = await apiRequest("PATCH", `/api/clients/${client.id}`, payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update client");
      }
      clientSaved = true;

      for (const [trackIdStr, newType] of Object.entries(trackChanges)) {
        const trackId = parseInt(trackIdStr);
        try {
          const tr = await apiRequest("PATCH", `/api/tracks/${trackId}/type`, {
            newType,
            reason: "Manual correction via Edit Client",
          });
          if (!tr.ok) {
            const err = await tr.json().catch(() => ({}));
            trackErrors.push(`Track ${trackId}: ${err.error || "update failed"}`);
          }
        } catch (e: any) {
          trackErrors.push(`Track ${trackId}: ${e.message}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}/deals`] });

      if (trackErrors.length > 0) {
        toast({
          title: "Client saved — some track updates failed",
          description: trackErrors.join("; "),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Client updated",
          description: hasPendingTrackChanges
            ? `${form.companyName} updated. Track lane(s) changed successfully.`
            : `${form.companyName} updated successfully.`,
        });
        onClose();
      }
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e.message || "Could not save client changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isSaving) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client details. Changes are saved immediately and reflected across the portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* ── Identity ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="edit-companyName">Company Name (Razão Social) *</Label>
                <Input
                  id="edit-companyName"
                  value={form.companyName}
                  onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                  data-testid="input-edit-company-name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-cnpj">CNPJ</Label>
                <Input
                  id="edit-cnpj"
                  value={form.cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00000000000000"
                  data-testid="input-edit-cnpj"
                  className={`mt-1 ${cnpjError ? "border-red-400" : ""}`}
                />
                {cnpjError && <p className="text-xs text-red-500 mt-1">{cnpjError}</p>}
              </div>
              <div>
                <Label htmlFor="edit-ucCode">UC Code</Label>
                <Input
                  id="edit-ucCode"
                  value={form.ucCode}
                  onChange={(e) => setForm(f => ({ ...f, ucCode: e.target.value }))}
                  data-testid="input-edit-uc-code"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Contact ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-contactPerson">Contact Person</Label>
                <Input
                  id="edit-contactPerson"
                  value={form.contactPerson}
                  onChange={(e) => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                  data-testid="input-edit-contact-person"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  data-testid="input-edit-email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  data-testid="input-edit-phone"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-salesOwner">Sales Owner</Label>
                <Input
                  id="edit-salesOwner"
                  value={form.salesOwner}
                  onChange={(e) => setForm(f => ({ ...f, salesOwner: e.target.value }))}
                  data-testid="input-edit-sales-owner"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Classification ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Classification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="edit-status" className="mt-1" data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUS_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-region">Region</Label>
                <Select value={form.region || ""} onValueChange={(v) => setForm(f => ({ ...f, region: v }))}>
                  <SelectTrigger id="edit-region" className="mt-1" data-testid="select-edit-region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-segment">Segment</Label>
                <Input
                  id="edit-segment"
                  value={form.segment}
                  onChange={(e) => setForm(f => ({ ...f, segment: e.target.value }))}
                  placeholder="e.g. SME, Industrial"
                  data-testid="input-edit-segment"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-currentSupplier">Current Supplier / Distributor</Label>
                <Input
                  id="edit-currentSupplier"
                  value={form.currentSupplier}
                  onChange={(e) => setForm(f => ({ ...f, currentSupplier: e.target.value }))}
                  data-testid="input-edit-current-supplier"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Deal Track Lanes ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deal Track Lanes</h3>
              {dealsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>

            {!dealsLoading && dealsWithTracks.length === 0 && (
              <p className="text-sm text-muted-foreground">No deals with active tracks found for this client.</p>
            )}

            {hasPendingTrackChanges && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Changing a track lane updates downstream eligibility, RFQ routing, and comparison logic. Review carefully before saving.
                </AlertDescription>
              </Alert>
            )}

            {dealsWithTracks.map(deal => (
              <div key={deal.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Deal {deal.id}</p>
                {deal.tracks.map(track => {
                  const pendingType = trackChanges[track.id];
                  const displayType = pendingType || track.type;
                  const isChanged = !!pendingType && pendingType !== track.type;

                  return (
                    <div key={track.id} className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground w-20">Track #{track.id}</span>
                      <Badge
                        className={`text-xs border ${TRACK_TYPE_COLORS[displayType] || "bg-gray-100 text-gray-800"}`}
                        data-testid={`badge-track-type-${track.id}`}
                      >
                        {TRACK_TYPE_DISPLAY[displayType] || displayType}
                        {isChanged && " ←"}
                      </Badge>
                      {isChanged && (
                        <span className="text-xs text-muted-foreground line-through">
                          {TRACK_TYPE_DISPLAY[track.type] || track.type}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">{track.status}</Badge>
                      <Select
                        value={pendingType || track.type}
                        onValueChange={(v) => handleTrackTypeChange(track.id, v)}
                      >
                        <SelectTrigger
                          className="h-7 text-xs w-28"
                          data-testid={`select-track-lane-${track.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GDL">GD</SelectItem>
                          <SelectItem value="ACL">ACL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              data-testid="button-edit-client-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !!cnpjError || !form.companyName.trim()}
              data-testid="button-edit-client-save"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
