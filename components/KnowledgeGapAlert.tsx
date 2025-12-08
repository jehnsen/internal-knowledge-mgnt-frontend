"use client";

import { AlertTriangle, FileSearch, Upload, Lightbulb, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KnowledgeGapAlertProps {
  query: string;
  message: string;
  onUploadClick?: () => void;
  onRefineQuery?: () => void;
  className?: string;
}

export function KnowledgeGapAlert({
  query,
  message,
  onUploadClick,
  onRefineQuery,
  className
}: KnowledgeGapAlertProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <FileSearch className="h-6 w-6 text-orange-600" />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Knowledge Gap Detected
              </h3>
              <p className="text-muted-foreground">
                {message}
              </p>
            </div>

            <Alert className="bg-blue-500/5 border-blue-500/20">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription className="ml-2">
                <strong>Your question:</strong> "{query}"
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Here's what you can do:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {onUploadClick && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={onUploadClick}
                  >
                    <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Upload Relevant Documents</p>
                      <p className="text-xs text-muted-foreground">Add information to the knowledge base</p>
                    </div>
                  </Button>
                )}

                {onRefineQuery && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={onRefineQuery}
                  >
                    <FileSearch className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Refine Your Query</p>
                      <p className="text-xs text-muted-foreground">Try different keywords or phrasing</p>
                    </div>
                  </Button>
                )}

                <a
                  href="/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-auto py-3 px-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Browse All Documents</p>
                    <p className="text-xs text-muted-foreground">Explore the knowledge base</p>
                  </div>
                </a>

                <a
                  href="mailto:support@company.com"
                  className="inline-flex items-center justify-start h-auto py-3 px-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
                >
                  <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Contact Support</p>
                    <p className="text-xs text-muted-foreground">Get help from our team</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> This gap has been recorded to help improve our knowledge base.
                Administrators will review and address missing content.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
