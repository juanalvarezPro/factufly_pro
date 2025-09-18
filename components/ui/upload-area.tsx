"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileImage } from "lucide-react";

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

export function UploadArea({
  onFilesSelected,
  disabled = false,
  maxFiles = 1,
  maxSize = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  className,
}: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    },
    [disabled, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const files = Array.from(e.target.files || []);
      onFilesSelected(files);
    },
    [disabled, onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    document.getElementById("file-input")?.click();
  }, [disabled]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        dragActive && !disabled
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        id="file-input"
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedFileTypes.join(",")}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center space-y-4">
        {dragActive ? (
          <FileImage className="h-12 w-12 text-primary" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground" />
        )}

        <div className="space-y-2">
          <p className="text-lg font-medium">
            {dragActive ? "Suelta los archivos aquí" : "Haz clic para subir o arrastra y suelta"}
          </p>
          <p className="text-sm text-muted-foreground">
            {acceptedFileTypes.join(", ")} hasta {maxSize}MB
          </p>
          <p className="text-xs text-muted-foreground">
            Máximo {maxFiles} archivo{maxFiles > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
