import { z } from "zod";

/** Formulaire / payload : création d’une région (code stable + libellé affiché). */
export const AddRegionSchema = z.object({
  code: z
    .string()
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(64, "Le code est trop long"),
  name: z
    .string()
    .min(2, "Le libellé doit contenir au moins 2 caractères")
    .max(128, "Le libellé est trop long"),
});

export type AddRegionValues = z.infer<typeof AddRegionSchema>;
