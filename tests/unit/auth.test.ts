import assert from "node:assert/strict";
import { TestRunner } from "../test-helper";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getAuthUser,
  TokenPayload,
} from "../../src/lib/auth";

export async function runAuthUnitTests(runner: TestRunner) {
  await runner.describe("Unit Tests: Auth Module (src/lib/auth.ts)", async () => {
    // 1. Password Hashing
    await runner.test("hashPassword: creates bcrypt hash with salt", async () => {
      const plain = "mypassword123";
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      assert.ok(hash1.startsWith("$2"), "Hash should start with bcrypt identifier");
      assert.notEqual(hash1, hash2, "Bcrypt hashes should differ due to salt");
    });

    // 2. Password Verification
    await runner.test("verifyPassword: correctly verifies matching password", async () => {
      const plain = "secret456";
      const hashed = await hashPassword(plain);

      const isValid = await verifyPassword(plain, hashed);
      assert.equal(isValid, true, "Valid password should return true");
    });

    await runner.test("verifyPassword: rejects invalid password", async () => {
      const plain = "correctPassword";
      const hashed = await hashPassword(plain);

      const isInvalid = await verifyPassword("wrongPassword", hashed);
      assert.equal(isInvalid, false, "Wrong password should return false");
    });

    // 3. JWT Signing & Verification
    const samplePayload: TokenPayload = {
      userId: "user_test_123",
      email: "test@razhcloth.com",
      name: "Test User",
      role: "ADMIN",
    };

    let generatedToken = "";

    await runner.test("signToken: generates valid JWT token string", async () => {
      generatedToken = signToken(samplePayload);
      assert.ok(typeof generatedToken === "string", "Token must be a string");
      const parts = generatedToken.split(".");
      assert.equal(parts.length, 3, "JWT must consist of 3 dot-separated parts");
    });

    await runner.test("verifyToken: decodes valid token payload accurately", async () => {
      const decoded = verifyToken(generatedToken);
      assert.ok(decoded !== null, "Decoded payload must not be null");
      assert.equal(decoded.userId, samplePayload.userId);
      assert.equal(decoded.email, samplePayload.email);
      assert.equal(decoded.name, samplePayload.name);
      assert.equal(decoded.role, samplePayload.role);
    });

    await runner.test("verifyToken: returns null for invalid or tampered token", async () => {
      const tampered = generatedToken.substring(0, generatedToken.length - 5) + "abcde";
      const decoded = verifyToken(tampered);
      assert.equal(decoded, null, "Tampered token should return null");

      const malformed = verifyToken("not.a.valid.jwt");
      assert.equal(malformed, null, "Malformed token should return null");

      const empty = verifyToken("");
      assert.equal(empty, null, "Empty token should return null");
    });

    // 4. getAuthUser Request Parsing
    await runner.test("getAuthUser: extracts and decodes user from Authorization header", async () => {
      const req = new Request("http://localhost:3000/api/v1/auth/me", {
        headers: {
          authorization: `Bearer ${generatedToken}`,
        },
      });

      const user = await getAuthUser(req);
      assert.ok(user !== null, "User should be extracted from Bearer header");
      assert.equal(user?.userId, samplePayload.userId);
      assert.equal(user?.email, samplePayload.email);
    });

    await runner.test("getAuthUser: returns null when Authorization header is missing", async () => {
      const req = new Request("http://localhost:3000/api/v1/auth/me");
      const user = await getAuthUser(req);
      assert.equal(user, null, "Missing header should return null");
    });

    await runner.test("getAuthUser: returns null when Authorization header format is not Bearer", async () => {
      const req = new Request("http://localhost:3000/api/v1/auth/me", {
        headers: {
          authorization: `Basic ${generatedToken}`,
        },
      });
      const user = await getAuthUser(req);
      assert.equal(user, null, "Non-Bearer header should return null");
    });

    await runner.test("getAuthUser: returns null for invalid token in Bearer header", async () => {
      const req = new Request("http://localhost:3000/api/v1/auth/me", {
        headers: {
          authorization: `Bearer fake.invalid.token`,
        },
      });
      const user = await getAuthUser(req);
      assert.equal(user, null, "Invalid token header should return null");
    });
  });

  return runner.finishSuite();
}
