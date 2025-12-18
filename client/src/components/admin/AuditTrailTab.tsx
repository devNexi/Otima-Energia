import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, FileText, Filter, RefreshCw, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

interface AuditLogEntry {
  id: number;
  actor: string;
  actorIp?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  detailsJson?: Record<string, any>;
  timestamp: string;
}

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "deal_transition", label: "Deal Transition" },
  { value: "checklist_complete", label: "Checklist Complete" },
  { value: "communication_log", label: "Communication Log" },
  { value: "commission_status", label: "Commission Status" },
  { value: "login", label: "Login" },
  { value: "create_client", label: "Create Client" },
  { value: "update_client", label: "Update Client" },
  { value: "create_deal", label: "Create Deal" },
  { value: "update_deal", label: "Update Deal" },
];

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "deal", label: "Deal" },
  { value: "client", label: "Client" },
  { value: "lead", label: "Lead" },
  { value: "contract", label: "Contract" },
  { value: "checklist", label: "Checklist" },
  { value: "communication", label: "Communication" },
  { value: "commission", label: "Commission" },
];

export function AuditTrailTab() {
  const { sessionId } = useAuth();
  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const [filters, setFilters] = useState({
    actor: "",
    action: "all",
    entityType: "all",
    entityId: "",
    dateFrom: "",
    dateTo: "",
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.actor) params.append("actor", filters.actor);
    if (filters.action !== "all") params.append("action", filters.action);
    if (filters.entityType !== "all") params.append("entityType", filters.entityType);
    if (filters.entityId) params.append("entityId", filters.entityId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    params.append("limit", "200");
    return params.toString();
  };

  const { data: logsData, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/audit-trail", filters, sessionId],
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

  const logs: AuditLogEntry[] = logsData?.logs || [];

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      deal_transition: "bg-blue-100 text-blue-800",
      checklist_complete: "bg-green-100 text-green-800",
      communication_log: "bg-purple-100 text-purple-800",
      commission_status: "bg-yellow-100 text-yellow-800",
      login: "bg-gray-100 text-gray-800",
      create_client: "bg-emerald-100 text-emerald-800",
      update_client: "bg-cyan-100 text-cyan-800",
      create_deal: "bg-indigo-100 text-indigo-800",
      update_deal: "bg-violet-100 text-violet-800",
    };
    return <Badge className={colors[action] || "bg-gray-100 text-gray-800"}>{action.replace(/_/g, " ")}</Badge>;
  };

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details) return "-";
    const keys = Object.keys(details).slice(0, 3);
    return keys.map(k => `${k}: ${JSON.stringify(details[k])}`).join(", ");
  };

  const clearFilters = () => {
    setFilters({
      actor: "",
      action: "all",
      entityType: "all",
      entityId: "",
      dateFrom: "",
      dateTo: "",
    });
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
                View and search system activity logs for compliance and debugging
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-logs">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label>User</Label>
              <Input
                placeholder="Username"
                value={filters.actor}
                onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                data-testid="input-filter-actor"
              />
            </div>
            <div>
              <Label>Action Type</Label>
              <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
                <SelectTrigger data-testid="select-filter-action">
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
              <Label>Entity Type</Label>
              <Select value={filters.entityType} onValueChange={(v) => setFilters({ ...filters, entityType: v })}>
                <SelectTrigger data-testid="select-filter-entity">
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
              <Label>Entity ID</Label>
              <Input
                placeholder="ID"
                value={filters.entityId}
                onChange={(e) => setFilters({ ...filters, entityId: e.target.value })}
                data-testid="input-filter-entity-id"
              />
            </div>
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                data-testid="input-filter-date-from"
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                data-testid="input-filter-date-to"
              />
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
                    <TableHead>Details</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} data-testid={`audit-row-${log.id}`}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.actor}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        {log.entityType ? (
                          <span>
                            <Badge variant="outline">{log.entityType}</Badge>
                            {log.entityId && <span className="ml-1">#{log.entityId}</span>}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {formatDetails(log.detailsJson)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.actorIp || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Showing {logs.length} entries
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
