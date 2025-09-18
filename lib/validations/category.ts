import * as z from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  imagenAlt: z
    .string()
    .max(255, "El path de la imagen no puede exceder 255 caracteres")
    .optional(),
  summaryCardId: z
    .string()
    .optional()
    .nullable(),
  active: z
    .boolean()
    .default(true),
  isCombo: z
    .boolean()
    .default(false),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
