import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2, FileText, Filter, RefreshCw, Clock, Download, ShieldCheck, Save, Trash2, ExternalLink, Copy, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AuditLogEntry {
  id: number;
  actor: string;
  actorRole?: string;
  actorIp?: string;
  userAgent?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  clientId?: number;
  dealId?: string;
  eventHash?: string;
  detailsJson?: Record<string, any>;
  timestamp: string;
}

interface SavedFilter {
  id: number;
  name: string;
  description?: string;
  filtersJson: Record<string, any>;
}

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "AUTH_", label: "Authentication" },
  { value: "DEAL_", label: "Deal Lifecycle" },
  { value: "CLIENT_", label: "Client" },
  { value: "QUOTE_", label: "Quotes" },
  { value: "COMMISSION_", label: "Commission" },
  { value: "USAGE_", label: "Usage" },
  { value: "PLAYBOOK_", label: "Playbooks" },
  { value: "RECONCILIATION_", label: "Reconciliation" },
  { value: "CHECKLIST_", label: "Compliance" },
  { value: "CASE_", label: "Cases" },
];

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "deal", label: "Deal" },
  { value: "client", label: "Client" },
  { value: "lead", label: "Lead" },
  { value: "contract", label: "Contract" },
  { value: "quote", label: "Quote" },
  { value: "commission", label: "Commission" },
  { value: "usage", label: "Usage" },
  { value: "playbook", label: "Playbook" },
  { value: "reconciliation", label: "Reconciliation" },
  { value: "case", label: "Case" },
];

