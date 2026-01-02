import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye,
  Send,
  Download,
  BarChart3,
  Package,
  Clock,
  Check,
  Plus,
  Edit2
} from "lucide-react";
import { format } from "date-fns";

interface PrcDocument {
  id: number;
  supplierId: number;
  supplierName?: string;
  referenceMonth: string;
  sourceName: string;
  parseStatus: string;
  parseConfidence: number | null;
  originalFilename: string;
  createdAt: string;
  parsedAt: string | null;
  verifiedByUserId: string | null;
  verifiedAt: string | null;
  isDemo: boolean | null;
}

interface PrcRow {
  id: number;
  prcDocumentId: number;
  supplierId: number;
  submarket: string;
  productType: string;
  termMonths: number | null;
  priceRPerMWh: string;
  confidence: number;
  isOutlierFlag: boolean;
  outlierReason: string | null;
  wasManuallyEdited: boolean;
}

interface PrcMonthSummary {
  documentCount: number;
  verifiedCount: number;
  totalRows: number;
  flaggedRows: number;
  supplierCoverage: number[];
  supplierNames?: string[];
}

interface BenchmarkPreview {
  submarket: string;
  productType: string;
  termMonths: number | null;
  lowPrice: number;
  midPrice: number;
  highPrice: number;
  numSources: number;
}

const parseStatusColors: Record<string, string> = {
  UPLOADED: "bg-gray-100 text-gray-800",
  PARSING: "bg-blue-100 text-blue-800",
  PARSED: "bg-green-100 text-green-800",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  PUBLISHED: "bg-purple-100 text-purple-800",
};

