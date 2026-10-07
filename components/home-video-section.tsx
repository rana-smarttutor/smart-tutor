"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  PlayCircle,
} from "lucide-react";

export function HomeVideoSection() {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const videoWrapperRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /*
   * Autoplay when the video section
   * enters the viewport.
   *
   * The video must start muted because
   * browsers block unmuted autoplay.
   */
  useEffect(() => {
    const wrapper =
      videoWrapperRef.current;

    const video =
      videoRef.current;

    if (
      !wrapper ||
      !video
    ) {
      return;
    }

    video.muted = true;
    video.defaultMuted =
      true;

    /*
     * Force the browser to begin
     * loading the actual MP4.
     */
    video.load();

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (!entry) {
            return;
          }

          if (
            entry.isIntersecting
          ) {
            video.muted =
              true;

            video
              .play()
              .catch(
                (
                  error,
                ) => {
                  console.warn(
                    "Video autoplay failed:",
                    error,
                  );
                },
              );
          } else {
            video.pause();
          }
        },
        {
          /*
           * Start as soon as roughly
           * 15% of the video enters view.
           */
          threshold:
            0.15,

          rootMargin:
            "0px 0px -5% 0px",
        },
      );

    observer.observe(
      wrapper,
    );

    return () => {
      observer.disconnect();

      video.pause();
    };
  }, []);

  const highlights = [
    {
      label:
        "Expert Mentors",

      icon:
        GraduationCap,
    },

    {
      label:
        "Live Learning",

      icon:
        PlayCircle,
    },

    {
      label:
        "Mock Assessments",

      icon:
        BookOpenCheck,
    },

    {
      label:
        "Performance Tracking",

      icon:
        BarChart3,
    },
  ];

  return (
    <section className="section-shell py-10 sm:py-14 lg:py-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 shadow-[0_20px_60px_-25px_rgba(37,99,235,0.25)]">
        {/* Decorative background */}

        <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-10 lg:p-9 xl:gap-14 xl:p-12">
          {/* LEFT CONTENT */}

          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                Inside SmartIQ
                Institute
              </span>
            </div>

            <h2 className="max-w-xl text-3xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.8rem]">
              See How We
              <br />

              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Learn, Practice
                &amp; Achieve
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-sm font-medium leading-7 text-slate-600 sm:text-base sm:leading-8">
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
              every student
              achieve better
              results.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {highlights.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      key={
                        item.label
                      }
                      className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-blue-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                      <Icon
                        size={
                          15
                        }
                        strokeWidth={
                          2.5
                        }
                        className="text-blue-600"
                      />

                      {
                        item.label
                      }
                    </div>
                  );
                },
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-white/70 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <PlayCircle
                    size={
                      21
                    }
                    strokeWidth={
                      2.4
                    }
                  />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900">
                    Experience
                    SmartIQ before
                    you enroll
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    See our
                    learning
                    environment,
                    teaching
                    approach and
                    student-focused
                    academic system
                    in action.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VIDEO */}

          <div
            ref={
              videoWrapperRef
            }
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-cyan-400/10 blur-xl" />

            <div className="relative overflow-hidden rounded-[1.65rem] border border-slate-900/10 bg-[#06172d] p-2 shadow-[0_30px_70px_-25px_rgba(15,23,42,0.55)] sm:p-3">
              <div className="relative aspect-video overflow-hidden rounded-[1.25rem] bg-slate-950">
                <video
                  ref={
                    videoRef
                  }
                  controls
                  muted
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover"
                  onLoadedMetadata={() => {
                    console.log(
                      "SmartIQ video loaded.",
                    );
                  }}
                  onError={(
                    event,
                  ) => {
                    console.error(
                      "SmartIQ video failed to load:",
                      event.currentTarget
                        .error,
                    );
                  }}
                >
                  <source
                    src="/videos/smartiq-insti-vid.mp4"
                    type="video/mp4"
                  />

                  Your browser
                  does not support
                  the video tag.
                </video>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-full bg-blue-950/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}