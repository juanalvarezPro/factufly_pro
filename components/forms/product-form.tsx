"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { createProductSchema, type CreateProductInput } from "@/lib/validations/product";
import type { ProductCategory, ProductCard } from "@/types/database";

interface ProductFormProps {
  organizationId: string;
  categories?: ProductCategory[];
  cards?: ProductCard[];
  initialData?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  organizationId,
  categories = [],
  cards = [],
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      organizationId,
      name: initialData?.name || "",
      imageAlt: initialData?.imageAlt || "",
      abbreviation: initialData?.abbreviation || "",
      price: initialData?.price || 0,
      categoryId: initialData?.categoryId || "",
      cardId: initialData?.cardId || "",
      status: "active",
      isVisible: true,
      isFeatured: false,
      tags: [],
      images: [],
      uuid: initialData?.uuid,
    },
  });

  const handleSubmit = async (data: CreateProductInput) => {
    try {
      await onSubmit(data);
      form.reset();
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting product form:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {initialData ? "Editar Producto" : "Crear Nuevo Producto"}
        </CardTitle>
        <CardDescription>
          {initialData 
            ? "Actualiza la información del producto" 
            : "Completa los datos del nuevo producto"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Pizza Margherita Grande"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre descriptivo del producto que verán los clientes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="abbreviation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abreviación</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="PMG"
                          className="uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Código único de 2-10 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio</FormLabel>
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
                      <FormDescription>
                        Precio en la moneda local
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de Imagen</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción de la imagen para accesibilidad..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Texto alternativo para la imagen del producto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Categorización */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Categorización</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <span>{category.name}</span>
                                {!category.active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactiva
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categoría principal del producto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarjeta de Producto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tarjeta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              <div className="flex items-center gap-2">
                                <span>{card.cardName}</span>
                                {!card.active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactiva
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Diseño de presentación del producto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Imagen del Producto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Imagen del Producto</h3>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="product-image">Subir Imagen</Label>
                  <div className="mt-2">
                    <Input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
                    />
                  </div>
                </div>
                
                {imagePreview && (
                  <div className="shrink-0"> 
                    <Image
                      src={imagePreview}
                      alt="Vista previa"
                      className="size-20 rounded-md border object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Configuración */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración</h3>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del Producto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                        <SelectItem value="discontinued">Descontinuado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Los productos activos aparecen en el catálogo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end space-x-2 pt-6">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {initialData ? "Actualizar" : "Crear"} Producto
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
