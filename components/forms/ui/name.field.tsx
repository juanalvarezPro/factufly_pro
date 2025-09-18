"use client";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
interface nameProps {
    form: UseFormReturn<any>;
    placeholder: string;
    description: string;
}
export function NameField({ form, placeholder, description }: nameProps) {

    return (
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                        <Input
                            placeholder={placeholder}
                            {...field}
                        />
                    </FormControl>
                    <FormDescription>
                        {description}
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />)
}
