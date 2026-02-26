"use client";

import { useState, useEffect } from "react";
import { AnalyticsAPI, TopDocument } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { PopularQueries } from "@/components/admin/analytics/PopularQueries";
import { TopDocuments } from "@/components/admin/analytics/TopDocuments";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsOverview {
  total_documents: number;
  total_searches: number;
  total_chat_sessions: number;
  active_users: number;
  popular_queries?: Array<{ query: string; count: number }>;
  top_searches?: Array<{ query: string; count: number; last_searched: string }>;
  popular_documents?: Array<{
    document_id: number;
    document_title: string;
    view_count: number;
    last_viewed: string;
  }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topDocs, setTopDocs] = useState<TopDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAnalyticsData();
  }, [user]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, docsData] = await Promise.all([
        AnalyticsAPI.getOverview().then((data) => {
          console.log('✅ Analytics Overview API response:', data);
          return data;
        }).catch((err) => {
          console.error('❌ Analytics Overview API failed:', err);
          return {
            total_documents: 0,
            total_searches: 0,
            total_chat_sessions: 0,
            active_users: 0,
            popular_queries: [],
          };
        }),
        AnalyticsAPI.getTopDocuments(10).then((data) => {
          console.log('✅ Top Documents API response:', data);
          return data;
        }).catch((err) => {
          console.error('❌ Top Documents API failed:', err);
          return [];
        }),
      ]);

      setOverview(overviewData);
      setTopDocs(docsData);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Prepare data for components
  const searchData = overview?.top_searches || overview?.popular_queries || [];
  const popularDocs = overview?.popular_documents || [];
  const combinedDocs = topDocs.length > 0 ? topDocs : popularDocs.map(doc => ({
    document_id: doc.document_id,
    title: doc.document_title,
    access_count: doc.view_count,
    last_accessed: doc.last_viewed
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
        <p className="text-muted-foreground">
          Track usage, engagement, and knowledge base insights
        </p>
      </div>

      <StatsCards
        totalDocuments={overview?.total_documents || 0}
        totalSearches={overview?.total_searches || 0}
        totalChatSessions={overview?.total_chat_sessions || 0}
        activeUsers={overview?.active_users || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularQueries queries={searchData} />
        <TopDocuments documents={combinedDocs} />
      </div>
    </div>
  );
}
