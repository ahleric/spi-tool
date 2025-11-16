import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.adminUser.findMany({ select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true }, orderBy: [{ role: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { email, name, password } = (await request.json().catch(() => ({}))) as { email?: string; name?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
  const { salt, hash } = hashPassword(password);
  try {
    const user = await prisma.adminUser.create({ data: { email, name, role: "member", active: true, passwordHash: hash, passwordSalt: salt } });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt } });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
  }
}

