import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET as getSummaryHandler } from "../../src/app/api/v1/reports/summary/route";
import { signToken } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";

export async function runReportsApiTests() {
  console.log("\n📊 --- INTEGRATION TESTS: /api/v1/reports/summary ---");
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`, err);
      failed++;
    }
  }

  const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "kasir@razhcloth.com" } });
  const token = signToken({
    userId: cashier.id,
    email: cashier.email,
    name: cashier.name,
    role: "CASHIER",
  });

  // 1. GET /reports/summary - Unauthenticated 401
  await test("GET /reports/summary returns 401 when no token is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/reports/summary");
    const res = await getSummaryHandler(req);
    assert.strictEqual(res.status, 401);
  });

  // 2. GET /reports/summary - Authenticated returns KPI numbers
  await test("GET /reports/summary returns accurate sales, counts, and low stock metrics", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/reports/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getSummaryHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(typeof json.data.todaySales === "number");
    assert.ok(typeof json.data.todayTransactionsCount === "number");
    assert.ok(typeof json.data.lowStockCount === "number");
    assert.ok(typeof json.data.totalProductsCount === "number");
    assert.ok(typeof json.data.categoriesCount === "number");
    assert.ok(Array.isArray(json.data.lowStockProducts));
    assert.ok(Array.isArray(json.data.recentTransactions));

    // Verify lowStockProducts actually have stock <= 5
    for (const item of json.data.lowStockProducts) {
      assert.ok(item.stock <= 5, `Product ${item.name} has stock ${item.stock} which should be <= 5`);
    }
  });

  return { suite: "Reports API Tests", passed, failed };
}

