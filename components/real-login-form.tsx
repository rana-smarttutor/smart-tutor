"use client";

import { useState } from "react";

type RealLoginFormProps = {
  onSuccess?: () => void;
};

type ForgotPasswordForm = {
  name: string;
  email: string;
  phone: string;
  lastPassword: string;
};

export function RealLoginForm({ onSuccess }: RealLoginFormProps) {
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState("student");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotForm, setForgotForm] = useState<ForgotPasswordForm>({
    name: "",
    email: "",
    phone: "",
    lastPassword: "",
  });
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotPending, setForgotPending] = useState(false);

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
          login: emailOrMobile,
          password,
          role: activeRole,
        }),
      });

      const responsePayload = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };
      if (!response.ok) {
        setError(
          responsePayload.error ?? responsePayload.message ?? "Request failed.",
        );
        return;
      }

      if (responsePayload.redirectTo) {
        window.location.assign(responsePayload.redirectTo);
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

  async function handleForgotSubmit(event: React.FormEvent) {
    event.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotPending(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...forgotForm, role: activeRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error ?? "Request failed.");
        return;
      }
      setForgotSuccess(data.message);
      setForgotForm({ name: "", email: "", phone: "", lastPassword: "" });
    } catch {
      setForgotError("Unable to reach the server.");
    } finally {
      setForgotPending(false);
    }
  }

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <p className="section-label">Password Recovery</p>
          <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-4xl">
            Forgot Password
          </h2>
          <p className="text-sm font-medium text-[var(--color-muted)]">
            Submit your details and our technical team will contact you to reset your password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleForgotSubmit}>
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
              Full Name
            </label>
            <input
              type="text"
              value={forgotForm.name}
              onChange={(e) => setForgotForm({ ...forgotForm, name: e.target.value })}
              required
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
              placeholder="e.g. Ankit"
            />
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
              Email Address
            </label>
            <input
              type="email"
              value={forgotForm.email}
              onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
              required
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
              placeholder="Registered email address"
            />
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
              Phone Number
            </label>
            <input
              type="tel"
              value={forgotForm.phone}
              onChange={(e) => setForgotForm({ ...forgotForm, phone: e.target.value })}
              required
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
              placeholder="Registered phone number"
            />
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
              Last Used Password
            </label>
            <input
              type="password"
              value={forgotForm.lastPassword}
              onChange={(e) => setForgotForm({ ...forgotForm, lastPassword: e.target.value })}
              required
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
              placeholder="Last password you remember"
            />
          </div>

          {forgotError && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
              {forgotError}
            </div>
          )}

          {forgotSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">
              {forgotSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={forgotPending}
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-2">
              {forgotPending ? "Submitting..." : "Submit Request"}
            </span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotError("");
                setForgotSuccess("");
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    );
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
                ? "scale-[1.02] border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-200/50"
                : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30"
            }`}
          >
            <span className="mb-1 text-2xl">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
            Email or Mobile Number
          </label>
          <input
            type="text"
            value={emailOrMobile}
            onChange={(event) => setEmailOrMobile(event.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
            placeholder="Enter registered email address or mobile number"
          />
        </div>

        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
            Secure Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
            <svg
              className="h-4 w-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
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
            {isPending ? "Logging in..." : "Login"}

            {!isPending && (
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            )}
          </span>
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}
