import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BookOpen,
  ChartNoAxesCombined,
  GraduationCap,
  Laptop,
} from "lucide-react";

import { RegistrationForm } from "@/components/registration-form";
import { getSessionUser } from "@/lib/auth";
import { safeReturnPath, requiresStudentRole } from "@/lib/access-routes";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your SmartIQ Institute account to access courses, learning resources, mock tests, and academic progress tracking.",
  alternates: {
    canonical: "https://smartiqinstitute.in/signup",
  },
};

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
  }>;
}) {
  const session = await getSessionUser();
  const query = await searchParams;

  const next = safeReturnPath(
    Array.isArray(query.next) ? query.next[0] : query.next,
  );

  if (session) {
    const studentOnly = next
      ? requiresStudentRole(
          new URL(next, "https://smartiqinstitute.in").pathname,
        )
      : false;

    redirect(
      next && (!studentOnly || session.role === "student")
        ? next
        : "/dashboard",
    );
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smartiqinstitute.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Create Account",
        item: "https://smartiqinstitute.in/signup",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <main className="mt-0 min-h-screen bg-[#F7F9FD] pt-0">
        <div className="mx-auto max-w-[1500px] px-4 pb-8 pt-0 sm:px-6 lg:px-8 lg:pb-12 lg:pt-0">
          <div className="grid items-stretch gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* LEFT INFORMATION PANEL */}
            <aside className="relative isolate overflow-hidden rounded-2xl border border-[#244777] bg-[linear-gradient(160deg,#0B1F43_0%,#12376C_60%,#1755A5_100%)] px-6 py-9 text-white sm:px-8 lg:py-14">
              <div className="relative z-10">
                {/* ICON */}
                <div className="mb-9 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#1958D5] shadow-sm">
                  <GraduationCap size={25} strokeWidth={1.8} />
                </div>

                {/* HEADING */}
                <h1 className="max-w-[250px] text-3xl font-bold leading-[1.2] tracking-tight text-white lg:text-[36px]">
                  Create Your Account
                </h1>

                {/* DESCRIPTION */}
                <p className="mt-5 text-[15px] leading-7 text-blue-100">
                  Join SmartIQ Institute and access courses, mock tests, the
                  Digital Library and personalised learning.
                </p>

                {/* DIVIDER */}
                <div className="my-9 h-px bg-white/20" />

                {/* BENEFITS */}
                <div className="space-y-7">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100 ring-1 ring-white/20">
                      <BookOpen size={21} strokeWidth={1.8} />
                    </span>

                    <span className="text-sm font-semibold text-white">
                      Learn from experts
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100 ring-1 ring-white/20">
                      <ChartNoAxesCombined size={21} strokeWidth={1.8} />
                    </span>

                    <span className="text-sm font-semibold text-white">
                      Track your progress
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100 ring-1 ring-white/20">
                      <Laptop size={21} strokeWidth={1.8} />
                    </span>

                    <span className="text-sm font-semibold text-white">
                      Access anytime, anywhere
                    </span>
                  </div>
                </div>
              </div>

              {/* DECORATIVE ELEMENTS */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full border-[55px] border-white/10"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-44 -left-24 h-72 w-72 rounded-full bg-blue-400/10"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl"
              />
            </aside>

            {/* RIGHT REGISTRATION FORM */}
            <section className="min-w-0 rounded-2xl border border-[#E0E7F2] bg-white px-4 py-6 shadow-[0_8px_35px_-24px_rgba(18,44,92,0.2)] sm:px-7 sm:py-8 xl:px-10">
              <RegistrationForm />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
