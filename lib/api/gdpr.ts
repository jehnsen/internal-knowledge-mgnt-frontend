import {
  BFF_BASE,
  fetchWithRetry,
  jsonHeaders,
  handleResponse,
  UPLOAD_TIMEOUT_MS,
  MAX_RETRIES,
} from './_http';
import type { PaginatedUserResponse, AuditLog } from './types';
import type { User } from './auth';

export type { AuditLog };

export interface UserActivityData {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
  last_login?: string;
  search_count: number;
  chat_count: number;
  document_uploads: number;
  search_history: any[];
  chat_sessions: any[];
  uploaded_documents: any[];
}

export interface DataDeletionRequest {
  user_id: number;
  reason?: string;
  delete_documents?: boolean;
  delete_chat_history?: boolean;
  delete_search_history?: boolean;
}

export interface GDPRStats {
  total_users: number;
  total_documents: number;
  total_searches: number;
  total_chat_sessions: number;
  total_audit_logs: number;
  data_retention_days: number;
}

export class GDPRAPI {
  static async getStats(): Promise<GDPRStats> {
    const response = await fetchWithRetry(`${BFF_BASE}/gdpr/data-summary`);
    return handleResponse<GDPRStats>(response);
  }

  static async exportUserData(userId?: number): Promise<Blob> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    const endpoint = `${BFF_BASE}/gdpr/data-export${params.toString() ? '?' + params : ''}`;
    const response = await fetchWithRetry(endpoint, {}, MAX_RETRIES, UPLOAD_TIMEOUT_MS);
    if (!response.ok) throw new Error('Failed to export user data');
    return response.blob();
  }

  static async exportUserDataCSV(userId?: number): Promise<Blob> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    const endpoint = `${BFF_BASE}/gdpr/data-export-csv${params.toString() ? '?' + params : ''}`;
    const response = await fetchWithRetry(endpoint, {}, MAX_RETRIES, UPLOAD_TIMEOUT_MS);
    if (!response.ok) throw new Error('Failed to export user data as CSV');
    return response.blob();
  }

  static async downloadUserData(userId?: number, username?: string): Promise<void> {
    const blob = await this.exportUserData(userId);
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `user_data_${username || userId || 'me'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async exportAuditLogs(startDate?: string, endDate?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate)   params.append('end_date', endDate);
    const response = await fetchWithRetry(
      `${BFF_BASE}/gdpr/audit-logs/export?${params}`,
      {},
      MAX_RETRIES,
      UPLOAD_TIMEOUT_MS,
    );
    if (!response.ok) throw new Error('Failed to export audit logs');
    return response.blob();
  }

  static async downloadAuditLogs(startDate?: string, endDate?: string): Promise<void> {
    const blob = await this.exportAuditLogs(startDate, endDate);
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async requestDataDeletion(
    request: DataDeletionRequest,
  ): Promise<{ message: string; request_id?: number }> {
    const response = await fetchWithRetry(`${BFF_BASE}/gdpr/delete-my-data`, {
      method: 'DELETE',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    });
    return handleResponse<{ message: string; request_id?: number }>(response);
  }

  static async getPrivacyReport(): Promise<any> {
    const response = await fetchWithRetry(`${BFF_BASE}/gdpr/privacy-report`);
    return handleResponse<any>(response);
  }

  static async getConsentStatus(): Promise<any> {
    const response = await fetchWithRetry(`${BFF_BASE}/gdpr/consent-status`);
    return handleResponse<any>(response);
  }

  static async getUserActivity(userId: number): Promise<UserActivityData> {
    const response = await fetchWithRetry(`${BFF_BASE}/users/${userId}/activity`);
    return handleResponse<UserActivityData>(response);
  }

  static async getUsers(
    skip: number = 0,
    limit: number = 100,
  ): Promise<PaginatedUserResponse<User>> {
    const params   = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    const response = await fetchWithRetry(`${BFF_BASE}/users?${params}`);
    const data     = await handleResponse<any>(response);

    if (data.items) return data;

    if (data.users && Array.isArray(data.users)) {
      return {
        users: data.users,
        total: data.total || data.users.length,
        page:  Math.floor(skip / limit) + 1,
        size:  limit,
        pages: Math.ceil((data.total || data.users.length) / limit),
      };
    }

    return { users: [], total: 0, page: 1, size: limit, pages: 0 };
  }
}
