import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET as getProductsHandler, POST as createProductHandler } from "../../src/app/api/v1/products/route";
import {
  GET as getSingleProductHandler,
  PATCH as updateProductHandler,
  DELETE as deleteProductHandler,
} from "../../src/app/api/v1/products/[id]/route";
import { signToken } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";

export async function runProductsApiTests() {
  console.log("\n👕 --- INTEGRATION TESTS: /api/v1/products/* ---");
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

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@razhcloth.com" } });
  const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "kasir@razhcloth.com" } });
  const category = await prisma.category.findFirstOrThrow();

  const adminToken = signToken({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    role: "ADMIN",
  });

  const cashierToken = signToken({
    userId: cashier.id,
    email: cashier.email,
    name: cashier.name,
    role: "CASHIER",
  });

  // 1. GET /products - List & Pagination
  await test("GET /products returns paginated products with metadata", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/products?page=1&limit=5", {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const res = await getProductsHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.meta);
    assert.strictEqual(json.meta.page, 1);
    assert.strictEqual(json.meta.perPage, 5);
  });

  // 2. GET /products - Search filter
  await test("GET /products filters by search query string", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/products?q=Kaos", {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const res = await getProductsHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    for (const item of json.data) {
      const match = item.name.toLowerCase().includes("kaos") || item.sku.toLowerCase().includes("kaos");
      assert.ok(match, `Item ${item.name} should match query`);
    }
  });

  // 3. POST /products - Cashier Forbidden (403)
  await test("POST /products returns 403 when non-admin attempts creation", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: "TEST-FORBIDDEN",
        name: "Produk Ilegal",
        categoryId: category.id,
        buyPrice: 50000,
        sellPrice: 90000,
        stock: 10,
      }),
    });
    const res = await createProductHandler(req);
    assert.strictEqual(res.status, 403);
  });

  // 4. POST /products - Validation Error (422) for Negative Price
  await test("POST /products rejects negative prices with 422", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: "TEST-NEG",
        name: "Produk Harga Minus",
        categoryId: category.id,
        buyPrice: -1000,
        sellPrice: 50000,
        stock: 10,
      }),
    });
    const res = await createProductHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 422);
    assert.strictEqual(json.error.code, "VALIDATION_ERROR");
  });

  // 5. POST /products - Admin Success (201)
  const testSku = `SKU-TEST-${Date.now()}`;
  let createdProductId = "";
  await test("POST /products creates product successfully by ADMIN", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: testSku,
        name: "Kemeja Flannel RAZH Exclusive",
        categoryId: category.id,
        buyPrice: 85000,
        sellPrice: 150000,
        stock: 30,
        size: "L",
      }),
    });
    const res = await createProductHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.sku, testSku);
    assert.strictEqual(json.data.stock, 30);
    createdProductId = json.data.id;
  });

  // 6. POST /products - Duplicate SKU Conflict (409)
  await test("POST /products returns 409 conflict when duplicate SKU submitted", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: testSku,
        name: "Kemeja Flannel Duplikat",
        categoryId: category.id,
        buyPrice: 85000,
        sellPrice: 150000,
        stock: 10,
      }),
    });
    const res = await createProductHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(json.error.code, "CONFLICT");
  });

  // 7. GET /products/:id - Single product detail
  await test("GET /products/:id returns specific product with category detail", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const res = await getSingleProductHandler(req, {
      params: Promise.resolve({ id: createdProductId }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.id, createdProductId);
    assert.ok(json.data.category);
  });

  // 8. PATCH /products/:id - Partial update
  await test("PATCH /products/:id partially updates stock and price", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sellPrice: 165000,
        stock: 35,
      }),
    });
    const res = await updateProductHandler(req, {
      params: Promise.resolve({ id: createdProductId }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.sellPrice, 165000);
    assert.strictEqual(json.data.stock, 35);
  });

  // 9. DELETE /products/:id - Soft-delete (Admin only)
  await test("DELETE /products/:id sets isActive to false (soft delete)", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const res = await deleteProductHandler(req, {
      params: Promise.resolve({ id: createdProductId }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.product.isActive, false);

    // Verify record still exists in database
    const dbRecord = await prisma.product.findUnique({ where: { id: createdProductId } });
    assert.ok(dbRecord !== null);
    assert.strictEqual(dbRecord.isActive, false);
  });

  return { suite: "Products API Integration Tests", passed, failed };
}

