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
      if (response && response.items && Array.isArray(response.items)) {
        setDocuments(response.items.map(convertAPIDocToUI));
      } else {
        // No documents or invalid response
        setDocuments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
      // Fallback to empty array instead of mock data for real app
      setDocuments([]);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Document Library
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your knowledge base and upload new documents
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 hover:border-purple-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-purple-50/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Documents</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {documents.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Library className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-green-50/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Indexed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {documents.filter(d => d.status === 'indexed').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Processing</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {documents.filter(d => d.status === 'processing').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gradient">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={cn(
                "gap-2 rounded-b-none transition-all",
                activeTab === tab.id && "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-b-2 border-purple-600"
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
    </div>
  );
}
