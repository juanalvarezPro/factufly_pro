import { UserRole } from "@prisma/client";

import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "PRINCIPAL",
    items: [
      { href: "/dashboard", icon: "dashboard", title: "Panel de Control" },
      { href: "/dashboard/analytics", title: "Analíticas" , authorizeOnly: UserRole.ADMIN},
      { href: "/dashboard/reports", title: "Reportes" , authorizeOnly: UserRole.ADMIN},
    ],
  },
  {
    title: "CATÁLOGO",
    items: [
      { href: "/dashboard/categories", icon: "listCheck", title: "Categorías" , authorizeOnly: UserRole.ADMIN},
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      { 
        href: "/dashboard/users", 
        icon: "user", 
        title: "Usuarios", 
        authorizeOnly: UserRole.ADMIN 
      },
      { 
        href: "/dashboard/organizations", 
        title: "Organizaciones", 
        authorizeOnly: UserRole.ADMIN 
      },
      { 
        href: "/dashboard/permissions", 
        title: "Permisos", 
        authorizeOnly: UserRole.ADMIN 
      },
    ],
  },
  {
    title: "CONFIGURACIÓN",
    items: [
      { href: "/dashboard/settings", icon: "settings", title: "Configuración" , authorizeOnly: UserRole.ADMIN},
      { href: "/dashboard/billing", title: "Facturación" , authorizeOnly: UserRole.ADMIN},
      { href: "/dashboard/integrations", title: "Integraciones" , authorizeOnly: UserRole.ADMIN},
      {
        href: "/admin",
        icon: "laptop",
        title: "Panel Admin",
        authorizeOnly: UserRole.ADMIN,
      },
    ],
  },
  {
    title: "AYUDA",
    items: [
      { href: "/", icon: "home", title: "Página Principal"},
      { href: "/docs", icon: "bookOpen", title: "Documentación" , authorizeOnly: UserRole.ADMIN},
      { href: "/dashboard/support",  title: "Soporte" , authorizeOnly: UserRole.ADMIN},
    ],
  },
];
