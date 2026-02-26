"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Upload, Library } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConversationalChat } from "@/components/ConversationalChat";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { DocumentModal } from "@/components/DocumentModal";
import { Pagination } from "@/components/Pagination";
import { LoadingState } from "@/components/LoadingState";
import { Document as APIDocument, DocumentAPI } from "@/lib/api";
import { Document as UIDocument } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { canUploadDocuments, canDeleteDocuments, canAccessChat } from "@/lib/rbac";

const PAGE_SIZE = 10;

type Tab = 'chat' | 'upload' | 'documents';

export default function KnowledgePage() {
  const { user } = useAuth();
  const userRole = user?.role as 'guest' | 'employee' | 'admin' | undefined;

  const [activeTab, setActiveTab] = useState<Tab>('chat');

  // Document list state
  const [apiDocuments, setApiDocuments] = useState<APIDocument[]>([]);  // raw API docs (needed for viewer)
  const [documents, setDocuments] = useState<UIDocument[]>([]);          // converted for DocumentList
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);

  // Document viewer state
  const [selectedViewDoc, setSelectedViewDoc] = useState<APIDocument | null>(null);

  const convertAPIDocToUI = (apiDoc: APIDocument): UIDocument => ({
    id: apiDoc.id.toString(),
    filename: apiDoc.title,
    fileType: apiDoc.file_type || 'application/octet-stream',
    fileSize: apiDoc.file_size || 0,
    uploadedAt: new Date(apiDoc.created_at),
    uploadedBy: `User ${apiDoc.user_id}`,
    status: (apiDoc.embedding && apiDoc.embedding.length > 0) ? 'indexed' : 'processing',
    description: apiDoc.metadata?.description as string | undefined,
  });

  const fetchDocuments = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await DocumentAPI.getDocuments(skip, PAGE_SIZE);
      if (response && response.items && Array.isArray(response.items)) {
        setApiDocuments(response.items);
        setDocuments(response.items.map(convertAPIDocToUI));
        setTotalDocuments(response.total ?? response.items.length);
        setCurrentPage(page);
      } else {
        setApiDocuments([]);
        setDocuments([]);
        setTotalDocuments(0);
      }
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
      setApiDocuments([]);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for user to be set before fetching so _accessToken is available.
  useEffect(() => {
    if (!user) return;
    fetchDocuments(1);
  }, [user]);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await DocumentAPI.deleteDocument(Number(documentId));
      // Re-fetch the current page (item count changed, page may become empty)
      fetchDocuments(currentPage);
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleViewDocument = (uiDoc: UIDocument) => {
    const apiDoc = apiDocuments.find(d => d.id === parseInt(uiDoc.id));
    if (apiDoc) setSelectedViewDoc(apiDoc);
  };

  const handleUploadComplete = () => {
    // Refresh document list after upload; return to page 1 since new item is likely at the top
    fetchDocuments(1);
  };

  // Filter tabs based on user permissions
  const allTabs = [
    { id: 'chat' as Tab, label: 'Ask Questions', icon: MessageSquare, permission: () => canAccessChat(userRole) },
    { id: 'upload' as Tab, label: 'Upload Documents', icon: Upload, permission: () => canUploadDocuments(userRole) },
    { id: 'documents' as Tab, label: 'Document Library', icon: Library, permission: () => true },
  ];

  const tabs = allTabs.filter(tab => tab.permission());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/30">

      {/* Tab navigation */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6 min-h-[600px]">
        {activeTab === 'chat' && (
          <Card className="h-[700px] flex flex-col overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>AI Chat Assistant</CardTitle>
              <CardDescription>
                Have a natural conversation with context-aware responses and source citations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ConversationalChat />
            </CardContent>
          </Card>
        )}

        {activeTab === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload company documents to build your knowledge base. Supported formats: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'documents' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>
                    Manage your uploaded documents and their indexing status
                  </CardDescription>
                </div>
                <Button onClick={() => fetchDocuments(currentPage)} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <LoadingState message="Loading documents..." />
              ) : (
                <>
                  <DocumentList
                    documents={documents}
                    onDelete={canDeleteDocuments(userRole) ? handleDeleteDocument : undefined}
                    onView={handleViewDocument}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalDocuments / PAGE_SIZE)}
                    onPageChange={fetchDocuments}
                    totalItems={totalDocuments}
                    pageSize={PAGE_SIZE}
                    className="mt-2"
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div> {/* tab content container */}

      {/* Document viewer — outside the tab card so it isn't unmounted on tab switch */}
      {selectedViewDoc && (
        <DocumentModal
          isOpen={true}
          onClose={() => setSelectedViewDoc(null)}
          document={{
            id: selectedViewDoc!.id,
            title: selectedViewDoc!.title,
            content: selectedViewDoc!.content,
            created_at: selectedViewDoc!.created_at,
            file_type: selectedViewDoc!.file_type,
            file_path: selectedViewDoc!.file_path,
            metadata: selectedViewDoc!.metadata,
          }}
        />
      )}
    </div>
  );
}
