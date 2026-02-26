import { BFF_BASE, fetchWithRetry, handleResponse } from './_http';
import type { PaginatedResponse, AuditLog } from './types';

export type { AuditLog };

export interface AuditStats {
  total_logs: number;
  logs_by_action: Record<string, number>;
  logs_by_resource: Record<string, number>;
  unique_users: number;
  date_range: {
    earliest: string;
    latest: string;
  };
}

export class AuditAPI {
  static async getAuditLogs(
    skip: number = 0,
    limit: number = 100,
    userId?: number,
  ): Promise<PaginatedResponse<AuditLog> | AuditLog[]> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (userId) params.append('user_id', userId.toString());
    const response = await fetchWithRetry(`${BFF_BASE}/audit/log?${params}`);
    return handleResponse<PaginatedResponse<AuditLog> | AuditLog[]>(response);
  }

  static async getMyAuditLogs(
    skip: number = 0,
    limit: number = 100,
  ): Promise<PaginatedResponse<AuditLog> | AuditLog[]> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    const response = await fetchWithRetry(`${BFF_BASE}/audit/logs/me?${params}`);
    return handleResponse<PaginatedResponse<AuditLog> | AuditLog[]>(response);
  }

  static async getAuditStats(): Promise<AuditStats> {
    const response = await fetchWithRetry(`${BFF_BASE}/audit/stats`);
    return handleResponse<AuditStats>(response);
  }
}
