"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Icons } from "@/components/shared/icons";

const organizationNameSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
});

type FormData = z.infer<typeof organizationNameSchema>;

interface OrganizationNameFormProps {
  organization: {
    id: string;
    name: string;
  };
}

export function OrganizationNameForm({ organization }: OrganizationNameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el nombre");
      }

      toast({
        title: "Nombre actualizado",
        description: "El nombre de la organización ha sido actualizado correctamente.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre de la organización.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const hasChanges = form.watch("name") !== organization.name;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la organización</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingresa el nombre de tu organización"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Este es el nombre que aparecerá en tu dashboard y facturas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !hasChanges}
          className="w-full sm:w-auto"
        >
          {isLoading && (
            <Icons.spinner className="mr-2 size-4 animate-spin" />
          )}
          {isLoading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  );
}
