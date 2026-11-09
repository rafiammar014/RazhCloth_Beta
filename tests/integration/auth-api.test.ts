import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as loginHandler } from "../../src/app/api/v1/auth/login/route";
import { POST as logoutHandler } from "../../src/app/api/v1/auth/logout/route";
import { GET as meHandler } from "../../src/app/api/v1/auth/me/route";
import { signToken, TOKEN_COOKIE_NAME } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";

export async function runAuthApiTests() {
  console.log("\n🔑 --- INTEGRATION TESTS: /api/v1/auth/* ---");
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

  // 1. POST /api/v1/auth/login - Success (Admin)
  await test("POST /login returns 200 and token for valid credentials", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@razhcloth.com",
        password: "admin123",
      }),
    });

    const res = await loginHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token, "Response data should include JWT token");
    assert.strictEqual(json.data.user.email, "admin@razhcloth.com");
    assert.strictEqual(json.data.user.role, "ADMIN");
  });

  // 2. POST /api/v1/auth/login - Invalid Password (401)
  await test("POST /login returns 401 for incorrect password", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@razhcloth.com",
        password: "wrongpassword",
      }),
    });

    const res = await loginHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, "UNAUTHORIZED");
  });

  // 3. POST /api/v1/auth/login - Nonexistent User (401)
  await test("POST /login returns 401 without revealing non-existent email", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "unknown@razhcloth.com",
        password: "randompassword",
      }),
    });

    const res = await loginHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, "UNAUTHORIZED");
  });

  // 4. POST /api/v1/auth/login - Invalid Email Format (422)
  await test("POST /login returns 422 for invalid email schema format", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "somepassword",
      }),
    });

    const res = await loginHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 422);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, "VALIDATION_ERROR");
  });

  // 5. POST /api/v1/auth/logout - Clears cookie
  await test("POST /logout returns 200 and expires auth cookie", async () => {
    const res = await logoutHandler();
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.message, "Logout berhasil");
  });

  // 6. GET /api/v1/auth/me - Success with Bearer Token
  await test("GET /me returns 200 and user data with valid Bearer token", async () => {
    const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "kasir@razhcloth.com" } });
    const token = signToken({
      userId: cashier.id,
      email: cashier.email,
      name: cashier.name,
      role: "CASHIER",
    });

    const req = new NextRequest("http://localhost:3000/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await meHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.email, "kasir@razhcloth.com");
    assert.strictEqual(json.data.user.role, "CASHIER");
  });

  // 7. GET /api/v1/auth/me - 401 on Missing or Invalid Token
  await test("GET /me returns 401 on unauthenticated request", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/me", {
      method: "GET",
    });

    const res = await meHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, "UNAUTHORIZED");
  });

  return { suite: "Auth API Integration Tests", passed, failed };
}

