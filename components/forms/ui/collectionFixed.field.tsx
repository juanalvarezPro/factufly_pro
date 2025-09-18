import { FormField, FormItem, FormLabel, FormDescription, FormMessage, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface CollectionFixedFieldProps {
    form: UseFormReturn<any>;
    name: string;
    label: string;
    options: any[];
    description: string;
}
export function CollectionFixedField({ form, name, label, options, description }: CollectionFixedFieldProps) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        defaultValue={field.value ? "true" : "false"}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        {description}
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}