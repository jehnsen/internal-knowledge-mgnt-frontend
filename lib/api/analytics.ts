import { BFF_BASE, fetchWithRetry, handleResponse } from './_http';

export interface AnalyticsOverview {
  total_documents: number;
  total_searches: number;
  total_chat_sessions: number;
  active_users: number;
  popular_queries: Array<{ query: string; count: number }>;
  top_documents: Array<{ document_id: number; title: string; access_count: number }>;
  popular_documents?: Array<{
    document_id: number;
    document_title: string;
    view_count: number;
    last_viewed: string;
  }>;
  top_searches?: Array<{
    query: string;
    count: number;
    last_searched: string;
  }>;
  user_activity?: {
    total_searches: number;
    total_document_views: number;
    total_uploads: number;
    total_deletes: number;
    period_days: number;
  };
}

export interface SearchTrend {
  date: string;
  query: string;
  count: number;
}

export interface TopDocument {
  document_id: number;
  title: string;
  access_count: number;
  last_accessed: string;
}

export interface KnowledgeGap {
  query: string;
  search_count: number;
  last_searched: string;
}

export class AnalyticsAPI {
  static async getOverview(): Promise<AnalyticsOverview> {
    const response = await fetchWithRetry(`${BFF_BASE}/analytics/dashboard`);
    return handleResponse<AnalyticsOverview>(response);
  }

  static async getTopDocuments(limit: number = 10): Promise<TopDocument[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await fetchWithRetry(`${BFF_BASE}/analytics/popular-documents?${params}`);
    return handleResponse<TopDocument[]>(response);
  }

  static async getSearchTrends(days: number = 30): Promise<SearchTrend[]> {
    const params = new URLSearchParams({ days: days.toString(), limit: '20' });
    const response = await fetchWithRetry(`${BFF_BASE}/analytics/search-trends?${params}`);
    return handleResponse<SearchTrend[]>(response);
  }

  static async getKnowledgeGaps(days: number = 30, limit: number = 20): Promise<KnowledgeGap[]> {
    const params = new URLSearchParams({ days: days.toString(), limit: limit.toString() });
    const response = await fetchWithRetry(`${BFF_BASE}/analytics/knowledge-gaps?${params}`);
    return handleResponse<KnowledgeGap[]>(response);
  }
}
