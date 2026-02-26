// Public barrel — re-exports every type and class from the domain modules.
// Import from "@/lib/api" (resolves to lib/api.ts which re-exports here)
// or directly from "@/lib/api/<module>" for tree-shaking.

export type { PaginatedResponse, PaginatedUserResponse, AuditLog } from './types';

export type { User, AuthTokens, LoginRequest, RegisterRequest } from './auth';
export { AuthAPI } from './auth';

export type { Document, DocumentCreate, DocumentUpdate } from './documents';
export { DocumentAPI, KnowledgeAPI } from './documents';

export type {
  SearchRequest,
  SourceDocument,
  SearchResult,
  SearchResponse,
  Citation,
} from './search';
export { SearchAPI } from './search';

export type { ChatMessage, ChatSession, ChatRequest, ChatResponse } from './chat';
export { ChatAPI } from './chat';

export type {
  AnalyticsOverview,
  SearchTrend,
  TopDocument,
  KnowledgeGap,
} from './analytics';
export { AnalyticsAPI } from './analytics';

export type { AuditStats } from './audit-logs';
export { AuditAPI } from './audit-logs';

export { DownloadAPI } from './download';

export type {
  UserActivityData,
  DataDeletionRequest,
  GDPRStats,
} from './gdpr';
export { GDPRAPI } from './gdpr';
