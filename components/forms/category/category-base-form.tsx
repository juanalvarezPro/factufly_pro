import { UseFormReturn } from "react-hook-form";
import { MyForm, NameField, DescriptionField, UploadImageField, LoadOptionsField, ToggleField } from "../ui";

interface CategoryBaseFormProps {
  organizationId: string;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  router: any;
  itemName: any;
  path: string;
  label: string;
  cta: string;
  options: any;
  isLoading: boolean;
}
export function CategoryBaseForm({
  organizationId,
  form,
  onSubmit,
  router,
  itemName,
  path,
  label,
  cta,
  options,
  isLoading,
}: CategoryBaseFormProps) {
  return (
    <MyForm 
      itemName={itemName}
      label={label}
      form={form}
      onSubmit={onSubmit}
      router={router}
      path={path}
      cta={cta}
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
        options={options}
        isLoading={isLoading}
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