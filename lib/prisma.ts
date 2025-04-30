// lib/prisma.ts
import { PrismaD1HTTP } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
console.time("adapt");
const adapter = new PrismaD1HTTP({
  CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID,
} as any);
console.timeEnd("adapt");
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
