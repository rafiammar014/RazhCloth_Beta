import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

// Schema for transaction checkout
const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID wajib diisi"),
  quantity: z.number().int().min(1, "Kuantitas minimal 1"),
  discountAmount: z.number().min(0, "Diskon item tidak boleh negatif").default(0),
});

const checkoutSchema = z.object({
  customerId: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "DEBIT", "QRIS"]).default("CASH"),
  cashPaid: z.number().min(0).optional().nullable(),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().max(255).optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, "Keranjang belanja tidak boleh kosong"),
});

// GET /api/v1/transactions (List transaction history)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const status = searchParams.get("status")?.trim();
    const q = searchParams.get("q")?.trim();

    const whereClause: {
      status?: string;
      OR?: Array<{ invoiceNo?: { contains: string } }>;
    } = {};

    if (status) {
      whereClause.status = status;
    }

    if (q) {
      whereClause.OR = [{ invoiceNo: { contains: q } }];
    }

    const offset = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return ApiResponse.collection(transactions, {
      total,
      page,
      perPage: limit,
      totalPages,
    });
  } catch (error) {
    console.error("List Transactions Error:", error);
    return ApiResponse.internal("Gagal memuat riwayat transaksi");
  }
}

// POST /api/v1/transactions (Process POS Checkout)
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

    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return ApiResponse.unprocessable("Data transaksi tidak valid", details);
    }

    const checkoutData = parsed.data;

    // 1. Fetch all requested products from DB to verify price and stock
    const productIds = checkoutData.items.map((i) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    const productMap = new Map(existingProducts.map((p) => [p.id, p]));

    // Check if any product is missing/inactive
    for (const item of checkoutData.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return ApiResponse.badRequest(
          `Produk dengan ID '${item.productId}' tidak ditemukan atau sedang dinonaktifkan`
        );
      }
      if (prod.stock < item.quantity) {
        return ApiResponse.conflict(
          `Stok untuk "${prod.name}" (Ukuran: ${prod.size || "ALL"}) tidak mencukupi. Tersedia: ${prod.stock}, diminta: ${item.quantity}`
        );
      }
    }

    // 2. Calculate subtotal, item totals, and grand total
    let calculatedSubtotal = 0;
    const itemsWithSnapshot = checkoutData.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      const itemSubtotal = prod.sellPrice * item.quantity;
      const itemDiscount = item.discountAmount || 0;
      const itemTotalPrice = Math.max(0, itemSubtotal - itemDiscount);

      calculatedSubtotal += itemTotalPrice;

      return {
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        size: prod.size || null,
        buyPrice: prod.buyPrice,
        unitPrice: prod.sellPrice,
        quantity: item.quantity,
        discountAmount: itemDiscount,
        totalPrice: itemTotalPrice,
      };
    });

    const grandTotal = Math.max(0, calculatedSubtotal - (checkoutData.discountAmount || 0));

    // Calculate change for CASH payment
    let changeAmount = 0;
    if (checkoutData.paymentMethod === "CASH") {
      const cash = checkoutData.cashPaid || 0;
      if (cash < grandTotal) {
        return ApiResponse.badRequest(
          `Uang tunai yang dibayarkan (Rp ${cash.toLocaleString("id-ID")}) kurang dari total tagihan (Rp ${grandTotal.toLocaleString("id-ID")})`
        );
      }
      changeAmount = cash - grandTotal;
    }

    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    let invoiceNo = generateInvoiceNumber();
    // Ensure invoice uniqueness
    while (await prisma.transaction.findUnique({ where: { invoiceNo } })) {
      invoiceNo = generateInvoiceNumber();
    }

    // 3. Execute atomic transaction
    const newTransaction = await prisma.$transaction(async (tx) => {
      // A. Decrement stock with race-condition guard
      for (const item of checkoutData.items) {
        const prod = productMap.get(item.productId)!;
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          throw new Error(
            `Gagal memproses stok: Stok untuk "${prod.name}" berubah atau telah habis.`
          );
        }
      }

      // B. Insert Transaction record
      const createdTx = await tx.transaction.create({
        data: {
          invoiceNo,
          userId: authUser.userId,
          customerId: checkoutData.customerId || null,
          subtotal: calculatedSubtotal,
          discountAmount: checkoutData.discountAmount || 0,
          totalAmount: grandTotal,
          paymentMethod: checkoutData.paymentMethod,
          cashPaid: checkoutData.paymentMethod === "CASH" ? (checkoutData.cashPaid || grandTotal) : null,
          changeAmount: checkoutData.paymentMethod === "CASH" ? changeAmount : null,
          status: "COMPLETED",
          notes: checkoutData.notes || null,
          items: {
            create: itemsWithSnapshot,
          },
        },
        include: {
          user: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
        },
      });

      return createdTx;
    });

    return ApiResponse.created(newTransaction, `/api/v1/transactions/${newTransaction.id}`);
  } catch (error) {
    console.error("Checkout Transaction Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses transaksi kasir";
    return ApiResponse.badRequest(message);
  }
}

