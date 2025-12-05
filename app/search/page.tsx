"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  FileText,
  Sparkles,
  MessageSquare,
  History,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DocumentAPI, SearchAPI, Document as APIDocument, SearchResponse, SearchResult } from "@/lib/api";
import { Citation } from "@/lib/types";
import { DocumentModal } from "@/components/DocumentModal";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useAuth } from "@/contexts/AuthContext";
import { canUploadDocuments, canAccessChat } from "@/lib/rbac";
import { addToSearchHistory, getSearchHistory, removeFromSearchHistory, addToRecentlyViewed, getRecentlyViewed, SearchHistoryItem, RecentlyViewedDocument } from "@/lib/storage";

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user?.role as 'guest' | 'employee' | 'admin' | undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [documents, setDocuments] = useState<APIDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<{
    doc: any;
    result?: SearchResult;
  } | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedDocument[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history and recently viewed from localStorage
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // Load recent documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await DocumentAPI.getDocuments(0, 20);
        setDocuments(response.items);
      } catch (err) {
        // Silently handle errors - user might not be authenticated yet
        setDocuments([]);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    loadDocuments();
  }, []);

  // Perform AI search
  const handleSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    e?.preventDefault();
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);
    setShowHistory(false);

    try {
      const response = await SearchAPI.search({
        query,
        generate_answer: true,
        limit: 10,
      });
      console.log('Hybrid search response:', response);
      setSearchResults(response);

      // Add to search history
      addToSearchHistory(query, response.total_results || 0);
      setSearchHistory(getSearchHistory());
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocumentView = (doc: any, result?: SearchResult) => {
    setSelectedDocument({ doc, result });

    // Add to recently viewed
    if (doc.id && doc.title) {
      addToRecentlyViewed({
        id: typeof doc.id === 'number' ? doc.id : parseInt(doc.id),
        title: doc.title,
        fileType: doc.file_type,
      });
      setRecentlyViewed(getRecentlyViewed());
    }
  };

  // Convert source_documents to citations for display
  const citations: Citation[] = searchResults?.source_documents
    ? searchResults.source_documents.map((source, index) => ({
        documentId: source.document_id,
        documentName: source.title,
        chunkId: `chunk_${source.document_id}_${source.chunk_index ?? index}`,
        content: source.filename, // Show filename as preview
        relevanceScore: source.relevance_score,
      }))
    : [];

  const [showUpload, setShowUpload] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        {/* Hero Search Section */}
        <section className="border-b bg-gradient-to-r from-background/95 via-blue-50/50 to-purple-50/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full mb-4">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Semantic Search
                </span>
              </div>
              {/* <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                What would you like to know?
              </h1> */}
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-900 via-red-600 to-red-400 bg-clip-text text-transparent">
                Access Hire Australia
              </h1>
              <p className="text-xl text-muted-foreground">
                Search your knowledge base using natural language
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto animate-slide-in-from-bottom relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  placeholder="Ask anything... e.g., 'What is the remote work policy?'"
                  className="pl-12 pr-44 h-14 text-lg shadow-lg border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all"
                  disabled={isSearching}
                />
                {/* <div className="absolute right-32 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchHistory.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="h-8"
                    >
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                  )}
                </div> */}
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Search
                    </span>
                  )}
                </Button>
              </div>

              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent Searches
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistory(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    {searchHistory.slice(0, 10).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                        onClick={() => handleSearch(undefined, item.query)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()} • {item.resultsCount} results
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromSearchHistory(item.query);
                            setSearchHistory(getSearchHistory());
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* Quick Actions */}
            <div className="max-w-3xl mx-auto mt-6 flex gap-3 justify-center flex-wrap">
              {canUploadDocuments(userRole) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpload(true)}
                  className="gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:border-blue-500/50 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              )}
              {canAccessChat(userRole) && (
                <Link href="/knowledge">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border-purple-500/50 transition-all"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat Assistant
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Search Results */}
          {searchResults && (
            <div className="mb-12 animate-fade-in">
              {/* AI Answer */}
              {searchResults.answer && (
                <Card className="mb-6 border-2 border-blue-500/30 shadow-xl bg-gradient-to-br from-white to-blue-50/30 animate-slide-in-from-bottom">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">AI-Generated Answer</CardTitle>
                          <CardDescription>Powered by {searchResults.search_method} search • {searchResults.execution_time.toFixed(2)}s</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        {citations.length} Source{citations.length !== 1 ? 's' : ''}
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
                    {citations.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            Source Documents (sorted by relevance)
                          </p>
                        </div>
                        <div className="grid gap-2">
                          {citations.map((citation, idx) => {
                            // Find the full document from results array
                            const fullDocument = searchResults.results?.find(r => r.document_id === citation.documentId);

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => {
                                  if (fullDocument) {
                                    handleDocumentView({
                                      id: fullDocument.document_id,
                                      title: fullDocument.title,
                                      content: fullDocument.content,
                                      created_at: fullDocument.created_at,
                                      category: fullDocument.category,
                                      tags: fullDocument.tags,
                                      file_type: fullDocument.file_type,
                                    }, fullDocument);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-xs italic font-bold text-muted-foreground group-hover:text-blue-600 transition-colors">
                                      (Source: {citation.documentName})
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`flex-shrink-0 ${
                                  citation.relevanceScore >= 0.7 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : ''
                                }${
                                  citation.relevanceScore >= 0.4 && citation.relevanceScore < 0.7 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''
                                }${
                                  citation.relevanceScore < 0.4 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : ''
                                }`}>
                                  {Math.round(citation.relevanceScore * 100)}%
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* No results message */}
              {searchResults && (!searchResults.results || searchResults.results.length === 0) && !searchResults.answer && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search query or upload more documents
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recent Documents (when no search) */}
          {!searchResults && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Recent Documents</h2>
                  <p className="text-muted-foreground">Your latest uploads and updates</p>
                </div>
                {canUploadDocuments(userRole) && (
                  <Link href="/knowledge">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New
                    </Button>
                  </Link>
                )}
              </div>

              {isLoadingDocs ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc, index) => (
                    <Card
                      key={doc.id}
                      className="hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleDocumentView(doc)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                              {doc.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {doc.content.substring(0, 150)}...
                        </p>
                        <div className="mt-4">
                          <Badge
                            variant={doc.embedding && doc.embedding.length > 0 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {doc.embedding && doc.embedding.length > 0 ? 'Indexed' : 'Processing'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your first document to get started
                    </p>
                    <Link href="/knowledge">
                      <Button size="lg">
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Document
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Document Modal */}
        {selectedDocument && (
          <DocumentModal
            isOpen={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            document={selectedDocument.doc}
            result={selectedDocument.result}
            searchQuery={searchQuery}
          />
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-zoom-in">
              <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
