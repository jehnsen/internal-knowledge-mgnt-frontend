"use client";

import { useState } from "react";
import { X, ExternalLink, FileText, User, Calendar, BarChart3, File } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

// Helper function to format document content
function formatContent(content: string): string {
  if (!content) return '';

  // Remove excessive whitespace and newlines
  let formatted = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Split into paragraphs
  const paragraphs = formatted.split(/\n\n+/);

  // Clean up each paragraph
  return paragraphs
    .map(para => {
      // Remove extra spaces
      para = para.replace(/\s+/g, ' ').trim();

      // Skip very short paragraphs (likely noise)
      if (para.length < 10) return '';

      return para;
    })
    .filter(para => para.length > 0)
    .join('\n\n');
}

// Helper function to highlight search terms in text
function highlightText(text: string, searchTerms: string[]): React.ReactNode {
  if (!searchTerms || searchTerms.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the search terms (case-insensitive)
  const pattern = searchTerms
    .filter(term => term.length > 2) // Only highlight terms longer than 2 chars
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
    .join('|');

  if (!pattern) return text;

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground font-medium px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

// Helper function to detect and format structured content with highlighting
function parseStructuredContent(content: string, searchTerms?: string[]) {
  const formatted = formatContent(content);
  const lines = formatted.split('\n');
  const elements: React.ReactElement[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line - paragraph break
      return;
    }

    // Detect headings (all caps, short lines, or lines ending with colons)
    if (
      (trimmed === trimmed.toUpperCase() && trimmed.length < 100 && trimmed.length > 3) ||
      (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('.'))
    ) {
      elements.push(
        <h3 key={`heading-${index}`} className="font-semibold text-base mt-4 mb-2 text-foreground">
          {searchTerms ? highlightText(trimmed, searchTerms) : trimmed}
        </h3>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={`para-${index}`} className="text-sm leading-relaxed mb-3 text-foreground/90">
          {searchTerms ? highlightText(trimmed, searchTerms) : trimmed}
        </p>
      );
    }
  });

  return elements;
}

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id?: number;
    title?: string;
    content?: string;
    created_at?: string;
    updated_at?: string;
    file_path?: string;
    file_type?: string;
    metadata?: Record<string, any>;
  };
  similarityScore?: number;
  chunkContent?: string;
  searchQuery?: string; // Add search query for highlighting
}

export function DocumentModal({
  isOpen,
  onClose,
  document,
  similarityScore,
  chunkContent,
  searchQuery,
}: DocumentModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    setIsFullscreen(true);
    onClose();
    // Navigate to full page view
    window.open(`/documents/${document.id}`, '_blank');
  };

  const uploader = document.metadata?.uploader || document.metadata?.uploaded_by || 'Unknown';
  const uploadDate = document.created_at ? new Date(document.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'N/A';

  const confidenceScore = similarityScore ? Math.round(similarityScore * 100) : 0;

  // Extract keywords from search query for highlighting
  const searchTerms = searchQuery
    ? searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 2 && !['the', 'and', 'or', 'but', 'for', 'has', 'does', 'what', 'how', 'why', 'when', 'where'].includes(term))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2 pr-8">
                {document.title || 'Untitled Document'}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
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
                    <Badge variant="outline" className="text-xs">
                      {document.file_type.toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 -mt-2 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Separator className="flex-shrink-0" />

        {/* Metadata Section */}
        <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {/* Confidence Score */}
          {similarityScore !== undefined && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence Score</p>
                <p className="text-lg font-semibold">{confidenceScore}%</p>
              </div>
            </div>
          )}

          {/* Document Source */}
          {document.file_path && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <File className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Source File</p>
                <p className="text-sm font-medium truncate" title={document.file_path}>
                  {document.file_path.split('/').pop() || document.file_path}
                </p>
              </div>
            </div>
          )}

          {/* Document ID */}
          {document.id && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Document ID</p>
                <p className="text-sm font-medium">#{document.id}</p>
              </div>
            </div>
          )}
        </div>

        <Separator className="flex-shrink-0" />

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto py-4">
          {chunkContent && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  Relevant Excerpt
                </Badge>
                {similarityScore !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(similarityScore * 100)}% match
                  </span>
                )}
              </div>
              <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm">
                <div className="space-y-3">
                  {parseStructuredContent(chunkContent, searchTerms)}
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold">Full Document Content</h3>
            {searchTerms.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Highlighting: {searchTerms.join(', ')}
              </Badge>
            )}
            <Separator className="flex-1" />
          </div>
          <div className="prose prose-sm max-w-none bg-muted/30 p-6 rounded-xl">
            <div className="space-y-3">
              {document.content ? (
                parseStructuredContent(document.content, searchTerms)
              ) : (
                <p className="text-sm text-muted-foreground italic">No content available</p>
              )}
            </div>
          </div>

          {/* Additional Metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
              <div className="grid gap-2">
                {Object.entries(document.metadata)
                  .filter(([key]) => key !== 'uploader' && key !== 'uploaded_by')
                  .map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <span className="font-medium text-muted-foreground min-w-[120px] capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="flex-1">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleFullscreen}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Fullscreen
            </Button>
            {document.file_path && (
              <Button asChild>
                <a href={document.file_path} download target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
