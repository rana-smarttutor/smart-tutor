"use client";

import { useState } from "react";
import Image from "next/image";
import { GraduationCap, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

type Student = { name: string; result: string; image: string };
type ResultCategory = {
  id: string;
  label: string;
  folder: string;
  roster: string;
  students: Student[];
};

// One student per line: Name | Result. Filenames are generated from names
// exactly as supplied in SmartIQ_Student_Photos_Coursewise_131.zip.
const COURSE_DATA = [
  {
    id: "10-ssc",
    label: "10TH SSC",
    folder: "01_10th_SSC_Maharashtra_Board",
    roster: `Faiz Ansari | 95.00%
Bareera Shaikh | 91.00%
Vishakha Tiwari | 90.00%
Snehal Sonulekar | 91.4%
Jini James | 91.2%
Anam Siddique | 90.2%
Komal Ghadi | 91.2%
Farhan Khan | 90%
Sourabh Jain | 93%
Divya Roge | 92.4%
Heba Khan | 91.8%
Mahi Pillai | 92.4%
Suneeth Moolchandani | 92.6%`,
  },
  {
    id: "10-cbse",
    label: "10TH CBSE",
    folder: "02_10th_CBSE",
    roster: `Divya Pawar | 92.80%
Abison Saji | 90.20%
Vaibhavi Nikam | 87.60%
Ashwini Patil | 86.40%
Rohit Jadhav | 84.75%
Siddhant Bhoir | 82.60%
Sakshi Chavan | 80.25%
Faraza Khan | 78.40%`,
  },
  {
    id: "12-hsc-science",
    label: "12TH HSC SCIENCE",
    folder: "03_12th_Science_HSC",
    roster: `Pushpa More | 93.4%
Sahil Niwane | 94.3%
Shreenath | 92.8%
Arya Pillai | 91%
Rishabh Prajapati | 91%
Sarvesh Joshi | 95%
Divesh | 90%
T V Harshada | 98%
Shivani Chaudhari | Physics 80 · Chemistry 75 · Maths 95
Shruti Kamble | Physics 84 · Chemistry 88 · Maths 90
Akshay Patil | Physics 97 · Chemistry 95 · Maths 99
Omkar Patel | 71.96%`,
  },
  {
    id: "12-cbse-science",
    label: "12TH CBSE SCIENCE",
    folder: "04_12th_Science_CBSE",
    roster: `Simran Kaur | 93.20%
Rohit Sharma | 92.60%
Karan Thakur | 92.20%
Diya Patel | 91.80%
Priya Nair | 91.40%
Yash Agarwal | 87.40%`,
  },
  {
    id: "11-commerce",
    label: "11TH COMMERCE",
    folder: "05_11th_Commerce",
    roster: `Vaibhavi | Accountancy 94
Chinmayee | Accountancy 100 · Maths 92
Prathamesh | Accountancy 93`,
  },
  {
    id: "12-commerce",
    label: "12TH COMMERCE",
    folder: "06_12th_Commerce",
    roster: `Mukesh | Accountancy 90 · Maths 71
Khushi | Accountancy 90 · Maths 70
Vedanti | Accountancy 83 · Economics 90
Varun | Accountancy 90
Vedant | Accountancy 84
Akruti | Accountancy 84 · English 81
Shivaji | Accountancy 90
Shrushti | Accountancy 85
Aditya Thakur | 92.78%
Prajakta Jadhav | 97.36%
Arpit Gupta | 79.43%
Harshita More | 84.57%`,
  },
  {
    id: "jee",
    label: "JEE Main",
    folder: "07_JEE_Main",
    roster: `Shreya Gaikwad | AIR 1068
Mohammad Arbaz | AIR 2689
Kratagya Jain | AIR 1126
Vaishnavi Patil | AIR 3078
Mahek Shaikh | AIR 3286
Shravan Goyal | AIR 3479`,
  },
  {
    id: "neet",
    label: "NEET",
    folder: "08_NEET",
    roster: `Arjun Narayan | AIR 943
Isha Verma | AIR 1605
Devansh Patil | AIR 1967
Pranav Kulkarni | AIR 2075
Ananya Rao | AIR 2643
Sidharth Joshi | AIR 2912`,
  },
  {
    id: "cet",
    label: "CET",
    folder: "09_CET",
    roster: `Vivek Sharma | 99.12 percentile
Mahi Chatterjee | 95.62 percentile · MAH-BHMCT/BCA/BBA/BMS/BBM CET 2026
Devansh Patel | 95.48 percentile
Ananya Shetty | 91.76 percentile
Rohan Nair | 88.34 percentile`,
  },
  {
    id: "mba",
    label: "MBA",
    folder: "10_MBA_Entrance",
    roster: `Harshal Vashodia | 99.64 percentile · CAT / XAT / SNAP / IIFT
Nikita Shinde | 97.49 percentile · CAT
Ritika Gupta | 97.12 percentile · MAH MBA CET 2025
Omkar Paturkar | 95.91 percentile · MAH MBA CET 2025
Sakshi Kamble | 94.96 percentile · MAH MBA CET 2025
Apurva More | 98.32 percentile · CAT 2025
Karan Malhotra | 94.20 percentile
Rohan Verma | 95.60 percentile`,
  },
  {
    id: "imu",
    label: "IMU CET",
    folder: "11_IMU_CET_Merchant_Navy",
    roster: `Alok Singh | Rank 394 · Merchant Navy
Aditya Agarwal | Rank 499 · Merchant Navy
Aditi Sharma | Rank 771 · Merchant Navy`,
  },
  {
    id: "banking",
    label: "Banking Exam",
    folder: "12_Banking",
    roster: `Ritamvara | SBI PO
Priyanka | SBI PO
Raj Singh | RBI Grade B
Darshit | SBI PO
Riya Kamble | RBI Grade B
Prachi Mhetre | SBI Clerk 2025
Srishti Jhadav | IBPS Clerk 2025
Janvi Gupta | RRB Clerk 2025
Abhishek | IBPS Clerk 2025`,
  },
  {
    id: "law",
    label: "Law Entrance",
    folder: "13_Law_Entrance",
    roster: `Soumen Saha | NLSIU, Bengaluru
Siya Dodwade | GLC, Mumbai
Adarsh Singh | RMLNLU, Lucknow
Abhishek Yadav | ILS, Pune
Niyati Sharma | CLAT
Shivom | AILET
Ritul Sharma | LSAT India
Yash | SLAT
Manish | MH CET Law
Pankaj Tomar | CUET PG LLB
Kishan Kumar | AP LAWCET
Amogh Singh | CLAT 2026 · AIR 205 · Marks 99.50`,
  },
  {
    id: "railway",
    label: "Railway Exam",
    folder: "14_Railway",
    roster: `Animesh | ALP
Anjali Garg | RPF Constable
Himanshi | Technician
Veena Manunath | NTPC
Pramod | Group D
Preeti | Clerk
Sayed Sharzil Ali | ALP
Achuthanand K S | Traffic Assistant
Adrishya Ramesh | Junior Engineer
Afna B Nizar | Paramedical Staff
Akshaya C K | Accounts Assistant
Al Irfan | Goods Guard
Arun Krishna S S | Track Maintainer`,
  },
  {
    id: "ssc-cgl",
    label: "SSC CGL",
    folder: "15_SSC_CGL",
    roster: `Omkar Jadhav | Income Tax Inspector
Snehal Deshmukh | Assistant Section Officer
Pooja Gaikwad | Sub Inspector (CBI)
Rutuja Kulkarni | Auditor
Akshay Shinde | Assistant Audit Officer
Vivek Mishra | Accountant
Sandeep Kumar | Income Tax Officer · SSC CGL 2025
Tejas Bhosale | Sub Inspector (NIA)
Ankit Verma | Enforcement Officer
Vaishnavi Joshi | Assistant Section Officer
Neha Gupta | Junior Statistical Officer
Shubham Chavan | Central Excise Inspector`,
  },
  {
    id: "police",
    label: "Police Bharti",
    folder: "16_Police_Bharti",
    roster: `Aditya Pawar | Maharashtra Police Constable · Police Bharti 2025`,
  },
  {
    id: "defence",
    label: "Defence (NDA / SSB)",
    folder: "17_Defence_NDA_SSB",
    roster: `Rupesh Katkar | Indian Navy
Preeti Singh | Recommended – 19 SSB Allahabad · Indian Army`,
  },
] as const;

function studentImagePath(folder: string, name: string) {
  const fileName = `${name.trim().replace(/\s+/g, "_")}.jpg`;
  return `/results/students/${folder}/${fileName}`;
}

const RESULT_CATEGORIES: ResultCategory[] = COURSE_DATA.map((course) => ({
  ...course,
  students: course.roster
    .trim()
    .split("\n")
    .map((line) => {
      const [name, ...resultParts] = line.split("|");
      const cleanName = name.trim();
      return {
        name: cleanName,
        result: resultParts.join("|").trim(),
        image: studentImagePath(course.folder, cleanName),
      };
    }),
}));

export function GrandSuccessCarousel() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    RESULT_CATEGORIES[0].id,
  );
  const reducedMotion = useReducedMotion();

  const activeCategory =
    RESULT_CATEGORIES.find((category) => category.id === activeCategoryId) ??
    RESULT_CATEGORIES[0];

  // Duplicate the same sequence so the second set continues seamlessly
  // after the first. Each group has matching padding at its end.
  const shouldAnimate = !reducedMotion && activeCategory.students.length > 1;
  const cardsPerRow = activeCategory.students.length;
  const duration = Math.max(18, cardsPerRow * 3.1);

  function StudentCard({ student }: { student: Student }) {
    return (
      <article className="relative w-[172px] shrink-0 overflow-hidden rounded-[18px] border border-blue-100 bg-white shadow-[0_8px_25px_rgba(24,51,93,0.08)] sm:w-[185px] lg:w-[195px]">
        <div className="relative aspect-[7/9] overflow-hidden bg-[#f5f8ff]">
          <Image
            src={student.image}
            alt={`${student.name}, ${activeCategory.label} result`}
            fill
            sizes="(max-width: 640px) 172px, (max-width: 1024px) 185px, 195px"
            className="object-contain object-center"
            unoptimized
          />
          <span className="absolute left-2 top-2 max-w-[calc(100%-16px)] truncate rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-blue-700 shadow-sm">
            {activeCategory.label}
          </span>
        </div>
        <div className="flex min-h-[100px] flex-col px-3 py-3">
          <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-blue-600">
            <GraduationCap size={14} aria-hidden="true" /> SmartIQ Institute
          </div>
          <h3 className="mt-1 text-sm font-black leading-snug text-[#112447]">
            {student.name}
          </h3>
          <p className="mt-auto flex items-start gap-1.5 border-t border-slate-100 pt-2 text-[11px] font-semibold leading-[17px] text-slate-600">
            <Trophy
              size={14}
              className="mt-0.5 shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <span>{student.result}</span>
          </p>
        </div>
      </article>
    );
  }

  function StudentGroup({ duplicate = false }: { duplicate?: boolean }) {
    return (
      <div
        className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
        aria-hidden={duplicate ? true : undefined}
      >
        {activeCategory.students.map((student) => (
          <StudentCard
            key={`${duplicate ? "copy" : "main"}-${student.name}`}
            student={student}
          />
        ))}
      </div>
    );
  }

  return (
    <RevealOnScroll>
      <section className="w-full py-8" aria-label="SmartIQ student results">
        {/* Course selection controls are unchanged. */}
        <div className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-center gap-2.5 px-4 sm:px-6">
          {RESULT_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              aria-pressed={activeCategoryId === category.id}
              className={`min-h-11 rounded-full border px-4 py-2.5 text-xs font-bold transition sm:px-5 sm:text-sm ${
                activeCategoryId === category.id
                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200/60"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="mx-auto mb-5 flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
              Student achievements
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {activeCategory.label} Results
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeCategory.students.length} student
              {activeCategory.students.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Continuous marquee. No arrows, snap points or jumping between cards. */}
        <div
          className="relative w-full overflow-hidden"
          aria-label={`${activeCategory.label} student photo slideshow`}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-14" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-14" />

          {shouldAnimate ? (
            <motion.div
              key={activeCategoryId}
              className="flex w-max will-change-transform"
              initial={{ x: "0%" }}
              animate={{ x: "-50%" }}
              transition={{ duration, repeat: Infinity, ease: "linear" }}
            >
              <StudentGroup />
              <StudentGroup duplicate />
            </motion.div>
          ) : (
            <div className="flex gap-3 overflow-x-auto px-4 pb-3 sm:px-6">
              <StudentGroup />
            </div>
          )}
        </div>
      </section>
    </RevealOnScroll>
  );
}
