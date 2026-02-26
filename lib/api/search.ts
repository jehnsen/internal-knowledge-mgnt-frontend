import { BFF_BASE, fetchWithRetry, jsonHeaders, handleResponse } from './_http';
import type { PaginatedResponse } from './types';

export interface SearchRequest {
  query: string;
  limit?: number;
  /** Number of results to skip — enables paginating through results beyond the first page. */
  skip?: number;
  category?: string;
  tags?: string[];
  alpha?: number;
  use_chunks?: boolean;
  generate_answer?: boolean;
}

export interface SourceDocument {
  document_id: number;
  title: string;
  category: string | null;
  filename: string;
  file_type: string;
  chunk_index: number | null;
  relevance_score: number;
  score_breakdown: {
    keyword_score: number;
    semantic_score: number;
    combined_score: number;
  } | null;
}

export interface SearchResult {
  document_id: number;
  title: string;
  content: string;
  summary: string;
  category: string | null;
  tags: string[];
  filename: string;
  file_type: string;
  created_at: string;
  relevance_score: number;
  score_breakdown: {
    keyword_score: number;
    semantic_score: number;
    combined_score: number;
  };
}

export interface SearchResponse {
  query: string;
  answer: string;
  source_documents: SourceDocument[];
  results: SearchResult[];
  total_results: number;
  execution_time: number;
  search_method: string;
  alpha: number;
  rag_enabled: boolean;
}

export interface Citation {
  documentId: number;
  documentName: string;
  pageNumber?: number;
  chunkId?: string;
  content: string;
  relevanceScore: number;
}

export class SearchAPI {
  static async search(request: SearchRequest): Promise<SearchResponse> {
    // Route through the Next.js BFF so auth cookies are used server-side
    // (avoids cross-origin CORS issues with the backend).
    const response = await fetchWithRetry('/api/search', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    });
    return handleResponse<SearchResponse>(response);
  }

  static async getSearchHistory(
    skip: number = 0,
    limit: number = 50,
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    const response = await fetchWithRetry(`${BFF_BASE}/search/history?${params}`);
    return handleResponse<PaginatedResponse<any>>(response);
  }
}
