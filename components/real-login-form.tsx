"use client";

import {
  type FormEvent,
  useState,
} from "react";

type LoginRole =
  | "student"
  | "parent"
  | "educator";

type RealLoginFormProps = {
  onSuccess?: () => void;
};

type ForgotPasswordForm = {
  name: string;
  email: string;
  phone: string;
  lastPassword: string;
};

type LoginResponse = {
  error?: string;
  message?: string;
  redirectTo?: string;
  pendingApproval?: boolean;
};

type ForgotPasswordResponse = {
  error?: string;
  message?: string;
};

const LOGIN_ROLES: Array<{
  id: LoginRole;
  label: string;
  icon: string;
}> = [
  {
    id: "student",
    label: "Student",
    icon: "🎓",
  },
  {
    id: "parent",
    label: "Parent",
    icon: "👪",
  },
  {
    id: "educator",
    label: "Faculty",
    icon: "👨‍🏫",
  },
];

async function readJsonResponse<T>(
  response: Response,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function RealLoginForm({
  onSuccess,
}: RealLoginFormProps) {
  const [
    emailOrMobile,
    setEmailOrMobile,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    activeRole,
    setActiveRole,
  ] =
    useState<LoginRole>(
      "student",
    );

  const [error, setError] =
    useState("");

  const [
    isPending,
    setIsPending,
  ] = useState(false);

  const [
    showForgotPassword,
    setShowForgotPassword,
  ] = useState(false);

  const [
    forgotForm,
    setForgotForm,
  ] =
    useState<ForgotPasswordForm>({
      name: "",
      email: "",
      phone: "",
      lastPassword: "",
    });

  const [
    forgotError,
    setForgotError,
  ] = useState("");

  const [
    forgotSuccess,
    setForgotSuccess,
  ] = useState("");

  const [
    forgotPending,
    setForgotPending,
  ] = useState(false);

  function handleRoleChange(
    role: LoginRole,
  ) {
    setActiveRole(role);
    setError("");
    setForgotError("");
    setForgotSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const normalizedLogin =
      emailOrMobile.trim();

    if (
      !normalizedLogin ||
      !password
    ) {
      setError(
        "Enter your registered email or mobile number and password.",
      );
      return;
    }

    setIsPending(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
            },
body: JSON.stringify({
  login: normalizedLogin,
  password,
}),
          },
        );

      const responsePayload =
        await readJsonResponse<LoginResponse>(
          response,
        );

      if (!response.ok) {
        setError(
          responsePayload.error ??
            responsePayload.message ??
            "Unable to sign in. Check your details and try again.",
        );
        return;
      }

      if (
        responsePayload.redirectTo
      ) {
        window.location.assign(
          responsePayload.redirectTo,
        );
        return;
      }

      onSuccess?.();

      window.location.assign(
        "/dashboard",
      );
    } catch (loginError) {
      console.error(
        "Login request failed:",
        loginError,
      );

      setError(
        "Unable to reach the login server. Check your internet connection and try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleForgotSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (forgotPending) {
      return;
    }

    setForgotError("");
    setForgotSuccess("");
    setForgotPending(true);

    try {
      const response =
        await fetch(
          "/api/forgot-password",
          {
            method: "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
            },
body: JSON.stringify({
  name: forgotForm.name.trim(),
  email: forgotForm.email
    .trim()
    .toLowerCase(),
  phone: forgotForm.phone.trim(),
  lastPassword: forgotForm.lastPassword,
}),
          },
        );

      const data =
        await readJsonResponse<ForgotPasswordResponse>(
          response,
        );

      if (!response.ok) {
        setForgotError(
          data.error ??
            data.message ??
            "Unable to submit the password-reset request.",
        );
        return;
      }

      setForgotSuccess(
        data.message ??
          "Your password-reset request was submitted successfully.",
      );

      setForgotForm({
        name: "",
        email: "",
        phone: "",
        lastPassword: "",
      });
    } catch (forgotRequestError) {
      console.error(
        "Forgot-password request failed:",
        forgotRequestError,
      );

      setForgotError(
        "Unable to reach the server. Check your connection and try again.",
      );
    } finally {
      setForgotPending(false);
    }
  }

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <p className="section-label">
            Password Recovery
          </p>

          <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-4xl">
            Forgot Password
          </h2>

          <p className="text-sm font-medium text-[var(--color-muted)]">
            Submit your details and
            our technical team will
            contact you to reset your
            password.
          </p>

