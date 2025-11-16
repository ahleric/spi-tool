import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ImportForm from "./ImportForm";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login?redirect=/admin/import");
  if (session.user.role !== "owner") redirect("/admin");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold text-white">批量导入艺人</h1>
      <p className="mb-4 text-sm text-slate-300">粘贴多个 Spotify 艺人链接、URI 或 ID，每行一个。可选择立即进行完整入库（较慢）。</p>
      <ImportForm />
    </main>
  );
}