export function PrcManagement() {
  const { toast } = useToast();
  const { sessionId, canAccess } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDocument, setSelectedDocument] = useState<PrcDocument | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newPrc, setNewPrc] = useState({ supplierId: '', referenceMonth: selectedMonth });
  const [showAddRowForm, setShowAddRowForm] = useState(false);
  const [newRow, setNewRow] = useState({
    submarket: 'SECO',
    productType: 'CONVENCIONAL',
    termMonths: '24',
    priceRPerMWh: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUBMARKETS = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE'];
  const PRODUCT_TYPES = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100'];

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers', {
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.suppliers || [];
    }
  });

  const { data: documentsResponse, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/prc/documents', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/prc/documents?referenceMonth=${selectedMonth}`, {
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) throw new Error('Failed to fetch PRC documents');
      return res.json();
    }
  });
  const documents: PrcDocument[] = documentsResponse?.documents || [];

  const { data: monthSummaryResponse } = useQuery({
    queryKey: ['/api/prc/months/summary', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/prc/months/${selectedMonth}/summary`, {
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedMonth
  });
  const monthSummary: PrcMonthSummary | null = monthSummaryResponse?.summary || null;

  const { data: benchmarkPreviewResponse } = useQuery({
    queryKey: ['/api/prc/months/benchmark-preview', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/prc/months/${selectedMonth}/benchmark-preview`, {
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: activeTab === 'publish'
  });
  const benchmarkPreview: BenchmarkPreview[] = benchmarkPreviewResponse?.preview || [];

  const { data: documentRowsResponse } = useQuery({
    queryKey: ['/api/prc/documents/rows', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument) return null;
      const res = await fetch(`/api/prc/documents/${selectedDocument.id}/rows`, {
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedDocument
  });
  const documentRows: PrcRow[] = documentRowsResponse?.rows || [];

  const verifyDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`/api/prc/documents/${documentId}/verify`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) throw new Error('Failed to verify document');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document verified", description: "The PRC document has been marked as verified." });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/documents'] });
      refetchDocuments();
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`/api/prc/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) throw new Error('Failed to delete document');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document deleted", description: "The PRC document has been removed." });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/documents'] });
      refetchDocuments();
      setSelectedDocument(null);
    }
  });

  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/prc/publish-batches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '' 
        },
        body: JSON.stringify({ referenceMonth: selectedMonth })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create publish batch');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Batch created", description: `Publish batch ready with ${data.batch.documentCount} documents.` });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/publish-batches'] });
    }
  });

  const publishBatchMutation = useMutation({
    mutationFn: async (batchId: number) => {
      const res = await fetch(`/api/prc/publish-batches/${batchId}/publish`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to publish benchmarks');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Benchmarks published!", 
        description: `${data.benchmarksCreated} market price benchmarks created.` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/publish-batches'] });
      refetchDocuments();
    }
  });

  const createRowMutation = useMutation({
    mutationFn: async (data: { documentId: number; row: typeof newRow }) => {
      const document = selectedDocument;
      if (!document) throw new Error('No document selected');
      
      const res = await fetch('/api/prc/rows', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '' 
        },
        body: JSON.stringify({
          prcDocumentId: data.documentId,
          supplierId: document.supplierId,
          referenceMonth: document.referenceMonth,
          submarket: data.row.submarket,
          productType: data.row.productType,
          termMonths: data.row.termMonths ? parseInt(data.row.termMonths, 10) : null,
          priceRPerMWh: parseFloat(data.row.priceRPerMWh),
          confidence: 100
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create row');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Row added", description: "Price row has been added to the document." });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/documents/rows', selectedDocument?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/months/summary'] });
      setNewRow({ submarket: 'SECO', productType: 'CONVENCIONAL', termMonths: '24', priceRPerMWh: '' });
      setShowAddRowForm(false);
    }
  });

  const deleteRowMutation = useMutation({
    mutationFn: async (rowId: number) => {
      const res = await fetch(`/api/prc/rows/${rowId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId || '' }
      });
      if (!res.ok) throw new Error('Failed to delete row');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Row deleted", description: "Price row has been removed." });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/documents/rows', selectedDocument?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/months/summary'] });
    }
  });

  const uploadPrcMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('supplierId', newPrc.supplierId);
      formData.append('referenceMonth', newPrc.referenceMonth);
      
      const res = await fetch('/api/prc/documents/upload', {
        method: 'POST',
        headers: { 'x-session-id': sessionId || '' },
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload PRC document');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "PRC uploaded", 
        description: `${data.document.originalFilename} uploaded. Auto-parsing started.` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prc/months/summary'] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setNewPrc({ supplierId: '', referenceMonth: selectedMonth });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

  const verifiedCount = documents.filter(d => d.parseStatus === 'VERIFIED').length;
  const canPublish = verifiedCount > 0 && benchmarkPreview.length > 0;

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  if (!canAccess('admin')) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Admin access required to manage PRC documents.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PRC Ingestion</h2>
          <p className="text-muted-foreground">
            Upload, review, and publish supplier price reference cards
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]" data-testid="select-prc-month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-prc">
            <Upload className="w-4 h-4 mr-2" />
            Upload PRC
          </Button>
        </div>
      </div>

      {monthSummary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{monthSummary.documentCount}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{monthSummary.verifiedCount}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{monthSummary.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Price Rows</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{monthSummary.flaggedRows}</p>
                  <p className="text-xs text-muted-foreground">Flagged</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{monthSummary.supplierCoverage.length}</p>
                  <p className="text-xs text-muted-foreground">Suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-prc-documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-prc-review">
            <Eye className="w-4 h-4 mr-2" />
            Review Queue
          </TabsTrigger>
          <TabsTrigger value="publish" data-testid="tab-prc-publish">
            <Send className="w-4 h-4 mr-2" />
            Publish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PRC Documents - {selectedMonth}</CardTitle>
              <CardDescription>
                Uploaded supplier price reference cards for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No PRC documents uploaded for this month.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id} data-testid={`row-prc-doc-${doc.id}`}>
                        <TableCell className="font-medium">{doc.supplierName || `Supplier #${doc.supplierId}`}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{doc.originalFilename}</TableCell>
                        <TableCell>
                          <Badge className={parseStatusColors[doc.parseStatus] || 'bg-gray-100'}>
                            {doc.parseStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.parseConfidence !== null ? `${Math.round(doc.parseConfidence * 100)}%` : '-'}
                        </TableCell>
                        <TableCell>{format(new Date(doc.createdAt), 'MMM d, HH:mm')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}
                              data-testid={`button-view-prc-${doc.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {doc.parseStatus === 'PARSED' || doc.parseStatus === 'NEEDS_REVIEW' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => verifyDocumentMutation.mutate(doc.id)}
                                disabled={verifyDocumentMutation.isPending}
                                data-testid={`button-verify-prc-${doc.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this document?')) {
                                  deleteDocumentMutation.mutate(doc.id);
                                }
                              }}
                              data-testid={`button-delete-prc-${doc.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
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

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>
                Documents and rows that need manual review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.filter(d => d.parseStatus === 'NEEDS_REVIEW').map((doc) => (
                    <Card key={doc.id} className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{doc.supplierName || doc.sourceName}</p>
                            <p className="text-sm text-muted-foreground">{doc.originalFilename}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => verifyDocumentMutation.mutate(doc.id)}
                              disabled={verifyDocumentMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {documents.filter(d => d.parseStatus === 'NEEDS_REVIEW').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      No documents need review
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish Benchmarks - {selectedMonth}</CardTitle>
              <CardDescription>
                Preview and publish market price benchmarks from verified PRC data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Ready to Publish</p>
                    <p className="text-sm text-muted-foreground">
                      {verifiedCount} verified documents, {benchmarkPreview.length} benchmark groups
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      const result = await createBatchMutation.mutateAsync();
                      if (result.batch?.id) {
                        await publishBatchMutation.mutateAsync(result.batch.id);
                      }
                    }}
                    disabled={!canPublish || createBatchMutation.isPending || publishBatchMutation.isPending}
                    data-testid="button-publish-benchmarks"
                  >
                    {(createBatchMutation.isPending || publishBatchMutation.isPending) ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Publish Benchmarks
                  </Button>
                </div>

                {benchmarkPreview.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submarket</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Low (P25)</TableHead>
                        <TableHead>Mid (P50)</TableHead>
                        <TableHead>High (P75)</TableHead>
                        <TableHead>Sources</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {benchmarkPreview.map((bp, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{bp.submarket}</TableCell>
                          <TableCell>{bp.productType}</TableCell>
                          <TableCell>{bp.termMonths ? `${bp.termMonths}m` : '-'}</TableCell>
                          <TableCell className="text-green-600">R$ {bp.lowPrice.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">R$ {bp.midPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">R$ {bp.highPrice.toFixed(2)}</TableCell>
                          <TableCell>{bp.numSources}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {benchmarkPreview.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2" />
                    No verified PRC data available for benchmark calculation
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload PRC Document</DialogTitle>
            <DialogDescription>
              Upload a supplier price reference card (PDF or image)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier</Label>
              <Select value={newPrc.supplierId} onValueChange={(v) => setNewPrc({ ...newPrc, supplierId: v })}>
                <SelectTrigger data-testid="select-prc-supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Month</Label>
              <Select 
                value={newPrc.referenceMonth} 
                onValueChange={(v) => setNewPrc({ ...newPrc, referenceMonth: v })}
              >
                <SelectTrigger data-testid="select-prc-upload-month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${selectedFile ? 'border-green-400 bg-green-50' : 'hover:border-primary hover:bg-muted/50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <>
                  <FileText className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  >
                    Change file
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select your PRC file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PDF, PNG, JPG files up to 10MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                data-testid="input-prc-file"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setSelectedFile(null); }}>
                Cancel
              </Button>
              <Button 
                disabled={!selectedFile || !newPrc.supplierId || uploadPrcMutation.isPending}
                onClick={() => selectedFile && uploadPrcMutation.mutate(selectedFile)}
                data-testid="button-confirm-upload-prc"
              >
                {uploadPrcMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploadPrcMutation.isPending ? 'Uploading...' : 'Upload & Parse'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>PRC Document Details</DialogTitle>
            <DialogDescription>
              {selectedDocument?.supplierName} - {selectedDocument?.referenceMonth}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={parseStatusColors[selectedDocument.parseStatus] || 'bg-gray-100'}>
                    {selectedDocument.parseStatus}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Confidence</Label>
                  <p className="font-medium">
                    {selectedDocument.parseConfidence !== null 
                      ? `${Math.round(selectedDocument.parseConfidence * 100)}%` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">File</Label>
                  <p className="font-medium truncate">{selectedDocument.originalFilename}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Price Rows ({documentRows.length})</Label>
                  {(selectedDocument.parseStatus === 'NEEDS_REVIEW' || selectedDocument.parseStatus === 'PARSED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddRowForm(!showAddRowForm)}
                      data-testid="button-toggle-add-row"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Row
                    </Button>
                  )}
                </div>
                
                {showAddRowForm && (
                  <Card className="mb-4 border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                          <Label className="text-xs">Submarket</Label>
                          <Select value={newRow.submarket} onValueChange={(v) => setNewRow({...newRow, submarket: v})}>
                            <SelectTrigger data-testid="select-new-row-submarket">
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
                          <Label className="text-xs">Product</Label>
                          <Select value={newRow.productType} onValueChange={(v) => setNewRow({...newRow, productType: v})}>
                            <SelectTrigger data-testid="select-new-row-product">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCT_TYPES.map(pt => (
                                <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Term (months)</Label>
                          <Input
                            type="number"
                            value={newRow.termMonths}
                            onChange={(e) => setNewRow({...newRow, termMonths: e.target.value})}
                            placeholder="24"
                            data-testid="input-new-row-term"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price (R$/MWh)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newRow.priceRPerMWh}
                            onChange={(e) => setNewRow({...newRow, priceRPerMWh: e.target.value})}
                            placeholder="250.00"
                            data-testid="input-new-row-price"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowAddRowForm(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!newRow.priceRPerMWh) {
                              toast({ title: "Price required", description: "Please enter a price value.", variant: "destructive" });
                              return;
                            }
                            const price = parseFloat(newRow.priceRPerMWh);
                            if (isNaN(price) || price <= 0) {
                              toast({ title: "Invalid price", description: "Please enter a valid positive number.", variant: "destructive" });
                              return;
                            }
                            createRowMutation.mutate({ documentId: selectedDocument.id, row: newRow });
                          }}
                          disabled={createRowMutation.isPending || !newRow.priceRPerMWh}
                          data-testid="button-save-new-row"
                        >
                          {createRowMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                          Save Row
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {documentRows.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submarket</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentRows.map((row) => (
                        <TableRow key={row.id} className={row.isOutlierFlag ? 'bg-yellow-50' : ''}>
                          <TableCell>{row.submarket}</TableCell>
                          <TableCell>{row.productType}</TableCell>
                          <TableCell>{row.termMonths ? `${row.termMonths}m` : '-'}</TableCell>
                          <TableCell className="font-mono">R$ {row.priceRPerMWh}</TableCell>
                          <TableCell>
                            {row.isOutlierFlag && (
                              <Badge variant="outline" className="text-yellow-600">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Outlier
                              </Badge>
                            )}
                            {row.wasManuallyEdited && (
                              <Badge variant="outline" className="ml-1">Edited</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this price row?')) {
                                  deleteRowMutation.mutate(row.id);
                                }
                              }}
                              disabled={deleteRowMutation.isPending}
                              data-testid={`button-delete-row-${row.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No price rows yet. Click "Add Row" to enter pricing data manually.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Close
                </Button>
                {(selectedDocument.parseStatus === 'PARSED' || selectedDocument.parseStatus === 'NEEDS_REVIEW') && (
                  <Button
                    onClick={() => {
                      verifyDocumentMutation.mutate(selectedDocument.id);
                      setSelectedDocument(null);
                    }}
                    disabled={verifyDocumentMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Verify Document
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
