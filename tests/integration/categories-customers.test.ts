import assert from "node:assert/strict";
import { TestRunner, createTestRequest, parseResponse, getTestTokens } from "../test-helper";
import { GET as getCategories, POST as postCategory } from "../../src/app/api/v1/categories/route";
import { GET as getCustomers, POST as postCustomer } from "../../src/app/api/v1/customers/route";

export async function runCategoriesCustomersIntegrationTests(runner: TestRunner) {
  const { adminToken, cashierToken } = await getTestTokens();

  await runner.describe("Integration Tests: Categories & Customers Endpoints", async () => {
    // ══════════════════════════════════════════════════════════════
    // CATEGORIES ENDPOINTS
    // ══════════════════════════════════════════════════════════════

    await runner.test("GET /api/v1/categories - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories");
      const res = await getCategories(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/categories - Success: 200 with categories list and product counts", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        token: cashierToken,
      });
      const res = await getCategories(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data), "Categories must be an array");
      assert.ok(body.data.length > 0, "Categories should not be empty");
      assert.ok(body.data[0]._count !== undefined, "Should include product count");
    });

    await runner.test("POST /api/v1/categories - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        method: "POST",
        body: { name: "Test Cat" },
      });
      const res = await postCategory(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("POST /api/v1/categories - Fail: 403 when cashier tries to create category", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        method: "POST",
        token: cashierToken,
        body: { name: "Forbidden Cat" },
      });
      const res = await postCategory(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 403, "Cashier cannot create categories");
      assert.equal(body.error.code, "FORBIDDEN");
    });

    await runner.test("POST /api/v1/categories - Fail: 400 on malformed JSON", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        method: "POST",
        token: adminToken,
        rawBody: "{malformed-json",
      });
      const res = await postCategory(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400);
      assert.equal(body.error.code, "BAD_REQUEST");
    });

    await runner.test("POST /api/v1/categories - Fail: 422 on name shorter than 2 chars", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        method: "POST",
        token: adminToken,
        body: { name: "A" },
      });
      const res = await postCategory(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.details.some((d: any) => d.field === "name"));
    });

    const uniqueCatName = `Topi Custom ${Date.now()}`;

    await runner.test("POST /api/v1/categories - Success: 201 on valid input by Admin", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        method: "POST",
        token: adminToken,
        body: {
          name: uniqueCatName,
          description: "Kategori aksesoris topi custom",
        },
      });
      const res = await postCategory(req);
      const { status, body, headers } = await parseResponse(res);

      assert.equal(status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.name, uniqueCatName);
      assert.ok(headers.get("Location")?.includes(body.data.id));
    });

    await runner.test("POST /api/v1/categories - Fail: 409 Conflict on duplicate category name", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/categories", {
        method: "POST",
        token: adminToken,
        body: {
          name: uniqueCatName,
          description: "Duplicate attempt",
        },
      });
      const res = await postCategory(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 409, "Must return 409 Conflict for duplicate name");
      assert.equal(body.error.code, "CONFLICT");
    });

    // ══════════════════════════════════════════════════════════════
    // CUSTOMERS ENDPOINTS
    // ══════════════════════════════════════════════════════════════

    await runner.test("GET /api/v1/customers - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/customers");
      const res = await getCustomers(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/customers - Success: 200 list of customers", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/customers", {
        token: cashierToken,
      });
      const res = await getCustomers(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    const uniquePhone = `08${Date.now().toString().slice(-9)}`;
    const uniqueCustomerName = `Budi Santoso ${Date.now().toString().slice(-4)}`;

    await runner.test("POST /api/v1/customers - Fail: 422 on name shorter than 2 chars", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/customers", {
        method: "POST",
        token: cashierToken,
        body: { name: "X", phone: uniquePhone },
      });
      const res = await postCustomer(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    await runner.test("POST /api/v1/customers - Fail: 400 on malformed JSON", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/customers", {
        method: "POST",
        token: cashierToken,
        rawBody: "{malformed-json",
      });
      const res = await postCustomer(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400);
      assert.equal(body.error.code, "BAD_REQUEST");
    });

    await runner.test("POST /api/v1/customers - Success: 201 on valid customer registration", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/customers", {
        method: "POST",
        token: cashierToken,
        body: {
          name: uniqueCustomerName,
          phone: uniquePhone,
          address: "Jl. Sukajadi No. 45, Bandung",
        },
      });
      const res = await postCustomer(req);
      const { status, body, headers } = await parseResponse(res);

      assert.equal(status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.name, uniqueCustomerName);
      assert.equal(body.data.phone, uniquePhone);
      assert.ok(headers.get("Location")?.includes(body.data.id));
    });

    await runner.test("POST /api/v1/customers - Fail: 409 Conflict on duplicate phone number", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/customers", {
        method: "POST",
        token: cashierToken,
        body: {
          name: "Other Customer",
          phone: uniquePhone,
        },
      });
      const res = await postCustomer(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 409);
      assert.equal(body.error.code, "CONFLICT");
    });

    await runner.test("GET /api/v1/customers - Filter: search by name or phone query (?q=...)", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/customers?q=${encodeURIComponent(uniquePhone)}`, {
        token: cashierToken,
      });
      const res = await getCustomers(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.ok(body.data.length >= 1, "Should find the created customer by phone");
      assert.equal(body.data[0].phone, uniquePhone);
    });
  });

  return runner.finishSuite();
}
