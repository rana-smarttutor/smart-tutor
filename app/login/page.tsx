import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RealLoginForm } from "@/components/real-login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Smart Tutors account to access your dashboard, courses, tests, performance reports, and more.",
  alternates: {
    canonical: "https://smarttutors.co.in/login",
  },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSessionUser();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center pb-6 pt-4 sm:pt-6">
      <div className="grid w-full gap-6 xl:grid-cols-2 xl:items-stretch">
        <section className="surface order-1 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-2">
          <div className="mx-auto w-full max-w-md">
            <RealLoginForm />

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-blue-600 hover:text-blue-700"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-sidebar order-2 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-1">
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
                Smart Tutors Access
              </p>

              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-heading)] sm:text-5xl">
                Secure access to your academy workspace.
              </h1>

              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Sign in with your registered email and password to access your
                personalised learning or teaching dashboard.
              </p>

              <div className="mt-8 border-t border-[var(--color-border)] pt-8">
                <div className="flex flex-col items-center gap-6 rounded-3xl border border-blue-100/50 bg-blue-50/40 p-5 backdrop-blur-sm sm:flex-row">
                  <div className="group/qr-parent relative flex shrink-0 items-center justify-center">
                    <div className="relative z-20 cursor-zoom-in rounded-2xl border border-blue-100 bg-white p-2.5 shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/qr-parent:scale-[2.8] group-hover/qr-parent:translate-x-14 group-hover/qr-parent:shadow-2xl">
                      <Image
                        src="/android app.png"
                        alt="Download Smart Tutors Android app QR code"
                        width={240}
                        height={240}
                        sizes="128px"
                        className="h-16 w-16 rounded-lg"
                      />

                      <div className="absolute inset-0 rounded-2xl bg-blue-600/5 opacity-0 transition-opacity group-hover/qr-parent:opacity-100" />
                    </div>

                    <div className="h-20 w-20" aria-hidden="true" />
                  </div>

                  <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                      Mobile Access
                    </p>

                    <h3 className="text-base font-black leading-tight text-slate-900">
                      Smart Tutors Android App
                    </h3>

                    <div className="mt-2 flex items-center gap-3">
                      <a
                        href="https://s4hwk9dbjuligkqz.public.blob.vercel-storage.com/smart%20tutors.apk"
                        download
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                      >
                        Download APK
                      </a>

                      <span className="hidden animate-pulse text-[10px] font-bold text-slate-400 lg:inline-block">
                        ← Hover to Scan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
