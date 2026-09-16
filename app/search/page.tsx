"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  FileText,
  Sparkles,
  History,
  Clock,
  X,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Layers3,
  Quote,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DocumentAPI, SearchAPI, Document as APIDocument, SearchResponse, SearchResult, SourceDocument } from "@/lib/api";
import { AuditLog } from "@/lib/audit";
import { DocumentModal } from "@/components/DocumentModal";
import { DocumentUpload } from "@/components/DocumentUpload";
import { KnowledgeGapAlert } from "@/components/KnowledgeGapAlert";
import { useAuth } from "@/contexts/AuthContext";
import { canUploadDocuments, canAccessChat } from "@/lib/rbac";
import { addToSearchHistory, getSearchHistory, removeFromSearchHistory, addToRecentlyViewed, getRecentlyViewed, SearchHistoryItem, RecentlyViewedDocument } from "@/lib/storage";

/**
 * One citation row: what the passage says and exactly where it lives, so the
 * answer can be checked against the source without reading the whole document.
 */
function EvidenceRow({
  source,
  onOpen,
}: {
  source: SourceDocument;
  onOpen: (source: SourceDocument) => void;
}) {
  const score = Math.round(source.relevance_score * 100);
  const scoreClass =
    score >= 70
      ? 'bg-primary/10 text-primary'
      : score >= 40
        ? 'bg-secondary text-secondary-foreground'
        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(source)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(source);
        }
      }}
      className="p-3 rounded-lg bg-muted/50 hover:bg-muted hover:shadow-md transition-all cursor-pointer group text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {source.citation_id && (
              <Badge variant="outline" className="text-[10px] font-mono flex-shrink-0">
                [{source.citation_id}]
              </Badge>
            )}
            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {source.title}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {source.locator ? (
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                {source.locator}
              </span>
            ) : (
              <span className="text-xs italic text-muted-foreground">
                Exact location unavailable
              </span>
            )}
            {source.match_level === 'document' && (
              <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-500/50">
                whole-document match
              </Badge>
            )}
            {source.verified && (
              <Badge variant="outline" className="text-[10px] text-green-700 border-green-500/50">
                verified
              </Badge>
            )}
          </div>

          {source.excerpt && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3 border-l-2 border-blue-500/40 pl-2 italic">
              {source.excerpt}
            </p>
          )}
        </div>

        <Badge className={`flex-shrink-0 ${scoreClass}`}>{score}%</Badge>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user?.role as 'guest' | 'employee' | 'admin' | undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [documents, setDocuments] = useState<APIDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [documentError, setDocumentError] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    doc: any;
    result?: SearchResult;
    source?: SourceDocument;
  } | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedDocument[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedResults, setDisplayedResults] = useState<SearchResult[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load search history and recently viewed from localStorage
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // Load recent documents once the user is authenticated.
  // Waiting for `user` ensures _accessToken is set before we call the backend
  // directly, avoiding a race-condition 401 on page load.
  useEffect(() => {
    if (!user) return;
    const loadDocuments = async () => {
      try {
        const response = await DocumentAPI.getDocuments(0, 20);
        setDocuments(response.items ?? []);
      } catch (err) {
        setDocumentError(true);
        setDocuments([]);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    loadDocuments();
  }, [user]);

  // Perform AI search
  const handleSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    e?.preventDefault();
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);
    setShowHistory(false);

    setSearchError(null);
    try {
      const response = await SearchAPI.search({
        query,
        generate_answer: true,
        limit: 10,
      });
      setSearchResults(response);
      setDisplayedResults(response.results || []);

      // Add to search history
      addToSearchHistory(query, response.total_results || 0);
      setSearchHistory(getSearchHistory());

      // Log audit event
      await AuditLog.search(query, response.total_results || 0);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  /** Load the next page of results without re-generating the AI answer. */
  const handleLoadMore = async () => {
    if (!searchQuery.trim() || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await SearchAPI.search({
        query: searchQuery,
        limit: 10,
        skip: displayedResults.length,
        generate_answer: false,
      });
      setDisplayedResults(prev => [...prev, ...(response.results || [])]);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDocumentView = (doc: any, result?: SearchResult, source?: SourceDocument) => {
    setSelectedDocument({ doc, result, source });

    // Add to recently viewed
    if (doc.id && doc.title) {
      addToRecentlyViewed({
        id: typeof doc.id === 'number' ? doc.id : parseInt(doc.id),
        title: doc.title,
        fileType: doc.file_type,
      });
      setRecentlyViewed(getRecentlyViewed());

      // Log audit event
      AuditLog.documentView(
        typeof doc.id === 'number' ? doc.id : parseInt(doc.id),
        doc.title
      );
    }
  };

  // Cited passages are the evidence the answer actually rests on; the rest were
  // retrieved as supporting context and are listed separately.
  const sources: SourceDocument[] = searchResults?.source_documents ?? [];
  const citedSources = sources.filter(source => source.cited);
  const supportingSources = sources.filter(source => !source.cited);

  // GET /documents/{id} nests the file details under `doc_metadata`, while the
  // modal reads a flat `file_type`. Without flattening it the modal never takes
  // its PDF branch, so a citation cannot be opened at its page.
  const toModalDocument = (document: any, source: SourceDocument) => {
    const metadata = document?.doc_metadata ?? document?.metadata ?? {};
    return {
      id: document?.id ?? source.document_id,
      title: document?.title ?? source.title,
      content: document?.content ?? '',
      created_at: document?.created_at,
      updated_at: document?.updated_at,
      category: document?.category ?? source.category,
      tags: document?.tags,
      file_type: metadata.file_type ?? document?.file_type ?? source.file_type,
      file_path: metadata.filename ?? source.filename,
      has_original_file: document?.has_original_file ?? false,
      unreadable_pages: document?.unreadable_pages ?? [],
      metadata,
    };
  };

  // Open a citation at its passage. Search results only carry a 500-character
  // snippet, so fetch the document to show the passage in its real context.
  const openSourceEvidence = async (source: SourceDocument) => {
    const fromResults = searchResults?.results?.find(
      r => r.document_id === source.document_id
    );

    try {
      const document = await DocumentAPI.getDocument(source.document_id);
      handleDocumentView(toModalDocument(document, source), fromResults || undefined, source);
    } catch (err) {
      console.error('Could not load full document, falling back to snippet:', err);
      handleDocumentView(
        toModalDocument(
          {
            id: source.document_id,
            title: source.title,
            content: fromResults?.content ?? source.excerpt ?? '',
            created_at: fromResults?.created_at,
            category: fromResults?.category ?? source.category,
            file_type: fromResults?.file_type ?? source.file_type,
          },
          source
        ),
        fromResults || undefined,
        source
      );
    }
  };

  const [showUpload, setShowUpload] = useState(false);

  // Helper function to detect knowledge gaps
  const isKnowledgeGap = (results: SearchResponse | null): boolean => {
    if (!results) return false;

    // Check if no results or very few results
    const hasNoResults = !results.results || results.results.length === 0;
    const hasVeryFewResults = results.total_results === 0 || results.total_results < 2;

    // Check if answer indicates knowledge gap
    const knowledgeGapPhrases = [
      "don't have enough information",
      "cannot find",
      "no information",
      "insufficient information",
      "not found in",
      "unable to find",
      "no relevant information",
      "knowledge base does not contain",
    ];
    const answerIndicatesGap = results.answer
      ? knowledgeGapPhrases.some(phrase => results.answer.toLowerCase().includes(phrase))
      : false;

    return (hasNoResults || hasVeryFewResults) && (!results.answer || answerIndicatesGap);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">

        <section className="workspace-container pt-8 sm:pt-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div><p className="eyebrow mb-2">Your knowledge workspace</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">A little clarity goes a long way.</h1><p className="mt-2 text-sm text-muted-foreground">Find what you need. Understand what matters.</p></div>
            {canUploadDocuments(userRole) && <Button variant="outline" onClick={() => setShowUpload(true)} className="bg-card"><Upload className="h-4 w-4" />Upload documents</Button>}
          </div>
          <div className="relative rounded-2xl border bg-card p-5 shadow-sm sm:p-9">
            <div className="knowledge-grid pointer-events-none absolute inset-y-0 right-0 w-1/3 rounded-r-2xl opacity-60 [mask-image:linear-gradient(to_right,transparent,black)]" aria-hidden="true" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-4 w-4" />RAG-powered knowledge search</div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[32px]">What would you like to know?</h2>
              <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Ask a question in your own words. Get a grounded answer with references to your team’s documents.</p>
              <form onSubmit={handleSearch} className="relative" role="search">
                <label htmlFor="knowledge-query" className="sr-only">Search your internal knowledge base</label>
                <div className="flex flex-col gap-2 rounded-xl border bg-background p-2 shadow-sm transition-shadow focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 sm:flex-row sm:items-center">
                  <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="knowledge-query" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setShowHistory(true)} onKeyDown={e => { if (e.key === "Escape") setShowHistory(false); }} placeholder="Ask about policies, processes, or team knowledge…" className="h-12 border-0 bg-transparent pl-11 text-sm shadow-none focus-visible:ring-0 sm:text-base" disabled={isSearching} /></div>
                  <Button type="submit" disabled={isSearching || !searchQuery.trim()} className="h-11 px-5">{isSearching ? <><Loader2 className="h-4 w-4 animate-spin" />Searching…</> : <>Find answers<ArrowRight className="h-4 w-4" /></>}</Button>
                </div>
                {showHistory && searchHistory.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-card p-2 shadow-xl">
                    <div className="flex items-center justify-between border-b px-3 py-2"><span className="eyebrow">Recent searches</span><Button type="button" variant="ghost" size="icon" aria-label="Close search history" onClick={() => setShowHistory(false)}><X className="h-4 w-4" /></Button></div>
                    {searchHistory.slice(0, 6).map(item => <div key={item.query} className="flex items-center gap-2 rounded-lg hover:bg-muted"><button type="button" onClick={() => handleSearch(undefined, item.query)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left text-sm"><History className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{item.query}</span></button><Button type="button" variant="ghost" size="icon" aria-label={`Remove search: ${item.query}`} onClick={() => { removeFromSearchHistory(item.query); setSearchHistory(getSearchHistory()); }}><X className="h-3.5 w-3.5" /></Button></div>)}
                  </div>
                )}
              </form>
              <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-muted-foreground">Try asking</span>{["What is our remote work policy?", "How do I onboard a new team member?", "Where can I find IT guidelines?"].map(query => <button key={query} disabled={isSearching} onClick={() => handleSearch(undefined, query)} className="rounded-full border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50">{query}<ArrowUpRight className="ml-1 inline h-3 w-3" /></button>)}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Search, title: "Search with meaning", text: "Find relevant knowledge, beyond keywords." },
              { icon: Quote, title: "Follow the evidence", text: "Open citations to explore the original source." },
              { icon: Layers3, title: "Build on shared knowledge", text: "Bring your team’s documents into one place." },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-3 px-2 py-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.6} /><div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{text}</p></div></div>)}
          </div>
        </section>

        <div className="workspace-container py-8">
          {/* Search error */}
          {searchError && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {searchError}
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="mb-12 animate-fade-in">
              {/* AI Answer */}
              {searchResults.answer && (
                <Card className="mb-6 border-primary/25 bg-card shadow-sm animate-slide-in-from-bottom">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Answer from your knowledge base</CardTitle>
                          <CardDescription>Powered by {searchResults.search_method} search • {searchResults.execution_time.toFixed(2)}s</CardDescription>
                        </div>
                      </div>
                      <Badge className={citedSources.length === 0
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "bg-primary/10 text-primary"
                      }>
                        {citedSources.length} Cited Source{citedSources.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none mb-4">
                      {searchResults.answer.split('\n').map((paragraph, idx) => {
                        const trimmed = paragraph.trim();
                        if (!trimmed) return null;

                        return (
                          <p key={idx} className="text-base leading-relaxed text-foreground/90 mb-3">
                            {trimmed}
                          </p>
                        );
                      })}
                    </div>
                    {citedSources.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-primary" />
                          Evidence for this answer
                        </p>
                        <div className="grid gap-2">
                          {citedSources.map((source, idx) => (
                            <EvidenceRow
                              key={source.citation_id ?? idx}
                              source={source}
                              onOpen={openSourceEvidence}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {supportingSources.length > 0 && (
                      <details className="border-t pt-4 mt-4 group">
                        <summary className="text-sm font-semibold flex items-center gap-2 cursor-pointer list-none">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {supportingSources.length} more passage{supportingSources.length !== 1 ? 's' : ''} retrieved but not cited
                        </summary>
                        <div className="grid gap-2 mt-3">
                          {supportingSources.map((source, idx) => (
                            <EvidenceRow
                              key={source.citation_id ?? `supporting-${idx}`}
                              source={source}
                              onOpen={openSourceEvidence}
                            />
                          ))}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Search result cards */}
              {!isKnowledgeGap(searchResults) && displayedResults.length > 0 && (
                <div className="mb-8 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Search Results
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      Showing {displayedResults.length}
                      {searchResults && searchResults.total_results > 0 && ` of ${searchResults.total_results}`}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {displayedResults.map((result, idx) => (
                      <Card
                        key={`${result.document_id}-${idx}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); } }}
                        className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all hover:border-primary/30"
                        onClick={() => handleDocumentView({
                          id: result.document_id,
                          title: result.title,
                          content: result.content,
                          created_at: result.created_at,
                          category: result.category,
                          tags: result.tags,
                          file_type: result.file_type,
                        }, result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm">{result.title}</h3>
                                {result.file_type && (
                                  <Badge variant="secondary" className="text-xs">
                                    {result.file_type.toUpperCase()}
                                  </Badge>
                                )}
                                {result.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.summary || result.content?.substring(0, 200)}
                              </p>
                            </div>
                            <Badge className={`flex-shrink-0 ${
                              result.relevance_score >= 0.7
                                ? 'bg-primary/10 text-primary'
                                : result.relevance_score >= 0.4
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            }`}>
                              {Math.round(result.relevance_score * 100)}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Load more */}
                  {searchResults && displayedResults.length < searchResults.total_results && (
                    <div className="flex flex-col items-center gap-1 mt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Loading…
                          </>
                        ) : (
                          <>Load more results</>
                        )}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {searchResults.total_results - displayedResults.length} more available
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Knowledge Gap Alert or No results message */}
              {searchResults && isKnowledgeGap(searchResults) && (
                <KnowledgeGapAlert
                  query={searchQuery}
                  message={searchResults.answer || "I couldn't find relevant information in the knowledge base to answer your question. This might be because the information doesn't exist in our documents yet, or it needs to be phrased differently."}
                  onUploadClick={canUploadDocuments(userRole) ? () => setShowUpload(true) : undefined}
                  onRefineQuery={() => {
                    // Focus on search input
                    document.querySelector<HTMLInputElement>('#knowledge-query')?.focus();
                  }}
                  className="animate-fade-in"
                />
              )}
            </div>
          )}


          {!searchResults && (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="min-w-0 rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b p-5 sm:px-6"><div><h2 className="text-base font-semibold">Your knowledge library</h2><p className="mt-1 text-xs text-muted-foreground">Explore the latest documents available to you.</p></div><Link href="/chat?tab=documents" className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">View all<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
                {isLoadingDocs ? <div className="space-y-4 p-6" role="status" aria-label="Loading documents">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
                  : documentError ? <div className="p-10 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h3 className="text-sm font-semibold">Documents couldn’t be loaded</h3><p className="mt-2 text-xs text-muted-foreground">Please try again from the document library.</p><Link href="/chat?tab=documents" className="mt-4 inline-block text-sm font-medium text-primary">Open document library →</Link></div>
                  : documents.length > 0 ? <div className="divide-y">{documents.slice(0, 5).map(doc => <button key={doc.id} onClick={() => handleDocumentView(doc)} className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6"><span className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg border bg-background"><FileText className="h-5 w-5 text-primary" strokeWidth={1.5} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium group-hover:text-primary">{doc.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{doc.category || "Team knowledge"} · {new Date(doc.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></span><span className="hidden rounded-md border bg-background px-2 py-1 text-[10px] uppercase text-muted-foreground sm:block">{doc.file_type?.split("/").pop() || "Document"}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></button>)}</div>
                  : <div className="px-6 py-12 text-center"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted"><BookOpen className="h-6 w-6 text-primary" strokeWidth={1.5} /></span><h3 className="text-sm font-semibold">Your shared knowledge starts here</h3><p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-muted-foreground">{canUploadDocuments(userRole) ? "Add your first document to make it discoverable through search and AI answers." : "Documents shared with you will appear here. Ask your administrator to add team resources."}</p>{canUploadDocuments(userRole) && <Button variant="outline" size="sm" onClick={() => setShowUpload(true)} className="mt-5"><Upload className="h-3.5 w-3.5" />Upload a document</Button>}</div>}
              </section>
              <aside className="space-y-5">
                {canAccessChat(userRole) && <div className="rounded-xl bg-[#153d32] p-6 text-white"><span className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5"><Sparkles className="h-4 w-4 text-emerald-200" /></span><h2 className="text-base font-medium">Go deeper with AI.</h2><p className="mb-5 mt-2 text-xs leading-6 text-emerald-50/70">Connect ideas, ask follow-up questions, and explore your documents in a conversation.</p><Link href="/chat" className="flex items-center justify-between border-t border-white/15 pt-4 text-xs font-medium text-emerald-100">Start a conversation<ArrowRight className="h-4 w-4" /></Link></div>}
                <div className="rounded-xl border bg-card p-5"><h2 className="mb-4 flex items-center gap-2 text-xs font-semibold"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Recently viewed</h2>{recentlyViewed.length ? <div className="space-y-1">{recentlyViewed.slice(0, 4).map(doc => <Link key={doc.id} href={`/documents/${doc.id}`} className="group flex items-center gap-2 rounded-lg py-2 text-xs"><FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate group-hover:text-primary">{doc.title}</span><ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" /></Link>)}</div> : <p className="text-xs leading-6 text-muted-foreground">Pick up where you left off. Documents you open will appear here.</p>}</div>
              </aside>
            </div>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-[10px] text-muted-foreground"><span>Internal Knowledge Management System</span><span>Powered by RAG · Built around your knowledge</span></div>

        </div>

        {/* Document Modal */}
        {selectedDocument && (
          <DocumentModal
            isOpen={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            document={selectedDocument.doc}
            result={selectedDocument.result}
            citation={selectedDocument.source}
            searchQuery={searchQuery}
          />
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-zoom-in">
              <div className="p-6 border-b flex items-center justify-between bg-muted/40">
                <div>
                  <h2 className="text-xl font-semibold">
                    Upload Documents
                  </h2>
                  <p className="text-muted-foreground">Add documents to your knowledge base</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowUpload(false)}
                  className="hover:bg-red-500/10 hover:text-red-600 transition-colors"
                >
                  Close
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <DocumentUpload
                  onUploadComplete={() => {
                    setShowUpload(false);
                    // Refresh documents
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
