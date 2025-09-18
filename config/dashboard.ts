import { UserRole } from "@prisma/client";

import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "PRINCIPAL",
    items: [
      { href: "/dashboard", icon: "dashboard", title: "Panel de Control" },
      { href: "/dashboard/analytics", title: "Analíticas" },
      { href: "/dashboard/reports", title: "Reportes" },
    ],
  },
  {
    title: "CATÁLOGO",
    items: [
      { href: "/dashboard/categories", icon: "listCheck", title: "Categorías" },
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
      { href: "/dashboard/settings", icon: "settings", title: "Configuración" },
      { href: "/dashboard/billing", title: "Facturación" },
      { href: "/dashboard/integrations", title: "Integraciones" },
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
      { href: "/", icon: "home", title: "Página Principal" },
      { href: "/docs", icon: "bookOpen", title: "Documentación" },
      { href: "/dashboard/support",  title: "Soporte" },
    ],
  },
];
