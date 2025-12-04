# Test Accounts for RBAC Testing

This document contains test account credentials for different role levels in the Internal Knowledge Management system.

## Account Overview

The system implements Role-Based Access Control (RBAC) with three distinct roles:

### 1. Guest Account (Read-Only)
**Credentials:**
- **Username:** `guest`
- **Password:** `guest123`
- **Email:** `guest@example.com`
- **Role:** Guest

**Permissions:**
- ✅ View and search documents
- ✅ View search results
- ❌ Cannot upload documents
- ❌ Cannot delete documents
- ❌ Cannot access chat assistant
- ❌ No user management access

**UI Behavior:**
- Upload buttons hidden
- Chat Assistant button hidden
- Delete buttons not displayed in document lists
- Read-only access to document library

---

### 2. Employee Account (Standard User)
**Credentials:**
- **Username:** `employee`
- **Password:** `employee123`
- **Email:** `employee@example.com`
- **Role:** Employee

**Permissions:**
- ✅ View and search documents
- ✅ Upload new documents
- ✅ Access chat assistant
- ✅ View document library
- ❌ Cannot delete documents (only admins)
- ❌ No user management access

**UI Behavior:**
- All upload features visible and accessible
- Chat Assistant fully accessible
- Can contribute to knowledge base
- Delete buttons not displayed
- Standard employee badge in navigation

---

### 3. Admin Account (Full Access)
**Credentials:**
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@example.com`
- **Role:** Admin

**Permissions:**
- ✅ View and search documents
- ✅ Upload new documents
- ✅ Delete documents
- ✅ Access chat assistant
- ✅ Full document library access
- ✅ User management capabilities
- ✅ All system features

**UI Behavior:**
- Full access to all features
- Delete buttons visible in document lists
- Special admin badge (gold gradient) in navigation
- Access to admin-only features

---

## Permission Matrix

| Feature | Guest | Employee | Admin |
|---------|-------|----------|-------|
| View Documents | ✅ | ✅ | ✅ |
| Search Documents | ✅ | ✅ | ✅ |
| Upload Documents | ❌ | ✅ | ✅ |
| Delete Documents | ❌ | ❌ | ✅ |
| Chat Assistant | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |

---

## Testing RBAC Features

### Test Scenario 1: Guest User Limitations
1. Log in with guest credentials
2. Verify:
   - Upload button is hidden on dashboard
   - "Chat Assistant" button is not visible
   - No delete buttons in document library
   - Can only search and view documents

### Test Scenario 2: Employee Capabilities
1. Log in with employee credentials
2. Verify:
   - Upload button visible and functional
   - Chat Assistant accessible
   - Can upload new documents
   - Cannot see delete buttons
   - Blue "Employee" badge in profile dropdown

### Test Scenario 3: Admin Full Access
1. Log in with admin credentials
2. Verify:
   - All features accessible
   - Can upload documents
   - Can delete documents
   - Chat Assistant fully functional
   - Gold "Administrator" badge with shield icon in profile dropdown

---

## Creating Additional Test Users

To create additional test users with specific roles, use the backend API:

```bash
# Example: Create a new employee account
POST /api/v1/auth/register
{
  "username": "newemployee",
  "email": "newemployee@example.com",
  "password": "password123",
  "full_name": "New Employee",
  "role": "employee"
}
```

**Note:** The `role` field must be one of: `guest`, `employee`, or `admin`.

---

## Role Management

### Upgrading User Roles
Admins can upgrade user roles through the user management interface (admin-only feature).

### Role Hierarchy
```
Guest (Read-Only)
  ↓
Employee (Can Create)
  ↓
Admin (Full Control)
```

---

## Security Notes

⚠️ **IMPORTANT:**
- These are test credentials for development/staging environments only
- **NEVER** use these credentials in production
- Change all default passwords before deploying to production
- Implement proper user registration and role assignment workflows
- Consider implementing MFA (Multi-Factor Authentication) for admin accounts

---

## Troubleshooting

### User can't access expected features:
1. Check the user's role badge in the navigation dropdown
2. Verify JWT token contains correct role claim
3. Check browser console for permission errors
4. Clear browser cache and re-login

### Role not updating after login:
1. Logout completely
2. Clear browser localStorage
3. Login again
4. Check `/api/v1/auth/me` response for current role

---

## Technical Implementation

RBAC is implemented using:
- **Frontend:** `/lib/rbac.ts` - Permission checking utilities
- **Backend:** Role field in User model
- **Authentication:** JWT tokens with role claims
- **UI:** Conditional rendering based on `canUploadDocuments()`, `canDeleteDocuments()`, etc.

For more details, see `/lib/rbac.ts` in the codebase.
