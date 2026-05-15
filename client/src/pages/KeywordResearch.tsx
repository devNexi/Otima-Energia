import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Search,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Campaign =
  | "Alta Conta de Energia"
  | "Mercado Livre de Energia"
  | "ACR ACL GDL"
  | "Redução de Custos Empresariais"
  | "Condomínios"
  | "Indústria e Comércio"
  | "Reject"
  | "all";

type MatchType = "exact" | "phrase" | "reject" | "all";

interface ClassifiedKeyword {
  keyword: string;
  avg_monthly_searches: number | null;
  competition: string;
  competition_index: number | null;
  low_top_of_page_bid_micros: number | null;
  high_top_of_page_bid_micros: number | null;
  campaign: string;
  ad_group: string;
  commercial_intent_score: number;
  recommended_match_type: string;
  reason: string;
  negative_keyword_warnings: string[];
}

interface ResearchResult {
  raw: any[];
  classified: ClassifiedKeyword[];
  summary: {
    total: number;
    byCampaign: Record<string, number>;
    rejected: number;
    exact: number;
    phrase: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function microsToReais(micros: number | null): string {
  if (micros == null) return "—";
  return `R$ ${(micros / 1_000_000).toFixed(2)}`;
}

function fmtVolume(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

const CAMPAIGN_COLORS: Record<string, string> = {
  "Alta Conta de Energia": "bg-orange-100 text-orange-800 border-orange-200",
  "Mercado Livre de Energia": "bg-blue-100 text-blue-800 border-blue-200",
  "ACR ACL GDL": "bg-purple-100 text-purple-800 border-purple-200",
  "Redução de Custos Empresariais": "bg-green-100 text-green-800 border-green-200",
  "Condomínios": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Indústria e Comércio": "bg-slate-100 text-slate-800 border-slate-200",
  "Reject": "bg-red-100 text-red-800 border-red-200",
};

const MATCH_COLORS: Record<string, string> = {
  exact: "bg-emerald-100 text-emerald-800",
  phrase: "bg-sky-100 text-sky-800",
  reject: "bg-red-100 text-red-700",
};

const COMPETITION_COLORS: Record<string, string> = {
  LOW: "text-green-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
  UNKNOWN: "text-slate-400",
  UNSPECIFIED: "text-slate-400",
};

function IntentDots({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= score ? "bg-violet-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function escCsv(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map((r) => r.map(escCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportRaw(data: ResearchResult) {
  const headers = [
    "keyword",
    "avg_monthly_searches",
    "competition",
    "competition_index",
    "low_top_of_page_bid_micros",
    "high_top_of_page_bid_micros",
  ];
  const rows = data.raw.map((r) => [
    r.keyword,
    r.avg_monthly_searches,
    r.competition,
    r.competition_index,
    r.low_top_of_page_bid_micros,
    r.high_top_of_page_bid_micros,
  ]);
  downloadCsv("raw_results.csv", rows, headers);
}

function exportClassified(data: ResearchResult) {
  const headers = [
    "keyword",
    "campaign",
    "ad_group",
    "commercial_intent_score",
    "recommended_match_type",
    "avg_monthly_searches",
    "competition",
    "competition_index",
    "low_cpc_brl",
    "high_cpc_brl",
    "reason",
    "negative_keyword_warnings",
  ];
  const rows = data.classified
    .filter((c) => c.recommended_match_type !== "reject")
    .map((c) => [
      c.keyword,
      c.campaign,
      c.ad_group,
      c.commercial_intent_score,
      c.recommended_match_type,
      c.avg_monthly_searches,
      c.competition,
      c.competition_index,
      microsToReais(c.low_top_of_page_bid_micros),
      microsToReais(c.high_top_of_page_bid_micros),
      c.reason,
      c.negative_keyword_warnings.join("; "),
    ]);
  downloadCsv("classified_keywords.csv", rows, headers);
}

function exportNegatives(data: ResearchResult) {
  const headers = ["keyword", "reason"];
  const rows = data.classified
    .filter((c) => c.recommended_match_type === "reject")
    .map((c) => [c.keyword, c.reason]);
  downloadCsv("negatives.csv", rows, headers);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KeywordResearch() {
  const { user, sessionId, isLoading } = useAuth();
  const { toast } = useToast();

  const [seedText, setSeedText] = useState(
    "reduzir conta de luz empresa\nmercado livre de energia para empresas\neconomizar energia empresa\nfornecedor de energia elétrica"
  );
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [matchFilter, setMatchFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const seedKeywords = seedText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (seedKeywords.length === 0) throw new Error("Add at least one seed keyword.");
      if (seedKeywords.length > 20)
        throw new Error("Maximum 20 seed keywords per request.");

      const res = await fetch("/api/admin/keyword-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        },
        body: JSON.stringify({ seedKeywords }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `API error ${res.status}`);
      }
      return res.json() as Promise<ResearchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setCampaignFilter("all");
      setMatchFilter("all");
      setSearch("");
      toast({ title: `${data.summary.total} keywords returned`, description: "Research complete." });
    },
    onError: (err: Error) => {
      toast({ title: "Research failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Auth guards — checked AFTER all hooks ──────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) {
    window.location.replace("/admin");
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="font-medium">Admin role required</p>
            <p className="text-sm text-slate-500 mt-1">Your account ({user.username}) does not have admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = (result?.classified ?? []).filter((c) => {
    if (campaignFilter !== "all" && c.campaign !== campaignFilter) return false;
    if (matchFilter !== "all" && c.recommended_match_type !== matchFilter) return false;
    if (search && !c.keyword.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const campaigns = Array.from(
    new Set(result?.classified.map((c) => c.campaign) ?? [])
  ).sort();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Admin
            </Button>
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-violet-600" />
            <span className="font-semibold text-slate-900">Keyword Research</span>
            <Badge variant="outline" className="text-xs">Google Ads API</Badge>
          </div>
          <div className="ml-auto text-xs text-slate-500">Brazil · Portuguese · Search only</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Input panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seed Keywords</CardTitle>
            <CardDescription>One keyword per line · max 20 · Brazil / Portuguese / Google Search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              data-testid="input-seed-keywords"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              rows={6}
              placeholder="reduzir conta de luz empresa&#10;mercado livre de energia para empresas"
              className="font-mono text-sm resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {seedText.split("\n").filter((s) => s.trim()).length} keywords entered
              </p>
              <Button
                data-testid="button-run-research"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {mutation.isPending ? "Fetching…" : "Run Research"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {mutation.isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800 text-sm">Research failed</p>
                <p className="text-red-700 text-xs mt-1">{(mutation.error as Error).message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-slate-200">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-bold text-slate-900">{result.summary.total}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total keywords</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-bold text-emerald-700">{result.summary.exact}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Exact match</p>
                </CardContent>
              </Card>
              <Card className="border-sky-200 bg-sky-50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-bold text-sky-700">{result.summary.phrase}</p>
                  <p className="text-xs text-sky-600 mt-0.5">Phrase match</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-bold text-red-600">{result.summary.rejected}</p>
                  <p className="text-xs text-red-500 mt-0.5">Rejected / negatives</p>
                </CardContent>
              </Card>
            </div>

            {/* Campaign breakdown */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.summary.byCampaign)
                .sort((a, b) => b[1] - a[1])
                .map(([camp, count]) => (
                  <button
                    key={camp}
                    data-testid={`filter-campaign-${camp}`}
                    onClick={() => setCampaignFilter(campaignFilter === camp ? "all" : camp)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      CAMPAIGN_COLORS[camp] ?? "bg-slate-100 text-slate-700 border-slate-200"
                    } ${campaignFilter === camp ? "ring-2 ring-offset-1 ring-violet-500" : "opacity-80 hover:opacity-100"}`}
                  >
                    {camp}
                    <span className="font-bold">{count}</span>
                  </button>
                ))}
            </div>

            {/* Download & filter toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1 min-w-48">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <Input
                  data-testid="input-keyword-search"
                  placeholder="Filter keywords…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <Select value={matchFilter} onValueChange={setMatchFilter}>
                <SelectTrigger data-testid="select-match-filter" className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All match types</SelectItem>
                  <SelectItem value="exact">Exact</SelectItem>
                  <SelectItem value="phrase">Phrase</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 ml-auto">
                <Button
                  data-testid="button-download-raw"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => exportRaw(result)}
                >
                  <Download className="w-3.5 h-3.5" /> raw_results.csv
                </Button>
                <Button
                  data-testid="button-download-classified"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => exportClassified(result)}
                >
                  <Download className="w-3.5 h-3.5" /> classified_keywords.csv
                </Button>
                <Button
                  data-testid="button-download-negatives"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => exportNegatives(result)}
                >
                  <Download className="w-3.5 h-3.5" /> negatives.csv
                </Button>
              </div>
            </div>

            {/* Results table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 text-xs">
                        <TableHead className="min-w-52">Keyword</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Ad Group</TableHead>
                        <TableHead className="text-center">Intent</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead className="text-right">Avg/mo</TableHead>
                        <TableHead>Competition</TableHead>
                        <TableHead className="text-right">Low CPC</TableHead>
                        <TableHead className="text-right">High CPC</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-10 text-slate-400 text-sm">
                            No keywords match the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((c, i) => (
                          <TableRow
                            key={i}
                            data-testid={`row-keyword-${i}`}
                            className={c.recommended_match_type === "reject" ? "opacity-50" : ""}
                          >
                            <TableCell className="font-mono text-xs font-medium text-slate-800">
                              {c.keyword}
                              {c.negative_keyword_warnings.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-1.5 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-64 text-xs">
                                    <ul className="space-y-1">
                                      {c.negative_keyword_warnings.map((w, wi) => (
                                        <li key={wi}>⚠ {w}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CAMPAIGN_COLORS[c.campaign] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                {c.campaign}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">{c.ad_group}</TableCell>
                            <TableCell className="text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-flex justify-center cursor-default">
                                    <IntentDots score={c.commercial_intent_score} />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                  Commercial intent: {c.commercial_intent_score}/5
                                  <br />
                                  <span className="text-slate-400">{c.reason}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${MATCH_COLORS[c.recommended_match_type] ?? ""}`}>
                                {c.recommended_match_type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-slate-700">
                              {fmtVolume(c.avg_monthly_searches)}
                            </TableCell>
                            <TableCell className={`text-xs font-medium ${COMPETITION_COLORS[c.competition] ?? "text-slate-500"}`}>
                              {c.competition}
                              {c.competition_index != null && (
                                <span className="text-slate-400 font-normal ml-1">({c.competition_index})</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-600">
                              {microsToReais(c.low_top_of_page_bid_micros)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-600">
                              {microsToReais(c.high_top_of_page_bid_micros)}
                            </TableCell>
                            <TableCell>
                              {c.recommended_match_type === "reject" ? (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              ) : c.commercial_intent_score >= 4 ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <div className="w-3.5 h-3.5" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {filtered.length > 0 && (
                  <div className="px-4 py-2 border-t text-xs text-slate-400">
                    Showing {filtered.length} of {result.classified.length} keywords
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Info box when no results yet */}
        {!result && !mutation.isPending && (
          <Card className="border-dashed border-slate-300 bg-transparent">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Enter seed keywords and run research</p>
              <p className="text-xs text-slate-400 mt-1">
                Results will be classified into Ótima campaigns with match-type recommendations
              </p>
            </CardContent>
          </Card>
        )}

        {mutation.isPending && (
          <Card className="border-violet-200 bg-violet-50">
            <CardContent className="py-10 text-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-violet-700">Querying Google Ads API…</p>
              <p className="text-xs text-violet-500 mt-1">This may take up to 30 seconds</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
