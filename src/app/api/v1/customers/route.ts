import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter"),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

// GET /api/v1/customers (List customers for cashier checkout dropdown)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const whereClause: {
      OR?: Array<{ name?: { contains: string }; phone?: { contains: string } }>;
    } = {};

    if (q) {
      whereClause.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      take: 50,
    });

    return ApiResponse.success(customers);
  } catch (error) {
    console.error("List Customers Error:", error);
    return ApiResponse.internal("Gagal memuat data pelanggan");
  }
}

// POST /api/v1/customers (Quick create customer)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return ApiResponse.badRequest("Payload JSON tidak valid");
    }

    const parsed = customerSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Validasi data pelanggan gagal", details);
    }

    const { name, phone, address } = parsed.data;

    // Check duplicate phone if provided
    if (phone) {
      const existing = await prisma.customer.findUnique({
        where: { phone },
      });
      if (existing) {
        return ApiResponse.conflict("Nomor telepon pelanggan sudah terdaftar");
      }
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
      },
    });

    return ApiResponse.created(newCustomer, `/api/v1/customers/${newCustomer.id}`);
  } catch (error) {
    console.error("Create Customer Error:", error);
    return ApiResponse.internal("Gagal mendaftarkan pelanggan baru");
  }
}

