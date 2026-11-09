import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter").max(50),
  description: z.string().trim().max(255).optional().nullable(),
});

// GET /api/v1/categories
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return ApiResponse.success(categories);
  } catch (error) {
    console.error("List Categories Error:", error);
    return ApiResponse.internal("Gagal memuat kategori");
  }
}

// POST /api/v1/categories (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    if (authUser.role !== "ADMIN") {
      return ApiResponse.forbidden("Hanya admin yang dapat menambahkan kategori");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return ApiResponse.badRequest("Payload JSON tidak valid");
    }

    const parsed = createCategorySchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Validasi data kategori gagal", details);
    }

    const { name, description } = parsed.data;

    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return ApiResponse.conflict(`Kategori dengan nama '${name}' sudah ada`);
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description: description || null,
      },
    });

    return ApiResponse.created(newCategory, `/api/v1/categories/${newCategory.id}`);
  } catch (error) {
    console.error("Create Category Error:", error);
    return ApiResponse.internal("Gagal menambahkan kategori");
  }
}

