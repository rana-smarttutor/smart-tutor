"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Star, Search, Clock, BookOpen, GraduationCap, Trophy } from "lucide-react";

export function CoursesHero() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
          params.set("search", value.trim());
        } else {
          params.delete("search");
        }
        router.replace(`/courses?${params.toString()}`, { scroll: false });
      }, 300);
    },
    [router, searchParams],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-50 flex items-center justify-center pb-3 pt-0 sm:pb-4 sm:pt-1 px-3 sm:px-4 font-sans">
      <div className="relative w-full max-w-7xl rounded-2xl overflow-hidden bg-gradient-to-br from-[#f0f5ff] via-[#f0f6ff] to-[#e8f1ff] p-4 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm border border-white/50">
        <div className="relative z-10 w-full md:w-3/5 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200/60 bg-white/50 text-blue-700 text-xs font-semibold tracking-wide shadow-sm">
            <Star className="w-3 h-3 fill-blue-700 text-blue-700" />
            Explore. Learn. Succeed.
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            <span className="text-[#0052e0]">Courses</span> Offered
          </h1>

          <div className="space-y-1.5 max-w-2xl">
            <p className="text-sm font-bold text-slate-700 leading-snug">
              Smart IQ Institute pathways from primary school to professional and government exam preparation.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              A structured roadmap designed to build strength, discipline, and success at every major academic stage. Join as a <strong className="text-blue-700">student</strong> or partner with us as a <strong className="text-blue-700">faculty member</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 h-9 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 p-1 rounded-lg text-blue-700">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800 text-xs whitespace-nowrap">Live course catalog</span>
              </div>
            </button>

            <div className="w-full sm:flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search skills, exams, or boards..."
                defaultValue={searchParams.get("search") ?? ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-9 pr-3 h-9 border-0 rounded-xl text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-inset focus:ring-blue-400 text-xs bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="relative z-0 w-full md:w-2/5 h-[180px] md:h-[240px] mt-4 md:mt-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            <path d="M-30,20 Q20,50 120,10" fill="none" stroke="#cbd5e1" strokeWidth="0.4" className="opacity-40" />
            <path d="M-30,40 Q20,70 120,30" fill="none" stroke="#cbd5e1" strokeWidth="0.4" className="opacity-35" />
            <path d="M-30,60 Q20,90 120,50" fill="none" stroke="#cbd5e1" strokeWidth="0.3" className="opacity-25" />
            <path d="M-30,80 Q20,110 120,70" fill="none" stroke="#cbd5e1" strokeWidth="0.3" className="opacity-20" />
            <path d="M 10,55 Q 35,10 50,15 T 90,60" fill="none" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="2,2" className="opacity-60" />
          </svg>

          <motion.div
            className="absolute top-[45%] left-[5%]"
            animate={{ y: [-3, 3, -3], rotate: [-12, -8, -12] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-white p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 hover:rotate-0 hover:scale-105 transition-all duration-300">
              <BookOpen className="w-7 h-7 md:w-10 md:h-10 text-[#0052e0] fill-[#0052e0]/10" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-[2%] right-[22%]"
            animate={{ y: [-4, 4, -4], rotate: [10, 6, 10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="bg-[#0052e0] p-3 md:p-4 rounded-xl md:rounded-2xl shadow-[0_12px_30px_rgba(0,82,224,0.3)] border border-[#0042b3] hover:rotate-0 hover:scale-105 transition-all duration-300">
              <GraduationCap className="w-7 h-7 md:w-11 md:h-11 text-white fill-white/10" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-[60%] right-[3%]"
            animate={{ y: [-2, 5, -2], rotate: [-8, -4, -8] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="bg-gradient-to-br from-[#0066ff] to-[#0042b3] p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-[0_12px_30px_rgba(0,102,255,0.3)] border border-[#0052e0] relative hover:rotate-0 hover:scale-105 transition-all duration-300">
              <Trophy className="w-6 h-6 md:w-10 md:h-10 text-white fill-white/10" strokeWidth={1.5} />
              <Star className="w-2 h-2 md:w-3.5 md:h-3.5 text-white fill-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%]" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
