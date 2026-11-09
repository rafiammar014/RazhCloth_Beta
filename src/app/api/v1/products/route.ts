import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { productQuerySchema, createProductSchema } from "@/lib/validations";

// GET /api/v1/products (List products with search, filter, pagination)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const parsedQuery = productQuerySchema.safeParse(queryParams);
    if (!parsedQuery.success) {
      const details = parsedQuery.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Parameter filter tidak valid", details);
    }

    const { q, categoryId, size, isActive, page, limit, sortBy, order } = parsedQuery.data;

    // Build parameterized where clause
    const whereClause: {
      isActive?: boolean;
      categoryId?: string;
      size?: string;
      OR?: Array<{ name?: { contains: string }; sku?: { contains: string } }>;
    } = {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(size ? { size } : {}),
    };

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
      ];
    }

    const offset = (page - 1) * limit;

    // Execute count and paginated query concurrently
    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { [sortBy]: order },
        skip: offset,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return ApiResponse.collection(products, {
      total,
      page,
      perPage: limit,
      totalPages,
    });
  } catch (error) {
    console.error("List Products API Error:", error);
    return ApiResponse.internal("Gagal memuat daftar produk");
  }
}

// POST /api/v1/products (Create product - Admin Only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    if (authUser.role !== "ADMIN") {
      return ApiResponse.forbidden("Hanya admin/pemilik toko yang dapat menambahkan produk baru");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return ApiResponse.badRequest("Payload JSON tidak valid");
    }

    const parsed = createProductSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Validasi data produk gagal", details);
    }

    const inputData = parsed.data;

    // 1. Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: inputData.categoryId },
    });
    if (!categoryExists) {
      return ApiResponse.notFound("Kategori yang dipilih tidak ditemukan");
    }

    // 2. Check if SKU is unique
    const existingSku = await prisma.product.findUnique({
      where: { sku: inputData.sku },
    });
    if (existingSku) {
      return ApiResponse.conflict(`Produk dengan SKU '${inputData.sku}' sudah terdaftar`);
    }

    // 3. Create product with immutable payload
    const newProduct = await prisma.product.create({
      data: {
        sku: inputData.sku,
        name: inputData.name,
        categoryId: inputData.categoryId,
        buyPrice: inputData.buyPrice,
        sellPrice: inputData.sellPrice,
        stock: inputData.stock,
        size: inputData.size || null,
        imageUrl: inputData.imageUrl || null,
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return ApiResponse.created(newProduct, `/api/v1/products/${newProduct.id}`);
  } catch (error) {
    console.error("Create Product API Error:", error);
    return ApiResponse.internal("Gagal menambahkan produk baru");
  }
}

