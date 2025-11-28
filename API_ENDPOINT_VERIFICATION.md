# API Endpoint Verification & Testing Guide

This guide helps you verify that all frontend endpoints are correctly connected to your backend at `http://localhost:8000`.

## Quick Start

1. **Check your backend Swagger docs:**
   ```
   http://localhost:8000/api/docs
   ```

2. **Configure frontend:**
   ```bash
   # Create .env.local
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

## Endpoint Mapping

### ✅ Authentication Endpoints

| Frontend Method | Backend Endpoint | Status | Notes |
|----------------|------------------|--------|-------|
| `AuthAPI.register()` | `POST /api/v1/auth/register` | ✅ | User registration |
| `AuthAPI.login()` | `POST /api/v1/auth/login` | ✅ | Returns JWT tokens |
| `AuthAPI.getCurrentUser()` | `GET /api/v1/auth/me` | ✅ | Get logged-in user |
| `AuthAPI.logout()` | Local only | ✅ | Clears localStorage |

**Test Flow:**
```typescript
// 1. Register
await AuthAPI.register({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User'
});

// 2. Login
const tokens = await AuthAPI.login({
  username: 'testuser',
  password: 'password123'
});

// 3. Get current user
const user = await AuthAPI.getCurrentUser();
console.log(user); // Should show user details
```

### ✅ Document Endpoints

| Frontend Method | Backend Endpoint | Status | Notes |
|----------------|------------------|--------|-------|
| `DocumentAPI.uploadDocumentFile()` | `POST /api/v1/documents/` | ✅ | Upload file with multipart/form-data |
| `DocumentAPI.createDocument()` | `POST /api/v1/documents/` | ✅ | Create text document with JSON |
| `DocumentAPI.getDocuments()` | `GET /api/v1/documents/?skip=0&limit=100` | ✅ | List with pagination |
| `DocumentAPI.getDocument()` | `GET /api/v1/documents/{id}` | ✅ | Get single document |
| `DocumentAPI.updateDocument()` | `PUT /api/v1/documents/{id}` | ✅ | Update document |
| `DocumentAPI.deleteDocument()` | `DELETE /api/v1/documents/{id}` | ✅ | Delete document |

**Test Flow:**
```typescript
// 1. Upload file
const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
const doc = await DocumentAPI.uploadDocumentFile(file, 'My Test Doc');
console.log('Uploaded:', doc.id);

// 2. List documents
const response = await DocumentAPI.getDocuments(0, 10);
console.log('Total docs:', response.total);

// 3. Get single document
const single = await DocumentAPI.getDocument(doc.id);
console.log('Document:', single.title);

// 4. Update document
const updated = await DocumentAPI.updateDocument(doc.id, {
  title: 'Updated Title'
});

// 5. Delete document
await DocumentAPI.deleteDocument(doc.id);
```

### ✅ Search Endpoints

| Frontend Method | Backend Endpoint | Status | Notes |
|----------------|------------------|--------|-------|
| `SearchAPI.search()` | `POST /api/v1/search/` | ✅ | Semantic search + RAG |
| `SearchAPI.getSearchHistory()` | `GET /api/v1/search/history` | ✅ | User's search history |

**Test Flow:**
```typescript
// 1. Search with RAG
const response = await SearchAPI.search({
  query: 'What is the remote work policy?',
  use_rag: true,
  top_k: 5
});

console.log('RAG Answer:', response.rag_response);
console.log('Results:', response.results.length);
console.log('Top result score:', response.results[0]?.similarity_score);

