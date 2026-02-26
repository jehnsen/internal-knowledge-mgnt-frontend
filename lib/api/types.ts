// Shared paginated-response shapes and cross-domain types used by
// multiple API modules.

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginatedUserResponse<T> {
  users: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** Audit log entry returned by the backend (shared by AuditAPI and GDPRAPI). */
export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: string;
  ip_address?: string;
  timestamp: string;
}
