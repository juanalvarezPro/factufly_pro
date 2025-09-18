"use client";
import { DataTable } from "@/components/tables/data-table";
import { useTableCategoryView } from "@/hooks/views/tables/use-table-category.view";


interface CategoryTableProps {
  organizationId: string;
}

export function CategoryTable({ organizationId }: CategoryTableProps) {
const { columns, categories, isLoading, error, handleDelete } = useTableCategoryView({ organizationId });

  return (
    <DataTable
      columns={columns}
      data={categories}
      searchKey="name"
      searchPlaceholder="Buscar categorías..."
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      editPath="/dashboard/categories/edit"
      createPath="/dashboard/categories/create"
      createLabel="Nueva Categoría"
      title="Categorías"
      description={`Gestiona las categorías de productos de tu organización`}
      noResultsText="No se encontraron categorías."
    />
  );
}