// 2. Get search history
const history = await SearchAPI.getSearchHistory(0, 10);
console.log('Recent searches:', history.items);
```

## UI Component Connection Map

### 1. **Login Page** (`/login`)
- **Component:** `app/login/page.tsx`
- **API Calls:**
  - `AuthAPI.login()` → `POST /api/v1/auth/login`
- **Success:** Redirects to `/knowledge`
- **Test:** Go to `/login`, enter credentials, click "Sign In"

### 2. **Register Page** (`/register`)
- **Component:** `app/register/page.tsx`
- **API Calls:**
  - `AuthAPI.register()` → `POST /api/v1/auth/register`
  - Auto-login after registration
- **Success:** Redirects to `/knowledge`
- **Test:** Go to `/register`, fill form, click "Create Account"

### 3. **Chat Interface** (`/knowledge` - Chat tab)
- **Component:** `components/ChatInterface.tsx`
- **API Calls:**
  - `SearchAPI.search()` → `POST /api/v1/search/`
- **Features:**
  - Sends query with `use_rag: true`
  - Displays RAG response
  - Shows citations with relevance scores
- **Test:**
  1. Go to `/knowledge`
  2. Type a question
  3. Click send
  4. Verify citations appear with scores

### 4. **Document Upload** (`/knowledge` - Upload tab)
- **Component:** `components/DocumentUpload.tsx`
- **API Calls:**
  - `DocumentAPI.uploadDocumentFile()` → `POST /api/v1/documents/`
- **Features:**
  - Drag & drop files
  - Multiple file upload
  - Progress tracking
  - Auto-refresh document list
- **Test:**
  1. Go to `/knowledge` → Upload tab
  2. Drag a PDF file
  3. Click "Upload All"
  4. Verify success message

### 5. **Document Library** (`/knowledge` - Documents tab)
- **Component:** `app/knowledge/page.tsx`
- **API Calls:**
  - `DocumentAPI.getDocuments()` → `GET /api/v1/documents/`
  - `DocumentAPI.deleteDocument()` → `DELETE /api/v1/documents/{id}`
- **Features:**
  - Lists all documents
  - Shows indexing status (indexed/processing)
  - Delete functionality
  - Refresh button
- **Test:**
  1. Go to `/knowledge` → Documents tab
  2. Verify documents appear
  3. Click delete on a document
  4. Verify it's removed

## Expected Backend Response Formats

### 1. Login Response
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### 2. Document Upload Response
```json
{
  "id": 1,
  "title": "my-document.pdf",
  "content": "Extracted text content...",
  "file_path": "/uploads/my-document.pdf",
  "file_type": "application/pdf",
  "file_size": 1024000,
  "metadata": {
    "description": "Uploaded on 1/15/2024"
  },
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "embedding": [0.1, 0.2, 0.3, ...]  // Vector embedding (important!)
}
```

### 3. Search Response
```json
{
  "results": [
    {
      "document": {
        "id": 1,
        "title": "Remote Work Policy",
        "content": "Full content...",
        "file_type": "application/pdf",
        "user_id": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "embedding": [0.1, 0.2, ...]
      },
      "similarity_score": 0.92,
      "chunk_content": "Relevant excerpt from document..."
    }
  ],
  "rag_response": "Based on your documents, employees can work remotely...",
  "query": "remote work policy",
  "total_results": 5
}
```

## Frontend Request Formats

### 1. File Upload
```typescript
// Frontend sends multipart/form-data
const formData = new FormData();
formData.append('file', fileObject);
formData.append('title', 'My Document');  // Optional
formData.append('metadata', JSON.stringify({ description: 'Test' }));  // Optional
```

### 2. Search Request
```typescript
// Frontend sends JSON
{
  "query": "What is the policy?",
  "use_rag": true,
  "top_k": 5,
  "filters": {}  // Optional
}
```

## Testing Checklist

### ✅ Authentication Flow
- [ ] Can register new user at `/register`
- [ ] Can login at `/login`
- [ ] Token is stored in localStorage
- [ ] User info appears in navigation dropdown
- [ ] Can logout and token is cleared

### ✅ Document Management
- [ ] Can upload PDF file
- [ ] Can upload DOCX file
- [ ] Can upload TXT file
- [ ] Documents appear in library
- [ ] Document shows "indexed" status when embedding exists
- [ ] Document shows "processing" when no embedding
- [ ] Can delete document
- [ ] List refreshes after upload

### ✅ Search & RAG
- [ ] Can type query and get response
- [ ] RAG response appears in chat
- [ ] Citations appear below response
- [ ] Citations show document name
- [ ] Citations show relevance score
- [ ] Citations show text excerpt
- [ ] Can expand citations for full text
- [ ] Multiple queries work in sequence

### ✅ Error Handling
- [ ] Login with wrong password shows error
- [ ] Upload without authentication redirects to login
- [ ] Network errors show user-friendly message
- [ ] Failed uploads show error in UI
- [ ] Search errors don't crash the app

## Common Issues & Solutions

### Issue: "Failed to fetch" error
**Cause:** Backend not running or CORS not configured
**Solution:**
1. Check backend is running: `http://localhost:8000/api/docs`
2. Verify CORS allows `http://localhost:3000`
3. Check `.env.local` has correct URL

