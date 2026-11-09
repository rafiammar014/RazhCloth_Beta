import { z } from "zod";

// Schema for product query parameters
export const productQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  size: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? true : val === "true")),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "sellPrice", "stock", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Schema for creating a product
export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, "SKU minimal 2 karakter")
    .max(50, "SKU maksimal 50 karakter")
    .toUpperCase(),
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter")
    .max(120, "Nama produk maksimal 120 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  buyPrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
  sellPrice: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
  size: z.string().trim().max(20).optional().nullable(),
  imageUrl: z.string().url("URL gambar tidak valid").optional().nullable().or(z.literal("")),
});

