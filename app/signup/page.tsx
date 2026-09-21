import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegistrationForm } from "@/components/registration-form";
import { getSessionUser } from "@/lib/auth";
import { safeReturnPath, requiresStudentRole } from "@/lib/access-routes";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Sign up for SmartIQ Institute to access personalised learning, expert educators, mock tests, performance tracking, and more. Create your student or faculty account today.",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <main className="section-shell mx-auto flex min-h-[calc(100dvh-8rem)] w-full justify-center px-3 py-8 sm:px-5 sm:py-10">
        <section className="w-full max-w-[780px] self-start border-0 bg-transparent p-0 shadow-none">
          <div className="mx-auto w-full max-w-[760px]">
            <RegistrationForm />
          </div>
        </section>
      </main>
    </>
  );
}
