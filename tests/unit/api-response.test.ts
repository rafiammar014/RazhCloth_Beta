import assert from "node:assert/strict";
import { TestRunner } from "../test-helper";
import { ApiResponse } from "../../src/lib/api-response";

export async function runApiResponseUnitTests(runner: TestRunner) {
  await runner.describe("Unit Tests: ApiResponse Helper (src/lib/api-response.ts)", async () => {
    // 1. Success response
    await runner.test("ApiResponse.success returns 200 with data", async () => {
      const res = ApiResponse.success({ id: "123", name: "Test" });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.deepEqual(json.data, { id: "123", name: "Test" });
    });

    // 2. Created response
    await runner.test("ApiResponse.created returns 201 with Location header", async () => {
      const res = ApiResponse.created({ id: "prod-1" }, "/api/v1/products/prod-1");
      assert.equal(res.status, 201);
      assert.equal(res.headers.get("Location"), "/api/v1/products/prod-1");
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, "prod-1");
    });

    // 3. Collection response
    await runner.test("ApiResponse.collection returns 200 with meta pagination", async () => {
      const meta = { total: 100, page: 2, perPage: 10, totalPages: 10 };
      const res = ApiResponse.collection([{ id: 1 }, { id: 2 }], meta);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.length, 2);
      assert.deepEqual(json.meta, meta);
    });

    // 4. Bad Request (400)
    await runner.test("ApiResponse.badRequest returns 400 with BAD_REQUEST code", async () => {
      const res = ApiResponse.badRequest("Payload tidak valid");
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "BAD_REQUEST");
      assert.equal(json.error.message, "Payload tidak valid");
    });

    // 5. Unauthorized (401)
    await runner.test("ApiResponse.unauthorized returns 401 with UNAUTHORIZED code", async () => {
      const res = ApiResponse.unauthorized("Token expired");
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "UNAUTHORIZED");
    });

    // 6. Forbidden (403)
    await runner.test("ApiResponse.forbidden returns 403 with FORBIDDEN code", async () => {
      const res = ApiResponse.forbidden("Admin only");
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "FORBIDDEN");
    });

    // 7. Not Found (404)
    await runner.test("ApiResponse.notFound returns 404 with NOT_FOUND code", async () => {
      const res = ApiResponse.notFound("Product not found");
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "NOT_FOUND");
    });

    // 8. Conflict (409)
    await runner.test("ApiResponse.conflict returns 409 with CONFLICT code", async () => {
      const res = ApiResponse.conflict("SKU already exists");
      assert.equal(res.status, 409);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "CONFLICT");
    });

    // 9. Unprocessable (422) with field details
    await runner.test("ApiResponse.unprocessable returns 422 with validation details", async () => {
      const details = [
        { field: "price", message: "Price must be positive" },
        { field: "sku", message: "SKU required" },
      ];
      const res = ApiResponse.unprocessable("Validation error", details);
      assert.equal(res.status, 422);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
      assert.equal(json.error.details.length, 2);
      assert.equal(json.error.details[0].field, "price");
    });

    // 10. Internal (500)
    await runner.test("ApiResponse.internal returns 500 with INTERNAL_ERROR code", async () => {
      const res = ApiResponse.internal("DB failure");
      assert.equal(res.status, 500);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "INTERNAL_ERROR");
    });
  });

  return runner.finishSuite();
}
