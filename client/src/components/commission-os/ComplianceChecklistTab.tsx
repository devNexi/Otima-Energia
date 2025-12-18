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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, CheckCircle, ShieldCheck, AlertCircle, Phone, Mail, MessageSquare, FileText, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

interface ComplianceRequirement {
  id: number;
  transitionFrom: string;
  transitionTo: string;
  requirementKey: string;
  requirementLabel: string;
  description?: string;
  isRequired: boolean;
  requiredForRoles: string[];
  sortOrder: number;
  isActive: boolean;
}

interface DealChecklistItem {
  id: number;
  dealId: string;
  requirementId: number;
  completedAt: string;
  completedBy: string;
  response?: string;
  confirmationMethod?: string;
  confidenceLevel?: string;
  communicationLogId?: number;
  notes?: string;
}

interface CommunicationLog {
  id: number;
  dealId?: string;
  clientId?: number;
  leadId?: number;
  channel: string;
  direction: string;
  subject?: string;
  summary: string;
  participants?: string;
  occurredAt: string;
  loggedBy: string;
}

interface ComplianceChecklistTabProps {
  dealId: string;
  currentState: string;
  targetState?: string;
  onComplianceComplete?: () => void;
}

const CONFIRMATION_METHODS = [
  { value: "CALL", label: "Phone Call", icon: Phone },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { value: "DOCUMENT", label: "Document", icon: FileText },
  { value: "MEETING", label: "In-Person Meeting", icon: Users },
];

const CONFIDENCE_LEVELS = [
  { value: "LOW", label: "Low", color: "bg-red-100 text-red-800" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "HIGH", label: "High", color: "bg-green-100 text-green-800" },
];

