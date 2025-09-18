"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductCategoryWithRelations } from "@/types/database";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";

interface UseTableCategoryViewProps {
  organizationId: string;
}

interface UseTableCategoryViewReturn {
  columns: ColumnDef<ProductCategoryWithRelations>[];
  categories: ProductCategoryWithRelations[];
  isLoading: boolean;
  error: Error | null;
  handleDelete: (category: ProductCategoryWithRelations) => Promise<void>;
}

export function useTableCategoryView({ organizationId }: UseTableCategoryViewProps): UseTableCategoryViewReturn {
  const columns: ColumnDef<ProductCategoryWithRelations>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nombre
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "active",
      header: "Estado",
      cell: ({ row }) => {
        const isActive = row.getValue("active") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isCombo",
      header: "Tipo",
      cell: ({ row }) => {
        const isCombo = row.getValue("isCombo") as boolean;
        return (
          <Badge variant={isCombo ? "outline" : "secondary"}>
            {isCombo ? "Combo" : "Regular"}
          </Badge>
        );
      },
    },
  ];
  const { data: categories = [], isLoading, error } = useCategories(organizationId);
  const deleteCategory = useDeleteCategory();

  const handleDelete = async (category: ProductCategoryWithRelations) => {
    await deleteCategory.mutateAsync({
      categoryId: category.id,
      organizationId: category.organizationId,
    });
  };
  return {
    columns: columns,
    categories: categories,
    isLoading: isLoading,
    error: error,
    handleDelete: handleDelete,
  };
}