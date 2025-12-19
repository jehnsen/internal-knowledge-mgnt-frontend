// Audit Logging Service - Client-side audit tracking and backend synchronization

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Audit action types
export enum AuditAction {
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',

  // Document operations
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_VIEW = 'DOCUMENT_VIEW',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',

  // Search operations
  SEARCH_QUERY = 'SEARCH_QUERY',
  SEARCH_HISTORY_VIEW = 'SEARCH_HISTORY_VIEW',

  // Chat operations
  CHAT_SESSION_START = 'CHAT_SESSION_START',
  CHAT_MESSAGE_SENT = 'CHAT_MESSAGE_SENT',
  CHAT_SESSION_DELETE = 'CHAT_SESSION_DELETE',

  // GDPR operations
  GDPR_DATA_EXPORT = 'GDPR_DATA_EXPORT',
  GDPR_DELETE_REQUEST = 'GDPR_DELETE_REQUEST',
  GDPR_AUDIT_EXPORT = 'GDPR_AUDIT_EXPORT',

  // Admin operations
  ADMIN_USER_VIEW = 'ADMIN_USER_VIEW',
  ADMIN_USER_CREATE = 'ADMIN_USER_CREATE',
  ADMIN_ANALYTICS_VIEW = 'ADMIN_ANALYTICS_VIEW',
  ADMIN_SETTINGS_CHANGE = 'ADMIN_SETTINGS_CHANGE',
}

export enum ResourceType {
  USER = 'user',
  DOCUMENT = 'document',
  SEARCH = 'search',
  CHAT = 'chat',
  GDPR = 'gdpr',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export interface AuditLogEntry {
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: number | string;
  details?: string;
  metadata?: Record<string, any>;
}

export interface CreateAuditLogRequest {
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: string;
  metadata?: Record<string, any>;
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

// Get client metadata (IP, user agent, etc.)
function getClientMetadata(): Record<string, any> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    timestamp: new Date().toISOString(),
  };
}

class AuditLogger {
  private static instance: AuditLogger;
  private pendingLogs: AuditLogEntry[] = [];
  private isProcessing = false;
  private batchInterval = 5000; // Send logs every 5 seconds
  private maxBatchSize = 10;

  private constructor() {
    // Start batch processing if in browser
    if (typeof window !== 'undefined') {
      this.startBatchProcessing();
    }
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   * @param entry Audit log entry
   * @param sendImmediately If true, send immediately instead of batching
   */
  public async log(entry: AuditLogEntry, sendImmediately = false): Promise<void> {
    // Only log if user is authenticated
    if (!getAuthToken()) {
      console.debug('Skipping audit log - user not authenticated');
      return;
    }

    // Add client metadata
    const enhancedEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        ...getClientMetadata(),
      },
    };

