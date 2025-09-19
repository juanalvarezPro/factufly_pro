import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  
  // Allow both ADMIN and DEV users to access admin routes
  if (user.role !== "ADMIN" && user.role !== "DEV") redirect("/login");

  return <>{children}</>;
}
