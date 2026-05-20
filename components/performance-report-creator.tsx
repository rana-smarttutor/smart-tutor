"use client";

import { useState, useEffect } from "react";
import type { PerformanceHeuristics, PerformanceReport, ManagedUser, SessionUser } from "@/lib/types";
import { DEFAULT_HEURISTICS } from "@/lib/data-store";

type Props = {
  session: SessionUser | null;
  studentDirectory: ManagedUser[];
  onReportCreated?: (report: PerformanceReport) => void;
};

export function PerformanceReportCreator({ session, studentDirectory, onReportCreated }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeuristics, setShowHeuristics] = useState(false);
  const [heuristics, setHeuristics] = useState<PerformanceHeuristics>(DEFAULT_HEURISTICS);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<PerformanceReport>>({
    studentId: "",
    studentName: "",
    batchName: "",
    courseType: "JEE",
    parentContact: "",
    reportType: "weekly",
    period: "",
    averageScore: 0,
    batchRank: 0,
    attendancePercentage: 0,
    homeworkCompletionPercentage: 0,
    improvementPercentage: 0,
    accuracyPercentage: 0,
    strongSubjects: [],
    weakSubjects: [],
    weakChapters: [],
    strongAreas: [],
    weakAreas: [],
    teacherRemark: "",
    improvementSuggestion: "",
    studyRecommendation: "",
    timeManagementAnalysis: "",
  });

  // Load existing heuristics on mount
  useEffect(() => {
    async function loadHeuristics() {
      if (!session) return;
      try {
        const res = await fetch(`/api/performance?educatorId=${session.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.heuristics) setHeuristics(data.heuristics);
        }
      } catch (err) {
        console.error("Failed to load heuristics", err);
      }
    }
    void loadHeuristics();
  }, [session]);

  const handleStudentChange = (studentId: string) => {
    const student = studentDirectory.find((s) => s.id === studentId);
    if (student) {
      setFormData((prev) => ({
        ...prev,
        studentId: student.id,
        studentName: student.name,
        batchName: student.program,
      }));
    }
  };

  const handleSaveHeuristics = async () => {
    try {
      const res = await fetch("/api/performance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heuristics }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Heuristics saved successfully!" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save heuristics" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Basic data preparation for charts (Placeholders or derived from manual entry)
    const reportData = {
      ...formData,
      subjectWiseMarks: [
        { subject: "Physics", marks: Math.floor(Math.random() * 100) },
        { subject: "Chemistry", marks: Math.floor(Math.random() * 100) },
        { subject: "Maths", marks: Math.floor(Math.random() * 100) },
      ],
      accuracyAnalysis: [
        { category: "Correct", value: formData.accuracyPercentage || 0 },
        { category: "Incorrect", value: 100 - (formData.accuracyPercentage || 0) },
      ],
      attendanceData: [
        { label: "Present", value: formData.attendancePercentage || 0 },
        { label: "Absent", value: 100 - (formData.attendancePercentage || 0) },
      ],
    };

    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        const { report } = await res.json();
        setMessage({ type: "success", text: "Performance report created successfully!" });
        if (onReportCreated) onReportCreated(report);
        // Reset form except student selection if desired, or full reset
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to create report" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred while saving the report" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-heading)]">Report Creator</h2>
          <p className="text-sm text-[var(--color-muted)]">Create detailed performance reports for students.</p>
        </div>
        <button
          onClick={() => setShowHeuristics(!showHeuristics)}
          className="pill bg-[var(--color-panel)] border border-[var(--color-border)] hover:bg-blue-50 hover:text-blue-600 transition-all font-bold"
        >
          {showHeuristics ? "Hide Heuristics" : "Configure Heuristics"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold text-center ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
          {message.text}
        </div>
      )}

      {showHeuristics && (
        <article className="surface border-2 border-blue-100 p-6 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Performance Cutoffs (%)</h3>
          <p className="text-sm text-[var(--color-muted)] mb-6">Define percentage thresholds for color-coded indicators.</p>
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(heuristics) as Array<keyof PerformanceHeuristics>).map((key) => (
              <div key={key} className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">{key}</label>
                <input
                  type="number"
                  value={heuristics[key]}
                  onChange={(e) => setHeuristics({ ...heuristics, [key]: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveHeuristics}
            className="mt-6 action-button bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all"
          >
            Save Heuristics
          </button>
        </article>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6">
        <section className="surface p-6 rounded-[2rem] border border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-heading)] mb-6 flex items-center gap-2">
            <span className="h-6 w-1.5 bg-blue-600 rounded-full" />
            Basic Information
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Select Student</label>
              <select
                required
                value={formData.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              >
                <option value="">Choose Student...</option>
                {studentDirectory.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.program})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Report Type</label>
              <select
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              >
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Period (e.g. May Week 1)</label>
              <input
                required
                placeholder="May 2026 / Week 1"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Course</label>
              <select
                value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value as any })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              >
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
                <option value="Foundation">Foundation</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Parent Contact</label>
              <input
                required
                placeholder="+91 00000 00000"
                value={formData.parentContact}
                onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
          </div>
        </section>

        <section className="surface p-6 rounded-[2rem] border border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-heading)] mb-6 flex items-center gap-2">
            <span className="h-6 w-1.5 bg-emerald-600 rounded-full" />
            Performance Metrics
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Average Score (%)</label>
              <input
                type="number"
                value={formData.averageScore}
                onChange={(e) => setFormData({ ...formData, averageScore: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Batch Rank</label>
              <input
                type="number"
                value={formData.batchRank}
                onChange={(e) => setFormData({ ...formData, batchRank: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Attendance (%)</label>
              <input
                type="number"
                value={formData.attendancePercentage}
                onChange={(e) => setFormData({ ...formData, attendancePercentage: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Accuracy (%)</label>
              <input
                type="number"
                value={formData.accuracyPercentage}
                onChange={(e) => setFormData({ ...formData, accuracyPercentage: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">HW Completion (%)</label>
              <input
                type="number"
                value={formData.homeworkCompletionPercentage}
                onChange={(e) => setFormData({ ...formData, homeworkCompletionPercentage: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Improvement (%)</label>
              <input
                type="number"
                value={formData.improvementPercentage}
                onChange={(e) => setFormData({ ...formData, improvementPercentage: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
              />
            </div>
          </div>
        </section>

        <section className="surface p-6 rounded-[2rem] border border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-heading)] mb-6 flex items-center gap-2">
            <span className="h-6 w-1.5 bg-amber-600 rounded-full" />
            Teacher Feedback & Suggestions
          </h3>
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Strong Subjects (Comma separated)</label>
                <input
                  placeholder="Physics, Maths"
                  value={formData.strongSubjects?.join(", ")}
                  onChange={(e) => setFormData({ ...formData, strongSubjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Weak Subjects (Comma separated)</label>
                <input
                  placeholder="Chemistry"
                  value={formData.weakSubjects?.join(", ")}
                  onChange={(e) => setFormData({ ...formData, weakSubjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Teacher Remark</label>
              <textarea
                rows={3}
                placeholder="Consistent performance but needs to focus on Chemistry numericals..."
                value={formData.teacherRemark}
                onChange={(e) => setFormData({ ...formData, teacherRemark: e.target.value })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Improvement Suggestion</label>
                <textarea
                  rows={2}
                  placeholder="Practice more MCQ tests for speed..."
                  value={formData.improvementSuggestion}
                  onChange={(e) => setFormData({ ...formData, improvementSuggestion: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Study Recommendation</label>
                <textarea
                  rows={2}
                  placeholder="Review organic chemistry notes twice a week..."
                  value={formData.studyRecommendation}
                  onChange={(e) => setFormData({ ...formData, studyRecommendation: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm font-bold outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full action-button bg-blue-600 text-white py-5 rounded-[1.25rem] font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isSubmitting ? "Creating Report..." : "Create Performance Report"}
        </button>
      </form>
    </div>
  );
}
