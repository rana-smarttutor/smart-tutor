"use client";

import Link from "next/link";

export default function DashboardError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="section-shell min-h-screen pb-16 pt-10">
      <section className="surface rounded-[2rem] p-6 sm:p-10">
        <p className="section-label">Dashboard Error</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--color-heading)]">
          Smart Tutors could not reach MongoDB
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
          The dashboard reads live data from MongoDB now. Fix the connection details or DNS/network access,
          then reload.
        </p>
        <div className="mt-6 surface-soft rounded-[1.75rem] p-5">
          <p className="text-sm font-semibold text-[var(--color-heading)]">Details</p>
          <p className="mt-2 break-words text-sm leading-7 text-[var(--color-muted)]">
            {error.message}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="action-button justify-center px-6 py-4">
            Back to Login
          </Link>
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

