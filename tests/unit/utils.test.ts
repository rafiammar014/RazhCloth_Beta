import assert from "node:assert/strict";
import { TestRunner } from "../test-helper";
import {
  formatRupiah,
  formatDate,
  formatDateOnly,
  generateInvoiceNumber,
  cn,
} from "../../src/lib/utils";

export async function runUtilsUnitTests(runner: TestRunner) {
  await runner.describe("Unit Tests: Utils Module (src/lib/utils.ts)", async () => {
    // 1. formatRupiah
    await runner.test("formatRupiah: correctly formats numeric currency", async () => {
      const formatted = formatRupiah(150000);
      assert.ok(formatted.includes("150.000"), `Expected string with '150.000', got: ${formatted}`);
    });

    await runner.test("formatRupiah: handles zero, null, undefined, and NaN gracefully", async () => {
      assert.ok(formatRupiah(0).includes("Rp") && formatRupiah(0).includes("0"));
      assert.ok(formatRupiah(null).includes("Rp") && formatRupiah(null).includes("0"));
      assert.ok(formatRupiah(undefined).includes("Rp") && formatRupiah(undefined).includes("0"));
      assert.ok(formatRupiah(NaN).includes("Rp") && formatRupiah(NaN).includes("0"));
    });

    // 2. formatDate and formatDateOnly
    await runner.test("formatDate: formats Date object, ISO string, and timestamp", async () => {
      const fixedDate = new Date("2026-05-15T10:30:00Z");
      const fromObj = formatDate(fixedDate);
      const fromIso = formatDate("2026-05-15T10:30:00Z");
      const fromTs = formatDate(fixedDate.getTime());

      assert.ok(fromObj.length > 5, "Formatted date string must have content");
      assert.equal(fromObj, fromIso, "Date object and ISO string should produce identical output");
      assert.equal(fromObj, fromTs, "Date object and timestamp should produce identical output");
    });

    await runner.test("formatDateOnly: formats without time component", async () => {
      const fixedDate = new Date("2026-05-15T10:30:00Z");
      const dateOnly = formatDateOnly(fixedDate);
      assert.ok(dateOnly.length > 0, "Formatted date only must have content");
    });

    // 3. generateInvoiceNumber
    await runner.test("generateInvoiceNumber: generates formatted invoice number INV-YYYYMMDD-XXXX", async () => {
      const inv1 = generateInvoiceNumber();
      const inv2 = generateInvoiceNumber();

      const regex = /^INV-\d{8}-\d{4}$/;
      assert.ok(regex.test(inv1), `Invoice number '${inv1}' must match pattern INV-YYYYMMDD-XXXX`);
      assert.ok(regex.test(inv2), `Invoice number '${inv2}' must match pattern INV-YYYYMMDD-XXXX`);
    });

    // 4. cn (Classnames helper)
    await runner.test("cn: combines valid classes and filters out falsy values", async () => {
      const combined = cn("btn", "btn-primary", false && "hidden", null, undefined, "active");
      assert.equal(combined, "btn btn-primary active");
    });
  });

  return runner.finishSuite();
}
