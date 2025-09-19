"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
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
        return <CheckCircle className="size-4 text-green-600" />;  
      case "error":
        return <AlertCircle className="size-4 text-red-600" />;
      case "uploading":
        return <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <div className="size-4 rounded-full bg-gray-300" />;
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
          className="flex items-center space-x-3 rounded-lg border bg-muted/50 p-3"
        >
          {/* File Icon/Preview */}
          <div className="shrink-0">   
            {showPreview && file.preview ? (
              <div className="relative size-10 overflow-hidden rounded">
                <Image
                  src={file.preview}
                  alt={file.file.name}
                  className="object-cover"
                  fill
                  sizes="40px"
                />
              </div>
            ) : (
              <ImageIcon className="size-10 text-muted-foreground" />
            )}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
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
              <p className="mt-1 text-xs text-red-600">{file.error}</p>
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
                className="size-8 p-0"
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(index)}
              className="size-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
