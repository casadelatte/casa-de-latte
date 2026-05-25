import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let db: PrismaClient;

if (process.env.VERCEL) {
  // We are running in a Vercel Serverless Function
  const targetDbPath = "/tmp/dev.db";
  const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db");

  try {
    if (!fs.existsSync(targetDbPath)) {
      console.log("Copying database to /tmp...");
      fs.copyFileSync(sourceDbPath, targetDbPath);
      console.log("Database copied successfully to /tmp.");
    }
  } catch (error) {
    console.error("Failed to copy SQLite database to /tmp:", error);
  }

  db = new PrismaClient({
    datasources: {
      db: {
        url: "file:/tmp/dev.db",
      },
    },
  });
} else {
  // Running locally
  db = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
}

export { db };
