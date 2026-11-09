import Link from "next/link";
import Image from "next/image";

import { getPublicInstituteData } from "@/lib/data-store";
import { LazyCampusMap } from "@/components/lazy-campus-map";

const OFFICIAL_CONTACT_EMAIL = "info@smartiqinstitute.in";

export async function SiteFooter() {
  const data = await getPublicInstituteData();

  const branches = data.profile.branches?.length
    ? data.profile.branches
    : [
        {
          name: "SmartIQ Institute Campus",
          address: data.profile.address,
          mapQuery: data.profile.address,
        },
      ];

  const contactPhone = data.profile.phone;
  const contactHours = data.profile.hours;

  const affiliatedInstitutes = data.profile.affiliatedInstitutes ?? [];

  const primaryMapLink = `https://maps.google.com/?q=${encodeURIComponent(
    branches[0]?.mapQuery || branches[0]?.address || data.profile.address,
  )}`;

  return (
    <footer className="section-shell pb-8 pt-6">
      <div className="surface graph-paper rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_0.9fr_1.1fr]">
          {/* =========================================
              INSTITUTE INFORMATION
          ========================================= */}
          <div>
            <Link
              href="/"
              className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]"
            >
              SmartIQ Institute
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--color-muted)]">
              Admissions, learning, and institute operations in one workspace.
            </p>

            {/* FOUNDER */}
            <div className="mt-5 flex items-center gap-5">
              <Image
                src="/founder-temperory.jpeg"
                alt="Adv. Reena Ma'am"
                width={120}
                height={120}
                className="h-[120px] w-[120px] shrink-0 rounded-2xl border border-slate-200 bg-white object-cover object-top shadow-sm"
              />

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  MEET OUR FOUNDER
                </p>

                <h3 className="mt-2 text-xl font-black leading-tight tracking-tight text-[var(--color-heading)]">
                  Adv. Reena Ma&apos;am
                </h3>

                <p className="mt-1 text-xs font-bold text-blue-600">
                  Director &amp; Founder
                </p>
              </div>
            </div>

            {/* BRANCH ADDRESSES */}
            <div className="mt-5 space-y-2">
              {branches.map((branch) => (
                <p
                  key={branch.name}
                  className="text-sm font-semibold leading-6 text-[var(--color-heading)]"
                >
                  {branch.name}: {branch.address}
                </p>
              ))}
            </div>

            {/* CONTACT DETAILS */}
            <div className="mt-5 space-y-2 text-sm text-[var(--color-muted)]">
              {contactPhone ? (
                <p>
                  <span className="font-semibold text-[var(--color-heading)]">
                    Phone:{" "}
                  </span>
                  {contactPhone}
                </p>
              ) : null}

              <p>
                <span className="font-semibold text-[var(--color-heading)]">
                  Email:{" "}
                </span>

                <a
                  href={`mailto:${OFFICIAL_CONTACT_EMAIL}`}
                  className="break-all text-blue-700 underline-offset-4 transition-colors hover:text-blue-900 hover:underline"
                >
                  {OFFICIAL_CONTACT_EMAIL}
                </a>
              </p>

              {contactHours ? (
                <p>
                  <span className="font-semibold text-[var(--color-heading)]">
                    Hours:{" "}
                  </span>
                  {contactHours}
                </p>
              ) : null}

              {affiliatedInstitutes.length > 0 ? (
                <p className="leading-6">{affiliatedInstitutes.join(" | ")}</p>
              ) : null}
            </div>
          </div>

          {/* =========================================
              SOCIAL MEDIA
          ========================================= */}
          <div>
            <p className="section-label">Social media</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.socialLinks.slice(0, 4).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-tile surface-soft rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--color-heading)]"
                  style={{
                    ["--social-color" as string]: item.color,
                    ["--social-glow" as string]: item.glow,
                  }}
                >
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* =========================================
              REUSABLE ANIMATED CAMPUS MAP
          ========================================= */}
          <div className="min-w-0">
            <p className="section-label">Campus map</p>

            <div className="mt-4">
              <LazyCampusMap
                compact
                mapLink={primaryMapLink}
                address={data.profile.address}
                branches={branches}
              />
            </div>
          </div>
        </div>

        {/* =========================================
            LEGAL FOOTER
        ========================================= */}
        <div className="mt-8 border-t border-[var(--color-border)] pt-8">
          <div className="flex flex-col gap-4 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <Link
                href="/contact"
                className="font-bold text-blue-700 transition-colors hover:text-blue-900"
              >
                Contact Us
              </Link>

              <Link
                href="/privacy"
                className="transition-colors hover:text-[var(--color-primary)]"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="transition-colors hover:text-[var(--color-primary)]"
              >
                Terms &amp; Conditions
              </Link>

              <Link
                href="/eula"
                className="transition-colors hover:text-[var(--color-primary)]"
              >
                EULA
              </Link>
            </nav>

            <p className="max-w-2xl leading-relaxed sm:text-right">
              © {new Date().getFullYear()} SmartIQ Institute Academy. In
              operations since 2018. All rights reserved. Results may differ
              between users. Promotional claims may be stylized.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