<p className="text-xs font-bold text-blue-600">
  Requesting account recovery support
</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={
            handleForgotSubmit
          }
        >
          <div className="space-y-1.5">
            <label
              htmlFor="forgot-full-name"
              className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60"
            >
              Full Name
            </label>

            <input
              id="forgot-full-name"
              type="text"
              value={
                forgotForm.name
              }
              onChange={(event) =>
                setForgotForm(
                  (current) => ({
                    ...current,
                    name:
                      event.target
                        .value,
                  }),
                )
              }
              autoComplete="name"
              required
              disabled={
                forgotPending
              }
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="forgot-email"
              className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60"
            >
              Email Address
            </label>

            <input
              id="forgot-email"
              type="email"
              value={
                forgotForm.email
              }
              onChange={(event) =>
                setForgotForm(
                  (current) => ({
                    ...current,
                    email:
                      event.target
                        .value,
                  }),
                )
              }
              autoComplete="email"
              required
              disabled={
                forgotPending
              }
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Registered email address"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="forgot-phone"
              className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60"
            >
              Phone Number
            </label>

            <input
              id="forgot-phone"
              type="tel"
              value={
                forgotForm.phone
              }
              onChange={(event) =>
                setForgotForm(
                  (current) => ({
                    ...current,
                    phone:
                      event.target
                        .value,
                  }),
                )
              }
              autoComplete="tel"
              inputMode="tel"
              required
              disabled={
                forgotPending
              }
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="+91 9876543210"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="forgot-last-password"
              className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60"
            >
              Last Used Password
            </label>

            <input
              id="forgot-last-password"
              type="password"
              value={
                forgotForm.lastPassword
              }
              onChange={(event) =>
                setForgotForm(
                  (current) => ({
                    ...current,
                    lastPassword:
                      event.target
                        .value,
                  }),
                )
              }
              autoComplete="off"
              required
              disabled={
                forgotPending
              }
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Last password you remember"
            />
          </div>

          {forgotError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
            >
              {forgotError}
            </div>
          ) : null}

          {forgotSuccess ? (
            <div
              role="status"
              className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700"
            >
              {forgotSuccess}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              forgotPending
            }
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-2">
              {forgotPending
                ? "Submitting..."
                : "Submit Request"}
            </span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(
                  false,
                );
                setForgotError("");
                setForgotSuccess("");
              }}
              disabled={
                forgotPending
              }
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
        <p className="section-label">
          Identity Access
        </p>

        <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-4xl">
          Sign In
        </h2>

        <p className="text-sm font-medium text-[var(--color-muted)]">
          Select your portal and
          enter credentials to access
          your workspace.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LOGIN_ROLES.map(
          (item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={
                activeRole ===
                item.id
              }
              onClick={() =>
                handleRoleChange(
                  item.id,
                )
              }
              disabled={isPending}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                activeRole ===
                item.id
                  ? "scale-[1.02] border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-200/50"
                  : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30"
              }`}
            >
              <span
                aria-hidden="true"
                className="mb-1 text-2xl"
              >
                {item.icon}
              </span>

              <span className="text-[10px] font-black uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          ),
        )}
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="space-y-1.5">
          <label
            htmlFor="login-identifier"
            className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60"
          >
            Email or Mobile Number
          </label>

          <input
            id="login-identifier"
            type="text"
            value={emailOrMobile}
            onChange={(event) => {
              setEmailOrMobile(
                event.target.value,
              );

              if (error) {
                setError("");
              }
            }}
            autoComplete="username"
            inputMode="text"
            required
            disabled={isPending}
            className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Enter registered email address or mobile number"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60"
          >
            Secure Password
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(
                event.target.value,
              );

              if (error) {
                setError("");
              }
            }}
            autoComplete="current-password"
            required
            disabled={isPending}
            className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
          >
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
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isPending
              ? "Logging in..."
              : "Login"}

            {!isPending ? (
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            ) : null}
          </span>
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(
                true,
              );
              setError("");
              setForgotError("");
              setForgotSuccess("");
            }}
            disabled={isPending}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}