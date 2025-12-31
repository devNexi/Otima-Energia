import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { HelpCircle, ExternalLink, Loader2 } from "lucide-react";

interface DictionaryTooltipProps {
  termKey: string;
  children?: React.ReactNode;
  inline?: boolean;
  showIcon?: boolean;
}

interface DictionaryTerm {
  id: number;
  key: string;
  category: string;
  term_pt: string;
  term_en: string;
  short_def_pt: string;
  short_def_en: string;
  why_matters_pt: string;
  why_matters_en: string;
  example_pt: string | null;
  example_en: string | null;
  synonyms: string[];
  related_keys: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  DOSSIER: "bg-blue-100 text-blue-800",
  RFQ_QUOTES: "bg-purple-100 text-purple-800",
  ONBOARDING_COMPLIANCE: "bg-amber-100 text-amber-800",
  COMMISSION_REVENUE: "bg-green-100 text-green-800",
  OPS_EXECUTION: "bg-red-100 text-red-800"
};

const CATEGORY_LABELS: Record<string, { pt: string; en: string }> = {
  DOSSIER: { pt: "Dossiê", en: "Dossier" },
  RFQ_QUOTES: { pt: "RFQ / Cotações", en: "RFQ / Quotes" },
  ONBOARDING_COMPLIANCE: { pt: "Onboarding", en: "Onboarding" },
  COMMISSION_REVENUE: { pt: "Comissão", en: "Commission" },
  OPS_EXECUTION: { pt: "Operações", en: "Operations" }
};

export function DictionaryTooltip({ termKey, children, inline = false, showIcon = true }: DictionaryTooltipProps) {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/dictionary/${termKey}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/dictionary/${termKey}`);
      return res.json();
    },
    enabled: open
  });

  const term: DictionaryTerm | undefined = data?.term;

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {showIcon ? (
          <button 
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground ml-1 cursor-help"
            data-testid={`dictionary-tooltip-${termKey}`}
          >
            <HelpCircle className="w-3 h-3" />
          </button>
        ) : (
          <span className="cursor-help border-b border-dotted border-muted-foreground">
            {children}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : term ? (
          <div className="space-y-3">
            <div className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm">
                  {language === "pt" ? term.term_pt : term.term_en}
                </h4>
                <Badge className={`text-xs ${CATEGORY_COLORS[term.category] || ""}`}>
                  {CATEGORY_LABELS[term.category]?.[language as "pt" | "en"] || term.category}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                {language === "pt" ? term.short_def_pt : term.short_def_en}
              </p>
            </div>
            
            <Separator />
            
            <div className="px-4 py-2 bg-amber-50">
              <p className="text-xs font-medium text-amber-800">
                {language === "pt" ? "Por que importa:" : "Why it matters:"}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {language === "pt" ? term.why_matters_pt : term.why_matters_en}
              </p>
            </div>

            {(term.example_pt || term.example_en) && (
              <div className="px-4 py-2 bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground">
                  {language === "pt" ? "Exemplo:" : "Example:"}
                </p>
                <p className="text-xs mt-1 font-mono">
                  {language === "pt" ? term.example_pt : term.example_en}
                </p>
              </div>
            )}

            {term.related_keys && term.related_keys.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {language === "pt" ? "Termos relacionados:" : "Related terms:"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {term.related_keys.map(key => (
                    <DictionaryTooltip key={key} termKey={key} inline>
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                        {key}
                      </Badge>
                    </DictionaryTooltip>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {language === "pt" ? "Termo não encontrado" : "Term not found"}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  if (inline && children) {
    return (
      <span className="inline-flex items-center">
        {children}
        {content}
      </span>
    );
  }

  return content;
}

export function DictionaryLink({ termKey, children }: { termKey: string; children: React.ReactNode }) {
  return (
    <DictionaryTooltip termKey={termKey} showIcon={false}>
      {children}
    </DictionaryTooltip>
  );
}

export function DictionaryHelp({ termKey }: { termKey: string }) {
  const { language } = useI18n();
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
      <span>{language === "pt" ? "Não sabe o que isso significa?" : "Don't know what this means?"}</span>
      <DictionaryTooltip termKey={termKey} showIcon={false}>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          <ExternalLink className="w-3 h-3 mr-1" />
          {language === "pt" ? "Ver definição" : "See definition"}
        </Button>
      </DictionaryTooltip>
    </div>
  );
}
