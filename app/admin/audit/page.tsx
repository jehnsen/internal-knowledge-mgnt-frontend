"use client";

import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  timestamp: string;
  details?: any;
}

// Mock data - replace with API call when backend is ready
const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    username: "admin",
    action: "DOCUMENT_UPLOAD",
    resource_type: "document",
    timestamp: new Date().toISOString(),
  }
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Logs & System Activity</h1>
        <p className="text-muted-foreground">
          Track all system actions and user activities
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            {mockAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      <span className="text-blue-600">{log.username}</span> performed{" "}
                      <Badge variant="outline" className="mx-1">{log.action}</Badge>
                      on {log.resource_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
