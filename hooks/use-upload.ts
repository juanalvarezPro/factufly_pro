"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// ===== TYPES =====

export interface UploadImageInput {
  file: File;
  folder?: string;
  organizationId?: string;
}

export interface UploadImageResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export interface UploadMultipleImagesInput {
  files: File[];
  folder?: string;
  organizationId?: string;
}

export interface UploadMultipleImagesResult {
  results: UploadImageResult[];
  successful: number;
  failed: number;
  errors?: string[];
}

// ===== VALIDATION =====

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_TYPES.join(", ")}`;
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  
  return null;
}

// ===== UPLOAD FUNCTIONS =====

async function uploadSingleImage(input: UploadImageInput): Promise<UploadImageResult> {
  // Validate file
  const validationError = validateImageFile(input.file);
  if (validationError) {
    throw new Error(validationError);
  }

  // Create FormData
  const formData = new FormData();
  formData.append("file", input.file);
  
  if (input.folder) {
    formData.append("folder", input.folder);
  }
  
  if (input.organizationId) {
    formData.append("organizationId", input.organizationId);
  }

  // Upload to API
  const response = await fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al subir la imagen");
  }

  return response.json();
}

async function uploadMultipleImages(input: UploadMultipleImagesInput): Promise<UploadMultipleImagesResult> {
  const results: UploadImageResult[] = [];
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;

  // Upload files concurrently with limit
  const uploadPromises = input.files.map(async (file) => {
    try {
      const result = await uploadSingleImage({
        file,
        folder: input.folder,
        organizationId: input.organizationId,
      });
      results.push(result);
      successful++;
      return result;
    } catch (error: any) {
      errors.push(`${file.name}: ${error.message}`);
      failed++;
      throw error;
    }
  });

  // Wait for all uploads (allowing some to fail)
  await Promise.allSettled(uploadPromises);

  return {
    results,
    successful,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ===== HOOKS =====

export function useUploadImage() {
  return useMutation({
    mutationFn: uploadSingleImage,
    onSuccess: (data) => {
      toast.success("Imagen subida exitosamente");
    },
    onError: (error: any) => {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Error al subir la imagen");
    },
  });
}

function useUploadMultipleImages() {
  return useMutation({
    mutationFn: uploadMultipleImages,
    onSuccess: (data) => {
      if (data.successful > 0) {
        toast.success(`${data.successful} imagen(es) subida(s) exitosamente`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} imagen(es) fallaron al subirse`);
      }
    },
    onError: (error: any) => {
      console.error("Error uploading images:", error);
      toast.error(error.message || "Error al subir las imágenes");
    },
  });
}

// ===== UTILITIES =====

function useImageUploadUtils() {
  return {
    validateImageFile,
    MAX_FILE_SIZE,
    ALLOWED_TYPES,
    formatFileSize: (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    isValidImageType: (type: string): boolean => ALLOWED_TYPES.includes(type),
    getImageDimensions: (file: File): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    },
  };
}

// ===== DELETE IMAGE HOOK =====

function useDeleteImage() {
  return useMutation({
    mutationFn: async ({ publicId }: { publicId: string }): Promise<void> => {
      const response = await fetch("/api/upload/image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar la imagen");
      }
    },
    onSuccess: () => {
      toast.success("Imagen eliminada exitosamente");
    },
    onError: (error: any) => {
      console.error("Error deleting image:", error);
      toast.error(error.message || "Error al eliminar la imagen");
    },
  });
}

// ===== EXPORT ALL =====

export default useUploadImage;
export {
  useUploadMultipleImages,
  useImageUploadUtils,
  useDeleteImage,
};
