"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { PaginationMeta } from "@/types/database";

interface PaginatedListProps<T> {
  data?: T[];
  pagination?: PaginationMeta;
  isLoading?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderSkeleton?: () => ReactNode;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
}

export function PaginatedList<T>({
  data = [],
  pagination,
  isLoading = false,
  renderItem,
  renderEmpty,
  renderSkeleton,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  className = "",
}: PaginatedListProps<T>) {
  const defaultRenderEmpty = () => (
    <div className="text-center py-8 text-muted-foreground">
      <p>No hay elementos para mostrar</p>
    </div>
  );

  const defaultRenderSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: pagination?.limit || 10 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );

  const handlePageChange = (newPage: number) => {
    if (onPageChange && pagination) {
      onPageChange(Math.max(1, Math.min(newPage, pagination.totalPages)));
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(parseInt(newPageSize));
    }
  };

  const generatePageNumbers = () => {
    if (!pagination) return [];
    
    const { page, totalPages } = pagination;
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (page <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        // Near the end
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            {renderSkeleton ? renderSkeleton() : defaultRenderSkeleton()}
          </div>
        ) : data.length === 0 ? (
          <div className="p-4">
            {renderEmpty ? renderEmpty() : defaultRenderEmpty()}
          </div>
        ) : (
          <div className="divide-y">
            {data.map((item, index) => (
              <div key={index} className="p-4">
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {pagination && pagination.totalPages > 1 && (
        <CardFooter className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
              {pagination.total} resultados
            </div>
            
            {showPageSizeSelector && onPageSizeChange && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {generatePageNumbers().map((pageNum, index) => (
                <div key={index}>
                  {pageNum === "..." ? (
                    <span className="px-3 py-1 text-sm text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum as number)}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// Specialized component for grid layouts
export function PaginatedGrid<T>({
  data = [],
  pagination,
  isLoading = false,
  renderItem,
  renderEmpty,
  renderSkeleton,
  onPageChange,
  onPageSizeChange,
  columns = 3,
  className = "",
  ...props
}: PaginatedListProps<T> & { columns?: number }) {
  const defaultGridSkeleton = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
      {Array.from({ length: pagination?.limit || 12 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {isLoading ? (
          renderSkeleton ? renderSkeleton() : defaultGridSkeleton()
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {renderEmpty ? renderEmpty() : <p>No hay elementos para mostrar</p>}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
            {data.map((item, index) => (
              <div key={index}>
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {pagination && pagination.totalPages > 1 && (
        <CardFooter className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} resultados
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
