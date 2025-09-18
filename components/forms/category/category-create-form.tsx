"use client";

import { useCreateCategoryView } from "@/hooks/views/forms/use-create-category";
import { CategoryBaseForm } from "./category-base-form";

interface CategoryCreateFormProps {
  organizationId: string;
}

export function CategoryCreateForm({
  organizationId,
}: CategoryCreateFormProps) {
  const {
    router,
    createCategory,
    form,
    onSubmit,
    summaryCardOptions,
    loadingSummaryCards,
  } = useCreateCategoryView(organizationId);

  return (
    <CategoryBaseForm
      organizationId={organizationId}
      form={form}
      onSubmit={onSubmit}
      router={router}
      itemName={createCategory}
      path="/dashboard/categories"
      label="categoría"
      cta="Crear"
      options={summaryCardOptions}
      isLoading={loadingSummaryCards}
    />
  );
}
