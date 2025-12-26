import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Clock,
  Copy,
  Check,
  Send,
  Mail,
  MessageSquare,
  Globe,
  Loader2,
  Package,
  Eye,
  AlertCircle,
  CheckCircle2,
  FileText,
  Building2
} from "lucide-react";
import { format } from "date-fns";

interface RFODetailDialogProps {
  rfo: {
    id: number;
    rfoNumber: string;
    clientId: number;
    status: string;
    responseDeadline: string;
    sentCount: number;
    responseCount: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RfqPacket {
  id: number;
  rfoId: number;
  supplierId: number;
  adapterId: number;
  supplierName?: string;
  channel: string;
  renderedSubject: string | null;
  renderedBody: string;
  recipientInfo: Record<string, unknown>;
  status: string;
  createdAt: string;
  sentAt: string | null;
  sentBy: string | null;
}

interface SupplierTracking {
  id: number;
  rfoId: number;
  supplierId: number;
  supplierName?: string;
  status: string;
  sentAt: string | null;
  responseReceivedAt: string | null;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4" />,
  WHATSAPP: <MessageSquare className="h-4 w-4" />,
  PORTAL: <Globe className="h-4 w-4" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-red-100 text-red-700",
  WHATSAPP: "bg-green-100 text-green-700",
  PORTAL: "bg-blue-100 text-blue-700",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  READY: "bg-blue-100 text-blue-700",
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export function RFODetailDialog({ rfo, open, onOpenChange }: RFODetailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId } = useAuth();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("packets");

  const authHeaders: Record<string, string> = sessionId ? { "x-session-id": sessionId } : {};

  const { data: packetsData, isLoading: packetsLoading } = useQuery({
    queryKey: ["/api/rfo", rfo.id, "packets", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/rfo/${rfo.id}/packets`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch packets");
      return res.json();
    },
    enabled: open && !!sessionId,
  });

  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: ["/api/rfo", rfo.id, "tracking", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/rfo/${rfo.id}/tracking`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch tracking");
      return res.json();
    },
    enabled: open && !!sessionId,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
    enabled: open,
  });

  const generatePacketsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/rfo/${rfo.id}/generate-packets`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate packets");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfo", rfo.id, "packets"] });
      toast({
        title: "Packets Generated",
        description: `${data.generatedCount} packets created, ${data.skippedCount} skipped`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const markSentMutation = useMutation({
    mutationFn: async (packetId: number) => {
      const res = await fetch(`/api/rfq-packets/${packetId}/mark-sent`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to mark as sent");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfo", rfo.id, "packets"] });
      toast({ title: "Success", description: "Packet marked as sent" });
    },
  });

  const packets: RfqPacket[] = packetsData?.packets || [];
  const tracking: SupplierTracking[] = trackingData?.tracking || [];
  const suppliers = suppliersData?.suppliers || [];

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find((s: { id: number; name: string }) => s.id === supplierId);
    return supplier?.name || `Supplier #${supplierId}`;
  };

  const copyToClipboard = async (packet: RfqPacket) => {
    const text = packet.channel === "EMAIL"
      ? `Subject: ${packet.renderedSubject}\n\n${packet.renderedBody}`
      : packet.renderedBody;

    await navigator.clipboard.writeText(text);
    setCopiedId(packet.id);
    toast({ title: "Copied", description: "Content copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {rfo.rfoNumber}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <Badge className={
              rfo.status === "complete" ? "bg-green-100 text-green-800" :
              rfo.status === "sent" ? "bg-blue-100 text-blue-800" :
              rfo.status === "partial_response" ? "bg-yellow-100 text-yellow-800" :
              rfo.status === "expired" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-800"
            }>
              {rfo.status}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Deadline: {rfo.responseDeadline}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {rfo.responseCount || 0}/{rfo.sentCount || 0} responses
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="packets" className="flex items-center gap-2" data-testid="tab-packets">
                <Package className="w-4 h-4" />
                RFQ Packets ({packets.length})
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2" data-testid="tab-tracking">
                <Send className="w-4 h-4" />
                Supplier Tracking ({tracking.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packets" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pre-rendered messages ready to send to each supplier
                </p>
                <Button
                  onClick={() => generatePacketsMutation.mutate()}
                  disabled={generatePacketsMutation.isPending}
                  size="sm"
                  data-testid="btn-generate-packets"
                >
                  {generatePacketsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4 mr-2" />
                  )}
                  Generate Packets
                </Button>
              </div>

              {packetsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : packets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No RFQ packets generated yet.</p>
                    <p className="text-sm mt-2">
                      Click "Generate Packets" to create supplier-specific messages using configured adapters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {packets.map((packet) => (
                    <Card key={packet.id} data-testid={`packet-${packet.id}`}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getSupplierName(packet.supplierId)}</span>
                            <Badge className={CHANNEL_COLORS[packet.channel] || "bg-gray-100"}>
                              {CHANNEL_ICONS[packet.channel]}
                              <span className="ml-1">{packet.channel}</span>
                            </Badge>
                            <Badge className={STATUS_COLORS[packet.status] || "bg-gray-100"}>
                              {packet.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(packet)}
                              data-testid={`btn-copy-${packet.id}`}
                            >
                              {copiedId === packet.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            {packet.status !== "SENT" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markSentMutation.mutate(packet.id)}
                                disabled={markSentMutation.isPending}
                                data-testid={`btn-mark-sent-${packet.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Mark Sent
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {packet.channel === "EMAIL" && packet.renderedSubject && (
                          <div className="mb-2 text-sm">
                            <span className="font-medium">Subject:</span>{" "}
                            <span className="text-muted-foreground">{packet.renderedSubject}</span>
                          </div>
                        )}
                        <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {packet.renderedBody}
                        </div>
                        {packet.sentAt && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Sent: {format(new Date(packet.sentAt), "dd/MM/yyyy HH:mm")}
                            {packet.sentBy && ` by ${packet.sentBy}`}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracking" className="mt-4">
              {trackingLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : tracking.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No supplier tracking data available.</p>
                  </CardContent>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Response At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracking.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{getSupplierName(t.supplierId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {t.sentAt ? format(new Date(t.sentAt), "dd/MM/yyyy HH:mm") : "-"}
                        </TableCell>
                        <TableCell>
                          {t.responseReceivedAt
                            ? format(new Date(t.responseReceivedAt), "dd/MM/yyyy HH:mm")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
