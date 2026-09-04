import {
  Code,
  Volume2,
  Brush,
  Briefcase,
  MessageSquare,
  Calculator,
  Award,
  Palette,
  Laptop,
  Coins,
  Brain,
  History,
  FlaskConical,
  Database,
  Cloud,
  FileText
} from "@/components/ui-icons";

interface LocalGraphicProps {
  title: string;
  className?: string;
}

export default function LocalGraphic({ title, className = "w-full h-full" }: LocalGraphicProps) {
  const normTitle = title.toLowerCase();

  // 1. Computer / IT / Coding
  if (
    normTitle.includes("computer") ||
    normTitle.includes("coding") ||
    normTitle.includes("web") ||
    normTitle.includes("software") ||
    normTitle.includes("python") ||
    normTitle.includes("mern") ||
    normTitle.includes("java") ||
    normTitle.includes("ai") ||
    normTitle.includes("machine learning")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-900 via-indigo-950 to-indigo-900 flex items-center justify-center overflow-hidden`}>
        {/* Abstract lines */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:16px_16px]" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-xs">
            <Code className="w-8 h-8 text-indigo-300" />
          </div>
          <span className="text-[10px] text-indigo-200 font-mono tracking-widest uppercase">System.out.println()</span>
        </div>
      </div>
    );
  }

  // 2. Digital Marketing / Sales / Volume
  if (
    normTitle.includes("marketing") ||
    normTitle.includes("brand") ||
    normTitle.includes("seo") ||
    normTitle.includes("media") ||
    normTitle.includes("commerce")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
            <Volume2 className="w-8 h-8 text-indigo-400" />
          </div>
          <span className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">Growth & SEO Analytics</span>
        </div>
      </div>
    );
  }

  // 3. Graphic Design & Arts / Creative / Drawing
  if (
    normTitle.includes("design") ||
    normTitle.includes("graphic") ||
    normTitle.includes("creative") ||
    normTitle.includes("arts") ||
    normTitle.includes("drawing") ||
    normTitle.includes("fine arts") ||
    normTitle.includes("sketching") ||
    normTitle.includes("aac") ||
    normTitle.includes("bdesign")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-900 via-purple-950 to-indigo-950 flex items-center justify-center overflow-hidden`}>
        {/* Dynamic decorative circles */}
        <div className="absolute inset-x-0 top-0 h-full opacity-10 bg-[radial-gradient(circle_at_30%_30%,#ffffff08_10%,transparent_10.1%)] bg-[size:12px_12px]" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full blur-xl" />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-purple-600/20 rounded-xl border border-pink-500/30">
            <Brush className="w-8 h-8 text-pink-400" />
          </div>
          <span className="text-[10px] text-purple-200 font-mono tracking-widest uppercase">Vector & Canvas Lab</span>
        </div>
      </div>
    );
  }

  // 4. Business & Management / Entrepreneurship
  if (
    normTitle.includes("business") ||
    normTitle.includes("management") ||
    normTitle.includes("portfolio") ||
    normTitle.includes("strategy") ||
    normTitle.includes("operations") ||
    normTitle.includes("sap")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-900 via-indigo-950 to-emerald-950 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,#ffffff04_25%,transparent_25%),linear-gradient(-45deg,#ffffff04_25%,transparent_25%)] bg-[size:20px_20px]" />
        <div className="absolute top-1/2 left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-emerald-600/20 rounded-xl border border-emerald-500/30">
            <Briefcase className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-200 font-mono tracking-widest uppercase">Strategic Operations</span>
        </div>
      </div>
    );
  }

  // 5. Spoken English / Communication
  if (
    normTitle.includes("communication") ||
    normTitle.includes("english") ||
    normTitle.includes("public speaking") ||
    normTitle.includes("vocabulary") ||
    normTitle.includes("speaker")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-950 via-slate-900 to-indigo-900 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:15px_15px]" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/20">
            <MessageSquare className="w-8 h-8 text-indigo-300" />
          </div>
          <span className="text-[10px] text-indigo-200 font-mono tracking-widest uppercase">Confidence & Speech</span>
        </div>
      </div>
    );
  }

  // 6. Finance / Accounting / Tally / Taxes
  if (
    normTitle.includes("finance") ||
    normTitle.includes("financial") ||
    normTitle.includes("auditing") ||
    normTitle.includes("budgeting") ||
    normTitle.includes("accounting") ||
    normTitle.includes("compounding") ||
    normTitle.includes("tax") ||
    normTitle.includes("tally") ||
    normTitle.includes("bcom") ||
    normTitle.includes("ca") ||
    normTitle.includes("cs") ||
    normTitle.includes("cma")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-900 via-emerald-950 to-indigo-950 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px)] bg-[size:12px_12px]" />
        <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-emerald-600/20 rounded-xl border border-emerald-500/30">
            <Calculator className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-300 font-mono tracking-widest uppercase">Compound Asset Labs</span>
        </div>
      </div>
    );
  }

  // 7. Cloud / Network / Certifications
  if (
    normTitle.includes("cloud") ||
    normTitle.includes("aws") ||
    normTitle.includes("infrastructure") ||
    normTitle.includes("networking") ||
    normTitle.includes("oracle") ||
    normTitle.includes("db") ||
    normTitle.includes("database") ||
    normTitle.includes("sql") ||
    normTitle.includes("mongodb")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-slate-900 via-indigo-950 to-blue-950 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
            <Database className="w-8 h-8 text-blue-400" />
          </div>
          <span className="text-[10px] text-blue-300 font-mono tracking-widest uppercase">Cloud AWS & Server Base</span>
        </div>
      </div>
    );
  }

  // 8. Government / UPSC / MPSC / Civil Services
  if (
    normTitle.includes("civil") ||
    normTitle.includes("upsc") ||
    normTitle.includes("mpsc") ||
    normTitle.includes("govt") ||
    normTitle.includes("government") ||
    normTitle.includes("administration") ||
    normTitle.includes("ias") ||
    normTitle.includes("ips")
  ) {
    return (
      <div className={`relative ${className} bg-linear-to-tr from-stone-900 via-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-4 left-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
        
        <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
          <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-400/20">
            <FileText className="w-8 h-8 text-indigo-300" />
          </div>
          <span className="text-[10px] text-indigo-200 font-mono tracking-widest uppercase">Civil Service Academy</span>
        </div>
      </div>
    );
  }

  // Fallback - General / Default
  return (
    <div className={`relative ${className} bg-linear-to-tr from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:16px_16px]" />
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
      
      <div className="text-center z-10 p-4 space-y-2 flex flex-col items-center">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs">
          <Award className="w-8 h-8 text-indigo-300" />
        </div>
        <span className="text-[10px] text-indigo-200 font-mono tracking-widest uppercase">SmartIQ Institute Track</span>
      </div>
    </div>
  );
}
