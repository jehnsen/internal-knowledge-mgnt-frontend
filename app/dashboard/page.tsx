"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  FileText,
  Brain,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Filter,
  SortDesc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DocumentAPI, SearchAPI, Document as APIDocument, SearchResponse, SearchResult } from "@/lib/api";
import { CitationCard } from "@/components/CitationCard";
import { Citation } from "@/lib/types";
import { DocumentModal } from "@/components/DocumentModal";
import { DocumentUpload } from "@/components/DocumentUpload";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [documents, setDocuments] = useState<APIDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    doc: any;
    result?: SearchResult;
  } | null>(null);

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
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await SearchAPI.search({
        query: searchQuery,
        use_rag: true,
        top_k: 10,
      });
      console.log('Search response:', response);
      setSearchResults(response);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Convert search results to citations
  const citations: Citation[] = searchResults?.results
    ? searchResults.results
        .filter(result => result && (result.document || result.title))
        .map((result, index) => {
          // Handle both formats: nested document or flat result
          const doc = result.document || result;
          return {
            documentId: doc.id || index,
            documentName: doc.title || 'Untitled Document',
            chunkId: `chunk_${doc.id || index}_${index}`,
            content: result.chunk_content || (doc.content ? doc.content.substring(0, 200) + '...' : 'No content available'),
            relevanceScore: result.similarity_score || 0,
          };
        })
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
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                What would you like to know?
              </h1>
              <p className="text-xl text-muted-foreground">
                Search your knowledge base using natural language
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto animate-slide-in-from-bottom">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything... e.g., 'What is the remote work policy?'"
                  className="pl-12 pr-32 h-14 text-lg shadow-lg border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all"
                  disabled={isSearching}
                />
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
            </form>

            {/* Quick Actions */}
            <div className="max-w-3xl mx-auto mt-6 flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(true)}
                className="gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:border-blue-500/50 transition-all"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border-purple-500/50 transition-all"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showAIAssistant ? 'Hide' : 'Show'} Chat Assistant
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Search Results */}
          {searchResults && (
            <div className="mb-12 animate-fade-in">
              {/* AI Answer */}
              {searchResults.rag_response && (
                <Card className="mb-6 border-primary/50 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>AI Answer</CardTitle>
                        <CardDescription>Generated from your documents</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg leading-relaxed mb-4">{searchResults.rag_response}</p>
                    {citations.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3 text-muted-foreground">
                          Sources ({citations.length})
                        </p>
                        <div className="grid gap-3">
                          {citations.slice(0, 3).map((citation, idx) => (
                            <CitationCard key={idx} citation={citation} index={idx} />
                          ))}
                        </div>
                        {citations.length > 3 && (
                          <Button variant="link" className="mt-2">
                            View all {citations.length} sources
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Document Results */}
              {searchResults.results && searchResults.results.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      Document Results ({searchResults.total_results})
                    </h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <SortDesc className="h-4 w-4 mr-2" />
                        Sort
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.results
                      .filter(result => result && (result.document || result.title))
                      .map((result, index) => {
                        // Handle both formats: nested document or flat result
                        const doc = result.document || result;
                        const confidenceScore = Math.round((result.similarity_score || 0) * 100);
                        return (
                          <Card
                            key={index}
                            className="group hover:shadow-xl hover:border-blue-500/50 hover:-translate-y-1 transition-all cursor-pointer bg-gradient-to-br from-white to-blue-50/30 animate-slide-in-from-bottom"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setSelectedDocument({ doc, result })}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                                <Badge
                                  className={`text-xs ${
                                    confidenceScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                    confidenceScore >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                                    'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                  }`}
                                >
                                  {confidenceScore}% match
                                </Badge>
                              </div>
                              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                {doc.title || 'Untitled Document'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {result.chunk_content || (doc.content ? doc.content.substring(0, 150) + '...' : 'No content available')}
                              </p>
                              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                                {doc.category && (
                                  <Badge variant="outline" className="capitalize">
                                    {doc.category}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* No results message */}
              {searchResults && (!searchResults.results || searchResults.results.length === 0) && !searchResults.rag_response && (
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
                <Link href="/knowledge">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                </Link>
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
                      onClick={() => setSelectedDocument({ doc })}
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

        {/* AI Assistant Sidebar (Collapsible) */}
        {showAIAssistant && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-background border-l shadow-2xl z-40 animate-slide-in-from-right">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIAssistant(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Use the search bar above for quick answers, or go to the{' '}
                    <Link href="/knowledge" className="text-primary hover:underline">
                      AI Assistant page
                    </Link>{' '}
                    for a full conversation interface.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        )}

        {/* Document Modal */}
        {selectedDocument && (
          <DocumentModal
            isOpen={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            document={selectedDocument.doc}
            similarityScore={selectedDocument.result?.similarity_score}
            chunkContent={selectedDocument.result?.chunk_content}
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
