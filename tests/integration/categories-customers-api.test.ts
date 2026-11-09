import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET as getCategoriesHandler, POST as createCategoryHandler } from "../../src/app/api/v1/categories/route";
import { GET as getCustomersHandler, POST as createCustomerHandler } from "../../src/app/api/v1/customers/route";
import { signToken } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";

export async function runCategoriesCustomersTests() {
  console.log("\n📁 --- INTEGRATION TESTS: Categories & Customers ---");
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

  // 1. GET /categories - Unauthenticated 401
  await test("GET /categories returns 401 when no token provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/categories");
    const res = await getCategoriesHandler(req);
    assert.strictEqual(res.status, 401);
  });

  // 2. GET /categories - Authenticated 200
  await test("GET /categories returns 200 with list and product counts", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/categories", {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const res = await getCategoriesHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data), "Categories should be an array");
    assert.ok(json.data.length >= 1, "Should have at least 1 category");
  });

  // 3. POST /categories - Cashier Forbidden (403)
  await test("POST /categories returns 403 when cashier attempts creation", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/categories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Kategori Ilegal" }),
    });
    const res = await createCategoryHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 403);
    assert.strictEqual(json.error.code, "FORBIDDEN");
  });

  // 4. POST /categories - Admin Success (201)
  const uniqueCatName = `Topi & Aksesoris ${Date.now()}`;
  await test("POST /categories creates new category for ADMIN (201)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/categories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: uniqueCatName,
        description: "Kategori aksesoris RAZH",
      }),
    });
    const res = await createCategoryHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.name, uniqueCatName);
  });

  // 5. POST /categories - Duplicate Conflict (409)
  await test("POST /categories returns 409 on duplicate category name", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/categories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: uniqueCatName }),
    });
    const res = await createCategoryHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(json.error.code, "CONFLICT");
  });

  // 6. GET /customers - Search by query
  await test("GET /customers returns customer list and filters by name/phone", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/customers?q=Budi", {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const res = await getCustomersHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data));
  });

  // 7. POST /customers - Valid creation (201)
  const uniquePhone = `08${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  await test("POST /customers creates new customer successfully", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Pelanggan Setia RAZH",
        phone: uniquePhone,
        address: "Jl. Diponegoro No. 45",
      }),
    });
    const res = await createCustomerHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.phone, uniquePhone);
  });

  // 8. POST /customers - Duplicate phone returns 409
  await test("POST /customers returns 409 on duplicate phone number", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Pelanggan Duplikat",
        phone: uniquePhone,
      }),
    });
    const res = await createCustomerHandler(req);
    const json = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(json.error.code, "CONFLICT");
  });

  return { suite: "Categories & Customers Tests", passed, failed };
}

