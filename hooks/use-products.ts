"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  ProductWithRelations,
  ProductCategory,
  ProductCard,
  PaginatedResult,
} from "@/types/database";

import type {
  ProductListQueryInput,
  CreateProductInput,
  UpdateProductInput,
} from "@/lib/validations/product";

interface UseProductsOptions {
  organizationId: string;
  initialQuery?: Partial<ProductListQueryInput>;
}

export function useProducts({ organizationId, initialQuery }: UseProductsOptions) {
  const queryClient = useQueryClient();
  
  const [query, setQuery] = useState<ProductListQueryInput>({
    organizationId,
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialQuery,
  });

  // Fetch products
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", organizationId, query],
    queryFn: async (): Promise<PaginatedResult<ProductWithRelations>> => {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `/api/organizations/${organizationId}/products?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ["product-categories", organizationId],
    queryFn: async (): Promise<ProductCategory[]> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/categories`
      );

      if (!response.ok) {
        throw new Error("Error al cargar categorías");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch cards
  const {
    data: cards,
    isLoading: isLoadingCards,
  } = useQuery({
    queryKey: ["product-cards", organizationId],
    queryFn: async (): Promise<ProductCard[]> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/cards`
      );

      if (!response.ok) {
        throw new Error("Error al cargar tarjetas");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductInput): Promise<ProductWithRelations> => {
      const response = await fetch(`/api/organizations/${organizationId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al crear producto");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", organizationId] });
      toast.success("Producto creado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear producto");
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ 
      productId, 
      data 
    }: { 
      productId: string; 
      data: UpdateProductInput 
    }): Promise<ProductWithRelations> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al actualizar producto");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", organizationId] });
      queryClient.setQueryData(
        ["product", organizationId, data.id],
        data
      );
      toast.success("Producto actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar producto");
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al eliminar producto");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", organizationId] });
      toast.success("Producto eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar producto");
    },
  });

  // Restore product mutation
  const restoreProductMutation = useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/${productId}/restore`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al restaurar producto");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", organizationId] });
      toast.success("Producto restaurado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al restaurar producto");
    },
  });

  // Search products
  const searchProducts = useCallback(async (searchQuery: string): Promise<ProductWithRelations[]> => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Error en la búsqueda");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }, [organizationId]);

  // Update query filters
  const updateQuery = useCallback((updates: Partial<ProductListQueryInput>) => {
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }));
  }, []);

  // Pagination helpers
  const goToPage = useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if (products?.pagination.hasNext) {
      goToPage(products.pagination.page + 1);
    }
  }, [products?.pagination, goToPage]);

  const prevPage = useCallback(() => {
    if (products?.pagination.hasPrev) {
      goToPage(products.pagination.page - 1);
    }
  }, [products?.pagination, goToPage]);

  return {
    // Data
    products,
    categories,
    cards,
    query,

    // Loading states
    isLoading: isLoadingProducts || isLoadingCategories || isLoadingCards,
    isLoadingProducts,
    isLoadingCategories,
    isLoadingCards,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
    isRestoring: restoreProductMutation.isPending,

    // Error states
    error: productsError,

    // Actions
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    restoreProduct: restoreProductMutation.mutate,
    searchProducts,
    refetchProducts,

    // Query management
    updateQuery,
    setQuery,

    // Pagination
    goToPage,
    nextPage,
    prevPage,
  };
}

// Hook for single product
export function useProduct(organizationId: string, productId: string) {
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", organizationId, productId],
    queryFn: async (): Promise<ProductWithRelations> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/${productId}`
      );

      if (!response.ok) {
        throw new Error("Error al cargar producto");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    product,
    isLoading,
    error,
    refetch,
  };
}

// ===== CREATE PRODUCT HOOK =====

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateProductInput): Promise<ProductWithRelations> => {
      const response = await fetch(`/api/organizations/${input.organizationId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el producto");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate products queries
      queryClient.invalidateQueries({ queryKey: ["products", variables.organizationId] });
      
      toast.success("Producto creado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating product:", error);
      toast.error(error.message || "Error al crear el producto");
    },
  });
}

// ===== UPDATE PRODUCT HOOK =====

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      productId, 
      organizationId, 
      data 
    }: { 
      productId: string; 
      organizationId: string; 
      data: UpdateProductInput; 
    }): Promise<ProductWithRelations> => {
      const response = await fetch(`/api/organizations/${organizationId}/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el producto");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update specific product in cache
      queryClient.setQueryData(
        ["product", variables.organizationId, variables.productId], 
        data
      );
      
      // Invalidate products queries
      queryClient.invalidateQueries({ queryKey: ["products", variables.organizationId] });
      
      toast.success("Producto actualizado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error updating product:", error);
      toast.error(error.message || "Error al actualizar el producto");
    },
  });
}
