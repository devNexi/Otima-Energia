import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/lib/auth";
import { Redirect, useRoute, Link } from "wouter";
import { 
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Save,
  X,
  Trash2,
  ExternalLink,
  Edit,
  RefreshCw
} from "lucide-react";

const SUBMARKETS = ["SECO", "SUL", "NNE", "NORTE"];

interface PrcDocument {
  id: number;
  supplierId: number;
  supplierName?: string;
  supplierStatus?: string;
  referenceMonth: string;
  sourceName: string;
  originalFilename: string;
  fileStorageKey: string | null;
  parseStatus: string;
  parseConfidence: number | null;
  parseErrorDetails: string | null;
  rowsExtracted: number;
  rowsFlagged: number;
  notes: string | null;
  submarketHint: string | null;
  verifiedByUserId: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

interface PrcRow {
  id: number;
  prcDocumentId: number;
  supplierId: number;
  referenceMonth: string;
  productType: string;
  submarket: string;
  termMonths: number | null;
  termLabel: string | null;
  priceYear: number | null;
  priceRPerMWh: string;
  validUntil: string | null;
  flaggedForReview: boolean;
  flagReason: string | null;
  isOutlierFlag: boolean;
  notes: string | null;
  rawRow: string | null;
  createdAt: string;
}

export default function PrcReviewPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, params] = useRoute("/admin/prc/review/:id");
  const documentId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editedRow, setEditedRow] = useState<Partial<PrcRow>>({});
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);

  const { data: document, isLoading: docLoading } = useQuery<PrcDocument>({
    queryKey: ["/api/prc/documents", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/prc/documents/${documentId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch document");
      const data = await res.json();
      return data.document;
    },
    enabled: !!documentId && isAuthenticated
  });

  const { data: rows = [], isLoading: rowsLoading, refetch: refetchRows } = useQuery<PrcRow[]>({
    queryKey: ["/api/prc/documents", documentId, "rows"],
    queryFn: async () => {
      const res = await fetch(`/api/prc/documents/${documentId}/rows`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rows");
      const data = await res.json();
      return data.rows || [];
    },
    enabled: !!documentId && isAuthenticated
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/prc/documents/${documentId}/verify`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to verify document");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Document verified successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/prc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prc/documents", documentId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify document");
    }
  });

  const updateRowMutation = useMutation({
    mutationFn: async ({ rowId, updates }: { rowId: number; updates: Partial<PrcRow> }) => {
      const res = await fetch(`/api/prc/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update row");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Row updated successfully");
      setEditingRowId(null);
      setEditedRow({});
      refetchRows();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update row");
    }
  });

  const deleteRowMutation = useMutation({
    mutationFn: async (rowId: number) => {
      const res = await fetch(`/api/prc/rows/${rowId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete row");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Row deleted");
      refetchRows();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete row");
    }
  });

  const fetchSignedUrl = async () => {
    if (!documentId) return;
    setLoadingSignedUrl(true);
    try {
      const res = await fetch(`/api/prc/documents/${documentId}/signed-url`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get signed URL");
      const data = await res.json();
      setSignedUrl(data.signedUrl);
    } catch (error) {
      toast.error("Failed to load document preview");
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      UPLOADED: { label: "Uploaded", variant: "secondary" },
      PARSING: { label: "Parsing...", variant: "outline" },
      PARSED: { label: "Parsed", variant: "default" },
      NEEDS_REVIEW: { label: "Needs Review", variant: "destructive" },
      VERIFIED: { label: "Verified", variant: "default" },
      PUBLISHED: { label: "Published", variant: "default" },
      FAILED: { label: "Failed", variant: "destructive" }
    };
    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant} data-testid="status-badge">{config.label}</Badge>;
  };

  const startEditRow = (row: PrcRow) => {
    setEditingRowId(row.id);
    setEditedRow({
      productType: row.productType,
      submarket: row.submarket,
      priceYear: row.priceYear,
      priceRPerMWh: row.priceRPerMWh,
      validUntil: row.validUntil,
      notes: row.notes
    });
  };

  const saveRowEdit = () => {
    if (editingRowId && Object.keys(editedRow).length > 0) {
      updateRowMutation.mutate({ rowId: editingRowId, updates: editedRow });
    }
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditedRow({});
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  if (!documentId) {
    return <Redirect to="/admin/prc" />;
  }

  const isLoading = docLoading || rowsLoading;
  const canVerify = document?.parseStatus !== "VERIFIED" && document?.parseStatus !== "PUBLISHED";
  const isVerified = document?.parseStatus === "VERIFIED" || document?.parseStatus === "PUBLISHED";
  const flaggedRows = rows.filter(r => r.flaggedForReview);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/prc">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload Center
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !document ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Document not found
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {document.originalFilename}
                      </CardTitle>
                      <CardDescription>
                        {document.supplierName || `Supplier #${document.supplierId}`} - {document.referenceMonth}
                      </CardDescription>
                    </div>
                    {getStatusBadge(document.parseStatus)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Rows Extracted</Label>
                      <p className="font-medium" data-testid="text-rows-extracted">{document.rowsExtracted}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rows Flagged</Label>
                      <p className="font-medium text-orange-600" data-testid="text-rows-flagged">{document.rowsFlagged}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Parse Confidence</Label>
                      <p className="font-medium" data-testid="text-confidence">
                        {document.parseConfidence != null ? `${document.parseConfidence}%` : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Submarket Hint</Label>
                      <p className="font-medium">{document.submarketHint || "-"}</p>
                    </div>
                  </div>

                  {document.parseErrorDetails && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Parse Errors</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">{document.parseErrorDetails}</p>
                    </div>
                  )}

                  {document.notes && (
                    <div className="mt-4">
                      <Label className="text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{document.notes}</p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSignedUrl}
                      disabled={loadingSignedUrl || !document.fileStorageKey}
                      data-testid="button-view-pdf"
                    >
                      {loadingSignedUrl ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      View PDF
                    </Button>
                    {canVerify && (
                      <Button
                        size="sm"
                        onClick={() => verifyMutation.mutate()}
                        disabled={verifyMutation.isPending}
                        data-testid="button-verify"
                      >
                        {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Verify Document
                      </Button>
                    )}
                    {isVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified {document.verifiedAt ? `on ${new Date(document.verifiedAt).toLocaleDateString()}` : ""}
                      </Badge>
                    )}
                  </div>

                  {signedUrl && (
                    <div className="mt-4">
                      <a 
                        href={signedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open PDF in new tab
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Extracted Rows ({rows.length})</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetchRows()} data-testid="button-refresh-rows">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  {flaggedRows.length > 0 && (
                    <CardDescription className="text-orange-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {flaggedRows.length} row(s) flagged for review
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {rows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No rows extracted yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Type</TableHead>
                            <TableHead>Submarket</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Price (R$/MWh)</TableHead>
                            <TableHead>Valid Until</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={row.id} className={row.flaggedForReview ? "bg-orange-50" : row.isOutlierFlag ? "bg-yellow-50" : ""} data-testid={`row-prc-${row.id}`}>
                              {editingRowId === row.id ? (
                                <>
                                  <TableCell>
                                    <Select
                                      value={editedRow.productType || row.productType}
                                      onValueChange={(v) => setEditedRow({ ...editedRow, productType: v })}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="CONVENCIONAL">CONV</SelectItem>
                                        <SelectItem value="INCENTIVADA_50">I50</SelectItem>
                                        <SelectItem value="INCENTIVADA_100">I100</SelectItem>
                                        <SelectItem value="INCENTIVADA_0">I0</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={editedRow.submarket || row.submarket}
                                      onValueChange={(v) => setEditedRow({ ...editedRow, submarket: v })}
                                    >
                                      <SelectTrigger className="w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SUBMARKETS.map(sm => (
                                          <SelectItem key={sm} value={sm}>{sm}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      className="w-20"
                                      placeholder="Year"
                                      value={editedRow.priceYear ?? row.priceYear ?? ""}
                                      onChange={(e) => setEditedRow({ ...editedRow, priceYear: e.target.value ? parseInt(e.target.value) : null })}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="w-28"
                                      value={editedRow.priceRPerMWh ?? row.priceRPerMWh}
                                      onChange={(e) => setEditedRow({ ...editedRow, priceRPerMWh: e.target.value })}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="date"
                                      className="w-32"
                                      value={editedRow.validUntil || row.validUntil || ""}
                                      onChange={(e) => setEditedRow({ ...editedRow, validUntil: e.target.value })}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {row.flaggedForReview && (
                                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                        Flagged
                                      </Badge>
                                    )}
                                    {row.isOutlierFlag && (
                                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
                                        Outlier
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button size="icon" variant="ghost" onClick={saveRowEdit} disabled={updateRowMutation.isPending}>
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="font-medium">{row.productType}</TableCell>
                                  <TableCell>{row.submarket}</TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {row.priceYear || "—"}
                                  </TableCell>
                                  <TableCell className="font-mono">
                                    R$ {parseFloat(row.priceRPerMWh).toFixed(2)}
                                  </TableCell>
                                  <TableCell>{row.validUntil || "-"}</TableCell>
                                  <TableCell>
                                    {row.flaggedForReview ? (
                                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                        {row.flagReason || "Flagged"}
                                      </Badge>
                                    ) : row.isOutlierFlag ? (
                                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
                                        Outlier
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                        OK
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button size="icon" variant="ghost" onClick={() => startEditRow(row)} data-testid={`button-edit-row-${row.id}`}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="text-red-600"
                                        onClick={() => deleteRowMutation.mutate(row.id)}
                                        disabled={deleteRowMutation.isPending}
                                        data-testid={`button-delete-row-${row.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Document ID</Label>
                    <p className="font-mono">{document.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Source</Label>
                    <p>{document.sourceName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Uploaded</Label>
                    <p>{new Date(document.createdAt).toLocaleString()}</p>
                  </div>
                  {document.verifiedAt && (
                    <div>
                      <Label className="text-muted-foreground">Verified</Label>
                      <p>{new Date(document.verifiedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {document.supplierStatus === "prc_only" && (
                    <div>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        PRC-only Supplier
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-created from filename
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const flagged = rows.filter(r => r.flaggedForReview);
                      if (flagged.length > 0) {
                        const el = window.document.querySelector(`[data-testid="row-prc-${flagged[0].id}"]`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    disabled={flaggedRows.length === 0}
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                    Jump to flagged ({flaggedRows.length})
                  </Button>
                </CardContent>
              </Card>

              {isVerified && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      Benchmark Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This document's rows will contribute to benchmarks when published.
                    </p>
                    {rows.length > 0 && (
                      <div className="space-y-2 text-sm">
                        {Object.entries(
                          rows.filter(r => !r.isOutlierFlag).reduce((acc, row) => {
                            const yearDisplay = row.priceYear ? String(row.priceYear) : 'N/A';
                            const key = `${row.submarket} | ${row.productType} | ${yearDisplay}`;
                            if (!acc[key]) acc[key] = { count: 0, prices: [] as number[] };
                            acc[key].count++;
                            acc[key].prices.push(parseFloat(row.priceRPerMWh));
                            return acc;
                          }, {} as Record<string, { count: number; prices: number[] }>)
                        ).map(([key, data]) => {
                          const sortedPrices = data.prices.sort((a, b) => a - b);
                          const lowPrice = sortedPrices[Math.floor(sortedPrices.length * 0.25)] || sortedPrices[0];
                          const highPrice = sortedPrices[Math.floor(sortedPrices.length * 0.75)] || sortedPrices[sortedPrices.length - 1];
                          return (
                            <div key={key} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="font-medium text-xs">{key}</span>
                              <span className="text-xs text-muted-foreground">
                                {data.count} row(s) | R$ {lowPrice.toFixed(0)} - {highPrice.toFixed(0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Link href={`/admin/benchmarks?month=${document.referenceMonth}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2" data-testid="button-view-benchmarks">
                        View All Benchmarks
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
