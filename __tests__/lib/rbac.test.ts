import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canUploadDocuments,
  canDeleteDocuments,
  canAccessChat,
  canManageUsers,
  getRoleDisplayName,
  getRoleColor,
} from '@/lib/rbac';

// ---------------------------------------------------------------------------
// hasPermission
// ---------------------------------------------------------------------------
describe('hasPermission', () => {
  it('returns false for undefined role', () => {
    expect(hasPermission(undefined, 'documents', 'read')).toBe(false);
  });

  it('returns false for an unknown resource', () => {
    expect(hasPermission('admin', 'nonexistent', 'read')).toBe(false);
  });

  describe('guest', () => {
    it('can read documents', () => expect(hasPermission('guest', 'documents', 'read')).toBe(true));
    it('can read search',    () => expect(hasPermission('guest', 'search',    'read')).toBe(true));
    it('cannot create documents', () => expect(hasPermission('guest', 'documents', 'create')).toBe(false));
    it('cannot update documents', () => expect(hasPermission('guest', 'documents', 'update')).toBe(false));
    it('cannot delete documents', () => expect(hasPermission('guest', 'documents', 'delete')).toBe(false));
    it('cannot access chat',      () => expect(hasPermission('guest', 'chat',      'read')).toBe(false));
    it('cannot manage users',     () => expect(hasPermission('guest', 'users',     'read')).toBe(false));
  });

  describe('employee', () => {
    it('can read documents',      () => expect(hasPermission('employee', 'documents', 'read')).toBe(true));
    it('can create documents',    () => expect(hasPermission('employee', 'documents', 'create')).toBe(true));
    it('cannot update documents', () => expect(hasPermission('employee', 'documents', 'update')).toBe(false));
    it('cannot delete documents', () => expect(hasPermission('employee', 'documents', 'delete')).toBe(false));
    it('can access chat',         () => expect(hasPermission('employee', 'chat',      'read')).toBe(true));
    it('cannot manage users',     () => expect(hasPermission('employee', 'users',     'read')).toBe(false));
  });

  describe('admin', () => {
    it('can read documents',   () => expect(hasPermission('admin', 'documents', 'read')).toBe(true));
    it('can create documents', () => expect(hasPermission('admin', 'documents', 'create')).toBe(true));
    it('can update documents', () => expect(hasPermission('admin', 'documents', 'update')).toBe(true));
    it('can delete documents', () => expect(hasPermission('admin', 'documents', 'delete')).toBe(true));
    it('can read users',       () => expect(hasPermission('admin', 'users',     'read')).toBe(true));
    it('can create users',     () => expect(hasPermission('admin', 'users',     'create')).toBe(true));
    it('can update users',     () => expect(hasPermission('admin', 'users',     'update')).toBe(true));
    it('can delete users',     () => expect(hasPermission('admin', 'users',     'delete')).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------
describe('canUploadDocuments', () => {
  it('returns false for undefined', () => expect(canUploadDocuments(undefined)).toBe(false));
  it('returns false for guest',     () => expect(canUploadDocuments('guest')).toBe(false));
  it('returns true for employee',   () => expect(canUploadDocuments('employee')).toBe(true));
  it('returns true for admin',      () => expect(canUploadDocuments('admin')).toBe(true));
});

describe('canDeleteDocuments', () => {
  it('returns false for guest',    () => expect(canDeleteDocuments('guest')).toBe(false));
  it('returns false for employee', () => expect(canDeleteDocuments('employee')).toBe(false));
  it('returns true for admin',     () => expect(canDeleteDocuments('admin')).toBe(true));
});

describe('canAccessChat', () => {
  it('returns false for guest',  () => expect(canAccessChat('guest')).toBe(false));
  it('returns true for employee',() => expect(canAccessChat('employee')).toBe(true));
  it('returns true for admin',   () => expect(canAccessChat('admin')).toBe(true));
});

describe('canManageUsers', () => {
  it('returns false for guest',    () => expect(canManageUsers('guest')).toBe(false));
  it('returns false for employee', () => expect(canManageUsers('employee')).toBe(false));
  it('returns true for admin',     () => expect(canManageUsers('admin')).toBe(true));
});

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
describe('getRoleDisplayName', () => {
  it('returns Guest',         () => expect(getRoleDisplayName('guest')).toBe('Guest'));
  it('returns Employee',      () => expect(getRoleDisplayName('employee')).toBe('Employee'));
  it('returns Administrator', () => expect(getRoleDisplayName('admin')).toBe('Administrator'));
});

describe('getRoleColor', () => {
  it('returns a non-empty string for every role', () => {
    expect(getRoleColor('guest').length).toBeGreaterThan(0);
    expect(getRoleColor('employee').length).toBeGreaterThan(0);
    expect(getRoleColor('admin').length).toBeGreaterThan(0);
  });
});
