# Troubleshooting - Admin Dashboard Data Not Loading

## Problem
- Analytics showing all zeros (0 documents, 0 searches, 0 chat sessions)
- Document Management showing "0 total" and "No documents found"
- Data exists in database (verified via Postman)

## Root Cause Analysis

The admin dashboard makes API calls to:
1. `http://localhost:8000/api/v1/analytics/overview`
2. `http://localhost:8000/api/v1/analytics/top-documents`
3. `http://localhost:8000/api/v1/analytics/search-trends`
4. `http://localhost:8000/api/v1/documents/?skip=0&limit=100`

If any of these fail, the dashboard shows zeros/empty state.

## Debugging Steps

### Step 1: Check Backend is Running

**Verify backend server is running on port 8000:**

```bash
# Check if backend is running
curl http://localhost:8000/api/v1/docs
```

If this fails, **start your backend server first**.

---

### Step 2: Open Browser Developer Console

1. **Refresh the admin dashboard** (`http://localhost:3000/admin`)
2. **Press F12** to open Developer Tools
3. **Click "Console" tab**

Look for these messages:

#### ✅ Success Messages (What You Want to See):
```
✅ Admin dashboard - loaded documents: { items: [...], total: X }
📊 Document items: [...]
📈 Total count: X
Admin Dashboard Render: { totalDocuments: X, filteredCount: X, ... }
```

#### ❌ Error Messages (What Indicates Problems):
```
Analytics Overview API failed: ...
Top Documents API failed: ...
Search Trends API failed: ...
❌ Failed to load documents: ...
```

**Screenshot the console and share it** - this will tell us exactly what's failing.

---

### Step 3: Check Network Tab

1. In Developer Tools, click **"Network" tab**
2. **Refresh the page**
3. Look for requests to:
   - `/api/v1/analytics/overview`
   - `/api/v1/analytics/top-documents`
   - `/api/v1/analytics/search-trends`
   - `/api/v1/documents/`

For each request, check:
- **Status Code**: Should be `200 OK`
  - `404 Not Found` = Endpoint doesn't exist on backend
  - `401 Unauthorized` = Authentication issue
  - `500 Internal Server Error` = Backend error
  - `CORS error` = Backend not allowing requests from frontend

**Click on each failed request** and check the "Response" tab to see the error message.

---

### Step 4: Test Direct API Calls

Open a new terminal and test the APIs directly:

```bash
# Test documents endpoint (replace TOKEN with your actual auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/documents/?skip=0&limit=100

# Test analytics overview
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/analytics/overview
```

**How to get your auth token:**
1. Open Developer Console
2. Go to **Application** tab
3. Click **Local Storage** > `http://localhost:3000`
4. Find `auth_token` value

---

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Symptoms**: All API calls fail immediately
**Solution**: Start your backend server on port 8000

### Issue 2: 404 Not Found on Analytics Endpoints
**Symptoms**:
- Console shows: `Analytics Overview API failed: 404`
- Documents work but analytics shows zeros

**Explanation**: Analytics endpoints might not be implemented on backend yet.

**Temporary Solution**: This is expected! The dashboard will show:
- Analytics: All zeros (gracefully handles missing endpoints)
- Documents: Should still work if `/api/v1/documents/` exists

**Backend TODO**: Implement these endpoints:
```python
@router.get("/analytics/overview")
@router.get("/analytics/top-documents")
@router.get("/analytics/search-trends")
```

### Issue 3: CORS Error
**Symptoms**:
- Network tab shows: `Access-Control-Allow-Origin error`
- Console shows: `CORS policy blocked`

**Solution**: Add CORS middleware to your backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 4: 401 Unauthorized
**Symptoms**:
- API returns 401 status
- Console shows authentication errors

**Solution**:
1. Check if you're logged in
2. Clear browser cache and login again
3. Check if `auth_token` exists in LocalStorage

