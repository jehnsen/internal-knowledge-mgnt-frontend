"use client";

import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, FileText, User, Calendar, BarChart3, File, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadAPI } from "@/lib/api";
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

// Collapse whitespace so passage text can be matched against rendered
// paragraphs, which formatContent has already normalised.
function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Helper function to detect and format structured content with highlighting.
// When `citedPassage` is given, the lines belonging to it are marked so the
// reader can see exactly which text the answer was drawn from.
function parseStructuredContent(
  content: string,
  searchTerms?: string[],
  citedPassage?: string | null,
  passageRef?: React.RefObject<HTMLDivElement | null>
) {
  const formatted = formatContent(content);
  const lines = formatted.split('\n');
  const elements: React.ReactElement[] = [];

  const normalizedPassage = citedPassage ? normalizeForMatch(citedPassage) : '';
  let passageAnchored = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line - paragraph break
      return;
    }

    // A line belongs to the cited passage when the passage contains it.
    const normalizedLine = normalizeForMatch(trimmed);
    const isCited =
      normalizedPassage.length > 0 &&
      normalizedLine.length > 12 &&
      normalizedPassage.includes(normalizedLine);

    // Only the first line of the passage carries the scroll anchor.
    const anchorRef = isCited && !passageAnchored ? passageRef : undefined;
    if (anchorRef) passageAnchored = true;

    const citedClass = isCited
      ? 'bg-blue-100/70 dark:bg-blue-900/40 border-l-4 border-blue-500 pl-3 -ml-1 rounded-r scroll-mt-4'
      : '';

    // Detect headings (all caps, short lines, or lines ending with colons)
    if (
      (trimmed === trimmed.toUpperCase() && trimmed.length < 100 && trimmed.length > 3) ||
      (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('.'))
    ) {
      elements.push(
        <h3
          key={`heading-${index}`}
          ref={anchorRef as React.RefObject<HTMLHeadingElement> | undefined}
          className={`font-semibold text-base mt-4 mb-2 text-foreground ${citedClass}`}
        >
          {searchTerms ? highlightText(trimmed, searchTerms) : trimmed}
        </h3>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p
          key={`para-${index}`}
          ref={anchorRef as React.RefObject<HTMLParagraphElement> | undefined}
          className={`text-sm leading-relaxed mb-3 text-foreground/90 ${citedClass}`}
        >
          {searchTerms ? highlightText(trimmed, searchTerms) : trimmed}
        </p>
      );
    }
  });

  return elements;
}

/**
 * The evidence panel: the exact passage the answer used, labelled with where it
 * sits in the document so it can be checked against the original.
 */
function CitedPassage({
  passage,
  citation,
  similarityScore,
  searchTerms,
}: {
  passage: string | null;
  citation?: DocumentCitation;
  similarityScore?: number;
  searchTerms: string[];
}) {
  if (!passage) return null;

  const score = citation?.relevance_score ?? similarityScore;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          {citation?.citation_id ? `Cited Passage [${citation.citation_id}]` : 'Relevant Excerpt'}
        </Badge>
        {citation?.locator && (
          <Badge variant="outline" className="text-xs font-medium text-blue-700 border-blue-500/50">
            {citation.locator}
          </Badge>
        )}
        {citation?.match_level === 'document' && (
          <Badge variant="outline" className="text-xs text-amber-700 border-amber-500/50">
            whole-document match
          </Badge>
        )}
        {citation?.verified && (
          <Badge variant="outline" className="text-xs text-green-700 border-green-500/50">
            verified against source
          </Badge>
        )}
        {score !== undefined && (
          <span className="text-xs text-muted-foreground">
            {Math.round(score * 100)}% match
          </span>
        )}
      </div>
      <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm">
        <div className="space-y-3">{parseStructuredContent(passage, searchTerms)}</div>
      </div>
    </div>
  );
}

/** The passage an answer cited, with its exact location in the document. */
export interface DocumentCitation {
  citation_id?: string | null;
  excerpt?: string | null;
  locator?: string | null;
  page?: number | null;
  section?: string | null;
  match_level?: 'passage' | 'document';
  verified?: boolean;
  relevance_score?: number;
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
    /** False when the backend has no original file to serve for this document. */
    has_original_file?: boolean;
  };
  similarityScore?: number;
  chunkContent?: string;
  searchQuery?: string; // Add search query for highlighting
  result?: any; // For new hybrid search result format
  citation?: DocumentCitation; // Passage the answer cited, opened at its location
}

