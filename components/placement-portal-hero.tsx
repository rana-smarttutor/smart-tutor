"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  GraduationCap,
  Handshake,
  Upload,
  Users,
} from "@/components/ui-icons";

export function PlacementPortalHero() {
  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_40%),linear-gradient(to_bottom,_rgba(37,99,235,0.03),_transparent)]" />

      <div className="container mx-auto px-4">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_50px_rgba(15,23,42,0.05)] backdrop-blur md:p-6 lg:p-7">
          <div className="rounded-[1.8rem] border border-blue-100 bg-[#f8fbff] p-6 md:p-8">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                  <Users className="h-4 w-4" />
                  For Companies
                </span>

                <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                  Hire Talent from{" "}
                  <span className="text-blue-600">Smart Tutors</span>
                </h2>

                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                  Connect with skilled students, interns, fresh graduates, and
                  placement-ready candidates from Smart Tutors.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    Post a Vacancy
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Handshake className="h-4 w-4" />
                    Become a Hiring Partner
                  </Link>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    {
                      icon: <Upload className="h-5 w-5" />,
                      title: "Upload Jobs",
                      desc: "Post job openings in minutes",
                    },
                    {
                      icon: <ClipboardList className="h-5 w-5" />,
                      title: "Manage Applications",
                      desc: "Track applications easily",
                    },
                    {
                      icon: <Building2 className="h-5 w-5" />,
                      title: "Campus Hiring",
                      desc: "Connect with top students",
                    },
                    {
                      icon: <GraduationCap className="h-5 w-5" />,
                      title: "Internship Hiring",
                      desc: "Hire interns for projects",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-100 bg-white px-3 py-4 text-center shadow-sm"
                    >
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        {item.icon}
                      </div>

                      <p className="text-sm font-black text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Image
                  src="/placements/hero-company.png"
                  alt="Recruitment illustration"
                  width={420}
                  height={420}
                  className="h-auto w-full max-w-[360px] object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
