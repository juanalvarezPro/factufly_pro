"use client";

import { useQuery } from "@tanstack/react-query";

interface SummaryCard {
  id: string;
  name: string;
  camelName: string;
  description: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export function useSummaryCards(organizationId: string) {
  return useQuery({
    queryKey: ["summary-cards", organizationId],
    queryFn: async (): Promise<SummaryCard[]> => {
      const response = await fetch(`/api/organizations/${organizationId}/summary-cards`);
      
      if (!response.ok) {
        throw new Error("Error al cargar las tarjetas resumen");
      }
      
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSummaryCardOptions(organizationId: string) {
  const { data: summaryCards = [], isLoading } = useSummaryCards(organizationId);
  
  const options = summaryCards.map((card) => ({
    value: card.id,
    label: card.name,
    description: card.description,
  }));

  return {
    options,
    isLoading,
  };
}
