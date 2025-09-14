"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

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
}

interface UploadedFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
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
}: ImageUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `Tipo de archivo no válido. Formatos aceptados: ${acceptedFileTypes.join(", ")}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSize}MB`;
    }
    
    return null;
  };

  const handleFileUpload = async (files: File[]) => {
    if (disabled) return;
    
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    // Validate files
    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          status: "pending",
          progress: 0,
        });
      }
    });

    if (errors.length > 0) {
      onError?.(errors.join("\n"));
      return;
    }

    // Check max files limit
    const totalFiles = uploadedFiles.length + validFiles.length + value.length;
    if (totalFiles > maxFiles) {
      onError?.(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setUploadedFiles((prev) => [...prev, ...validFiles]);
    setUploading(true);

    try {
      const uploadPromises = validFiles.map(async (uploadFile, index) => {
        const currentIndex = uploadedFiles.length + index;
        
        // Update status to uploading
        setUploadedFiles((prev) =>
          prev.map((f, i) =>
            i === currentIndex ? { ...f, status: "uploading" as const } : f
          )
        );

        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append("file", uploadFile.file);
          formData.append("organizationId", organizationId);
          formData.append("entityType", entityType);
          if (entityId) {
            formData.append("entityId", entityId);
          }

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadedFiles((prev) =>
              prev.map((f, i) => {
                if (i === currentIndex && f.progress < 90) {
                  return { ...f, progress: f.progress + 10 };
                }
                return f;
              })
            );
          }, 200);

          // Upload to R2 via our API endpoint
          const response = await fetch("/api/upload/images", {
            method: "POST",
            body: formData,
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Update file with success status
          setUploadedFiles((prev) =>
            prev.map((f, i) =>
              i === currentIndex
                ? {
                    ...f,
                    status: "success" as const,
                    progress: 100,
                    url: result.url,
                  }
                : f
            )
          );

          return result.url;
        } catch (error) {
          // Update file with error status
          setUploadedFiles((prev) =>
            prev.map((f, i) =>
              i === currentIndex
                ? {
                    ...f,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Error de subida",
                  }
                : f
            )
          );
          throw error;
        }
      });

      const uploadedUrls = await Promise.allSettled(uploadPromises);
      const successfulUrls = uploadedUrls
        .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
        .map((result) => result.value);

      if (successfulUrls.length > 0) {
        const newUrls = [...value, ...successfulUrls];
        onChange?.(newUrls);
        onUploadComplete?.(successfulUrls);
      }

      const failedUploads = uploadedUrls.filter((result) => result.status === "rejected");
      if (failedUploads.length > 0) {
        onError?.(`${failedUploads.length} archivos no se pudieron subir`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      onError?.("Error durante la subida de archivos");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFileUpload(acceptedFiles);
    },
    [organizationId, entityType, entityId, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
  };

  const removeUploadedImage = async (index: number) => {
    const urlToDelete = value[index];
    
    if (urlToDelete) {
      try {
        // Delete from R2
        const response = await fetch("/api/upload/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId,
            urls: [urlToDelete],
          }),
        });

        if (!response.ok) {
          console.error("Failed to delete from R2");
          onError?.("Error al eliminar la imagen del servidor");
        }
      } catch (error) {
        console.error("Delete error:", error);
        onError?.("Error al eliminar la imagen");
      }
    }
    
    // Remove from local state regardless of R2 deletion success
    const newUrls = value.filter((_, i) => i !== index);
    onChange?.(newUrls);
  };

  const retryUpload = (index: number) => {
    const fileToRetry = uploadedFiles[index];
    if (fileToRetry && fileToRetry.status === "error") {
      handleFileUpload([fileToRetry.file]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors",
          dragActive || isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-medium">Haz clic para subir</span> o arrastra y suelta
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {acceptedFileTypes.join(", ")} hasta {maxSize}MB
          </p>
          <p className="text-xs text-muted-foreground">
            Máximo {maxFiles} archivos
          </p>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Subiendo archivos</Label>
          {uploadedFiles.map((uploadFile, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded flex items-center justify-center">
                {uploadFile.status === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : uploadFile.status === "success" ? (
                  <ImageIcon className="h-4 w-4 text-green-600" />
                ) : uploadFile.status === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                {uploadFile.status === "uploading" && (
                  <Progress value={uploadFile.progress} className="h-1" />
                )}
                {uploadFile.status === "error" && uploadFile.error && (
                  <p className="text-xs text-red-600">{uploadFile.error}</p>
                )}
              </div>

              <Badge
                variant={
                  uploadFile.status === "success"
                    ? "default"
                    : uploadFile.status === "error"
                    ? "destructive"
                    : "secondary"
                }
              >
                {uploadFile.status === "pending"
                  ? "Pendiente"
                  : uploadFile.status === "uploading"
                  ? "Subiendo"
                  : uploadFile.status === "success"
                  ? "Completado"
                  : "Error"}
              </Badge>

              <div className="flex-shrink-0">
                {uploadFile.status === "error" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryUpload(index)}
                  >
                    Reintentar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label>Imágenes subidas</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((url, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  <div className="aspect-square relative">
                    <img
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeUploadedImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Subiendo archivos... No cierres esta ventana.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
