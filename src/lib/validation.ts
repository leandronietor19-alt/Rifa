import { z } from "zod";

export const createOrderSchema = z.object({
  raffleId: z.string().min(1),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Elige al menos 1 número")
    .max(100, "Máximo 100 números por pedido"),
  buyerName: z.string().trim().min(2, "Indica tu nombre completo").max(120),
  buyerEmail: z.string().trim().email("Correo no válido").max(160),
  buyerPhone: z
    .string()
    .trim()
    .min(6, "Teléfono no válido")
    .max(30)
    .regex(/^[+()\-\s\d]+$/, "Teléfono no válido"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Correo no válido"),
  password: z.string().min(1, "Indica tu contraseña"),
});

export const raffleFormSchema = z.object({
  title: z.string().trim().min(3, "Título muy corto").max(120),
  description: z.string().trim().min(3, "Añade una descripción").max(4000),
  prizeDescription: z.string().trim().min(3, "Describe el premio").max(2000),
  imageUrl: z.union([z.string().trim().url("URL de imagen no válida"), z.literal("")]).optional(),
  pricePerNumberEuros: z.coerce.number().positive("El precio debe ser mayor que 0"),
  digits: z.coerce.number().int().min(1).max(6),
  drawDate: z.string().min(1, "Indica la fecha del sorteo"),
  bizumPhone: z.string().trim().max(30).optional().or(z.literal("")),
  bankAccount: z.string().trim().max(60).optional().or(z.literal("")),
  bankHolder: z.string().trim().max(120).optional().or(z.literal("")),
  paymentNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  reservationMinutes: z.coerce.number().int().min(5).max(10080),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type RaffleFormInput = z.infer<typeof raffleFormSchema>;
