# API Integration Guide

This document explains how to integrate the frontend with your RAG backend API.

## Backend API Endpoints

Your backend should implement the following endpoints at `http://localhost:8000/api/v1`:

### Authentication

#### `POST /auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### `POST /auth/login`
Login and get JWT tokens.

**Request (Form Data):**
```
username=johndoe
password=secretpassword
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### `GET /auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Documents

#### `POST /documents/`
Upload a document (file or text content).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data  (for file upload)
OR
Content-Type: application/json  (for text content)
```

**Request (File Upload):**
```
file: <binary file data>
title: "Document Title" (optional)
metadata: {"description": "..."}  (optional JSON string)
```

**Request (Text Content):**
```json
{
  "title": "Document Title",
  "content": "Document text content",
  "file_type": "text/plain",
  "metadata": {
    "description": "Optional description"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Document Title",
  "content": "Document content...",
  "file_path": "/uploads/doc.pdf",
  "file_type": "application/pdf",
  "file_size": 1024000,
  "metadata": {},
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "embedding": [0.1, 0.2, ...] // Vector embedding
}
```

#### `GET /documents/?skip=0&limit=100`
List all documents with pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Document Title",
      "content": "Document content...",
      "file_path": "/uploads/doc.pdf",
      "file_type": "application/pdf",
      "file_size": 1024000,
      "metadata": {},
      "user_id": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "embedding": [0.1, 0.2, ...]
    }
  ],
  "total": 10,
  "page": 1,
  "size": 100,
  "pages": 1
}
```

#### `GET /documents/{id}`
Get a specific document.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "title": "Document Title",
  "content": "Full document content...",
  "file_path": "/uploads/doc.pdf",
  "file_type": "application/pdf",
  "file_size": 1024000,
  "metadata": {},
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "embedding": [0.1, 0.2, ...]
}
```

#### `PUT /documents/{id}`
Update a document.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "metadata": {
    "description": "Updated description"
  }
}
```

**Response:** Same as GET /documents/{id}

#### `DELETE /documents/{id}`
Delete a document.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 204 No Content

### Search

#### `POST /search/`
Semantic search with optional RAG response.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "What is the remote work policy?",
  "top_k": 5,
  "use_rag": true,
  "filters": {}
}
```

**Response:**
```json
{
  "results": [
    {
      "document": {
        "id": 1,
        "title": "Remote Work Policy",
        "content": "Full document content...",
        "file_path": "/uploads/policy.pdf",
        "file_type": "application/pdf",
        "file_size": 512000,
        "metadata": {},
        "user_id": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "embedding": [0.1, 0.2, ...]
      },
      "similarity_score": 0.92,
      "chunk_content": "All full-time employees are eligible for remote work..."
    }
  ],
  "rag_response": "Based on the remote work policy, all full-time employees can work remotely with manager approval. The company provides a $500/year home office stipend and reimburses co-working space expenses. Core hours are 10 AM - 3 PM local time.",
  "query": "What is the remote work policy?",
  "total_results": 5
}
```

#### `GET /search/history?skip=0&limit=50`
Get search history for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "query": "remote work policy",
      "user_id": 1,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "size": 50,
  "pages": 1
}
```

## Frontend Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** The URL should NOT include `/api/v1` - this is added automatically by the frontend.

### API Service Usage

The frontend uses three main API classes:

#### AuthAPI
```typescript
import { AuthAPI } from '@/lib/api';

// Register
await AuthAPI.register({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'password123',
  full_name: 'John Doe'
});

// Login
const tokens = await AuthAPI.login({
  username: 'johndoe',
  password: 'password123'
});

// Get current user
const user = await AuthAPI.getCurrentUser();

// Logout
AuthAPI.logout();

// Check if authenticated
const isAuth = AuthAPI.isAuthenticated();
```

#### DocumentAPI
```typescript
import { DocumentAPI } from '@/lib/api';

// Upload file
const doc = await DocumentAPI.uploadDocumentFile(
  file,  // File object
  'My Document',  // title (optional)
  { description: 'Document description' }  // metadata (optional)
);

// Create text document
const doc = await DocumentAPI.createDocument({
  title: 'My Document',
  content: 'Document content',
  metadata: { description: 'Description' }
});

// Get all documents
const response = await DocumentAPI.getDocuments(0, 100);
console.log(response.items);

// Get one document
const doc = await DocumentAPI.getDocument(1);

// Update document
const updated = await DocumentAPI.updateDocument(1, {
  title: 'Updated Title'
});

// Delete document
await DocumentAPI.deleteDocument(1);
```

#### SearchAPI
```typescript
import { SearchAPI } from '@/lib/api';

// Search with RAG
const response = await SearchAPI.search({
  query: 'What is the remote work policy?',
  use_rag: true,
  top_k: 5
});

console.log(response.rag_response);  // AI-generated answer
console.log(response.results);  // Search results with similarity scores

// Get search history
const history = await SearchAPI.getSearchHistory(0, 50);
```

## Authentication Flow

1. User registers or logs in
2. Frontend receives JWT tokens
3. Tokens are stored in localStorage
4. All subsequent API calls include the token in the Authorization header
5. Token is checked on page load to restore session

## Error Handling

All API calls throw errors that can be caught:

```typescript
try {
  const response = await SearchAPI.search({ query: 'test', use_rag: true });
} catch (error) {
  console.error(error.message);  // User-friendly error message
}
```

Common error scenarios:
- **401 Unauthorized**: Token expired or invalid - redirect to login
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **500 Server Error**: Backend error

## CORS Configuration

Your backend must allow requests from the frontend origin:

```python
# Example for FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Integration

1. **Start your backend:**
   ```bash
   # Your backend command, e.g.:
   uvicorn main:app --reload --port 8000
   ```

2. **Configure frontend:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend URL
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

4. **Test flow:**
   - Register a new user at `/register`
   - Login at `/login`
   - Upload a document at `/knowledge` (Upload Documents tab)
   - Ask a question at `/knowledge` (Ask Questions tab)
   - View documents at `/knowledge` (Document Library tab)

## Troubleshooting

### "Failed to fetch" error
- Check if backend is running
- Verify CORS configuration
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### "401 Unauthorized" error
- Token may have expired - logout and login again
- Check backend JWT configuration

### Documents not showing embeddings
- Verify your backend is generating embeddings on document upload
- Check the `embedding` field in the document response

### RAG responses not working
- Ensure `use_rag: true` in search request
- Verify your backend has RAG implementation
- Check that documents have embeddings

## Development Tips

1. **Use mock data fallback:** The frontend falls back to mock data if API fails
2. **Check browser console:** API errors are logged to console
3. **Use browser DevTools Network tab:** Inspect actual API requests/responses
4. **Test with Postman/curl:** Verify backend endpoints work independently

## Security Considerations

1. **Never commit .env.local:** It's in .gitignore
2. **Use HTTPS in production:** Update `NEXT_PUBLIC_API_URL`
3. **Rotate JWT secrets:** Don't use default secrets in production
4. **Validate file uploads:** Check file types and sizes on backend
5. **Rate limit API endpoints:** Prevent abuse

## Production Deployment

1. Update `.env.local` with production API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourcompany.com
   ```

2. Build frontend:
   ```bash
   npm run build
   ```

3. Deploy to Vercel/Netlify or your hosting platform

4. Ensure backend allows production origin in CORS
