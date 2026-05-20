"use client";

import { useState, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { PerformanceReport, PerformanceHeuristics } from "@/lib/types";

type Props = {
  reports: PerformanceReport[];
  heuristics: PerformanceHeuristics;
  studentName?: string;
};

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function PerformanceDashboard({ reports, heuristics, studentName }: Props) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  if (!activeReport) {
    return (
      <div className="surface p-12 text-center rounded-[2rem]">
        <p className="text-[var(--color-muted)] font-medium">No performance reports available yet.</p>
      </div>
    );
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= heuristics.outstanding) return { label: "Outstanding", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
    if (score >= heuristics.excellent) return { label: "Excellent", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
    if (score >= heuristics.good) return { label: "Good", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
    if (score >= heuristics.average) return { label: "Average", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
    return { label: "Needs Attention", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
  };

  const level = getPerformanceLevel(activeReport.averageScore);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = reportRef.current;

      // Convert image to data URL manually to ensure html2canvas captures it
      const convertImageToDataUrl = async (img: HTMLImageElement): Promise<string | null> => {
        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Image conversion failed", e);
          return null;
        }
      };

      const images = element.getElementsByTagName("img");
      const imageMap = new Map<string, string>();
      
      for (let i = 0; i < images.length; i++) {
        const dataUrl = await convertImageToDataUrl(images[i]);
        if (dataUrl) {
          imageMap.set(images[i].src, dataUrl);
        }
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Replace all image sources with their data URL counterparts
          const clonedImages = clonedDoc.getElementsByTagName("img");
          for (let i = 0; i < clonedImages.length; i++) {
            const img = clonedImages[i];
            const dataUrl = imageMap.get(img.src);
            if (dataUrl) {
              img.src = dataUrl;
            }
            img.style.visibility = "visible";
            img.style.opacity = "1";
            img.style.display = "block";
          }

          // Fix for html2canvas unsupported color functions (lab, oklch)
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            
            if (el.style) {
              const hasModernColor = (val: string) => val.includes("lab") || val.includes("oklch") || val.includes("color(");
              if (hasModernColor(style.color)) el.style.color = "#0f172a";
              if (hasModernColor(style.backgroundColor)) el.style.backgroundColor = style.backgroundColor.includes("rgba(0, 0, 0, 0)") ? "transparent" : "#ffffff";
              if (hasModernColor(style.borderColor)) el.style.borderColor = "#e2e8f0";
              if (style.backdropFilter && style.backdropFilter !== "none") {
                el.style.backdropFilter = "none";
                (el.style as any).webkitBackdropFilter = "none";
              }
            }
          }

          // FIX: Ensure charts have fixed dimensions in the clone
          const chartContainers = clonedDoc.querySelectorAll(".recharts-responsive-container");
          chartContainers.forEach((container: any) => {
            container.style.width = "600px";
            container.style.height = "350px";
            container.style.minWidth = "600px";
            container.style.minHeight = "350px";
            container.style.display = "block";
            container.style.visibility = "visible";
            
            const wrapper = container.querySelector(".recharts-wrapper");
            if (wrapper) {
              wrapper.style.width = "600px";
              wrapper.style.height = "350px";
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Performance_Report_${activeReport.studentName}_${activeReport.period}.pdf`);
    } catch (error) {
      console.error("PDF download failed", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareWhatsApp = () => {
    const text = `*Student Performance Report*\n\nName: ${activeReport.studentName}\nPeriod: ${activeReport.period}\nAverage Score: ${activeReport.averageScore}%\nRank: ${activeReport.batchRank}\nAttendance: ${activeReport.attendancePercentage}%\n\nTeacher Remark: ${activeReport.teacherRemark}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Report Selector */}
      <div className="flex flex-wrap gap-3">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedReportId(r.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedReportId === r.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-blue-400"
            }`}
          >
            {r.period} ({r.reportType})
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={shareWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.661 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Share
        </button>
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      <div ref={reportRef} className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 print:shadow-none print:border-none">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-10">
          <div>
            <div className="mb-6">
              <img
                src="/image1.png"
                alt="Smart Tutors Logo"
                className="h-4 w-64 object-contain mb-2"
              />
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Vashi, Navi Mumbai • +91 99304 16335 • smarttutors.co.in
              </div>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-1">Performance Report</p>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              {activeReport.period}
            </h2>
          </div>
          <div className="text-left sm:text-right space-y-2">
            <p className="text-lg font-bold text-slate-900">{activeReport.studentName}</p>
            <p className="text-sm font-medium text-slate-500">{activeReport.batchName} | {activeReport.courseType}</p>
            <p className="text-sm font-medium text-slate-500">Parent: {activeReport.parentContact}</p>
            <div className={`mt-4 inline-flex px-4 py-2 rounded-full border ${level.border} ${level.bg} ${level.color} text-xs font-black uppercase tracking-widest`}>
              {level.label}
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-10">
          {[
            { label: "Avg. Score", value: `${activeReport.averageScore}%`, icon: "🎯", color: "text-blue-600" },
            { label: "Batch Rank", value: `#${activeReport.batchRank}`, icon: "🏆", color: "text-amber-600" },
            { label: "Attendance", value: `${activeReport.attendancePercentage}%`, icon: "📅", color: "text-emerald-600" },
            { label: "Accuracy", value: `${activeReport.accuracyPercentage}%`, icon: "📈", color: "text-indigo-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 p-5 rounded-3xl border border-slate-100/50">
              <div className="text-2xl mb-3">{stat.icon}</div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </section>

        {/* Main Analytics */}
        <div className="grid lg:grid-cols-2 gap-8 py-4">
          {/* Marks Trend or Subject Wise */}
          <article className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm min-h-[400px]">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <span className="h-4 w-1 bg-blue-600 rounded-full" />
              Subject Performance
            </h3>
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                <BarChart data={activeReport.subjectWiseMarks}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 800 }}
                  />
                  <Bar dataKey="marks" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Accuracy Analysis */}
          <article className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm min-h-[400px]">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <span className="h-4 w-1 bg-indigo-600 rounded-full" />
              Accuracy Breakdown
            </h3>
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                <PieChart>
                  <Pie
                    data={activeReport.accuracyAnalysis}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {activeReport.accuracyAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        {/* Secondary Metrics */}
        <section className="grid lg:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2rem]">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Strengths & Weaknesses</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Strong Subjects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeReport.strongSubjects.map(s => <span key={s} className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm">{s}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-600 mb-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Weak Subjects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeReport.weakSubjects.map(s => <span key={s} className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Teacher's Remark</h4>
              <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                "{activeReport.teacherRemark}"
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-[2rem] border border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Smart Recommendations</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">💡</div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Improvement Plan</p>
                    <p className="text-sm font-bold text-slate-700">{activeReport.improvementSuggestion}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">📚</div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Study Advice</p>
                    <p className="text-sm font-bold text-slate-700">{activeReport.studyRecommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Generated by Smart Tutors Analytics Engine</p>
          <div className="flex gap-4 grayscale opacity-50">
            <span className="text-[10px] font-bold">ISO 9001:2015</span>
            <span className="text-[10px] font-bold">MSME CERTIFIED</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
