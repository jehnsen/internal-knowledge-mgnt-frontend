"use client";

import { useState, useEffect } from "react";
import { HardDrive, Users, Shield, Download, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentAPI } from "@/lib/api";

export default function GDPRPage() {
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const docsResponse = await DocumentAPI.getDocuments(0, 100);
      setDocumentCount(docsResponse.total || 0);
    } catch (err) {
      console.error('Failed to load GDPR data:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">GDPR & Data Privacy</h1>
        <p className="text-muted-foreground">
          Data protection compliance and user data management
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border">
                <HardDrive className="h-8 w-8 text-blue-600 mb-3" />
                <p className="font-semibold mb-1">Data Storage</p>
                <p className="text-2xl font-bold mb-2">{documentCount} docs</p>
                <p className="text-xs text-muted-foreground">Total documents stored</p>
              </div>
              <div className="p-4 rounded-lg border">
                <Users className="h-8 w-8 text-green-600 mb-3" />
                <p className="font-semibold mb-1">User Records</p>
                <p className="text-2xl font-bold mb-2">1 user</p>
                <p className="text-xs text-muted-foreground">Active user accounts</p>
              </div>
              <div className="p-4 rounded-lg border">
                <Shield className="h-8 w-8 text-purple-600 mb-3" />
                <p className="font-semibold mb-1">Audit Trail</p>
                <p className="text-2xl font-bold mb-2">1 log</p>
                <p className="text-xs text-muted-foreground">Activity records</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Data Management Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export All User Data
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Audit Logs
                </Button>
                <Button variant="outline" className="justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Data Deletion
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Policy Review
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
