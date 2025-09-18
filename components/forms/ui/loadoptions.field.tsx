"use client";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface LoadOptionsFieldProps {
    form: UseFormReturn<any>;
    name: string;
    label: string;
    description: string;
    noneLabel: string;
    options: any[];
    isLoading: boolean;
}
export function LoadOptionsField({ form, name, label, description, noneLabel, options, isLoading }: LoadOptionsFieldProps) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Select
                        onValueChange={(value) =>
                            field.onChange(value === "none" ? null : value)
                        }
                        defaultValue={field.value || "none"}
                        disabled={isLoading}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isLoading
                                            ? "Cargando opciones..."
                                            : "Selecciona una opción"
                                    }
                                />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">{noneLabel}</SelectItem>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.description && (
                                            <span className="text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
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