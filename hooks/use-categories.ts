"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  ProductCategoryWithRelations,
  PaginatedResult,
} from "@/types/database";

// ===== TYPES =====

export interface CreateCategoryInput {
  organizationId: string;
  name: string;
  description?: string;
  parentId?: string;
  status?: "active" | "inactive";
  visible?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
  status?: "active" | "inactive";
  visible?: boolean;
  sortOrder?: number;
}

export interface CategoryListQueryInput {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive" | "all";
  parentId?: string;
  sortBy?: "name" | "createdAt" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

interface UseCategoriesOptions {
  organizationId: string;
  initialQuery?: Partial<CategoryListQueryInput>;
}

// ===== MAIN HOOK =====

export function useCategories(organizationId: string) {
  return useQuery({
    queryKey: ["categories", organizationId],
    queryFn: async (): Promise<ProductCategoryWithRelations[]> => {
      const response = await fetch(`/api/organizations/${organizationId}/categories`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(`Error ${response.status}: ${errorData.error?.message || errorData.error || "Error al cargar las categorías"}`);
      }
      
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===== CATEGORIES LIST HOOK =====

function useCategoriesList({ organizationId, initialQuery }: UseCategoriesOptions) {
  const queryClient = useQueryClient();
  
  const [query, setQuery] = useState<CategoryListQueryInput>({
    organizationId,
    page: 1,
    limit: 10,
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
    ...initialQuery,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories-list", query],
    queryFn: async (): Promise<PaginatedResult<ProductCategoryWithRelations>> => {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/organizations/${organizationId}/categories?${params}`);
      if (!response.ok) {
        throw new Error("Error al cargar las categorías");
      }
      
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const updateQuery = useCallback((updates: Partial<CategoryListQueryInput>) => {
    setQuery(prev => ({ ...prev, ...updates }));
  }, []);

  const resetQuery = useCallback(() => {
    setQuery({
      organizationId,
      page: 1,
      limit: 10,
      search: "",
      status: "all",
      sortBy: "name",
      sortOrder: "asc",
    });
  }, [organizationId]);

  return {
    // Data
    categories: data?.items || [],
    total: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 0,
    currentPage: data?.pagination?.page || 1,
    hasNextPage: data?.pagination?.hasNext || false,
    hasPreviousPage: data?.pagination?.hasPrev || false,
    
    // State
    query,
    isLoading,
    isError,
    error,
    
    // Actions
    updateQuery,
    resetQuery,
    refetch,
  };
}

// ===== CATEGORY MUTATIONS =====

function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<ProductCategoryWithRelations> => {
      const response = await fetch(`/api/organizations/${input.organizationId}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear la categoría");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate categories queries
      queryClient.invalidateQueries({ queryKey: ["categories", variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      
      toast.success("Categoría creada exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating category:", error);
      toast.error(error.message || "Error al crear la categoría");
    },
  });
}

function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      categoryId, 
      organizationId, 
      data 
    }: { 
      categoryId: string; 
      organizationId: string; 
      data: UpdateCategoryInput; 
    }): Promise<ProductCategoryWithRelations> => {
      const response = await fetch(`/api/organizations/${organizationId}/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar la categoría");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update specific category in cache
      queryClient.setQueryData(
        ["category", variables.categoryId], 
        data
      );
      
      // Invalidate categories queries
      queryClient.invalidateQueries({ queryKey: ["categories", variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      
      toast.success("Categoría actualizada exitosamente");
    },
    onError: (error: any) => {
      console.error("Error updating category:", error);
      toast.error(error.message || "Error al actualizar la categoría");
    },
  });
}

function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      categoryId, 
      organizationId 
    }: { 
      categoryId: string; 
      organizationId: string; 
    }): Promise<void> => {
      const response = await fetch(`/api/organizations/${organizationId}/categories/${categoryId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar la categoría");
      }
    },
    onSuccess: (data, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["category", variables.categoryId] });
      
      // Invalidate categories queries
      queryClient.invalidateQueries({ queryKey: ["categories", variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      
      toast.success("Categoría eliminada exitosamente");
    },
    onError: (error: any) => {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Error al eliminar la categoría");
    },
  });
}

// ===== SINGLE CATEGORY HOOK =====

function useCategory(categoryId: string, organizationId: string) {
  return useQuery({
    queryKey: ["category", categoryId],
    queryFn: async (): Promise<ProductCategoryWithRelations> => {
      const response = await fetch(`/api/organizations/${organizationId}/categories/${categoryId}`);
      if (!response.ok) {
        throw new Error("Error al cargar la categoría");
      }
      return response.json();
    },
    enabled: !!categoryId && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===== CATEGORY TREE HOOK =====

function useCategoryTree(organizationId: string) {
  return useQuery({
    queryKey: ["categories-tree", organizationId],
    queryFn: async (): Promise<ProductCategoryWithRelations[]> => {
      const response = await fetch(`/api/organizations/${organizationId}/categories/tree`);
      if (!response.ok) {
        throw new Error("Error al cargar el árbol de categorías");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===== EXPORT ALL =====

export default useCategories;
export {
  useCategoriesList,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategory,
  useCategoryTree,
};
