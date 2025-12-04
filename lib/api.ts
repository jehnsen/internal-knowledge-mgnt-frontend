// API service layer for RAG backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Types based on your backend schema
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: 'admin' | 'user';  // Add role field
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  file_path?: string;
  file_type?: string;
  file_size?: number;
  metadata?: Record<string, any>;
  user_id: number;
  created_at: string;
  updated_at: string;
  embedding?: number[];
}

export interface DocumentCreate {
  title: string;
  content: string;
  file_path?: string;
  file_type?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  category?: string;
  tags?: string[];
  alpha?: number;
  use_chunks?: boolean;
  generate_answer?: boolean;
}

// Source document from hybrid search
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

// Full document result from hybrid search
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
  answer: string;  // RAG-generated answer
  source_documents: SourceDocument[];  // Prioritized sources
  results: SearchResult[];  // Full document results
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Chat Session Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceDocument[];
}

export interface ChatSession {
  session_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  message_count: number;
  title?: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  use_knowledge_base?: boolean;
  max_history?: number;
  search_limit?: number;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  sources: SourceDocument[];
  timestamp: string;
}

// Analytics Types
export interface AnalyticsOverview {
  total_documents: number;
  total_searches: number;
  total_chat_sessions: number;
  active_users: number;
  popular_queries: Array<{ query: string; count: number }>;
  top_documents: Array<{ document_id: number; title: string; access_count: number }>;
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

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle authentication/authorization errors
    if (response.status === 401 || response.status === 403) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');

        // Show elegant toast notification
        const isExpired = response.status === 401;
        const message = isExpired
          ? 'Your session has expired. Please log in again.'
          : 'Authentication failed. Please log in again.';

        // Dynamically import and show toast
        import('sonner').then(({ toast }) => {
          toast.error(message, {
            description: 'Redirecting to login page...',
            duration: 3000,
          });
        });

        // Redirect to login after brief delay
        setTimeout(() => {
          window.location.href = '/login?sessionExpired=true';
        }, 1500);

        throw new Error(message);
      }
    }

    let errorDetail = 'An error occurred';
    try {
      const error = await response.json();
      errorDetail = error.detail || error.message || errorDetail;
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        if (text) errorDetail = text.substring(0, 200); // Limit error message length
      } catch {
        errorDetail = `API Error: ${response.status} ${response.statusText}`;
      }
    }
    throw new Error(errorDetail);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid response format from server');
  }
}

export class AuthAPI {
  static async register(data: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleResponse<User>(response);
  }

  static async login(data: LoginRequest): Promise<AuthTokens> {
    // Backend expects JSON format, not form data
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: data.username,
        password: data.password,
      }),
    });

    const tokens = await handleResponse<AuthTokens>(response);

    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }

    return tokens;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return handleResponse<User>(response);
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  static isAuthenticated(): boolean {
    return getAuthToken() !== null;
  }
}

export class DocumentAPI {
  static async createDocument(data: DocumentCreate): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/documents/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<Document>(response);
  }

  static async uploadDocumentFile(file: File, category?: string, tags?: string[]): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file, file.name);  // Include filename explicitly

    if (category) {
      formData.append('category', category);
    }

    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(', '));  // Space after comma like Postman
    }

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Log the upload attempt
    console.log('Uploading file:', file.name, 'category:', category, 'tags:', tags);

    const response = await fetch(`${API_BASE_URL}${API_VERSION}/upload/document`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse<Document>(response);
  }

  static async getDocuments(
    skip: number = 0,
    limit: number = 100,
    filters?: Record<string, any>
  ): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/documents/?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<PaginatedResponse<Document>>(response);
  }

  static async getDocument(id: number): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/documents/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Document>(response);
  }

  static async updateDocument(id: number, data: DocumentUpdate): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/documents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<Document>(response);
  }

  static async deleteDocument(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete document' }));
      throw new Error(error.detail);
    }
  }
}

export class SearchAPI {
  static async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/hybrid-search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse<SearchResponse>(response);
  }

  static async getSearchHistory(
    skip: number = 0,
    limit: number = 50
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/search/history?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<PaginatedResponse<any>>(response);
  }
}

// Legacy compatibility - keeping old interface names
export class KnowledgeAPI {
  static async uploadDocument(file: File, category?: string, tags?: string[]): Promise<Document> {
    return DocumentAPI.uploadDocumentFile(file, category, tags);
  }

  static async getDocuments(): Promise<Document[]> {
    const response = await DocumentAPI.getDocuments(0, 100);
    return response.items;
  }

  static async deleteDocument(documentId: string | number): Promise<void> {
    return DocumentAPI.deleteDocument(Number(documentId));
  }

  static async query(request: { query: string; generate_answer?: boolean }): Promise<SearchResponse> {
    return SearchAPI.search({
      query: request.query,
      generate_answer: request.generate_answer ?? true,
      limit: 10,
    });
  }
}

// Chat API
export class ChatAPI {
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/chat/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(request),
    });

    return handleResponse<ChatResponse>(response);
  }

  static async getSessions(limit: number = 50, offset: number = 0): Promise<ChatSession[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/chat/sessions?${params}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    return handleResponse<ChatSession[]>(response);
  }

  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/chat/sessions/${sessionId}/messages`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    return handleResponse<ChatMessage[]>(response);
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/chat/sessions/${sessionId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete session' }));
      throw new Error(error.detail);
    }
  }
}

// Analytics API
export class AnalyticsAPI {
  static async getOverview(): Promise<AnalyticsOverview> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/analytics/overview`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return handleResponse<AnalyticsOverview>(response);
  }

  static async getTopDocuments(limit: number = 10): Promise<TopDocument[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/analytics/top-documents?${params}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    return handleResponse<TopDocument[]>(response);
  }

  static async getSearchTrends(days: number = 30): Promise<SearchTrend[]> {
    const params = new URLSearchParams({
      days: days.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/analytics/search-trends?${params}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    return handleResponse<SearchTrend[]>(response);
  }
}

// Download API
export class DownloadAPI {
  static getDocumentDownloadUrl(documentId: number): string {
    const token = getAuthToken();
    return `${API_BASE_URL}${API_VERSION}/documents/${documentId}/download?token=${token}`;
  }

  static async downloadDocument(documentId: number, filename?: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/documents/${documentId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `document_${documentId}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
