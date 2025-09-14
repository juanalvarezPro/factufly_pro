import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ProductFormWrapper } from "@/components/forms/product/product-form-wrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateProductPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  // Temporal: usar una organización por defecto
  const organizationId = "temp-org-id";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Volver a Productos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Producto</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo producto al catálogo
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductFormWrapper 
        organizationId={organizationId}
        redirectPath="/dashboard/products"
      />
    </div>
  );
}
