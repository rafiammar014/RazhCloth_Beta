import assert from "node:assert/strict";
import { prisma } from "../../src/lib/prisma";
import { TestRunner, createTestRequest, parseResponse, getTestTokens } from "../test-helper";
import { GET as getReportsSummary } from "../../src/app/api/v1/reports/summary/route";

export async function runReportsSummaryIntegrationTests(runner: TestRunner) {
  const { adminToken, cashierToken } = await getTestTokens();

  await runner.describe("Integration Tests: Reports Summary Endpoint (/api/v1/reports/summary)", async () => {
    // 1. Unauthorized
    await runner.test("GET /api/v1/reports/summary - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/reports/summary");
      const res = await getReportsSummary(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    // 2. Success by Cashier
    await runner.test("GET /api/v1/reports/summary - Success: 200 for cashier", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/reports/summary", {
        token: cashierToken,
      });
      const res = await getReportsSummary(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(typeof body.data.todaySales === "number");
      assert.ok(typeof body.data.todayTransactionsCount === "number");
      assert.ok(typeof body.data.lowStockCount === "number");
      assert.ok(typeof body.data.totalProductsCount === "number");
      assert.ok(typeof body.data.categoriesCount === "number");
      assert.ok(Array.isArray(body.data.lowStockProducts));
      assert.ok(Array.isArray(body.data.recentTransactions));
    });

    // 3. Success by Admin and Metric Accuracy
    await runner.test("GET /api/v1/reports/summary - Accuracy: matches database state", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/reports/summary", {
        token: adminToken,
      });
      const res = await getReportsSummary(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      const summary = body.data;

      // Verify low stock logic: all products in lowStockProducts must have stock <= 5
      for (const prod of summary.lowStockProducts) {
        assert.ok(
          prod.stock <= 5,
          `Product ${prod.name} in low stock list must have stock <= 5, was ${prod.stock}`
        );
      }

      // Verify total products count matches DB
      const dbProductCount = await prisma.product.count({ where: { isActive: true } });
      assert.equal(summary.totalProductsCount, dbProductCount);

      // Verify categories count matches DB
      const dbCategoriesCount = await prisma.category.count();
      assert.equal(summary.categoriesCount, dbCategoriesCount);

      // Verify todaySales calculation
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTx = await prisma.transaction.findMany({
        where: { createdAt: { gte: todayStart }, status: "COMPLETED" },
        select: { totalAmount: true },
      });
      const calculatedTodaySales = todayTx.reduce((sum, t) => sum + t.totalAmount, 0);

      assert.equal(summary.todaySales, calculatedTodaySales, "todaySales must match sum of today's transactions");
      assert.equal(summary.todayTransactionsCount, todayTx.length);
    });
  });

  return runner.finishSuite();
}
