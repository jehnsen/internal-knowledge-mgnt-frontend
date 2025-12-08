"use client";

import { useState, useEffect } from "react";
import { Upload, Table, LayoutGrid, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentAPI, Document } from "@/lib/api";
import { AuditLog } from "@/lib/audit";
import { LoadingState } from "@/components/LoadingState";
import { DocumentTable } from "@/components/admin/documents/DocumentTable";
import { DocumentCards } from "@/components/admin/documents/DocumentCards";
import { DocumentUpload } from "@/components/DocumentUpload";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docsResponse: any = await DocumentAPI.getDocuments(0, 100);
      console.log('✅ Loaded documents:', docsResponse);
      setDocuments(docsResponse || []);
    } catch (err) {
      console.error('❌ Failed to load documents:', err);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Find document details before deletion
      const doc = documents.find(d => d.id === docId);

      await DocumentAPI.deleteDocument(docId);
      toast.success('Document deleted successfully');
      setDocuments(documents.filter(d => d.id !== docId));

      // Log audit event
      if (doc) {
        await AuditLog.documentDelete(docId, doc.title);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    toast.success('Document uploaded successfully');
    loadDocuments();
  };

  const filteredDocuments = (documents || []).filter(doc =>
    doc.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    doc.file_type?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading documents..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Document Management</h1>
          <p className="text-muted-foreground">
            Manage all documents in the knowledge base ({documents?.length || 0} total)
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-r-none"
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="Search documents..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {documents && documents.length > 0 ? (
            viewMode === "table" ? (
              <DocumentTable documents={documents} onDelete={handleDeleteDocument} />
            ) : (
              <DocumentCards documents={documents} onDelete={handleDeleteDocument} />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground p-6">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No documents found</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upload Documents</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <DocumentUpload onUploadComplete={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
