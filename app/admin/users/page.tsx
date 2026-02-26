"use client";

import { useState, useEffect } from "react";
import { Settings, Clock, Download, Eye, UserX, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GDPRAPI, AuthAPI, User, UserActivityData, RegisterRequest } from "@/lib/api";
import { AuditLog } from "@/lib/audit";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivityData | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    if (!user) return;
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await GDPRAPI.getUsers(0, 100);
      setUsers(response.users || []);
      if (response) console.log('Loaded users:', response.users);
    } catch (err) {
      console.warn('Users endpoint not yet implemented, using empty array');
      setUsers([]);
      toast.error('Failed to load users. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = async (user: User) => {
    try {
      setLoading(true);
      setSelectedUser(user);

      const activity = await GDPRAPI.getUserActivity(user.id);
      setUserActivity(activity);
      setShowActivityDialog(true);

      // Log audit event
      await AuditLog.adminUserView(user.id, user.username);
    } catch (err: any) {
      console.error('Failed to load user activity:', err);
      toast.error(err.message || 'Failed to load user activity. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportUserData = async (user: User) => {
    try {
      setLoading(true);
      toast.info('Preparing user data export...');

      await GDPRAPI.downloadUserData(user.id, user.username);

      toast.success(`Exported data for ${user.username}`);
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || 'Failed to export user data. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Validate form
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const createdUser = await AuthAPI.register(newUser);

      toast.success(`User ${createdUser.username} created successfully`);

      // Reset form
      setNewUser({
        username: '',
        email: '',
        password: '',
        full_name: '',
      });

      setShowAddUserDialog(false);

      // Reload users list
      await loadUsers();

      // Log audit event
      await AuditLog.adminUserCreate(createdUser.id, createdUser.username);
    } catch (err: any) {
      console.error('Failed to create user:', err);
      toast.error(err.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Monitor user activity and manage permissions ({users.length} users)
          </p>
        </div>
        <Button
          onClick={() => setShowAddUserDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {loading && users.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading users...</p>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
              <p className="text-xs mt-1">Users endpoint may not be implemented on the backend yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.username && user.username.charAt(0).toUpperCase() || ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.username}</p>
                        {user.role === 'admin' && (
                          <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewActivity(user)}
                      disabled={loading}
                      title="View User Activity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportUserData(user)}
                      disabled={loading}
                      title="Export User Data (GDPR)"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="User Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Activity - {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Detailed activity information and GDPR data
            </DialogDescription>
          </DialogHeader>

          {userActivity && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-accent/20">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{userActivity.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{userActivity.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Created</p>
                  <p className="font-medium">{new Date(userActivity.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {userActivity.last_login
                      ? new Date(userActivity.last_login).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{userActivity.search_count}</p>
                  <p className="text-xs text-muted-foreground">Searches</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{userActivity.chat_count}</p>
                  <p className="text-xs text-muted-foreground">Chat Sessions</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{userActivity.document_uploads}</p>
                  <p className="text-xs text-muted-foreground">Uploads</p>
                </div>
              </div>

              {/* Data Sections */}
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium mb-1">Search History</p>
                  <p className="text-sm text-muted-foreground">
                    {userActivity.search_history.length} search queries recorded
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium mb-1">Chat Sessions</p>
                  <p className="text-sm text-muted-foreground">
                    {userActivity.chat_sessions.length} chat sessions recorded
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium mb-1">Uploaded Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {userActivity.uploaded_documents.length} documents uploaded
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleExportUserData(selectedUser!)}
                  disabled={loading}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export User Data
                </Button>
                <Button
                  onClick={() => setShowActivityDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {!userActivity && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading user activity...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. All fields are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddUser}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddUserDialog(false);
                  setNewUser({
                    username: '',
                    email: '',
                    password: '',
                    full_name: '',
                  });
                }}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