export function ComplianceChecklistTab({ dealId, currentState, targetState, onComplianceComplete }: ComplianceChecklistTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId, user } = useAuth();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);

  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const { data: requirementsData, isLoading: loadingRequirements } = useQuery({
    queryKey: ["/api/compliance-requirements", currentState, targetState, sessionId],
    queryFn: async () => {
      const url = targetState 
        ? `/api/compliance-requirements/${currentState}/${targetState}`
        : `/api/compliance-requirements`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch requirements");
      }
      return res.json();
    },
    enabled: !!sessionId,
  });

  const { data: checklistData, isLoading: loadingChecklist } = useQuery({
    queryKey: ["/api/deals", dealId, "checklist", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/checklist`, { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch checklist");
      }
      return res.json();
    },
    enabled: !!sessionId && !!dealId,
  });

  const { data: logsData } = useQuery({
    queryKey: ["/api/communication-logs", dealId, sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/communication-logs?dealId=${dealId}`, { headers: authHeaders });
      if (!res.ok) return { logs: [] };
      return res.json();
    },
    enabled: !!sessionId && !!dealId,
  });

  const [completionForm, setCompletionForm] = useState({
    response: "",
    confirmationMethod: "CALL",
    confidenceLevel: "HIGH",
    communicationLogId: "",
    notes: "",
  });

  const [logForm, setLogForm] = useState({
    channel: "CALL",
    direction: "OUTBOUND",
    subject: "",
    summary: "",
    participants: "",
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { requirementId: number } & typeof completionForm) => {
      const payload: Record<string, any> = {
        requirementId: data.requirementId,
        completedBy: user?.username || "system",
        completedAt: new Date().toISOString(),
        response: data.response,
        confirmationMethod: data.confirmationMethod,
        confidenceLevel: data.confidenceLevel,
      };
      if (data.communicationLogId) payload.communicationLogId = parseInt(data.communicationLogId);
      if (data.notes) payload.notes = data.notes;

      const res = await fetch(`/api/deals/${dealId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete requirement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "checklist"] });
      setShowCompleteModal(false);
      setSelectedRequirement(null);
      setCompletionForm({
        response: "",
        confirmationMethod: "CALL",
        confidenceLevel: "HIGH",
        communicationLogId: "",
        notes: "",
      });
      toast({ title: "Requirement completed", description: "The compliance item has been marked complete." });
      
      const newCompletedCount = (checklistData?.items?.length || 0) + 1;
      const totalRequired = requirements.filter((r: ComplianceRequirement) => r.isRequired).length;
      if (newCompletedCount >= totalRequired && onComplianceComplete) {
        onComplianceComplete();
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const logMutation = useMutation({
    mutationFn: async (data: typeof logForm) => {
      const payload = {
        dealId,
        channel: data.channel,
        direction: data.direction,
        subject: data.subject || undefined,
        summary: data.summary,
        participants: data.participants || undefined,
        occurredAt: new Date().toISOString(),
        loggedBy: user?.username || "system",
      };

      const res = await fetch("/api/communication-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create log");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-logs", dealId] });
      setShowLogModal(false);
      setLogForm({
        channel: "CALL",
        direction: "OUTBOUND",
        subject: "",
        summary: "",
        participants: "",
      });
      toast({ title: "Communication logged", description: "The interaction has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const requirements: ComplianceRequirement[] = requirementsData?.requirements || [];
  const completedItems: DealChecklistItem[] = checklistData?.items || [];
  const logs: CommunicationLog[] = logsData?.logs || [];
  
  const completedRequirementIds = new Set(completedItems.map(item => item.requirementId));
  const requiredCount = requirements.filter(r => r.isRequired).length;
  const completedCount = requirements.filter(r => completedRequirementIds.has(r.id)).length;
  const allComplete = completedCount >= requiredCount;

  const isLoading = loadingRequirements || loadingChecklist;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="compliance-checklist">
      <Card className={allComplete ? "border-green-200" : "border-orange-200"}>
        <CardHeader className={allComplete ? "bg-green-50" : "bg-orange-50"}>
          <CardTitle className={`flex items-center gap-2 ${allComplete ? "text-green-800" : "text-orange-800"}`}>
            <ShieldCheck className="w-5 h-5" />
            Compliance Checklist
            {targetState && (
              <Badge variant="outline" className="ml-2">
                {currentState} → {targetState}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className={allComplete ? "text-green-600" : "text-orange-600"}>
            {allComplete 
              ? "All compliance requirements have been met. Ready to proceed."
              : `${completedCount} of ${requiredCount} required items completed`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${allComplete ? "bg-green-500" : "bg-orange-500"}`}
                  style={{ width: `${requiredCount > 0 ? (completedCount / requiredCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                {completedCount}/{requiredCount} required
              </span>
            </div>
            <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-log-communication">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Communication
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Communication</DialogTitle>
                  <DialogDescription>
                    Record a call, email, or message as evidence for compliance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select value={logForm.channel} onValueChange={(v) => setLogForm(p => ({ ...p, channel: v }))}>
                        <SelectTrigger data-testid="select-log-channel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CALL">Phone Call</SelectItem>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                          <SelectItem value="MEETING">Meeting</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Direction</Label>
                      <Select value={logForm.direction} onValueChange={(v) => setLogForm(p => ({ ...p, direction: v }))}>
                        <SelectTrigger data-testid="select-log-direction">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INBOUND">Inbound</SelectItem>
                          <SelectItem value="OUTBOUND">Outbound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input 
                      value={logForm.subject}
                      onChange={(e) => setLogForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Brief subject line"
                      data-testid="input-log-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Summary *</Label>
                    <Textarea 
                      value={logForm.summary}
                      onChange={(e) => setLogForm(p => ({ ...p, summary: e.target.value }))}
                      placeholder="Describe what was discussed or communicated..."
                      rows={4}
                      data-testid="input-log-summary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Participants</Label>
                    <Input 
                      value={logForm.participants}
                      onChange={(e) => setLogForm(p => ({ ...p, participants: e.target.value }))}
                      placeholder="Names of people involved"
                      data-testid="input-log-participants"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowLogModal(false)}>Cancel</Button>
                  <Button 
                    onClick={() => logMutation.mutate(logForm)}
                    disabled={!logForm.summary || logMutation.isPending}
                    data-testid="button-save-log"
                  >
                    {logMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Log
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((req) => {
                const completed = completedItems.find(item => item.requirementId === req.id);
                const isComplete = !!completed;

                return (
                  <TableRow key={req.id} data-testid={`row-requirement-${req.id}`}>
                    <TableCell>
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${req.isRequired ? "border-orange-400" : "border-gray-300"}`} />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {req.requirementLabel}
                          {req.isRequired && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              Required
                            </Badge>
                          )}
                        </div>
                        {req.description && (
                          <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {completed?.confirmationMethod && (
                        <Badge variant="outline">
                          {CONFIRMATION_METHODS.find(m => m.value === completed.confirmationMethod)?.label || completed.confirmationMethod}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {completed?.confidenceLevel && (
                        <Badge className={CONFIDENCE_LEVELS.find(l => l.value === completed.confidenceLevel)?.color || "bg-gray-100"}>
                          {completed.confidenceLevel}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {completed && (
                        <div className="text-sm">
                          <div>{completed.completedBy}</div>
                          <div className="text-gray-500">
                            {format(new Date(completed.completedAt), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isComplete && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequirement(req);
                            setShowCompleteModal(true);
                          }}
                          data-testid={`button-complete-${req.id}`}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {requirements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No compliance requirements for this transition</p>
            </div>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication Log</CardTitle>
            <CardDescription>Recent communications related to this deal</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Logged By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 5).map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell>{format(new Date(log.occurredAt), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.channel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.direction === 'INBOUND' ? 'secondary' : 'outline'}>
                        {log.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.summary}</TableCell>
                    <TableCell>{log.loggedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Requirement</DialogTitle>
            <DialogDescription>
              {selectedRequirement?.requirementLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Response / Confirmation Details *</Label>
              <Textarea 
                value={completionForm.response}
                onChange={(e) => setCompletionForm(p => ({ ...p, response: e.target.value }))}
                placeholder="Describe how this requirement was verified..."
                rows={3}
                data-testid="input-completion-response"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Confirmation Method</Label>
                <Select 
                  value={completionForm.confirmationMethod} 
                  onValueChange={(v) => setCompletionForm(p => ({ ...p, confirmationMethod: v }))}
                >
                  <SelectTrigger data-testid="select-confirmation-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIRMATION_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select 
                  value={completionForm.confidenceLevel} 
                  onValueChange={(v) => setCompletionForm(p => ({ ...p, confidenceLevel: v }))}
                >
                  <SelectTrigger data-testid="select-confidence-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENCE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {logs.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Communication Log (Optional)</Label>
                <Select 
                  value={completionForm.communicationLogId} 
                  onValueChange={(v) => setCompletionForm(p => ({ ...p, communicationLogId: v }))}
                >
                  <SelectTrigger data-testid="select-linked-log">
                    <SelectValue placeholder="Select evidence..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {logs.map(log => (
                      <SelectItem key={log.id} value={log.id.toString()}>
                        {format(new Date(log.occurredAt), 'MMM d')} - {log.channel}: {log.summary.substring(0, 40)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea 
                value={completionForm.notes}
                onChange={(e) => setCompletionForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional context..."
                rows={2}
                data-testid="input-completion-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button 
              onClick={() => selectedRequirement && completeMutation.mutate({
                requirementId: selectedRequirement.id,
                ...completionForm
              })}
              disabled={!completionForm.response || completeMutation.isPending}
              data-testid="button-submit-completion"
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
