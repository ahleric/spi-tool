import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ImportForm from "./ImportForm";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login?redirect=/admin/import");
  if (session.user.role !== "owner") redirect("/admin");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold text-white">活动预热名单</h1>
      <p className="mb-4 text-sm text-slate-300">
        把你活动现场会提到的艺人名、歌曲名、Spotify 链接或 URI 提前导入进来。
        这样用户第一次搜索时更容易直接命中本地数据，不会把压力都打到 Spotify API。
      </p>
      <ImportForm />
    </main>
  );
}
