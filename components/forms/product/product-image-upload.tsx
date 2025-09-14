"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

// ===== TYPES =====

interface ProductImageUploadProps {
  selectedImages: File[];
  imagePreviewUrls: string[];
  isUploading: boolean;
  onImageSelect: (files: File[]) => void;
  onImageRemove: (index: number) => void;
  existingImages?: string[];
  maxImages?: number;
  maxSizePerImage?: number; // in MB
}

// ===== COMPONENT =====

export function ProductImageUpload({
  selectedImages,
  imagePreviewUrls,
  isUploading,
  onImageSelect,
  onImageRemove,
  existingImages = [],
  maxImages = 5,
  maxSizePerImage = 5,
}: ProductImageUploadProps) {
  const totalImages = existingImages.length + selectedImages.length;
  const canAddMore = totalImages < maxImages;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter out files that are too large
      const validFiles = acceptedFiles.filter(file => {
        const sizeInMB = file.size / (1024 * 1024);
        return sizeInMB <= maxSizePerImage;
      });

      // Limit to remaining slots
      const remainingSlots = maxImages - totalImages;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      if (filesToAdd.length > 0) {
        onImageSelect(filesToAdd);
      }
    },
    [onImageSelect, maxImages, totalImages, maxSizePerImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    disabled: !canAddMore || isUploading,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={`
            cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
            ${isUploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="size-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              {isDragActive ? (
                <p>Suelta las imágenes aquí...</p>
              ) : (
                <>
                  <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
                  <p className="text-xs">
                    Máximo {maxImages} imágenes, {maxSizePerImage}MB cada una
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="size-4 animate-pulse rounded-full" />
          Subiendo imágenes...
        </div>
      )}

      {/* Images Grid */}
      {(existingImages.length > 0 || selectedImages.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Existing Images */}
          {existingImages.map((imageUrl, index) => (
            <div key={`existing-${index}`} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={imageUrl}
                  alt={`Existing image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Handle existing image removal
                    // This would require additional prop/handler
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="rounded bg-black/50 px-2 py-1 text-xs text-white">
                  Existente
                </span>
              </div>
            </div>
          ))}

          {/* New Images */}
          {selectedImages.map((file, index) => (
            <div key={`new-${index}`} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={imagePreviewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => onImageRemove(index)}
                  disabled={isUploading}
                >
                  <X className="size-3" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="rounded bg-green-500 px-2 py-1 text-xs text-white">
                  Nuevo
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {existingImages.length === 0 && selectedImages.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-2 size-12 opacity-50" />
          <p className="text-sm">No hay imágenes seleccionadas</p>
        </div>
      )}

      {/* Images Counter */}
      <div className="text-center text-xs text-muted-foreground">
        {totalImages} de {maxImages} imágenes
      </div>
    </div>
  );
}
