import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak ditemukan atau token tidak valid");
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized("Akun tidak ditemukan atau telah dinonaktifkan");
    }

    return ApiResponse.success({ user });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return ApiResponse.internal("Gagal memeriksa sesi pengguna");
  }
}
