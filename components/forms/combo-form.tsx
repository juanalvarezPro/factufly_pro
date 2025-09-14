"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Loader2, Plus, Trash2, Search, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { comboWithProductsSchema, type ComboWithProductsInput } from "@/lib/validations/combo";
import type { 
  ProductComboCategory, 
  Packaging, 
  ProductWithRelations,
  PaginatedResult 
} from "@/types/database";

interface ComboFormProps {
  organizationId: string;
  categories?: ProductComboCategory[];
  packagings?: Packaging[];
  products?: ProductWithRelations[];
  initialData?: Partial<ComboWithProductsInput>;
  onSubmit: (data: ComboWithProductsInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  onSearchProducts?: (search: string) => Promise<ProductWithRelations[]>;
}

export function ComboForm({
  organizationId,
  categories = [],
  packagings = [],
  products = [],
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  onSearchProducts,
}: ComboFormProps) {
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductWithRelations[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  const form = useForm<ComboWithProductsInput>({
    resolver: zodResolver(comboWithProductsSchema),
    defaultValues: {
      organizationId,
      comboName: initialData?.comboName || "",
      description: initialData?.description || "",
      imageAlt: initialData?.imageAlt || "",
      abbreviation: initialData?.abbreviation || "",
      packagingId: initialData?.packagingId || "",
      price: initialData?.price || 0,
      active: initialData?.active ?? true,
      modalQuick: initialData?.modalQuick ?? false,
      categoryId: initialData?.categoryId || "",
      slug: initialData?.slug || "",
      metaDescription: initialData?.metaDescription || "",
      tags: initialData?.tags || "",
      products: initialData?.products || [],
      allowedCategories: initialData?.allowedCategories || [],
      excludedProducts: initialData?.excludedProducts || [],
    },
  });

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const handleSubmit = async (data: ComboWithProductsInput) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error submitting combo form:", error);
    }
  };

  const handleProductSearch = async () => {
    if (!onSearchProducts || !productSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await onSearchProducts(productSearch);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProduct = (product: ProductWithRelations) => {
    // Check if product is already added
    const isAlreadyAdded = productFields.some(field => field.productId === product.id);
    if (isAlreadyAdded) return;

    appendProduct({
      productId: product.id,
      quantity: 1,
    });
    setShowProductSelector(false);
  };

  const calculateTotalPrice = () => {
    const productsTotal = productFields.reduce((total, field) => {
      const product = products.find(p => p.id === field.productId);
      return total + (product ? Number(product.price) * field.quantity : 0);
    }, 0);
    
    const packaging = packagings.find(p => p.id === form.watch("packagingId"));
    const packagingCost = packaging ? Number(packaging.price) : 0;
    
    return productsTotal + packagingCost;
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {initialData ? "Editar Combo" : "Crear Nuevo Combo"}
        </CardTitle>
        <CardDescription>
          {initialData 
            ? "Actualiza la información del combo de productos" 
            : "Configura un nuevo combo con múltiples productos"
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
                name="comboName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Combo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Combo Familiar Completo"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre descriptivo del combo que verán los clientes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción detallada del combo..."
                        className="h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe qué incluye el combo y sus beneficios
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="abbreviation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abreviación</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="CFC"
                          className="uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Código único del combo
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
                      <FormLabel>Precio Final</FormLabel>
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
                        Precio especial del combo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="combo-familiar-completo"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL amigable para SEO
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Categorización y Empaque */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Categorización y Empaque</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría de Combo</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packagingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Empaque</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un empaque" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {packagings.map((packaging) => (
                            <SelectItem key={packaging.id} value={packaging.id}>
                              <div className="flex items-center gap-2">
                                <span>{packaging.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  (+€{Number(packaging.price).toFixed(2)})
                                </span>
                                {!packaging.active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactivo
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Productos del Combo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Productos del Combo</h3>
                <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 size-4" />
                      Agregar Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Seleccionar Productos</DialogTitle>
                      <DialogDescription>
                        Busca y selecciona productos para agregar al combo
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Buscar productos..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                          />
                        </div>
                        <Button onClick={handleProductSearch} disabled={isSearching}>
                          {isSearching ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Search className="size-4" />
                          )}
                        </Button>
                      </div>

                      <ScrollArea className="h-64">
                        {searchResults.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="w-12"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {searchResults.map((product) => {
                                const isAdded = productFields.some(field => field.productId === product.id);
                                return (
                                  <TableRow key={product.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {product.abbreviation}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {product.category?.name}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      €{Number(product.price).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant={isAdded ? "secondary" : "default"}
                                        onClick={() => handleAddProduct(product)}
                                        disabled={isAdded}
                                      >
                                        {isAdded ? "Agregado" : "Agregar"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <Package className="mx-auto mb-2 size-8" />    
                            <p>No se encontraron productos</p>
                            <p className="text-sm">Utiliza la búsqueda para encontrar productos</p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {productFields.length > 0 ? (
                <Card>
                  <CardContent className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="w-24">Cantidad</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productFields.map((field, index) => {
                          const product = products.find(p => p.id === field.productId);
                          const subtotal = product ? Number(product.price) * field.quantity : 0;
                          
                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                {product ? (
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {product.abbreviation}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Producto no encontrado</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                €{product ? Number(product.price).toFixed(2) : "0.00"}
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`products.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          className="w-20"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                €{subtotal.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProduct(index)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span>Total de productos:</span>
                        <span>€{calculateTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Precio del combo:</span>
                        <span>€{form.watch("price")?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Ahorro:</span>
                        <span className="text-green-600">
                          €{Math.max(0, calculateTotalPrice() - (form.watch("price") || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 h-8 w-8" />
                    <p>No hay productos agregados al combo</p>
                    <p className="text-sm">Agrega al menos un producto para crear el combo</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* SEO y Marketing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SEO y Marketing</h3>
              
              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Meta (SEO)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción para motores de búsqueda..."
                        className="resize-none"
                        maxLength={160}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Máximo 160 caracteres. Se muestra en resultados de búsqueda.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiquetas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="familiar, promoción, descuento, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Etiquetas separadas por comas para categorización y búsqueda
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Configuración */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Combo Activo
                        </FormLabel>
                        <FormDescription>
                          Los combos activos aparecen en el catálogo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modalQuick"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Acceso Rápido
                        </FormLabel>
                        <FormDescription>
                          Mostrar en modal de acceso rápido
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
              <Button type="submit" disabled={isLoading || productFields.length === 0}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {initialData ? "Actualizar" : "Crear"} Combo
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
