"use client";

import { useCategories } from "@/hooks/use-categories";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryTableProps {
  organizationId: string;
}

export function CategoryTable({ organizationId }: CategoryTableProps) {
  const { data: categories, isLoading, error } = useCategories(organizationId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="py-12 text-center text-muted-foreground">
            <div className="mb-2 text-lg font-medium">Cargando categorías...</div>
            <div className="mt-4">
                <div className="h-4 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="py-12 text-center text-muted-foreground">
            <div className="mb-2 text-lg font-medium text-red-600">Error al cargar categorías</div>
            <p className="text-sm">{error.message}</p>
            <p className="mt-2 text-xs">Organization ID: {organizationId}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="py-12 text-center text-muted-foreground">
            <div className="mb-2 text-lg font-medium">No hay categorías</div>
            <p>Aún no has creado ninguna categoría.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="py-12 text-center text-muted-foreground">
          <div className="mb-2 text-lg font-medium">Categorías encontradas: {categories.length}</div>
          <div className="mt-4 text-left">
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
              {JSON.stringify(categories, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}