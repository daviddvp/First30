import { PrismaClient } from "@prisma/client";

// Singleton pattern para PrismaClient en Next.js.
// En desarrollo, hot-reload crea múltiples instancias sin esto.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
