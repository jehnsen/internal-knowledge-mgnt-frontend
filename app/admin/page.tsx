"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, FileText, MessageSquare, Users, BarChart3, Search,
  Upload, Trash2, Shield, Activity, AlertCircle, Database,
  Eye, Download, Filter, Calendar, Clock, Tag, Key,
  UserCheck, FileWarning, TrendingDown, HardDrive, Settings, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnalyticsAPI, DocumentAPI, TopDocument, SearchTrend } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "@/components/DocumentUpload";

interface AnalyticsOverview {
  total_documents: number;
  total_searches: number;
  total_chat_sessions: number;
  active_users: number;
  popular_queries: Array<{ query: string; count: number }>;
  top_documents: Array<{ document_id: number; title: string; access_count: number }>;
}

interface DocumentItem {
  id: number;
  title: string;
  file_type?: string;
  file_path?: string;
  created_at?: string;
  category?: string;
  metadata?: any;
}

interface UserActivity {
  user_id: number;
  username: string;
  email: string;
  last_login?: string;
  search_count: number;
  chat_count: number;
  document_uploads: number;
}

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  timestamp: string;
  details?: any;
}

interface KnowledgeGap {
  query: string;
  search_count: number;
  no_results: boolean;
  avg_relevance: number;
  suggested_action: string;
}

const sidebarItems = [
  { id: "overview", label: "Analytics", icon: BarChart3 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "keywords", label: "Keywords", icon: Tag },
  { id: "gaps", label: "Knowledge Gaps", icon: FileWarning },
  { id: "audit", label: "Audit Logs", icon: Shield },
  { id: "gdpr", label: "GDPR & Privacy", icon: Key },
];

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topDocs, setTopDocs] = useState<TopDocument[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [searchFilter, setSearchFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load analytics data
      const [overviewData, docsData, trendsData] = await Promise.all([
        AnalyticsAPI.getOverview().catch(() => ({
          total_documents: 0,
          total_searches: 0,
          total_chat_sessions: 0,
          active_users: 0,
          popular_queries: [],
          top_documents: [],
        })),
        AnalyticsAPI.getTopDocuments(10).catch(() => []),
        AnalyticsAPI.getSearchTrends(30).catch(() => []),
      ]);

      setOverview(overviewData);
      setTopDocs(docsData);
      setSearchTrends(trendsData);

      // Load documents list
      const docsResponse = await DocumentAPI.getDocuments(0, 100).catch(() => ({ items: [], total: 0 }));
      console.log('Admin dashboard - loaded documents:', docsResponse);
      setDocuments(docsResponse.items);

      // Mock data for features that need backend implementation
      setUsers([
        {
          user_id: 1,
          username: "admin",
          email: "admin@company.com",
          last_login: new Date().toISOString(),
          search_count: 45,
          chat_count: 23,
          document_uploads: 12
        }
      ]);

      setAuditLogs([
        {
          id: 1,
          user_id: 1,
          username: "admin",
          action: "DOCUMENT_UPLOAD",
          resource_type: "document",
          timestamp: new Date().toISOString(),
        }
      ]);

      setKnowledgeGaps([]);

    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await DocumentAPI.deleteDocument(docId);
      toast.success('Document deleted successfully');
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    toast.success('Document uploaded successfully');
    // Reload documents
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
          <LoadingState message="Loading admin dashboard..." />
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

  const filteredDocuments = (documents || []).filter(doc =>
    doc.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    doc.file_type?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                System Management
              </p>

              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <Button
                  onClick={loadDashboardData}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {/* Overview Stats - Always visible */}
            {activeSection === "overview" && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
                  <p className="text-muted-foreground">
                    Track usage, engagement, and knowledge base insights
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card className="border-2 hover:border-blue-500/50 hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Total Documents</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {overview?.total_documents || documents?.length || 0}
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
                            {overview?.active_users || users?.length || 0}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                </div>
              </>
            )}

            {/* Document Management Section */}
            {activeSection === "documents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Document Management</h1>
                    <p className="text-muted-foreground">
                      Manage all documents in the knowledge base ({documents?.length || 0} total)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search documents..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-64"
                    />
                    <Button
                      onClick={() => setShowUpload(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
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
                                      {doc.file_type.toUpperCase()}
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
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No documents found</p>
                          <p className="text-sm">Upload your first document to get started</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* User Management Section */}
            {activeSection === "users" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">User Management</h1>
                  <p className="text-muted-foreground">
                    Monitor user activity and manage permissions
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.last_login && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Last login: {new Date(user.last_login).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4 items-center">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{user.search_count}</p>
                              <p className="text-xs text-muted-foreground">Searches</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{user.chat_count}</p>
                              <p className="text-xs text-muted-foreground">Chats</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{user.document_uploads}</p>
                              <p className="text-xs text-muted-foreground">Uploads</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Keywords Section */}
            {activeSection === "keywords" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Search Keywords & Trends</h1>
                  <p className="text-muted-foreground">
                    Analyze search patterns and popular topics
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    {overview?.popular_queries && overview.popular_queries.length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {overview.popular_queries.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline">#{idx + 1}</Badge>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="font-medium mb-1 line-clamp-2">{item.query}</p>
                            <p className="text-sm text-muted-foreground">{item.count} searches</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No keyword data available yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Knowledge Gaps Section */}
            {activeSection === "gaps" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Knowledge Gaps Detection</h1>
                  <p className="text-muted-foreground">
                    Identify queries with poor results or missing information
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Knowledge Gap Analysis</p>
                      <p className="text-sm max-w-md mx-auto">
                        This feature will identify search queries that return low-quality results
                        or no results, helping you improve your knowledge base coverage.
                      </p>
                      <Badge className="mt-4" variant="outline">
                        Coming Soon - Backend Implementation Required
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Audit Logs Section */}
            {activeSection === "audit" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Audit Logs & System Activity</h1>
                  <p className="text-muted-foreground">
                    Track all system actions and user activities
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                <span className="text-blue-600">{log.username}</span> performed{" "}
                                <Badge variant="outline" className="mx-1">{log.action}</Badge>
                                on {log.resource_type}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* GDPR Section */}
            {activeSection === "gdpr" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">GDPR & Data Privacy</h1>
                  <p className="text-muted-foreground">
                    Data protection compliance and user data management
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border">
                          <HardDrive className="h-8 w-8 text-blue-600 mb-3" />
                          <p className="font-semibold mb-1">Data Storage</p>
                          <p className="text-2xl font-bold mb-2">{documents?.length || 0} docs</p>
                          <p className="text-xs text-muted-foreground">Total documents stored</p>
                        </div>
                        <div className="p-4 rounded-lg border">
                          <Users className="h-8 w-8 text-green-600 mb-3" />
                          <p className="font-semibold mb-1">User Records</p>
                          <p className="text-2xl font-bold mb-2">{users?.length || 0} users</p>
                          <p className="text-xs text-muted-foreground">Active user accounts</p>
                        </div>
                        <div className="p-4 rounded-lg border">
                          <Shield className="h-8 w-8 text-purple-600 mb-3" />
                          <p className="font-semibold mb-1">Audit Trail</p>
                          <p className="text-2xl font-bold mb-2">{auditLogs?.length || 0} logs</p>
                          <p className="text-xs text-muted-foreground">Activity records</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Data Management Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button variant="outline" className="justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Export All User Data
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Export Audit Logs
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Request Data Deletion
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Shield className="h-4 w-4 mr-2" />
                            Privacy Policy Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>

        {/* Document Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Documents</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <DocumentUpload onUploadComplete={handleUploadSuccess} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
