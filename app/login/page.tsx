import Link from "next/link";
import { redirect } from "next/navigation";

import { LiveClock } from "@/components/live-clock";
import { MockLoginForm } from "@/components/mock-login-form";
import { RealLoginForm } from "@/components/real-login-form";
import { getSessionUser } from "@/lib/auth";
import { getDemoCredentials } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [session] = await Promise.all([getSessionUser()]);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center pb-6 pt-4 sm:pt-6">
      <div className="grid w-full gap-6 xl:grid-cols-2 xl:items-stretch">
        <section className="surface order-1 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-2">
          <div className="mx-auto w-full max-w-md">
            <RealLoginForm />
          </div>
        </section>

        <section className="dashboard-sidebar order-2 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-1">
          <div className="mx-auto w-full max-w-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="text-3xl font-semibold tracking-[-0.06em] text-[var(--color-heading)]">
                Smart Tutor
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
                Smart Tutor Access
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-heading)] sm:text-5xl">
                Secure access to your academy workspace.
              </h1>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Sign in with your registered email and password to access your personalized learning or teaching dashboard.
              </p>
              <div className="flex flex-wrap gap-4 pt-1">
                <p className="text-sm font-semibold text-[var(--color-heading)]">
                  Don't have an account? 
                </p>
                <Link href="/contact" className="text-sm font-bold text-blue-600 hover:underline">
                  Contact Admissions to Register
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
