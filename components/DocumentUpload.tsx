"use client";

import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2, Tags, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  category?: string;
  tags?: string[];
}

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const retryFailed = () => {
    setFiles(prev => prev.map(f =>
      f.status === 'error' ? { ...f, status: 'pending' as const, error: undefined } : f
    ));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconClass = "h-8 w-8";

    switch (ext) {
      case 'pdf':
        return <File className={cn(iconClass, "text-red-500")} />;
      case 'doc':
      case 'docx':
        return <File className={cn(iconClass, "text-blue-500")} />;
      case 'xls':
      case 'xlsx':
        return <File className={cn(iconClass, "text-green-500")} />;
      case 'ppt':
      case 'pptx':
        return <File className={cn(iconClass, "text-orange-500")} />;
      case 'txt':
        return <File className={cn(iconClass, "text-gray-500")} />;
      default:
        return <File className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    setIsUploading(true);

    for (const uploadFile of pendingFiles) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        // Upload to real API
        // Try with default values first - backend may auto-generate or require them
        const uploadedDoc = await DocumentAPI.uploadDocumentFile(
          uploadFile.file,
          'general',  // default category
          ['document']  // default tags
        );

        // Extract category and tags from response
        const category = uploadedDoc.category || 'general';
        const tags = uploadedDoc.tags || ['document'];

        // Mark as success with metadata
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? {
            ...f,
            status: 'success' as const,
            progress: 100,
            category,
            tags
          } : f
        ));
      } catch (error: any) {
        console.error('Upload failed:', error);

        // Parse error message for better user feedback
        let errorMessage = 'Upload failed';
        if (error.message) {
          if (error.message.includes('utf-8') || error.message.includes('decode')) {
            errorMessage = 'File encoding error. The backend is having trouble processing this file format.';
          } else if (error.message.includes('Internal server error')) {
            errorMessage = 'Server error. Please try again or contact support.';
          } else {
            errorMessage = error.message;
          }
        }

        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? {
            ...f,
            status: 'error' as const,
            error: errorMessage
          } : f
        ));
      }
    }

    setIsUploading(false);

    // Call completion callback after all uploads
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const hasEncodingErrors = files.some(f =>
    f.status === 'error' && f.error?.includes('encoding')
  );

  return (
    <div className="space-y-4">
      {hasEncodingErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Backend Configuration Issue:</strong> The server is having trouble processing binary files (PDFs, etc.).
            The backend needs to be updated to handle file uploads properly without trying to decode them as UTF-8 text.
            Please contact your system administrator.
          </AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop files here, or click to browse
        </p>
        <Label htmlFor="file-upload">
          <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            Browse Files
          </Button>
        </Label>
        <Input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        />
        <p className="text-xs text-muted-foreground mt-4">
          Supported formats: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">
              Files ({files.length})
              {files.filter(f => f.status === 'success').length > 0 && (
                <span className="ml-2 text-green-600">
                  • {files.filter(f => f.status === 'success').length} uploaded
                </span>
              )}
            </h4>
            <div className="flex gap-2">
              {files.some(f => f.status === 'error') && (
                <Button
                  onClick={retryFailed}
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Retry Failed
                </Button>
              )}
              {files.some(f => f.status === 'success') && (
                <Button
                  onClick={clearCompleted}
                  variant="outline"
                  size="sm"
                >
                  Clear Completed
                </Button>
              )}
              <Button
                onClick={handleUpload}
                disabled={!files.some(f => f.status === 'pending') || isUploading}
                size="sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All ({files.filter(f => f.status === 'pending').length})
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map(uploadFile => (
              <Card key={uploadFile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getFileIcon(uploadFile.file.name)}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </p>

                      {uploadFile.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-full animate-pulse" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploading and analyzing content...
                          </p>
                        </div>
                      )}

                      {uploadFile.status === 'success' && (uploadFile.category || uploadFile.tags) && (
                        <div className="mt-2 space-y-1">
                          {uploadFile.category && (
                            <div className="flex items-center gap-1 text-xs">
                              <FolderOpen className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Category:</span>
                              <Badge variant="outline" className="text-xs">
                                {uploadFile.category}
                              </Badge>
                            </div>
                          )}
                          {uploadFile.tags && uploadFile.tags.length > 0 && (
                            <div className="flex items-start gap-1 text-xs">
                              <Tags className="h-3 w-3 text-muted-foreground mt-0.5" />
                              <span className="text-muted-foreground">Tags:</span>
                              <div className="flex flex-wrap gap-1">
                                {uploadFile.tags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {uploadFile.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{uploadFile.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {uploadFile.error && (
                        <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadFile.status)}

                      {uploadFile.status !== 'uploading' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(uploadFile.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
