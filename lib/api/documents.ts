import {
  BFF_BASE,
  fetchWithRetry,
  jsonHeaders,
  handleResponse,
  UPLOAD_TIMEOUT_MS,
  MAX_RETRIES,
} from './_http';
import type { PaginatedResponse } from './types';
import { SearchAPI, type SearchResponse } from './search';

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

export class DocumentAPI {
  static async createDocument(data: DocumentCreate): Promise<Document> {
    const response = await fetchWithRetry(`${BFF_BASE}/documents/`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Document>(response);
  }

  static async uploadDocumentFile(
    file: File,
    category?: string,
    tags?: string[],
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (category) formData.append('category', category);
    if (tags && tags.length > 0) formData.append('tags', tags.join(', '));

    console.log('Uploading file:', file.name, 'category:', category, 'tags:', tags);

    // No Content-Type — the browser sets it with the multipart boundary.
    // No retries — avoid double-uploading on a retry after partial completion.
    const response = await fetchWithRetry(
      `${BFF_BASE}/upload/document`,
      { method: 'POST', body: formData },
      0,
      UPLOAD_TIMEOUT_MS,
    );
    return handleResponse<Document>(response);
  }

  static async getDocuments(
    skip: number = 0,
    limit: number = 100,
    filters?: Record<string, any>,
  ): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, String(value));
      });
    }
    const response = await fetchWithRetry(`${BFF_BASE}/documents/?${params}`);
    return handleResponse<PaginatedResponse<Document>>(response);
  }

  static async getDocument(id: number): Promise<Document> {
    const response = await fetchWithRetry(`${BFF_BASE}/documents/${id}`);
    return handleResponse<Document>(response);
  }

  static async updateDocument(id: number, data: DocumentUpdate): Promise<Document> {
    const response = await fetchWithRetry(`${BFF_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Document>(response);
  }

  static async deleteDocument(id: number): Promise<void> {
    const response = await fetchWithRetry(`${BFF_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete document' }));
      throw new Error(error.detail);
    }
  }
}

// ---------------------------------------------------------------------------
// Legacy compatibility shim — kept so existing callers don't need to change
// ---------------------------------------------------------------------------
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

  static async query(
    request: { query: string; generate_answer?: boolean },
  ): Promise<SearchResponse> {
    return SearchAPI.search({
      query: request.query,
      generate_answer: request.generate_answer ?? true,
      limit: 10,
    });
  }
}
