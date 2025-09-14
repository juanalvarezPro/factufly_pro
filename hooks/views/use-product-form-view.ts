"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Removed translations - using Spanish text directly
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import useCategories from '@/hooks/use-categories';
import useUploadImage from '@/hooks/use-upload';
import { 
  createProductSchema, 
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput 
} from '@/lib/validations/product';
import type { ProductWithRelations } from '@/types/database';

// ===== TYPES =====

export interface ProductFormData extends Omit<CreateProductInput, 'organizationId'> {}

export interface UseProductFormViewProps {
  organizationId: string;
  product?: ProductWithRelations;
  onSuccess?: (product: ProductWithRelations) => void;
  onCancel?: () => void;
}

export interface UseProductFormViewReturn {
  // Form state
  form: ReturnType<typeof useForm<ProductFormData>>;
  isSubmitting: boolean;
  isValid: boolean;
  
  // Data
  categories: any[];
  isLoadingCategories: boolean;
  
  // Image handling
  selectedImages: File[];
  imagePreviewUrls: string[];
  isUploadingImages: boolean;
  
  // Actions
  handleSubmit: (data: ProductFormData) => Promise<void>;
  handleImageSelect: (files: File[]) => void;
  handleImageRemove: (index: number) => void;
  handleCancel: () => void;
  
  // Messages (in Spanish)
  messages: {
    createSuccess: string;
    updateSuccess: string;
    generalError: string;
  };
  
  // Validation helpers
  getFieldError: (fieldName: keyof ProductFormData) => string | undefined;
  hasFieldError: (fieldName: keyof ProductFormData) => boolean;
}

// ===== HOOK =====

export function useProductFormView({
  organizationId,
  product,
  onSuccess,
  onCancel,
}: UseProductFormViewProps): UseProductFormViewReturn {
  const router = useRouter();
  
  // Spanish messages
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const messages = {
    createSuccess: 'Producto creado exitosamente',
    updateSuccess: 'Producto actualizado exitosamente',
    generalError: 'Ocurrió un error. Por favor, intenta de nuevo.',
  };
  
  // ===== STATE =====
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  // ===== FORM SETUP =====
  
  const isEditing = !!product;
  const schema = isEditing ? updateProductSchema : createProductSchema;
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      description: product.description || '',
      price: product.price.toNumber(),
      costPrice: product.costPrice?.toNumber() || 0,
      sku: product.sku || '',
      barcode: product.barcode || '',
      categoryId: product.categoryId,
      cardId: product.cardId || '',
      status: product.status as 'active' | 'inactive' | 'archived' | 'discontinued',
      isVisible: product.isVisible,
      isFeatured: product.isFeatured,
      tags: product.tags || [],
      abbreviation: product.abbreviation || '',
      imageAlt: product.imageAlt || '',
    } : {
      name: '',
      description: '',
      price: 0,
      costPrice: 0,
      sku: '',
      barcode: '',
      categoryId: '',
      cardId: '',
      status: 'active',
      isVisible: true,
      isFeatured: false,
      tags: [],
      abbreviation: '',
      imageAlt: '',
    },
  });
  
  const isValid = form.formState.isValid;
  
  // ===== MUTATIONS =====
  
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadImage();
  
  const isSubmitting = createProductMutation.isPending || 
                     updateProductMutation.isPending ||
                     uploadImageMutation.isPending;
  
  // ===== DATA FETCHING =====
  
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
  } = useCategories(organizationId);
  
  // ===== IMAGE HANDLING =====
  
  const handleImageSelect = useCallback((files: File[]) => {
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  }, []);
  
  const handleImageRemove = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke and remove preview URL
    const urlToRevoke = imagePreviewUrls[index];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviewUrls]);
  
  // ===== FORM SUBMISSION =====
  
  const handleSubmit = useCallback(async (data: ProductFormData) => {
    try {
      let imageUrls: string[] = [];
      
      // Upload images if any selected
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const result = await uploadImageMutation.mutateAsync({
            file,
            folder: `organizations/${organizationId}/products`,
          });
          return result.url;
        });
        
        imageUrls = await Promise.all(uploadPromises);
      }
      
      // Prepare form data
      const formData = {
        ...data,
        organizationId,
        ...(imageUrls.length > 0 && { images: imageUrls }),
      };
      
      let result: ProductWithRelations;
      
      if (isEditing && product) {
        result = await updateProductMutation.mutateAsync({
          productId: product.id,
          organizationId,
          data: formData as UpdateProductInput,
        });
        toast.success(messages.updateSuccess);
      } else {
        result = await createProductMutation.mutateAsync(formData as CreateProductInput);
        toast.success(messages.createSuccess);
      }
      
      // Call success callback
      onSuccess?.(result);
      
      // Redirect if no callback provided
      if (!onSuccess) {
        router.push(`/organizations/${organizationId}/products`);
      }
      
    } catch (error: any) {
      console.error('Product form error:', error);
      const errorMessage = error?.message || messages.generalError;
      toast.error(errorMessage);
    }
  }, [
    selectedImages,
    organizationId,
    isEditing,
    product,
    uploadImageMutation,
    createProductMutation,
    updateProductMutation,
    onSuccess,
    router,
    messages,
  ]);
  
  // ===== CANCEL HANDLING =====
  
  const handleCancel = useCallback(() => {
    // Clean up preview URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [imagePreviewUrls, onCancel, router]);
  
  // ===== VALIDATION HELPERS =====
  
  const getFieldError = useCallback((fieldName: keyof ProductFormData) => {
    const error = form.formState.errors[fieldName];
    return error?.message;
  }, [form.formState.errors]);
  
  const hasFieldError = useCallback((fieldName: keyof ProductFormData) => {
    return !!form.formState.errors[fieldName];
  }, [form.formState.errors]);
  
  // ===== CLEANUP =====
  
  // Cleanup preview URLs on unmount
  const isUploadingImages = uploadImageMutation.isPending;
  
  return {
    // Form state
    form,
    isSubmitting,
    isValid,
    
    // Data
    categories,
    isLoadingCategories,
    
    // Image handling
    selectedImages,
    imagePreviewUrls,
    isUploadingImages,

    // Actions
    handleSubmit,
    handleImageSelect,
    handleImageRemove,
    handleCancel,
    // Messages 
    messages,
    
    // Validation helpers
    getFieldError,
    hasFieldError,
  };
}
