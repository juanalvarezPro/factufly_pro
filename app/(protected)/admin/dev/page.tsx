import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { DevPanel } from "@/components/admin/dev-panel";

export const metadata = constructMetadata({
  title: "Dev Panel – Factufly Pro",
  description: "Developer panel for system administration and debugging.",
});

export default async function DevPanelPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEV") redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Developer Panel"
        text="System administration and debugging tools for developers."
      />
      <div className="flex flex-col gap-6">
        <DevPanel />
      </div>
    </>
  );
}
