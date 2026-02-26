# Backend CORS Configuration Guide

## Issue
Frontend (localhost:3000) unable to communicate with backend (localhost:8000) due to CORS restrictions.

## Required Backend Configuration

### FastAPI CORS Middleware Setup

Your backend should have the following CORS middleware configuration in the main application file:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,  # CRITICAL: Required for cookies and auth headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers including Authorization
)
```

### Key Points

1. **allow_credentials=True** - This is CRITICAL for authentication to work. Without this, the browser will block requests that include credentials (like Authorization headers or cookies).

2. **allow_origins** - Must include the exact frontend URL: `http://localhost:3000`

3. **allow_methods=["*"]** - Allows all HTTP methods. Alternatively, you can specify: `["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]`

4. **allow_headers=["*"]** - Allows all headers. Alternatively, you can specify specific headers: `["Content-Type", "Authorization", "Accept"]`

### Additional Configuration (if using environment variables)

If you're loading CORS origins from environment variables (like your config.py shows):

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    # ... other settings

settings = Settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Verification

After updating the backend configuration:

1. Restart your backend server
2. Check the response headers in browser DevTools:
   - `Access-Control-Allow-Origin: http://localhost:3000`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Methods: *`
   - `Access-Control-Allow-Headers: *`

3. Test the login endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -H "Origin: http://localhost:3000" \
     -d '{"username":"test","password":"test"}' \
     -v
   ```

### Common Issues

**Issue**: "No 'Access-Control-Allow-Origin' header is present"
**Solution**: Make sure `allow_origins` includes your frontend URL

**Issue**: "Credentials flag is 'true', but the 'Access-Control-Allow-Credentials' header is ''"
**Solution**: Add `allow_credentials=True` to the middleware configuration

**Issue**: "Method POST is not allowed by Access-Control-Allow-Methods"
**Solution**: Add `allow_methods=["*"]` or include "POST" in the list

## Frontend Changes Made

The frontend has been updated to include `credentials: 'include'` in all authentication-related fetch requests:

- `AuthAPI.register()` - [lib/api.ts:278](lib/api.ts#L278)
- `AuthAPI.login()` - [lib/api.ts:291](lib/api.ts#L291)
- `AuthAPI.getCurrentUser()` - [lib/api.ts:313](lib/api.ts#L313)

This ensures that the browser sends credentials (auth headers) with cross-origin requests.

## Testing After Configuration

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to log in
4. Check the `/api/v1/auth/login` request:
   - Status should be 200 OK (not 401, 403, or CORS error)
   - Response Headers should include CORS headers
   - Request Headers should include `Origin: http://localhost:3000`

If you still see CORS errors after updating the backend configuration, please share:
- The exact error message from the browser console
- The backend main.py or app.py file where CORS is configured
- The response headers from the failed request
