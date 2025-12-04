// Role-Based Access Control (RBAC) utilities

export type UserRole = 'guest' | 'employee' | 'admin';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    { resource: 'documents', action: 'read' },
    { resource: 'search', action: 'read' },
  ],
  employee: [
    { resource: 'documents', action: 'read' },
    { resource: 'documents', action: 'create' },
    { resource: 'search', action: 'read' },
    { resource: 'chat', action: 'read' },
  ],
  admin: [
    { resource: 'documents', action: 'read' },
    { resource: 'documents', action: 'create' },
    { resource: 'documents', action: 'update' },
    { resource: 'documents', action: 'delete' },
    { resource: 'search', action: 'read' },
    { resource: 'chat', action: 'read' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
  ],
};

// Check if a role has a specific permission
export function hasPermission(
  role: UserRole | undefined,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

// Check if user can upload documents
export function canUploadDocuments(role: UserRole | undefined): boolean {
  return hasPermission(role, 'documents', 'create');
}

// Check if user can delete documents
export function canDeleteDocuments(role: UserRole | undefined): boolean {
  return hasPermission(role, 'documents', 'delete');
}

// Check if user can access chat
export function canAccessChat(role: UserRole | undefined): boolean {
  return hasPermission(role, 'chat', 'read');
}

// Check if user can manage users (admin only)
export function canManageUsers(role: UserRole | undefined): boolean {
  return hasPermission(role, 'users', 'read');
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    guest: 'Guest',
    employee: 'Employee',
    admin: 'Administrator',
  };
  return roleNames[role];
}

// Get role color for badges
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    guest: 'bg-gray-500',
    employee: 'bg-blue-500',
    admin: 'bg-gradient-to-r from-amber-500 to-orange-500',
  };
  return roleColors[role];
}

// Test account credentials (for documentation/development)
export const TEST_ACCOUNTS = {
  guest: {
    username: 'guest',
    password: 'guest123',
    email: 'guest@example.com',
    role: 'guest' as UserRole,
    description: 'Read-only access to documents and search',
  },
  employee: {
    username: 'employee',
    password: 'employee123',
    email: 'employee@example.com',
    role: 'employee' as UserRole,
    description: 'Can view and upload documents, use chat',
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin' as UserRole,
    description: 'Full access to all features including user management',
  },
};
