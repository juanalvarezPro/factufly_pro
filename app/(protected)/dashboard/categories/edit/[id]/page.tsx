import { redirect } from "next/navigation";

import { getCurrentUser, getCurrentUserOrganization } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { CategoryEditForm } from "@/components/forms/category/category-edit-form";


export const metadata = constructMetadata({
  title: "Editar Categoría – Factufly Pro",
  description: "Edita los detalles de la categoría de productos.",
});

interface EditCategoryPageProps {
  params: {
    id: string;
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/login");
  }

  const organization = await getCurrentUserOrganization();

  if (!organization?.id) {
    redirect("/dashboard");
  }

  return (
    <>
      <DashboardHeader
        heading="Editar Categoría"
        text="Modifica los detalles de la categoría de productos."
      />
      
      <div className="grid gap-6">
        <CategoryEditForm 
          organizationId={organization.id} 
          categoryId={params.id}
        />
      </div>
    </>
  );
}
