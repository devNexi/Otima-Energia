import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, Clock, DollarSign, Truck, ShieldAlert, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format, formatDistanceToNow } from "date-fns";

interface Deal {
  id: string;
  clientId: number;
  status: string;
  internalOwner: string;
  client?: { companyName: string };
}

interface DealCase {
  id: number;
  dealId: string;
  caseType: string;
  severity: string;
  status: string;
  slaDueDate?: string;
  rootCause?: string;
}

interface CommissionEvent {
  id: number;
  dealId: string;
  eventType: string;
  amountBrl?: string;
  expectedDate?: string;
  status: string;
}

interface OpsTasks {
  dealsBlockedByCompliance: Array<{ deal: Deal; missingCount: number }>;
  openCasesBreachingSla: DealCase[];
  commissionEventsOverdue: CommissionEvent[];
  dealsWaitingOnSupplier: Deal[];
}

interface OpsDashboardTabProps {
  onNavigateToDeal?: (dealId: string) => void;
}

export function OpsDashboardTab({ onNavigateToDeal }: OpsDashboardTabProps) {
  const { sessionId } = useAuth();
  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  // Scroll to section when KPI tile is clicked
  const scrollToSection = (sectionId: string) => {
    const sectionIds: Record<string, string> = {
      'blocked': 'section-blocked',
      'sla': 'section-sla',
      'overdue': 'section-overdue',
      'waiting': 'section-waiting'
    };
    const element = document.getElementById(sectionIds[sectionId]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { data: tasksData, isLoading, error } = useQuery<{ success: boolean } & OpsTasks>({
    queryKey: ["/api/ops/tasks/today", sessionId],
    queryFn: async () => {
      const res = await fetch("/api/ops/tasks/today", { headers: authHeaders });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch tasks");
      }
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: 60000,
  });

  const severityColors: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-800 border-blue-200",
    MED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    HIGH: "bg-red-100 text-red-800 border-red-200",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">Failed to load dashboard: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  const blocked = tasksData?.dealsBlockedByCompliance || [];
  const slaBreach = tasksData?.openCasesBreachingSla || [];
  const overdueCommission = tasksData?.commissionEventsOverdue || [];
  const waitingSupplier = tasksData?.dealsWaitingOnSupplier || [];
  
  const totalTasks = blocked.length + slaBreach.length + overdueCommission.length + waitingSupplier.length;

  return (
    <div className="space-y-6" data-testid="ops-dashboard">
      <Card className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShieldAlert className="w-6 h-6" />
            Today's Work Engine
          </CardTitle>
          <CardDescription className="text-violet-100">
            {totalTasks === 0 
              ? "All clear! No urgent tasks requiring attention."
              : `${totalTasks} task${totalTasks > 1 ? 's' : ''} requiring attention`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => scrollToSection('blocked')}
              className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer" 
              data-testid="card-compliance-blocked"
              disabled={blocked.length === 0}
            >
              <div className="text-3xl font-bold" data-testid="text-compliance-blocked-count">{blocked.length}</div>
              <div className="text-sm text-violet-200">Compliance Blocked</div>
            </button>
            <button 
              onClick={() => scrollToSection('sla')}
              className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer" 
              data-testid="card-sla-breach"
              disabled={slaBreach.length === 0}
            >
              <div className="text-3xl font-bold" data-testid="text-sla-breach-count">{slaBreach.length}</div>
              <div className="text-sm text-violet-200">SLA Breaches</div>
            </button>
            <button 
              onClick={() => scrollToSection('overdue')}
              className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer" 
              data-testid="card-overdue-commission"
              disabled={overdueCommission.length === 0}
            >
              <div className="text-3xl font-bold" data-testid="text-overdue-commission-count">{overdueCommission.length}</div>
              <div className="text-sm text-violet-200">Overdue Payments</div>
            </button>
            <button 
              onClick={() => scrollToSection('waiting')}
              className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer" 
              data-testid="card-awaiting-supplier"
              disabled={waitingSupplier.length === 0}
            >
              <div className="text-3xl font-bold" data-testid="text-awaiting-supplier-count">{waitingSupplier.length}</div>
              <div className="text-sm text-violet-200">Awaiting Supplier</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {blocked.length > 0 && (
        <Card id="section-blocked" className="border-orange-200">
          <CardHeader className="bg-orange-50 border-b border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Deals Blocked by Compliance
            </CardTitle>
            <CardDescription className="text-orange-600">
              These deals cannot advance until compliance requirements are met
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Current State</TableHead>
                  <TableHead>Missing Items</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocked.map(({ deal, missingCount }) => (
                  <TableRow key={deal.id} data-testid={`row-blocked-deal-${deal.id}`}>
                    <TableCell className="font-mono text-sm">{deal.id.substring(0, 8)}...</TableCell>
                    <TableCell>{deal.client?.companyName || `Client #${deal.clientId}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        {missingCount} missing
                      </Badge>
                    </TableCell>
                    <TableCell>{deal.internalOwner}</TableCell>
                    <TableCell>
                      {onNavigateToDeal && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onNavigateToDeal(deal.id)}
                          data-testid={`button-view-deal-${deal.id}`}
                        >
                          View <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {slaBreach.length > 0 && (
        <Card id="section-sla" className="border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Clock className="w-5 h-5" />
              Cases Breaching SLA
            </CardTitle>
            <CardDescription className="text-red-600">
              Open cases that have exceeded their SLA due date
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>SLA Due</TableHead>
                  <TableHead>Overdue By</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaBreach.map((c) => (
                  <TableRow key={c.id} data-testid={`row-sla-case-${c.id}`}>
                    <TableCell className="font-mono">#{c.id}</TableCell>
                    <TableCell className="font-mono text-sm">{c.dealId.substring(0, 8)}...</TableCell>
                    <TableCell>{c.caseType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Badge className={severityColors[c.severity] || "bg-gray-100"}>
                        {c.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.slaDueDate ? format(new Date(c.slaDueDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {c.slaDueDate ? formatDistanceToNow(new Date(c.slaDueDate), { addSuffix: false }) : '-'}
                    </TableCell>
                    <TableCell>
                      {onNavigateToDeal && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onNavigateToDeal(c.dealId)}
                          data-testid={`button-view-case-deal-${c.id}`}
                        >
                          View Deal <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {overdueCommission.length > 0 && (
        <Card id="section-overdue" className="border-amber-200">
          <CardHeader className="bg-amber-50 border-b border-amber-200">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <DollarSign className="w-5 h-5" />
              Overdue Commission Events
            </CardTitle>
            <CardDescription className="text-amber-600">
              Pending commission payments past their expected date
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount (BRL)</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueCommission.map((e) => (
                  <TableRow key={e.id} data-testid={`row-overdue-commission-${e.id}`}>
                    <TableCell className="font-mono">#{e.id}</TableCell>
                    <TableCell className="font-mono text-sm">{e.dealId.substring(0, 8)}...</TableCell>
                    <TableCell>{e.eventType}</TableCell>
                    <TableCell className="font-medium">
                      {e.amountBrl ? `R$ ${parseFloat(e.amountBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell>
                      {e.expectedDate ? format(new Date(e.expectedDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {onNavigateToDeal && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onNavigateToDeal(e.dealId)}
                          data-testid={`button-view-commission-deal-${e.id}`}
                        >
                          View Deal <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {waitingSupplier.length > 0 && (
        <Card id="section-waiting" className="border-blue-200">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Truck className="w-5 h-5" />
              Deals Waiting on Supplier
            </CardTitle>
            <CardDescription className="text-blue-600">
              Deals in RFQ_SENT state for more than 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Waiting Since</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitingSupplier.map((deal) => (
                  <TableRow key={deal.id} data-testid={`row-waiting-supplier-${deal.id}`}>
                    <TableCell className="font-mono text-sm">{deal.id.substring(0, 8)}...</TableCell>
                    <TableCell>{deal.client?.companyName || `Client #${deal.clientId}`}</TableCell>
                    <TableCell>{deal.internalOwner}</TableCell>
                    <TableCell className="text-blue-600">
                      {/* updatedAt would indicate when it entered this state */}
                      7+ days
                    </TableCell>
                    <TableCell>
                      {onNavigateToDeal && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onNavigateToDeal(deal.id)}
                          data-testid={`button-view-waiting-deal-${deal.id}`}
                        >
                          View <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalTasks === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">All Clear!</h3>
            <p className="text-green-600">No urgent tasks requiring attention. Great job keeping things on track!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
