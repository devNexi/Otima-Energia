import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Users,
  FileText,
  Send,
  Receipt,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  X,
  Gavel,
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  FileSearch
} from "lucide-react";

interface GuidedTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TestStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  action: string;
  completed: boolean;
}

interface DemoDeal {
  id: string;
  clientName: string;
  status: string;
  scenario?: string;
}

type TourType = 'overview' | 'blind_auction' | 'revenue' | 'compliance';

export function GuidedTestModal({ open, onOpenChange }: GuidedTestModalProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<TourType, number[]>>({
    overview: [],
    blind_auction: [],
    revenue: [],
    compliance: []
  });
  const [activeTour, setActiveTour] = useState<TourType>('overview');

  const { data: demoDealsData } = useQuery<{ success: boolean; deals: DemoDeal[] }>({
    queryKey: ["/api/admin/demo/deals"],
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const demoDeals = demoDealsData?.deals || [];
  
  const happyPathDeal = demoDeals.find(d => d.scenario === 'Happy Path');
  const slaBreachDeal = demoDeals.find(d => d.scenario === 'SLA Breach');
  const creditRejectedDeal = demoDeals.find(d => d.scenario === 'Credit Rejected');
  const wrongSignerDeal = demoDeals.find(d => d.scenario === 'Wrong Signer');
  const commissionDisputeDeal = demoDeals.find(d => d.scenario === 'Commission Dispute');
  const overduePaymentDeal = demoDeals.find(d => d.scenario === 'Overdue Payment');

  const toggleStep = (tourType: TourType, stepId: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [tourType]: prev[tourType].includes(stepId)
        ? prev[tourType].filter(id => id !== stepId)
        : [...prev[tourType], stepId]
    }));
  };

  const overviewSteps: TestStep[] = [
    {
      id: 1,
      title: "1. Review Demo Clients",
      description: "View seeded demo clients (prefixed with TEST -) and their profiles",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/sales/clients",
      action: "View Clients",
      completed: completedSteps.overview.includes(1)
    },
    {
      id: 2,
      title: "2. Explore Deal Lifecycle",
      description: "Navigate deals across all 10 lifecycle stages (IDs start with DEMO_)",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/ops/deals",
      action: "View Deals",
      completed: completedSteps.overview.includes(2)
    },
    {
      id: 3,
      title: "3. Test Blind Auction / RFQ",
      description: "Review RFQ dispatches and supplier responses",
      icon: <Send className="h-5 w-5" />,
      href: "/admin/ops/rfqs",
      action: "View RFQs",
      completed: completedSteps.overview.includes(3)
    },
    {
      id: 4,
      title: "4. Analyze Quotes",
      description: "Compare supplier quotes and pricing (DEMO - suppliers)",
      icon: <Receipt className="h-5 w-5" />,
      href: "/admin/ops/deals",
      action: "View Quotes",
      completed: completedSteps.overview.includes(4)
    },
    {
      id: 5,
      title: "5. Commission Tracking",
      description: "Review commission events and revenue pipeline",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/admin/ops/revenue",
      action: "View Revenue",
      completed: completedSteps.overview.includes(5)
    },
    {
      id: 6,
      title: "6. Ops Dashboard",
      description: "Monitor deal health and SLA tracking",
      icon: <CheckCircle2 className="h-5 w-5" />,
      href: "/admin/ops",
      action: "View Dashboard",
      completed: completedSteps.overview.includes(6)
    }
  ];

  const blindAuctionSteps: TestStep[] = [
    {
      id: 1,
      title: "1. View Happy Path Deal",
      description: happyPathDeal 
        ? `Open deal ${happyPathDeal.id} - a CLOSED_WON deal with complete RFQ workflow`
        : "First seed the 'Happy Path' scenario to see this deal",
      icon: <FileText className="h-5 w-5" />,
      href: happyPathDeal ? `/admin/ops/deals/${happyPathDeal.id}` : "/admin/settings",
      action: happyPathDeal ? "Open Deal" : "Seed Data",
      completed: completedSteps.blind_auction.includes(1)
    },
    {
      id: 2,
      title: "2. Review RFQ Dispatches",
      description: "See how RFQs were sent to 3 suppliers with identical terms",
      icon: <Send className="h-5 w-5" />,
      href: "/admin/ops/rfqs",
      action: "View RFQs",
      completed: completedSteps.blind_auction.includes(2)
    },
    {
      id: 3,
      title: "3. Compare Blind Quotes",
      description: "View quotes panel - suppliers can't see competitors' prices",
      icon: <Gavel className="h-5 w-5" />,
      href: happyPathDeal ? `/admin/ops/deals/${happyPathDeal.id}` : "/admin/ops/deals",
      action: "View Quotes",
      completed: completedSteps.blind_auction.includes(3)
    },
    {
      id: 4,
      title: "4. Check SLA Breach Scenario",
      description: slaBreachDeal
        ? `Open deal ${slaBreachDeal.id} - supplier missed response deadline`
        : "Seed the 'SLA Breach' scenario to see overdue RFQ",
      icon: <Clock className="h-5 w-5" />,
      href: slaBreachDeal ? `/admin/ops/deals/${slaBreachDeal.id}` : "/admin/settings",
      action: slaBreachDeal ? "View Overdue RFQ" : "Seed Data",
      completed: completedSteps.blind_auction.includes(4)
    },
    {
      id: 5,
      title: "5. Review Supplier Playbooks",
      description: "See how suppliers are configured with preferred channels and SLAs",
      icon: <FileSearch className="h-5 w-5" />,
      href: "/admin/settings",
      action: "View Playbooks",
      completed: completedSteps.blind_auction.includes(5)
    }
  ];

  const revenueSteps: TestStep[] = [
    {
      id: 1,
      title: "1. Revenue Dashboard",
      description: "View the complete revenue pipeline across all demo deals",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/admin/ops/revenue",
      action: "View Revenue",
      completed: completedSteps.revenue.includes(1)
    },
    {
      id: 2,
      title: "2. Commission Events",
      description: happyPathDeal
        ? `Review upfront + monthly commissions for deal ${happyPathDeal.id}`
        : "Seed 'Happy Path' to see commission structure",
      icon: <DollarSign className="h-5 w-5" />,
      href: happyPathDeal ? `/admin/ops/deals/${happyPathDeal.id}` : "/admin/ops/revenue",
      action: "View Commissions",
      completed: completedSteps.revenue.includes(2)
    },
    {
      id: 3,
      title: "3. Commission Dispute",
      description: commissionDisputeDeal
        ? `Open deal ${commissionDisputeDeal.id} - has DISPUTED commission event`
        : "Seed 'Commission Dispute' scenario",
      icon: <AlertTriangle className="h-5 w-5" />,
      href: commissionDisputeDeal ? `/admin/ops/deals/${commissionDisputeDeal.id}` : "/admin/settings",
      action: commissionDisputeDeal ? "View Dispute" : "Seed Data",
      completed: completedSteps.revenue.includes(3)
    },
    {
      id: 4,
      title: "4. Overdue Payments",
      description: overduePaymentDeal
        ? `Open deal ${overduePaymentDeal.id} - has 3 OVERDUE commission payments`
        : "Seed 'Overdue Payment' scenario",
      icon: <Clock className="h-5 w-5" />,
      href: overduePaymentDeal ? `/admin/ops/deals/${overduePaymentDeal.id}` : "/admin/settings",
      action: overduePaymentDeal ? "View Overdue" : "Seed Data",
      completed: completedSteps.revenue.includes(4)
    },
    {
      id: 5,
      title: "5. Usage Period Reconciliation",
      description: "Review client usage data used for commission calculations",
      icon: <Receipt className="h-5 w-5" />,
      href: "/admin/ops/revenue",
      action: "View Usage Data",
      completed: completedSteps.revenue.includes(5)
    }
  ];

  const complianceSteps: TestStep[] = [
    {
      id: 1,
      title: "1. Blocker Engine",
      description: "View which deals are blocked and why in the ops dashboard",
      icon: <Shield className="h-5 w-5" />,
      href: "/admin/ops",
      action: "View Blockers",
      completed: completedSteps.compliance.includes(1)
    },
    {
      id: 2,
      title: "2. Wrong Signer Risk",
      description: wrongSignerDeal
        ? `Open deal ${wrongSignerDeal.id} - blocked at DOC_COLLECTION for signer verification`
        : "Seed 'Wrong Signer' scenario",
      icon: <AlertTriangle className="h-5 w-5" />,
      href: wrongSignerDeal ? `/admin/ops/deals/${wrongSignerDeal.id}` : "/admin/settings",
      action: wrongSignerDeal ? "View Deal" : "Seed Data",
      completed: completedSteps.compliance.includes(2)
    },
    {
      id: 3,
      title: "3. Credit Rejection",
      description: creditRejectedDeal
        ? `Open deal ${creditRejectedDeal.id} - blocked at PROPOSAL due to credit check`
        : "Seed 'Credit Rejected' scenario",
      icon: <X className="h-5 w-5" />,
      href: creditRejectedDeal ? `/admin/ops/deals/${creditRejectedDeal.id}` : "/admin/settings",
      action: creditRejectedDeal ? "View Deal" : "Seed Data",
      completed: completedSteps.compliance.includes(3)
    },
    {
      id: 4,
      title: "4. Client Dossier Status",
      description: "Review dossier DRAFT/READY/LOCKED statuses and their gates",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/sales/clients",
      action: "View Dossiers",
      completed: completedSteps.compliance.includes(4)
    },
    {
      id: 5,
      title: "5. Deal Cases",
      description: "Review exception cases (SLA breaches, documentation issues)",
      icon: <FileSearch className="h-5 w-5" />,
      href: "/admin/ops",
      action: "View Cases",
      completed: completedSteps.compliance.includes(5)
    }
  ];

  const tourConfigs = {
    overview: { steps: overviewSteps, title: "Overview Tour", icon: <PlayCircle className="h-4 w-4" /> },
    blind_auction: { steps: blindAuctionSteps, title: "Blind Auction", icon: <Gavel className="h-4 w-4" /> },
    revenue: { steps: revenueSteps, title: "Revenue / Commission", icon: <TrendingUp className="h-4 w-4" /> },
    compliance: { steps: complianceSteps, title: "Compliance Gates", icon: <Shield className="h-4 w-4" /> }
  };

  const currentTour = tourConfigs[activeTour];
  const completionPercentage = Math.round((completedSteps[activeTour].length / currentTour.steps.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Guided Demo Tours
          </DialogTitle>
          <DialogDescription>
            Choose a tour to explore specific aspects of Deal OS using demo data.
            {demoDeals.length === 0 && (
              <span className="block mt-1 text-amber-600">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                No demo deals found. Seed scenario packs first.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTour} onValueChange={(v) => setActiveTour(v as TourType)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {Object.entries(tourConfigs).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1.5 text-xs md:text-sm">
                {config.icon}
                <span className="hidden sm:inline">{config.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(tourConfigs).map(([key, config]) => (
            <TabsContent key={key} value={key} className="flex-1 overflow-hidden flex flex-col mt-0">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{config.title} Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps[key as TourType].length} / {config.steps.length} completed
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((completedSteps[key as TourType].length / config.steps.length) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {config.steps.map((step) => (
                  <Card 
                    key={step.id} 
                    className={`transition-colors ${step.completed ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''}`}
                    data-testid={`tour-${key}-step-${step.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg shrink-0 ${step.completed ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-muted'}`}>
                          {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {step.title}
                            </h3>
                            {step.completed && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                Done
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {step.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={step.href}>
                              <Button 
                                size="sm" 
                                variant={step.completed ? "outline" : "default"}
                                onClick={() => onOpenChange(false)}
                                data-testid={`button-tour-${key}-step-${step.id}`}
                              >
                                {step.action}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleStep(key as TourType, step.id)}
                              data-testid={`button-toggle-tour-${key}-step-${step.id}`}
                            >
                              {step.completed ? (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Undo
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Mark Done
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {completedSteps[key as TourType].length === config.steps.length && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{config.title} Complete!</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    You've explored all steps of this tour. Try another tour or clear demo data when done.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
