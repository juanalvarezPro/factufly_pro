"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  X, 
  RotateCcw, 
  ImageIcon 
} from "lucide-react";

interface UploadedFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (index: number) => void;
  onRetry?: (index: number) => void;
  showPreview?: boolean;
  className?: string;
}

export function FileList({ 
  files, 
  onRemove, 
  onRetry, 
  showPreview = false,
  className 
}: FileListProps) {
  if (files.length === 0) return null;

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "uploading":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: UploadedFile["status"]) => {
    switch (status) {
      case "success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completado</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "uploading":
        return <Badge variant="outline">Subiendo...</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file, index) => (
        <div
          key={`${file.file.name}-${index}`}
          className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50"
        >
          {/* File Icon/Preview */}
          <div className="flex-shrink-0">
            {showPreview && file.preview ? (
              <img
                src={file.preview}
                alt={file.file.name}
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            {/* Progress Bar */}
            {file.status === "uploading" && (
              <Progress 
                value={file.progress || 0} 
                className="mt-2 h-1" 
              />
            )}
            
            {/* Error Message */}
            {file.status === "error" && file.error && (
              <p className="text-xs text-red-600 mt-1">{file.error}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            {getStatusIcon(file.status)}
            {getStatusBadge(file.status)}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {file.status === "error" && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetry(index)}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(index)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
