import { UserRole } from "@prisma/client";
import { SidebarNavItem } from "@/types";

/**
 * Filters navigation links based on user role on the server side
 * This prevents hydration issues by ensuring consistent rendering
 */
export function filterNavigationByRole(
  links: SidebarNavItem[],
  userRole: UserRole
): SidebarNavItem[] {
  return links
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // If no authorization is specified, allow access
        if (!item.authorizeOnly && !item.authorizeAny) {
          return true;
        }
        
        // Check single role authorization
        if (item.authorizeOnly) {
          return item.authorizeOnly === userRole;
        }
        
        // Check multiple roles authorization
        if (item.authorizeAny) {
          return item.authorizeAny.includes(userRole);
        }
        
        return false;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
