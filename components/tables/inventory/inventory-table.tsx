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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
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
import { Progress } from "@/components/ui/progress";

// ===== TYPES =====

interface InventoryTableProps {
  organizationId: string;
  onEdit?: (item: any) => void;
  onView?: (item: any) => void;
  onDelete?: (item: any) => void;
}

// ===== COMPONENT =====

export function InventoryTable({
  organizationId,
  onEdit,
  onView,
  onDelete,
}: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Mock inventory data
  const mockInventory = [
    {
      id: "1",
      product: {
        id: "p1",
        name: "Laptop HP Pavilion",
        sku: "HP-PAV-001",
        images: ["/laptop.jpg"],
        category: { name: "Electrónicos" },
      },
      quantity: 15,
      minStock: 5,
      maxStock: 50,
      costPrice: 1200000,
      location: "Almacén A - Estante 2",
      lastMovement: "2024-01-15",
      status: "in_stock",
    },
    {
      id: "2",
      product: {
        id: "p2",
        name: "Mouse Inalámbrico",
        sku: "MW-001",
        images: ["/mouse.jpg"],
        category: { name: "Accesorios" },
      },
      quantity: 3,
      minStock: 10,
      maxStock: 100,
      costPrice: 45000,
      location: "Almacén B - Estante 1",
      lastMovement: "2024-01-14",
      status: "low_stock",
    },
    {
      id: "3",
      product: {
        id: "p3",
        name: "Teclado Mecánico",
        sku: "KB-MEC-001",
        images: ["/keyboard.jpg"],
        category: { name: "Accesorios" },
      },
      quantity: 0,
      minStock: 5,
      maxStock: 25,
      costPrice: 180000,
      location: "Almacén A - Estante 3",
      lastMovement: "2024-01-10",
      status: "out_of_stock",
    },
    {
      id: "4",
      product: {
        id: "p4",
        name: 'Monitor 24"',
        sku: "MON-24-001",
        images: ["/monitor.jpg"],
        category: { name: "Electrónicos" },
      },
      quantity: 25,
      minStock: 8,
      maxStock: 40,
      costPrice: 650000,
      location: "Almacén A - Estante 1",
      lastMovement: "2024-01-16",
      status: "in_stock",
    },
    {
      id: "5",
      product: {
        id: "p5",
        name: "Webcam HD",
        sku: "WC-HD-001",
        images: ["/webcam.jpg"],
        category: { name: "Accesorios" },
      },
      quantity: 42,
      minStock: 15,
      maxStock: 50,
      costPrice: 120000,
      location: "Almacén B - Estante 2",
      lastMovement: "2024-01-16",
      status: "overstocked",
    },
  ];

  // Filter inventory based on search
  const filteredInventory = mockInventory.filter(
    (item) =>
      item.product.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()),
  );

  // Mock pagination
  const total = filteredInventory.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO");
  };

  // Get stock status
  const getStockStatus = (item: any) => {
    const { quantity, minStock, maxStock, status } = item;

    switch (status) {
      case "out_of_stock":
        return {
          badge: <Badge variant="destructive">Sin Stock</Badge>,
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          progress: 0,
        };
      case "low_stock":
        return {
          badge: (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700"
            >
              Stock Bajo
            </Badge>
          ),
          icon: <TrendingDown className="h-4 w-4 text-orange-500" />,
          progress: (quantity / maxStock) * 100,
        };
      case "overstocked":
        return {
          badge: (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Sobrestockeado
            </Badge>
          ),
          icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
          progress: (quantity / maxStock) * 100,
        };
      default:
        return {
          badge: <Badge variant="default">En Stock</Badge>,
          icon: <Package className="h-4 w-4 text-green-500" />,
          progress: (quantity / maxStock) * 100,
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario</CardTitle>
        <CardDescription>
          Controla el stock y movimientos de inventario
        </CardDescription>

        {/* Search and filters */}
        <div className="flex items-center space-x-4 pt-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en inventario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Movimiento
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Rango</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Último Mov.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center">
                  <div className="text-muted-foreground">
                    <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {search
                      ? "No se encontraron productos"
                      : "No hay productos en inventario"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const totalValue = item.quantity * item.costPrice;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              item.product.images?.[0] ||
                              "/placeholder-product.png"
                            }
                            alt={item.product.name}
                          />
                          <AvatarFallback>
                            {item.product.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.product.sku} • {item.product.category.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.location}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {stockStatus.icon}
                        <div>
                          <div className="font-medium">{item.quantity}</div>
                          <div className="text-sm text-muted-foreground">
                            unidades
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Min:</span>{" "}
                          {item.minStock}
                          <span className="mx-2">•</span>
                          <span className="text-muted-foreground">
                            Max:
                          </span>{" "}
                          {item.maxStock}
                        </div>
                        <Progress
                          value={stockStatus.progress}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(totalValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.costPrice)}/und
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.lastMovement)}
                      </div>
                    </TableCell>
                    <TableCell>{stockStatus.badge}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onView?.(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver historial
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Ajustar stock
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Entrada
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <TrendingDown className="mr-2 h-4 w-4" />
                            Salida
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
