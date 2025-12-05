"use client";

import { FileText, Eye, Download, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Document } from "@/lib/api";

interface DocumentCardsProps {
  documents: Document[];
  onDelete: (id: number) => void;
}

export function DocumentCards({ documents, onDelete }: DocumentCardsProps) {
  return (
    <div className="p-6 space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {doc.file_type && (
                  <Badge variant="outline" className="text-xs">
                    {doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                )}
                {doc.category && (
                  <Badge variant="secondary" className="text-xs">
                    {doc.category}
                  </Badge>
                )}
                {doc.created_at && (
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
