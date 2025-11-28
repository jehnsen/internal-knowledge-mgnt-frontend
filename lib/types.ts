export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface Citation {
  documentId: number | string;
  documentName: string;
  pageNumber?: number;
  chunkId?: string;
  content: string;
  relevanceScore: number;
}

export interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'processing' | 'indexed' | 'failed';
  pageCount?: number;
  description?: string;
}
