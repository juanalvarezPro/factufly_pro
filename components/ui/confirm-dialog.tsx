"use client";

import { ReactNode } from "react";
import { AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmVariant = "destructive" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  children?: ReactNode;
}

const variantConfig = {
  destructive: {
    icon: XCircle,
    iconColor: "text-red-500",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-600",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    confirmButtonClass: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-600",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    confirmButtonClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-600",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    confirmButtonClass: "bg-green-600 hover:bg-green-700 focus:ring-green-600",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "info",
  onConfirm,
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error in confirm dialog:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
          
          {children && (
            <div className="rounded-lg border p-3 bg-muted/50">
              {children}
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-row justify-end space-x-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isLoading}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={config.confirmButtonClass}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Convenience components for specific use cases
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = "elemento",
  onConfirm,
  isLoading = false,
  canRestore = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  canRestore?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="destructive"
      title={`¿Eliminar ${itemType}?`}
      description={
        <div className="space-y-2">
          <p>
            Estás a punto de eliminar <strong>"{itemName}"</strong>.
          </p>
          {canRestore ? (
            <p className="text-sm text-muted-foreground">
              Esta acción se puede deshacer restaurando el {itemType} más tarde.
            </p>
          ) : (
            <p className="text-sm text-red-600 font-medium">
              Esta acción es permanente y no se puede deshacer.
            </p>
          )}
        </div>
      }
      confirmText="Eliminar"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export function RestoreConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = "elemento",
  onConfirm,
  isLoading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="success"
      title={`¿Restaurar ${itemType}?`}
      description={
        <p>
          Estás a punto de restaurar <strong>"{itemName}"</strong>. 
          El {itemType} volverá a estar disponible en el sistema.
        </p>
      }
      confirmText="Restaurar"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export function SaveConfirmDialog({
  open,
  onOpenChange,
  title = "¿Guardar cambios?",
  description = "Los cambios se aplicarán inmediatamente.",
  onConfirm,
  isLoading = false,
  hasUnsavedChanges = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={hasUnsavedChanges ? "warning" : "info"}
      title={title}
      description={description}
      confirmText="Guardar"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
