"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Upload, Library } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { LoadingState } from "@/components/LoadingState";
import { Document as APIDocument, DocumentAPI } from "@/lib/api";
import { Document as UIDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = 'chat' | 'upload' | 'documents';

// Fallback mock data for offline mode
const mockDocuments: UIDocument[] = [
  {
    id: '1',
    filename: 'Remote_Work_Policy_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 1024000,
    uploadedAt: new Date('2024-01-15'),
    uploadedBy: 'Sarah Chen',
    status: 'indexed',
    pageCount: 12,
    description: 'Company remote work policies and guidelines',
  },
  {
    id: '2',
    filename: 'Employee_Handbook_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 2048000,
    uploadedAt: new Date('2024-01-10'),
    uploadedBy: 'Michael Rodriguez',
    status: 'indexed',
    pageCount: 45,
    description: 'Complete employee handbook with all company policies',
  },
  {
    id: '3',
    filename: 'Product_Roadmap_Q1_2024.pptx',
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    fileSize: 3072000,
    uploadedAt: new Date('2024-01-12'),
    uploadedBy: 'Emily Watson',
    status: 'processing',
    pageCount: 28,
  },
  {
    id: '4',
    filename: 'API_Documentation.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 512000,
    uploadedAt: new Date('2024-01-18'),
    uploadedBy: 'David Park',
    status: 'indexed',
    pageCount: 67,
    description: 'Complete API documentation and integration guides',
  },
];

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [documents, setDocuments] = useState<UIDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await DocumentAPI.getDocuments(0, 100);
      setDocuments(response.items.map(convertAPIDocToUI));
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
      // Fallback to mock data
      setDocuments(mockDocuments);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await DocumentAPI.deleteDocument(Number(documentId));
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleViewDocument = (document: UIDocument) => {
    console.log('View document:', document);
    // In a real app, this would open a document viewer
  };

  const handleUploadComplete = () => {
    // Refresh document list after upload
    fetchDocuments();
  };

  const tabs = [
    { id: 'chat' as Tab, label: 'Ask Questions', icon: MessageSquare },
    { id: 'upload' as Tab, label: 'Upload Documents', icon: Upload },
    { id: 'documents' as Tab, label: 'Document Library', icon: Library },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Upload documents and ask questions using AI-powered search
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold">{documents.length}</p>
              </div>
              <Library className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Indexed</p>
                <p className="text-3xl font-bold">
                  {documents.filter(d => d.status === 'indexed').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-3xl font-bold">
                  {documents.filter(d => d.status === 'processing').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={cn(
                "gap-2 rounded-b-none",
                activeTab === tab.id && "border-b-2 border-primary"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'chat' && (
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Ask Questions</CardTitle>
              <CardDescription>
                Get answers from your documents using AI-powered search with source citations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ChatInterface />
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
                <Button onClick={fetchDocuments} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState message="Loading documents..." />
              ) : (
                <DocumentList
                  documents={documents}
                  onDelete={handleDeleteDocument}
                  onView={handleViewDocument}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
