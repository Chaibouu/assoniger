import { z } from "zod";

/** Formulaire : création / modification d’une commune (département + libellé, code optionnel). */
export const AddCommuneSchema = z.object({
  departementId: z.string().min(1, "Choisissez un département"),
  name: z
    .string()
    .min(2, "Le libellé doit contenir au moins 2 caractères")
    .max(128, "Le libellé est trop long"),
  code: z.string().max(32, "Le code est trop long"),
});

export type AddCommuneValues = z.infer<typeof AddCommuneSchema>;
