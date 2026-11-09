import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayCompletedTransactions,
      lowStockProducts,
      totalProductsCount,
      recentTransactions,
      categoriesCount,
    ] = await Promise.all([
      // 1. Today's transactions
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: todayStart },
          status: "COMPLETED",
        },
        select: {
          totalAmount: true,
        },
      }),

      // 2. Low stock products (<= 5)
      prisma.product.findMany({
        where: {
          stock: { lte: 5 },
          isActive: true,
        },
        select: {
          id: true,
          sku: true,
          name: true,
          size: true,
          stock: true,
          sellPrice: true,
        },
        take: 10,
        orderBy: { stock: "asc" },
      }),

      // 3. Total active products
      prisma.product.count({
        where: { isActive: true },
      }),

      // 4. 5 Most recent transactions
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          customer: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),

      // 5. Total categories
      prisma.category.count(),
    ]);

    const todaySales = todayCompletedTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const todayTransactionsCount = todayCompletedTransactions.length;

    const summaryData = {
      todaySales,
      todayTransactionsCount,
      lowStockCount: lowStockProducts.length,
      totalProductsCount,
      categoriesCount,
      lowStockProducts,
      recentTransactions,
    };

    return ApiResponse.success(summaryData);
  } catch (error) {
    console.error("Dashboard Summary API Error:", error);
    return ApiResponse.internal("Gagal memuat ringkasan dashboard");
  }
}

