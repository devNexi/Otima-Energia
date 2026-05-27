import { useState, useRef } from "react";
import { Link } from "wouter";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Upload, Download, AlertTriangle, CheckCircle2,
  TrendingUp, MinusCircle, PauseCircle, ShieldAlert,
  Bot, Search, Filter, Zap, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassifyAction =
  | "KEEP"
  | "ADD_NEGATIVE_ACCOUNT"
  | "ADD_NEGATIVE_CAMPAIGN"
  | "ADD_NEGATIVE_ADGROUP"
  | "PROMOTE_TO_EXACT"
  | "PROMOTE_TO_PHRASE"
  | "REVIEW_MANUALLY";

interface SearchTermRow {
  query: string;
  campaign: string;
  adGroup: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  suggestedAction: ClassifyAction;
  reason: string;
  overrideAction?: ClassifyAction;
}

// ─── Ótima Classification Rules ───────────────────────────────────────────────

const REJECT_PATTERNS: { pattern: RegExp; action: ClassifyAction; reason: string }[] = [
  // Utility support
  { pattern: /segunda via|boleto|agência|ouvidoria|reclamação|código de cliente|número do cliente/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Utility billing support — not a buyer" },
  { pattern: /falta de luz|queda de energia|religação|troca de medidor/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Utility support request" },
  // Residential
  { pattern: /residencial|minha casa|pessoa física|apartamento|casa própria/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Residential — B2C, not B2B" },
  // Jobs
  { pattern: /emprego|vaga|trabalho\s+(de\s+)?energia|cargo|salário|trainee|estágio|concurso/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Job seeker — not a buyer" },
  // Education
  { pattern: /curso|graduação|faculdade|universidade|pós.graduação|MBA|certificação|apostila|matrícula/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Education intent — not a buyer" },
  // Documents/templates
  { pattern: /pdf|modelo de|planilha|template|TCC|monografia|trabalho acadêmico|pesquisa|artigo científico|tese|dissertação/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Document/template seeker" },
  // Solar B2C
  { pattern: /painel solar residencial|placa solar casa|energia solar residencial|sistema fotovoltaico residencial/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Residential solar — not our product" },
  // Marketplace Mercado Livre confusion
  { pattern: /mercado livre compras|mercado pago|comprar no mercado livre|vender no mercado livre|mercado livre app|anúncio mercado livre/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Mercado Livre e-commerce confusion" },
  // Accounting/tax/HR/software noise
  { pattern: /contabilidade|folha de pagamento|imposto de renda|nota fiscal|ERP|software de gestão|CRM empresarial|gestão de pessoas|RH\b|receita federal|SIMPLES nacional/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Accounting/HR/software noise — unrelated to energy" },
  // Marketing noise
  { pattern: /marketing digital|redes sociais|vendas online|e-commerce|loja virtual|tráfego pago/i, action: "ADD_NEGATIVE_ACCOUNT", reason: "Digital marketing noise" },
];

const PROMOTE_PATTERNS: { pattern: RegExp; action: "PROMOTE_TO_EXACT" | "PROMOTE_TO_PHRASE"; reason: string }[] = [
  { pattern: /como migrar para|migração para ACL|migrar mercado livre/i, action: "PROMOTE_TO_EXACT", reason: "High-intent migration query" },
  { pattern: /diagnóstico energético|consultoria de energia|análise de conta de energia/i, action: "PROMOTE_TO_EXACT", reason: "High-intent consultation query" },
  { pattern: /desconto conta de luz empresa|reduzir conta de energia empresa/i, action: "PROMOTE_TO_EXACT", reason: "High-intent reduction query" },
  { pattern: /mercado livre de energia|geração distribuída empresa|energia por assinatura empresa/i, action: "PROMOTE_TO_PHRASE", reason: "Strong commercial phrase — add as phrase match" },
];

function classifyQuery(query: string): { action: ClassifyAction; reason: string } {
  // Check reject patterns first
  for (const { pattern, action, reason } of REJECT_PATTERNS) {
    if (pattern.test(query)) return { action, reason };
  }
  // Check promote patterns
  for (const { pattern, action, reason } of PROMOTE_PATTERNS) {
    if (pattern.test(query)) return { action, reason };
  }
  // Default heuristics
  const lower = query.toLowerCase();
  if (lower.includes("empresa") || lower.includes("comercial") || lower.includes("cnpj") || lower.includes("industrial") || lower.includes("condomínio")) {
    if (lower.includes("economia") || lower.includes("desconto") || lower.includes("reduz") || lower.includes("barato") || lower.includes("custo")) {
      return { action: "KEEP", reason: "Commercial intent — economy/cost keyword" };
    }
    return { action: "KEEP", reason: "Commercial + business context" };
  }
  if (lower.includes("energia") && (lower.includes("acl") || lower.includes("gdl") || lower.includes("mercado livre") || lower.includes("comercializadora") || lower.includes("geração distribuída"))) {
    return { action: "KEEP", reason: "Energy market keyword" };
  }
  return { action: "REVIEW_MANUALLY", reason: "Ambiguous — needs human review" };
}

// ─── Parse Search Terms CSV ───────────────────────────────────────────────────

function parseSearchTermsCsv(text: string): SearchTermRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.replace(/["\s]/g, "").toLowerCase());
  const col = (name: string) => header.findIndex(h => h.includes(name));

  const idxQuery = col("searchterm") !== -1 ? col("searchterm") : col("query") !== -1 ? col("query") : 0;
  const idxCampaign = col("campaign");
  const idxAdGroup = col("adgroup") !== -1 ? col("adgroup") : col("ad group");
  const idxImpressions = col("impression");
  const idxClicks = col("click");
  const idxConversions = col("conversion");
  const idxCost = col("cost");

  const rows: SearchTermRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map(s => s.replace(/^"|"$/g, "").trim());
    const query = parts[idxQuery] ?? "";
    if (!query) continue;
    const { action, reason } = classifyQuery(query);
    rows.push({
      query,
      campaign: idxCampaign >= 0 ? (parts[idxCampaign] ?? "") : "",
      adGroup: idxAdGroup >= 0 ? (parts[idxAdGroup] ?? "") : "",
      impressions: parseInt(parts[idxImpressions] ?? "0") || 0,
      clicks: parseInt(parts[idxClicks] ?? "0") || 0,
      conversions: parseFloat(parts[idxConversions] ?? "0") || 0,
      cost: parseFloat(parts[idxCost] ?? "0") || 0,
      suggestedAction: action,
      reason,
    });
  }
  return rows;
}

// ─── Sample data for demo ─────────────────────────────────────────────────────

const DEMO_ROWS: SearchTermRow[] = [
  { query: "como reduzir conta de luz empresa", campaign: "01_Reducao_Custo_Energia_BR", adGroup: "AG1_Reducao_Conta_Luz", impressions: 120, clicks: 8, conversions: 1, cost: 18.4, suggestedAction: "PROMOTE_TO_EXACT", reason: "High-intent reduction query" },
  { query: "segunda via conta de energia", campaign: "01_Reducao_Custo_Energia_BR", adGroup: "AG1_Reducao_Conta_Luz", impressions: 65, clicks: 5, conversions: 0, cost: 7.2, suggestedAction: "ADD_NEGATIVE_ACCOUNT", reason: "Utility billing support — not a buyer" },
  { query: "mercado livre energia para empresas", campaign: "02_Mercado_Livre_Energia_BR", adGroup: "AG1_Mercado_Livre_Energia", impressions: 200, clicks: 15, conversions: 2, cost: 34.0, suggestedAction: "KEEP", reason: "Energy market keyword" },
  { query: "comprar no mercado livre energia", campaign: "02_Mercado_Livre_Energia_BR", adGroup: "AG1_Mercado_Livre_Energia", impressions: 88, clicks: 3, conversions: 0, cost: 4.1, suggestedAction: "ADD_NEGATIVE_ACCOUNT", reason: "Mercado Livre e-commerce confusion" },
  { query: "curso energia renovável online", campaign: "03_Comparativo_ACR_ACL_GDL", adGroup: "AG1_ACR_vs_ACL", impressions: 45, clicks: 2, conversions: 0, cost: 2.8, suggestedAction: "ADD_NEGATIVE_ACCOUNT", reason: "Education intent — not a buyer" },
  { query: "diagnóstico energético empresarial grátis", campaign: "01_Reducao_Custo_Energia_BR", adGroup: "AG2_Economia_Energia_Empresa", impressions: 90, clicks: 12, conversions: 3, cost: 21.6, suggestedAction: "PROMOTE_TO_EXACT", reason: "High-intent consultation query" },
  { query: "condomínio reduzir energia", campaign: "05_Condominios", adGroup: "AG1_Condominio_Energia", impressions: 70, clicks: 6, conversions: 1, cost: 12.0, suggestedAction: "KEEP", reason: "Commercial + business context" },
  { query: "vaga de emprego energia solar", campaign: "06_Verticais_Industria_Comercio", adGroup: "AG1_Industria_Energia", impressions: 30, clicks: 1, conversions: 0, cost: 1.1, suggestedAction: "ADD_NEGATIVE_ACCOUNT", reason: "Job seeker — not a buyer" },
  { query: "consultoria de energia para indústria", campaign: "06_Verticais_Industria_Comercio", adGroup: "AG1_Industria_Energia", impressions: 55, clicks: 7, conversions: 1, cost: 14.8, suggestedAction: "PROMOTE_TO_EXACT", reason: "High-intent consultation query" },
  { query: "energia sustentável escritório", campaign: "04_Reducao_Custos_Empresariais", adGroup: "AG2_Consultoria_Energia", impressions: 40, clicks: 3, conversions: 0, cost: 5.5, suggestedAction: "REVIEW_MANUALLY", reason: "Ambiguous — needs human review" },
];

// ─── Rules data ───────────────────────────────────────────────────────────────

const DAILY_RULES = [
  {
    icon: <MinusCircle className="h-4 w-4 text-red-500" />,
    title: "Auto-Negative: Utility Support Terms",
    trigger: "Search term matches: segunda via, boleto, ouvidoria, reclamação, agência, código de cliente",
    action: "Add as account-level negative (Broad Match)",
    threshold: "Any impression",
    approvalRequired: false,
  },
  {
    icon: <MinusCircle className="h-4 w-4 text-red-500" />,
    title: "Auto-Negative: Residential / B2C",
    trigger: "Search term contains: residencial, pessoa física, minha casa, apartamento",
    action: "Add as account-level negative (Broad Match)",
    threshold: "Any impression",
    approvalRequired: false,
  },
  {
    icon: <MinusCircle className="h-4 w-4 text-red-500" />,
    title: "Auto-Negative: Job Seekers",
    trigger: "Search term contains: emprego, vaga, estágio, trainee, concurso",
    action: "Add as account-level negative (Broad Match)",
    threshold: "Any impression",
    approvalRequired: false,
  },
  {
    icon: <MinusCircle className="h-4 w-4 text-red-500" />,
    title: "Auto-Negative: Mercado Livre Confusion",
    trigger: "Query: mercado livre compras, mercado pago, comprar no mercado livre",
    action: "Add as account-level negative (Exact Match)",
    threshold: "Any impression",
    approvalRequired: false,
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    title: "Promote: High-Intent Exact Match",
    trigger: "Phrase-match trigger with ≥3 conversions in 30 days AND CPA below account average",
    action: "Suggest adding as Exact Match keyword in same Ad Group",
    threshold: "≥3 conversions, CPA ≤ avg",
    approvalRequired: true,
  },
  {
    icon: <PauseCircle className="h-4 w-4 text-amber-500" />,
    title: "Pause: Zero-Conversion Spend",
    trigger: "Keyword has spent ≥ R$50 with 0 conversions in 30 days",
    action: "Pause keyword — flag for review",
    threshold: "R$50 spend, 0 conv",
    approvalRequired: true,
  },
  {
    icon: <PauseCircle className="h-4 w-4 text-amber-500" />,
    title: "Pause: Low CTR Warning",
    trigger: "Ad group CTR < 1.5% with ≥500 impressions in 14 days",
    action: "Flag for RSA headline review — do not pause automatically",
    threshold: "CTR < 1.5%, ≥500 imp",
    approvalRequired: true,
  },
];

const HUMAN_BOUNDARIES = [
  "Never pause campaigns automatically — only flag",
  "Never change bids automatically — only suggest",
  "Never add keywords automatically — only suggest Exact/Phrase",
  "Budget changes always require human approval",
  "Geo/language changes always require human approval",
  "Any change affecting >20% of account spend requires human review",
  "New ad group creation always requires human approval",
  "RSA pinning decisions always require human approval",
];

// ─── Action badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: ClassifyAction }) {
  const config: Record<ClassifyAction, { label: string; className: string }> = {
    KEEP: { label: "KEEP", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    ADD_NEGATIVE_ACCOUNT: { label: "NEG · ACCOUNT", className: "bg-red-100 text-red-700 border-red-200" },
    ADD_NEGATIVE_CAMPAIGN: { label: "NEG · CAMPAIGN", className: "bg-orange-100 text-orange-700 border-orange-200" },
    ADD_NEGATIVE_ADGROUP: { label: "NEG · AD GROUP", className: "bg-amber-100 text-amber-700 border-amber-200" },
    PROMOTE_TO_EXACT: { label: "PROMOTE → [EXACT]", className: "bg-blue-100 text-blue-700 border-blue-200" },
    PROMOTE_TO_PHRASE: { label: "PROMOTE → \"PHRASE\"", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    REVIEW_MANUALLY: { label: "REVIEW", className: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const c = config[action];
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border font-mono ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Export classified rows ───────────────────────────────────────────────────

function exportClassified(rows: SearchTermRow[]) {
  const header = ["Query", "Campaign", "Ad Group", "Impressions", "Clicks", "Conversions", "Cost (R$)", "Suggested Action", "Override Action", "Reason"];
  const data = rows.map(r => [
    r.query, r.campaign, r.adGroup,
    String(r.impressions), String(r.clicks), String(r.conversions), r.cost.toFixed(2),
    r.overrideAction ?? r.suggestedAction,
    r.overrideAction ? "MANUAL" : "AUTO",
    r.reason,
  ]);
  const csv = "\uFEFF" + [header, ...data].map(row => row.map(c => c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "SearchTerms_Classified.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PpcManager() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"rules" | "search-terms" | "neg-queue">("rules");
  const [rows, setRows] = useState<SearchTermRow[]>(DEMO_ROWS);
  const [filterAction, setFilterAction] = useState<ClassifyAction | "ALL">("ALL");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || !["admin", "ops"].includes(user.role)) {
    return <Redirect to="/admin" />;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseSearchTermsCsv(text);
      if (parsed.length > 0) {
        setRows(parsed);
        setIsDemoMode(false);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function setOverride(idx: number, action: ClassifyAction) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, overrideAction: action } : r));
  }

  function resetOverride(idx: number) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, overrideAction: undefined } : r));
  }

  const filteredRows = filterAction === "ALL" ? rows : rows.filter(r => (r.overrideAction ?? r.suggestedAction) === filterAction);

  const actionCounts = rows.reduce((acc, r) => {
    const a = r.overrideAction ?? r.suggestedAction;
    acc[a] = (acc[a] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const negQueue = rows.filter(r => {
    const a = r.overrideAction ?? r.suggestedAction;
    return a === "ADD_NEGATIVE_ACCOUNT" || a === "ADD_NEGATIVE_CAMPAIGN" || a === "ADD_NEGATIVE_ADGROUP";
  });

  const promoteQueue = rows.filter(r => {
    const a = r.overrideAction ?? r.suggestedAction;
    return a === "PROMOTE_TO_EXACT" || a === "PROMOTE_TO_PHRASE";
  });

  const TABS = [
    { key: "rules" as const, label: "Optimisation Rules" },
    { key: "search-terms" as const, label: `Search Terms ${rows.length > 0 ? `(${rows.length})` : ""}` },
    { key: "neg-queue" as const, label: `Negative Queue (${negQueue.length})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">PPC Manager</h1>
              <p className="text-xs text-slate-500">Manual optimisation mode — API access pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
              API Pending
            </Badge>
            <Link href="/admin/google-ads-launch-pack">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Launch Pack →
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`tab-${t.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Rules Tab ── */}
        {tab === "rules" && (
          <div className="space-y-6">

            {/* Daily Optimisation Rules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-500" /> Daily Optimisation Rules
                </CardTitle>
                <CardDescription className="text-xs">
                  Applied when Search Terms CSV is processed. Auto rules run immediately; approval-required rules create a review queue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {DAILY_RULES.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="mt-0.5 flex-shrink-0">{rule.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800">{rule.title}</p>
                        {rule.approvalRequired ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">Needs Approval</Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">Auto</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1"><span className="font-medium text-slate-600">Trigger:</span> {rule.trigger}</p>
                      <p className="text-xs text-slate-500"><span className="font-medium text-slate-600">Action:</span> {rule.action}</p>
                      <p className="text-xs text-slate-400"><span className="font-medium text-slate-500">Threshold:</span> {rule.threshold}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Human Approval Boundaries */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Human Approval Boundaries
                </CardTitle>
                <CardDescription className="text-xs text-amber-700">
                  These actions are never automated — always require explicit human approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {HUMAN_BOUNDARIES.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                      <ShieldAlert className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Classification Rules Reference */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-500" /> Ótima Classification Rules
                </CardTitle>
                <CardDescription className="text-xs">Rules used to classify incoming search terms from uploaded CSVs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { action: "ADD_NEGATIVE_ACCOUNT" as ClassifyAction, label: "Auto-Negative (Account)", rules: ["segunda via / boleto / ouvidoria / reclamação", "residencial / pessoa física / minha casa", "emprego / vaga / estágio / trainee", "curso / faculdade / universidade / TCC", "PDF / modelo / planilha / template", "mercado livre compras / mercado pago", "contabilidade / folha de pagamento / ERP / software"] },
                    { action: "PROMOTE_TO_EXACT" as ClassifyAction, label: "Promote → Exact", rules: ["como migrar para ACL / migração ACL", "diagnóstico energético / consultoria de energia", "desconto conta de luz empresa (with conversions)"] },
                    { action: "PROMOTE_TO_PHRASE" as ClassifyAction, label: "Promote → Phrase", rules: ["mercado livre de energia", "geração distribuída empresa", "energia por assinatura empresa"] },
                    { action: "KEEP" as ClassifyAction, label: "Keep", rules: ["empresa + economia/desconto/custo/redução", "energia + ACL/GDL/mercado livre/comercializadora", "condomínio/industrial/comercial context"] },
                    { action: "REVIEW_MANUALLY" as ClassifyAction, label: "Review Manually", rules: ["Matches no pattern — ambiguous commercial intent", "Energy-adjacent but not clearly B2B"] },
                  ].map(({ action, label, rules }) => (
                    <div key={action} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                      <ActionBadge action={action} />
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
                        <ul className="space-y-0.5">
                          {rules.map((r, i) => (
                            <li key={i} className="text-xs text-slate-500 flex items-start gap-1">
                              <span className="text-slate-300 mt-0.5">·</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Search Terms Tab ── */}
        {tab === "search-terms" && (
          <div className="space-y-5">
            {/* Upload card */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-500" />
                      Upload Google Ads Search Terms CSV
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Export from Google Ads: Reports → Predefined → Search Terms · Required columns: Search term, Campaign, Ad group, Impressions, Clicks, Conversions, Cost
                    </p>
                    {isDemoMode && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" /> Showing demo data — upload a real CSV to classify your search terms
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} data-testid="search-terms-file-input" />
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5 text-xs" data-testid="upload-csv-btn">
                      <Upload className="h-3.5 w-3.5" /> Upload CSV
                    </Button>
                    {rows.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => exportClassified(rows)} className="gap-1.5 text-xs" data-testid="export-classified-btn">
                        <Download className="h-3.5 w-3.5" /> Export Classified
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary stats */}
            {rows.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["KEEP", "ADD_NEGATIVE_ACCOUNT", "PROMOTE_TO_EXACT", "REVIEW_MANUALLY"] as ClassifyAction[]).map(a => {
                  const count = actionCounts[a] ?? 0;
                  const colors: Record<string, string> = {
                    KEEP: "text-emerald-600",
                    ADD_NEGATIVE_ACCOUNT: "text-red-600",
                    PROMOTE_TO_EXACT: "text-blue-600",
                    REVIEW_MANUALLY: "text-slate-500",
                  };
                  return (
                    <button
                      key={a}
                      onClick={() => setFilterAction(filterAction === a ? "ALL" : a)}
                      data-testid={`filter-${a.toLowerCase().replace(/_/g, "-")}`}
                      className={`text-left p-3 rounded-lg border transition-all ${filterAction === a ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    >
                      <p className={`text-2xl font-bold ${colors[a]}`}>{count}</p>
                      <ActionBadge action={a} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filter bar */}
            {rows.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Filter:</span>
                <Select value={filterAction} onValueChange={v => setFilterAction(v as ClassifyAction | "ALL")}>
                  <SelectTrigger className="w-52 h-8 text-xs" data-testid="action-filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All ({rows.length})</SelectItem>
                    {(["KEEP", "ADD_NEGATIVE_ACCOUNT", "ADD_NEGATIVE_CAMPAIGN", "ADD_NEGATIVE_ADGROUP", "PROMOTE_TO_EXACT", "PROMOTE_TO_PHRASE", "REVIEW_MANUALLY"] as ClassifyAction[]).map(a => (
                      <SelectItem key={a} value={a}>{a} ({actionCounts[a] ?? 0})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterAction !== "ALL" && (
                  <Button variant="ghost" size="sm" onClick={() => setFilterAction("ALL")} className="text-xs h-7 text-slate-400">
                    Clear filter
                  </Button>
                )}
              </div>
            )}

            {/* Table */}
            {rows.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="min-w-[220px]">Search Query</TableHead>
                          <TableHead className="min-w-[200px]">Campaign / Ad Group</TableHead>
                          <TableHead className="text-center w-20">Impr.</TableHead>
                          <TableHead className="text-center w-16">Clicks</TableHead>
                          <TableHead className="text-center w-20">Conv.</TableHead>
                          <TableHead className="text-center w-20">Cost</TableHead>
                          <TableHead className="min-w-[160px]">Suggested Action</TableHead>
                          <TableHead className="min-w-[180px]">Override</TableHead>
                          <TableHead className="min-w-[180px]">Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row, idx) => {
                          const realIdx = rows.indexOf(row);
                          const effective = row.overrideAction ?? row.suggestedAction;
                          return (
                            <TableRow key={idx} data-testid={`search-term-row-${idx}`} className="text-xs">
                              <TableCell className="font-mono text-slate-800 py-2">{row.query}</TableCell>
                              <TableCell className="text-slate-500 py-2">
                                <p className="truncate max-w-[190px]">{row.campaign}</p>
                                <p className="text-slate-400 truncate">{row.adGroup}</p>
                              </TableCell>
                              <TableCell className="text-center py-2 text-slate-600">{row.impressions}</TableCell>
                              <TableCell className="text-center py-2 text-slate-600">{row.clicks}</TableCell>
                              <TableCell className="text-center py-2">
                                <span className={row.conversions > 0 ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                                  {row.conversions}
                                </span>
                              </TableCell>
                              <TableCell className="text-center py-2 text-slate-600">R${row.cost.toFixed(2)}</TableCell>
                              <TableCell className="py-2"><ActionBadge action={effective} /></TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={row.overrideAction ?? ""}
                                    onValueChange={v => v ? setOverride(realIdx, v as ClassifyAction) : resetOverride(realIdx)}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-40" data-testid={`override-select-${idx}`}>
                                      <SelectValue placeholder="Override…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {row.overrideAction && <SelectItem value="">— Clear override —</SelectItem>}
                                      {(["KEEP", "ADD_NEGATIVE_ACCOUNT", "ADD_NEGATIVE_CAMPAIGN", "ADD_NEGATIVE_ADGROUP", "PROMOTE_TO_EXACT", "PROMOTE_TO_PHRASE", "REVIEW_MANUALLY"] as ClassifyAction[]).map(a => (
                                        <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {row.overrideAction && (
                                    <span className="text-amber-500" title="Manually overridden">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-slate-400 text-xs max-w-[180px]">{row.reason}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-slate-300">
                <CardContent className="py-12 text-center">
                  <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Upload a Search Terms CSV to classify queries</p>
                  <p className="text-xs text-slate-400 mt-1">Export from Google Ads → Reports → Predefined → Search Terms</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Negative Queue Tab ── */}
        {tab === "neg-queue" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">{negQueue.length} queries flagged for negative addition</h2>
                <p className="text-xs text-slate-500 mt-0.5">Review, then add these to Google Ads Editor manually or via the API once approved</p>
              </div>
              {negQueue.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportClassified(negQueue)}
                  className="gap-1.5 text-xs"
                  data-testid="export-neg-queue-btn"
                >
                  <Download className="h-3.5 w-3.5" /> Export Neg Queue CSV
                </Button>
              )}
            </div>

            {negQueue.length > 0 ? (
              <>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead>Search Query</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead className="text-center">Impressions</TableHead>
                          <TableHead className="text-center">Cost</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {negQueue.map((row, idx) => {
                          const action = row.overrideAction ?? row.suggestedAction;
                          return (
                            <TableRow key={idx} className="text-xs" data-testid={`neg-row-${idx}`}>
                              <TableCell className="font-mono text-slate-800 py-2">{row.query}</TableCell>
                              <TableCell className="py-2"><ActionBadge action={action} /></TableCell>
                              <TableCell className="py-2 text-slate-500 truncate max-w-[180px]">
                                {action === "ADD_NEGATIVE_ACCOUNT" ? "All campaigns" : row.campaign}
                              </TableCell>
                              <TableCell className="text-center py-2 text-slate-600">{row.impressions}</TableCell>
                              <TableCell className="text-center py-2 text-slate-600">R${row.cost.toFixed(2)}</TableCell>
                              <TableCell className="py-2 text-slate-400">{row.reason}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Promote queue */}
                {promoteQueue.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" /> Keyword Promotion Queue ({promoteQueue.length})
                      </CardTitle>
                      <CardDescription className="text-xs">Queries recommended for promotion to Exact or Phrase match</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-xs">
                            <TableHead>Search Query</TableHead>
                            <TableHead>Promote To</TableHead>
                            <TableHead>Ad Group</TableHead>
                            <TableHead className="text-center">Conversions</TableHead>
                            <TableHead>Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {promoteQueue.map((row, idx) => (
                            <TableRow key={idx} className="text-xs" data-testid={`promote-row-${idx}`}>
                              <TableCell className="font-mono text-slate-800 py-2">{row.query}</TableCell>
                              <TableCell className="py-2"><ActionBadge action={row.overrideAction ?? row.suggestedAction} /></TableCell>
                              <TableCell className="py-2 text-slate-500 truncate max-w-[180px]">{row.adGroup}</TableCell>
                              <TableCell className="text-center py-2">
                                <span className={row.conversions > 0 ? "text-emerald-600 font-semibold" : "text-slate-400"}>{row.conversions}</span>
                              </TableCell>
                              <TableCell className="py-2 text-slate-400">{row.reason}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed border-slate-300">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No negatives queued</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a Search Terms CSV in the Search Terms tab to generate the queue</p>
                </CardContent>
              </Card>
            )}

            {/* API roadmap note */}
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">API Roadmap — once developer token is approved</p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc ml-4">
                      <li>Auto-push approved negatives directly to Google Ads account</li>
                      <li>Pull live Search Terms data without manual CSV export</li>
                      <li>Monitor campaign performance in real time</li>
                      <li>Trigger bid recommendations based on CPA thresholds</li>
                      <li>Automated RSA performance grading</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
