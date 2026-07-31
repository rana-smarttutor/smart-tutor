"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { UserMenu } from "@/components/user-menu";
import { useTheme } from "@/components/theme-provider";
import type { SessionUser } from "@/lib/types";

type SiteHeaderClientProps = {
  session: SessionUser | null;
};

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/mock-test", label: "Mock Test" },
  { href: "/digital-library", label: "Library" },
  { href: "/placements", label: "Placements" },
];

const staffOnlyLinks = [{ href: "/student-performance", label: "Performance" }];

export function SiteHeaderClient({ session }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    let frame = 0;

    const updateScrollProgress = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      const nextProgress =
        maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;

      setScrollProgress((currentProgress) =>
        Math.abs(currentProgress - nextProgress) < 0.001
          ? currentProgress
          : nextProgress,
      );

      frame = 0;
    };

    const queueScrollProgress = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();

    window.addEventListener("scroll", queueScrollProgress, {
      passive: true,
    });

    window.addEventListener("resize", queueScrollProgress);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", queueScrollProgress);
      window.removeEventListener("resize", queueScrollProgress);
    };
  }, []);
  useEffect(() => {
    if (!session) {
      setProfilePhoto(null);
      return;
    }

    const controller = new AbortController();

    async function loadProfilePhoto() {
      try {
        const response = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          dashboard?: {
            profile?: {
              profilePhoto?: string | null;
            };
          };
        };

        setProfilePhoto(data.dashboard?.profile?.profilePhoto ?? null);
      } catch {
        // Keep the initials fallback when the photo cannot be loaded.
      }
    }

    void loadProfilePhoto();

    return () => {
      controller.abort();
    };
  }, [session?.id]);

  function closeMenu() {
    setIsMobileMenuOpen(false);
  }

  const isDark = mounted && theme === "dark";

  const userRole = String((session as any)?.role || "").toLowerCase();

  const canSeeStudentPerformance =
    userRole === "admin" || userRole === "educator";

  const filteredLinks = links.filter((link) => {
    if (session && link.label === "Mock Test") return false;
    return true;
  });

  const visibleLinks = canSeeStudentPerformance
    ? [...filteredLinks, ...staffOnlyLinks]
    : filteredLinks;

  const isLinkActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const ctaButtonClasses =
    "group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-6 py-2.5 font-medium text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]";

  const ctaShine = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -left-[40%] top-0 h-full w-[30%] -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 ease-out group-hover:left-[110%]"
    />
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] w-full overflow-visible">
        <div className="header-progress-track" aria-hidden="true">
          <div
            className="header-progress-bar"
            style={{ transform: `scaleX(${Math.max(scrollProgress, 0.03)})` }}
          />
        </div>

        <div className="relative w-full overflow-hidden border-b border-slate-200/60 bg-gradient-to-r from-[#f8f9fc]/80 via-[#eef2ff]/70 to-[#e0e7ff]/65 backdrop-blur-md">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
          >
            <svg
              className="absolute h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="0"
                y1="100"
                x2="200"
                y2="0"
                stroke="#003399"
                strokeWidth="0.5"
              />
              <line
                x1="100"
                y1="300"
                x2="300"
                y2="100"
                stroke="#003399"
                strokeWidth="0.5"
              />
              <circle
                cx="95%"
                cy="50%"
                r="150"
                stroke="#e0e5f5"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>

          <nav className="section-shell relative z-10">
            <div className="flex h-20 items-center justify-between gap-3 ">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex flex-shrink-0 items-center"
              >
                <Image
                  src={isDark ? "/image2.png" : "/image1.png"}
                  alt="Smart Tutors Logo"
                  width={300}
                  height={80}
                  className="h-10 w-auto object-contain sm:h-11 lg:h-16"
                  priority
                />
              </Link>

              <div className="hidden h-full flex-1 items-start justify-end gap-4 lg:flex">
                <div className="flex h-[4.5rem] items-center rounded-b-[2.5rem] border-b border-[#2a4365]/40 bg-gradient-to-r from-[#0a1b38] to-[#1a365d] px-8 shadow-xl">
                  <nav className="mr-6 flex h-full items-stretch space-x-7">
                    {visibleLinks.map((link) => {
                      const isActive = isLinkActive(link.href);

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeMenu}
                          className={`group relative flex h-full items-center px-1 text-[15px] font-medium transition-colors duration-300 ${
                            isActive
                              ? "text-[#3b82f6]"
                              : "text-gray-300 hover:text-white"
                          }`}
                        >
                          {link.label}

                          <span
                            className={`absolute left-0 top-0 h-[4px] w-full origin-center rounded-b-md bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] transition-transform duration-300 ease-out ${
                              isActive
                                ? "scale-x-100"
                                : "scale-x-0 group-hover:scale-x-100"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </nav>

                  {session ? (
                    <Link href="/dashboard" className={ctaButtonClasses}>
                      {ctaShine}
                      <span className="relative z-10 flex items-center gap-2">
                        Dashboard
                        <ChevronRight className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </Link>
                  ) : (
                    <Link href="/login" className={ctaButtonClasses}>
                      {ctaShine}
                      <span className="relative z-10 flex items-center gap-2">
                        Login
                        <ChevronRight className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </Link>
                  )}
                </div>

                {session ? (
                  <div className="mt-4">
                    <UserMenu
                      session={session}
                      profilePhoto={profilePhoto}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                {!session ? (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/30"
                  >
                    Login
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0a1f44] shadow-sm transition-colors hover:bg-gray-100"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </nav>
        </div>

        <div
          className={`absolute left-0 top-full w-full border-b border-gray-100 bg-white shadow-xl lg:hidden ${
            isMobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <div className="section-shell space-y-1 px-4 pb-6 pt-2 sm:px-3">
            {visibleLinks.map((link) => {
              const isActive = isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`block rounded-md px-3 py-4 text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? "border-l-4 border-[#3b82f6] bg-blue-50 text-[#0a1f44]"
                      : "border-l-4 border-transparent text-gray-700 hover:bg-gray-50 hover:text-[#0a1f44]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-4">
              {session ? (
                <div className="grid gap-2">
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-6 py-3 font-semibold text-white shadow-md"
                  >
                    Dashboard
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-6 py-3 font-semibold text-white shadow-md"
                >
                  Login
                  <ChevronRight className="h-5 w-5" />
                </Link>
              )}

              {session ? (
                <div className="mt-3 flex justify-center">
                  <UserMenu
                    session={session}
                    profilePhoto={profilePhoto}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div
        aria-hidden="true"
        className="h-[5.25rem] sm:h-[5.75rem] lg:h-[6.25rem]"
      />
    </>
  );
}
