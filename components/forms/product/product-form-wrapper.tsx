"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "./product-form";
import type { ProductWithRelations } from "@/types/database";

interface ProductFormWrapperProps {
  organizationId: string;
  product?: ProductWithRelations;
  redirectPath?: string;
}

export function ProductFormWrapper({ 
  organizationId, 
  product, 
  redirectPath = "/dashboard/products" 
}: ProductFormWrapperProps) {
  const router = useRouter();

  const handleSuccess = (product: ProductWithRelations) => {
    router.push(redirectPath);
  };

  return (
    <ProductForm 
      organizationId={organizationId}
      product={product}
      onSuccess={handleSuccess}
    />
  );
}
