"use client";

import {
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Play,
  Share2,
} from "lucide-react";

import {
  ConsultationEnquiryButton,
} from "@/components/consultation-enquiry-button";

export function HomeJourneySection() {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const [
    hasStarted,
    setHasStarted,
  ] =
    useState(false);

  async function handleVideoPlay() {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.muted =
      false;

    video.volume =
      1;

    try {
      await video.play();

      setHasStarted(
        true,
      );
    } catch {
      // Browser may block playback in unusual cases.
    }
  }

  async function handleShare() {
    const shareData = {
      title:
        "SmartIQ Institute",

      text:
        "See how SmartIQ Institute helps students learn, practice and achieve.",

      url:
        window.location.href,
    };

    try {
      if (
        navigator.share
      ) {
        await navigator.share(
          shareData,
        );

        return;
      }

      if (
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          window.location.href,
        );

        window.alert(
          "Page link copied!",
        );

        return;
      }

      window.alert(
        window.location.href,
      );
    } catch {
      // User cancelled native share.
    }
  }

  return (
    <section className="section-shell py-7 sm:py-9 lg:py-10">
      <div className="relative overflow-hidden rounded-[2.4rem] border border-blue-100 bg-gradient-to-br from-white via-[#fafdff] to-blue-50/60 shadow-[0_28px_90px_-48px_rgba(37,99,235,0.35)]">
        {/* BACKGROUND DECORATION */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full bg-blue-200/30 blur-[80px]" />

        <div className="pointer-events-none absolute -bottom-40 left-[35%] h-[280px] w-[280px] rounded-full bg-indigo-100/40 blur-[90px]" />

        <div className="relative grid gap-8 px-6 py-6 sm:px-8 sm:py-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12 lg:px-12 lg:py-8 xl:grid-cols-[0.88fr_1.12fr] xl:px-14">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div>
            {/* ADMISSIONS */}

            <div className="mt-2">
              <div className="inline-flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[1.4rem] border border-slate-200 bg-white/95 px-5 py-4 shadow-[0_14px_35px_-20px_rgba(15,23,42,0.35)] sm:px-6">
                {/* ADMISSIONS OPEN */}

                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2
                      size={18}
                      strokeWidth={2.8}
                    />
                  </span>

                  <strong className="text-[15px] font-black uppercase tracking-[0.12em] text-black">
                    Admissions Open
                  </strong>
                </div>

                {/* DIVIDER */}

                <span className="hidden h-11 w-px bg-slate-200 sm:block" />

                {/* ACADEMIC SESSION */}

                <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Academic Session
                  </span>

                  <strong className="mt-0.5 block text-lg font-black text-blue-700">
                    2027–28
                  </strong>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}

            <p className="mt-5 max-w-[620px] text-sm font-medium leading-7 text-slate-600 sm:text-[15px] sm:leading-7">
              Discover how
              SmartIQ Institute
              combines expert
              mentoring,
              structured
              learning, regular
              practice, mock
              assessments and
              performance
              tracking to help
              students build
              stronger academic
              outcomes.
            </p>

            {/* CTA ROW */}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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

          <div className="relative flex h-full items-center pt-1 lg:-translate-y-2 lg:pt-0">
            {/* DECORATIVE CIRCLES */}

            <div className="pointer-events-none absolute -right-8 -top-3 h-28 w-28 rounded-full bg-blue-500/10" />

            <div className="pointer-events-none absolute right-8 top-8 h-32 w-32 rounded-full bg-indigo-300/10" />

            {/* VIDEO FRAME */}

            <div className="relative z-10 w-full">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-cyan-400/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.8rem] border-[6px] border-[#071a31] bg-[#071a31] shadow-[0_32px_65px_-24px_rgba(15,23,42,0.55)]">
                <div className="relative aspect-video w-full overflow-hidden rounded-[1.35rem] bg-slate-950">
                  {/* SHARE */}

                  <button
                    type="button"
                    onClick={() =>
                      void handleShare()
                    }
                    aria-label="Share SmartIQ Institute video"
                    className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-[11px] font-black text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-950/90"
                  >
                    <Share2
                      size={15}
                      strokeWidth={2.4}
                    />

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
                    onPlay={(
                      event,
                    ) => {
                      event.currentTarget.muted =
                        false;

                      event.currentTarget.volume =
                        1;

                      setHasStarted(
                        true,
                      );
                    }}
                    onPause={() => {
                      const video =
                        videoRef.current;

                      if (
                        video &&
                        video.currentTime ===
                          0
                      ) {
                        setHasStarted(
                          false,
                        );
                      }
                    }}
                    onEnded={() => {
                      setHasStarted(
                        false,
                      );
                    }}
                    onContextMenu={(
                      event,
                    ) => {
                      event.preventDefault();
                    }}
                    className="h-full w-full object-cover"
                  >
                    <source
                      src="/videos/smartiq-insti-vid.mp4"
                      type="video/mp4"
                    />

                    Your browser does
                    not support the
                    video tag.
                  </video>

                  {/* CENTER PLAY BUTTON */}

                  {!hasStarted ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleVideoPlay()
                      }
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