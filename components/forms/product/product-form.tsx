/* eslint-disable tailwindcss/enforces-shorthand */
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, Save, X } from 'lucide-react';

import { ProductFormFields } from './product-form-fields';
import { ProductImageUpload } from './product-image-upload';
import { useProductFormView, type UseProductFormViewProps } from '@/hooks/views/use-product-form-view';

// ===== TYPES =====

export interface ProductFormProps extends UseProductFormViewProps {
  className?: string;
}

// ===== COMPONENT =====

export function ProductForm({
  organizationId,
  product,
  onSuccess,
  onCancel,
  className,
}: ProductFormProps) {
  const {
    form,
    isSubmitting,
    isValid,
    categories,
    isLoadingCategories,
    selectedImages,
    imagePreviewUrls,
    isUploadingImages,
    handleSubmit,
    handleImageSelect,
    handleImageRemove,
    handleCancel,
    messages,
    getFieldError,
    hasFieldError,
  } = useProductFormView({
    organizationId,
    product,
    onSuccess,
    onCancel,
  });

  const isEditing = !!product;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? 'Editar Producto' : 'Crear Producto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductFormFields
                categories={categories}
                isLoadingCategories={isLoadingCategories}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes del Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUpload
                selectedImages={selectedImages}
                imagePreviewUrls={imagePreviewUrls}
                isUploading={isUploadingImages}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                existingImages={product?.images || []}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Actualizar' : 'Crear'} Producto
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </form>
    </Form>
  );
}
