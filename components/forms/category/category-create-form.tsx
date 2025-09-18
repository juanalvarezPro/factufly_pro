"use client";

import { useCreateCategoryView } from "@/hooks/views/forms/use-create-category";

import {
  DescriptionField,
  LoadOptionsField,
  NameField,
  ToggleField,
  UploadImageField,
  MyForm,
} from "../ui";

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
    <MyForm
      itemName={createCategory}
      label="categoría"
      form={form}
      onSubmit={onSubmit}
      router={router}
      path="/dashboard/categories"
      
    >
      <NameField
        form={form}
        placeholder="Ej: Electrónicos, Ropa, Alimentos..."
        description="Nombre descriptivo para la categoría de productos"
      />

      <DescriptionField
        form={form}
        placeholder="Describe brevemente esta categoría..."
        description="Descripción opcional para explicar qué productos incluye esta categoría."
      />

      <UploadImageField
        form={form}
        organizationId={organizationId}
        label="Imagen de la categoría"
        entityType="product"
        description="Sube una imagen para la categoría (máximo 5MB). El archivo se guarda en R2 Cloudflare."
      />
      <LoadOptionsField
        form={form}
        name="summaryCardId"
        label="Tarjeta Resumen"
        description="Tarjeta resumen asociada a esta categoría para métricas y estadísticas."
        noneLabel="Sin tarjeta resumen"
        options={summaryCardOptions}
        isLoading={loadingSummaryCards}
      />

      <ToggleField
        form={form}
        field={form.watch("active")}
        name="active"
        label="Estado"
        description="Las categorías activas aparecerán disponibles para asignar a productos."
      />

      <ToggleField
        form={form}
        field={form.watch("isCombo")}
        name="isCombo"
        label="Es una categoría de combo"
        description="Marca esta opción si esta categoría será utilizada para productos combo."
      />
    </MyForm>
  );
}
