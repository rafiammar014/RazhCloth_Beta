import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

// Schema for updating a product (all fields optional)
const updateProductSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(2, "SKU minimal 2 karakter")
      .max(50, "SKU maksimal 50 karakter")
      .toUpperCase()
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, "Nama produk minimal 2 karakter")
      .max(120, "Nama produk maksimal 120 karakter")
      .optional(),
    categoryId: z.string().min(1, "Kategori wajib dipilih").optional(),
    buyPrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif").optional(),
    sellPrice: z.coerce.number().min(0, "Harga jual tidak boleh negatif").optional(),
    stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif").optional(),
    size: z.string().trim().max(20).optional().nullable(),
    imageUrl: z.string().url("URL gambar tidak valid").optional().nullable().or(z.literal("")),
    isActive: z.boolean().optional(),
  })
  .strict();

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/products/:id (Get single product)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (!product) {
      return ApiResponse.notFound(`Produk dengan ID '${id}' tidak ditemukan`);
    }

    return ApiResponse.success(product);
  } catch (error) {
    console.error("Get Product by ID Error:", error);
    return ApiResponse.internal("Gagal memuat detail produk");
  }
}

// PATCH /api/v1/products/:id (Update product - Admin only)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    if (authUser.role !== "ADMIN") {
      return ApiResponse.forbidden("Hanya admin yang berhak mengubah data produk");
    }

    const { id } = await context.params;

    // Check if target product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return ApiResponse.notFound(`Produk dengan ID '${id}' tidak ditemukan`);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return ApiResponse.badRequest("Payload JSON tidak valid");
    }

    const parsed = updateProductSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Validasi pembaruan produk gagal", details);
    }

    const updateData = parsed.data;

    // If SKU is being updated, verify it is unique
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: updateData.sku },
      });
      if (duplicateSku) {
        return ApiResponse.conflict(`SKU '${updateData.sku}' sudah digunakan oleh produk lain`);
      }
    }

    // If categoryId is being updated, verify category exists
    if (updateData.categoryId && updateData.categoryId !== existingProduct.categoryId) {
      const catExists = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });
      if (!catExists) {
        return ApiResponse.notFound("Kategori yang dipilih tidak ditemukan");
      }
    }

    // Pure immutable payload preparation
    const updatePayload: Record<string, unknown> = {};
    if (updateData.sku !== undefined) updatePayload.sku = updateData.sku;
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.categoryId !== undefined) updatePayload.categoryId = updateData.categoryId;
    if (updateData.buyPrice !== undefined) updatePayload.buyPrice = updateData.buyPrice;
    if (updateData.sellPrice !== undefined) updatePayload.sellPrice = updateData.sellPrice;
    if (updateData.stock !== undefined) updatePayload.stock = updateData.stock;
    if (updateData.size !== undefined) updatePayload.size = updateData.size;
    if (updateData.imageUrl !== undefined) updatePayload.imageUrl = updateData.imageUrl || null;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updatePayload,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return ApiResponse.success(updatedProduct);
  } catch (error) {
    console.error("Update Product API Error:", error);
    return ApiResponse.internal("Gagal memperbarui data produk");
  }
}

// DELETE /api/v1/products/:id (Soft-delete / Deactivate - Admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    if (authUser.role !== "ADMIN") {
      return ApiResponse.forbidden("Hanya admin yang berhak menonaktifkan produk");
    }

    const { id } = await context.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return ApiResponse.notFound(`Produk dengan ID '${id}' tidak ditemukan`);
    }

    // Soft delete: set isActive to false to preserve historical integrity
    const deactivatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
      },
    });

    return ApiResponse.success({
      message: "Produk berhasil dinonaktifkan dari sistem kasir",
      product: deactivatedProduct,
    });
  } catch (error) {
    console.error("Delete Product API Error:", error);
    return ApiResponse.internal("Gagal menonaktifkan produk");
  }
}

