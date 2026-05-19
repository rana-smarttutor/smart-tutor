import Link from "next/link";
import Image from "next/image";

import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { LegalModals } from "@/components/legal-modals";
import { getPublicInstituteData } from "@/lib/data-store";

export async function SiteFooter() {
  const data = await getPublicInstituteData();
  const mapQuery = encodeURIComponent(data.profile.address);
  const mapSrc =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.017136012903!2d72.99560617520503!3d19.062984182138877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c1c3896c493f%3A0xd9b13c31e18e745e!2sSmartIQ%20Academy!5e0!3m2!1sen!2sin!4v1776943936994!5m2!1sen!2sin";

  return (
    <footer className="section-shell pb-8 pt-6">
      <RevealOnScroll className="surface graph-paper rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_0.9fr_1.1fr]">
          <div>
            <p className="max-w-md text-sm leading-7 text-[var(--color-muted)]">
              Admissions, learning, and institute operations in one workspace.
            </p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-heading)]">
                {data.profile.directorName} | {data.profile.directorTitle}
              </p>
              <p className="font-semibold text-[var(--color-heading)]">{data.profile.address}</p>
              <p>{data.profile.phone}</p>
              <p>{data.profile.email}</p>
              <p>{data.profile.hours}</p>
              <p>{data.profile.affiliatedInstitutes.join(" | ")}</p>
            </div>
          </div>

          <div>
            <p className="section-label">Social media</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.socialLinks.slice(0, 4).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
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

          <div>
            <p className="section-label">Campus map</p>
            <div className="media-frame map-frame mt-4 overflow-hidden rounded-[1.6rem]">
              <div className="map-frame-inner">
                <iframe
                  title="Smart Tutors footer campus map"
                  src={mapSrc}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
            <a
              href={`https://maps.google.com/?q=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-[var(--color-accent)]"
            >
              Open campus on Google Maps
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
            <LegalModals />
            <p className="max-w-2xl leading-relaxed sm:text-right">
              © {new Date().getFullYear()} Smart Tutors Academy. All rights reserved. 
              Results may differ between users. Promotional claims may be stylized.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </footer>
  );
}
