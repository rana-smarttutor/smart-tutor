"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center pb-16 pt-10">
      <section className="surface w-full rounded-[2rem] p-6 sm:p-10 text-center">
        <span className="inline-block text-6xl sm:text-7xl mb-2" role="img" aria-label="warning">
          ⚠️
        </span>
        <p className="section-label justify-center">Something Went Wrong</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-[-0.05em] text-[var(--color-heading)]">
          SmartIQ Institute hit an unexpected error
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-sm leading-7 text-[var(--color-muted)]">
          Our servers ran into a problem. Please try again — if the issue persists, 
          contact our support team.
        </p>
        {error.digest && (
          <p className="mt-4 text-xs text-[var(--color-muted)] font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <button
            onClick={reset}
            className="action-button justify-center px-6 py-4 cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="surface-soft inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-semibold text-[var(--color-heading)]"
          >
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
