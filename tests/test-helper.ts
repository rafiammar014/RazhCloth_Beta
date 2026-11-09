import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { signToken, hashPassword, TokenPayload } from "../src/lib/auth";

export interface TestStats {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  failures: Array<{ name: string; error: any }>;
  durationMs: number;
}

export class TestRunner {
  private currentSuite = "Default Suite";
  private currentSuiteStats: TestStats = {
    suiteName: "Default Suite",
    total: 0,
    passed: 0,
    failed: 0,
    failures: [],
    durationMs: 0,
  };
  private startTime = 0;
  private suites: TestStats[] = [];

  async describe(name: string, fn: () => void | Promise<void>) {
    this.currentSuite = name;
    this.currentSuiteStats = {
      suiteName: name,
      total: 0,
      passed: 0,
      failed: 0,
      failures: [],
      durationMs: 0,
    };
    this.startTime = Date.now();
    console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${name}\x1b[0m`);
    await fn();
  }

  async test(name: string, fn: () => void | Promise<void>) {
    this.currentSuiteStats.total++;
    const t0 = Date.now();
    try {
      await fn();
      const dt = Date.now() - t0;
      this.currentSuiteStats.passed++;
      console.log(`  \x1b[32m✔ PASS\x1b[0m \x1b[90m(${dt}ms)\x1b[0m ${name}`);
    } catch (err: any) {
      const dt = Date.now() - t0;
      this.currentSuiteStats.failed++;
      this.currentSuiteStats.failures.push({ name, error: err });
      console.error(`  \x1b[31m✖ FAIL\x1b[0m \x1b[90m(${dt}ms)\x1b[0m ${name}`);
      console.error(`    \x1b[31m${err?.message || err}\x1b[0m`);
      if (err?.stack) {
        const stackLines = err.stack.split("\n").slice(1, 3).join("\n");
        console.error(`    \x1b[90m${stackLines}\x1b[0m`);
      }
    }
  }

  finishSuite() {
    this.currentSuiteStats.durationMs = Date.now() - this.startTime;
    this.suites.push({ ...this.currentSuiteStats });
    return this.currentSuiteStats;
  }

  getAllStats(): TestStats[] {
    return this.suites;
  }
}

// Global or shared test helper
export function createTestRequest(
  url: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token?: string;
    body?: any;
    rawBody?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const reqHeaders = new Headers(options.headers || {});
  if (options.token) {
    reqHeaders.set("Authorization", `Bearer ${options.token}`);
  }

  let bodyContent: string | undefined = undefined;
  if (options.rawBody !== undefined) {
    bodyContent = options.rawBody;
    if (!reqHeaders.has("Content-Type")) {
      reqHeaders.set("Content-Type", "application/json");
    }
  } else if (options.body !== undefined) {
    bodyContent = JSON.stringify(options.body);
    if (!reqHeaders.has("Content-Type")) {
      reqHeaders.set("Content-Type", "application/json");
    }
  }

  return new NextRequest(url, {
    method: options.method || "GET",
    headers: reqHeaders,
    body: bodyContent,
  });
}

export async function parseResponse<T = any>(res: Response): Promise<{
  status: number;
  body: T;
  headers: Headers;
}> {
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return {
    status: res.status,
    body,
    headers: res.headers,
  };
}

// Fixture helpers
let cachedAdminToken: string | null = null;
let cachedCashierToken: string | null = null;
let cachedInactiveToken: string | null = null;

export async function getTestTokens() {
  if (cachedAdminToken && cachedCashierToken && cachedInactiveToken) {
    return {
      adminToken: cachedAdminToken,
      cashierToken: cachedCashierToken,
      inactiveToken: cachedInactiveToken,
    };
  }

  // Ensure Admin
  let admin = await prisma.user.findUnique({ where: { email: "admin@razhcloth.com" } });
  if (!admin) {
    const hash = await hashPassword("admin123");
    admin = await prisma.user.create({
      data: {
        name: "Admin RAZH Test",
        email: "admin@razhcloth.com",
        passwordHash: hash,
        role: "ADMIN",
        isActive: true,
      },
    });
  }

  // Ensure Cashier
  let cashier = await prisma.user.findUnique({ where: { email: "kasir@razhcloth.com" } });
  if (!cashier) {
    const hash = await hashPassword("kasir123");
    cashier = await prisma.user.create({
      data: {
        name: "Kasir Test",
        email: "kasir@razhcloth.com",
        passwordHash: hash,
        role: "CASHIER",
        isActive: true,
      },
    });
  }

  // Ensure Inactive User for 403 / 401 tests
  let inactive = await prisma.user.findUnique({ where: { email: "inactive@razhcloth.com" } });
  if (!inactive) {
    const hash = await hashPassword("inactive123");
    inactive = await prisma.user.create({
      data: {
        name: "Inactive Employee",
        email: "inactive@razhcloth.com",
        passwordHash: hash,
        role: "CASHIER",
        isActive: false,
      },
    });
  } else if (inactive.isActive) {
    inactive = await prisma.user.update({
      where: { id: inactive.id },
      data: { isActive: false },
    });
  }

  cachedAdminToken = signToken({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    role: "ADMIN",
  });

  cachedCashierToken = signToken({
    userId: cashier.id,
    email: cashier.email,
    name: cashier.name,
    role: "CASHIER",
  });

  cachedInactiveToken = signToken({
    userId: inactive.id,
    email: inactive.email,
    name: inactive.name,
    role: "CASHIER",
  });

  return {
    adminToken: cachedAdminToken,
    cashierToken: cachedCashierToken,
    inactiveToken: cachedInactiveToken,
    adminUser: admin,
    cashierUser: cashier,
    inactiveUser: inactive,
  };
}
