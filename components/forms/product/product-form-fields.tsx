"use client";

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductFormData } from '@/hooks/views/use-product-form-view';

// ===== TYPES =====

interface ProductFormFieldsProps {
  categories: any[];
  isLoadingCategories: boolean;
}

// ===== COMPONENT =====

export function ProductFormFields({
  categories,
  isLoadingCategories,
}: ProductFormFieldsProps) {
  return (
    <div className="grid gap-6">
      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del producto..."
                  {...field}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          
          name="abbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abreviación</FormLabel>
              <FormControl>
                <Input
                  placeholder="ABC"
                  {...field}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description */}
      <FormField
        
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descripción del producto..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pricing */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio de Venta</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          
          name="costPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio de Costo</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* SKU and Barcode */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input
                  placeholder="SKU-001"
                  {...field}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Barras</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456789012"
                  {...field}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Category and Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger >
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingCategories ? (
                    <div className="p-2">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          
          name="cardId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarjeta del Producto</FormLabel>
              <FormControl>
                <Input
                  placeholder="ID de la tarjeta"
                  {...field}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Status and Tags */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger >
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="archived">Archivado</SelectItem>
                  <SelectItem value="discontinued">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etiquetas</FormLabel>
              <FormControl>
                <Input
                  placeholder="etiqueta1, etiqueta2, etiqueta3"
                  {...field}
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Image Alt Text */}
      <FormField
        
        name="imageAlt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Texto Alternativo</FormLabel>
            <FormControl>
              <Input
                placeholder="Texto alternativo para las imágenes"
                {...field}
                
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Boolean Fields */}
      <div className="grid gap-6 md:grid-cols-3">
        <FormField
          
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visible en Tienda</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Visible en catálogo público
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Producto Destacado</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Destacar en página principal
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
