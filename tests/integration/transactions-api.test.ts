import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET as getTransactionsHandler, POST as checkoutHandler } from "../../src/app/api/v1/transactions/route";
import { signToken } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";

export async function runTransactionsApiTests() {
  console.log("\n💳 --- INTEGRATION TESTS: /api/v1/transactions (POS Checkout) ---");
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
  const customer = await prisma.customer.findFirstOrThrow();
  const product = await prisma.product.findFirstOrThrow({
    where: { stock: { gte: 10 }, isActive: true },
  });

  const cashierToken = signToken({
    userId: cashier.id,
    email: cashier.email,
    name: cashier.name,
    role: "CASHIER",
  });

  const initialStock = product.stock;
  const buyQty = 2;
  const expectedItemSubtotal = product.sellPrice * buyQty;
  const itemDiscount = 5000;
  const txDiscount = 10000;
  const expectedGrandTotal = expectedItemSubtotal - itemDiscount - txDiscount;
  const cashPaid = expectedGrandTotal + 20000;
  const expectedChange = 20000;

  // 1. POST /transactions - Successful Checkout with Stock Decrement and Snapshot
  let createdTxId = "";
  let createdInvoiceNo = "";
  await test("POST /transactions processes checkout atomically and records immutable snapshot", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customer.id,
        paymentMethod: "CASH",
        cashPaid,
        discountAmount: txDiscount,
        notes: "Test Checkout Otomatis",
        items: [
          {
            productId: product.id,
            quantity: buyQty,
            discountAmount: itemDiscount,
          },
        ],
      }),
    });

    const res = await checkoutHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.invoiceNo.startsWith("INV-"));
    assert.strictEqual(json.data.totalAmount, expectedGrandTotal);
    assert.strictEqual(json.data.changeAmount, expectedChange);
    assert.strictEqual(json.data.items.length, 1);

    // Snapshot integrity verification
    const itemSnapshot = json.data.items[0];
    assert.strictEqual(itemSnapshot.sku, product.sku);
    assert.strictEqual(itemSnapshot.productName, product.name);
    assert.strictEqual(itemSnapshot.buyPrice, product.buyPrice);
    assert.strictEqual(itemSnapshot.unitPrice, product.sellPrice);
    assert.strictEqual(itemSnapshot.quantity, buyQty);

    createdTxId = json.data.id;
    createdInvoiceNo = json.data.invoiceNo;

    // Check DB stock decremented
    const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.strictEqual(productAfter.stock, initialStock - buyQty);
  });

  // 2. POST /transactions - Rejects Insufficient Cash Payment
  await test("POST /transactions rejects checkout if cashPaid < totalAmount", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod: "CASH",
        cashPaid: 5000, // much less than price
        discountAmount: 0,
        items: [
          {
            productId: product.id,
            quantity: 1,
            discountAmount: 0,
          },
        ],
      }),
    });

    const res = await checkoutHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(json.success, false);
  });

  // 3. POST /transactions - Rejects when Product Stock is Insufficient
  await test("POST /transactions aborts transaction when requested qty exceeds stock", async () => {
    const currentProd = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    const req = new NextRequest("http://localhost:3000/api/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod: "CASH",
        cashPaid: 100000000,
        items: [
          {
            productId: product.id,
            quantity: currentProd.stock + 999, // exceeds stock
            discountAmount: 0,
          },
        ],
      }),
    });

    const res = await checkoutHandler(req);
    const json = await res.json();

    assert.ok(res.status === 409 || res.status === 400, `Expected 409 or 400, got ${res.status}`);
    assert.strictEqual(json.success, false);
    assert.ok(json.error?.message?.includes("tidak mencukupi"));
  });

  // 4. GET /transactions - Transaction History with search and pagination
  await test("GET /transactions returns paginated history list", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/transactions?q=${createdInvoiceNo}`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });

    const res = await getTransactionsHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 1);
    assert.strictEqual(json.data[0].id, createdTxId);
  });

  return { suite: "Transactions API Tests", passed, failed };
}
