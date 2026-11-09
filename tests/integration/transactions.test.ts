import assert from "node:assert/strict";
import { prisma } from "../../src/lib/prisma";
import { TestRunner, createTestRequest, parseResponse, getTestTokens } from "../test-helper";
import { GET as listTransactions, POST as checkoutTransaction } from "../../src/app/api/v1/transactions/route";

export async function runTransactionsIntegrationTests(runner: TestRunner) {
  const { cashierToken } = await getTestTokens();

  // Find a customer and an active product with stock >= 10
  const customer = await prisma.customer.findFirstOrThrow();
  const testProduct = await prisma.product.findFirstOrThrow({
    where: { isActive: true, stock: { gte: 10 } },
  });

  await runner.describe("Integration Tests: Transactions & POS Checkout Endpoints", async () => {
    // ══════════════════════════════════════════════════════════════
    // GET /api/v1/transactions (History)
    // ══════════════════════════════════════════════════════════════

    await runner.test("GET /api/v1/transactions - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions");
      const res = await listTransactions(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/transactions - Success: 200 with pagination", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions?limit=10", {
        token: cashierToken,
      });
      const res = await listTransactions(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta !== undefined);
      assert.equal(body.meta.perPage, 10);
    });

    await runner.test("GET /api/v1/transactions - Filter: by status (?status=COMPLETED)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions?status=COMPLETED", {
        token: cashierToken,
      });
      const res = await listTransactions(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.ok(body.data.every((tx: any) => tx.status === "COMPLETED"));
    });

    // ══════════════════════════════════════════════════════════════
    // POST /api/v1/transactions (POS Checkout & Guard Validations)
    // ══════════════════════════════════════════════════════════════

    await runner.test("POST /api/v1/transactions - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        body: {
          items: [{ productId: testProduct.id, quantity: 1 }],
        },
      });
      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("POST /api/v1/transactions - Fail: 400 on malformed JSON", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        rawBody: "{broken: json",
      });
      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400);
      assert.equal(body.error.code, "BAD_REQUEST");
    });

    await runner.test("POST /api/v1/transactions - Fail: 422 on empty cart (items: [])", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        body: {
          customerId: customer.id,
          paymentMethod: "CASH",
          items: [],
        },
      });
      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    await runner.test("POST /api/v1/transactions - Fail: 400 when product does not exist", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        body: {
          items: [{ productId: "non-existent-product-id", quantity: 1 }],
        },
      });
      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400);
      assert.ok(body.error.message.includes("tidak ditemukan"));
    });

    await runner.test("POST /api/v1/transactions - Fail: 409 Conflict on Insufficient Stock", async () => {
      const currentStock = testProduct.stock;
      const excessiveQty = currentStock + 500;

      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        body: {
          customerId: customer.id,
          paymentMethod: "CASH",
          items: [{ productId: testProduct.id, quantity: excessiveQty }],
        },
      });
      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 409, "Must return 409 Conflict when stock is insufficient");
      assert.equal(body.error.code, "CONFLICT");
      assert.ok(body.error.message.includes("tidak mencukupi"));
    });

    await runner.test("POST /api/v1/transactions - Fail: 400 when cashPaid < totalAmount (CASH)", async () => {
      const buyQty = 2;
      const totalCost = testProduct.sellPrice * buyQty;
      const underpaidCash = totalCost - 10000; // Kurang Rp 10.000

      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        body: {
          customerId: customer.id,
          paymentMethod: "CASH",
          cashPaid: underpaidCash,
          items: [{ productId: testProduct.id, quantity: buyQty }],
        },
      });
      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400);
      assert.ok(body.error.message.includes("kurang dari total tagihan"));
    });

    // ══════════════════════════════════════════════════════════════
    // SUCCESSFUL CHECKOUT FLOW & GUARDS
    // ══════════════════════════════════════════════════════════════

    let lastCreatedInvoice = "";

    await runner.test("POST /api/v1/transactions - Success: 201 CASH Checkout with change & snapshot", async () => {
      // Refresh current stock
      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
      const initialStock = prodBefore.stock;
      const buyQty = 2;
      const itemSubtotal = prodBefore.sellPrice * buyQty;
      const itemDiscount = 5000;
      const txDiscount = 2000;
      const expectedTotal = itemSubtotal - itemDiscount - txDiscount;
      const cashGiven = expectedTotal + 25000; // Kembalian Rp 25.000
      const expectedChange = 25000;

      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        body: {
          customerId: customer.id,
          paymentMethod: "CASH",
          cashPaid: cashGiven,
          discountAmount: txDiscount,
          notes: "Pelanggan setia RAZH CLOTH",
          items: [
            {
              productId: prodBefore.id,
              quantity: buyQty,
              discountAmount: itemDiscount,
            },
          ],
        },
      });

      const res = await checkoutTransaction(req);
      const { status, body, headers } = await parseResponse(res);

      assert.equal(status, 201);
      assert.equal(body.success, true);
      const tx = body.data;

      // 1. Invoice Number format verification
      assert.ok(/^INV-\d{8}-\d{4}$/.test(tx.invoiceNo), `Invoice ${tx.invoiceNo} must match INV format`);
      lastCreatedInvoice = tx.invoiceNo;

      // 2. Financial calculation verification
      assert.equal(tx.subtotal, itemSubtotal - itemDiscount);
      assert.equal(tx.discountAmount, txDiscount);
      assert.equal(tx.totalAmount, expectedTotal);
      assert.equal(tx.cashPaid, cashGiven);
      assert.equal(tx.changeAmount, expectedChange, "Change amount must be accurately calculated");
      assert.equal(tx.status, "COMPLETED");

      // 3. Snapshot verification (Immutable sales data)
      assert.equal(tx.items.length, 1);
      const item = tx.items[0];
      assert.equal(item.sku, prodBefore.sku, "Snapshot SKU preserved");
      assert.equal(item.productName, prodBefore.name, "Snapshot Product Name preserved");
      assert.equal(item.buyPrice, prodBefore.buyPrice, "Snapshot buyPrice (HPP) preserved for profit analytics");
      assert.equal(item.unitPrice, prodBefore.sellPrice, "Snapshot unitPrice preserved");
      assert.equal(item.quantity, buyQty);
      assert.equal(item.totalPrice, itemSubtotal - itemDiscount);

      // 4. Stock Decrement Guard verification in Database
      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
      assert.equal(
        prodAfter.stock,
        initialStock - buyQty,
        `Stock must decrement exactly: was ${initialStock}, now ${prodAfter.stock}`
      );
    });

    await runner.test("POST /api/v1/transactions - Success: 201 QRIS Checkout (changeAmount is null)", async () => {
      const prodBefore = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
      const initialStock = prodBefore.stock;
      const buyQty = 1;

      const req = createTestRequest("http://localhost:3000/api/v1/transactions", {
        method: "POST",
        token: cashierToken,
        body: {
          paymentMethod: "QRIS",
          items: [{ productId: prodBefore.id, quantity: buyQty }],
        },
      });

      const res = await checkoutTransaction(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.paymentMethod, "QRIS");
      assert.equal(body.data.changeAmount, null, "QRIS has no change calculation");

      const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
      assert.equal(prodAfter.stock, initialStock - buyQty);
    });

    await runner.test("GET /api/v1/transactions - Search: locate newly created invoice (?q=...)", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/transactions?q=${encodeURIComponent(lastCreatedInvoice)}`, {
        token: cashierToken,
      });
      const res = await listTransactions(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.ok(body.data.length >= 1);
      assert.equal(body.data[0].invoiceNo, lastCreatedInvoice);
      assert.ok(body.data[0].items.length >= 1);
    });
  });

  return runner.finishSuite();
}
