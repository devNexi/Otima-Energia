import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  Filter,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

type Track = {
  id: number;
  dealId: string;
  type: string;
  status: string;
  partnerName: string | null;
  nextActionText: string | null;
  nextActionAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  deal: {
    id: string;
    status: string;
    companyName: string;
  };
};

const TRACK_TYPES = ["ALL", "GDL", "ACL", "ACR", "OTHER"] as const;

const trackTypeColors: Record<string, string> = {
  GDL: "bg-green-100 text-green-800 border-green-200",
  ACL: "bg-blue-100 text-blue-800 border-blue-200",
  ACR: "bg-purple-100 text-purple-800 border-purple-200",
  OTHER: "bg-gray-100 text-gray-800 border-gray-200",
};

function formatStatus(status: string): string {
  const cleaned = status.replace(/^(GDL_|ACL_|ACR_|OTHER_)/i, "");
  return cleaned
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function isOverdue(nextActionAt: string | null): boolean {
  if (!nextActionAt) return false;
  return new Date(nextActionAt) < new Date();
}

export default function TracksQueue() {
  const { user } = useAuth();
  const { language } = useI18n();
  const [, setLocation] = useLocation();

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tracks");
      return res.json();
    },
    enabled: !!user,
  });

  const availableStatuses = useMemo(() => {
    if (!tracks) return [];
    const statuses = new Set<string>();
    tracks.forEach((t) => {
      if (typeFilter === "ALL" || t.type === typeFilter) {
        statuses.add(t.status);
      }
    });
    return Array.from(statuses).sort();
  }, [tracks, typeFilter]);

  const filteredTracks = useMemo(() => {
    if (!tracks) return [];
    let result = [...tracks];

    if (typeFilter !== "ALL") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (overdueOnly) {
      result = result.filter((t) => isOverdue(t.nextActionAt));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.deal?.companyName?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [tracks, typeFilter, statusFilter, overdueOnly, searchQuery]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2" data-testid="text-login-required">
            {language === "pt"
              ? "Autenticação necessária"
              : "Authentication required"}
          </h2>
          <p className="text-muted-foreground">
            {language === "pt"
              ? "Faça login para acessar o pipeline de tracks."
              : "Please log in to access the tracks pipeline."}
          </p>
          <Button
            className="mt-4"
            onClick={() => setLocation("/admin")}
            data-testid="button-go-login"
          >
            {language === "pt" ? "Ir para Login" : "Go to Login"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          data-testid="text-page-title"
        >
          <GitBranch className="h-6 w-6" />
          {language === "pt" ? "Pipeline de Tracks" : "Tracks Pipeline"}
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-description">
          {language === "pt"
            ? "Visão geral de todos os tracks de negócios ativos"
            : "Overview of all active deal tracks across deals"}
        </p>
      </div>

      <div
        className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg border"
        data-testid="filter-bar"
      >
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground mr-1">
            {language === "pt" ? "Tipo:" : "Type:"}
          </span>
          {TRACK_TYPES.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTypeFilter(type);
                setStatusFilter("ALL");
              }}
              data-testid={`button-filter-type-${type.toLowerCase()}`}
            >
              {type === "ALL" ? (language === "pt" ? "Todos" : "All") : type}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor="status-filter"
            className="text-sm text-muted-foreground"
          >
            Status:
          </Label>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger
              className="w-[200px] h-9"
              data-testid="select-status-filter"
            >
              <SelectValue
                placeholder={language === "pt" ? "Todos" : "All"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" data-testid="select-status-all">
                {language === "pt" ? "Todos" : "All"}
              </SelectItem>
              {availableStatuses.map((s) => (
                <SelectItem key={s} value={s} data-testid={`select-status-${s}`}>
                  {formatStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="overdue-only"
            checked={overdueOnly}
            onCheckedChange={(checked) => setOverdueOnly(checked === true)}
            data-testid="checkbox-overdue-only"
          />
          <Label htmlFor="overdue-only" className="text-sm cursor-pointer">
            {language === "pt" ? "Apenas atrasados" : "Overdue only"}
          </Label>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              language === "pt"
                ? "Buscar por empresa..."
                : "Search by company..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            data-testid="input-search-company"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            data-testid="spinner-loading"
          />
        </div>
      ) : filteredTracks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-64 text-muted-foreground"
          data-testid="empty-state"
        >
          <GitBranch className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">
            {language === "pt"
              ? "Nenhum track encontrado"
              : "No tracks found"}
          </p>
          <p className="text-sm mt-1">
            {language === "pt"
              ? "Ajuste os filtros ou crie novos tracks nos deals."
              : "Adjust filters or create new tracks in deals."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm" data-testid="table-tracks">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">
                  {language === "pt" ? "Empresa" : "Company"}
                </th>
                <th className="text-left p-3 font-medium">
                  {language === "pt" ? "Tipo" : "Type"}
                </th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">
                  {language === "pt" ? "Parceiro" : "Partner"}
                </th>
                <th className="text-left p-3 font-medium">
                  {language === "pt" ? "Próxima Ação" : "Next Action"}
                </th>
                <th className="text-left p-3 font-medium">
                  {language === "pt" ? "Atualizado" : "Updated"}
                </th>
                <th className="text-left p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((track) => {
                const overdue = isOverdue(track.nextActionAt);
                return (
                  <tr
                    key={track.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                    data-testid={`row-track-${track.id}`}
                  >
                    <td className="p-3 font-medium" data-testid={`text-company-${track.id}`}>
                      {track.deal?.companyName || "—"}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={trackTypeColors[track.type] || trackTypeColors.OTHER}
                        data-testid={`badge-type-${track.id}`}
                      >
                        {track.type}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" data-testid={`badge-status-${track.id}`}>
                        {formatStatus(track.status)}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground" data-testid={`text-partner-${track.id}`}>
                      {track.partnerName || "—"}
                    </td>
                    <td className="p-3">
                      {track.nextActionText ? (
                        <div
                          className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}
                          data-testid={`text-next-action-${track.id}`}
                        >
                          {overdue && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
                          <span className="line-clamp-1">{track.nextActionText}</span>
                          {track.nextActionAt && (
                            <span className="text-xs whitespace-nowrap ml-1">
                              <Clock className="h-3 w-3 inline mr-0.5" />
                              {new Date(track.nextActionAt).toLocaleDateString(
                                language === "pt" ? "pt-BR" : "en-US"
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap" data-testid={`text-updated-${track.id}`}>
                      {track.updatedAt
                        ? new Date(track.updatedAt).toLocaleDateString(
                            language === "pt" ? "pt-BR" : "en-US"
                          )
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setLocation(`/admin/deals`)}
                        data-testid={`button-view-deal-${track.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground" data-testid="text-track-count">
        {language === "pt"
          ? `${filteredTracks.length} track(s) encontrado(s)`
          : `${filteredTracks.length} track(s) found`}
      </div>
    </div>
  );
}
