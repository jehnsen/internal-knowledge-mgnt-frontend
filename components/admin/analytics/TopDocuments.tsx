"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocumentItem {
  document_id: number;
  title: string;
  access_count: number;
  last_accessed?: string;
}

interface TopDocumentsProps {
  documents: DocumentItem[];
}

export function TopDocuments({ documents }: TopDocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Most Accessed Documents
        </CardTitle>
        <CardDescription>
          Documents referenced most frequently in searches and chats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div
                key={doc.document_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant="outline" className="font-mono flex-shrink-0">
                    #{idx + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    {doc.last_accessed && (
                      <p className="text-xs text-muted-foreground">
                        Last accessed: {new Date(doc.last_accessed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white flex-shrink-0">
                  {doc.access_count} views
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No document access data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
