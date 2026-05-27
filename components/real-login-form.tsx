"use client";

import { useState } from "react";

type RealLoginFormProps = {
  onSuccess?: () => void;
};

export function RealLoginForm({ onSuccess }: RealLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState("student");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const responsePayload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(responsePayload.error ?? "Login failed.");
        return;
      }

      onSuccess?.();
      window.location.assign("/dashboard");
    } catch {
      setError("Unable to reach the login route.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="section-label">Identity Access</p>
        <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-4xl">
          Sign In
        </h2>
        <p className="text-sm font-medium text-[var(--color-muted)]">
          Select your portal and enter credentials to access your workspace.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "student", label: "Student", icon: "🎓" },
          { id: "parent", label: "Parent", icon: "👪" },
          { id: "educator", label: "Faculty", icon: "👨‍🏫" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveRole(item.id)}
            className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${
              activeRole === item.id
                ? "border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-200/50 scale-[1.02]"
                : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30"
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60 ml-1">
            Email or Username
          </label>
          <input
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all placeholder:text-slate-300"
            placeholder="name@smarttutors.co.in"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60 ml-1">
            Secure Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none focus:ring-4 ring-blue-500/10 transition-all placeholder:text-slate-300"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isPending ? "Authenticating..." : "Enter Workspace"}
            {!isPending && <span className="group-hover:translate-x-1 transition-transform">→</span>}
          </span>
        </button>
      </form>
    </div>
  );
}
