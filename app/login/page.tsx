import Link from "next/link";
import { redirect } from "next/navigation";

import { LiveClock } from "@/components/live-clock";
import { MockLoginForm } from "@/components/mock-login-form";
import { RealLoginForm } from "@/components/real-login-form";
import { getSessionUser } from "@/lib/auth";
import { getDemoCredentials } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [session, demoCredentials] = await Promise.all([getSessionUser(), getDemoCredentials()]);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="section-shell flex min-h-[calc(100dvh-6rem)] items-center pb-10 pt-6 sm:pt-10">
      <div className="grid w-full gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-stretch">
        <section className="surface order-1 h-full rounded-[2rem] p-6 sm:p-8 xl:order-2 xl:p-10">
          <div className="space-y-8">
            <RealLoginForm />
            <div className="border-t border-[var(--color-border)] pt-8">
              <MockLoginForm credentials={demoCredentials} />
            </div>
          </div>
        </section>

        <section className="dashboard-sidebar order-2 h-full overflow-hidden rounded-[2rem] p-6 sm:p-8 xl:order-1 xl:p-10">
          <div>
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

            <div className="mt-10 max-w-xl space-y-5">
              <p className="text-sm font-semibold tracking-[0.04em] text-[var(--color-accent)]">
                Smart Tutor Access
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-heading)] sm:text-5xl">
                Secure access to your academy workspace.
              </h1>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Sign in with your registered email and password to access your personalized learning or teaching dashboard.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <LiveClock label="Campus Time" />
              <div className="surface-soft rounded-[1.75rem] p-5">
                <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-accent)]">
                  Instant Access
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-heading)]">
                  Account login is now live
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Access your courses, materials, and batch updates from any device. Select your role below for direct portal entry.
                </p>
              </div>
            </div>
  
          </div>
        </section>
      </div>
    </main>
  );
}
