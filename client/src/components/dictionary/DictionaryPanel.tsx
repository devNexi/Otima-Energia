import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { 
  BookOpen, 
  Search, 
  FileText, 
  Send, 
  ClipboardCheck, 
  DollarSign, 
  Cog,
  ChevronRight,
  Loader2,
  Globe
} from "lucide-react";

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

const CATEGORIES = [
  { key: "all", label_pt: "Todos", label_en: "All", icon: BookOpen },
  { key: "GENERAL", label_pt: "Geral", label_en: "General", icon: Globe },
  { key: "DOSSIER", label_pt: "Dossiê", label_en: "Dossier", icon: FileText },
  { key: "RFQ_QUOTES", label_pt: "RFQ / Cotações", label_en: "RFQ / Quotes", icon: Send },
  { key: "ONBOARDING_COMPLIANCE", label_pt: "Onboarding", label_en: "Onboarding", icon: ClipboardCheck },
  { key: "COMMISSION_REVENUE", label_pt: "Comissão", label_en: "Commission", icon: DollarSign },
  { key: "OPS_EXECUTION", label_pt: "Operações", label_en: "Operations", icon: Cog }
];

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: "bg-slate-100 text-slate-800 border-slate-200",
  DOSSIER: "bg-blue-100 text-blue-800 border-blue-200",
  RFQ_QUOTES: "bg-purple-100 text-purple-800 border-purple-200",
  ONBOARDING_COMPLIANCE: "bg-amber-100 text-amber-800 border-amber-200",
  COMMISSION_REVENUE: "bg-green-100 text-green-800 border-green-200",
  OPS_EXECUTION: "bg-red-100 text-red-800 border-red-200"
};

function TermCard({ term, language, onSelect }: { term: DictionaryTerm; language: string; onSelect: (term: DictionaryTerm) => void }) {
  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelect(term)}
      data-testid={`dictionary-term-${term.key}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {language === "pt" ? term.term_pt : term.term_en}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {language === "pt" ? term.short_def_pt : term.short_def_en}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function TermDetail({ term, language, onBack }: { term: DictionaryTerm; language: string; onBack: () => void }) {
  const category = CATEGORIES.find(c => c.key === term.category);
  
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        ← {language === "pt" ? "Voltar" : "Back"}
      </Button>
      
      <div>
        <Badge className={`${CATEGORY_COLORS[term.category] || ""} mb-2`}>
          {category ? (language === "pt" ? category.label_pt : category.label_en) : term.category}
        </Badge>
        <h3 className="text-lg font-bold">
          {language === "pt" ? term.term_pt : term.term_en}
        </h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">
            {language === "pt" ? "Definição" : "Definition"}
          </h4>
          <p className="text-sm mt-1">
            {language === "pt" ? term.short_def_pt : term.short_def_en}
          </p>
        </div>
        
        <Separator />
        
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="text-sm font-medium text-amber-800">
            {language === "pt" ? "Por que isso importa?" : "Why does this matter?"}
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            {language === "pt" ? term.why_matters_pt : term.why_matters_en}
          </p>
        </div>
        
        {(term.example_pt || term.example_en) && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">
              {language === "pt" ? "Exemplo" : "Example"}
            </h4>
            <p className="text-sm font-mono mt-1">
              {language === "pt" ? term.example_pt : term.example_en}
            </p>
          </div>
        )}
        
        {term.synonyms && term.synonyms.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {language === "pt" ? "Sinônimos" : "Synonyms"}
            </h4>
            <div className="flex flex-wrap gap-1">
              {term.synonyms.map((syn, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {syn}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {term.related_keys && term.related_keys.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {language === "pt" ? "Termos relacionados" : "Related terms"}
            </h4>
            <div className="flex flex-wrap gap-1">
              {term.related_keys.map(key => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DictionaryPanel() {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState<DictionaryTerm | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/dictionary", search, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);
      const res = await apiRequest("GET", `/api/dictionary?${params.toString()}`);
      return res.json();
    },
    enabled: open
  });

  const terms: DictionaryTerm[] = data?.terms || [];
  const groupedTerms: Record<string, DictionaryTerm[]> = {};
  
  terms.forEach(term => {
    if (!groupedTerms[term.category]) {
      groupedTerms[term.category] = [];
    }
    groupedTerms[term.category].push(term);
  });

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSelectedTerm(null); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="dictionary-panel-trigger">
          <BookOpen className="h-4 w-4" />
          {language === "pt" ? "Dicionário" : "Dictionary"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {language === "pt" ? "Dicionário do Portal" : "Portal Dictionary"}
          </SheetTitle>
          <SheetDescription>
            {language === "pt" 
              ? "Entenda todos os termos usados no portal" 
              : "Understand all terms used in the portal"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {selectedTerm ? (
            <TermDetail 
              term={selectedTerm} 
              language={language} 
              onBack={() => setSelectedTerm(null)} 
            />
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "pt" ? "Buscar termo..." : "Search term..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="dictionary-search"
                />
              </div>

              <Tabs value={category} onValueChange={setCategory}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <TabsTrigger 
                        key={cat.key} 
                        value={cat.key}
                        className="flex flex-col gap-1 py-2 text-xs"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {language === "pt" ? cat.label_pt : cat.label_en}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : terms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {language === "pt" 
                      ? "Nenhum termo encontrado" 
                      : "No terms found"}
                  </div>
                ) : category === "all" ? (
                  <div className="space-y-6">
                    {CATEGORIES.filter(c => c.key !== "all").map(cat => {
                      const catTerms = groupedTerms[cat.key] || [];
                      if (catTerms.length === 0) return null;
                      
                      return (
                        <div key={cat.key}>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {language === "pt" ? cat.label_pt : cat.label_en}
                          </h3>
                          <div className="space-y-2">
                            {catTerms.map(term => (
                              <TermCard 
                                key={term.id} 
                                term={term} 
                                language={language}
                                onSelect={setSelectedTerm}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {terms.map(term => (
                      <TermCard 
                        key={term.id} 
                        term={term} 
                        language={language}
                        onSelect={setSelectedTerm}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
