import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateCategory, useCategory } from "@/hooks/use-categories";
import { useSummaryCardOptions } from "@/hooks/use-summary-cards";
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations/category";

import { useEffect } from "react";
import { getPublicUrl } from "@/lib/utils/r2-client";

export function useEditCategoryView(organizationId: string, categoryId: string) {
    const router = useRouter();
    const updateCategory = useUpdateCategory();
    const { data: category, isLoading: loadingCategory } = useCategory(categoryId, organizationId);
    
    // Get summary card options
    const { options: summaryCardOptions, isLoading: loadingSummaryCards } = useSummaryCardOptions(organizationId);

    const form = useForm<CreateCategoryInput>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: "",
            description: "",
            imagenAlt: "",
            summaryCardId: null,
            active: true,
            isCombo: false,
        },
    });

    // Populate form when category data is loaded
    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name || "",
                description: category.description || "",
                imagenAlt: category.imagenAlt ? getPublicUrl(category.imagenAlt) : "",
                summaryCardId: category.summaryCardId || null,
                active: category.active ?? true,
                isCombo: category.isCombo ?? false,
            });
        }
    }, [category, form]);

    async function onSubmit(data: CreateCategoryInput) {
        try {
            await updateCategory.mutateAsync({
                categoryId,
                organizationId,
                data: {
                    name: data.name,
                    description: data.description,
                    active: data.active,
                    isCombo: data.isCombo,
                    imagenAlt: data.imagenAlt,
                    summaryCardId: data.summaryCardId,
                },
            });
            // Redirect after successful update
            router.push("/dashboard/categories");
        } catch (error) {
            // Error handling is already done in the hook
            console.error("Error updating category:", error);
        }
    }

    return {
        router,
        updateCategory,
        form,
        onSubmit,
        category,
        isLoading: updateCategory.isPending || loadingCategory,
        summaryCardOptions,
        loadingSummaryCards,
    };
}
