"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  ProductComboWithRelations,
  ProductComboCategory,
  Packaging,
  ProductWithRelations,
  PaginatedResult,
  ComboInventory,
} from "@/types/database";

import type {
  ComboListQueryInput,
  CreateProductComboInput,
  UpdateProductComboInput,
  ComboWithProductsInput,
} from "@/lib/validations/combo";

interface UseCombosOptions {
  organizationId: string;
  initialQuery?: Partial<ComboListQueryInput>;
}

export function useCombos({ organizationId, initialQuery }: UseCombosOptions) {
  const queryClient = useQueryClient();
  
  const [query, setQuery] = useState<ComboListQueryInput>({
    organizationId,
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialQuery,
  });

  // Fetch combos
  const {
    data: combos,
    isLoading: isLoadingCombos,
    error: combosError,
    refetch: refetchCombos,
  } = useQuery({
    queryKey: ["combos", organizationId, query],
    queryFn: async (): Promise<PaginatedResult<ProductComboWithRelations>> => {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `/api/organizations/${organizationId}/combos?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Error al cargar combos");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch combo categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ["combo-categories", organizationId],
    queryFn: async (): Promise<ProductComboCategory[]> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/categories`
      );

      if (!response.ok) {
        throw new Error("Error al cargar categorías de combos");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch packagings
  const {
    data: packagings,
    isLoading: isLoadingPackagings,
  } = useQuery({
    queryKey: ["packagings", organizationId],
    queryFn: async (): Promise<Packaging[]> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/packagings`
      );

      if (!response.ok) {
        throw new Error("Error al cargar empaques");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create combo mutation
  const createComboMutation = useMutation({
    mutationFn: async (data: ComboWithProductsInput): Promise<ProductComboWithRelations> => {
      const response = await fetch(`/api/organizations/${organizationId}/combos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al crear combo");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["combos", organizationId] });
      toast.success("Combo creado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear combo");
    },
  });

  // Update combo mutation
  const updateComboMutation = useMutation({
    mutationFn: async ({ 
      comboId, 
      data 
    }: { 
      comboId: string; 
      data: UpdateProductComboInput 
    }): Promise<ProductComboWithRelations> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/${comboId}`,
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
        throw new Error(error.error?.message || "Error al actualizar combo");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["combos", organizationId] });
      queryClient.setQueryData(
        ["combo", organizationId, data.id],
        data
      );
      toast.success("Combo actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar combo");
    },
  });

  // Delete combo mutation
  const deleteComboMutation = useMutation({
    mutationFn: async (comboId: string): Promise<void> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/${comboId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al eliminar combo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos", organizationId] });
      toast.success("Combo eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar combo");
    },
  });

  // Restore combo mutation
  const restoreComboMutation = useMutation({
    mutationFn: async (comboId: string): Promise<void> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/${comboId}/restore`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al restaurar combo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos", organizationId] });
      toast.success("Combo restaurado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al restaurar combo");
    },
  });

  // Check combo inventory
  const checkInventoryMutation = useMutation({
    mutationFn: async ({ 
      comboId, 
      quantity = 1 
    }: { 
      comboId: string; 
      quantity?: number 
    }): Promise<ComboInventory> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/${comboId}/inventory?quantity=${quantity}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al verificar inventario");
      }

      const result = await response.json();
      return result.data;
    },
  });

  // Search combos
  const searchCombos = useCallback(async (searchQuery: string): Promise<ProductComboWithRelations[]> => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/search?q=${encodeURIComponent(searchQuery)}`
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

  // Search products for combo creation
  const searchProducts = useCallback(async (searchQuery: string): Promise<ProductWithRelations[]> => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/products/search?q=${encodeURIComponent(searchQuery)}&active=true`
      );

      if (!response.ok) {
        throw new Error("Error en la búsqueda de productos");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Product search error:", error);
      return [];
    }
  }, [organizationId]);

  // Update query filters
  const updateQuery = useCallback((updates: Partial<ComboListQueryInput>) => {
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }));
  }, []);

  // Pagination helpers
  const goToPage = useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if (combos?.pagination.hasNext) {
      goToPage(combos.pagination.page + 1);
    }
  }, [combos?.pagination, goToPage]);

  const prevPage = useCallback(() => {
    if (combos?.pagination.hasPrev) {
      goToPage(combos.pagination.page - 1);
    }
  }, [combos?.pagination, goToPage]);

  return {
    // Data
    combos,
    categories,
    packagings,
    query,

    // Loading states
    isLoading: isLoadingCombos || isLoadingCategories || isLoadingPackagings,
    isLoadingCombos,
    isLoadingCategories,
    isLoadingPackagings,
    isCreating: createComboMutation.isPending,
    isUpdating: updateComboMutation.isPending,
    isDeleting: deleteComboMutation.isPending,
    isRestoring: restoreComboMutation.isPending,
    isCheckingInventory: checkInventoryMutation.isPending,

    // Error states
    error: combosError,

    // Actions
    createCombo: createComboMutation.mutate,
    updateCombo: updateComboMutation.mutate,
    deleteCombo: deleteComboMutation.mutate,
    restoreCombo: restoreComboMutation.mutate,
    checkInventory: checkInventoryMutation.mutate,
    searchCombos,
    searchProducts,
    refetchCombos,

    // Query management
    updateQuery,
    setQuery,

    // Pagination
    goToPage,
    nextPage,
    prevPage,

    // Inventory data
    inventoryData: checkInventoryMutation.data,
  };
}

// Hook for single combo
export function useCombo(organizationId: string, comboId: string) {
  const queryClient = useQueryClient();

  const {
    data: combo,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["combo", organizationId, comboId],
    queryFn: async (): Promise<ProductComboWithRelations> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/combos/${comboId}`
      );

      if (!response.ok) {
        throw new Error("Error al cargar combo");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!comboId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    combo,
    isLoading,
    error,
    refetch,
  };
}

// Hook for public combo lookup (SEO-friendly URLs)
export function usePublicCombo(organizationSlug: string, comboSlug: string) {
  const {
    data: combo,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["public-combo", organizationSlug, comboSlug],
    queryFn: async (): Promise<ProductComboWithRelations> => {
      const response = await fetch(
        `/api/public/combos/${organizationSlug}/${comboSlug}`
      );

      if (!response.ok) {
        throw new Error("Combo no encontrado");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!organizationSlug && !!comboSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes (longer for public content)
  });

  return {
    combo,
    isLoading,
    error,
    refetch,
  };
}
