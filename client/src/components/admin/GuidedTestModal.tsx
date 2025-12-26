import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  X
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

export function GuidedTestModal({ open, onOpenChange }: GuidedTestModalProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepId: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const testSteps: TestStep[] = [
    {
      id: 1,
      title: "1. Review Demo Clients",
      description: "View seeded demo clients and their profiles",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/sales/clients",
      action: "View Clients",
      completed: completedSteps.includes(1)
    },
    {
      id: 2,
      title: "2. Explore Deal Lifecycle",
      description: "Navigate deals across all 10 lifecycle stages",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/ops/deals",
      action: "View Deals",
      completed: completedSteps.includes(2)
    },
    {
      id: 3,
      title: "3. Test Blind Auction / RFQ",
      description: "Review RFQ dispatches and supplier responses",
      icon: <Send className="h-5 w-5" />,
      href: "/admin/ops/rfqs",
      action: "View RFQs",
      completed: completedSteps.includes(3)
    },
    {
      id: 4,
      title: "4. Analyze Quotes",
      description: "Compare supplier quotes and pricing",
      icon: <Receipt className="h-5 w-5" />,
      href: "/admin/ops/deals",
      action: "View Quotes",
      completed: completedSteps.includes(4)
    },
    {
      id: 5,
      title: "5. Commission Tracking",
      description: "Review commission events and revenue pipeline",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/admin/ops/revenue",
      action: "View Revenue",
      completed: completedSteps.includes(5)
    },
    {
      id: 6,
      title: "6. Ops Dashboard",
      description: "Monitor deal health and SLA tracking",
      icon: <CheckCircle2 className="h-5 w-5" />,
      href: "/admin/ops",
      action: "View Dashboard",
      completed: completedSteps.includes(6)
    }
  ];

  const completionPercentage = Math.round((completedSteps.length / testSteps.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Guided Demo Walkthrough
          </DialogTitle>
          <DialogDescription>
            Follow these 6 steps to explore the complete Deal OS workflow using demo data.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps.length} / {testSteps.length} completed
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {testSteps.map((step) => (
            <Card 
              key={step.id} 
              className={`transition-colors ${step.completed ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''}`}
              data-testid={`test-step-${step.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-muted'}`}>
                    {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    <div className="flex items-center gap-2">
                      <Link href={step.href}>
                        <Button 
                          size="sm" 
                          variant={step.completed ? "outline" : "default"}
                          onClick={() => onOpenChange(false)}
                          data-testid={`button-go-step-${step.id}`}
                        >
                          {step.action}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStep(step.id)}
                        data-testid={`button-toggle-step-${step.id}`}
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

        {completedSteps.length === testSteps.length && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Walkthrough Complete!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              You've explored all the key areas of Deal OS. The demo data can be cleared from Admin Settings when you're done testing.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
