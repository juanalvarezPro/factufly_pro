"use client";

import { useState } from "react";
import { Plus, Package, Search, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { ProductForm } from "@/components/forms/product-form";
import { ProductTable } from "@/components/tables/product-table";
import { DeleteConfirmDialog, RestoreConfirmDialog } from "@/components/ui/confirm-dialog";

import { useProducts } from "@/hooks/use-products";
import type { ProductWithRelations } from "@/types/database";
import type { CreateProductInput } from "@/lib/validations/product";

// Mock organization ID - in real app, get from context/auth
const ORGANIZATION_ID = "org_mock_123";

export default function ProductsAdminPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    product?: ProductWithRelations;
  }>({ isOpen: false });
  const [restoreConfirm, setRestoreConfirm] = useState<{
    isOpen: boolean;
    product?: ProductWithRelations;
  }>({ isOpen: false });

  const {
    products,
    categories,
    cards,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isRestoring,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    updateQuery,
    searchProducts,
  } = useProducts({
    organizationId: ORGANIZATION_ID,
    initialQuery: {
      page: 1,
      limit: 20,
    },
  });

  const handleCreateProduct = async (data: CreateProductInput) => {
    createProduct(data, {
      onSuccess: () => {
        setShowCreateForm(false);
      },
    });
  };

  const handleUpdateProduct = async (data: CreateProductInput) => {
    if (!editingProduct) return;
    
    updateProduct(
      { productId: editingProduct.id, data },
      {
        onSuccess: () => {
          setEditingProduct(null);
        },
      }
    );
  };

  const handleDeleteProduct = (product: ProductWithRelations) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.product) {
      deleteProduct(deleteConfirm.product.id, {
        onSuccess: () => {
          setDeleteConfirm({ isOpen: false });
        },
      });
    }
  };

  const handleRestoreProduct = (product: ProductWithRelations) => {
    setRestoreConfirm({ isOpen: true, product });
  };

  const handleRestoreConfirm = () => {
    if (restoreConfirm.product) {
      restoreProduct(restoreConfirm.product.id, {
        onSuccess: () => {
          setRestoreConfirm({ isOpen: false });
        },
      });
    }
  };

  const getStatsCards = () => {
    const totalProducts = products?.pagination.total || 0;
    const activeProducts = products?.items.filter(p => p.status === 'active' && !p.deletedAt).length || 0;
    const inactiveProducts = products?.items.filter(p => p.status !== 'active' && !p.deletedAt).length || 0;
    const deletedProducts = products?.items.filter(p => p.deletedAt).length || 0;

    return [
      {
        title: "Total Productos",
        value: totalProducts,
        description: "Productos en el sistema",
        icon: Package,
      },
      {
        title: "Productos Activos",
        value: activeProducts,
        description: "Disponibles en el catálogo",
        icon: Package,
        className: "text-green-600",
      },
      {
        title: "Productos Inactivos",
        value: inactiveProducts,
        description: "No disponibles",
        icon: Package,
        className: "text-amber-600",
      },
      {
        title: "Productos Eliminados",
        value: deletedProducts,
        description: "En papelera",
        icon: Package,
        className: "text-red-600",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">
            Administra el catálogo de productos de tu organización
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold ${stat.className || ""}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.className || "text-muted-foreground"}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active">Productos Activos</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos</TabsTrigger>
            <TabsTrigger value="deleted">Eliminados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-8 w-64"
                onChange={(e) => {
                  updateQuery({ search: e.target.value });
                }}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        <TabsContent value="active" className="space-y-4">
          <ProductTable
            organizationId={ORGANIZATION_ID}
            data={products}
            categories={categories}
            isLoading={isLoading}
            onSearch={updateQuery}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
            onCreateNew={() => setShowCreateForm(true)}
          />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <ProductTable
            organizationId={ORGANIZATION_ID}
            data={products}
            categories={categories}
            isLoading={isLoading}
            onSearch={(query) => updateQuery({ ...query, status: ["inactive", "archived", "discontinued"] })}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
          />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          <ProductTable
            organizationId={ORGANIZATION_ID}
            data={products}
            categories={categories}
            isLoading={isLoading}
            onSearch={updateQuery}
            onRestore={handleRestoreProduct}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <ProductTable
            organizationId={ORGANIZATION_ID}
            data={products}
            categories={categories}
            isLoading={isLoading}
            onSearch={updateQuery}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
            onRestore={handleRestoreProduct}
          />
        </TabsContent>
      </Tabs>

      {/* Create Product Sheet */}
      <Sheet open={showCreateForm} onOpenChange={setShowCreateForm}>
        <SheetContent side="right" className="min-w-[600px] max-w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Crear Nuevo Producto</SheetTitle>
            <SheetDescription>
              Completa la información para crear un nuevo producto en el catálogo
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProductForm
              organizationId={ORGANIZATION_ID}
              categories={categories}
              cards={cards}
              onSubmit={handleCreateProduct}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Product Sheet */}
      <Sheet open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <SheetContent side="right" className="min-w-[600px] max-w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Producto</SheetTitle>
            <SheetDescription>
              Actualiza la información del producto seleccionado
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {editingProduct && (
              <ProductForm
                organizationId={ORGANIZATION_ID}
                categories={categories}
                cards={cards}
                initialData={{
                  name: editingProduct.name,
                  imageAlt: editingProduct.imageAlt,
                  abbreviation: editingProduct.abbreviation,
                  price: Number(editingProduct.price),
                  categoryId: editingProduct.categoryId,
                  cardId: editingProduct.cardId,
                  organizationId: editingProduct.organizationId,
                }}
                onSubmit={handleUpdateProduct}
                onCancel={() => setEditingProduct(null)}
                isLoading={isUpdating}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false })}
        itemName={deleteConfirm.product?.name || ""}
        itemType="producto"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        canRestore={true}
      />

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmDialog
        open={restoreConfirm.isOpen}
        onOpenChange={(open) => !open && setRestoreConfirm({ isOpen: false })}
        itemName={restoreConfirm.product?.name || ""}
        itemType="producto"
        onConfirm={handleRestoreConfirm}
        isLoading={isRestoring}
      />
    </div>
  );
}
