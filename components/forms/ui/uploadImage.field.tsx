"use client";
import { FormControl, FormDescription, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import { UseFormReturn } from "react-hook-form";

interface UploadImageFieldProps {
    form: UseFormReturn<any>;
    organizationId: string;
    label: string;
    description: string;
    entityType: "product" | "combo" | "packaging" | "organization";
}

export function UploadImageField({ form, organizationId, label, entityType }: UploadImageFieldProps) {
    // Get the category name from the form to use as custom filename
    const categoryName = form.watch("name");
    const isDisabled = !categoryName || categoryName.trim().length === 0;
    
    return (
        <FormField
          control={form.control}
          name="imagenAlt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <ImageUploader
                  organizationId={organizationId}
                  entityType={entityType}
                  maxFiles={1}
                  maxSize={5}
                  disabled={isDisabled}
                  customFileName={categoryName ? categoryName : undefined}
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => {
                    const url = urls[0] || "";
                    field.onChange(url);
                  }}
                  onUploadComplete={(urls) => {
                    const url = urls[0] || "";
                    field.onChange(url);
                  }}
                  onError={(error) => {
                    console.error("Error uploading image:", error);
                  }}
                />
              </FormControl>
              <FormDescription>
                {isDisabled 
                  ? "Primero escribe el nombre de la categoría para poder subir una imagen"
                  : "Sube una imagen para la categoría (máximo 5MB)"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
    )
}