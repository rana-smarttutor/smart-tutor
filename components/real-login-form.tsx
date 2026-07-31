"use client";

import { type ComponentType, type FormEvent, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  User,
  Users,
} from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

type LoginRole = "student" | "parent" | "educator";

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
  icon: IconComponent;
}> = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "parent", label: "Parent", icon: Users },
  { id: "educator", label: "Faculty", icon: Briefcase },
];

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

type LoginFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  disabled?: boolean;
  icon: IconComponent;
  isPassword?: boolean;
};

function LoginField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  disabled,
  icon: Icon,
  isPassword = false,
}: LoginFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-700"
      >
        {label}
      </label>

      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Icon className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#2563EB]" />
        </div>

        <input
          id={id}
          type={isPassword && !showPassword ? "password" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required
          disabled={disabled}
          className={`block w-full bg-white py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
            isPassword ? "rounded-lg border border-slate-200 pl-12 pr-12 focus:border-[#2563EB] focus:ring-[#2563EB]" : "rounded-lg border border-slate-200 pl-12 pr-4 focus:border-[#2563EB] focus:ring-[#2563EB]"
          }`}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type SweepSubmitButtonProps = {
  pending: boolean;
  pendingLabel: string;
  label: string;
};

function SweepSubmitButton({
  pending,
  pendingLabel,
  label,
}: SweepSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative isolate block w-full cursor-pointer select-none overflow-hidden rounded-xl bg-transparent px-8 py-3.5 text-base font-semibold text-[#2563EB] transition-colors duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {pending ? pendingLabel : label}

        {!pending ? (
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        ) : null}
      </span>

      <span className="absolute inset-0 z-[-1] rounded-xl border-2 border-[#2563EB]">
        <span className="absolute left-1/2 top-1/2 block h-[3000px] w-[3%] -translate-x-1/2 -translate-y-1/2 -rotate-[60deg] bg-[var(--color-cream)] transition-all duration-700 group-hover:w-full group-hover:-rotate-90 group-hover:bg-[#2563EB] group-active:bg-blue-700" />
      </span>
    </button>
  );
}

export function RealLoginForm({ onSuccess }: RealLoginFormProps) {
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState<LoginRole>("student");
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

  function handleRoleChange(role: LoginRole) {
    setActiveRole(role);
    setError("");
    setForgotError("");
    setForgotSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const normalizedLogin = emailOrMobile.trim();

    if (!normalizedLogin || !password) {
      setError(
        "Enter your registered email or mobile number and password.",
      );
      return;
    }

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
          login: normalizedLogin,
          password,
        }),
      });

      const responsePayload = await readJsonResponse<LoginResponse>(
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

      if (responsePayload.redirectTo) {
        window.location.assign(responsePayload.redirectTo);
        return;
      }

      onSuccess?.();

      window.location.assign("/dashboard");
    } catch (loginError) {
      console.error("Login request failed:", loginError);

      setError(
        "Unable to reach the login server. Check your internet connection and try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (forgotPending) {
      return;
    }

    setForgotError("");
    setForgotSuccess("");
    setForgotPending(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: forgotForm.name.trim(),
          email: forgotForm.email.trim().toLowerCase(),
          phone: forgotForm.phone.trim(),
          lastPassword: forgotForm.lastPassword,
        }),
      });

      const data = await readJsonResponse<ForgotPasswordResponse>(
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
      console.error("Forgot-password request failed:", forgotRequestError);

      setForgotError(
        "Unable to reach the server. Check your connection and try again.",
      );
    } finally {
      setForgotPending(false);
    }
  }

  if (showForgotPassword) {
    return (
      <div className="space-y-5">
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Password Recovery
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Forgot Password
          </h2>

          <p className="text-sm text-slate-600">
            Submit your details and our technical team will contact you to
            reset your password.
          </p>

          <p className="text-xs font-bold text-[#2563EB]">
            Requesting account recovery support
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleForgotSubmit}>
          <LoginField
            id="forgot-full-name"
            label="Full Name"
            value={forgotForm.name}
            onChange={(value) =>
              setForgotForm((current) => ({ ...current, name: value }))
            }
            autoComplete="name"
            disabled={forgotPending}
            icon={User}
            placeholder="Enter your full name"
          />

          <LoginField
            id="forgot-email"
            label="Email Address"
            value={forgotForm.email}
            onChange={(value) =>
              setForgotForm((current) => ({ ...current, email: value }))
            }
            autoComplete="email"
            inputMode="email"
            disabled={forgotPending}
            icon={Mail}
            placeholder="Registered email address"
          />

          <LoginField
            id="forgot-phone"
            label="Phone Number"
            value={forgotForm.phone}
            onChange={(value) =>
              setForgotForm((current) => ({ ...current, phone: value }))
            }
            autoComplete="tel"
            inputMode="tel"
            disabled={forgotPending}
            icon={Phone}
            placeholder="+91 9876543210"
          />

          <LoginField
            id="forgot-last-password"
            label="Last Used Password"
            value={forgotForm.lastPassword}
            onChange={(value) =>
              setForgotForm((current) => ({
                ...current,
                lastPassword: value,
              }))
            }
            autoComplete="off"
            disabled={forgotPending}
            icon={Lock}
            isPassword
            placeholder="Last password you remember"
          />

          {forgotError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
            >
              {forgotError}
            </div>
          ) : null}

          {forgotSuccess ? (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700"
            >
              {forgotSuccess}
            </div>
          ) : null}

          <SweepSubmitButton
            pending={forgotPending}
            pendingLabel="Submitting..."
            label="Submit Request"
          />

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotError("");
                setForgotSuccess("");
              }}
              disabled={forgotPending}
              className="text-xs font-bold text-[#2563EB] transition-colors hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mb-4 space-y-2 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Identity Access
        </p>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Sign In
        </h2>

        <p className="text-sm text-slate-600">
          Select your portal and enter credentials to access your workspace.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LOGIN_ROLES.map((item) => {
          const Icon = item.icon;
          const isSelected = activeRole === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleRoleChange(item.id)}
              disabled={isPending}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "z-10 scale-[1.02] border-2 border-[#2563EB] bg-blue-50 shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 hover:shadow-md"
              }`}
            >
              <span
                className={`rounded-lg p-2 transition-colors duration-300 ${
                  isSelected
                    ? "bg-blue-100 text-[#2563EB]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span
                className={`text-xs font-bold tracking-wider ${
                  isSelected ? "text-[#2563EB]" : ""
                }`}
              >
                {item.label}
              </span>

              {isSelected ? (
                <span className="absolute bottom-0 left-1/2 h-1 w-1/2 -translate-x-1/2 rounded-t-md bg-[#2563EB]" />
              ) : null}
            </button>
          );
        })}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <LoginField
          id="login-identifier"
          label="Email or Mobile Number"
          value={emailOrMobile}
          onChange={(value) => {
            setEmailOrMobile(value);
            if (error) {
              setError("");
            }
          }}
          autoComplete="username"
          disabled={isPending}
          icon={Mail}
          placeholder="Enter registered email address or mobile number"
        />

        <LoginField
          id="login-password"
          label="Secure Password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (error) {
              setError("");
            }
          }}
          autoComplete="current-password"
          disabled={isPending}
          icon={Lock}
          isPassword
          placeholder="••••••••"
        />

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
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

        <SweepSubmitButton
          pending={isPending}
          pendingLabel="Processing..."
          label="Login Now"
        />

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setError("");
              setForgotError("");
              setForgotSuccess("");
            }}
            disabled={isPending}
            className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-[#2563EB] hover:decoration-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}
