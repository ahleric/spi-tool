import { Suspense } from "react";
import { ensureOwnerFromEnv } from "@/lib/auth";
import LoginForm from "./ui/LoginForm";

export default async function AdminLoginPage() {
  await ensureOwnerFromEnv();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4">
      <div className="glass rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-white">Admin Login</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="mt-3 text-xs text-slate-400">Only team members can sign in.</p>
      </div>
    </main>
  );
}
