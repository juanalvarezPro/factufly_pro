"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Users,
  Search,
  Shield,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TablePagination } from "@/components/ui/table-pagination";

// ===== TYPES =====

interface UserTableProps {
  organizationId: string;
  onEdit?: (user: any) => void;
  onView?: (user: any) => void;
  onDelete?: (user: any) => void;
}

// ===== COMPONENT =====

export function UserTable({
  organizationId,
  onEdit,
  onView,
  onDelete,
}: UserTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Mock users data
  const mockUsers = [
    {
      id: "1",
      name: "Juan Pérez",
      email: "juan.perez@empresa.com",
      phone: "+57 300 123 4567",
      avatar: "/avatar1.jpg",
      role: "OWNER",
      status: "active",
      lastLogin: "2024-01-16T10:30:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      permissions: ["READ", "WRITE", "DELETE", "ADMIN"],
    },
    {
      id: "2",
      name: "María García",
      email: "maria.garcia@empresa.com",
      phone: "+57 301 987 6543",
      avatar: "/avatar2.jpg",
      role: "ADMIN",
      status: "active",
      lastLogin: "2024-01-16T09:15:00Z",
      createdAt: "2024-01-05T00:00:00Z",
      permissions: ["READ", "WRITE", "DELETE"],
    },
    {
      id: "3",
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@empresa.com",
      phone: "+57 302 456 7890",
      avatar: "/avatar3.jpg",
      role: "MANAGER",
      status: "active",
      lastLogin: "2024-01-15T16:45:00Z",
      createdAt: "2024-01-10T00:00:00Z",
      permissions: ["READ", "WRITE"],
    },
    {
      id: "4",
      name: "Ana López",
      email: "ana.lopez@empresa.com",
      phone: "+57 303 789 0123",
      avatar: "/avatar4.jpg",
      role: "USER",
      status: "inactive",
      lastLogin: "2024-01-12T14:20:00Z",
      createdAt: "2024-01-08T00:00:00Z",
      permissions: ["READ"],
    },
    {
      id: "5",
      name: "Luis Martínez",
      email: "luis.martinez@empresa.com",
      phone: "+57 304 234 5678",
      avatar: "/avatar5.jpg",
      role: "USER",
      status: "pending",
      lastLogin: null,
      createdAt: "2024-01-15T00:00:00Z",
      permissions: ["READ"],
    },
  ];

  // Filter users based on search
  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.phone.includes(search),
  );

  // Mock pagination
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <Badge variant="default" className="bg-purple-600">
            Propietario
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="default" className="bg-red-600">
            Administrador
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge variant="default" className="bg-blue-600">
            Gerente
          </Badge>
        );
      case "USER":
        return <Badge variant="secondary">Usuario</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600">
            Activo
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-orange-400 text-orange-600"
          >
            Pendiente
          </Badge>
        );
      case "suspended":
        return <Badge variant="destructive">Suspendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
        <CardDescription>
          Gestiona los usuarios de tu organización
        </CardDescription>

        {/* Search and filters */}
        <div className="flex items-center space-x-4 pt-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invitar Usuario
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último Acceso</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <div className="text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {search
                      ? "No se encontraron usuarios"
                      : "No hay usuarios registrados"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar || "/placeholder-avatar.png"}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-3 w-3" />
                        {user.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(user.lastLogin)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {user.permissions.length} permisos
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onView?.(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Permisos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "active" ? (
                          <DropdownMenuItem className="text-orange-600">
                            Suspender
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            Activar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDelete?.(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            hasNextPage={page < totalPages}
            hasPreviousPage={page > 1}
            total={total}
            pageSize={limit}
          />
        )}
      </CardContent>
    </Card>
  );
}
