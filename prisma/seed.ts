import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed for RAZH CLOTH POS...");

  // 1. Cleanup existing records
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const cashierPasswordHash = await bcrypt.hash("kasir123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Owner RAZH CLOTH",
      email: "admin@razhcloth.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "Kasir Toko 1",
      email: "kasir@razhcloth.com",
      passwordHash: cashierPasswordHash,
      role: "CASHIER",
      isActive: true,
    },
  });

  console.log(`✅ Users created: ${admin.email} (Admin), ${cashier.email} (Cashier)`);

  // 3. Create Categories
  const catKaos = await prisma.category.create({
    data: {
      name: "Kaos & T-Shirt",
      description: "T-Shirt sablon, kaos polos cotton combed 24s & 30s",
    },
  });

  const catKemeja = await prisma.category.create({
    data: {
      name: "Kemeja",
      description: "Kemeja flanel, casual, dan kemeja formal",
    },
  });

  const catJaket = await prisma.category.create({
    data: {
      name: "Jaket & Hoodie",
      description: "Hoodie zipper, pullover, sweater fleece, dan jacket windbreaker",
    },
  });

  const catCelana = await prisma.category.create({
    data: {
      name: "Celana",
      description: "Celana chino, jeans denim, cargo, dan boxer",
    },
  });

  const catAksesoris = await prisma.category.create({
    data: {
      name: "Aksesoris",
      description: "Topi baseball, bucket hat, sabuk, dan kaos kaki",
    },
  });

  console.log("✅ 5 Categories created");

  // 4. Create Initial Products
  const products = [
    // Kaos
    {
      sku: "TS-BLK-L",
      name: "T-Shirt Oversized RAZH Signature Black",
      categoryId: catKaos.id,
      buyPrice: 55000,
      sellPrice: 95000,
      stock: 25,
      size: "L",
    },
    {
      sku: "TS-BLK-XL",
      name: "T-Shirt Oversized RAZH Signature Black",
      categoryId: catKaos.id,
      buyPrice: 55000,
      sellPrice: 95000,
      stock: 20,
      size: "XL",
    },
    {
      sku: "TS-WHT-M",
      name: "Kaos Polos Cotton Combed 24s White",
      categoryId: catKaos.id,
      buyPrice: 40000,
      sellPrice: 75000,
      stock: 30,
      size: "M",
    },
    {
      sku: "TS-WHT-L",
      name: "Kaos Polos Cotton Combed 24s White",
      categoryId: catKaos.id,
      buyPrice: 40000,
      sellPrice: 75000,
      stock: 30,
      size: "L",
    },
    // Kemeja
    {
      sku: "KM-FLN-RED-L",
      name: "Kemeja Flanel Tartan Merah Navy",
      categoryId: catKemeja.id,
      buyPrice: 90000,
      sellPrice: 145000,
      stock: 15,
      size: "L",
    },
    {
      sku: "KM-CAS-OLV-M",
      name: "Kemeja Pendek Casual Olive",
      categoryId: catKemeja.id,
      buyPrice: 80000,
      sellPrice: 130000,
      stock: 18,
      size: "M",
    },
    // Jaket
    {
      sku: "JK-HD-BLK-XL",
      name: "Hoodie Heavyweight Fleece Jet Black",
      categoryId: catJaket.id,
      buyPrice: 120000,
      sellPrice: 195000,
      stock: 12,
      size: "XL",
    },
    {
      sku: "JK-WND-NVY-L",
      name: "Windbreaker Jacket Water Resistant Navy",
      categoryId: catJaket.id,
      buyPrice: 110000,
      sellPrice: 180000,
      stock: 14,
      size: "L",
    },
    // Celana
    {
      sku: "CL-CHN-BGE-32",
      name: "Celana Chino Slim Fit Beige",
      categoryId: catCelana.id,
      buyPrice: 95000,
      sellPrice: 160000,
      stock: 16,
      size: "32",
    },
    {
      sku: "CL-CRG-BLK-31",
      name: "Cargo Pants Tactical Black",
      categoryId: catCelana.id,
      buyPrice: 105000,
      sellPrice: 175000,
      stock: 10,
      size: "31",
    },
    // Aksesoris
    {
      sku: "AK-HAT-BLK",
      name: "RAZH Embroidered Baseball Cap Black",
      categoryId: catAksesoris.id,
      buyPrice: 35000,
      sellPrice: 65000,
      stock: 40,
      size: "ALL SIZE",
    },
    {
      sku: "AK-SOX-3P",
      name: "Kaos Kaki Sneaker 3-Pack White/Grey/Black",
      categoryId: catAksesoris.id,
      buyPrice: 20000,
      sellPrice: 40000,
      stock: 50,
      size: "ALL SIZE",
    },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }

  console.log(`✅ ${products.length} Products created`);

  // 5. Create Default Customers
  const customerUmum = await prisma.customer.create({
    data: {
      name: "Pelanggan Umum (Walk-in)",
      phone: "0800000000",
      address: "Toko Offline RAZH CLOTH",
    },
  });

  const customerLoyal = await prisma.customer.create({
    data: {
      name: "Budi Santoso",
      phone: "081234567890",
      address: "Jl. Merdeka No. 12",
    },
  });

  console.log(`✅ 2 Customers created: ${customerUmum.name}, ${customerLoyal.name}`);
  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

