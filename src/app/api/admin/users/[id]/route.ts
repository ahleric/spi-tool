import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await _.json().catch(() => ({}))) as { active?: boolean; name?: string; password?: string };
  const data: any = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.password === "string" && body.password) {
    const { salt, hash } = hashPassword(body.password);
    data.passwordSalt = salt;
    data.passwordHash = hash;
  }
  try {
    await prisma.adminUser.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

