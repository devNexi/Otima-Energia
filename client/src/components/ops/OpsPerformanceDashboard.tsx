import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  Users
} from "lucide-react";

interface PerformanceSnapshot {
  id: number;
  userId: number;
  periodType: string;
  periodStart: Date;
  dealsHandled: number;
  avgDealDuration: number;
  slaBreaches: number;
  errorCount: number;
  successRate: number;
  createdAt: Date;
}

interface TeamMetrics {
  totalDeals: number;
  avgDuration: number;
  slaBreachRate: number;
  errorRate: number;
  successRate: number;
  topPerformers: { userId: number; score: number }[];
  needsSupport: { userId: number; issues: string[] }[];
}

const METRIC_THRESHOLDS = {
  avgDuration: { good: 48, warning: 96, unit: "hours" },
  slaBreachRate: { good: 5, warning: 15, unit: "%" },
  errorRate: { good: 10, warning: 25, unit: "%" },
  successRate: { good: 85, warning: 70, unit: "%" }
};

function MetricCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  thresholds 
}: { 
  title: string; 
  value: number; 
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  thresholds?: { good: number; warning: number };
}) {
  let status: "good" | "warning" | "critical" = "good";
  
  if (thresholds) {
    if (unit === "%" && title.includes("Rate") && !title.includes("Success")) {
      if (value > thresholds.warning) status = "critical";
      else if (value > thresholds.good) status = "warning";
    } else if (title.includes("Duration")) {
      if (value > thresholds.warning) status = "critical";
      else if (value > thresholds.good) status = "warning";
    } else {
      if (value < thresholds.warning) status = "critical";
      else if (value < thresholds.good) status = "warning";
    }
  }

  const statusColors = {
    good: "text-green-600 bg-green-50",
    warning: "text-amber-600 bg-amber-50",
    critical: "text-red-600 bg-red-50"
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg ${statusColors[status]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toFixed(1) : value}{unit}
          </p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OpsPerformanceDashboard() {
  const [periodType, setPeriodType] = useState("weekly");

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["/api/ops/performance", periodType],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ops/performance?periodType=${periodType}&limit=50`);
      return res.json();
    }
  });

  const snapshots: PerformanceSnapshot[] = performanceData?.snapshots || [];
  
  const teamMetrics: TeamMetrics = {
    totalDeals: snapshots.reduce((sum, s) => sum + (s.dealsHandled || 0), 0),
    avgDuration: snapshots.length > 0 
      ? snapshots.reduce((sum, s) => sum + (s.avgDealDuration || 0), 0) / snapshots.length 
      : 0,
    slaBreachRate: snapshots.length > 0
      ? (snapshots.reduce((sum, s) => sum + (s.slaBreaches || 0), 0) / 
         Math.max(snapshots.reduce((sum, s) => sum + (s.dealsHandled || 0), 0), 1)) * 100
      : 0,
    errorRate: snapshots.length > 0
      ? (snapshots.reduce((sum, s) => sum + (s.errorCount || 0), 0) /
         Math.max(snapshots.reduce((sum, s) => sum + (s.dealsHandled || 0), 0), 1)) * 100
      : 0,
    successRate: snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + (s.successRate || 0), 0) / snapshots.length
      : 0,
    topPerformers: [],
    needsSupport: []
  };

  const userStats: Record<number, { deals: number; errors: number; breaches: number; success: number; count: number }> = {};
  snapshots.forEach(s => {
    if (!userStats[s.userId]) {
      userStats[s.userId] = { deals: 0, errors: 0, breaches: 0, success: 0, count: 0 };
    }
    userStats[s.userId].deals += s.dealsHandled || 0;
    userStats[s.userId].errors += s.errorCount || 0;
    userStats[s.userId].breaches += s.slaBreaches || 0;
    userStats[s.userId].success += s.successRate || 0;
    userStats[s.userId].count += 1;
  });

  teamMetrics.topPerformers = Object.entries(userStats)
    .map(([userId, stats]) => ({
      userId: parseInt(userId),
      score: (stats.success / Math.max(stats.count, 1)) - (stats.errors * 2) - (stats.breaches * 5)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  teamMetrics.needsSupport = Object.entries(userStats)
    .map(([userId, stats]) => {
      const issues: string[] = [];
      const avgSuccess = stats.success / Math.max(stats.count, 1);
      const errorRate = stats.deals > 0 ? (stats.errors / stats.deals) * 100 : 0;
      const breachRate = stats.deals > 0 ? (stats.breaches / stats.deals) * 100 : 0;
      
      if (avgSuccess < 70) issues.push("Low success rate");
      if (errorRate > 25) issues.push("High error rate");
      if (breachRate > 15) issues.push("Frequent SLA breaches");
      
      return { userId: parseInt(userId), issues };
    })
    .filter(u => u.issues.length > 0)
    .slice(0, 5);

  return (
    <div className="space-y-6" data-testid="ops-performance-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            Ops Performance Metrics
          </h2>
          <p className="text-muted-foreground">
            Track team efficiency and identify improvement opportunities
          </p>
        </div>
        
        <Select value={periodType} onValueChange={setPeriodType}>
          <SelectTrigger className="w-36" data-testid="select-period-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Avg Deal Duration"
          value={teamMetrics.avgDuration}
          unit="h"
          icon={Timer}
          thresholds={METRIC_THRESHOLDS.avgDuration}
        />
        <MetricCard 
          title="SLA Breach Rate"
          value={teamMetrics.slaBreachRate}
          unit="%"
          icon={Clock}
          thresholds={METRIC_THRESHOLDS.slaBreachRate}
        />
        <MetricCard 
          title="Error Rate"
          value={teamMetrics.errorRate}
          unit="%"
          icon={AlertTriangle}
          thresholds={METRIC_THRESHOLDS.errorRate}
        />
        <MetricCard 
          title="Success Rate"
          value={teamMetrics.successRate}
          unit="%"
          icon={CheckCircle2}
          thresholds={METRIC_THRESHOLDS.successRate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Team members with the best performance scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMetrics.topPerformers.length > 0 ? (
                teamMetrics.topPerformers.map((performer, index) => {
                  const stats = userStats[performer.userId];
                  const avgSuccess = stats?.success / Math.max(stats?.count || 1, 1) || 0;
                  
                  return (
                    <div 
                      key={performer.userId}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                      data-testid={`top-performer-${performer.userId}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? "bg-amber-500" :
                        index === 1 ? "bg-gray-400" :
                        index === 2 ? "bg-amber-700" :
                        "bg-blue-500"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">User #{performer.userId}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.deals || 0} deals | {avgSuccess.toFixed(0)}% success
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Score: {performer.score.toFixed(0)}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No performance data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              Needs Support
            </CardTitle>
            <CardDescription>
              Team members who may benefit from additional training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMetrics.needsSupport.length > 0 ? (
                teamMetrics.needsSupport.map((user) => (
                  <div 
                    key={user.userId}
                    className="flex items-start gap-4 p-3 border border-amber-200 bg-amber-50 rounded-lg"
                    data-testid={`needs-support-${user.userId}`}
                  >
                    <XCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">User #{user.userId}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.issues.map((issue, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-amber-300">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    All team members are performing well!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Breakdown by User</CardTitle>
          <CardDescription>
            Individual metrics for each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(userStats).length > 0 ? (
              Object.entries(userStats)
                .sort(([, a], [, b]) => b.deals - a.deals)
                .map(([userId, stats]) => {
                  const avgSuccess = stats.success / Math.max(stats.count, 1);
                  const errorRate = stats.deals > 0 ? (stats.errors / stats.deals) * 100 : 0;
                  
                  return (
                    <div key={userId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">User #{userId}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {stats.deals} deals processed
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Success Rate</span>
                            <span>{avgSuccess.toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={avgSuccess} 
                            className={`h-2 ${avgSuccess >= 85 ? "[&>div]:bg-green-500" : avgSuccess >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Error Rate</span>
                            <span>{errorRate.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(errorRate, 100)} 
                            className={`h-2 ${errorRate <= 10 ? "[&>div]:bg-green-500" : errorRate <= 25 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>SLA Breaches</span>
                            <span>{stats.breaches}</span>
                          </div>
                          <Progress 
                            value={Math.min((stats.breaches / Math.max(stats.deals, 1)) * 100 * 5, 100)} 
                            className={`h-2 ${stats.breaches === 0 ? "[&>div]:bg-green-500" : stats.breaches <= 2 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No performance data available yet. Data will appear as deals are processed.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
