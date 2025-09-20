import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { filterNavigationByRole } from "@/lib/utils/server-side-filtering";
import { sidebarLinks } from "@/config/dashboard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  // Filter navigation links on the server side
  const filteredLinks = filterNavigationByRole(sidebarLinks, user.role);

  return (
    <DashboardLayout filteredLinks={filteredLinks}>
      {children}
    </DashboardLayout>
  );
}
