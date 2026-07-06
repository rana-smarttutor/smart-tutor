import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegistrationForm } from "@/components/registration-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Sign up for Smart Tutors to access personalised learning, expert educators, mock tests, performance tracking, and more. Create your student or faculty account today.",
  alternates: {
    canonical: "https://smarttutors.co.in/signup",
  },
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getSessionUser();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarttutors.co.in" },
      { "@type": "ListItem", "position": 2, "name": "Create Account", "item": "https://smarttutors.co.in/signup" },
    ],
  };

  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center pb-6 pt-4 sm:pt-6">
      <div className="grid w-full gap-6 xl:grid-cols-2 xl:items-stretch">
        <section className="surface order-1 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-2">
          <div className="mx-auto w-full max-w-2xl">
            <RegistrationForm />
          </div>
        </section>

        <section className="dashboard-sidebar order-2 flex h-full flex-col justify-start rounded-[2rem] p-8 sm:p-10 xl:order-1">
          <div className="mx-auto w-full max-w-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="text-3xl font-semibold tracking-[-0.06em] text-[var(--color-heading)]"
              >
                Smart Tutors
              </Link>

              <Link
                href="/courses"
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
              >
                View Courses
              </Link>
            </div>

            <div className="mt-10 space-y-4">
              <p className="text-sm font-semibold tracking-[0.04em] text-[var(--color-accent)]">
                Join Smart Tutors
              </p>

              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-heading)] sm:text-5xl">
                Start your learning journey today.
              </h1>

              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Create your account to access personalised learning, expert
                educators, mock tests, performance tracking, and more.
              </p>

              <div className="mt-8 space-y-4 border-t border-[var(--color-border)] pt-8">
                <div className="rounded-3xl border border-blue-100/50 bg-blue-50/40 p-5 backdrop-blur-sm">
                  <h3 className="text-base font-black leading-tight text-slate-900">
                    Already have an account?
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Sign in to access your dashboard and continue where you left
                    off.
                  </p>

                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                  >
                    Sign In →
                  </Link>
                </div>

                <div className="rounded-3xl border border-teal-100/50 bg-teal-50/40 p-5 backdrop-blur-sm">
                  <h3 className="text-base font-black leading-tight text-teal-800">
                    Why join Smart Tutors?
                  </h3>

                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Expert educators & personalised mentoring
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Comprehensive test series & mock exams
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Performance analytics & progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Digital library & AI-powered learning tools
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  );
}
