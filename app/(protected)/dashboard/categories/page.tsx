import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserOrganization } from "@/lib/session";
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
      {/* Categories Table */}
      <CategoryTable organizationId={organization.id} />
    </div>
  );
}

export default CategoriesPage