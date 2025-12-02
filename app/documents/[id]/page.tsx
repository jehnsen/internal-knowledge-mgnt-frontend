"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, User, Calendar, BarChart3, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DocumentAPI, Document } from "@/lib/api";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const id = Number(params.id);
        const doc = await DocumentAPI.getDocument(id);
        setDocument(doc);
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadDocument();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !document) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  {error || "The document you're looking for doesn't exist."}
                </p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const uploader = document.metadata?.uploader || document.metadata?.uploaded_by || 'Unknown';
  const uploadDate = document.created_at ? new Date(document.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'N/A';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <h1 className="text-4xl font-bold mb-4">{document.title}</h1>

            <div className="flex flex-wrap gap-3 items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{uploadDate}</span>
              </div>
              {uploader && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{uploader}</span>
                  </div>
                </>
              )}
              {document.file_type && (
                <>
                  <span>•</span>
                  <Badge variant="outline">
                    {document.file_type.toUpperCase()}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Metadata Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Document ID */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Document ID</p>
                    <p className="text-lg font-semibold">#{document.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Source */}
            {document.file_path && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <File className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Source File</p>
                      <p className="text-sm font-medium truncate" title={document.file_path}>
                        {document.file_path.split('/').pop() || document.file_path}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Indexed Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={document.embedding && document.embedding.length > 0 ? "default" : "secondary"}>
                      {document.embedding && document.embedding.length > 0 ? 'Indexed' : 'Processing'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Document Content</h2>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {document.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                <div className="grid gap-3">
                  {Object.entries(document.metadata)
                    .filter(([key]) => key !== 'uploader' && key !== 'uploaded_by')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-muted-foreground min-w-[140px] capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="flex-1">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            {document.file_path && (
              <Button asChild>
                <a href={document.file_path} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
