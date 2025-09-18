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
                  returnKey={true}
                  value={field.value ? [field.value] : []}
                  onChange={(keys) => {
                    const key = keys[0] || "";
                    field.onChange(key);
                  }}
                  onUploadComplete={(keys) => {
                    const key = keys[0] || "";
                    field.onChange(key);
                  }}
                  onError={(error) => {
                    console.error("Error uploading image:", error);
                  }}
                />
              </FormControl>
              <FormDescription>
                Sube una imagen para la categoría (máximo 5MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
    )
}