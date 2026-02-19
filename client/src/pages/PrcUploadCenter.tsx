import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  X,
  FileUp,
  Zap,
  RotateCcw,
  Bug,
  Download,
  Filter,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Link } from "wouter";

const SUBMARKETS = ["SECO", "SUL", "NNE", "NORTE"];
const SOURCES = ["Email", "Portal", "Direct Upload", "API"];
const MAX_CONCURRENT_UPLOADS = 3;
const ROWS_PER_PAGE = 10;

interface PrcDocument {
  id: number;
  supplierId: number;
  supplierName?: string;
  supplierStatus?: string;
  referenceMonth: string;
  originalFilename: string;
  fileUrl: string | null;
  parseStatus: string;
  parseConfidence: number | null;
  rowsExtracted: number;
  rowsFlagged: number;
  notes: string | null;
  submarketHint: string | null;
  uploadedByUserId: string | null;
  createdAt: string;
}

interface Supplier {
  id: number;
  name: string;
  shortCode: string;
  status?: string;
  source?: string;
}

interface FileUploadState {
  file: File;
  supplierId: number | null;
  referenceMonth: string;
  submarketHint: string;
  source: string;
  notes: string;
  status: "pending" | "uploading" | "processing" | "success" | "error";
  progress: number;
  error?: string;
  documentId?: number;
}

type StatusFilter = "ALL" | "PARSING" | "FAILED" | "NEEDS_REVIEW" | "PARSED" | "VERIFIED";

function generateCsv(rows: any[]): string {
  const headers = ["submarket", "productType", "termMonths", "priceRPerMWh", "confidence", "isOutlierFlag", "outlierReason"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    });
    lines.push(vals.join(","));
  }
  return lines.join("\n");
}