### Issue: "401 Unauthorized" error
**Cause:** Token expired or invalid
**Solution:**
1. Logout and login again
2. Check backend JWT configuration
3. Verify token is in localStorage: Open DevTools → Application → Local Storage

### Issue: Documents show "processing" forever
**Cause:** Backend not generating embeddings
**Solution:**
1. Verify backend creates embeddings on upload
2. Check `embedding` field in API response
3. Ensure vector database is running

### Issue: RAG responses empty or generic
**Cause:** Backend RAG not configured or no indexed documents
**Solution:**
1. Upload documents first
2. Wait for embeddings to be generated
3. Verify `use_rag: true` in request
4. Check backend has LLM configured

### Issue: Citations not showing
**Cause:** Backend not returning `chunk_content` or frontend mapping error
**Solution:**
1. Check search response includes `chunk_content`
2. Verify `similarity_score` exists
3. Check console for errors

## Browser DevTools Debugging

### 1. Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for requests to `localhost:8000`
5. Click on request to see:
   - Request headers (verify Authorization token)
   - Request payload
   - Response status
   - Response data

### 2. Check Console for Errors
1. Open DevTools Console
2. Look for red error messages
3. API errors are logged with details

### 3. Check LocalStorage
1. Open DevTools → Application
2. Go to Local Storage → `http://localhost:3000`
3. Verify tokens exist:
   - `access_token`
   - `refresh_token`

## Performance Verification

### Expected Response Times
- **Login:** < 500ms
- **Document upload (1MB):** < 2s
- **Search query:** < 1s
- **Document list:** < 500ms

### Load Testing
```bash
# Test 10 concurrent searches
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/search/ \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query": "test", "use_rag": true}' &
done
```

## Integration Test Script

Create a test file to verify all endpoints:

```typescript
// test-integration.ts
import { AuthAPI, DocumentAPI, SearchAPI } from '@/lib/api';

async function testFullFlow() {
  console.log('🧪 Starting integration tests...\n');

  // 1. Register
  console.log('1. Testing registration...');
  await AuthAPI.register({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123',
    full_name: 'Test User'
  });
  console.log('✅ Registration successful\n');

  // 2. Login
  console.log('2. Testing login...');
  await AuthAPI.login({ username: 'testuser', password: 'test123' });
  console.log('✅ Login successful\n');

  // 3. Upload document
  console.log('3. Testing document upload...');
  const content = 'This is a test document about remote work policy.';
  const doc = await DocumentAPI.createDocument({
    title: 'Test Document',
    content: content
  });
  console.log(`✅ Document created with ID: ${doc.id}\n`);

  // 4. List documents
  console.log('4. Testing document list...');
  const docs = await DocumentAPI.getDocuments(0, 10);
  console.log(`✅ Found ${docs.total} documents\n`);

  // 5. Search with RAG
  console.log('5. Testing RAG search...');
  const searchResult = await SearchAPI.search({
    query: 'remote work',
    use_rag: true,
    top_k: 3
  });
  console.log(`✅ RAG Response: ${searchResult.rag_response?.substring(0, 100)}...\n`);
  console.log(`✅ Found ${searchResult.results.length} results\n`);

  // 6. Delete document
  console.log('6. Testing document deletion...');
  await DocumentAPI.deleteDocument(doc.id);
  console.log('✅ Document deleted\n');

  console.log('🎉 All tests passed!');
}

// Run: node --loader ts-node/esm test-integration.ts
testFullFlow().catch(console.error);
```

## Next Steps

1. ✅ Verify backend is running at `http://localhost:8000`
2. ✅ Check Swagger docs at `http://localhost:8000/api/docs`
3. ✅ Configure `.env.local` with backend URL
4. ✅ Test authentication flow
5. ✅ Upload a test document
6. ✅ Try RAG search
7. ✅ Verify citations appear

All endpoints are now properly connected and ready to use! 🚀