    if (sendImmediately) {
      await this.sendToBackend(enhancedEntry);
    } else {
      this.pendingLogs.push(enhancedEntry);

      // If batch is full, send immediately
      if (this.pendingLogs.length >= this.maxBatchSize) {
        await this.processBatch();
      }
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', entry.action, entry);
    }
  }

  /**
   * Send logs to backend
   */
  private async sendToBackend(entry: AuditLogEntry): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_VERSION}/audit/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          metadata: entry.metadata,
        } as CreateAuditLogRequest),
      });

      if (!response.ok) {
        console.warn('Failed to send audit log to backend:', response.status);
      }
    } catch (error) {
      // Silently fail - audit logging should not break the app
      console.debug('Audit log backend error:', error);
    }
  }

  /**
   * Process pending logs in batch
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.pendingLogs.length === 0) {
      return;
    }

    this.isProcessing = true;
    const logsToSend = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      // Send batch to backend
      const response = await fetch(`${API_BASE_URL}${API_VERSION}/audit/log/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          logs: logsToSend.map(entry => ({
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            details: entry.details,
            metadata: entry.metadata,
          })),
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send audit log batch to backend:', response.status);
      }
    } catch (error) {
      console.debug('Audit log batch backend error:', error);
      // Re-add logs to queue if failed
      this.pendingLogs.unshift(...logsToSend);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start batch processing interval
   */
  private startBatchProcessing(): void {
    setInterval(() => {
      this.processBatch();
    }, this.batchInterval);

    // Send pending logs before page unload
    window.addEventListener('beforeunload', () => {
      if (this.pendingLogs.length > 0) {
        // Use sendBeacon for reliability
        const data = JSON.stringify({
          logs: this.pendingLogs.map(entry => ({
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            details: entry.details,
            metadata: entry.metadata,
          })),
        });

        const token = getAuthToken();
        const blob = new Blob([data], { type: 'application/json' });

        // Try to send with beacon
        navigator.sendBeacon(
          `${API_BASE_URL}${API_VERSION}/audit/log/batch`,
          blob
        );
      }
    });
  }

  /**
   * Flush pending logs immediately
   */
  public async flush(): Promise<void> {
    await this.processBatch();
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience methods for common audit events

export const AuditLog = {
  // Authentication
  login: (userId: number, username: string) =>
    auditLogger.log({
      action: AuditAction.USER_LOGIN,
      resource_type: ResourceType.USER,
      resource_id: userId,
      details: `User ${username} logged in`,
    }, true),

  logout: (userId: number, username: string) =>
    auditLogger.log({
      action: AuditAction.USER_LOGOUT,
      resource_type: ResourceType.USER,
      resource_id: userId,
      details: `User ${username} logged out`,
    }, true),

  register: (userId: number, username: string, email: string) =>
    auditLogger.log({
      action: AuditAction.USER_REGISTER,
      resource_type: ResourceType.USER,
      resource_id: userId,
      details: `New user registered: ${username} (${email})`,
    }, true),

  // Documents
  documentUpload: (documentId: number, title: string, fileType: string) =>
    auditLogger.log({
      action: AuditAction.DOCUMENT_UPLOAD,
      resource_type: ResourceType.DOCUMENT,
      resource_id: documentId,
      details: `Uploaded document: ${title}`,
      metadata: { file_type: fileType },
    }),

  documentView: (documentId: number, title: string) =>
    auditLogger.log({
      action: AuditAction.DOCUMENT_VIEW,
      resource_type: ResourceType.DOCUMENT,
      resource_id: documentId,
      details: `Viewed document: ${title}`,
    }),

  documentDownload: (documentId: number, title: string) =>
    auditLogger.log({
      action: AuditAction.DOCUMENT_DOWNLOAD,
      resource_type: ResourceType.DOCUMENT,
      resource_id: documentId,
      details: `Downloaded document: ${title}`,
    }),

  documentDelete: (documentId: number, title: string) =>
    auditLogger.log({
      action: AuditAction.DOCUMENT_DELETE,
      resource_type: ResourceType.DOCUMENT,
      resource_id: documentId,
      details: `Deleted document: ${title}`,
    }, true),

  documentUpdate: (documentId: number, title: string) =>
    auditLogger.log({
      action: AuditAction.DOCUMENT_UPDATE,
      resource_type: ResourceType.DOCUMENT,
      resource_id: documentId,
      details: `Updated document: ${title}`,
    }),

  // Search
  search: (query: string, resultCount: number) =>
    auditLogger.log({
      action: AuditAction.SEARCH_QUERY,
      resource_type: ResourceType.SEARCH,
      details: `Search query: "${query}"`,
      metadata: { query, result_count: resultCount },
    }),

  searchHistoryView: () =>
    auditLogger.log({
      action: AuditAction.SEARCH_HISTORY_VIEW,
      resource_type: ResourceType.SEARCH,
      details: 'Viewed search history',
    }),

  // Chat
  chatSessionStart: (sessionId: string) =>
    auditLogger.log({
      action: AuditAction.CHAT_SESSION_START,
      resource_type: ResourceType.CHAT,
      resource_id: sessionId,
      details: 'Started new chat session',
    }),

  chatMessage: (sessionId: string, messageLength: number) =>
    auditLogger.log({
      action: AuditAction.CHAT_MESSAGE_SENT,
      resource_type: ResourceType.CHAT,
      resource_id: sessionId,
      details: 'Sent chat message',
      metadata: { message_length: messageLength },
    }),

  chatSessionDelete: (sessionId: string) =>
    auditLogger.log({
      action: AuditAction.CHAT_SESSION_DELETE,
      resource_type: ResourceType.CHAT,
      resource_id: sessionId,
      details: 'Deleted chat session',
    }, true),

  // GDPR
  gdprExport: (userId: number, username: string) =>
    auditLogger.log({
      action: AuditAction.GDPR_DATA_EXPORT,
      resource_type: ResourceType.GDPR,
      resource_id: userId,
      details: `Exported data for user: ${username}`,
    }, true),

  gdprDeleteRequest: (userId: number, username: string, reason?: string) =>
    auditLogger.log({
      action: AuditAction.GDPR_DELETE_REQUEST,
      resource_type: ResourceType.GDPR,
      resource_id: userId,
      details: `Data deletion request for user: ${username}`,
      metadata: { reason },
    }, true),

  gdprAuditExport: () =>
    auditLogger.log({
      action: AuditAction.GDPR_AUDIT_EXPORT,
      resource_type: ResourceType.GDPR,
      details: 'Exported audit logs',
    }, true),

  // Admin
  adminUserView: (userId: number, username: string) =>
    auditLogger.log({
      action: AuditAction.ADMIN_USER_VIEW,
      resource_type: ResourceType.ADMIN,
      resource_id: userId,
      details: `Viewed user details: ${username}`,
    }),

  adminUserCreate: (userId: number, username: string) =>
    auditLogger.log({
      action: AuditAction.ADMIN_USER_CREATE,
      resource_type: ResourceType.ADMIN,
      resource_id: userId,
      details: `Created new user: ${username}`,
    }, true),

  adminAnalyticsView: (section: string) =>
    auditLogger.log({
      action: AuditAction.ADMIN_ANALYTICS_VIEW,
      resource_type: ResourceType.ADMIN,
      details: `Viewed analytics: ${section}`,
    }),
};

export default auditLogger;
