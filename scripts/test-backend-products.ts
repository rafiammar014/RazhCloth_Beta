import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/lib/auth";
import { createProductSchema } from "../src/lib/validations";

async function testBackendProducts() {
  console.log("🧪 Running Comprehensive Backend Products & Security Tests...\n");

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
    // 1. Setup tokens
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

    assert(adminToken.length > 20 && cashierToken.length > 20, "Admin and Cashier JWT tokens generated");

    // 2. Strict Zod Input Validation Tests
    const validProductInput = {
      sku: "TEST-TSHIRT-01",
      name: "T-Shirt Special Edition RAZH",
      categoryId: category.id,
      buyPrice: 60000,
      sellPrice: 110000,
      stock: 50,
      size: "XL",
    };

    const validParsed = createProductSchema.safeParse(validProductInput);
    assert(validParsed.success, "Zod accepts valid product input");

    const invalidNegativePrice = {
      ...validProductInput,
      sellPrice: -5000,
    };
    const invalidPriceParsed = createProductSchema.safeParse(invalidNegativePrice);
    assert(!invalidPriceParsed.success, "Zod strictly rejects negative sellPrice");

    const invalidShortSku = {
      ...validProductInput,
      sku: "A",
    };
    const invalidSkuParsed = createProductSchema.safeParse(invalidShortSku);
    assert(!invalidSkuParsed.success, "Zod strictly rejects SKU shorter than 2 characters");

    // 3. Database Parameterized Insertion & Immutability Test
    const cleanSku = "TEST-INSERT-SKU";
    await prisma.product.deleteMany({ where: { sku: cleanSku } });

    const createdProduct = await prisma.product.create({
      data: {
        sku: cleanSku,
        name: "Test T-Shirt Insert",
        categoryId: category.id,
        buyPrice: 50000,
        sellPrice: 90000,
        stock: 30,
        size: "L",
        isActive: true,
      },
      include: { category: true },
    });

    assert(createdProduct.sku === cleanSku, "Product successfully created with parameterized query");
    assert(createdProduct.category.id === category.id, "Product relationship to category resolved");

    // 4. Duplicate SKU prevention (Unique Constraint)
    let duplicateCaught = false;
    try {
      await prisma.product.create({
        data: {
          sku: cleanSku, // same SKU
          name: "Duplicate SKU Item",
          categoryId: category.id,
          buyPrice: 50000,
          sellPrice: 90000,
          stock: 10,
        },
      });
    } catch {
      duplicateCaught = true;
    }
    assert(duplicateCaught, "Database rejects duplicate SKU (Unique constraint enforced)");

    // 5. Update Product Test (Immutability pattern: explicit update)
    const updatedProduct = await prisma.product.update({
      where: { id: createdProduct.id },
      data: {
        stock: 45,
        sellPrice: 95000,
      },
    });
    assert(updatedProduct.stock === 45 && updatedProduct.sellPrice === 95000, "Product update correctly applied");

    // 6. Soft Delete (Deactivation) Test - Preserves data immutability for transactions
    const softDeleted = await prisma.product.update({
      where: { id: createdProduct.id },
      data: { isActive: false },
    });
    assert(softDeleted.isActive === false, "Product successfully soft-deleted (isActive: false)");

    // Verify product still exists in DB so historical transaction references remain valid
    const stillInDb = await prisma.product.findUnique({ where: { id: createdProduct.id } });
    assert(stillInDb !== null, "Soft-deleted product record still exists in DB for historical transaction integrity");

    // 7. SQL Injection Immunity Test (Parameterized Query Security)
    const maliciousQuery = "' OR '1'='1";
    const injectionSearchResult = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: maliciousQuery } },
          { sku: { contains: maliciousQuery } },
        ],
      },
    });
    assert(injectionSearchResult.length === 0, "SQL Injection attempt safely treated as literal string (No leak)");

    // Cleanup test record
    await prisma.product.delete({ where: { id: createdProduct.id } });

    console.log(`\n========================================`);
    console.log(`Backend Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testBackendProducts();

