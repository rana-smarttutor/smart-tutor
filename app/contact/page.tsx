import { LiveClock } from "@/components/live-clock";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getPublicInstituteData } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const data = await getPublicInstituteData();
  const mapQuery = encodeURIComponent(data.profile.address);
  const mapSrc =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.017136012903!2d72.99560617520503!3d19.062984182138877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c1c3896c493f%3A0xd9b13c31e18e745e!2sSmartIQ%20Academy!5e0!3m2!1sen!2sin!4v1776943936994!5m2!1sen!2sin";

  return (
    <main className="section-shell pb-16 pt-8">
      <RevealOnScroll className="surface rounded-[2rem] p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <p className="section-label">Contact Us</p>
            <h1 className="section-title">Reach Smart Tutor</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
              Call, WhatsApp, email, or visit the campus.
            </p>

            <div className="surface-soft mt-6 rounded-[1.6rem] p-5 text-left">
              <p className="keyword-line">Campus address</p>
              <p className="mt-3 text-base font-semibold text-[var(--color-heading)]">
                {data.profile.address}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Walk in for counselling, admissions, and batch guidance.
              </p>
            </div>

            <div className="surface-soft mt-4 rounded-[1.6rem] p-5 text-left">
              <p className="keyword-line">Leadership desk</p>
              <p className="mt-3 text-base font-semibold text-[var(--color-heading)]">
                {data.profile.directorName}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-accent-strong)]">
                {data.profile.directorTitle}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                {data.profile.affiliatedInstitutes.join(" | ")}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              {data.contactActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                  className={
                    action.style === "primary"
                      ? "action-button px-5 py-3"
                      : "surface rounded-full px-5 py-3 text-sm font-semibold text-[var(--color-heading)]"
                  }
                >
                  {action.label}
                </a>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {data.contactMethods.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="surface-soft rounded-3xl p-5"
                >
                  <p className="keyword-line">{item.label}</p>
                  <p className="mt-3 text-lg font-semibold text-[var(--color-heading)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {item.description}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-[var(--color-accent-strong)]">
                    Campus: {data.profile.address}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <LiveClock label="Admissions Desk" />
            <div className="surface-soft rounded-[2rem] p-6">
              <p className="section-label">Social Media</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Updates, announcements, and counselling touchpoints from{" "}
                {data.profile.address}.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.socialLinks.map((item) => (
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

            <div className="surface-soft rounded-[2rem] p-6">
              <p className="section-label">Primary Institute Details</p>
              <div className="mt-5 grid gap-4">
                <div className="surface rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    {data.profile.address}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {data.profile.hours}
                  </p>
                </div>
                <div className="surface rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    {data.profile.email}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    Main admissions mailbox.
                  </p>
                </div>
                <div className="surface rounded-3xl p-5">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    {data.profile.directorName}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {data.profile.directorTitle} | {data.profile.affiliatedInstitutes.join(" | ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-soft rounded-[2rem] p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-label">Find us on map</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    Smart Tutor, {data.profile.address}
                  </p>
                </div>
                <a
                  href={`https://maps.google.com/?q=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[var(--color-accent)]"
                >
                  Open Google Maps
                </a>
              </div>
              <div className="media-frame map-frame mt-5 overflow-hidden rounded-[1.6rem]">
                <div className="map-frame-inner">
                  <iframe
                    title="Smart Tutor campus location"
                    src={mapSrc}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </main>
  );
}
