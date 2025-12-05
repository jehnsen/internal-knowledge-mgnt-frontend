"use client";

import { FileText, Eye, Download, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Document } from "@/lib/api";

interface DocumentTableProps {
  documents: Document[];
  onDelete: (id: number) => void;
}

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium">Title</th>
            <th className="text-left p-4 font-medium">Type</th>
            <th className="text-left p-4 font-medium">Category</th>
            <th className="text-left p-4 font-medium">Size</th>
            <th className="text-left p-4 font-medium">Created</th>
            <th className="text-right p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium truncate max-w-md">{doc.title}</span>
                </div>
              </td>
              <td className="p-4">
                {doc.file_type && (
                  <Badge variant="outline" className="text-xs">
                    {doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                )}
              </td>
              <td className="p-4">
                {doc.category ? (
                  <Badge variant="secondary" className="text-xs">
                    {doc.category}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '-'}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}
              </td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
