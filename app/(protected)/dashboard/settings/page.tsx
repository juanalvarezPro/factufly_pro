import { redirect } from "next/navigation";

import { getCurrentUser, getCurrentUserOrganization } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserRoleForm } from "@/components/forms/user-role-form";
import { OrganizationNameForm } from "@/components/forms/organization-name-form";

export const metadata = constructMetadata({
  title: "Settings – Factufly Pro",
  description: "Configure your account and website settings.",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  const organization = await getCurrentUserOrganization();

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage account and website settings."
      />
      <div className="divide-y divide-muted pb-10">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <UserRoleForm user={{ id: user.id, role: user.role }} />
        {organization && (
          <OrganizationNameForm 
            organization={{
              id: organization.id,
              name: organization.name
            }}
          />
        )}
        <DeleteAccountSection />
      </div>
    </>
  );
}
