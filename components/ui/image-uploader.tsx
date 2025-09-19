"use client";

import { useState, useCallback } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { UploadArea } from "./upload-area";
import { FileList } from "./file-list";
import { useImageUpload } from "@/hooks/use-image-upload";

interface ImageUploaderProps {
  organizationId: string;
  entityType: "product" | "combo" | "packaging" | "organization";
  entityId?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  value?: string[];
  onChange?: (urls: string[]) => void;
  customFileName?: string; // Custom filename to use
  useOriginalName?: boolean; // Use original filename without UUID
}

interface UploadedFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  url?: string;
  error?: string;
}

export function ImageUploader({
  organizationId,
  entityType,
  entityId,
  maxFiles = 5,
  maxSize = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  onUploadComplete,
  onError,
  className,
  disabled = false,
  value = [],
  onChange,
  customFileName,
  useOriginalName = false,
}: ImageUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Use the custom hook for upload logic
  const { isUploading, uploadBatch, deleteImages } = useImageUpload({
    organizationId,
    entityType,
    entityId,
    maxFiles,
    maxSizeBytes: maxSize * 1024 * 1024,
    allowedTypes: acceptedFileTypes,
    customFileName,
    useOriginalName,
  });

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled) return;
    
    // Check max files limit
    const currentFiles = value.length;
    const newFiles = files.length;
    const totalFiles = currentFiles + newFiles;
    
    if (totalFiles > maxFiles) {
      onError?.(`Máximo ${maxFiles} archivos permitidos. Ya tienes ${currentFiles} archivo(s) subido(s).`);
      return;
    }

    // Create uploaded files for tracking
    const newUploadedFiles: UploadedFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);

    try {
      // Use the hook's uploadBatch method
      const results = await uploadBatch(files);
      
      if (results.length > 0) {
        const successfulUrls = results.map(result => result.url);
        const newUrls = [...value, ...successfulUrls];
        onChange?.(newUrls);
        onUploadComplete?.(successfulUrls);
        
        // Update uploaded files status
        setUploadedFiles((prev) => 
          prev.map((f, i) => {
            const resultIndex = i - (prev.length - newUploadedFiles.length);
            if (resultIndex >= 0 && resultIndex < results.length) {
              return {
                ...f,
                status: "success" as const,
                progress: 100,
                url: results[resultIndex].url,
              };
            }
            return f;
          })
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      onError?.("Error durante la subida de archivos");
      
      // Update uploaded files status to error
      setUploadedFiles((prev) => 
        prev.map((f, i) => {
          const isNewFile = i >= prev.length - newUploadedFiles.length;
          if (isNewFile) {
            return {
              ...f,
              status: "error" as const,
              error: error instanceof Error ? error.message : "Error de subida",
            };
          }
          return f;
        })
      );
    }
  }, [disabled, maxFiles, value, onChange, onUploadComplete, onError, uploadBatch]);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      handleFileUpload(files);
    },
    [handleFileUpload]
  );

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
  };

  const removeUploadedImage = async (index: number) => {
    const urlToDelete = value[index];
    
    // Remove from local state immediately for better UX
    const newUrls = value.filter((_, i) => i !== index);
    onChange?.(newUrls);
    
    // Also remove from uploadedFiles if it exists there
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    
    if (urlToDelete) {
      try {
        // Use the hook's deleteImages method
        await deleteImages([urlToDelete]);
      } catch (error) {
        console.error("Delete error:", error);
        onError?.("Error al eliminar la imagen");
      }
    }
  };

  const retryUpload = (index: number) => {
    const fileToRetry = uploadedFiles[index];
    if (fileToRetry && fileToRetry.status === "error") {
      handleFileUpload([fileToRetry.file]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <UploadArea
        onFilesSelected={handleFilesSelected}
        disabled={disabled}
        maxFiles={maxFiles}
        maxSize={maxSize}
        acceptedFileTypes={acceptedFileTypes}
      />

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Subiendo archivos</Label>
          <FileList
            files={uploadedFiles}
            onRemove={removeFile}
            onRetry={retryUpload}
            showPreview={true}
          />
        </div>
      )}

      {/* Uploaded Images */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label>Imágenes subidas</Label>
          <div className="space-y-2">
            {value.map((url, index) => {
              // Extract filename from the R2 key
              const filename = url.split('/').pop() || `Imagen ${index + 1}`;
              return (
                <div key={index} className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="size-4 text-green-600" />
                    <span className="text-sm font-medium">Imagen subida: {filename}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeUploadedImage(index);
                    }}
                  >
                    <X className="mr-1 size-3" />
                    Eliminar
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <Alert>
          <Loader2 className="size-4 animate-spin" />
          <AlertDescription>
            Subiendo archivos... No cierres esta ventana.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
