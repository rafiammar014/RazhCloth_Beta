import assert from "node:assert/strict";
import { prisma } from "../../src/lib/prisma";
import { TestRunner, createTestRequest, parseResponse, getTestTokens } from "../test-helper";
import { GET as listProducts, POST as createProduct } from "../../src/app/api/v1/products/route";
import {
  GET as getProductById,
  PATCH as updateProduct,
  DELETE as deleteProduct,
} from "../../src/app/api/v1/products/[id]/route";

export async function runProductsIntegrationTests(runner: TestRunner) {
  const { adminToken, cashierToken } = await getTestTokens();

  // Find a valid category
  const category = await prisma.category.findFirstOrThrow();

  await runner.describe("Integration Tests: Products CRUD Endpoints (/api/v1/products/*)", async () => {
    // ══════════════════════════════════════════════════════════════
    // GET /api/v1/products (List, Search, Filter, Sort, Pagination)
    // ══════════════════════════════════════════════════════════════

    await runner.test("GET /api/v1/products - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products");
      const res = await listProducts(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/products - Success: 200 with pagination meta", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products?limit=5", {
        token: cashierToken,
      });
      const res = await listProducts(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta !== undefined);
      assert.equal(body.meta.perPage, 5);
      assert.ok(body.meta.total >= 1);
    });

    await runner.test("GET /api/v1/products - Filter: by search query (?q=...)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products?q=Oversized", {
        token: cashierToken,
      });
      const res = await listProducts(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.ok(body.data.length > 0);
      assert.ok(
        body.data.every(
          (p: any) =>
            p.name.toLowerCase().includes("oversized") ||
            p.sku.toLowerCase().includes("oversized")
        )
      );
    });

    await runner.test("GET /api/v1/products - Filter: by categoryId", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products?categoryId=${category.id}`, {
        token: cashierToken,
      });
      const res = await listProducts(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.ok(body.data.every((p: any) => p.categoryId === category.id));
    });

    await runner.test("GET /api/v1/products - Filter: by size", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products?size=XL", {
        token: cashierToken,
      });
      const res = await listProducts(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.ok(body.data.every((p: any) => p.size === "XL"));
    });

    await runner.test("GET /api/v1/products - Sort: sellPrice ascending & descending", async () => {
      const reqAsc = createTestRequest("http://localhost:3000/api/v1/products?sortBy=sellPrice&order=asc&limit=10", {
        token: cashierToken,
      });
      const resAsc = await listProducts(reqAsc);
      const { body: bodyAsc } = await parseResponse(resAsc);

      if (bodyAsc.data.length >= 2) {
        assert.ok(bodyAsc.data[0].sellPrice <= bodyAsc.data[1].sellPrice);
      }

      const reqDesc = createTestRequest("http://localhost:3000/api/v1/products?sortBy=sellPrice&order=desc&limit=10", {
        token: cashierToken,
      });
      const resDesc = await listProducts(reqDesc);
      const { body: bodyDesc } = await parseResponse(resDesc);

      if (bodyDesc.data.length >= 2) {
        assert.ok(bodyDesc.data[0].sellPrice >= bodyDesc.data[1].sellPrice);
      }
    });

    await runner.test("GET /api/v1/products - Fail: 422 on invalid query params (limit > 100)", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products?limit=500", {
        token: cashierToken,
      });
      const res = await listProducts(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    // ══════════════════════════════════════════════════════════════
    // POST /api/v1/products (Create Product - Admin Only)
    // ══════════════════════════════════════════════════════════════

    const testSku = `PROD-${Date.now().toString().slice(-6)}`;
    let createdProductId = "";

    await runner.test("POST /api/v1/products - Fail: 401 without auth", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        body: { sku: testSku, name: "Kaos Unauth", categoryId: category.id },
      });
      const res = await createProduct(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("POST /api/v1/products - Fail: 403 when cashier tries to create product", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        token: cashierToken,
        body: {
          sku: testSku,
          name: "Kaos Cashier",
          categoryId: category.id,
          buyPrice: 50000,
          sellPrice: 100000,
          stock: 10,
        },
      });
      const res = await createProduct(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });

    await runner.test("POST /api/v1/products - Fail: 400 on malformed JSON", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        token: adminToken,
        rawBody: "{malformed json",
      });
      const res = await createProduct(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 400);
      assert.equal(body.error.code, "BAD_REQUEST");
    });

    await runner.test("POST /api/v1/products - Fail: 422 on negative price and negative stock", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        token: adminToken,
        body: {
          sku: testSku,
          name: "Kaos Invalid",
          categoryId: category.id,
          buyPrice: -10000,
          sellPrice: -20000,
          stock: -5,
        },
      });
      const res = await createProduct(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.details.length >= 3);
    });

    await runner.test("POST /api/v1/products - Fail: 404 when categoryId does not exist", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        token: adminToken,
        body: {
          sku: testSku,
          name: "Kaos Cat Ghost",
          categoryId: "non-existent-category-id-999",
          buyPrice: 50000,
          sellPrice: 90000,
          stock: 10,
        },
      });
      const res = await createProduct(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 404);
      assert.equal(body.error.code, "NOT_FOUND");
    });

    await runner.test("POST /api/v1/products - Success: 201 Created by Admin", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        token: adminToken,
        body: {
          sku: testSku,
          name: "Kemeja Flannel Exclusive RAZH",
          categoryId: category.id,
          buyPrice: 85000,
          sellPrice: 155000,
          stock: 35,
          size: "L",
        },
      });
      const res = await createProduct(req);
      const { status, body, headers } = await parseResponse(res);

      assert.equal(status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.sku, testSku);
      assert.equal(body.data.name, "Kemeja Flannel Exclusive RAZH");
      assert.equal(body.data.buyPrice, 85000);
      assert.equal(body.data.sellPrice, 155000);
      assert.equal(body.data.stock, 35);
      assert.equal(body.data.size, "L");
      assert.ok(headers.get("Location")?.includes(body.data.id));

      createdProductId = body.data.id;
    });

    await runner.test("POST /api/v1/products - Fail: 409 Conflict on duplicate SKU", async () => {
      const req = createTestRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        token: adminToken,
        body: {
          sku: testSku,
          name: "Duplicate SKU product",
          categoryId: category.id,
          buyPrice: 50000,
          sellPrice: 100000,
          stock: 10,
        },
      });
      const res = await createProduct(req);
      const { status, body } = await parseResponse(res);

      assert.equal(status, 409);
      assert.equal(body.error.code, "CONFLICT");
    });

    // ══════════════════════════════════════════════════════════════
    // GET /api/v1/products/:id (Get Single Product)
    // ══════════════════════════════════════════════════════════════

    await runner.test("GET /api/v1/products/:id - Fail: 401 without auth", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`);
      const res = await getProductById(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("GET /api/v1/products/:id - Fail: 404 on non-existent product ID", async () => {
      const fakeId = "ghost-id-product-404";
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${fakeId}`, {
        token: cashierToken,
      });
      const res = await getProductById(req, { params: Promise.resolve({ id: fakeId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 404);
      assert.equal(body.error.code, "NOT_FOUND");
    });

    await runner.test("GET /api/v1/products/:id - Success: 200 with details and category relation", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        token: cashierToken,
      });
      const res = await getProductById(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.id, createdProductId);
      assert.equal(body.data.sku, testSku);
      assert.ok(body.data.category !== undefined);
      assert.equal(body.data.category.id, category.id);
    });

    // ══════════════════════════════════════════════════════════════
    // PATCH /api/v1/products/:id (Partial Update - Admin Only)
    // ══════════════════════════════════════════════════════════════

    await runner.test("PATCH /api/v1/products/:id - Fail: 401 without auth", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "PATCH",
        body: { stock: 40 },
      });
      const res = await updateProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("PATCH /api/v1/products/:id - Fail: 403 when cashier tries to update", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "PATCH",
        token: cashierToken,
        body: { stock: 40 },
      });
      const res = await updateProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });

    await runner.test("PATCH /api/v1/products/:id - Fail: 404 on non-existent product ID", async () => {
      const fakeId = "ghost-product-patch-404";
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${fakeId}`, {
        method: "PATCH",
        token: adminToken,
        body: { stock: 40 },
      });
      const res = await updateProduct(req, { params: Promise.resolve({ id: fakeId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 404);
      assert.equal(body.error.code, "NOT_FOUND");
    });

    await runner.test("PATCH /api/v1/products/:id - Fail: 422 on negative stock", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "PATCH",
        token: adminToken,
        body: { stock: -10 },
      });
      const res = await updateProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    await runner.test("PATCH /api/v1/products/:id - Success: 200 Partial Update by Admin", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "PATCH",
        token: adminToken,
        body: {
          name: "Kemeja Flannel Exclusive RAZH (Updated)",
          sellPrice: 165000,
          stock: 42,
        },
      });
      const res = await updateProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.name, "Kemeja Flannel Exclusive RAZH (Updated)");
      assert.equal(body.data.sellPrice, 165000);
      assert.equal(body.data.stock, 42);
      assert.equal(body.data.buyPrice, 85000); // untouched field preserved
    });

    // ══════════════════════════════════════════════════════════════
    // DELETE /api/v1/products/:id (Soft-Delete - Admin Only)
    // ══════════════════════════════════════════════════════════════

    await runner.test("DELETE /api/v1/products/:id - Fail: 401 without auth", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "DELETE",
      });
      const res = await deleteProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 401);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    await runner.test("DELETE /api/v1/products/:id - Fail: 403 when cashier tries to delete", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "DELETE",
        token: cashierToken,
      });
      const res = await deleteProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });

    await runner.test("DELETE /api/v1/products/:id - Fail: 404 on non-existent product ID", async () => {
      const fakeId = "ghost-product-del-404";
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${fakeId}`, {
        method: "DELETE",
        token: adminToken,
      });
      const res = await deleteProduct(req, { params: Promise.resolve({ id: fakeId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 404);
      assert.equal(body.error.code, "NOT_FOUND");
    });

    await runner.test("DELETE /api/v1/products/:id - Success: 200 Soft-Delete (isActive: false)", async () => {
      const req = createTestRequest(`http://localhost:3000/api/v1/products/${createdProductId}`, {
        method: "DELETE",
        token: adminToken,
      });
      const res = await deleteProduct(req, { params: Promise.resolve({ id: createdProductId }) });
      const { status, body } = await parseResponse(res);

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.product.isActive, false);

      // Verify DB record still exists for audit & historical transactions
      const dbRecord = await prisma.product.findUnique({
        where: { id: createdProductId },
      });
      assert.ok(dbRecord !== null, "Product record must persist in DB (not hard-deleted)");
      assert.equal(dbRecord?.isActive, false, "Product must be marked inactive");
    });
  });

  return runner.finishSuite();
}
