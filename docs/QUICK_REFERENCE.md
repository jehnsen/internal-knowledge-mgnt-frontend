# Quick API Reference

## 🔗 Endpoint Connections

All frontend API calls connect to: `http://localhost:8000/api/v1`

### Authentication

```typescript
// REGISTER USER
AuthAPI.register({ username, email, password, full_name })
→ POST /api/v1/auth/register

// LOGIN
AuthAPI.login({ username, password })
→ POST /api/v1/auth/login
→ Returns: { access_token, refresh_token, token_type }

// GET CURRENT USER
AuthAPI.getCurrentUser()
→ GET /api/v1/auth/me
→ Headers: Authorization: Bearer {token}
```

### Documents

```typescript
// UPLOAD FILE
DocumentAPI.uploadDocumentFile(file, title, metadata)
→ POST /api/v1/documents/
→ Content-Type: multipart/form-data
→ Body: { file, title?, metadata? }

// CREATE TEXT DOCUMENT
DocumentAPI.createDocument({ title, content, metadata })
→ POST /api/v1/documents/
→ Content-Type: application/json

// LIST DOCUMENTS
DocumentAPI.getDocuments(skip, limit)
→ GET /api/v1/documents/?skip=0&limit=100
→ Returns: { items[], total, page, size, pages }

// GET SINGLE DOCUMENT
DocumentAPI.getDocument(id)
→ GET /api/v1/documents/{id}

// UPDATE DOCUMENT
DocumentAPI.updateDocument(id, { title?, content?, metadata? })
→ PUT /api/v1/documents/{id}

// DELETE DOCUMENT
DocumentAPI.deleteDocument(id)
→ DELETE /api/v1/documents/{id}
```

### Search

```typescript
// SEMANTIC SEARCH WITH RAG
SearchAPI.search({ query, use_rag: true, top_k: 5 })
→ POST /api/v1/search/
→ Body: { query, top_k?, use_rag?, filters? }
→ Returns: { results[], rag_response, query, total_results }

// SEARCH HISTORY
SearchAPI.getSearchHistory(skip, limit)
→ GET /api/v1/search/history?skip=0&limit=50
```

## 📍 UI Component Map

| Page/Component | API Calls | Backend Endpoints |
|---------------|-----------|-------------------|
| `/login` | `AuthAPI.login()` | `POST /auth/login` |
| `/register` | `AuthAPI.register()` | `POST /auth/register` |
| `/knowledge` (Chat) | `SearchAPI.search()` | `POST /search/` |
| `/knowledge` (Upload) | `DocumentAPI.uploadDocumentFile()` | `POST /documents/` |
| `/knowledge` (Library) | `DocumentAPI.getDocuments()`<br>`DocumentAPI.deleteDocument()` | `GET /documents/`<br>`DELETE /documents/{id}` |
| Navigation (User Menu) | `AuthAPI.getCurrentUser()` | `GET /auth/me` |

## 🔑 Key Data Structures

### Document Response
```typescript
{
  id: number,
  title: string,
  content: string,
  file_path?: string,
  file_type?: string,
  file_size?: number,
  metadata?: object,
  user_id: number,
  created_at: string,
  updated_at: string,
  embedding?: number[]  // ⚠️ Important: indicates if indexed
}
```

### Search Response
```typescript
{
  results: [{
    document: Document,
    similarity_score: number,  // 0-1 scale
    chunk_content?: string     // Relevant excerpt
  }],
  rag_response?: string,      // AI-generated answer
  query: string,
  total_results: number
}
```

### Citation (Frontend Display)
```typescript
{
  documentId: number | string,
  documentName: string,
  pageNumber?: number,
  chunkId?: string,
  content: string,           // Excerpt from document
  relevanceScore: number     // similarity_score from search
}
```

## ⚡ Quick Setup

```bash
# 1. Configure backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 2. Install & run
npm install
npm run dev

# 3. Visit
open http://localhost:3000
```

## 🧪 Quick Test

```typescript
// In browser console at http://localhost:3000

// 1. Check API configuration
console.log(process.env.NEXT_PUBLIC_API_URL);

// 2. Test after login
import { SearchAPI } from '@/lib/api';

// 3. Run search
const result = await SearchAPI.search({
  query: 'test',
  use_rag: true,
  top_k: 3
});

console.log(result);
```

## 🎯 Important Notes

1. **Token Storage**: JWT tokens stored in `localStorage`
2. **Auto Headers**: Authorization header added automatically to all requests
3. **Error Handling**: All API calls throw errors - use try/catch
4. **CORS**: Backend must allow `http://localhost:3000`
5. **Embeddings**: Document status determined by `embedding` field existence

## 🔍 Status Indicators

- **Indexed**: `document.embedding && document.embedding.length > 0`
- **Processing**: `!document.embedding || document.embedding.length === 0`
- **Failed**: Backend would need to return error status

## 📊 Citation Relevance Colors

- 🟢 **Green**: 90-100% (Highly Relevant)
- 🔵 **Blue**: 80-89% (Very Relevant)
- 🟡 **Yellow**: 70-79% (Relevant)
- ⚫ **Gray**: <70% (Somewhat Relevant)
