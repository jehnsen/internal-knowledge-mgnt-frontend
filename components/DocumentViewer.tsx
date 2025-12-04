"use client";

import { useState } from "react";
import { X, Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DownloadAPI } from "@/lib/api";

interface DocumentViewerProps {
  document: {
    id: number;
    title: string;
    file_type?: string;
    file_path?: string;
    content?: string;
    created_at?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!document) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await DownloadAPI.downloadDocument(document.id, document.title);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-5 w-5" />;

    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('xls')) return '📊';
    if (type.includes('powerpoint') || type.includes('ppt')) return '📽️';
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return '🖼️';
    if (type.includes('text')) return '📃';
    return <FileText className="h-5 w-5" />;
  };

  const isPDF = document.file_type?.toLowerCase().includes('pdf');
  const downloadUrl = DownloadAPI.getDocumentDownloadUrl(document.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="text-2xl">{getFileIcon(document.file_type)}</div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl mb-2">{document.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 flex-wrap">
                  {document.file_type && (
                    <Badge variant="secondary" className="text-xs">
                      {document.file_type}
                    </Badge>
                  )}
                  {document.created_at && (
                    <span className="text-xs text-muted-foreground">
                      Added {new Date(document.created_at).toLocaleDateString()}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPDF ? (
            <iframe
              src={`${downloadUrl}#view=FitH`}
              className="w-full h-full border-0"
              title={document.title}
            />
          ) : document.content ? (
            <div className="h-full overflow-y-auto px-6 py-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {document.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="text-6xl mb-4">{getFileIcon(document.file_type)}</div>
              <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                This file type cannot be previewed in the browser.
                Please download the file to view its contents.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download File'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(downloadUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
