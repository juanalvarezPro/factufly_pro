import { redirect } from "next/navigation";

import { getCurrentUser, getCurrentUserOrganization } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { CategoryCreateForm } from "@/components/forms/category/category-create-form";

export const metadata = constructMetadata({
  title: "Crear Categoría – Factufly Pro",
  description: "Crea una nueva categoría para organizar tus productos.",
});

export default async function CreateCategoryPage() {
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
        heading="Crear Categoría"
        text="Crea una nueva categoría para organizar mejor tus productos."
      />
      
      <div className="grid gap-6">
        <CategoryCreateForm organizationId={organization.id} />
      </div>
    </>
  );
}
