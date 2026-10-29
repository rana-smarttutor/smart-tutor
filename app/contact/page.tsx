import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import ContactEnquiryForm from "@/components/contact-enquiry-form";
import { LazyCampusMap } from "@/components/lazy-campus-map";
import { getPublicInstituteData } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Contact Us | SmartIQ Institute",
  description:
    "Contact SmartIQ Institute for admissions, courses, counselling and student support.",
  alternates: {
    canonical: "https://smartiqinstitute.in/contact",
  },
};

export const revalidate = 3600;

const OFFICIAL_EMAIL = "info@smartiqinstitute.in";

export default async function ContactPage() {
  const data = await getPublicInstituteData();

  const mapLink = `https://maps.google.com/?q=${encodeURIComponent(
    data.profile.address,
  )}`;

  const branches = data.profile.branches?.length
    ? data.profile.branches
    : [
        {
          name: "SmartIQ Institute Campus",
          address: data.profile.address,
          mapQuery: data.profile.address,
        },
      ];

  const contactMethods = data.contactMethods
    .filter((item) => ["Phone", "WhatsApp", "Email"].includes(item.icon ?? ""))
    .map((item) =>
      item.icon === "Email"
        ? {
            ...item,
            value: OFFICIAL_EMAIL,
            href: `mailto:${OFFICIAL_EMAIL}`,
          }
        : item,
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
        name: "Contact Us",
        item: "https://smartiqinstitute.in/contact",
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

      <main className="section-shell min-w-0 overflow-x-clip pb-16 pt-6 sm:pt-10 lg:pb-20">
        {/* MAIN CONTACT AREA */}
        <section className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-9 xl:gap-12">
          {/* LEFT COLUMN */}
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              We&apos;re Here to Help
            </div>

            <h1 className="max-w-xl text-[clamp(2.3rem,4.1vw,4.1rem)] font-black leading-[1.12] tracking-tight text-[var(--color-heading)]">
              Get in <span className="text-blue-600">Touch.</span>
            </h1>

            <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-[var(--color-muted)] sm:text-base">
              Questions about admissions, courses or career guidance? Our team
              is ready to help you make the right academic decision.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
            </div>

            {/* QUICK CONTACT METHODS */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-black text-slate-900">
                Contact Information
              </h2>

              <div className="space-y-3">
                {contactMethods.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md sm:p-4"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{
                        backgroundColor: item.color || "#2563eb",
                      }}
                    >
                      {item.icon === "Phone" ? (
                        <Phone className="h-5 w-5" />
                      ) : item.icon === "WhatsApp" ? (
                        <MessageCircle className="h-5 w-5" />
                      ) : (
                        <Mail className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {item.label}
                      </p>

                      <p className="mt-1 break-all text-sm font-bold text-slate-900 sm:text-base">
                        {item.value}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            </div>

            {/* SHORT CAMPUS INFORMATION */}
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900">
                    Visit SmartIQ Institute
                  </h3>

                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                    {data.profile.address}
                  </p>

                  <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600">
                    <Clock3 className="h-4 w-4 shrink-0 text-blue-700" />
                    {data.profile.hours}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - ENQUIRY FORM */}
          <div id="admission-enquiry" className="min-w-0 scroll-mt-28">
            <ContactEnquiryForm />
          </div>
        </section>

        {/* CAMPUS SECTION */}
        <section id="visit-campus" className="mt-12 scroll-mt-28 sm:mt-16">
          <div className="mb-6">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              Find Us
            </p>

            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Visit Our Campus
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Visit our campus for admission assistance, course information and
              personalised counselling.
            </p>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="flex min-w-0 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0a1b38] to-[#1748a0] p-6 text-white sm:p-8">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <MapPin className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-black text-white">
                  SmartIQ Institute
                </h3>

                <p className="mt-3 break-words text-sm leading-7 text-blue-100">
                  {data.profile.address}
                </p>

                <div className="mt-6 flex items-start gap-3">
                  <Clock3 className="h-5 w-5 shrink-0 text-blue-200" />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      Campus Hours
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-6 text-white">
                      {data.profile.hours}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {branches.map((branch) => (
                  <a
                    key={branch.name}
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      branch.mapQuery || branch.address,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-blue-800 transition hover:bg-blue-50"
                  >
                    <MapPin className="h-4 w-4" />
                    Get Directions
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <LazyCampusMap mapLink={mapLink} address={data.profile.address} />
            </div>
          </div>
        </section>

        {/* LEADERSHIP AND SOCIAL NETWORK */}
        <section className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-black text-slate-900">
                Leadership Desk
              </h2>
            </div>

            <p className="text-lg font-black text-slate-900">
              {data.profile.directorName}
            </p>

            <p className="mt-1 text-sm font-bold text-blue-600">
              {data.profile.directorTitle}
            </p>

            {data.profile.affiliatedInstitutes?.length > 0 && (
              <p className="mt-4 break-words rounded-xl bg-blue-50 p-4 text-sm leading-6 text-slate-600">
                {data.profile.affiliatedInstitutes.join(" | ")}
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Connect With Us
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Follow our official channels for institute updates.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="min-w-0 break-words">{item.label}</span>

                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-7 text-center sm:px-8 sm:py-9">
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Take the Next Step with SmartIQ
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Discover our programmes and find the right learning opportunity for
            your goals.
          </p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Explore Courses
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#admission-enquiry"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Enquire Now
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
