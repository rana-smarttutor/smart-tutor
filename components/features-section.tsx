import {
  Users,
  Clock,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  FileText,
  MonitorPlay,
  Award,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

type Feature = {
  id: number;
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
};

const featuresData: Feature[] = [
  {
    id: 1,
    title: "Personal Mentorship (One to One)",
    description:
      "Dedicated personal mentoring tailored to each student's learning pace, strengths, and improvement areas.",
    icon: <Users size={36} strokeWidth={1.5} className="text-[#1E3A8A]" />,
  },
  {
    id: 2,
    title: "24×7 Doubt Support",
    description:
      "Get academic assistance whenever needed through continuous doubt-solving support and guidance.",
    icon: <Clock size={36} strokeWidth={1.5} className="text-[#0F172A]" />,
  },
  {
    id: 3,
    title: "Weekly Test System",
    description:
      "Regular assessments designed to monitor progress, identify gaps, and strengthen exam readiness.",
    icon: <ClipboardCheck size={36} strokeWidth={1.5} className="text-[#059669]" />,
  },
  {
    id: 4,
    title: "Student Performance Report",
    description:
      "Detailed performance tracking with insights shared with students and parents for continuous improvement.",
    icon: <BarChart3 size={36} strokeWidth={1.5} className="text-[#16A34A]" />,
  },
  {
    id: 5,
    title: "Digital Learning Resources",
    description:
      "Access comprehensive study materials, notes, worksheets, and e-books anytime.",
    icon: <BookOpen size={36} strokeWidth={1.5} className="text-[#0D9488]" />,
  },
  {
    id: 6,
    title: "100+ Mock Tests",
    description:
      "Extensive mock test series designed to simulate real exam environments and boost confidence.",
    icon: <FileText size={36} strokeWidth={1.5} className="text-[#2563EB]" />,
  },
  {
    id: 7,
    title: "Interactive White Board Learning",
    description:
      "Modern teaching using interactive white boards that make learning more engaging, visual, and effective.",
    icon: <MonitorPlay size={36} strokeWidth={1.5} className="text-[#7C3AED]" />,
  },
  {
    id: 8,
    title: "Interview Training & Personality Development",
    description:
      "Build communication skills, confidence, leadership qualities, and overall personality growth.",
    icon: <Award size={36} strokeWidth={1.5} className="text-[#1E3A8A]" />,
  },
  {
    id: 9,
    title: "7 Days Replacement Guarantee",
    description: (
      <>
        If a student is not satisfied with the teaching method, we provide a
        replacement within{" "}
        <span className="text-[#2563EB] font-bold">7 days</span>.
      </>
    ),
    icon: <RefreshCcw size={36} strokeWidth={1.5} className="text-[#EA580C]" />,
  },
  {
    id: 10,
    title: "100% Job Placement",
    description:
      "Our commitment is your career — we ensure 100% job placement support with training, guidance, and opportunities.",
    icon: <ShieldCheck size={36} strokeWidth={1.5} className="text-[#DC2626]" />,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#FAFAFA" }}>
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-14 flex flex-col items-center">
          <div
            className="text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.1em] py-2 px-6 rounded-full mb-7 inline-block shadow-sm"
            style={{ backgroundColor: "#1A56DB", color: "#FFFFFF" }}
          >
            Why Choose SmartIQ Institute
          </div>
          <h2
            className="text-[36px] sm:text-[44px] md:text-[52px] font-extrabold tracking-tight mb-6 leading-tight"
            style={{ color: "#0B1221" }}
          >
            A Legacy of{" "}
            <span className="relative whitespace-nowrap inline-block" style={{ color: "#1A56DB" }}>
              Academic Growth
              <span
                className="absolute left-0 -bottom-1 w-full h-[6px] sm:h-[8px] rounded-sm"
                style={{ backgroundColor: "#1A56DB" }}
              />
            </span>
          </h2>
          <p
            className="max-w-3xl mx-auto text-[15px] sm:text-[16px] leading-[1.7] font-medium px-4"
            style={{ color: "#475569" }}
          >
            From classrooms to career goals — we combine proven teaching methods
            with personalized guidance to help every learner achieve their goals.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuresData.map((feature) => (
            <div
              key={feature.id}
              className="flex flex-col items-center text-center p-6 rounded-[20px] bg-white border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] flex items-center justify-center rounded-full bg-slate-50/80 mb-4">
                {feature.icon}
              </div>
              <h3
                className="text-[17px] sm:text-[18px] font-extrabold mb-1.5 tracking-[-0.01em]"
                style={{ color: "#0B1221" }}
              >
                {feature.title}
              </h3>
              <div
                className="w-[18px] h-[3px] rounded-full mb-2.5"
                style={{ backgroundColor: "#1A56DB" }}
              />
              <p
                className="text-[13px] sm:text-[14px] leading-[1.65] font-medium"
                style={{ color: "#475569" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
