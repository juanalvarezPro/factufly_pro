"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface UploadOptions {
  organizationId: string;
  entityType: "product" | "combo" | "packaging" | "organization" | "user";
  entityId?: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  customFileName?: string;
  useOriginalName?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
  organizationSlug: string;
  entityType: string;
  entityId?: string;
}

export interface PresignedUploadData {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  expiresAt: string;
  uploadInstructions: {
    method: string;
    headers: Record<string, string>;
    maxSize: number;
  };
}

export function useImageUpload(options: UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const validateFile = useCallback((file: File): string | null => {
    const {
      maxSizeBytes = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    } = options;

    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no válido. Formatos permitidos: ${allowedTypes.join(", ")}`;
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / 1024 / 1024);
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [options]);

  // Direct upload to our API endpoint
  const uploadDirect = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setIsUploading(true);
    const results: UploadResult[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        // Create FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("organizationId", options.organizationId);
        formData.append("entityType", options.entityType);
        if (options.entityId) {
          formData.append("entityId", options.entityId);
        }
        if (options.customFileName) {
          formData.append("customFileName", options.customFileName);
        }
        if (options.useOriginalName) {
          formData.append("useOriginalName", "true");
        }

        // Upload progress tracking
        const fileId = `${file.name}-${Date.now()}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Simulate progress (since we can't track FormData upload progress easily)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: Math.min(prev[fileId] + 10, 90)
            }));
          }, 200);

          const response = await fetch("/api/upload/images", {
            method: "POST",
            body: formData,
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Error de subida");
          }

          const result = await response.json();
          results.push(result.data);

          // Complete progress
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error);
          errors.push(`${file.name}: ${error instanceof Error ? error.message : "Error desconocido"}`);
          
          // Remove progress for failed upload
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      }

      if (errors.length > 0) {
        toast.error(`Errores de subida:\n${errors.join("\n")}`);
      }

      if (results.length > 0) {
        toast.success(`${results.length} archivo(s) subido(s) exitosamente`);
      }

      return results;

    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [options, validateFile]);

  // Generate presigned URL for direct browser upload
  const generatePresignedUrl = useCallback(async (file: File): Promise<PresignedUploadData> => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const response = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: options.organizationId,
        entityType: options.entityType,
        entityId: options.entityId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error al generar URL de subida");
    }

    const result = await response.json();
    return result.data;
  }, [options, validateFile]);

  // Upload using presigned URL
  const uploadPresigned = useCallback(async (file: File, presignedData: PresignedUploadData): Promise<UploadResult> => {
    const { uploadUrl, publicUrl, key } = presignedData;

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Error de subida: ${response.statusText}`);
    }

    return {
      key,
      url: publicUrl,
      publicUrl,
      size: file.size,
      contentType: file.type,
      organizationSlug: key.split('/')[0], // Extract from key
      entityType: options.entityType,
      entityId: options.entityId,
    };
  }, [options]);

  // Delete uploaded images
  const deleteImages = useCallback(async (urls: string[]): Promise<{ success: number; failed: number }> => {
    try {
      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: options.organizationId,
          urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error al eliminar imágenes");
      }

      const result = await response.json();
      const { deleted, failed } = result.data;

      if (deleted > 0) {
        toast.success(`${deleted} imagen(es) eliminada(s) exitosamente`);
      }

      if (failed > 0) {
        toast.error(`No se pudieron eliminar ${failed} imagen(es)`);
      }

      return { success: deleted, failed };

    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar imágenes");
      return { success: 0, failed: urls.length };
    }
  }, [options.organizationId]);

  // Batch upload with progress tracking
  const uploadBatch = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const { maxFiles = 10 } = options;

    if (files.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return [];
    }

    // Use direct upload for simplicity, but could be enhanced to use presigned URLs
    return uploadDirect(files);
  }, [options, uploadDirect]);

  return {
    // State
    isUploading,
    uploadProgress,

    // Methods
    uploadDirect,
    uploadBatch,
    generatePresignedUrl,
    uploadPresigned,
    deleteImages,
    validateFile,

    // Utilities
    reset: () => {
      setIsUploading(false);
      setUploadProgress({});
    },
  };
}
