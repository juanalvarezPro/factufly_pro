import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function CreateComboPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/combos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Combos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Combo</h1>
          <p className="text-muted-foreground">
            Crea un nuevo combo de productos
          </p>
        </div>
      </div>

      {/* Form Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-lg font-medium mb-2">Formulario de Combo</div>
          <p className="text-muted-foreground">
            Aquí se implementaría el formulario para crear combos
          </p>
          <p className="text-sm mt-4 text-muted-foreground">
            Similar al ProductForm pero para combos con selección de productos múltiples
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
