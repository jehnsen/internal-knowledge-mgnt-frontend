"use client";

import { Settings, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserActivity {
  user_id: number;
  username: string;
  email: string;
  last_login?: string;
  search_count: number;
  chat_count: number;
  document_uploads: number;
}

// Mock data - replace with API call when backend is ready
const mockUsers: UserActivity[] = [
  {
    user_id: 1,
    username: "admin",
    email: "admin@company.com",
    last_login: new Date().toISOString(),
    search_count: 45,
    chat_count: 23,
    document_uploads: 12
  }
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Monitor user activity and manage permissions
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.last_login && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Last login: {new Date(user.last_login).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{user.search_count}</p>
                    <p className="text-xs text-muted-foreground">Searches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{user.chat_count}</p>
                    <p className="text-xs text-muted-foreground">Chats</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{user.document_uploads}</p>
                    <p className="text-xs text-muted-foreground">Uploads</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
