import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BookOpen, Scale, AlertTriangle } from "lucide-react";
import { UsageTab } from "./UsageTab";
import { PlaybooksTab } from "./PlaybooksTab";
import { ReconciliationTab } from "./ReconciliationTab";
import { DealCasesTab } from "./DealCasesTab";

interface RevenueTabProps {
  language?: "en" | "pt";
}

export function RevenueTab({ language = "en" }: RevenueTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("usage");

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="usage" className="flex items-center gap-2" data-testid="tab-revenue-usage">
            <Zap className="w-4 h-4" />
            {language === "pt" ? "Consumo" : "Usage"}
          </TabsTrigger>
          <TabsTrigger value="playbooks" className="flex items-center gap-2" data-testid="tab-revenue-playbooks">
            <BookOpen className="w-4 h-4" />
            {language === "pt" ? "Playbooks" : "Playbooks"}
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2" data-testid="tab-revenue-reconciliation">
            <Scale className="w-4 h-4" />
            {language === "pt" ? "Conciliação" : "Reconciliation"}
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center gap-2" data-testid="tab-revenue-cases">
            <AlertTriangle className="w-4 h-4" />
            {language === "pt" ? "Casos" : "Cases"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <UsageTab />
        </TabsContent>

        <TabsContent value="playbooks">
          <PlaybooksTab />
        </TabsContent>

        <TabsContent value="reconciliation">
          <ReconciliationTab />
        </TabsContent>

        <TabsContent value="cases">
          <DealCasesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
