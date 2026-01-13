import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, AlertTriangle, Clock, XCircle, CheckCircle, Briefcase, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface DealCase {
  id: number;
  dealId: string;
  caseType: string;
  severity: string;
  status: string;
  ownerUserId?: string;
  nextActionDate?: string;
  slaDueDate?: string;
  rootCause?: string;
  resolutionSummary?: string;
  createdAt: string;
}

interface DealCasesTabProps {
  dealId?: string;
}

export function DealCasesTab({ dealId }: DealCasesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DealCase | null>(null);

  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const isAllCasesMode = !dealId;

  const { data: casesData, isLoading, error: casesError } = useQuery({
    queryKey: isAllCasesMode ? ["/api/cases", sessionId] : ["/api/deals", dealId, "cases", sessionId],
    queryFn: async () => {
      const url = isAllCasesMode ? "/api/cases" : `/api/deals/${dealId}/cases`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch cases");
      }
      return res.json();
    },
    enabled: !!sessionId,
  });

  const [newCase, setNewCase] = useState({
    caseType: "STUCK",
    severity: "MED",
    rootCause: "",
    nextActionDate: "",
    slaDueDate: "",
  });

  const [convertReason, setConvertReason] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCase) => {
      const userId = user?.id || "system";
      const payload: Record<string, any> = {
        caseType: data.caseType,
        severity: data.severity,
        status: "OPEN",
        ownerUserId: userId,
      };
      if (data.rootCause) payload.rootCause = data.rootCause;
      if (data.nextActionDate) payload.nextActionDate = data.nextActionDate;
      if (data.slaDueDate) payload.slaDueDate = data.slaDueDate;

      const res = await fetch(`/api/deals/${dealId}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "cases"] });
      setShowCreateModal(false);
      setNewCase({ caseType: "STUCK", severity: "MED", rootCause: "", nextActionDate: "", slaDueDate: "" });
      toast({ title: "Case created", description: "New case has been opened." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ caseId, data }: { caseId: number; data: Partial<DealCase> }) => {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "cases"] });
      toast({ title: "Case updated", description: "Case status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async ({ caseId, reason }: { caseId: number; reason: string }) => {
      const userId = user?.id || "system";
      const res = await fetch(`/api/cases/${caseId}/convert-to-lost`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ triggeredBy: userId, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to convert deal to lost");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setShowConvertModal(false);
      setSelectedCase(null);
      setConvertReason("");
      toast({ title: "Deal marked as LOST", description: "The deal has been transitioned to LOST status." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cases: DealCase[] = casesData?.cases || [];

  const getCaseTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      RETURNED: "bg-orange-100 text-orange-800",
      STUCK: "bg-yellow-100 text-yellow-800",
      CREDIT_REJECTED: "bg-red-100 text-red-800",
      METERING_DELAY: "bg-blue-100 text-blue-800",
      DOCS_PENDING: "bg-purple-100 text-purple-800",
      DOCUMENTATION_INCOMPLETE: "bg-purple-100 text-purple-800",
      CLIENT_WITHDREW: "bg-gray-100 text-gray-800",
      CLIENT_SWITCHED_SUPPLIER: "bg-gray-100 text-gray-800",
      SUPPLIER_WITHDREW: "bg-gray-100 text-gray-800",
      SUPPLIER_BACKED_OUT: "bg-gray-100 text-gray-800",
      CCEE_REGISTRATION_FAILED: "bg-red-100 text-red-800",
      REGULATORY_BLOCK: "bg-red-100 text-red-800",
      PAYMENT_GUARANTEE_FAILED: "bg-red-100 text-red-800",
      START_DATE_DELAYED: "bg-blue-100 text-blue-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type.replace(/_/g, " ")}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case "MED":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case "CONVERTED_TO_LOST":
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Lost</Badge>;
      case "ESCALATED":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Escalated</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>;
    }
  };

  const getSlaDaysRemaining = (slaDueDate?: string) => {
    if (!slaDueDate) return null;
    const due = new Date(slaDueDate);
    const now = new Date();
    const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return <span className="text-red-600 font-medium">{Math.abs(days)}d overdue</span>;
    if (days === 0) return <span className="text-orange-600 font-medium">Due today</span>;
    if (days <= 3) return <span className="text-orange-600 font-medium">{days}d remaining</span>;
    return <span className="text-gray-600">{days}d remaining</span>;
  };

  const isFormValid = newCase.caseType && newCase.severity;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {isAllCasesMode ? "All Cases" : "Deal Cases"}
            </CardTitle>
            <CardDescription>
              {isAllCasesMode ? "View and manage all open cases across deals" : "Track issues and blockers for this deal"}
            </CardDescription>
          </div>
          {!isAllCasesMode && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-open-case">
                <Plus className="w-4 h-4 mr-2" />
                Open Case
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Open New Case</DialogTitle>
                <DialogDescription>Create a case to track an issue with this deal</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Case Type *</Label>
                  <Select value={newCase.caseType} onValueChange={(v) => setNewCase({ ...newCase, caseType: v })}>
                    <SelectTrigger data-testid="select-case-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RETURNED">Returned</SelectItem>
                      <SelectItem value="STUCK">Stuck</SelectItem>
                      <SelectItem value="CREDIT_REJECTED">Credit Rejected</SelectItem>
                      <SelectItem value="METERING_DELAY">Metering Delay</SelectItem>
                      <SelectItem value="DOCS_PENDING">Docs Pending</SelectItem>
                      <SelectItem value="DOCUMENTATION_INCOMPLETE">Documentation Incomplete</SelectItem>
                      <SelectItem value="CLIENT_WITHDREW">Client Withdrew</SelectItem>
                      <SelectItem value="CLIENT_SWITCHED_SUPPLIER">Client Switched Supplier</SelectItem>
                      <SelectItem value="SUPPLIER_WITHDREW">Supplier Withdrew</SelectItem>
                      <SelectItem value="SUPPLIER_BACKED_OUT">Supplier Backed Out</SelectItem>
                      <SelectItem value="CCEE_REGISTRATION_FAILED">CCEE Registration Failed</SelectItem>
                      <SelectItem value="REGULATORY_BLOCK">Regulatory Block</SelectItem>
                      <SelectItem value="PAYMENT_GUARANTEE_FAILED">Payment Guarantee Failed</SelectItem>
                      <SelectItem value="START_DATE_DELAYED">Start Date Delayed</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity *</Label>
                  <Select value={newCase.severity} onValueChange={(v) => setNewCase({ ...newCase, severity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MED">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Root Cause</Label>
                  <Textarea value={newCase.rootCause} onChange={(e) => setNewCase({ ...newCase, rootCause: e.target.value })} placeholder="Describe the issue..." data-testid="input-root-cause" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Next Action Date</Label>
                    <Input type="date" value={newCase.nextActionDate} onChange={(e) => setNewCase({ ...newCase, nextActionDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>SLA Due Date</Label>
                    <Input type="date" value={newCase.slaDueDate} onChange={(e) => setNewCase({ ...newCase, slaDueDate: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(newCase)} disabled={createMutation.isPending || !isFormValid} data-testid="button-save-case">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Case
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {casesError && (
          <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{(casesError as Error).message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No cases for this deal.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Root Cause</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id} data-testid={`case-row-${c.id}`}>
                  <TableCell>{getCaseTypeBadge(c.caseType)}</TableCell>
                  <TableCell>{getSeverityBadge(c.severity)}</TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell>{getSlaDaysRemaining(c.slaDueDate)}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.rootCause || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {c.status === "OPEN" && (
                        <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ caseId: c.id, data: { status: "IN_PROGRESS" } })} disabled={updateMutation.isPending} data-testid={`button-progress-${c.id}`}>
                          {updateMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          Start
                        </Button>
                      )}
                      {c.status === "IN_PROGRESS" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ caseId: c.id, data: { status: "RESOLVED" } })} disabled={updateMutation.isPending} data-testid={`button-resolve-${c.id}`}>
                            Resolve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedCase(c); setShowConvertModal(true); }} data-testid={`button-convert-${c.id}`}>
                            → LOST
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert to LOST</DialogTitle>
              <DialogDescription>This will mark the deal as LOST. This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Reason for loss *</Label>
              <Textarea value={convertReason} onChange={(e) => setConvertReason(e.target.value)} placeholder="Explain why this deal is being marked as lost..." data-testid="input-lost-reason" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConvertModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => selectedCase && convertMutation.mutate({ caseId: selectedCase.id, reason: convertReason })} disabled={!convertReason || convertMutation.isPending} data-testid="button-confirm-lost">
                {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Mark as LOST
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
