"use client";

import { useState, useEffect } from "react";
import { TrendingUp, FileText, MessageSquare, Users, BarChart3, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnalyticsAPI, TopDocument, SearchTrend } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsOverview {
  total_documents: number;
  total_searches: number;
  total_chat_sessions: number;
  active_users: number;
  popular_queries: Array<{ query: string; count: number }>;
  top_documents: Array<{ document_id: number; title: string; access_count: number }>;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topDocs, setTopDocs] = useState<TopDocument[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, docsData, trendsData] = await Promise.all([
        AnalyticsAPI.getOverview(),
        AnalyticsAPI.getTopDocuments(10),
        AnalyticsAPI.getSearchTrends(30),
      ]);

      setOverview(overviewData);
      setTopDocs(docsData);
      setSearchTrends(trendsData);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);

      // Check if backend endpoints are not implemented
      const errorMessage = err.message || 'Failed to load analytics data';

      if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
        // Backend endpoints not implemented - show empty state with helpful message
        console.warn('Analytics endpoints not yet implemented on backend');
        setOverview({
          total_documents: 0,
          total_searches: 0,
          total_chat_sessions: 0,
          active_users: 0,
          popular_queries: [],
          top_documents: [],
        });
        setTopDocs([]);
        setSearchTrends([]);
        // Don't set error - just show empty state
      } else {
        // Other errors - show error message
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
          <LoadingState message="Loading analytics..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-8">
          <Card className="max-w-2xl mx-auto border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Track usage, engagement, and knowledge base insights
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-2 hover:border-blue-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Documents</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {overview?.total_documents || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-purple-50/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Searches</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {overview?.total_searches || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-green-50/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Chat Sessions</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {overview?.total_chat_sessions || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-orange-50/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Active Users</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {overview?.active_users || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Tabs defaultValue="queries" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="queries">Popular Queries</TabsTrigger>
              <TabsTrigger value="documents">Top Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="queries" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Most Searched Queries
                  </CardTitle>
                  <CardDescription>
                    The most frequently searched questions in your knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overview?.popular_queries && overview.popular_queries.length > 0 ? (
                    <div className="space-y-3">
                      {overview.popular_queries.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              #{idx + 1}
                            </Badge>
                            <p className="text-sm font-medium">{item.query}</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {item.count} searches
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No search data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Most Accessed Documents
                  </CardTitle>
                  <CardDescription>
                    Documents that are referenced most frequently in searches and chats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topDocs && topDocs.length > 0 ? (
                    <div className="space-y-3">
                      {topDocs.map((doc, idx) => (
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
                              <p className="text-xs text-muted-foreground">
                                Last accessed: {new Date(doc.last_accessed).toLocaleDateString()}
                              </p>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
