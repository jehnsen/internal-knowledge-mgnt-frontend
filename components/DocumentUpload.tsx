"use client";

import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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

    for (const uploadFile of pendingFiles) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        // Upload to real API
        await DocumentAPI.uploadDocumentFile(
          uploadFile.file,
          uploadFile.file.name,
          { description: `Uploaded on ${new Date().toLocaleDateString()}` }
        );

        // Mark as success
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
        ));
      } catch (error: any) {
        console.error('Upload failed:', error);
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? {
            ...f,
            status: 'error' as const,
            error: error.message || 'Upload failed'
          } : f
        ));
      }
    }

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

  return (
    <div className="space-y-4">
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
            <h4 className="font-semibold text-sm">Files ({files.length})</h4>
            <Button
              onClick={handleUpload}
              disabled={!files.some(f => f.status === 'pending')}
              size="sm"
            >
              Upload All
            </Button>
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
