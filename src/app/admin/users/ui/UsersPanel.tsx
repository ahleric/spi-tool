"use client";

import { useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export default function UsersPanel({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState<User[]>(
    initialUsers.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toString() ?? null, createdAt: u.createdAt.toString() }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "" });

  async function createUser() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setUsers((prev) => [data.user, ...prev]);
      setForm({ email: "", name: "", password: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-4">
        <h2 className="mb-2 text-lg text-white">新增成员</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <button disabled={loading} onClick={createUser} className="rounded-xl bg-brand-primary/90 px-4 py-2 font-semibold text-slate-900 hover:bg-brand-primary disabled:opacity-50">{loading ? "Submitting..." : "Create"}</button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      </div>

      <div className="glass rounded-3xl p-4">
        <h2 className="mb-2 text-lg text-white">成员列表</h2>
        <div className="divide-y divide-white/10">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="text-white">{u.name || u.email} {u.role === "owner" && <span className="ml-2 rounded bg-amber-300/20 px-2 py-0.5 text-xs text-amber-300">OWNER</span>}</p>
                <p className="text-xs text-slate-400">{u.email} · {u.active ? "active" : "disabled"}</p>
              </div>
              {u.role !== "owner" && (
                <button onClick={() => toggleActive(u.id, !u.active)} className={`rounded-xl px-3 py-1 text-sm ${u.active ? "bg-slate-700 text-slate-200" : "bg-brand-primary/90 text-slate-900"}`}>
                  {u.active ? "Disable" : "Enable"}
                </button>
              )}
            </div>
          ))}
          {!users.length && <p className="py-6 text-sm text-slate-400">No members</p>}
        </div>
      </div>
    </div>
  );
}

