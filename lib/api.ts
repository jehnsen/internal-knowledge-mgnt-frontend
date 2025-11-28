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
  top_k?: number;
  use_rag?: boolean;
  filters?: Record<string, any>;
}

export interface SearchResult {
  document: Document;
  similarity_score: number;
  chunk_content?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  rag_response?: string;
  query: string;
  total_results: number;
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
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }
  return response.json();
}

export class AuthAPI {
  static async register(data: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  static async uploadDocumentFile(file: File, title?: string, metadata?: Record<string, any>): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    if (title) {
      formData.append('title', title);
    }

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${API_VERSION}/documents/`, {
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
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/search/`, {
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
  static async uploadDocument(file: File, description?: string): Promise<Document> {
    return DocumentAPI.uploadDocumentFile(file, file.name, { description });
  }

  static async getDocuments(): Promise<Document[]> {
    const response = await DocumentAPI.getDocuments(0, 100);
    return response.items;
  }

  static async deleteDocument(documentId: string | number): Promise<void> {
    return DocumentAPI.deleteDocument(Number(documentId));
  }

  static async query(request: { query: string; use_rag?: boolean }): Promise<SearchResponse> {
    return SearchAPI.search({
      query: request.query,
      use_rag: request.use_rag ?? true,
      top_k: 5,
    });
  }
}
