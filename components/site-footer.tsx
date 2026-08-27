import Link from "next/link";
import Image from "next/image";
import { getPublicInstituteData } from "@/lib/data-store";

export async function SiteFooter() {
  const data = await getPublicInstituteData();

  const branches =
    data.profile.branches?.length
      ? data.profile.branches
      : [
          {
            name: "Smart IQ Institute Campus",
            address: data.profile.address,
            mapQuery: data.profile.address,
          },
        ];

  return (
    <footer className="section-shell pb-8 pt-6">
      <div className="surface graph-paper rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_0.9fr_1.1fr]">
          <div>
            <Link
              href="/"
              className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]"
            >
              Smart IQ Institute
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--color-muted)]">
              Admissions, learning, and institute operations in one workspace.
            </p>

            <div className="space-y-3">
               <Image
                src="/ravi-rana.png"
                alt="Prof. Ravi Rana"
                width={96}
                height={96}
                className="h-24 w-24 rounded-2xl border border-white/10 object-cover object-top shadow-lg"
              />
              <p className="font-bold text-[var(--color-heading)]">
                {data.profile.directorName} | {data.profile.directorTitle}
              </p>
            </div>

            <div className="space-y-2">
              {branches.map((branch) => (
                <p
                  key={branch.name}
                  className="font-semibold text-[var(--color-heading)]"
                >
                  {branch.name}: {branch.address}
                </p>
              ))}
            </div>

            <p>{data.profile.phone}</p>
            <p>{data.profile.email}</p>
            <p>{data.profile.hours}</p>
            <p>{data.profile.affiliatedInstitutes.join(" | ")}</p>
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

            <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-background-strong)] px-6 py-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <p className="text-sm font-semibold text-[var(--color-heading)]">
                Smart IQ Institute Campus
              </p>

              <p className="mt-2 max-w-xs text-xs font-medium leading-6 text-[var(--color-muted)]">
                Open our campus locations directly in Google Maps for
                directions.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {branches.map((branch) => (
                  <a
                    key={branch.name}
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      branch.mapQuery || branch.address,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-md hover:bg-blue-700"
                  >
                    {branch.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-8">
          <div className="flex flex-col gap-4 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap gap-4">
              <Link href="/privacy" className="hover:text-[var(--color-primary)] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[var(--color-primary)] transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/eula" className="hover:text-[var(--color-primary)] transition-colors">
                EULA
              </Link>
            </nav>

            <p className="max-w-2xl leading-relaxed sm:text-right">
              © {new Date().getFullYear()} Smart IQ Institute Academy. In operations
              since 2018. All rights reserved. Results may differ between users.
              Promotional claims may be stylized.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}