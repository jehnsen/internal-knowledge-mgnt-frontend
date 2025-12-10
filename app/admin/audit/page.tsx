"use client";

import { useState, useEffect } from "react";
import { Activity, Download, Filter, Search, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuditAPI, GDPRAPI, AuditLog as AuditLogType } from "@/lib/api";
import { AuditLog } from "@/lib/audit";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [searchTerm, filterAction, auditLogs]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await AuditAPI.getAuditLogs(0, 100);

      // Handle both array and paginated response formats
      if (Array.isArray(response)) {
        setAuditLogs(response);
      } else if (response && 'items' in response) {
        setAuditLogs(response.items || []);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.warn('Audit logs endpoint not yet implemented, using empty array');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action type
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    setFilteredLogs(filtered);
  };

  const handleExportLogs = async () => {
    try {
      setLoading(true);
      toast.info('Exporting audit logs...');

      await GDPRAPI.downloadAuditLogs();

      toast.success('Audit logs exported successfully');
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || 'Failed to export audit logs. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string): string => {
    const actionColors: Record<string, string> = {
      'DOCUMENT_UPLOAD': 'bg-green-500/10 text-green-600 border-green-500/20',
      'DOCUMENT_DELETE': 'bg-red-500/10 text-red-600 border-red-500/20',
      'DOCUMENT_VIEW': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'USER_LOGIN': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'USER_LOGOUT': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      'SEARCH_QUERY': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'CHAT_SESSION': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      'GDPR_EXPORT': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'GDPR_DELETE': 'bg-red-500/10 text-red-600 border-red-500/20',
    };

    return actionColors[action] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Logs & System Activity</h1>
        <p className="text-muted-foreground">
          Track all system actions and user activities ({auditLogs.length} logs)
        </p>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by username, action, or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background min-w-[200px]"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <Button
              onClick={handleExportLogs}
              disabled={loading || auditLogs.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardContent className="p-6">
          {loading && auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No audit logs found</p>
              {auditLogs.length === 0 && (
                <p className="text-xs mt-1">Audit logs endpoint may not be implemented on the backend yet</p>
              )}
              {auditLogs.length > 0 && searchTerm && (
                <p className="text-xs mt-1">Try adjusting your search filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium text-blue-600">{log.username}</p>
                        <span className="text-muted-foreground">performed</span>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-muted-foreground">on</span>
                        <span className="font-medium">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-xs text-muted-foreground">#{log.resource_id}</span>
                        )}
                      </div>

                      {log.details && (
                        <p className="text-xs text-muted-foreground mb-1">{log.details}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {auditLogs.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Activity Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{auditLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total Logs</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {new Set(auditLogs.map(log => log.user_id)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique Users</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {uniqueActions.length}
                </p>
                <p className="text-xs text-muted-foreground">Action Types</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {filteredLogs.length}
                </p>
                <p className="text-xs text-muted-foreground">Filtered Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
