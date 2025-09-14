"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Tag,
  Search,
  Folder,
  FolderOpen,
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
import { TablePagination } from "@/components/ui/table-pagination";
import { useCategoriesList } from "@/hooks/use-categories";

// ===== TYPES =====

interface CategoryTableProps {
  organizationId: string;
  onEdit?: (category: any) => void;
  onView?: (category: any) => void;
  onDelete?: (category: any) => void;
}

// ===== COMPONENT =====

export function CategoryTable({
  organizationId,
  onEdit,
  onView,
  onDelete,
}: CategoryTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Mock categories data while hook is being implemented
  const mockCategories = [
    {
      id: "1",
      name: "Electrónicos",
      description: "Dispositivos electrónicos y gadgets",
      status: "active",
      visible: true,
      productCount: 45,
      childCount: 3,
      parent: null,
      sortOrder: 1,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Laptops",
      description: "Computadoras portátiles",
      status: "active",
      visible: true,
      productCount: 15,
      childCount: 0,
      parent: { id: "1", name: "Electrónicos" },
      sortOrder: 1,
      createdAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      name: "Smartphones",
      description: "Teléfonos inteligentes",
      status: "active",
      visible: true,
      productCount: 22,
      childCount: 0,
      parent: { id: "1", name: "Electrónicos" },
      sortOrder: 2,
      createdAt: "2024-01-03T00:00:00Z",
    },
    {
      id: "4",
      name: "Accesorios",
      description: "Accesorios para dispositivos",
      status: "active",
      visible: true,
      productCount: 8,
      childCount: 0,
      parent: { id: "1", name: "Electrónicos" },
      sortOrder: 3,
      createdAt: "2024-01-04T00:00:00Z",
    },
    {
      id: "5",
      name: "Hogar",
      description: "Productos para el hogar",
      status: "active",
      visible: true,
      productCount: 28,
      childCount: 2,
      parent: null,
      sortOrder: 2,
      createdAt: "2024-01-05T00:00:00Z",
    },
    {
      id: "6",
      name: "Cocina",
      description: "Electrodomésticos de cocina",
      status: "active",
      visible: true,
      productCount: 18,
      childCount: 0,
      parent: { id: "5", name: "Hogar" },
      sortOrder: 1,
      createdAt: "2024-01-06T00:00:00Z",
    },
    {
      id: "7",
      name: "Limpieza",
      description: "Productos de limpieza",
      status: "inactive",
      visible: false,
      productCount: 10,
      childCount: 0,
      parent: { id: "5", name: "Hogar" },
      sortOrder: 2,
      createdAt: "2024-01-07T00:00:00Z",
    },
  ];

  // Filter categories based on search
  const filteredCategories = mockCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.description?.toLowerCase().includes(search.toLowerCase()) ||
      category.parent?.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Mock pagination
  const total = filteredCategories.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Activa</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactiva</Badge>;
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: any) => {
    if (category.childCount > 0) {
      return <FolderOpen className="h-4 w-4 text-blue-500" />;
    }
    return <Folder className="h-4 w-4 text-gray-500" />;
  };

  // Get hierarchy display
  const getHierarchyDisplay = (category: any) => {
    if (category.parent) {
      return (
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <span>{category.parent.name}</span>
          <span>→</span>
          <span className="font-medium text-foreground">{category.name}</span>
        </div>
      );
    }
    return <div className="font-medium">{category.name}</div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorías</CardTitle>
        <CardDescription>Organiza tus productos por categorías</CardDescription>

        {/* Search and filters */}
        <div className="flex items-center space-x-4 pt-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorías..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Subcategorías</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <div className="text-muted-foreground">
                    <Tag className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {search
                      ? "No se encontraron categorías"
                      : "No hay categorías registradas"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(category)}
                      <div>
                        {getHierarchyDisplay(category)}
                        <div className="text-sm text-muted-foreground">
                          Orden: {category.sortOrder}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm">
                      {category.description || "Sin descripción"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{category.productCount}</div>
                      <div className="text-sm text-muted-foreground">
                        productos
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      {category.childCount > 0 ? (
                        <>
                          <div className="font-medium">
                            {category.childCount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            subcategorías
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">-</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(category.status)}
                      {category.visible && (
                        <div className="text-xs text-green-600">Visible</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(category.createdAt)}
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
                        <DropdownMenuItem onClick={() => onView?.(category)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver productos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(category)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="mr-2 h-4 w-4" />
                          Subcategoría
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete?.(category)}
                          className="text-red-600"
                          disabled={
                            category.productCount > 0 || category.childCount > 0
                          }
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
