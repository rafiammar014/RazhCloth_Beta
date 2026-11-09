import assert from "node:assert/strict";
import { TestRunner, createTestRequest, parseResponse, getTestTokens } from "../test-helper";
import { POST as loginRoute } from "../../src/app/api/v1/auth/login/route";
import { POST as logoutRoute } from "../../src/app/api/v1/auth/logout/route";
import { GET as meRoute } from "../../src/app/api/v1/auth/me/route";

export async function runAuthIntegrationTests(runner: TestRunner) {
  const { adminToken, cashierToken, inactiveToken } = await getTestTokens();

  await runner.describe("Integration Tests: Auth Endpoints (/api/v1/auth/*)", async () => {
    // -------------------------------------------------------------
    // POST /api/v1/auth/login
    // -------------------------------------------------------------
    await runner.test("POST /api/v1/auth/login - Success (Admin Login 200)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "admin@razhcloth.com",
          password: "admin123",
        },
      });

      const res = await loginRoute(req);
      const { status, body, headers } = await parseResponse(res);

      assert.equal(status, 200, "Should return HTTP 200");
      assert.equal(body.success, true);
      assert.ok(body.data.token, "Response must contain JWT token");
      assert.equal(body.data.user.email, "admin@razhcloth.com");
      assert.equal(body.data.user.role, "ADMIN");

      const setCookie = headers.get("set-cookie") || "";
      assert.ok(setCookie.includes("razh_pos_token"), "Must set HTTP-Only cookie");
    });

    await runner.test("POST /api/v1/auth/login - Success (Cashier Login 200)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "kasir@razhcloth.com",
          password: "kasir123",
        },
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.user.role, "CASHIER");
    });

    await runner.test("POST /api/v1/auth/login - Fail: 401 on wrong password", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "admin@razhcloth.com",
          password: "wrongPassword999",
        },
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401, "Must return 401 Unauthorized");
      assert.equal(body.success, false);
      assert.equal(body.error.code, "UNAUTHORIZED");
      assert.equal(body.error.message, "Email atau password tidak sesuai");
    });

    await runner.test("POST /api/v1/auth/login - Fail: 401 on non-existent email", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "unknown-ghost@razhcloth.com",
          password: "somepassword",
        },
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.success, false);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("POST /api/v1/auth/login - Fail: 403 on deactivated account", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "inactive@razhcloth.com",
          password: "inactive123",
        },
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 403, "Deactivated account must return 403 Forbidden");
      assert.equal(body.success, false);
      assert.equal(body.error.code, "FORBIDDEN");
      assert.ok(body.error.message.includes("dinonaktifkan"));
    });

    await runner.test("POST /api/v1/auth/login - Fail: 400 on malformed JSON", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        rawBody: "{malformed: json",
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400, "Malformed JSON must return 400 Bad Request");
      assert.equal(body.error.code, "BAD_REQUEST");
    });

    await runner.test("POST /api/v1/auth/login - Fail: 422 on invalid email format", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "not-an-email",
          password: "validpassword123",
        },
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422, "Invalid email must return 422 Unprocessable");
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.details.some((d: any) => d.field === "email"));
    });

    await runner.test("POST /api/v1/auth/login - Fail: 422 on empty password", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "admin@razhcloth.com",
          password: "",
        },
      });

      const res = await loginRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.details.some((d: any) => d.field === "password"));
    });

    // -------------------------------------------------------------
    // POST /api/v1/auth/logout
    // -------------------------------------------------------------
    await runner.test("POST /api/v1/auth/logout - Success (200 & clears cookie)", async () => {
      const res = await logoutRoute();
      const { status, body, headers } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.message, "Logout berhasil");

      const setCookie = headers.get("set-cookie") || "";
      assert.ok(setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0") || setCookie.includes("Expires="));
    });

    // -------------------------------------------------------------
    // GET /api/v1/auth/me
    // -------------------------------------------------------------
    await runner.test("GET /api/v1/auth/me - Success (Admin Profile 200)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/me", {
        method: "GET",
        token: adminToken,
      });

      const res = await meRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.user.email, "admin@razhcloth.com");
      assert.equal(body.data.user.role, "ADMIN");
      assert.equal(body.data.user.isActive, true);
    });

    await runner.test("GET /api/v1/auth/me - Success (Cashier Profile 200)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/me", {
        method: "GET",
        token: cashierToken,
      });

      const res = await meRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.user.role, "CASHIER");
    });

    await runner.test("GET /api/v1/auth/me - Fail: 401 when token is missing", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/me", {
        method: "GET",
      });

      const res = await meRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/auth/me - Fail: 401 when token is tampered/invalid", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/me", {
        method: "GET",
        token: "fake.tampered.token.123",
      });

      const res = await meRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/auth/me - Fail: 401 when user account is deactivated in DB", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/auth/me", {
        method: "GET",
        token: inactiveToken,
      });

      const res = await meRoute(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
      assert.ok(body.error.message.includes("dinonaktifkan"));
    });
  });

  return runner.finishSuite();
}