export function AuditTrailTab() {
  const { sessionId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const [filters, setFilters] = useState({
    actor: "",
    action: "all",
    entityType: "all",
    entityId: "",
    clientId: "",
    dealId: "",
    dateFrom: "",
    dateTo: "",
  });
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [saveFilterName, setSaveFilterName] = useState("");
  const [saveFilterDesc, setSaveFilterDesc] = useState("");
  const [copiedHash, setCopiedHash] = useState<number | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.actor) params.append("actor", filters.actor);
    if (filters.action !== "all") params.append("action", filters.action);
    if (filters.entityType !== "all") params.append("entityType", filters.entityType);
    if (filters.entityId) params.append("entityId", filters.entityId);
    if (filters.clientId) params.append("clientId", filters.clientId);
    if (filters.dealId) params.append("dealId", filters.dealId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    return params.toString();
  };

  const { data: logsData, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/audit-trail", filters, page, pageSize, sessionId],
    queryFn: async () => {
      const queryString = buildQueryString();
      const res = await fetch(`/api/audit-trail?${queryString}`, { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch audit logs");
      }
      return res.json();
    },
    enabled: !!sessionId,
  });

  const { data: savedFiltersData } = useQuery({
    queryKey: ["/api/audit-filters", sessionId],
    queryFn: async () => {
      const res = await fetch("/api/audit-filters", { headers: authHeaders });
      if (!res.ok) return { filters: [] };
      return res.json();
    },
    enabled: !!sessionId,
  });

  const { data: verifyData, isLoading: verifying, refetch: runVerify } = useQuery({
    queryKey: ["/api/audit-trail/verify", filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      const res = await fetch(`/api/audit-trail/verify?${params}`, { headers: authHeaders });
      if (!res.ok) throw new Error("Verification failed");
      return res.json();
    },
    enabled: false,
  });

  const saveFilterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/audit-filters", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveFilterName, description: saveFilterDesc, filtersJson: filters }),
      });
      if (!res.ok) throw new Error("Failed to save filter");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audit-filters"] });
      toast({ title: "Filter saved" });
      setSaveFilterName("");
      setSaveFilterDesc("");
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/audit-filters/${id}`, { method: "DELETE", headers: authHeaders });
      if (!res.ok) throw new Error("Failed to delete filter");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audit-filters"] });
      toast({ title: "Filter deleted" });
    },
  });

  const logs: AuditLogEntry[] = logsData?.logs || [];
  const totalCount = logsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const savedFilters: SavedFilter[] = savedFiltersData?.filters || [];

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      AUTH_: "bg-gray-100 text-gray-800",
      DEAL_: "bg-blue-100 text-blue-800",
      CLIENT_: "bg-green-100 text-green-800",
      QUOTE_: "bg-purple-100 text-purple-800",
      COMMISSION_: "bg-yellow-100 text-yellow-800",
      USAGE_: "bg-cyan-100 text-cyan-800",
      PLAYBOOK_: "bg-indigo-100 text-indigo-800",
      RECONCILIATION_: "bg-orange-100 text-orange-800",
      CHECKLIST_: "bg-pink-100 text-pink-800",
      CASE_: "bg-red-100 text-red-800",
    };
    const prefix = Object.keys(colors).find(p => action.startsWith(p)) || "";
    return <Badge className={colors[prefix] || "bg-gray-100 text-gray-800"}>{action.replace(/_/g, " ")}</Badge>;
  };

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details) return "-";
    const keys = Object.keys(details).slice(0, 3);
    return keys.map(k => `${k}: ${JSON.stringify(details[k])}`).join(", ");
  };

  const clearFilters = () => {
    setFilters({ actor: "", action: "all", entityType: "all", entityId: "", clientId: "", dealId: "", dateFrom: "", dateTo: "" });
    setPage(1);
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setFilters({ ...filters, ...filter.filtersJson });
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.actor) params.append("actor", filters.actor);
    if (filters.action !== "all") params.append("action", filters.action);
    if (filters.entityType !== "all") params.append("entityType", filters.entityType);
    if (filters.entityId) params.append("entityId", filters.entityId);
    if (filters.clientId) params.append("clientId", filters.clientId);
    if (filters.dealId) params.append("dealId", filters.dealId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    window.open(`/api/audit-trail/export?${params}&x-session-id=${sessionId}`, "_blank");
  };

  const copyHash = (hash: string, id: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getEntityLink = (entityType: string | undefined, entityId: number | undefined, dealId: string | undefined, clientId: number | undefined) => {
    if (entityType === "deal" && entityId) {
      return { label: `Deal #${entityId}`, action: () => {} }; 
    }
    if (dealId) {
      return { label: `Deal ${dealId.slice(0, 8)}`, action: () => {} };
    }
    if (entityType === "client" && entityId) {
      return { label: `Client #${entityId}`, action: () => {} };
    }
    if (clientId) {
      return { label: `Client #${clientId}`, action: () => setFilters({ ...filters, clientId: clientId.toString() }) };
    }
    if (entityType && entityId) {
      return { label: `${entityType} #${entityId}`, action: () => {} };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Compliance-grade activity logs with hash chain verification
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => runVerify()} disabled={verifying} data-testid="button-verify-chain">
                <ShieldCheck className="w-4 h-4 mr-2" />
                {verifying ? "Verifying..." : "Verify Chain"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-csv">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-logs">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {verifyData && (
            <div className={`p-4 rounded-lg mb-4 ${verifyData.verified ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${verifyData.verified ? "text-green-600" : "text-red-600"}`} />
                <span className={verifyData.verified ? "text-green-800" : "text-red-800"}>
                  {verifyData.message} ({verifyData.checkedEvents} events checked)
                </span>
              </div>
            </div>
          )}

          {savedFilters.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="text-sm text-gray-500 py-1">Saved Views:</span>
              {savedFilters.map(sf => (
                <div key={sf.id} className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => loadSavedFilter(sf)} data-testid={`button-load-filter-${sf.id}`}>
                    {sf.name}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteFilterMutation.mutate(sf.id)} data-testid={`button-delete-filter-${sf.id}`}>
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs">User</Label>
              <Input placeholder="Username" value={filters.actor} onChange={(e) => setFilters({ ...filters, actor: e.target.value })} data-testid="input-filter-actor" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Action</Label>
              <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
                <SelectTrigger data-testid="select-filter-action" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Entity</Label>
              <Select value={filters.entityType} onValueChange={(v) => setFilters({ ...filters, entityType: v })}>
                <SelectTrigger data-testid="select-filter-entity" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Entity ID</Label>
              <Input placeholder="ID" value={filters.entityId} onChange={(e) => setFilters({ ...filters, entityId: e.target.value })} data-testid="input-filter-entity-id" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Client ID</Label>
              <Input placeholder="Client" value={filters.clientId} onChange={(e) => setFilters({ ...filters, clientId: e.target.value })} data-testid="input-filter-client-id" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Deal ID</Label>
              <Input placeholder="Deal" value={filters.dealId} onChange={(e) => setFilters({ ...filters, dealId: e.target.value })} data-testid="input-filter-deal-id" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} data-testid="input-filter-date-from" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} data-testid="input-filter-date-to" className="h-8" />
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-save-filter">
                  <Save className="w-4 h-4 mr-2" />
                  Save Current Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Filter Preset</DialogTitle>
                  <DialogDescription>Save the current filter configuration for quick access</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={saveFilterName} onChange={(e) => setSaveFilterName(e.target.value)} placeholder="e.g., All Deal Transitions" data-testid="input-save-filter-name" />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Input value={saveFilterDesc} onChange={(e) => setSaveFilterDesc(e.target.value)} placeholder="Description" data-testid="input-save-filter-desc" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={() => saveFilterMutation.mutate()} disabled={!saveFilterName || saveFilterMutation.isPending} data-testid="button-confirm-save-filter">
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="text-sm text-gray-500">
              {totalCount.toLocaleString()} total entries
            </div>
          </div>

          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg mb-4">
              {(error as Error).message}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No audit log entries found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const entityLink = getEntityLink(log.entityType, log.entityId, log.dealId, log.clientId);
                    return (
                      <TableRow key={log.id} data-testid={`audit-row-${log.id}`}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div>{format(new Date(log.timestamp), "MMM d, yyyy")}</div>
                              <div className="text-xs text-gray-500">{format(new Date(log.timestamp), "HH:mm:ss")}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.actor}</div>
                          {log.actorRole && <div className="text-xs text-gray-500">{log.actorRole}</div>}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          {entityLink ? (
                            <Button variant="link" size="sm" className="p-0 h-auto" onClick={entityLink.action} data-testid={`link-entity-${log.id}`}>
                              {entityLink.label}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-gray-600">
                          {formatDetails(log.detailsJson)}
                        </TableCell>
                        <TableCell>
                          {log.eventHash ? (
                            <Button variant="ghost" size="sm" className="font-mono text-xs p-1 h-auto" onClick={() => copyHash(log.eventHash!, log.id)} data-testid={`button-copy-hash-${log.id}`}>
                              {copiedHash === log.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                              <span className="ml-1">{log.eventHash.slice(0, 8)}...</span>
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">Legacy</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} data-testid="button-prev-page">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="button-next-page">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
