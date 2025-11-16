import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

// 确保 DATABASE_URL 包含必要的 SSL 参数（如果使用 Supabase）
function ensureDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return dbUrl;
  
  let url = dbUrl;
  
  // 如果是 Supabase 连接且没有 sslmode 参数，添加它
  if (url.includes("supabase.co") && !url.includes("sslmode")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}sslmode=require`;
  }
  
  // 添加连接超时参数，避免长时间等待（Supabase 连接可能需要更长时间）
  if (url.includes("supabase.co") && !url.includes("connect_timeout")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}connect_timeout=30`;
  }
  
  // 添加连接池相关参数
  if (url.includes("supabase.co") && !url.includes("pool_timeout")) {
    const separator2 = url.includes("?") ? "&" : "?";
    url = `${url}${separator2}pool_timeout=30`;
  }
  
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: ensureDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
