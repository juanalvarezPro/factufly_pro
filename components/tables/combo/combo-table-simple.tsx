"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComboTableProps {
  organizationId: string;
  onEdit?: (combo: any) => void;
  onView?: (combo: any) => void;
  onDelete?: (combo: any) => void;
}

export function ComboTable({
  organizationId,
  onEdit,
  onView,
  onDelete,
}: ComboTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabla de Combos</CardTitle>
        <CardDescription>Gestión de combos de productos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-12 text-center text-muted-foreground">
          <div className="mb-2 text-lg font-medium">Tabla de Combos</div>
          <p>La tabla de combos se implementará aquí</p>
          <p className="mt-4 text-sm">Organization ID: {organizationId}</p>
        </div>
      </CardContent>
    </Card>
  );
}
