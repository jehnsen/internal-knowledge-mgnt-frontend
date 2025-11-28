# Login Debugging Guide

## Current Error: 422 Unprocessable Content

The backend is rejecting the login request. Here's how to debug and fix it.

## What the Frontend Sends

The frontend now sends a POST request to `/api/v1/auth/login` with:

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Body (Form Data):**
```
username=tony
password=ironman
grant_type=password
```

## Testing with curl

Test your backend directly to see what format it expects:

```bash
# Test 1: With grant_type (what frontend sends now)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=tony&password=ironman&grant_type=password"

# Test 2: Without grant_type
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=tony&password=ironman"

# Test 3: Check what Swagger docs say
# Visit: http://localhost:8000/api/docs
# Click on /auth/login endpoint
# Look at the "Request body" section
```

## Common Issues and Solutions

### Issue 1: Backend expects different field names

Some backends use `email` instead of `username`:

**Solution:** Update the login form and API:

```typescript
// In lib/api.ts, change:
formData.append('username', data.username);
// To:
formData.append('email', data.email);  // or data.username as email
```

### Issue 2: Backend requires additional fields

Check if backend requires:
- `grant_type`
- `scope`
- `client_id`
- `client_secret`

**Solution:** Add required fields to the form data.

### Issue 3: Backend expects JSON instead of form data

If your backend actually expects JSON:

```typescript
// Replace the entire login method with:
static async login(data: LoginRequest): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: data.username,
      password: data.password
    }),
  });

  const tokens = await handleResponse<AuthTokens>(response);

  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  return tokens;
}
```

## Check Backend Logs

Your backend logs show:
```
422 Unprocessable Content
```

This means the request format is wrong. Check your backend code for:

1. **FastAPI OAuth2PasswordRequestForm:**
   ```python
   from fastapi.security import OAuth2PasswordRequestForm

   @router.post("/login")
   async def login(form_data: OAuth2PasswordRequestForm = Depends()):
       # This expects: username, password (and optionally grant_type, scope)
   ```

2. **Pydantic model validation:**
   ```python
   class LoginRequest(BaseModel):
       username: str
       email: str  # If this is required, frontend must send it
       password: str
   ```

## Quick Fix Options

### Option A: Match FastAPI's OAuth2PasswordRequestForm

This is the most common. Your backend likely uses:

```python
OAuth2PasswordRequestForm
```

Which expects:
- `username` (required)
- `password` (required)
- `grant_type` (optional, defaults to "password")
- `scope` (optional)
- `client_id` (optional)
- `client_secret` (optional)

**Frontend is already correct for this!**

### Option B: If backend expects email field

If your User model requires email for login:

```typescript
// Update lib/api.ts
formData.append('email', data.email);  // Instead of username
formData.append('password', data.password);
```

And update the login form to collect email instead.

### Option C: If backend uses custom schema

Check your backend's login endpoint definition and match it exactly.

## Testing After Fix

1. **Clear browser cache:**
   ```
   Ctrl+Shift+Delete → Clear cached data
   ```

2. **Test login:**
   ```
   http://localhost:3000/login
   ```

3. **Check browser console (F12):**
   - Go to Network tab
   - Try to login
   - Click on the `login` request
   - Check "Request Headers" and "Form Data"
   - Verify it matches what backend expects

4. **Check backend response:**
   - If successful: Returns `{ access_token, refresh_token, token_type }`
   - If failed: Check error message in response

## Debug in Browser Console

Open browser console at `http://localhost:3000/login` and run:

```javascript
// Test the API directly
const testLogin = async () => {
  const formData = new URLSearchParams();
  formData.append('username', 'tony');
  formData.append('password', 'ironman');
  formData.append('grant_type', 'password');

  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
};

testLogin();
```

## Expected Success Response

When it works, you should see:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

And backend logs should show:
```
200 OK
```

## Next Steps

1. Check your backend's `/api/v1/auth/login` endpoint code
2. Verify what fields it expects
3. Test with curl to confirm the format
4. Update frontend if needed
5. Test in browser

**Most likely fix needed:** Your backend probably expects the exact format we're sending. The 422 error might be because:
- User doesn't exist in database (create user first via `/register`)
- Password is wrong
- Database connection issue

Try registering a user first at `/register`, then logging in with those credentials.
