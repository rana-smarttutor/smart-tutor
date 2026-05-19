"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SessionUser } from "@/lib/types";

type SiteHeaderClientProps = {
  session: SessionUser | null;
};

function shortenSessionName(name: string) {
  return name.slice(0, 8);
}

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/mock-test", label: "Mock Test" },
  { href: "/digital-library", label: "Library" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeaderClient({
  session,
}: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateScrollProgress = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;

      setScrollProgress(nextProgress);
      frame = 0;
    };

    const queueScrollProgress = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener("scroll", queueScrollProgress, { passive: true });
    window.addEventListener("resize", queueScrollProgress);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", queueScrollProgress);
      window.removeEventListener("resize", queueScrollProgress);
    };
  }, [pathname]);

  function closeMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 w-full">
        <div className="header-progress-track" aria-hidden="true">
          <div
            className="header-progress-bar"
            style={{ transform: `scaleX(${Math.max(scrollProgress, 0.03)})` }}
          />
        </div>

        <div className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="section-shell">
            <div className="surface shell-bar rounded-[1.75rem] px-3 pt-3 sm:px-5 sm:pt-3 lg:rounded-full lg:px-5 lg:pt-3">
              <div className="flex min-h-[3.5rem] items-center justify-between gap-3">
                <Link
                  href="/"
                  className="brand-mark relative flex items-center"
                  onClick={closeMenu}
                >
                  <Image
                    src="/image1.png"
                    alt="Smart Tutors Logo"
                    width={150}
                    height={40}
                    className="h-7 w-auto object-contain sm:h-8 lg:h-9"
                    priority
                  />
                </Link>

                <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex">
                  <nav className="flex min-w-0 flex-wrap items-center justify-center gap-2">
                    {links.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`nav-link rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                            isActive
                              ? "text-[var(--color-heading)] bg-[var(--color-primary-soft)] shadow-[inset_0_0_0_1px_var(--color-primary)]"
                              : "text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                  {session ? (
                    <div className="surface-soft min-w-[110px] rounded-full px-4 py-2 text-center">
                      <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-muted)]">
                        Signed In
                      </p>
                      <p
                        className="truncate text-sm font-semibold text-[var(--color-heading)]"
                        title={session.name}
                      >
                        {shortenSessionName(session.name)}
                      </p>
                    </div>
                  ) : null}
                  <ThemeToggle />
                  {session ? (
                    <>
                      <Link href="/dashboard" className="btn-action btn-sm">
                        Dashboard
                      </Link>
                      <LogoutButton />
                    </>
                  ) : (
                    <Link href="/login" className="btn-action btn-sm">
                      Login
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                  {!session ? (
                    <Link
                      href="/login"
                      className="btn-action btn-sm"
                    >
                      Login
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((current) => !current)}
                    className="mobile-menu-button inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)]"
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span className="sr-only">
                      {isMobileMenuOpen ? "Close menu" : "Open menu"}
                    </span>
                    <span className="flex flex-col items-center justify-center gap-1.5">
                      <span
                        className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${
                          isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
                        }`}
                      />
                      <span
                        className={`block h-0.5 w-5 rounded-full bg-current transition-opacity duration-300 ${
                          isMobileMenuOpen ? "opacity-0" : "opacity-100"
                        }`}
                      />
                      <span
                        className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${
                          isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              <div
                className={`mobile-menu-panel lg:hidden ${
                  isMobileMenuOpen
                    ? "mobile-menu-panel-open"
                    : "mobile-menu-panel-closed"
                }`}
              >
                <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4">
                  <nav className="grid gap-2">
                    {links.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeMenu}
                          className={`nav-link rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition-all ${
                            isActive
                              ? "text-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[inset_0_0_0_1px_var(--color-primary)]"
                              : "text-[var(--color-heading)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="surface-soft rounded-[1.4rem] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-heading)]">
                        Theme
                      </p>
                      <ThemeToggle />
                    </div>
                  </div>

                  {session ? (
                    <>
                      <div className="surface-soft rounded-[1.4rem] px-4 py-3 text-center">
                        <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-muted)]">
                          Signed In
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-[var(--color-heading)]"
                          title={session.name}
                        >
                          {shortenSessionName(session.name)}
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Link
                          href="/dashboard"
                          onClick={closeMenu}
                          className="action-button justify-center px-5 py-3"
                        >
                          Dashboard
                        </Link>
                        <LogoutButton />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div aria-hidden="true" className="h-[5.25rem] sm:h-[5.75rem] lg:h-[6.25rem]" />
    </>
  );
}
