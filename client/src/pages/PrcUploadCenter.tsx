import { useState, useCallback } from "react";
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
  Zap
} from "lucide-react";
import { Link } from "wouter";

const SUBMARKETS = ["SECO", "SUL", "NNE", "NORTE"];
const SOURCES = ["Email", "Portal", "Direct Upload", "API"];

interface PrcDocument {
  id: number;
  supplierId: number;
  supplierName?: string;
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

export default function PrcUploadCenter() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upload" | "queue">("upload");
  const [uploadQueue, setUploadQueue] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
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
    enabled: isAuthenticated
  });

  const suppliers = suppliersData?.suppliers || [];
  const documents = documentsData?.documents || [];

  const uploadMutation = useMutation({
    mutationFn: async ({ file, supplierId, referenceMonth, submarketHint, source, notes }: { 
      file: File;
      supplierId: number;
      referenceMonth: string;
      submarketHint: string;
      source: string;
      notes: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("supplierId", supplierId.toString());
      formData.append("referenceMonth", referenceMonth);
      formData.append("submarketHint", submarketHint);
      formData.append("source", source);
      formData.append("notes", notes);
      formData.append("autoParse", "true");

      const res = await fetch("/api/prc/documents/upload", {
        method: "POST",
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

  const processQueue = async () => {
    const pendingItems = uploadQueue.filter(item => item.status === "pending");
    
    if (pendingItems.length === 0) {
      toast.error("No pending files to upload");
      return;
    }

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status !== "pending") continue;

      if (!item.supplierId) {
        updateQueueItem(i, { status: "error", error: "Supplier is required" });
        continue;
      }

      updateQueueItem(i, { status: "uploading", progress: 20 });

      try {
        updateQueueItem(i, { progress: 50 });
        
        const result = await uploadMutation.mutateAsync({
          file: item.file,
          supplierId: item.supplierId,
          referenceMonth: item.referenceMonth,
          submarketHint: item.submarketHint,
          source: item.source,
          notes: item.notes
        });

        updateQueueItem(i, { 
          status: result.parsing ? "processing" : "success", 
          progress: 100,
          documentId: result.document?.id 
        });

      } catch (error: any) {
        updateQueueItem(i, { 
          status: "error", 
          error: error.message || "Upload failed" 
        });
      }
    }

    toast.success("Queue processing complete");
    refetchDocs();
  };

  const getStatusBadge = (parseStatus: string) => {
    switch (parseStatus) {
      case "UPLOADED":
        return <Badge variant="secondary" data-testid="badge-status-uploaded"><Clock className="h-3 w-3 mr-1" /> Uploaded</Badge>;
      case "PARSING":
        return <Badge className="bg-blue-100 text-blue-700" data-testid="badge-status-parsing"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Parsing</Badge>;
      case "PARSED":
        return <Badge className="bg-yellow-100 text-yellow-700" data-testid="badge-status-parsed"><AlertCircle className="h-3 w-3 mr-1" /> Needs Review</Badge>;
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
                        Supports PDF, JPG, PNG files
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
                              disabled={uploadMutation.isPending || !uploadQueue.some(i => i.status === "pending")}
                              data-testid="button-process-queue"
                            >
                              {uploadMutation.isPending ? (
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
                                      value={item.supplierId?.toString() || ""}
                                      onValueChange={(v) => updateQueueItem(index, { supplierId: parseInt(v) })}
                                    >
                                      <SelectTrigger className="h-8" data-testid={`select-supplier-${index}`}>
                                        <SelectValue placeholder="Supplier *" />
                                      </SelectTrigger>
                                      <SelectContent>
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
                      <Label htmlFor="default-supplier">Default Supplier</Label>
                      <Select
                        value={defaultSupplierId?.toString() || ""}
                        onValueChange={(v) => setDefaultSupplierId(parseInt(v))}
                      >
                        <SelectTrigger id="default-supplier" data-testid="select-default-supplier">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>
                      PRC documents uploaded for processing
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => refetchDocs()} data-testid="button-refresh-docs">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No documents uploaded yet
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/prc/review/${doc.id}`}>
                              <span className="text-primary hover:underline cursor-pointer">
                                {doc.originalFilename}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>{doc.supplierName || `Supplier #${doc.supplierId}`}</TableCell>
                          <TableCell>{doc.referenceMonth}</TableCell>
                          <TableCell>{getStatusBadge(doc.parseStatus)}</TableCell>
                          <TableCell>
                            {doc.parseConfidence != null
                              ? `${doc.parseConfidence}%`
                              : "-"}
                          </TableCell>
                          <TableCell>{doc.rowsExtracted || 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()}
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
      </div>
    </AdminLayout>
  );
}
