"use client";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
interface DescriptionFieldProps {
    form: UseFormReturn<any>;
    placeholder: string;
    description: string;
}
export function DescriptionField({ form, placeholder, description }: DescriptionFieldProps) {
    return (
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder={placeholder}
                            className="resize-none"
                            {...field}
                        />
                    </FormControl>
                    <FormDescription>
                        {description}
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}