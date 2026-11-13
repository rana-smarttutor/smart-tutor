"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";

type Props = {
  courseName: string;
  category: string;
};

export default function CourseHeroMotion({ courseName, category }: Props) {
  const reduceMotion = useReducedMotion();

  const float = (delay = 0, distance = 12) =>
    reduceMotion
      ? {}
      : {
          animate: {
            y: [0, -distance, 0],
          },
          transition: {
            duration: 4.5,
            delay,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };

  return (
    <div className="relative isolate mx-auto flex h-[250px] w-full max-w-[440px] items-center justify-center overflow-hidden bg-transparent sm:h-[300px] lg:h-[320px]">
      {/* Soft light that blends into the hero */}
      <motion.div
        className="pointer-events-none absolute h-[225px] w-[225px] rounded-full border border-dashed border-white/10 sm:h-[290px] sm:w-[290px]"
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.3, 0.65, 0.3],
                scale: [1, 1.15, 1],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle orbit */}
      <motion.div
        className="pointer-events-none absolute h-[225px] w-[225px] rounded-full border border-dashed border-white/10 sm:h-[290px] sm:w-[290px]"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{
          duration: 65,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="pointer-events-none absolute h-[230px] w-[230px] rounded-full border border-white/[0.07] sm:h-[290px] sm:w-[290px]" />

      {/* Central artwork — no rectangular card */}
      <motion.div
        key={courseName}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex max-w-[280px] flex-col items-center justify-center px-4 text-center"
      >
        <motion.div
          {...float(0, 8)}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] shadow-[0_0_75px_rgba(96,165,250,0.18)] backdrop-blur-sm"
        >
          <GraduationCap className="h-9 w-9 text-blue-100" strokeWidth={1.6} />
        </motion.div>

        <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
          {category}
        </p>

        <h2 className="mt-3 break-words text-2xl font-bold leading-tight text-white sm:text-[28px]">
          {courseName}
        </h2>

        <div className="mt-4 h-px w-20 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

        <p className="mt-4 text-sm font-medium text-blue-100/80">
          Learn • Practise • Excel
        </p>
      </motion.div>

      {/* Floating icons */}
      <motion.div
        {...float(0.3, 13)}
        className="absolute left-[7%] top-[13%] rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
      >
        <BookOpen className="h-7 w-7 text-cyan-200" />
      </motion.div>

      <motion.div
        {...float(0.9, 16)}
        className="absolute right-[7%] top-[15%] rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
      >
        <BrainCircuit className="h-8 w-8 text-blue-100" />
      </motion.div>

      <motion.div
        {...float(1.4, 11)}
        className="absolute bottom-[13%] left-[12%] rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
      >
        <Target className="h-7 w-7 text-cyan-200" />
      </motion.div>

      <motion.div
        {...float(0.6, 15)}
        className="absolute bottom-[12%] right-[10%] rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
      >
        <Sparkles className="h-7 w-7 text-yellow-200" />
      </motion.div>
    </div>
  );
}
