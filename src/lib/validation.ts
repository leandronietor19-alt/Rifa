import { z } from "zod";

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "El carrito está vacío"),
  buyerName: z.string().trim().min(2, "Indica tu nombre completo").max(120),
  buyerEmail: z.string().trim().email("Correo no válido").max(160),
  buyerPhone: z
    .string()
    .trim()
    .min(6, "Teléfono no válido")
    .max(30)
    .regex(/^[+()\-\s\d]+$/, "Teléfono no válido"),
  buyerAddress: z.string().trim().min(5, "Indica una dirección de envío").max(500),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Correo no válido"),
  password: z.string().min(1, "Indica tu contraseña"),
});

export const variantInputSchema = z.object({
  id: z.string().optional(), // present when editing an existing variant
  label: z.string().trim().min(1, "Indica la variante (ej. talla)").max(60),
  priceEuros: z.coerce.number().positive("El precio debe ser mayor que 0"),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Título muy corto").max(120),
  description: z.string().trim().min(3, "Añade una descripción").max(4000),
  imageUrl: z.union([z.string().trim().url("URL de imagen no válida"), z.literal("")]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  variants: z.array(variantInputSchema).min(1, "Añade al menos una variante"),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "Indica el nombre de la tienda").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  logoUrl: z.union([z.string().trim().url("URL no válida"), z.literal("")]).optional(),
  bizumPhone: z.string().trim().max(30).optional().or(z.literal("")),
  bankAccount: z.string().trim().max(60).optional().or(z.literal("")),
  bankHolder: z.string().trim().max(120).optional().or(z.literal("")),
  paymentNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  reservationMinutes: z.coerce.number().int().min(5).max(10080),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductFormInput = z.infer<typeof productFormSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
