"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminActions() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/admin/login");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/admin/import" className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/5">
        批量导入
      </Link>
      <Link href="/admin/users" className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/5">
        团队成员
      </Link>
      <button onClick={logout} className="rounded-xl bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50" disabled={loading}>
        {loading ? "退出中..." : "退出登录"}
      </button>
    </div>
  );
}
