import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
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

      <main className="min-w-0 overflow-x-clip bg-[#F7F9FD] pb-16">
        {/* COMPACT HERO SECTION */}
        <section className="relative isolate overflow-hidden bg-gradient-to-r from-[#082B62] via-[#0A4B96] to-[#1674C5]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full border-[36px] border-white/5"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-1 w-full bg-gradient-to-r from-[#F0C25A] via-[#F7D883] to-[#F0C25A]"
          />

          <div className="section-shell relative z-10 py-8 sm:py-10 lg:py-9">
            <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-6">
              {/* HERO TEXT */}
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-[0.24em] text-blue-100">
                    Contact Us
                  </span>

                  <span className="h-[2px] w-12 rounded-full bg-[#F4C95D]" />
                </div>

                <h1 className="text-[clamp(2.25rem,4.2vw,3.8rem)] font-black leading-[1.12] tracking-tight text-white">
                  Let&apos;s Start a
                  <br />
                  <span className="text-[#F6D77E]">Conversation</span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-blue-50 sm:text-base sm:leading-7">
                  Have a question about our courses, admissions, career guidance
                  or campus? We&apos;re here to help you take the next step with
                  confidence.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="#admission-enquiry"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F4CA68] px-6 py-2.5 text-sm font-black text-[#082B62] shadow-lg transition hover:bg-[#FFDA84]"
                  >
                    Send an Enquiry
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href="#visit-campus"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <MapPin className="h-4 w-4" />
                    Visit Our Campus
                  </a>
                </div>
              </div>

              {/* ENLARGED TRANSPARENT ILLUSTRATION */}
              <div className="relative mx-auto flex h-[260px] w-full items-center justify-center overflow-visible sm:h-[320px] lg:h-[390px]">
                <Image
                  src="/images/c-s-i-2.png"
                  alt="SmartIQ Institute admissions, career counselling and WhatsApp support"
                  width={1122}
                  height={1402}
                  priority
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 420px, 42vw"
                  className="h-[300px] w-auto max-w-none object-contain drop-shadow-[0_15px_30px_rgba(2,18,46,0.15)] sm:h-[380px] lg:h-[440px] xl:h-[470px]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="section-shell">
          {/* QUICK CONTACT CARDS */}
          <section
            aria-label="Quick contact information"
            className="relative z-20 -mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {contactMethods.map((item) => {
              const isPhone = item.icon === "Phone";
              const isWhatsApp = item.icon === "WhatsApp";

              const Icon = isPhone ? Phone : isWhatsApp ? MessageCircle : Mail;

              const iconBackground = isPhone
                ? "bg-blue-50 text-blue-700"
                : isWhatsApp
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-indigo-50 text-indigo-700";

              const description = isPhone
                ? "Speak with our admissions team"
                : isWhatsApp
                  ? "Chat with us for quick support"
                  : "Send us your questions anytime";

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(10,37,76,0.09)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_35px_rgba(10,37,76,0.13)]"
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBackground}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-[#102A52]">
                      {item.label}
                    </h2>

                    <p className="mt-1 break-all text-sm font-bold text-slate-800">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {description}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </a>
              );
            })}
          </section>

          {/* ENQUIRY FORM AND CAMPUS DETAILS */}
          <section className="mt-9 grid min-w-0 items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {/* ENQUIRY FORM */}
            <div
              id="admission-enquiry"
              className="min-w-0 scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(20,45,90,0.06)] sm:p-7"
            >
              <div className="mb-6 flex items-start gap-4 border-b border-slate-100 pb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4D9] text-[#B88717]">
                  <Mail className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight text-[#112D59] sm:text-2xl">
                    Send Us an Enquiry
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Fill in the form and our team will get back to you.
                  </p>
                </div>
              </div>

              <ContactEnquiryForm />
            </div>

            {/* CAMPUS CONTACT INFORMATION */}
            <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(20,45,90,0.06)] sm:p-7">
              <div className="mb-7 flex items-start gap-4 border-b border-slate-100 pb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4D9] text-[#B88717]">
                  <GraduationCap className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight text-[#112D59] sm:text-2xl">
                    Campus Contact Information
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Visit us, call us or reach out online. We&apos;d love to
                    hear from you.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {/* ADDRESS */}
                <div className="flex items-start gap-4 pb-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D9] text-[#B88717]">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-[#102A52]">
                      Campus Address
                    </h3>

                    <p className="mt-2 break-words text-sm leading-7 text-slate-600">
                      {data.profile.address}
                    </p>

                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline"
                    >
                      Get Directions
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* HOURS */}
                <div className="flex items-start gap-4 py-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D9] text-[#B88717]">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-[#102A52]">
                      Operating Hours
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {data.profile.hours}
                    </p>
                  </div>
                </div>

                {/* PHONE AND WHATSAPP */}
                {contactMethods
                  .filter(
                    (item) => item.icon === "Phone" || item.icon === "WhatsApp",
                  )
                  .map((item) => {
                    const Icon = item.icon === "Phone" ? Phone : MessageCircle;

                    return (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 py-6"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D9] text-[#B88717]">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-[#102A52]">
                            {item.label}
                          </h3>

                          <a
                            href={item.href}
                            target={
                              item.href.startsWith("http")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              item.href.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="mt-2 block break-all text-sm font-semibold text-slate-600 hover:text-blue-700"
                          >
                            {item.value}
                          </a>
                        </div>
                      </div>
                    );
                  })}

                {/* EMAIL */}
                <div className="flex items-start gap-4 pt-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D9] text-[#B88717]">
                    <Mail className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-[#102A52]">Email</h3>

                    <a
                      href={`mailto:${OFFICIAL_EMAIL}`}
                      className="mt-2 block break-all text-sm font-semibold text-slate-600 hover:text-blue-700"
                    >
                      {OFFICIAL_EMAIL}
                    </a>
                  </div>
                </div>
              </div>

              {/* SOCIAL LINKS */}
              {data.socialLinks.length > 0 && (
                <div className="mt-8 rounded-2xl bg-[#F3F7FD] p-5">
                  <h3 className="text-sm font-black text-[#112D59]">
                    Connect With Us
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Follow our official channels for updates and announcements.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.socialLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                      >
                        {item.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* MAP SECTION */}
          <section id="visit-campus" className="mt-8 scroll-mt-28">
            <div className="grid min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(20,45,90,0.06)] lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
              <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4D9] text-[#B88717]">
                  <MapPin className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-2xl font-black text-[#112D59]">
                  Find Us on the Map
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Visit SmartIQ Institute for personalised guidance, admission
                  assistance and course information.
                </p>

                <p className="mt-4 break-words text-sm leading-6 text-slate-500">
                  {data.profile.address}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {branches.map((branch) => (
                    <a
                      key={branch.name}
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        branch.mapQuery || branch.address,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0A3F85] to-[#075CAD] px-5 py-3 text-xs font-black text-white shadow-sm transition hover:opacity-90"
                    >
                      <MapPin className="h-4 w-4" />
                      Get Directions
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="min-h-[300px] min-w-0 overflow-hidden border-t border-slate-100 lg:min-h-[360px] lg:border-l lg:border-t-0">
                <LazyCampusMap
                  mapLink={mapLink}
                  address={data.profile.address}
                />
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#092F67] via-[#0B4B92] to-[#0A65B1] px-6 py-8 text-white sm:px-10 sm:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5"
            />

            <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
              <div className="flex max-w-2xl items-start gap-5">
                <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F4CA68] sm:flex">
                  <GraduationCap className="h-9 w-9" />
                </div>

                <div>
                  <h2 className="text-2xl font-black leading-tight sm:text-3xl">
                    Ready to Take the Next Step?
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
                    Explore our career-focused programmes or speak with our
                    admissions team to discover the right learning opportunity.
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-[#0A3F85] transition hover:bg-blue-50"
                >
                  <BookOpen className="h-4 w-4" />
                  Explore Courses
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#admission-enquiry"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F4CA68] px-6 py-3 text-sm font-black text-[#082B62] transition hover:bg-[#FFDA84]"
                >
                  <Send className="h-4 w-4" />
                  Send Enquiry
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
