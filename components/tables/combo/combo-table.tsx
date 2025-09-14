"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Layers,
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
import { useCombos } from "@/hooks/use-combos";

// ===== TYPES =====

interface ComboTableProps {
  organizationId: string;
  onEdit?: (combo: any) => void;
  onView?: (combo: any) => void;
  onDelete?: (combo: any) => void;
}

// ===== COMPONENT =====

export function ComboTable({
  organizationId,
  onEdit,
  onView,
  onDelete,
}: ComboTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Mock data while we create the hook
  const mockCombos = [
    {
      id: "1",
      name: "Combo Familiar",
      description: "Combo perfecto para la familia",
      price: 45000,
      originalPrice: 52000,
      status: "active",
      visible: true,
      images: ["/combo1.jpg"],
      products: [
        { id: "1", name: "Producto A", quantity: 2 },
        { id: "2", name: "Producto B", quantity: 1 },
        { id: "3", name: "Producto C", quantity: 3 },
      ],
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Combo Ejecutivo",
      description: "Ideal para oficina",
      price: 28000,
      originalPrice: 35000,
      status: "active",
      visible: true,
      images: ["/combo2.jpg"],
      products: [
        { id: "4", name: "Producto D", quantity: 1 },
        { id: "5", name: "Producto E", quantity: 2 },
      ],
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Combo Estudiante",
      description: "Combo económico para estudiantes",
      price: 15000,
      originalPrice: 20000,
      status: "draft",
      visible: false,
      images: [],
      products: [
        { id: "6", name: "Producto F", quantity: 1 },
        { id: "7", name: "Producto G", quantity: 1 },
      ],
      createdAt: new Date(),
    },
  ];

  // Filter combos based on search
  const filteredCombos = mockCombos.filter(
    (combo) =>
      combo.name.toLowerCase().includes(search.toLowerCase()) ||
      combo.description?.toLowerCase().includes(search.toLowerCase()),
  );

  // Mock pagination
  const total = filteredCombos.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCombos = filteredCombos.slice(startIndex, endIndex);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  // Calculate savings
  const calculateSavings = (originalPrice: number, price: number) => {
    const savings = originalPrice - price;
    const percentage = ((savings / originalPrice) * 100).toFixed(0);
    return { savings, percentage };
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Combos</CardTitle>
        <CardDescription>
          Gestiona los combos de productos de tu organización
        </CardDescription>

        {/* Search and filters */}
        <div className="flex items-center space-x-4 pt-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar combos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Nuevo Combo
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combo</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Ahorro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCombos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <div className="text-muted-foreground">
                    <Layers className="mx-auto mb-2 size-8 opacity-50" />
                    {search
                      ? "No se encontraron combos"
                      : "No hay combos registrados"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCombos.map((combo) => {
                const savings = calculateSavings(
                  combo.originalPrice,
                  combo.price,
                );

                return (
                  <TableRow key={combo.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="size-10">
                          <AvatarImage
                            src={combo.images?.[0] || "/placeholder-combo.png"}
                            alt={combo.name}
                          />
                          <AvatarFallback>
                            <Layers className="size-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{combo.name}</div>
                          {combo.description && (
                            <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {combo.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {combo.products.length} productos
                        </div>
                        <div className="text-muted-foreground">
                          {combo.products.slice(0, 2).map((product, index) => (
                            <div key={product.id}>
                              {product.quantity}x {product.name}
                            </div>
                          ))}
                          {combo.products.length > 2 && (
                            <div className="text-xs">
                              +{combo.products.length - 2} más...
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(combo.price)}
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          {formatCurrency(combo.originalPrice)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-green-600">
                        <div className="font-medium">
                          {formatCurrency(savings.savings)}
                        </div>
                        <div className="text-sm">
                          {savings.percentage}% desc.
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(combo.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="size-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onView?.(combo)}>
                            <Eye className="mr-2 size-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(combo)}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(combo)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
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
