"use client";

import { useMemo, useState } from "react";

import type { DemoCredential } from "@/lib/types";

const roleDescriptions = {
  student: "Go straight to tests, notices, and materials.",
  educator: "Open batches, grading, and teaching tools.",
  admin: "Manage accounts, roles, and access.",
  parent: "Monitor progress, attendance, and feedback.",
} as const;

type MockLoginFormProps = {
  credentials: DemoCredential[];
  compact?: boolean;
  onSuccess?: () => void;
};

export function MockLoginForm({ credentials, compact = false, onSuccess }: MockLoginFormProps) {
  const fallbackCredential =
    credentials[0] ?? {
      role: "student" as const,
      label: "Student Workspace",
      email: "",
      password: "",
    };
  const [selectedRole, setSelectedRole] = useState<DemoCredential["role"]>(
    "student",
  );
  const selectedCredential = useMemo(
    () => credentials.find((item) => item.role === selectedRole) ?? fallbackCredential,
    [credentials, fallbackCredential, selectedRole],
  );
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    if (!selectedCredential.email || !selectedCredential.password) {
      setError("This portal role is not ready yet.");
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedCredential.email,
          password: selectedCredential.password,
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
      setError("Unable to reach the local login route.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={compact ? "space-y-5" : "space-y-7"}>
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <p className="section-label">Quick Portal Access</p>
        <h2
          className={`font-semibold tracking-[-0.05em] text-[var(--color-heading)] ${
            compact ? "text-2xl leading-tight sm:text-3xl" : "text-4xl"
          }`}
        >
          Select Your Academy Role
        </h2>
        <p className={`max-w-2xl text-sm text-[var(--color-muted)] ${compact ? "leading-6" : "leading-7"}`}>
          Choose a role to access the corresponding dashboard. Credentials will be applied automatically for quick entry.
        </p>
      </div>

      <div className={`surface-soft rounded-[2rem] ${compact ? "p-3" : "p-4"}`}>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {credentials.map((credential) => {
            const isSelected = credential.role === selectedRole;

            return (
              <button
                key={credential.role}
                type="button"
                onClick={() => {
                  setSelectedRole(credential.role);
                  setError("");
                }}
                className={`min-h-12 rounded-[1.2rem] border px-3 py-3 text-sm font-semibold ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-highlight)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)]"
                }`}
              >
                {credential.label.replace(" Workspace", "").replace(" Console", "").replace(" Preview", "")}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
          {roleDescriptions[selectedCredential.role]}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="action-button w-full justify-center px-6 py-4 text-base disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isPending ? "Opening..." : `Continue as ${selectedCredential.label}`}
        </button>
      </form>
    </div>
  );
}
