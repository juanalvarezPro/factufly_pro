import "server-only";

import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { organizationService } from "@/lib/services/organization.service";
import type { OrganizationWithRelations } from "@/types/database";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user) {
    return undefined;
  }
  return session.user;
});

export const getCurrentUserOrganization = cache(async (): Promise<OrganizationWithRelations | null> => {
  const user = await getCurrentUser();
  if (!user?.id) {
    return null;
  }

  // Ensure user has an organization (create one if they don't)
  return await organizationService.ensureUserHasOrganization(user.id);
});