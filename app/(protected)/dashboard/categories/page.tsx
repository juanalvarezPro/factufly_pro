import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserOrganization } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CategoryTable } from "@/components/tables/category/category-table";

async function CategoriesPage() {
  const user = await getCurrentUser();
    
  if (!user) {
    redirect("/auth/signin");
  }

  // Get current user's organization
  const organization = await getCurrentUserOrganization();
  
  if (!organization) {
    return (
      <div className="space-y-6">
        <div className="py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold text-muted-foreground">
            Sin Organización
          </h1>
          <p className="text-muted-foreground">
            No perteneces a ninguna organización. Contacta al administrador para ser invitado.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de productos de {organization.name}
          </p>
        </div>
        <Link href="/dashboard/categories/create">
          <Button>
            <Plus className="mr-2 size-4" />
            Crear Categoría
          </Button>
        </Link>
      </div>
      {/* Categories Table */}
      <CategoryTable organizationId={organization.id} />
    </div>
  );
}

export default CategoriesPage