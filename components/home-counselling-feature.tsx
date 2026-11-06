import { ConsultationEnquiryButton } from "@/components/consultation-enquiry-button";

import {
  ArrowUpRight,
  Compass,
  GraduationCap,
  HeartHandshake,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

type CounsellingService = {
  title: string;
  description: string;
  icon: typeof GraduationCap;
};

const services: CounsellingService[] = [
  {
    title: "Student Counselling",
    description:
      "Study plans, exam stress, time management and subject choices.",
    icon: GraduationCap,
  },
  {
    title: "Career Counselling",
    description:
      "Choose the right stream, course, entrance exam and career path.",
    icon: Compass,
  },
  {
    title: "Depression Counselling",
    description: "A safe, private space to talk about how you are feeling.",
    icon: HeartHandshake,
  },
];

type HomeCounsellingFeatureProps = {
  bookingHref?: string;
};

export default function HomeCounsellingFeature({
  bookingHref = "/career-counselling",
}: HomeCounsellingFeatureProps) {
  return (
    <section
      aria-labelledby="home-counselling-title"
      className="relative isolate w-full overflow-hidden bg-gradient-to-br from-[#07193E] via-[#153F91] to-[#2563EB] text-white"
    >
      {/* =====================================================
          SOFT BACKGROUND GLOW
      ===================================================== */}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-36 h-[550px] w-[550px] rounded-full bg-cyan-300/10 blur-[120px]" />

        <div className="absolute bottom-[-200px] left-[20%] h-[440px] w-[440px] rounded-full bg-blue-300/15 blur-[110px]" />
      </div>

      {/* =====================================================
          MAIN CONTAINER - REDUCED HEIGHT
      ===================================================== */}

      <div className="relative mx-auto w-full max-w-[1520px] px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-10">
        {/* =====================================================
            COUNSELLING BADGE
        ===================================================== */}

        <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 shadow-sm backdrop-blur-sm">
          <Sparkles
            className="h-4 w-4 shrink-0 text-cyan-200"
            strokeWidth={1.8}
          />

          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-100 sm:text-xs">
            SMARTIQ COUNSELLING
          </span>
        </div>

        {/* =====================================================
            HEADING
        ===================================================== */}

        <div className="mt-5 max-w-[1120px]">
          <h2
            id="home-counselling-title"
            className="text-[clamp(2.3rem,4vw,4rem)] font-black leading-[1.12] tracking-[-0.045em]"
          >
            <span className="block text-white">The Right Guidance,</span>

            <span className="mt-1 block text-[#40DDF5]">
              At the Right Time.
            </span>
          </h2>

          {/* DESCRIPTION */}

          <p className="mt-4 max-w-[880px] text-base font-normal leading-[1.55] text-blue-100 sm:text-lg lg:text-[20px]">
            Talk one-to-one with our counsellors about your studies, your career
            path or how you are feeling. Every session is private and focused on
            you.
          </p>
        </div>

        {/* =====================================================
            COUNSELLING SERVICE CARDS
        ===================================================== */}

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="flex min-h-[112px] items-start gap-4 rounded-[18px] border border-white/20 bg-white/[0.09] p-4 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.13] lg:p-5"
              >
                {/* SERVICE ICON */}

                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-white text-[#1646A2] shadow-sm">
                  <Icon size={25} strokeWidth={2} aria-hidden="true" />
                </div>

                {/* SERVICE CONTENT */}

                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-tight tracking-[-0.02em] text-white lg:text-[21px]">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm leading-[1.5] text-blue-100 sm:text-base">
                    {service.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* =====================================================
            BOTTOM BOOKING PANEL
        ===================================================== */}

        <div className="mt-7 flex flex-col gap-4 rounded-[18px] border border-white/15 bg-[#0A255A]/55 px-5 py-4 shadow-lg backdrop-blur-sm sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          {/* LEFT SIDE */}

          <div className="flex items-center gap-4">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
              <LockKeyhole size={22} strokeWidth={1.9} aria-hidden="true" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold leading-tight text-white sm:text-xl">
                Book your one-to-one session today
              </h3>

              <p className="mt-1 text-sm text-blue-100 sm:text-base">
                Private sessions with SmartIQ counsellors
              </p>
            </div>
          </div>

          {/* =====================================================
    BOOK NOW — OPEN EXISTING ENQUIRY FORM POPUP
===================================================== */}

          <ConsultationEnquiryButton
            label="Book Now ↗"
            requestType="consultation"
            source="homepage"
            className="group inline-flex min-h-[60px] w-full shrink-0 items-center justify-center gap-4 rounded-[16px] border-[3px] border-white/20 bg-white px-6 py-3 text-xl font-black text-[#17459B] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300 sm:text-2xl lg:w-[320px]"
          />
        </div>
      </div>
    </section>
  );
}
