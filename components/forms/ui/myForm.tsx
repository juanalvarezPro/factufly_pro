import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/shared/icons";
import { UseFormReturn } from "react-hook-form";

interface propsForm {
    children: React.ReactNode;
    form: UseFormReturn<any>;
    onSubmit: (data: any) => void;
    router: any;
    path: string;
    label: string;
    itemName: any;
}


export function MyForm({ children, form, onSubmit, router, itemName, path, label }: propsForm) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {children}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(path)}
                        disabled={itemName.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={itemName.isPending}>
                        {itemName.isPending && (
                            <Icons.spinner className="mr-2 size-4 animate-spin" />
                        )}
                        {itemName.isPending ? "Creando..." : "Crear " + label}
                    </Button>
                </div>
            </form>
        </Form>
    )
}