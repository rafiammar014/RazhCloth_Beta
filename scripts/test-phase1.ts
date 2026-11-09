import { prisma } from "../src/lib/prisma";
import { verifyPassword, signToken, verifyToken } from "../src/lib/auth";

async function runPhase1Tests() {
  console.log("🧪 Running Phase 1 Foundation & Auth Verification Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Verify Users in DB
    const admin = await prisma.user.findUnique({
      where: { email: "admin@razhcloth.com" },
    });
    assert(!!admin, "Admin user exists in database");
    assert(admin?.role === "ADMIN", "Admin user role is ADMIN");

    const cashier = await prisma.user.findUnique({
      where: { email: "kasir@razhcloth.com" },
    });
    assert(!!cashier, "Cashier user exists in database");
    assert(cashier?.role === "CASHIER", "Cashier user role is CASHIER");

    // 2. Verify Password Verification
    if (admin) {
      const isCorrect = await verifyPassword("admin123", admin.passwordHash);
      assert(isCorrect, "Password verification succeeds with correct password ('admin123')");

      const isWrong = await verifyPassword("wrongpassword", admin.passwordHash);
      assert(!isWrong, "Password verification fails with incorrect password");
    }

    // 3. Verify JWT Signing and Verification
    if (admin) {
      const token = signToken({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role as "ADMIN" | "CASHIER",
      });
      assert(typeof token === "string" && token.length > 20, "JWT token generated");

      const decoded = verifyToken(token);
      assert(decoded?.email === admin.email, "JWT token verified and payload intact");
      assert(decoded?.role === "ADMIN", "JWT payload contains correct role");

      const fakeDecoded = verifyToken("fake.token.value");
      assert(fakeDecoded === null, "Invalid JWT token gracefully rejected (returns null)");
    }

    // 4. Verify Initial Categories and Products
    const categoriesCount = await prisma.category.count();
    assert(categoriesCount === 5, `Categories count is 5 (got ${categoriesCount})`);

    const productsCount = await prisma.product.count();
    assert(productsCount === 12, `Products count is 12 (got ${productsCount})`);

    const customersCount = await prisma.customer.count();
    assert(customersCount === 2, `Customers count is 2 (got ${customersCount})`);

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase1Tests();

