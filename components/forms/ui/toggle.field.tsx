"use client";
import { FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";

import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";

interface ToggleFieldProps {
    form: UseFormReturn<any>;
    name: string;
    label: string;
    description: string;
    field: any;
}
export function ToggleField({ form, name, label, description }: ToggleFieldProps) {

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>{label}</FormLabel>
                        <FormDescription>
                            {description}
                        </FormDescription>
                    </div>
                </FormItem>
            )}
        />
    )
}