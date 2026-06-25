import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center pb-16 pt-10">
      <section className="surface w-full rounded-[2rem] p-6 sm:p-10 text-center">
        <span className="inline-block text-7xl sm:text-8xl font-black tracking-[-0.08em] text-[var(--color-primary)] opacity-20 select-none">
          404
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-[-0.05em] text-[var(--color-heading)]">
          This Page Is Out of Syllabus &mdash; Try Again
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-sm leading-7 text-[var(--color-muted)]">
          Looks like you wandered into a chapter that doesn&apos;t exist yet. 
          The page you&apos;re looking for might have been moved, deleted, or never written.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <Link href="/" className="action-button justify-center px-6 py-4">
            Back to Homepage
          </Link>
          <Link
            href="/library"
            className="surface-soft inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-semibold text-[var(--color-heading)]"
          >
            Browse Library
          </Link>
        </div>
      </section>
    </main>
  );
}
