import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDebugAccess } from "@/lib/debug-auth";

export async function GET(request: NextRequest) {
  const authError = checkDebugAccess(request);
  if (authError) return authError;
  const hasUrl = !!process.env.DATABASE_URL;
  const dbUrl = process.env.DATABASE_URL || "";
  
  // 解析连接字符串信息（不暴露密码）
  const urlInfo: Record<string, any> = {
    hasUrl,
    urlLength: dbUrl.length,
  };
  
  if (dbUrl) {
    try {
      const url = new URL(dbUrl.replace(/^postgresql:\/\//, "http://"));
      urlInfo.host = url.hostname;
      urlInfo.port = url.port || "5432";
      urlInfo.database = url.pathname.replace("/", "");
      urlInfo.hasSSL = dbUrl.includes("sslmode") || dbUrl.includes("ssl=true");
      urlInfo.hasPooler = dbUrl.includes("pgbouncer=true") || url.port === "6543";
      urlInfo.hasPassword = !!url.password;
    } catch {
      urlInfo.parseError = "Could not parse DATABASE_URL";
    }
  }

  try {
    const row = await prisma.$queryRawUnsafe<{ ok: number }>("SELECT 1 as ok");
    return NextResponse.json({ 
      ok: true, 
      hasUrl, 
      result: Array.isArray(row) ? row[0]?.ok ?? 1 : 1,
      connectionInfo: urlInfo,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        hasUrl,
        connectionInfo: urlInfo,
        error: err?.message || "DB check failed",
        errorCode: err?.code,
        errorMeta: err?.meta,
        suggestions: [
          "检查 DATABASE_URL 是否包含 ?sslmode=require 参数",
          "确认使用 Session Pooler 时端口是 6543",
          "确认连接字符串包含 ?pgbouncer=true",
          "检查密码中的特殊字符是否已正确 URL 编码",
          "尝试在 Supabase Dashboard 的 SQL Editor 中测试连接",
        ],
      },
      { status: 500 },
    );
  }
}

