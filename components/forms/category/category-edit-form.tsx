"use client";

import { useEditCategoryView } from "@/hooks/views/forms/use-edit-category";
import { CategoryBaseForm } from "./category-base-form";

interface CategoryEditFormProps {
  organizationId: string;
  categoryId: string;
}

export function CategoryEditForm({
  organizationId,
  categoryId,
}: CategoryEditFormProps) {
  const {
    router,
    updateCategory,
    form,
    onSubmit,
    category,
    isLoading,
    summaryCardOptions,
    loadingSummaryCards,
  } = useEditCategoryView(organizationId, categoryId);

  // Show loading state while category data is being fetched
  if (isLoading && !category) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando categoría...</p>
        </div>
      </div>
    );
  }

  // Show error state if category not found
  if (!category) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive">Categoría no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <CategoryBaseForm
      organizationId={organizationId}
      form={form}
      onSubmit={onSubmit}
      router={router}
      itemName={updateCategory}
      path="/dashboard/categories"
      label="categoría"
      cta="Editar"
      options={summaryCardOptions}
      isLoading={loadingSummaryCards}
    />
  );
}
