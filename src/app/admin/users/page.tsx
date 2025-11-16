import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersPanel from "./ui/UsersPanel";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login?redirect=/admin/users");
  if (session.user.role !== "owner") redirect("/admin");

  const users = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  });
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold text-white">团队成员</h1>
      <UsersPanel initialUsers={users} />
    </main>
  );
}

