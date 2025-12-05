"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Upload, Library } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConversationalChat } from "@/components/ConversationalChat";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { LoadingState } from "@/components/LoadingState";
import { Document as APIDocument, DocumentAPI } from "@/lib/api";
import { Document as UIDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { canUploadDocuments, canDeleteDocuments, canAccessChat } from "@/lib/rbac";

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
  const { user } = useAuth();
  const userRole = user?.role as 'guest' | 'employee' | 'admin' | undefined;

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

  // Filter tabs based on user permissions
  const allTabs = [
    { id: 'chat' as Tab, label: 'Ask Questions', icon: MessageSquare, permission: () => canAccessChat(userRole) },
    { id: 'upload' as Tab, label: 'Upload Documents', icon: Upload, permission: () => canUploadDocuments(userRole) },
    { id: 'documents' as Tab, label: 'Document Library', icon: Library, permission: () => true }, // Everyone can view
  ];

  const tabs = allTabs.filter(tab => tab.permission());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/30">
     
      {/* Tab Content */}
      <div className="min-h-[600px]">
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
                  onDelete={canDeleteDocuments(userRole) ? handleDeleteDocument : undefined}
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
