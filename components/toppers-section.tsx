"use client";

import { Trophy, Award, Star, Quote } from "lucide-react";
import { motion } from "motion/react";

interface Topper {
  name: string;
  result: string;
  image: string;
  detail: string;
}

interface ToppersSectionProps {
  activeTab: string;
}

export default function ToppersSection({ activeTab }: ToppersSectionProps) {
  // Curated toppers list mapping directly from actual library stats
  const getAllToppers = (): Topper[] => {
    switch (activeTab) {
      case "Class 6-8":
        return [
          {
            name: "Master Aryan",
            result: "96.4% (Class 8)",
            image: "/student-photos/MilitaryStudent.png",
            detail: "Foundation Excellence",
          },
          {
            name: "Ms. Sanvi",
            result: "94.2% (Class 7)",
            image: "/student-photos/AditiSharma.png",
            detail: "Junior Scholar",
          },
        ];
      case "Class 9-10":
        return [
          {
            name: "Rohan Deshmukh",
            result: "98.40% (CBSE Boards)",
            image: "/student-photos/Aditya Verma.png",
            detail: "Class 10th Board Topper",
          },
          {
            name: "Sneha Patil",
            result: "97.20% (State Boards)",
            image: "/student-photos/Ananya Joshi.png",
            detail: "Class 10th State Topper",
          },
        ];
      case "Class 11-12":
        return [
          {
            name: "Mr. Kanade",
            result: "99.37 Percentile",
            image: "/student-photos/Mr.Kanade.png",
            detail: "MAH MBA CET 2024",
          },
          {
            name: "Mr. Aadesh Gaigawali",
            result: "99+ Percentile",
            image: "/student-photos/Mr.AadeshGaigawali.png",
            detail: "MAH MBA CET 2024",
          },
          {
            name: "Omkar Paturkar",
            result: "95+ Percentile",
            image: "/student-photos/Omkar Paturkar.png",
            detail: "MAH MBA CET 2024",
          },
        ];
      case "Govt Exams":
        return [
          {
            name: "Ms. Ritamvara",
            result: "1st Rank (SBI PO)",
            image: "/student-photos/Ms.  Ritamvara.png",
            detail: "SBI PO 2024 Success",
          },
          {
            name: "Ms. Priyanka",
            result: "1st Rank (SBI PO)",
            image: "/student-photos/Ms. Priyanka.png",
            detail: "SBI PO 2024 Success",
          },
          {
            name: "Mr. Darshit",
            result: "1st Rank (SBI PO)",
            image: "/student-photos/Mr.Darshit.png",
            detail: "SBI PO 2024 Success",
          },
          {
            name: "Mr. Ranjeet",
            result: "1st Rank (NABARD)",
            image: "/student-photos/Mr. Ranjeet.png",
            detail: "NABARD Excellence",
          },
          {
            name: "Mr. Vishal",
            result: "1st Rank (SSC GD)",
            image: "/student-photos/Mr.Vishal.png",
            detail: "SSC GD Success",
          },
        ];
      case "Graduation":
        return [
          {
            name: "Mr. Vaibhava",
            result: "1st Rank (CLAT)",
            image: "/student-photos/Mr.Vaibhava.png",
            detail: "NLU Kolkata Selection",
          },
          {
            name: "Mr. Akash",
            result: "Revenue Officer",
            image: "/student-photos/Mr.Akash.png",
            detail: "MPSC Success",
          },
        ];
      case "Post Grad":
        return [
          {
            name: "Mr. Raj Singh",
            result: "1st Rank (RBI Grade B)",
            image: "/student-photos/RajSingh.png",
            detail: "Banking Excellence",
          },
          {
            name: "Ms. Riya Kamble",
            result: "1st Rank (RBI Grade B)",
            image: "/student-photos/RiyaKamble.png",
            detail: "Professional Success",
          },
        ];
      case "Skills":
        return [
          {
            name: "Rohan Patel",
            result: "₹22.0 LPA (Amazon)",
            image: "/student-photos/Rohan Patel.png",
            detail: "SDE-I Placement",
          },
          {
            name: "Ananya Joshi",
            result: "₹12.8 LPA (Deloitte)",
            image: "/student-photos/Ananya Joshi.png",
            detail: "Business Tech Analyst",
          },
          {
            name: "Sneha Kulkarni",
            result: "₹8.5 LPA (Infosys)",
            image: "/student-photos/Sneha Kulkarni.png",
            detail: "Systems Engineer",
          },
          {
            name: "Karan Deshmukh",
            result: "₹7.2 LPA (Wipro)",
            image: "/student-photos/Karan Deshmukh.png",
            detail: "Project Engineer",
          },
        ];
      default:
        return [
          {
            name: "Rohan Deshmukh",
            result: "98.40% (CBSE Boards)",
            image: "/student-photos/Aditya Verma.png",
            detail: "Class 10th Board topper",
          },
          {
            name: "Sneha Patil",
            result: "97.20% (State Boards)",
            image: "/student-photos/Ananya Joshi.png",
            detail: "Class 12th State topper",
          },
        ];
    }
  };

  const toppers = getAllToppers();

  return (
    <div className="bg-slate-50 border border-slate-200 text-slate-950 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Decorative subtle visual elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-50/40 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-8 relative z-10">
        <center>
          <div className="bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded inline-flex items-center gap-1.5 mx-auto">
            <Trophy className="w-3.5 h-3.5" />
            Hall of Fame
          </div>
        </center>

        <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight mt-2 text-slate-900">
          Inspiring Academic <span className="text-blue-600">Achievements</span> & Toppers
        </h3>

        <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl mx-auto">
          Celebrating the hard work, perseverance, and exceptional performance of our student cohorts across board standards, CET entrances, and technical segments.
        </p>
      </div>

      {/* Grid of toppers with sleek animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
        {toppers.map((topper, index) => (
          <motion.div
            key={topper.name}
            whileHover={{ y: -3, backgroundColor: "#ffffff" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="bg-white border border-slate-200 p-5 rounded-lg flex flex-col justify-between space-y-4 text-center items-center group relative shadow-sm"
          >
            {/* Laurel decoration */}
            <div className="absolute -top-2.5 right-3 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider py-0.5 px-2 rounded">
              <Star className="w-2.5 h-2.5 fill-white" /> Topper
            </div>

            {/* Profile Avatar Container with premium border */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-blue-600 relative z-10 bg-slate-100 shadow-xs">
                <img
                  src={topper.image}
                  alt={topper.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to high-contrast initials avatar on load error
                    e.currentTarget.style.display = "none";
                  }}
                />
                {/* Fallback stylized alphabet circle */}
                <div className="w-full h-full bg-linear-to-tr from-blue-700 to-blue-800 text-white flex items-center justify-center font-display font-medium text-xl uppercase">
                  {topper.name.charAt(0)}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center border border-white shadow-xs z-20">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Student metadata */}
            <div className="space-y-0.5">
              <h4 className="font-display font-bold text-sm text-slate-950 group-hover:text-blue-600 transition-colors leading-tight">
                {topper.name}
              </h4>
              <p className="text-slate-400 text-[10px] font-bold leading-none uppercase">{topper.detail}</p>
            </div>

            {/* Laurel Score Block */}
            <div className="w-full bg-slate-50 p-2.5 rounded border border-slate-200/60">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider leading-none">result achieved</span>
              <span className="text-blue-600 font-display font-bold text-xs block mt-1 whitespace-nowrap">
                {topper.result}
              </span>
            </div>

            {/* Small motivating quote icon */}
            <div className="text-[10px] text-slate-400 font-semibold leading-none flex items-center justify-center gap-1">
              <Quote className="w-2.5 h-2.5 text-blue-500/30" /> Smart Tutors Cohort
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
