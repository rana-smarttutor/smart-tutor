import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, GraduationCap, Smartphone } from "lucide-react";
import QRCode from "qrcode";

import { RealLoginForm } from "@/components/real-login-form";
import { getSessionUser } from "@/lib/auth";

const APK_DOWNLOAD_URL =
  "https://s4hwk9dbjuligkqz.public.blob.vercel-storage.com/smart%20tutors.apk";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Smart IQ Institute account to access your dashboard, courses, tests, performance reports, and more.",
  alternates: {
    canonical: "https://smarttutors.co.in/login",
  },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSessionUser();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarttutors.co.in" },
      { "@type": "ListItem", "position": 2, "name": "Sign In", "item": "https://smarttutors.co.in/login" },
    ],
  };

  if (session) {
    redirect("/dashboard");
  }

  const apkQrSvg = await QRCode.toString(APK_DOWNLOAD_URL, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  const apkQrDataUrl = `data:image/svg+xml;base64,${Buffer.from(
    apkQrSvg,
  ).toString("base64")}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center py-4">
        <div className="grid w-full items-stretch gap-5 lg:grid-cols-2">
          <section className="order-1 relative overflow-hidden rounded-3xl border border-slate-200/60 bg-[var(--color-cream)] p-4 shadow-2xl sm:p-8 lg:order-2">
            <div className="pointer-events-none absolute -bottom-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-[var(--color-cream-soft)] opacity-60 blur-[100px]" />

            <div className="relative z-10 mx-auto w-full max-w-md">
              <RealLoginForm />

              <div className="mt-6 space-y-3 text-center">
                <p className="text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-bold text-slate-900 underline decoration-slate-900 underline-offset-4 transition-colors hover:text-[#2563EB] hover:decoration-[#2563EB]"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </section>

          <section className="order-2 relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[var(--color-navy)] p-4 text-white shadow-2xl sm:p-8 lg:order-1">
            <div className="pointer-events-none absolute -top-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-blue-500 opacity-10 blur-[120px]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-strong)]">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </span>
                  Smart IQ Institute
                </Link>

                <Link
                  href="/courses"
                  className="rounded-lg border border-slate-600 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/10 hover:text-white"
                >
                  View Courses
                </Link>
              </div>

              <div className="mb-8 flex flex-grow flex-col justify-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold)]">
                  Smart IQ Institute Access
                </p>

                <h1 className="mb-5 text-3xl font-semibold leading-tight tracking-[-0.02em] text-slate-100 [font-family:var(--font-fancy)] sm:text-4xl">
                  Secure access to your academy workspace.
                </h1>

                <p className="max-w-md text-sm leading-relaxed text-slate-400">
                  Sign in with your registered email and password to access your
                  personalised learning or teaching dashboard.
                </p>
              </div>

              <div className="my-6 h-px w-full bg-slate-800" />

              <div className="group/app relative rounded-2xl border border-[var(--color-gold)]/40 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-500 hover:border-[var(--color-gold)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <div className="absolute left-0 top-0 h-4 w-4 rounded-tl-xl border-l-2 border-t-2 border-[var(--color-gold)]" />
                <div className="absolute right-0 top-0 h-4 w-4 rounded-tr-xl border-r-2 border-t-2 border-[var(--color-gold)]" />
                <div className="absolute bottom-0 left-0 h-4 w-4 rounded-bl-xl border-b-2 border-l-2 border-[var(--color-gold)]" />
                <div className="absolute bottom-0 right-0 h-4 w-4 rounded-br-xl border-b-2 border-r-2 border-[var(--color-gold)]" />

                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="group/qr-parent relative shrink-0 cursor-zoom-in">
                      <div className="relative z-20 rounded-xl border border-slate-100 bg-white p-2 shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/qr-parent:scale-150 group-hover/qr-parent:shadow-2xl">
                        <img
                          src={apkQrDataUrl}
                          alt="Download Smart IQ Institute Android app QR code"
                          className="h-20 w-20 rounded-md sm:h-24 sm:w-24"
                        />
                      </div>
                    </div>

                    <span className="hidden animate-pulse items-center gap-1 text-xs text-slate-400 lg:inline-flex">
                      <ArrowRight className="h-3 w-3" />
                      Hover to Scan
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-gold)]">
                      Mobile Access
                    </p>

                    <h3 className="text-sm font-semibold leading-tight text-white">
                      Smart IQ Institute Android App
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <a
                        href={APK_DOWNLOAD_URL}
                        download
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-600"
                      >
                        <Smartphone className="h-4 w-4" />
                        Download APK
                      </a>
                    </div>
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
