"use client";

import { useState } from "react";
import { Role } from "@/lib/types";

type RealLoginFormProps = {
  onSuccess?: () => void;
};

export function RealLoginForm({ onSuccess }: RealLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
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
          role,
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
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="section-label">Sign in</p>
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-[var(--color-heading)] sm:text-3xl">
          Login with your account
        </h2>
        <p className="max-w-2xl text-xs leading-6 text-[var(--color-muted)]">
          Select your role and use your Smart Tutors credentials.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { id: "student" as Role, label: "Student", icon: "🎓" },
          { id: "parent" as Role, label: "Parent", icon: "👪" },
          { id: "educator" as Role, label: "Faculty", icon: "👨‍🏫" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRole(item.id)}
            className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 ${
              role === item.id
                ? "border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-200/50 scale-[1.02]"
                : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)] hover:border-blue-300 hover:bg-blue-50/30"
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--color-heading)]">
            Email address
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:ring-2 ring-blue-500/10"
            placeholder="Enter email address"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--color-heading)]">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:ring-2 ring-blue-500/10"
            placeholder="Enter password"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="btn-action btn-lg w-full justify-center mt-4 disabled:cursor-not-allowed disabled:opacity-75 h-12"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
