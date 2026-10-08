"use client";

import { useRef, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Play,
  PlayCircle,
  Share2,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { ConsultationEnquiryButton } from "@/components/consultation-enquiry-button";

export function HomeJourneySection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [hasStarted, setHasStarted] = useState(false);

  const highlights = [
    {
      label: "Expert Mentors",
      description: "Learn from expert teachers",
      icon: GraduationCap,
      wrapper: "border-blue-200 bg-blue-50/70",
      iconStyle: "bg-blue-100 text-blue-700",
    },
    {
      label: "Live Learning",
      description: "Interactive live classes",
      icon: PlayCircle,
      wrapper: "border-violet-200 bg-violet-50/70",
      iconStyle: "bg-violet-100 text-violet-700",
    },
    {
      label: "Mock Assessments",
      description: "Practice like real exams",
      icon: BookOpenCheck,
      wrapper: "border-orange-200 bg-orange-50/70",
      iconStyle: "bg-orange-100 text-orange-600",
    },
    {
      label: "Performance Tracking",
      description: "Track progress & improve",
      icon: BarChart3,
      wrapper: "border-emerald-200 bg-emerald-50/70",
      iconStyle: "bg-emerald-100 text-emerald-600",
    },
  ];

  async function handleVideoPlay() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
      setHasStarted(true);
    } catch {
      // Browser can block playback in unusual cases.
    }
  }

  async function handleShare() {
    const shareData = {
      title: "SmartIQ Institute",
      text: "See how SmartIQ Institute helps students learn, practice and achieve.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);

        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);

        window.alert("Page link copied!");

        return;
      }

      window.alert(window.location.href);
    } catch {
      // User cancelled native share.
    }
  }

  return (
    <section className="section-shell py-10 sm:py-14 lg:py-16">
      <div className="relative overflow-hidden rounded-[2.4rem] border border-blue-100 bg-gradient-to-br from-white via-[#fafdff] to-blue-50/60 shadow-[0_28px_90px_-48px_rgba(37,99,235,0.35)]">
        {/* BACKGROUND DECORATION */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[340px] w-[340px] rounded-full bg-blue-200/30 blur-[80px]" />

        <div className="pointer-events-none absolute -bottom-40 left-[35%] h-[320px] w-[320px] rounded-full bg-indigo-100/40 blur-[90px]" />

        <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14 lg:px-12 lg:py-12 xl:grid-cols-[0.88fr_1.12fr] xl:px-14">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div>
            {/* ADMISSIONS */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                  <CheckCircle2 size={16} strokeWidth={2.8} />
                </span>

                <span className="text-[15px] font-black uppercase tracking-[0.12em] text-slate-900">
                  Admissions Open
                </span>
              </div>

              <span className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="rounded-full border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-sm">
                2026–27
              </div>
            </div>

            {/* DESCRIPTION */}
            <p className="mt-6 max-w-[620px] text-sm font-medium leading-7 text-slate-600 sm:text-[15px] sm:leading-8">
              Discover how SmartIQ Institute combines expert mentoring,
              structured learning, regular practice, mock assessments and
              performance tracking to help students build stronger academic
              outcomes.
            </p>

            {/* FEATURE CARDS */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${item.wrapper}`}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.iconStyle}`}
                    >
                      <Icon size={19} strokeWidth={2.5} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black leading-tight text-slate-950">
                        {item.label}
                      </p>

                      <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA ROW */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ConsultationEnquiryButton
                label="Enroll Now"
                requestType="consultation"
                source="homepage-journey-section"
                className="inline-flex min-h-14 items-center justify-center rounded-xl bg-blue-600 px-7 text-sm font-black text-white shadow-[0_12px_25px_-8px_rgba(37,99,235,0.65)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_30px_-8px_rgba(37,99,235,0.65)]"
              />

              <Link
                href="/courses"
                className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-7 text-sm font-black text-blue-700 transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
              >
                Explore Programs
                <ArrowRight
                  size={17}
                  strokeWidth={2.6}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="relative flex h-full items-center pt-9 lg:pt-12">
            {/* DECORATIVE CIRCLES */}
            <div className="pointer-events-none absolute -right-8 top-2 h-32 w-32 rounded-full bg-blue-500/10" />

            <div className="pointer-events-none absolute right-8 top-14 h-36 w-36 rounded-full bg-indigo-300/10" />

            {/* VIDEO FRAME */}
            <div className="relative z-10">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-cyan-400/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.8rem] border-[6px] border-[#071a31] bg-[#071a31] shadow-[0_32px_65px_-24px_rgba(15,23,42,0.55)]">
                <div className="relative aspect-video w-full overflow-hidden rounded-[1.35rem] bg-slate-950">
                  {/* SHARE */}
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    aria-label="Share SmartIQ Institute video"
                    className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-[11px] font-black text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-950/90"
                  >
                    <Share2 size={15} strokeWidth={2.4} />
                    Share
                  </button>

                  {/* VIDEO */}
                  <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    playsInline
                    preload="metadata"
                    onPlay={(event) => {
                      event.currentTarget.muted = false;

                      event.currentTarget.volume = 1;

                      setHasStarted(true);
                    }}
                    onPause={() => {
                      const video = videoRef.current;

                      if (video && video.currentTime === 0) {
                        setHasStarted(false);
                      }
                    }}
                    onEnded={() => {
                      setHasStarted(false);
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                    }}
                    className="h-full w-full object-cover"
                  >
                    <source
                      src="/videos/smartiq-insti-vid.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>

                  {/* CENTER PLAY BUTTON */}
                  {!hasStarted ? (
                    <button
                      type="button"
                      onClick={() => void handleVideoPlay()}
                      aria-label="Play SmartIQ Institute video"
                      className="absolute left-1/2 top-1/2 z-20 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/95 text-blue-600 shadow-[0_16px_45px_rgba(0,0,0,0.25)] transition-all hover:scale-105 hover:bg-white sm:h-24 sm:w-24"
                    >
                      <Play
                        size={38}
                        fill="currentColor"
                        strokeWidth={1.5}
                        className="ml-1"
                      />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