export function DocumentModal({
  isOpen,
  onClose,
  document,
  similarityScore,
  chunkContent,
  searchQuery,
  result,
  citation,
}: DocumentModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const passageRef = useRef<HTMLDivElement | null>(null);

  // The cited passage is the evidence; show it above the full text and scroll
  // to where it sits in the document.
  const citedPassage = citation?.excerpt ?? chunkContent ?? null;
  const citedPage = citation?.page ?? null;

  // Documents ingested before file retention have no original to serve, so the
  // preview would only ever 404. `undefined` means the caller did not check.
  const hasOriginalFile = document.has_original_file !== false;
  const canPreviewPdf =
    Boolean(document.id) &&
    Boolean(document.file_type?.toLowerCase().includes('pdf')) &&
    hasOriginalFile;

  // Open a citation on the page it came from when that page can actually be
  // rendered; otherwise start on the text view, which always works.
  const [activeTab, setActiveTab] = useState<string>(
    canPreviewPdf && citedPage ? "preview" : "content"
  );

  useEffect(() => {
    if (!isOpen || !citedPassage || activeTab !== 'content') return;
    // Wait for the content to render before scrolling to the passage.
    const timer = window.setTimeout(() => {
      passageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isOpen, citedPassage, activeTab, document.id]);

  // The download endpoint requires a Bearer token that a bare `<iframe src>`
  // request can't attach, so fetch it with auth and preview the resulting blob.
  useEffect(() => {
    if (!isOpen || !canPreviewPdf || !document.id) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    setPreviewUrl(null);
    setPreviewError(false);

    DownloadAPI.getDocumentPreviewBlobUrl(document.id)
      .then(url => {
        if (cancelled) {
          window.URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, canPreviewPdf, document.id]);

  const handleFullscreen = () => {
    setIsFullscreen(true);
    onClose();
    // Navigate to full page view
    window.open(`/documents/${document.id}`, '_blank');
  };

  const handleDownload = async () => {
    if (!document.id) return;
    try {
      setIsDownloading(true);
      await DownloadAPI.downloadDocument(document.id, document.title);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const uploader = document.metadata?.uploader || document.metadata?.uploaded_by || 'Unknown';
  const uploadDate = document.created_at ? new Date(document.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'N/A';

  // Handle both old and new response formats
  const score = result?.relevance_score ?? similarityScore ?? 0;
  const confidenceScore = Math.round(score * 100);

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
          {canPreviewPdf ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                <TabsTrigger value="preview">PDF Preview</TabsTrigger>
                <TabsTrigger value="content">Text Content</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 mt-0">
                {citedPage && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      Opened at the cited page
                    </Badge>
                    {citation?.locator && (
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        {citation.locator}
                      </span>
                    )}
                  </div>
                )}
                <div className="h-[500px] border rounded-lg overflow-hidden bg-muted/30">
                  {previewError ? (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                      Couldn't load the PDF preview. Try downloading the document instead.
                    </div>
                  ) : previewUrl ? (
                    <iframe
                      // Jump straight to the page the passage sits on; without the
                      // page fragment the viewer always opens at page 1.
                      key={citedPage ?? 'start'}
                      src={`${previewUrl}#${citedPage ? `page=${citedPage}&` : ''}view=FitH`}
                      className="w-full h-full"
                      title={document.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                      Loading preview…
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="content" className="flex-1 mt-0 overflow-y-auto">
                <CitedPassage
                  passage={citedPassage}
                  citation={citation}
                  similarityScore={similarityScore}
                  searchTerms={searchTerms}
                />

                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">Full Document Content</h3>
                  {citedPassage && (
                    <Badge variant="outline" className="text-xs text-blue-700 border-blue-500/50">
                      Cited passage highlighted
                    </Badge>
                  )}
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
                      parseStructuredContent(document.content, searchTerms, citedPassage, passageRef)
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No content available</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            /* Formats without a page-based preview (Word, Excel, text): the
               cited passage and its location are still shown, and the full text
               scrolls to it. */
            <>
              <CitedPassage
                passage={citedPassage}
                citation={citation}
                similarityScore={similarityScore}
                searchTerms={searchTerms}
              />

              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold">Full Document Content</h3>
                {citedPassage && (
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-500/50">
                    Cited passage highlighted
                  </Badge>
                )}
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
                    parseStructuredContent(document.content, searchTerms, citedPassage, passageRef)
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No content available</p>
                  )}
                </div>
              </div>
            </>
          )}

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
          <div className="flex gap-2 items-center">
            {document.id && !hasOriginalFile && (
              <span className="text-xs text-muted-foreground italic">
                Original file not retained — extracted text only
              </span>
            )}
            {document.id && hasOriginalFile && (
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            )}
            <Button variant="outline" onClick={handleFullscreen}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Fullscreen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
