import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, ensureOwnerFromEnv, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  await ensureOwnerFromEnv();

  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing email or password" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }
  const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", createSessionCookie(user));
  return res;
}