### Issue 5: Documents API Returns Different Structure
**Symptoms**:
- Network shows 200 OK for `/api/v1/documents/`
- Data in response but not displaying
- Console shows: `✅ Admin dashboard - loaded documents:` with data

**Solution**: Check response structure matches expected format:

**Expected Structure:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Document Title",
      "file_type": "pdf",
      "created_at": "2024-01-01T00:00:00",
      "category": "Category Name"
    }
  ],
  "total": 10,
  "skip": 0,
  "limit": 100
}
```

**If your backend returns different field names**, you need to update the interface in `app/admin/page.tsx`:

```typescript
interface DocumentItem {
  id: number;
  title: string;
  file_type?: string;  // Or fileType if that's what backend returns
  file_path?: string;
  created_at?: string; // Or createdAt
  category?: string;
  metadata?: any;
}
```

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Backend server is running on `http://localhost:8000`
- [ ] Backend `/docs` endpoint accessible (FastAPI Swagger UI)
- [ ] You're logged in to the frontend
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API requests being made
- [ ] Check status codes of API requests (200 = success)
- [ ] Check response structure matches expected format

---

## What to Share for Help

If you're still stuck, share:

1. **Screenshot of Browser Console** (F12 > Console tab)
2. **Screenshot of Network Tab** (F12 > Network tab, filter by "api")
3. **Backend API response** from Postman for:
   - `GET /api/v1/documents/?skip=0&limit=100`
   - `GET /api/v1/analytics/overview`

4. **Any error messages** from:
   - Frontend console
   - Backend terminal/logs

---

## Expected Behavior

### When Everything Works:

**Analytics Section:**
- Shows live data from backend
- Total Documents matches database count
- Search/Chat stats display correctly

**Document Management:**
- Shows `(X total)` where X is actual count
- Lists all documents with titles, types, dates
- Upload, View, Download, Delete buttons work

### When Analytics Endpoints Missing (Expected for Now):

**Analytics Section:**
- Shows all zeros
- Console warnings: `Analytics Overview API failed: 404`
- This is OK! Analytics endpoints are pending backend implementation

**Document Management:**
- Should still show documents if `/api/v1/documents/` works
- If documents also show zero, there's a different issue

---

## Backend Implementation Status

### ✅ Implemented (Should Work)
- `GET /api/v1/documents/` - Document list
- `POST /api/v1/documents/` - Create document
- `DELETE /api/v1/documents/{id}` - Delete document

### ⏳ Pending (Will Show Zeros)
- `GET /api/v1/analytics/overview` - System stats
- `GET /api/v1/analytics/top-documents` - Most accessed docs
- `GET /api/v1/analytics/search-trends` - Search trends
- `GET /api/v1/documents/{id}/download` - PDF preview/download

### 🔧 Workaround for Missing Analytics

If you want to see test data while analytics endpoints are being implemented:

1. Check backend logs for which exact endpoint is failing
2. Implement a mock endpoint temporarily:

```python
@router.get("/analytics/overview")
async def get_analytics_overview():
    return {
        "total_documents": 42,
        "total_searches": 156,
        "total_chat_sessions": 89,
        "active_users": 5,
        "popular_queries": [
            {"query": "Test query", "count": 10}
        ],
        "top_documents": []
    }
```

---

## Next Steps

1. **Share your console output** - Look for the emoji-marked logs:
   - ✅ Success messages
   - ❌ Error messages
   - 📊 Data structure logs

2. **Check Network tab** - Which API calls are failing?

3. **Verify backend** - Is it running? Are endpoints implemented?

4. Once we see the actual error messages, we can fix the specific issue!

---

## Files Modified (Latest Changes)

**app/admin/page.tsx** (Lines 97-138):
- Added detailed error logging for all API calls
- Error messages now visible in console
- Document loading separated into try/catch
- Emoji markers for easy identification

**Changes:**
- ✅ Green checkmark = Success
- ❌ Red X = Failure
- 📊 Chart emoji = Data details
- 📈 Trending up = Count information
