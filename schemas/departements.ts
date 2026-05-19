import { z } from "zod";

/** Formulaire : création / modification d’un département (région + libellé, code optionnel). */
export const AddDepartementSchema = z.object({
  regionId: z.string().min(1, "Choisissez une région"),
  name: z
    .string()
    .min(2, "Le libellé doit contenir au moins 2 caractères")
    .max(128, "Le libellé est trop long"),
  code: z.string().max(32, "Le code est trop long"),
});

export type AddDepartementValues = z.infer<typeof AddDepartementSchema>;
