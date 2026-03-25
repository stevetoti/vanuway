import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Clock,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { openDocument } from "@/lib/storage/storage-utils";

interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  verification_status: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string | null;
  driver?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export default function AdminDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("driver_documents")
        .select(`
          *,
          driver:drivers(first_name, last_name, email)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("verification_status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doc: DriverDocument) => {
    try {
      const { error } = await supabase
        .from("driver_documents")
        .update({
          verification_status: "approved",
          verified_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      if (error) throw error;
      toast.success("Document approved");
      loadDocuments();
    } catch (error) {
      console.error("Error approving document:", error);
      toast.error("Failed to approve document");
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { error } = await supabase
        .from("driver_documents")
        .update({
          verification_status: "rejected",
          rejection_reason: rejectionReason,
          verified_at: new Date().toISOString(),
        })
        .eq("id", selectedDoc.id);

      if (error) throw error;
      toast.success("Document rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedDoc(null);
      loadDocuments();
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast.error("Failed to reject document");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredDocuments = documents.filter((doc) => {
    const driverName = `${doc.driver?.first_name || ""} ${doc.driver?.last_name || ""}`.toLowerCase();
    const fileName = doc.file_name.toLowerCase();
    const docType = doc.document_type.toLowerCase();
    const query = searchQuery.toLowerCase();

    return driverName.includes(query) || fileName.includes(query) || docType.includes(query);
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Document Verification</h1>
            <p className="text-muted-foreground">Review and verify driver documents</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by driver name, file name, or document type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {doc.driver?.first_name} {doc.driver?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{doc.driver?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDocumentType(doc.document_type)}</TableCell>
                        <TableCell className="max-w-xs truncate">{doc.file_name}</TableCell>
                        <TableCell>{getStatusBadge(doc.verification_status)}</TableCell>
                        <TableCell>
                          {doc.created_at
                            ? format(new Date(doc.created_at), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {doc.verification_status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(doc)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>
                {selectedDoc && formatDocumentType(selectedDoc.document_type)}
              </DialogDescription>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Driver</p>
                    <p className="font-medium">
                      {selectedDoc.driver?.first_name} {selectedDoc.driver?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    {getStatusBadge(selectedDoc.verification_status)}
                  </div>
                  <div>
                    <p className="text-muted-foreground">File Name</p>
                    <p className="font-medium">{selectedDoc.file_name}</p>
                  </div>
                  {selectedDoc.expires_at && (
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">
                        {format(new Date(selectedDoc.expires_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
                {selectedDoc.rejection_reason && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                    <p className="text-sm">{selectedDoc.rejection_reason}</p>
                  </div>
                )}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto flex items-center gap-2"
                    onClick={async () => {
                      const success = await openDocument(selectedDoc.file_url);
                      if (!success) {
                        toast.error("Failed to load document");
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    View Document in New Tab
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this document.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
