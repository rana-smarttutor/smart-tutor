"use client";

import { useState } from "react";

type RealLoginFormProps = {
  onSuccess?: () => void;
};

type AuthMode = "login" | "signup";
type SignupRole = "student" | "parent" | "educator";

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 10);
}

export function RealLoginForm({ onSuccess }: RealLoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [signupRole, setSignupRole] = useState<SignupRole>("student");

  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");

  const [studentName, setStudentName] = useState("");
  const [course, setCourse] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentMobile, setStudentMobile] = useState("");

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [linkedStudentMobile, setLinkedStudentMobile] = useState("");

  const [activeRole, setActiveRole] = useState("student");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setPassword("");

    if (nextMode === "signup") {
      setSignupRole("student");
      setActiveRole("student");
    }
  }

  function validateSignup() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanPassword = password.trim();

    if (signupRole === "student" || signupRole === "educator") {
      const cleanStudentName = studentName.trim();
      const cleanCourse = course.trim();
      const cleanEmail = studentEmail.trim().toLowerCase();
      const cleanStudentMobile = normalizePhone(studentMobile);

      if (
        !cleanStudentName ||
        !cleanCourse ||
        !cleanEmail ||
        !cleanStudentMobile ||
        !cleanPassword
      ) {
        setError(
          signupRole === "educator"
            ? "Please fill all faculty signup fields."
            : "Please fill all student signup fields.",
        );
        return false;
      }

      if (!emailRegex.test(cleanEmail)) {
        setError(
          signupRole === "educator"
            ? "Please enter a valid faculty email address."
            : "Please enter a valid student email address.",
        );
        return false;
      }

      if (cleanStudentMobile.length !== 10) {
        setError(
          signupRole === "educator"
            ? "Please enter a valid 10-digit faculty mobile number."
            : "Please enter a valid 10-digit student mobile number.",
        );
        return false;
      }

      if (cleanPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return false;
      }

      return true;
    }

    const cleanParentName = parentName.trim();
    const cleanParentEmail = parentEmail.trim().toLowerCase();
    const cleanParentMobile = normalizePhone(parentMobile);
    const cleanStudentMobile = normalizePhone(linkedStudentMobile);

    if (
      !cleanParentName ||
      !cleanParentEmail ||
      !cleanParentMobile ||
      !cleanStudentMobile ||
      !cleanPassword
    ) {
      setError("Please fill all parent signup fields.");
      return false;
    }

    if (!emailRegex.test(cleanParentEmail)) {
      setError("Please enter a valid parent email address.");
      return false;
    }

    if (cleanParentMobile.length !== 10) {
      setError("Please enter a valid 10-digit parent mobile number.");
      return false;
    }

    if (cleanStudentMobile.length !== 10) {
      setError("Please enter the student's valid 10-digit mobile number.");
      return false;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    if (mode === "signup" && !validateSignup()) {
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "login"
              ? {
                  login: emailOrMobile,
                  password,
                  role: activeRole,
                }
              : signupRole === "student" || signupRole === "educator"
                ? {
                    signupType: signupRole,
                    name: studentName.trim(),
                    course:
                      signupRole === "educator"
                        ? course.trim() || "Faculty / Educator"
                        : course.trim(),
                    email: studentEmail.trim().toLowerCase(),
                    studentMobile: normalizePhone(studentMobile),
                    password,
                  }
                : {
                    signupType: "parent",
                    name: parentName.trim(),
                    email: parentEmail.trim().toLowerCase(),
                    parentMobile: normalizePhone(parentMobile),
                    studentMobile: normalizePhone(linkedStudentMobile),
                    password,
                  },
          ),
        },
      );

      const responsePayload = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
        pendingApproval?: boolean;
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
      setError(
        mode === "login"
          ? "Unable to reach the login route."
          : "Unable to create account.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="section-label">Identity Access</p>

        <h2 className="text-3xl font-black tracking-tight text-[var(--color-heading)] sm:text-4xl">
          {mode === "login" ? "Sign In" : "Sign Up"}
        </h2>

        <p className="text-sm font-medium text-[var(--color-muted)]">
          {mode === "login"
            ? "Select your portal and enter credentials to access your workspace."
            : "Choose student, parent or faculty and create your account."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-inner">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-xl px-4 py-3 text-sm font-black transition ${
            mode === "login"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-xl px-4 py-3 text-sm font-black transition ${
            mode === "signup"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          }`}
        >
          Sign Up
        </button>
      </div>

      {mode === "login" && (
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
      )}

      {mode === "signup" && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "student", label: "Student", icon: "🎓" },
            { id: "parent", label: "Parent", icon: "👪" },
            { id: "educator", label: "Faculty", icon: "👨‍🏫" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSignupRole(item.id as SignupRole);
                setError("");
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-5 transition-all duration-300 ${
                signupRole === item.id
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
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          signupRole === "student" || signupRole === "educator" ? (
            <>
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  {signupRole === "educator" ? "Faculty Name" : "Student Name"}
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  autoComplete="name"
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder={
                    signupRole === "educator"
                      ? "Enter faculty full name"
                      : "Enter student full name"
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  {signupRole === "educator"
                    ? "Department / Subject"
                    : "Course"}
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder={
                    signupRole === "educator"
                      ? "Example: Maths Faculty, Science Teacher"
                      : "Example: 10th SSC, JEE, NEET, Banking"
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  {signupRole === "educator"
                    ? "Faculty Email"
                    : "Student Email"}
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(event) => setStudentEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder={
                    signupRole === "educator"
                      ? "faculty@example.com"
                      : "student@example.com"
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  {signupRole === "educator"
                    ? "Faculty Number"
                    : "Student Number"}
                </label>
                <input
                  type="tel"
                  value={studentMobile}
                  onChange={(event) =>
                    setStudentMobile(normalizePhone(event.target.value))
                  }
                  inputMode="numeric"
                  maxLength={10}
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder={
                    signupRole === "educator"
                      ? "Enter faculty 10-digit number"
                      : "Enter student 10-digit number"
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  Parent Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  autoComplete="name"
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder="Enter parent full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  Parent Email
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(event) => setParentEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder="parent@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  Parent Number
                </label>
                <input
                  type="tel"
                  value={parentMobile}
                  onChange={(event) =>
                    setParentMobile(normalizePhone(event.target.value))
                  }
                  inputMode="numeric"
                  maxLength={10}
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder="Enter parent 10-digit number"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
                  Student Number
                </label>
                <input
                  type="tel"
                  value={linkedStudentMobile}
                  onChange={(event) =>
                    setLinkedStudentMobile(normalizePhone(event.target.value))
                  }
                  inputMode="numeric"
                  maxLength={10}
                  required
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none ring-blue-500/10 transition-all placeholder:text-slate-300 focus:ring-4"
                  placeholder="Enter student's registered number"
                />
              </div>
            </>
          )
        ) : (
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
        )}

        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-[var(--color-heading)] opacity-60">
            Secure Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
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
            {isPending
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : signupRole === "student"
                  ? "Create Student Account"
                  : signupRole === "educator"
                    ? "Request Faculty Account"
                    : "Create Parent Account"}

            {!isPending && (
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            )}
          </span>
        </button>

        <p className="text-center text-sm font-bold text-[var(--color-muted)]">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="font-black text-blue-600 hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </form>
    </div>
  );
}
