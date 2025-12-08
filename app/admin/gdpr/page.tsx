"use client";

import { useState, useEffect } from "react";
import { HardDrive, Users, Shield, Download, Trash2, AlertTriangle, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DocumentAPI, GDPRAPI, AuditAPI, User, AuditLog as AuditLogType } from "@/lib/api";
import { AuditLog } from "@/lib/audit";
import { toast } from "sonner";

export default function GDPRPage() {
  const [documentCount, setDocumentCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showUserExportDialog, setShowUserExportDialog] = useState(false);

  // Form states for data deletion
  const [deletionReason, setDeletionReason] = useState("");
  const [deleteDocuments, setDeleteDocuments] = useState(true);
  const [deleteChatHistory, setDeleteChatHistory] = useState(true);
  const [deleteSearchHistory, setDeleteSearchHistory] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load documents count
      const docsResponse = await DocumentAPI.getDocuments(0, 100);
      setDocumentCount(docsResponse.total || 0);

      // Load users list (try to fetch, fallback to mock if endpoint not ready)
      try {
        const usersResponse = await GDPRAPI.getUsers(0, 100);
        setUsers(usersResponse.items || []);
      } catch (err) {
        console.warn('Users endpoint not yet implemented, using empty array');
        setUsers([]);
      }

      // Load recent audit logs (try to fetch, fallback to mock if endpoint not ready)
      try {
        const logsResponse = await AuditAPI.getAuditLogs(0, 10);

        // Handle both array and paginated response formats
        if (Array.isArray(logsResponse)) {
          setAuditLogs(logsResponse);
        } else if (logsResponse && 'items' in logsResponse) {
          setAuditLogs(logsResponse.items || []);
        } else {
          setAuditLogs([]);
        }
      } catch (err) {
        console.warn('Audit logs endpoint not yet implemented, using empty array');
        setAuditLogs([]);
      }

    } catch (err) {
      console.error('Failed to load GDPR data:', err);
      toast.error('Failed to load GDPR data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportUserData = async (userId?: number, username?: string) => {
    try {
      setLoading(true);
      toast.info('Preparing user data export...');

      await GDPRAPI.downloadUserData(userId, username);

      toast.success('User data exported successfully');
      setShowUserExportDialog(false);

      // Log audit event
      if (userId && username) {
        await AuditLog.gdprExport(userId, username);
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || 'Failed to export user data. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      setLoading(true);
      toast.info('Preparing audit logs export...');

      await GDPRAPI.downloadAuditLogs();

      toast.success('Audit logs exported successfully');

      // Log audit event
      await AuditLog.gdprAuditExport();
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || 'Failed to export audit logs. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletionRequest = async () => {
    if (!selectedUser) {
      toast.error('Please select a user first');
      return;
    }

    try {
      setLoading(true);

      const result = await GDPRAPI.requestDataDeletion({
        user_id: selectedUser.id,
        reason: deletionReason,
        delete_documents: deleteDocuments,
        delete_chat_history: deleteChatHistory,
        delete_search_history: deleteSearchHistory,
      });

      toast.success(result.request_id
        ? `Data deletion request submitted. Request ID: ${result.request_id}`
        : 'Data deletion request submitted successfully');
      setShowDeleteDialog(false);

      // Log audit event
      await AuditLog.gdprDeleteRequest(
        selectedUser.id,
        selectedUser.username,
        deletionReason
      );

      // Reset form
      setSelectedUser(null);
      setDeletionReason("");
      setDeleteDocuments(true);
      setDeleteChatHistory(true);
      setDeleteSearchHistory(true);

      // Reload data
      loadData();
    } catch (err: any) {
      console.error('Deletion request failed:', err);
      toast.error(err.message || 'Failed to submit deletion request. Backend endpoint may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">GDPR & Data Privacy</h1>
        <p className="text-muted-foreground">
          Data protection compliance and user data management (GDPR Articles 15-22)
        </p>
      </div>

      {/* Stats Cards */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                <HardDrive className="h-8 w-8 text-blue-600 mb-3" />
                <p className="font-semibold mb-1">Data Storage</p>
                <p className="text-2xl font-bold mb-2">{documentCount}</p>
                <p className="text-xs text-muted-foreground">Total documents stored</p>
              </div>
              <div className="p-4 rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/10">
                <Users className="h-8 w-8 text-green-600 mb-3" />
                <p className="font-semibold mb-1">User Records</p>
                <p className="text-2xl font-bold mb-2">{users.length}</p>
                <p className="text-xs text-muted-foreground">Active user accounts</p>
              </div>
              <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                <Shield className="h-8 w-8 text-purple-600 mb-3" />
                <p className="font-semibold mb-1">Audit Trail</p>
                <p className="text-2xl font-bold mb-2">{auditLogs.length}</p>
                <p className="text-xs text-muted-foreground">Recent activity records</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GDPR Compliance Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            GDPR Compliance Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => setShowUserExportDialog(true)}
              disabled={loading}
            >
              <div className="flex items-start gap-3 text-left">
                <Download className="h-5 w-5 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium">Export User Data</p>
                  <p className="text-xs text-muted-foreground">
                    GDPR Article 20 - Right to Data Portability
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={handleExportAuditLogs}
              disabled={loading}
            >
              <div className="flex items-start gap-3 text-left">
                <Download className="h-5 w-5 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">Export Audit Logs</p>
                  <p className="text-xs text-muted-foreground">
                    Compliance reporting and activity tracking
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
            >
              <div className="flex items-start gap-3 text-left">
                <Trash2 className="h-5 w-5 mt-0.5 text-red-600" />
                <div>
                  <p className="font-medium">Request Data Deletion</p>
                  <p className="text-xs text-muted-foreground">
                    GDPR Article 17 - Right to be Forgotten
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => setShowPrivacyPolicy(true)}
            >
              <div className="flex items-start gap-3 text-left">
                <FileText className="h-5 w-5 mt-0.5 text-purple-600" />
                <div>
                  <p className="font-medium">Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">
                    Review data protection policies
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs */}
      {auditLogs.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Recent Audit Logs
            </h3>
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded border text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{log.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {log.action} - {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                  </p>
                  {log.ip_address && (
                    <p className="text-xs text-muted-foreground mt-1">IP: {log.ip_address}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Export Dialog */}
      <Dialog open={showUserExportDialog} onOpenChange={setShowUserExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export User Data</DialogTitle>
            <DialogDescription>
              Select a user to export their data or export your own data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select User</Label>
              <select
                className="w-full mt-2 px-3 py-2 border rounded-md bg-background"
                onChange={(e) => {
                  const user = users.find(u => u.id === parseInt(e.target.value));
                  setSelectedUser(user || null);
                }}
                value={selectedUser?.id || ''}
              >
                <option value="">-- Select User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleExportUserData(selectedUser?.id, selectedUser?.username)}
                disabled={!selectedUser || loading}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected User
              </Button>
              <Button
                onClick={() => handleExportUserData()}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Export My Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Deletion Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Request Data Deletion
            </DialogTitle>
            <DialogDescription>
              This action will submit a GDPR data deletion request (Right to be Forgotten - Article 17)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select User</Label>
              <select
                className="w-full mt-2 px-3 py-2 border rounded-md bg-background"
                onChange={(e) => {
                  const user = users.find(u => u.id === parseInt(e.target.value));
                  setSelectedUser(user || null);
                }}
                value={selectedUser?.id || ''}
              >
                <option value="">-- Select User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Reason for Deletion (Optional)</Label>
              <Input
                className="mt-2"
                placeholder="Enter reason for data deletion..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data to Delete</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deleteDocuments}
                    onChange={(e) => setDeleteDocuments(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Delete uploaded documents</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deleteChatHistory}
                    onChange={(e) => setDeleteChatHistory(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Delete chat history</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deleteSearchHistory}
                    onChange={(e) => setDeleteSearchHistory(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Delete search history</span>
                </label>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <p className="text-xs text-red-600 font-medium">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Warning: This action cannot be undone. All selected user data will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDataDeletionRequest}
                disabled={!selectedUser || loading}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy & Data Protection</DialogTitle>
            <DialogDescription>
              GDPR Compliance Information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Data Collection and Usage</h3>
              <p className="text-muted-foreground">
                We collect and process personal data in accordance with GDPR (General Data Protection Regulation).
                This includes user account information, search queries, chat history, and uploaded documents.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Your Rights Under GDPR</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                  <span><strong>Right to Access (Article 15):</strong> Request access to your personal data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                  <span><strong>Right to Rectification (Article 16):</strong> Request correction of inaccurate data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                  <span><strong>Right to Erasure (Article 17):</strong> Request deletion of your data (Right to be Forgotten)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                  <span><strong>Right to Data Portability (Article 20):</strong> Receive your data in a machine-readable format</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                  <span><strong>Right to Object (Article 21):</strong> Object to processing of your data</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Data Retention</h3>
              <p className="text-muted-foreground">
                We retain personal data only for as long as necessary to fulfill the purposes for which it was collected,
                or as required by law. User data is automatically anonymized after 365 days of inactivity.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to ensure a level of security appropriate
                to the risk, including encryption, access controls, and regular security audits.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Third-Party Sharing</h3>
              <p className="text-muted-foreground">
                We do not sell or share your personal data with third parties for marketing purposes. Data may be shared
                with service providers who assist in operating our service, under strict confidentiality agreements.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Audit Logging</h3>
              <p className="text-muted-foreground">
                All data access and modifications are logged for security and compliance purposes. Audit logs are retained
                for 7 years as required by data protection regulations.
              </p>
            </section>

            <section className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Contact Data Protection Officer
              </h3>
              <p className="text-muted-foreground">
                For any questions or to exercise your rights, please contact our Data Protection Officer at:
                <strong> dpo@company.com</strong>
              </p>
            </section>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowPrivacyPolicy(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
