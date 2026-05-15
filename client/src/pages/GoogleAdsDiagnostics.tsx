import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2, FlaskConical } from "lucide-react";
import { Redirect } from "wouter";

type DiagResult = Record<string, unknown>;

function BoolBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
      <XCircle className="w-3.5 h-3.5" /> No
    </span>
  );
}

function renderValue(val: unknown): React.ReactNode {
  if (typeof val === "boolean") return <BoolBadge value={val} />;
  if (typeof val === "string") {
    if (val === "success") return <span className="text-emerald-700 font-medium text-xs">{val}</span>;
    if (val.startsWith("failed")) return <span className="text-red-600 font-medium text-xs break-words">{val}</span>;
    return <span className="text-slate-700 text-xs break-words">{val}</span>;
  }
  if (typeof val === "number") return <span className="text-slate-700 text-xs">{val}</span>;
  if (val && typeof val === "object") return <ObjectBlock obj={val as Record<string, unknown>} />;
  return <span className="text-slate-400 text-xs italic">—</span>;
}

function ObjectBlock({ obj }: { obj: Record<string, unknown> }) {
  return (
    <div className="space-y-1.5 pl-2 border-l-2 border-slate-100 mt-1">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="flex flex-wrap items-start gap-2">
          <span className="text-slate-500 text-xs font-mono shrink-0">{k}</span>
          <span className="ml-auto text-right">{renderValue(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function GoogleAdsDiagnostics() {
  const { user, sessionId, isLoading } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<DiagResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastMode, setLastMode] = useState<"check" | "test" | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!user) return <Redirect to="/admin" />;

  async function run(testMode: boolean) {
    setLoading(true);
    setLastMode(testMode ? "test" : "check");
    try {
      const res = await fetch(`/api/admin/google-ads-diagnostics${testMode ? "?test=1" : ""}`, {
        headers: { ...(sessionId ? { "x-session-id": sessionId } : {}) },
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Request failed", description: data.error || `HTTP ${res.status}`, variant: "destructive" });
      } else {
        setResult(data);
      }
    } catch (e: any) {
      toast({ title: "Network error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const testResult = result?.test as Record<string, unknown> | undefined;
  const testSuccess = testResult?.success === true;
  const testFailed = testResult && !testSuccess;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/keyword-research">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Keyword Research
            </Button>
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <span className="font-semibold text-slate-900 text-sm">Google Ads Diagnostics</span>
          <Badge variant="outline" className="text-xs">Admin only</Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connection Check</CardTitle>
            <CardDescription>
              Verify credentials and API configuration. Use "Run Test Call" to make a live API request with one seed keyword.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              onClick={() => run(false)}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {loading && lastMode === "check" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Check Config
            </Button>
            <Button
              onClick={() => run(true)}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {loading && lastMode === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              Run Test Call
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {testResult && (
              <Card className={testSuccess ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-4 flex gap-3 items-start">
                  {testSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1 min-w-0">
                    <p className={`font-semibold text-sm ${testSuccess ? "text-emerald-800" : "text-red-800"}`}>
                      {testSuccess ? "API call succeeded" : "API call failed"}
                    </p>
                    {testSuccess && typeof testResult.keyword_ideas_returned === "number" && (
                      <p className="text-emerald-700 text-xs">{testResult.keyword_ideas_returned} keyword ideas returned for "mercado livre de energia"</p>
                    )}
                    {testFailed && (
                      <p className="text-red-700 text-xs break-words whitespace-pre-wrap">
                        {String(testResult.error || testResult.message || JSON.stringify(testResult))}
                      </p>
                    )}
                    {testFailed && String(testResult.error || "").includes("sunset") && (
                      <p className="text-red-600 text-xs mt-1 pt-1 border-t border-red-200">
                        Set <code className="bg-red-100 px-1 rounded">GOOGLE_ADS_API_VERSION</code> to a supported version and restart the server. Current supported versions: <a href="https://developers.google.com/google-ads/api/docs/sunset-dates" target="_blank" rel="noreferrer" className="underline">see docs</a>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Credential Check</CardTitle>
              </CardHeader>
              <CardContent>
                {result.secrets && typeof result.secrets === "object" && (
                  <ObjectBlock obj={result.secrets as Record<string, unknown>} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">api_version</span>
                  <Badge variant="secondary" className="font-mono text-xs">{String(result.api_version ?? "—")}</Badge>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs text-slate-500 font-mono shrink-0">endpoint_url</span>
                  <span className="text-xs text-slate-700 font-mono text-right break-all">{String(result.endpoint_url ?? "—")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">access_token</span>
                  {renderValue(result.access_token_generation)}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!result && !loading && (
          <p className="text-center text-slate-400 text-sm py-8">Click "Check Config" or "Run Test Call" to begin</p>
        )}
      </div>
    </div>
  );
}
