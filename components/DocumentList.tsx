"use client";

import { useState } from "react";
import { File, Trash2, Eye, Download, MoreVertical, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Document } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: string) => void;
  onView?: (document: Document) => void;
}

export function DocumentList({ documents, onDelete, onView }: DocumentListProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const variants: Record<Document['status'], { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      indexed: { variant: 'default', label: 'Indexed' },
      processing: { variant: 'secondary', label: 'Processing' },
      failed: { variant: 'destructive', label: 'Failed' },
    };

    const { variant, label } = variants[status];

    return (
      <Badge variant={variant} className="gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('word') || type.includes('doc')) return 'text-blue-500';
    if (type.includes('excel') || type.includes('sheet')) return 'text-green-500';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
        <p className="text-muted-foreground">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <File className={cn("h-8 w-8", getFileTypeColor(doc.fileType))} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{doc.filename}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                      {doc.pageCount && ` • ${doc.pageCount} pages`}
                    </p>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                {doc.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Uploaded by {doc.uploadedBy}</span>
                    <span>•</span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView?.(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
