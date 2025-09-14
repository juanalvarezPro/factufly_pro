"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Package,
  Search,
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
import { TableSkeleton } from "@/components/ui/table-skeleton";

// ===== TYPES =====

interface ProductTableProps {
  organizationId: string;
  onEdit?: (product: any) => void;
  onView?: (product: any) => void;
  onDelete?: (product: any) => void;
}

// ===== COMPONENT =====

export function ProductTable({
  organizationId,
  onEdit,
  onView,
  onDelete,
}: ProductTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Mock products data while hook is being fixed
  const mockProducts = [
    {
      id: "1",
      productId: "1",
      name: "Laptop HP Pavilion",
      description: "Laptop de alto rendimiento para trabajo y estudio",
      price: 2500000,
      costPrice: 2000000,
      sku: "HP-LAP-001",
      barcode: "123456789012",
      status: "active",
      visible: true,
      featured: true,
      images: ["/laptop.jpg"],
      category: { id: "1", name: "Electrónicos" },
      inventory: { quantity: 15 },
      createdAt: new Date(),
    },
    {
      id: "2",
      productId: "2",
      name: "Mouse Inalámbrico Logitech",
      description: "Mouse inalámbrico ergonómico con precisión avanzada",
      price: 120000,
      costPrice: 80000,
      sku: "LOG-MOU-001",
      barcode: "123456789013",
      status: "active",
      visible: true,
      featured: false,
      images: ["/mouse.jpg"],
      category: { id: "2", name: "Accesorios" },
      inventory: { quantity: 45 },
      createdAt: new Date(),
    },
    {
      id: "3",
      productId: "3",
      name: "Teclado Mecánico RGB",
      description: "Teclado mecánico gaming con iluminación RGB personalizable",
      price: 350000,
      costPrice: 250000,
      sku: "KEY-RGB-001",
      barcode: "123456789014",
      status: "active",
      visible: true,
      featured: true,
      images: ["/keyboard.jpg"],
      category: { id: "2", name: "Accesorios" },
      inventory: { quantity: 8 },
      createdAt: new Date(),
    },
    {
      id: "4",
      productId: "4",
      name: "Monitor 4K 27 pulgadas",
      description: "Monitor profesional 4K con tecnología IPS",
      price: 1800000,
      costPrice: 1400000,
      sku: "MON-4K-001",
      barcode: "123456789015",
      status: "draft",
      visible: false,
      featured: false,
      images: ["/monitor.jpg"],
      category: { id: "1", name: "Electrónicos" },
      inventory: { quantity: 3 },
      createdAt: new Date(),
    },
    {
      id: "5",
      productId: "5",
      name: "Webcam HD 1080p",
      description: "Cámara web HD para videoconferencias profesionales",
      price: 180000,
      costPrice: 120000,
      sku: "CAM-HD-001",
      barcode: "123456789016",
      status: "inactive",
      visible: true,
      featured: false,
      images: [],
      category: { id: "2", name: "Accesorios" },
      inventory: { quantity: 0 },
      createdAt: new Date(),
    },
  ];

  // Filter products based on search
  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  // Mock pagination
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const isLoading = false;
  const error = null;

  // Update search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Update page
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Activo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar productos: {error as string}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos</CardTitle>
        <CardDescription>
          Gestiona el catálogo de productos de tu organización
        </CardDescription>

        {/* Search and filters */}
        <div className="flex items-center space-x-4 pt-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Nuevo Producto
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <div className="text-muted-foreground">
                        <Package className="mx-auto mb-2 size-8 opacity-50" />
                        {search
                          ? "No se encontraron productos"
                          : "No hay productos registrados"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="size-10">
                            <AvatarImage
                              src={
                                product.images?.[0] ||
                                "/placeholder-product.png"
                              }
                              alt={product.name}
                            />
                            <AvatarFallback>
                              {product.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{product.sku || "N/A"}</code>
                      </TableCell>
                      <TableCell>
                        {product.category?.name || "Sin categoría"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(product.price)}
                        </div>
                        {product.costPrice && (
                          <div className="text-sm text-muted-foreground">
                            Costo: {formatCurrency(product.costPrice)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">
                            {product.inventory?.quantity || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            unidades
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => onView?.(product.productId)}
                            >
                              <Eye className="mr-2 size-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onEdit?.(product.productId as string)
                              }
                            >
                              <Pencil className="mr-2 size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete?.(product.productId)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 size-4" />
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
                onPageChange={handlePageChange}
                hasNextPage={page < totalPages}
                hasPreviousPage={page > 1}
                total={total}
                pageSize={limit}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}