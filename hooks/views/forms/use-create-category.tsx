import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCategory } from "@/hooks/use-categories";
import { useSummaryCardOptions } from "@/hooks/use-summary-cards";
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations/category";

export function useCreateCategoryView(organizationId: string) {
    const router = useRouter();
    const createCategory = useCreateCategory();
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

    async function onSubmit(data: CreateCategoryInput) {
        try {
            await createCategory.mutateAsync({
                organizationId,
                ...data,
            });
            // Redirect after successful creation
            router.push("/dashboard/categories");
        } catch (error) {
            // Error handling is already done in the hook
            console.error("Error creating category:", error);
        }
    }

    return {
        router,
        createCategory,
        form,
        onSubmit,
        isLoading: createCategory.isPending,
        summaryCardOptions,
        loadingSummaryCards,
    };
}