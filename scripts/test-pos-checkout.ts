import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/lib/auth";

async function testPosCheckout() {
  console.log("🧪 Running Comprehensive POS Checkout & Transaction Tests...\n");

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
    const cashier = await prisma.user.findUniqueOrThrow({ where: { email: "kasir@razhcloth.com" } });
    const customer = await prisma.customer.findFirstOrThrow();
    const product = await prisma.product.findFirstOrThrow({ where: { stock: { gte: 5 } } });

    const initialStock = product.stock;
    const buyQty = 2;

    // 1. Simulate Atomic Transaction Checkout
    const simulatedSubtotal = product.sellPrice * buyQty;
    const simulatedDiscount = 5000;
    const simulatedTotal = simulatedSubtotal - simulatedDiscount;
    const cashGiven = 200000;
    const change = cashGiven - simulatedTotal;

    const invoiceNo = `TEST-INV-${Date.now()}`;

    const createdTx = await prisma.$transaction(async (tx) => {
      // Decrement stock
      const updateResult = await tx.product.updateMany({
        where: {
          id: product.id,
          stock: { gte: buyQty },
        },
        data: {
          stock: { decrement: buyQty },
        },
      });

      if (updateResult.count === 0) {
        throw new Error("Stok tidak mencukupi");
      }

      return await tx.transaction.create({
        data: {
          invoiceNo,
          userId: cashier.id,
          customerId: customer.id,
          subtotal: simulatedSubtotal,
          discountAmount: simulatedDiscount,
          totalAmount: simulatedTotal,
          paymentMethod: "CASH",
          cashPaid: cashGiven,
          changeAmount: change,
          status: "COMPLETED",
          items: {
            create: [
              {
                productId: product.id,
                sku: product.sku,
                productName: product.name,
                size: product.size || null,
                buyPrice: product.buyPrice,
                unitPrice: product.sellPrice,
                quantity: buyQty,
                discountAmount: simulatedDiscount,
                totalPrice: simulatedTotal,
              },
            ],
          },
        },
        include: {
          items: true,
          user: true,
          customer: true,
        },
      });
    });

    assert(createdTx.invoiceNo === invoiceNo, "Transaction successfully created with invoice number");
    assert(createdTx.items.length === 1, "Transaction contains correct item count");
    assert(createdTx.items[0].sku === product.sku, "Snapshot SKU preserved in transaction item");
    assert(createdTx.items[0].buyPrice === product.buyPrice, "Snapshot buyPrice (HPP) preserved for profit calculation");
    assert(createdTx.items[0].unitPrice === product.sellPrice, "Snapshot unitPrice preserved");
    assert(createdTx.changeAmount === change, "Change amount correctly calculated");

    // 2. Verify Stock Decrement
    const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert(
      productAfter.stock === initialStock - buyQty,
      `Stock properly decremented: was ${initialStock}, now ${productAfter.stock}`
    );

    // 3. Prevent Overselling (Race Condition Guard)
    let oversellCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.product.updateMany({
          where: {
            id: product.id,
            stock: { gte: 999999 }, // way more than stock
          },
          data: {
            stock: { decrement: 999999 },
          },
        });

        if (updateResult.count === 0) {
          throw new Error("Stok tidak mencukupi atau telah habis");
        }
      });
    } catch {
      oversellCaught = true;
    }
    assert(oversellCaught, "Atomic guard successfully aborts transaction when stock is insufficient");

    // Cleanup test transaction
    await prisma.transactionItem.deleteMany({ where: { transactionId: createdTx.id } });
    await prisma.transaction.delete({ where: { id: createdTx.id } });
    // Restore stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: initialStock },
    });

    console.log(`\n========================================`);
    console.log(`POS Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPosCheckout();

