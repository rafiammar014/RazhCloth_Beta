import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { verifyPassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

// Strict Zod schema for input validation
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return ApiResponse.badRequest("Payload JSON tidak valid");
    }

    const parsed = loginSchema.safeParse(rawBody);

    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Validasi data login gagal", details);
    }

    const { email, password } = parsed.data;

    // Parameterized Prisma query (prevents SQL Injection)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Do not disclose whether email exists or not (Security standard)
      return ApiResponse.unauthorized("Email atau password tidak sesuai");
    }

    if (!user.isActive) {
      return ApiResponse.forbidden("Akun Anda telah dinonaktifkan. Hubungi pemilik toko.");
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Email atau password tidak sesuai");
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "CASHIER",
    };

    const token = signToken(tokenPayload);

    // Build immutable response data
    const responseData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    const response = NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );

    // Secure HTTP-Only Cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return ApiResponse.internal("Terjadi kesalahan internal server saat memproses login");
  }
}
