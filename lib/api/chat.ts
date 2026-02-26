import { BFF_BASE, fetchWithRetry, jsonHeaders, handleResponse } from './_http';
import type { SourceDocument } from './search';

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

export class ChatAPI {
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Route through the Next.js BFF so auth cookies are used server-side
    // (avoids cross-origin CORS issues with the backend).
    const response = await fetchWithRetry('/api/chat', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    });
    return handleResponse<ChatResponse>(response);
  }

  static async getSessions(limit: number = 50, offset: number = 0): Promise<ChatSession[]> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    const response = await fetchWithRetry(`${BFF_BASE}/chat/sessions?${params}`);
    const data = await handleResponse<any>(response);

    if (Array.isArray(data)) return data;
    if (data?.sessions && Array.isArray(data.sessions)) return data.sessions;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return [];
  }

  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await fetchWithRetry(
      `${BFF_BASE}/chat/sessions/${sessionId}/messages`,
    );
    return handleResponse<ChatMessage[]>(response);
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const response = await fetchWithRetry(`${BFF_BASE}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete session' }));
      throw new Error(error.detail);
    }
  }
}