function downloadCsvBlob(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PrcUploadCenter() {
  const { user, isAuthenticated, isLoading: authLoading, sessionId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upload" | "queue">("upload");
  const [uploadQueue, setUploadQueue] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [debugDocId, setDebugDocId] = useState<number | null>(null);
  const [debugRowPage, setDebugRowPage] = useState(0);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [debugJsonOpen, setDebugJsonOpen] = useState(false);
  const [batchReparseLoading, setBatchReparseLoading] = useState<string | null>(null);
  const [exportingDocId, setExportingDocId] = useState<number | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const isProcessingRef = useRef(false);

  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [defaultSupplierId, setDefaultSupplierId] = useState<number | null>(null);
  const [defaultSubmarket, setDefaultSubmarket] = useState<string>("SECO");
  const [defaultSource, setDefaultSource] = useState<string>("Email");
  const [defaultNotes, setDefaultNotes] = useState<string>("");

  const { data: suppliersData } = useQuery<{ success: boolean; suppliers: Supplier[] }>({
    queryKey: ["/api/suppliers"],
    enabled: isAuthenticated
  });

  const { data: documentsData, isLoading: docsLoading, refetch: refetchDocs } = useQuery<{ success: boolean; documents: PrcDocument[] }>({
    queryKey: ["/api/prc/documents"],
    enabled: isAuthenticated,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents || [];
      return docs.some(d => d.parseStatus === "PARSING") ? 5000 : false;
    },
  });

  const suppliers = suppliersData?.suppliers || [];
  const documents = documentsData?.documents || [];

  const filteredDocuments = statusFilter === "ALL"
    ? documents
    : documents.filter(d => d.parseStatus === statusFilter);

  const reparseMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await fetch(`/api/prc/documents/${docId}/reparse`, {
        method: "POST",
        headers: { "x-session-id": sessionId || "" },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Re-parse failed");
      }
      return res.json();
    },
    onSuccess: (_, docId) => {
      toast.success("Re-parse job queued");
      queryClient.invalidateQueries({ queryKey: ["/api/prc/documents"] });
      if (debugDocId === docId) {
        queryClient.invalidateQueries({ queryKey: ["/api/prc/documents", docId, "debug"] });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data: debugData, isLoading: debugLoading } = useQuery({
    queryKey: ["/api/prc/documents", debugDocId, "debug"],
    queryFn: async () => {
      const res = await fetch(`/api/prc/documents/${debugDocId}/debug`, { headers: { "x-session-id": sessionId || "" }, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch debug info");
      return res.json();
    },
    enabled: debugDocId !== null,
  });

  useEffect(() => {
    setDebugRowPage(0);
    setRawTextOpen(false);
    setDebugJsonOpen(false);
  }, [debugDocId]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, supplierId, referenceMonth, submarketHint, source, notes }: {
      file: File;
      supplierId?: number;
      referenceMonth: string;
      submarketHint: string;
      source: string;
      notes: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (supplierId) {
        formData.append("supplierId", supplierId.toString());
      }
      formData.append("referenceMonth", referenceMonth);
      formData.append("submarketHint", submarketHint);
      formData.append("source", source);
      formData.append("notes", notes);
      formData.append("autoParse", "true");

      const res = await fetch("/api/prc/documents/upload", {
        method: "POST",
        headers: { "x-session-id": sessionId || "" },
        body: formData,
        credentials: "include"
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    }
  });

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === "application/pdf" || f.type.startsWith("image/")
    );

    if (files.length === 0) {
      toast.error("Only PDF and image files are supported");
      return;
    }

    const newItems: FileUploadState[] = files.map(file => ({
      file,
      supplierId: defaultSupplierId,
      referenceMonth: defaultMonth,
      submarketHint: defaultSubmarket,
      source: defaultSource,
      notes: defaultNotes,
      status: "pending",
      progress: 0
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    toast.success(`Added ${files.length} file(s) to upload queue`);
  }, [defaultSupplierId, defaultMonth, defaultSubmarket, defaultSource, defaultNotes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      f => f.type === "application/pdf" || f.type.startsWith("image/")
    );

    if (files.length === 0) {
      toast.error("Only PDF and image files are supported");
      return;
    }

    const newItems: FileUploadState[] = files.map(file => ({
      file,
      supplierId: defaultSupplierId,
      referenceMonth: defaultMonth,
      submarketHint: defaultSubmarket,
      source: defaultSource,
      notes: defaultNotes,
      status: "pending",
      progress: 0
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    toast.success(`Added ${files.length} file(s) to upload queue`);
    e.target.value = "";
  };

  const updateQueueItem = (index: number, updates: Partial<FileUploadState>) => {
    setUploadQueue(prev => prev.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    ));
  };

  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (item: FileUploadState, index: number) => {
    updateQueueItem(index, { status: "uploading", progress: 20 });
    try {
      updateQueueItem(index, { progress: 50 });
      const result = await uploadMutation.mutateAsync({
        file: item.file,
        supplierId: item.supplierId || undefined,
        referenceMonth: item.referenceMonth,
        submarketHint: item.submarketHint,
        source: item.source,
        notes: item.notes
      });
      updateQueueItem(index, {
        status: "success",
        progress: 100,
        documentId: result.document?.id
      });
      toast.success(`${item.file.name} uploaded — parsing job queued`);
    } catch (error: any) {
      updateQueueItem(index, {
        status: "error",
        error: error.message || "Upload failed"
      });
    }
  };

  const processQueue = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const pendingIndices: number[] = [];
    uploadQueue.forEach((item, i) => {
      if (item.status === "pending") pendingIndices.push(i);
    });

    if (pendingIndices.length === 0) {
      toast.error("No pending files to upload");
      isProcessingRef.current = false;
      return;
    }

    let i = 0;
    while (i < pendingIndices.length) {
      const batch = pendingIndices.slice(i, i + MAX_CONCURRENT_UPLOADS);
      const currentQueue = uploadQueue;
      await Promise.all(
        batch.map(idx => uploadSingleFile(currentQueue[idx], idx))
      );
      i += MAX_CONCURRENT_UPLOADS;
    }

    toast.success("Queue processing complete");
    refetchDocs();
    isProcessingRef.current = false;
  };

  const handleBatchReparse = async (targetStatus: string) => {
    const targets = filteredDocuments.filter(d => d.parseStatus === targetStatus);
    if (targets.length === 0) {
      toast.info(`No ${targetStatus} documents found`);
      return;
    }

    setBatchReparseLoading(targetStatus);
    let success = 0;
    let failed = 0;

    for (const doc of targets) {
      try {
        await fetch(`/api/prc/documents/${doc.id}/reparse`, {
          method: "POST",
          headers: { "x-session-id": sessionId || "" },
          credentials: "include",
        });
        success++;
        toast.info(`Re-parsed ${success}/${targets.length}...`);
      } catch {
        failed++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/prc/documents"] });
    toast.success(`Batch re-parse complete: ${success} queued, ${failed} failed`);
    setBatchReparseLoading(null);
  };

  const handleDownloadCsv = async (doc: PrcDocument) => {
    setExportingDocId(doc.id);
    try {
      const res = await fetch(`/api/prc/documents/${doc.id}/rows`, { headers: { "x-session-id": sessionId || "" }, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rows");
      const data = await res.json();
      const rows = data.rows || [];
      if (rows.length === 0) {
        toast.info("No rows to export");
        return;
      }
      const csv = generateCsv(rows);
      const safeName = doc.originalFilename.replace(/[^a-zA-Z0-9_.-]/g, "_");
      downloadCsvBlob(csv, `prc_${doc.id}_${safeName}.csv`);
      toast.success("CSV downloaded");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExportingDocId(null);
    }
  };

  const handleExportAllCsv = async () => {
    setExportingAll(true);
    try {
      let allRows: any[] = [];
      for (const doc of filteredDocuments) {
        try {
          const res = await fetch(`/api/prc/documents/${doc.id}/rows`, { headers: { "x-session-id": sessionId || "" }, credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.rows) allRows = allRows.concat(data.rows);
          }
        } catch {}
      }
      if (allRows.length === 0) {
        toast.info("No rows to export");
        return;
      }
      const csv = generateCsv(allRows);
      downloadCsvBlob(csv, `prc_all_rows_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Exported ${allRows.length} rows`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExportingAll(false);
    }
  };

  const handleCopyDebugBundle = () => {
    if (!debugData?.debug) return;
    const d = debugData.debug;
    const bundle = {
      docId: d.id,
      originalFilename: d.originalFilename,
      fileStorageKey: d.fileStorageKey,
      parseStatus: d.parseStatus,
      parseConfidence: d.parseConfidence,
      parseErrors: d.parseErrors,
      rowCount: d.rowCount,
      parseDebugJson: d.parseDebugJson,
    };
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    toast.success("Debug bundle copied to clipboard");
  };

  const getStatusBadge = (parseStatus: string) => {
    switch (parseStatus) {
      case "UPLOADED":
        return <Badge variant="secondary" data-testid="badge-status-uploaded"><Clock className="h-3 w-3 mr-1" /> Uploaded</Badge>;
      case "PARSING":
        return <Badge className="bg-blue-100 text-blue-700 animate-pulse" data-testid="badge-status-parsing"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Parsing...</Badge>;
      case "PARSED":
        return <Badge className="bg-green-100 text-green-700" data-testid="badge-status-parsed"><CheckCircle2 className="h-3 w-3 mr-1" /> Parsed</Badge>;
      case "NEEDS_REVIEW":
        return <Badge className="bg-yellow-100 text-yellow-700" data-testid="badge-status-needs-review"><AlertCircle className="h-3 w-3 mr-1" /> Needs Review</Badge>;
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-700" data-testid="badge-status-verified"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "PUBLISHED":
        return <Badge className="bg-purple-100 text-purple-700" data-testid="badge-status-published"><Zap className="h-3 w-3 mr-1" /> Published</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700" data-testid="badge-status-failed"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-unknown">{parseStatus}</Badge>;
    }
  };

  const getDebugDuration = () => {
    if (!debugData?.debug?.parseStartedAt || !debugData?.debug?.parseCompletedAt) return null;
    const start = new Date(debugData.debug.parseStartedAt).getTime();
    const end = new Date(debugData.debug.parseCompletedAt).getTime();
    const diffMs = end - start;
    if (diffMs < 1000) return `${diffMs}ms`;
    return `${(diffMs / 1000).toFixed(1)}s`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !["admin", "ops"].includes(user.role)) {
    return <Redirect to="/admin" />;
  }

  const debugRows = debugData?.debug?.rows || [];
  const debugRowPageCount = Math.ceil(debugRows.length / ROWS_PER_PAGE);
  const debugRowsSlice = debugRows.slice(debugRowPage * ROWS_PER_PAGE, (debugRowPage + 1) * ROWS_PER_PAGE);

  const failedCount = documents.filter(d => d.parseStatus === "FAILED").length;
  const needsReviewCount = documents.filter(d => d.parseStatus === "NEEDS_REVIEW").length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/benchmarks">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-prc-center">
              <FileUp className="h-6 w-6" />
              PRC Upload Center
            </h1>
            <p className="text-muted-foreground">
              Upload and process supplier price reference circulars
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "queue")}>
          <TabsList className="mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-upload">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2" data-testid="tab-queue">
              <FileText className="h-4 w-4" />
              Document Queue ({documents.filter(d => d.parseStatus === "PARSED" || d.parseStatus === "NEEDS_REVIEW").length} pending review)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Drop Zone</CardTitle>
                    <CardDescription>
                      Drag and drop PDF or image files, or click to browse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => document.getElementById("file-input")?.click()}
                      data-testid="dropzone"
                    >
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-lg font-medium mb-2">
                        {isDragging ? "Drop files here" : "Drag files here or click to upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF, JPG, PNG files (up to 20 at once)
                      </p>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileSelect}
                        data-testid="input-file"
                      />
                    </div>

                    {uploadQueue.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Upload Queue ({uploadQueue.length} files)</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadQueue([])}
                              data-testid="button-clear-queue"
                            >
                              Clear All
                            </Button>
                            <Button
                              size="sm"
                              onClick={processQueue}
                              disabled={isProcessingRef.current || !uploadQueue.some(i => i.status === "pending")}
                              data-testid="button-process-queue"
                            >
                              {isProcessingRef.current ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing</>
                              ) : (
                                <><Zap className="h-4 w-4 mr-2" /> Process All</>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {uploadQueue.map((item, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-start gap-4">
                                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-medium truncate" data-testid={`text-filename-${index}`}>
                                      {item.file.name}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      ({(item.file.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <Select
                                      value={item.supplierId?.toString() || "auto"}
                                      onValueChange={(v) => updateQueueItem(index, { supplierId: v === "auto" ? null : parseInt(v) })}
                                    >
                                      <SelectTrigger className="h-8" data-testid={`select-supplier-${index}`}>
                                        <SelectValue placeholder="Supplier (optional)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="auto">Auto-detect from filename</SelectItem>
                                        {suppliers.map(s => (
                                          <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <Input
                                      type="month"
                                      value={item.referenceMonth}
                                      onChange={(e) => updateQueueItem(index, { referenceMonth: e.target.value })}
                                      className="h-8"
                                      data-testid={`input-month-${index}`}
                                    />
                                  </div>

                                  {item.status !== "pending" && (
                                    <Progress value={item.progress} className="h-2 mb-2" />
                                  )}

                                  {item.status === "error" && (
                                    <p className="text-sm text-red-600">{item.error}</p>
                                  )}
                                  {item.status === "success" && (
                                    <p className="text-sm text-green-600">Uploaded successfully</p>
                                  )}
                                  {item.status === "processing" && (
                                    <p className="text-sm text-blue-600">Auto-parsing in progress...</p>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFromQueue(index)}
                                  disabled={item.status === "uploading" || item.status === "processing"}
                                  data-testid={`button-remove-${index}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Default Settings</CardTitle>
                    <CardDescription>
                      Applied to new files added to queue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="default-supplier">Default Supplier (optional)</Label>
                      <Select
                        value={defaultSupplierId?.toString() || "auto"}
                        onValueChange={(v) => setDefaultSupplierId(v === "auto" ? null : parseInt(v))}
                      >
                        <SelectTrigger id="default-supplier" data-testid="select-default-supplier">
                          <SelectValue placeholder="Auto-detect from filename" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect from filename</SelectItem>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="default-submarket">Submarket Hint</Label>
                      <Select
                        value={defaultSubmarket}
                        onValueChange={setDefaultSubmarket}
                      >
                        <SelectTrigger id="default-submarket" data-testid="select-default-submarket">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBMARKETS.map(sm => (
                            <SelectItem key={sm} value={sm}>{sm}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="default-source">Source</Label>
                      <Select
                        value={defaultSource}
                        onValueChange={setDefaultSource}
                      >
                        <SelectTrigger id="default-source" data-testid="select-default-source">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map(src => (
                            <SelectItem key={src} value={src}>{src}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="default-notes">Default Notes</Label>
                      <Textarea
                        id="default-notes"
                        value={defaultNotes}
                        onChange={(e) => setDefaultNotes(e.target.value)}
                        placeholder="Optional notes for all uploads..."
                        rows={3}
                        data-testid="input-default-notes"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>
                      PRC documents uploaded for processing
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger className="w-[160px] h-8" data-testid="select-status-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="PARSING">Parsing</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                          <SelectItem value="PARSED">Parsed</SelectItem>
                          <SelectItem value="VERIFIED">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBatchReparse("FAILED")}
                      disabled={batchReparseLoading !== null || failedCount === 0}
                      data-testid="button-reparse-all-failed"
                    >
                      {batchReparseLoading === "FAILED" ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-1" />
                      )}
                      Re-parse Failed ({failedCount})
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBatchReparse("NEEDS_REVIEW")}
                      disabled={batchReparseLoading !== null || needsReviewCount === 0}
                      data-testid="button-reparse-all-needs-review"
                    >
                      {batchReparseLoading === "NEEDS_REVIEW" ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-1" />
                      )}
                      Re-parse Needs Review ({needsReviewCount})
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportAllCsv}
                      disabled={exportingAll || filteredDocuments.length === 0}
                      data-testid="button-export-all-csv"
                    >
                      {exportingAll ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Export All Rows CSV
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => refetchDocs()} data-testid="button-refresh-docs">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {statusFilter === "ALL" ? "No documents uploaded yet" : `No ${statusFilter} documents`}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc) => (
                        <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/prc/review/${doc.id}`}>
                              <span className="text-primary hover:underline cursor-pointer">
                                {doc.originalFilename}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              {doc.supplierName || `Supplier #${doc.supplierId}`}
                              {doc.supplierStatus === 'prc_only' && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  PRC-only
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{doc.referenceMonth}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(doc.parseStatus)}
                              {doc.parseStatus === "PARSING" && (
                                <div className="w-full">
                                  <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                                  </div>
                                  <span className="text-[10px] text-blue-500">Extracting data...</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {doc.parseConfidence != null
                              ? `${doc.parseConfidence}%`
                              : "-"}
                          </TableCell>
                          <TableCell>{doc.rowsExtracted || 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={doc.parseStatus === "PARSING" || reparseMutation.isPending}
                                onClick={() => reparseMutation.mutate(doc.id)}
                                title="Re-parse"
                                data-testid={`button-reparse-${doc.id}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDebugDocId(doc.id)}
                                title="Debug view"
                                data-testid={`button-debug-${doc.id}`}
                              >
                                <Bug className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDownloadCsv(doc)}
                                disabled={exportingDocId === doc.id || doc.rowsExtracted === 0}
                                title="Download CSV"
                                data-testid={`button-csv-${doc.id}`}
                              >
                                {exportingDocId === doc.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={debugDocId !== null} onOpenChange={(open) => !open && setDebugDocId(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Parse Debug View
                {debugData?.debug?.originalFilename && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    — {debugData.debug.originalFilename}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            {debugLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : debugData?.debug ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium block text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</span>
                    {getStatusBadge(debugData.debug.parseStatus)}
                  </div>
                  <div>
                    <span className="font-medium block text-muted-foreground text-xs uppercase tracking-wide mb-1">Rows</span>
                    {debugData.debug.rowCount} extracted, {debugData.debug.rowsFlagged || 0} flagged
                  </div>
                  <div>
                    <span className="font-medium block text-muted-foreground text-xs uppercase tracking-wide mb-1">Confidence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={debugData.debug.parseConfidence ?? 0} className="h-2 flex-1" />
                      <span className="font-mono text-sm">{debugData.debug.parseConfidence ?? 0}%</span>
                    </div>
                  </div>
                  {debugData.debug.parseStartedAt && (
                    <div>
                      <span className="font-medium block text-muted-foreground text-xs uppercase tracking-wide mb-1">Parse Started</span>
                      {new Date(debugData.debug.parseStartedAt).toLocaleString()}
                    </div>
                  )}
                  {debugData.debug.parseCompletedAt && (
                    <div>
                      <span className="font-medium block text-muted-foreground text-xs uppercase tracking-wide mb-1">Parse Completed</span>
                      {new Date(debugData.debug.parseCompletedAt).toLocaleString()}
                    </div>
                  )}
                  {getDebugDuration() && (
                    <div>
                      <span className="font-medium block text-muted-foreground text-xs uppercase tracking-wide mb-1">Duration</span>
                      {getDebugDuration()}
                    </div>
                  )}
                </div>

                {debugData.debug.parseErrors && (debugData.debug.parseErrors as any[]).length > 0 && (
                  <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Validation Errors ({(debugData.debug.parseErrors as any[]).length})
                    </h4>
                    <div className="space-y-1">
                      {(debugData.debug.parseErrors as string[]).map((e, i) => (
                        <div key={i} className="text-sm text-red-700 font-mono">{e}</div>
                      ))}
                    </div>
                  </div>
                )}

                {debugData.debug.rawExtractedText && (
                  <Collapsible open={rawTextOpen} onOpenChange={setRawTextOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-2 h-auto" data-testid="button-toggle-raw-text">
                        {rawTextOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium">Raw Extracted Text</span>
                        <span className="text-xs text-muted-foreground ml-2">({debugData.debug.rawExtractedText.length} chars)</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="bg-gray-50 border rounded p-3 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap mt-2" data-testid="text-raw-extracted">
                        {debugData.debug.rawExtractedText}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {debugData.debug.parseDebugJson && (
                  <Collapsible open={debugJsonOpen} onOpenChange={setDebugJsonOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-2 h-auto" data-testid="button-toggle-debug-json">
                        {debugJsonOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium">Parse Debug JSON</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="bg-gray-50 border rounded p-3 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap mt-2" data-testid="text-debug-json">
                        {JSON.stringify(debugData.debug.parseDebugJson, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {debugRows.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Extracted Rows ({debugRows.length})</h4>
                      {debugRowPageCount > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={debugRowPage === 0}
                            onClick={() => setDebugRowPage(p => p - 1)}
                            data-testid="button-debug-rows-prev"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {debugRowPage + 1} / {debugRowPageCount}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={debugRowPage >= debugRowPageCount - 1}
                            onClick={() => setDebugRowPage(p => p + 1)}
                            data-testid="button-debug-rows-next"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Submarket</TableHead>
                            <TableHead className="text-xs">Product</TableHead>
                            <TableHead className="text-xs">Term</TableHead>
                            <TableHead className="text-xs">Price (R$/MWh)</TableHead>
                            <TableHead className="text-xs">Confidence</TableHead>
                            <TableHead className="text-xs">Flags</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debugRowsSlice.map((r: any) => (
                            <TableRow key={r.id} data-testid={`row-debug-${r.id}`}>
                              <TableCell className="text-xs">{r.submarket}</TableCell>
                              <TableCell className="text-xs">{r.productType}</TableCell>
                              <TableCell className="text-xs">{r.termMonths || "-"}</TableCell>
                              <TableCell className="text-xs font-mono">{r.priceRPerMWh}</TableCell>
                              <TableCell className="text-xs">{r.confidence}%</TableCell>
                              <TableCell className="text-xs">
                                {r.isOutlierFlag && (
                                  <Badge variant="outline" className="text-xs text-orange-600">
                                    {r.outlierReason || "Outlier"}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDebugBundle}
                    data-testid="button-copy-debug-bundle"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Debug Bundle
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No debug data available
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
