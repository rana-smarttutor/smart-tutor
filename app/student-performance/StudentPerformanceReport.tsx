"use client";

import { useEffect, useMemo } from "react";
import "./student-performance.css";

type Report = {
  _id?: string;
  reportType: string;
  period: string;
  status: string;
  student: {
    name: string;
    classLevel: string;
    school: string;
    city: string;
    state: string;
    batch: string;
    course: string;
    parentName: string;
    parentRelation: string;
    parentContact: string;
    photo?: string;
  };
  metrics: {
    averageScore: number;
    batchRank: number;
    attendancePercentage: number;
    homeworkCompletionPercentage: number;
    improvementPercentage: number;
    accuracyPercentage: number;
  };
  subjectWiseMarks: {
    subject: string;
    score: number;
    feedback: string;
  }[];
  marksTrend: {
    date: string;
    score: number;
  }[];
  accuracySplit: {
    correct: number;
    wrong: number;
    unattempted: number;
  };
  attendanceGraph: {
    date: string;
    present: boolean;
  }[];
  strengthsWeaknesses: {
    strongSubject: string;
    weakSubject: string;
    timeManagement: string;
    weakChapters: string[];
  };
  suggestions: {
    teacherRemark: string;
    improvementSuggestion: string;
    studyRecommendation: string;
    smartRecommendation: string;
  };
};

function statusClass(value: number) {
  if (value >= 75) return "good";
  if (value >= 55) return "average";
  return "bad";
}

function getSubjectStatus(value: number) {
  if (value >= 75) return "Strong";
  if (value >= 55) return "Needs Practice";
  return "Needs Attention";
}

function StudentAvatar({ report }: { report: Report }) {
  const initials = report.student.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="t5-avatar">
      {report.student.photo ? (
        <img src={report.student.photo} alt="" onError={(event) => {
          event.currentTarget.style.display = "none";
        }} />
      ) : null}
      <span>{initials}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix = "",
  helper,
  tone = "good",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  helper?: string;
  tone?: "good" | "average" | "bad";
}) {
  return (
    <div className={`t5-card t5-metric ${tone}`}>
      <p>{label}</p>
      <strong>
        {value}
        {suffix}
      </strong>
      {helper ? <span>{helper}</span> : null}
    </div>
  );
}

function LineChart({ data }: { data: Report["marksTrend"] }) {
  const width = 760;
  const height = 220;
  const pad = 34;

  const points = data || [];

  const coords = points.map((item, index) => {
    const x =
      points.length === 1
        ? width / 2
        : pad + (index * (width - pad * 2)) / (points.length - 1);

    const y = height - pad - (Number(item.score || 0) / 100) * (height - pad * 2);

    return { x, y, item };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="t5-card t5-chart-card">
      <h3>Weekly Marks Trend</h3>

      <svg viewBox={`0 0 ${width} ${height}`} className="t5-line-chart">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} className="t5-axis" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} className="t5-axis" />

        {[25, 50, 75, 100].map((tick) => {
          const y = height - pad - (tick / 100) * (height - pad * 2);

          return (
            <g key={tick}>
              <line x1={pad} y1={y} x2={width - pad} y2={y} className="t5-grid" />
              <text x={8} y={y + 4} className="t5-tick">
                {tick}%
              </text>
            </g>
          );
        })}

        <polyline points={line} fill="none" className="t5-trend-line" />

        {coords.map((point, index) => (
          <circle
            key={`dot-${index}`}
            cx={point.x}
            cy={point.y}
            r="5"
            className={`t5-chart-dot ${statusClass(Number(point.item.score || 0))}`}
          />
        ))}

        {coords.map((point, index) => (
          <text
            key={`label-${index}`}
            x={point.x}
            y={height - 8}
            textAnchor="middle"
            className="t5-x-label"
          >
            {point.item.date}
          </text>
        ))}
      </svg>
    </div>
  );
}

function SubjectBars({ subjects }: { subjects: Report["subjectWiseMarks"] }) {
  return (
    <div className="t5-card t5-chart-card">
      <h3>Subject-wise Marks</h3>

      <div className="t5-bars">
        {subjects.map((item) => (
          <div className="t5-bar-row" key={item.subject}>
            <span>{item.subject}</span>
            <div className="t5-bar-track">
              <div
                className={`t5-bar-fill ${statusClass(Number(item.score || 0))}`}
                style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
              />
            </div>
            <strong>{item.score}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccuracyDonut({ split }: { split: Report["accuracySplit"] }) {
  const correct = Number(split.correct || 0);
  const wrong = Number(split.wrong || 0);
  const unattempted = Number(split.unattempted || 0);

  const total = correct + wrong + unattempted || 1;
  const correctPct = Math.round((correct / total) * 100);
  const wrongPct = Math.round((wrong / total) * 100);
  const unattemptedPct = Math.max(0, 100 - correctPct - wrongPct);

  const background = `conic-gradient(
    #2563eb 0 ${correctPct}%,
    #f59e0b ${correctPct}% ${correctPct + wrongPct}%,
    #ef4444 ${correctPct + wrongPct}% 100%
  )`;

  return (
    <div className="t5-card t5-chart-card">
      <h3>Accuracy Analysis</h3>

      <div className="t5-donut-wrap">
        <div className="t5-donut" style={{ background }}>
          <div className="t5-donut-center">{correctPct}%</div>
        </div>

        <div className="t5-legend">
          <span>
            <b className="t5-dot-blue" /> Correct: {correctPct}%
          </span>
          <span>
            <b className="t5-dot-yellow" /> Wrong: {wrongPct}%
          </span>
          <span>
            <b className="t5-dot-red" /> Unattempted: {unattemptedPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

function AttendanceGraph({ items }: { items: Report["attendanceGraph"] }) {
  return (
    <div className="t5-card t5-chart-card">
      <h3>Attendance Graph</h3>

      <div className="t5-attendance-grid">
        {items.map((item, index) => (
          <div
            key={`${item.date}-${index}`}
            className={`t5-attendance-day ${item.present ? "present" : "absent"}`}
          >
            <span>{item.date}</span>
            <strong>{item.present ? "P" : "A"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrongWeakAreas({ report }: { report: Report }) {
  return (
    <div className="t5-card">
      <h3>Strong & Weak Areas</h3>

      <div className="t5-area-grid">
        <div className="t5-area good">
          <span>Strong Subject</span>
          <strong>{report.strengthsWeaknesses.strongSubject}</strong>
        </div>

        <div className="t5-area bad">
          <span>Weak Subject</span>
          <strong>{report.strengthsWeaknesses.weakSubject}</strong>
        </div>

        <div className="t5-area average full">
          <span>Time Management</span>
          <strong>{report.strengthsWeaknesses.timeManagement}</strong>
        </div>
      </div>

      <div className="t5-chips">
        {report.strengthsWeaknesses.weakChapters.map((chapter) => (
          <span key={chapter}>{chapter}</span>
        ))}
      </div>
    </div>
  );
}

function TeacherFeedback({ subjects }: { subjects: Report["subjectWiseMarks"] }) {
  return (
    <div className="t5-card">
      <h3>Subject-wise Teacher Feedback</h3>

      <div className="t5-feedback-grid">
        {subjects.map((item) => (
          <div
            className={`t5-feedback-card ${statusClass(Number(item.score || 0))}`}
            key={item.subject}
          >
            <p>{item.subject}</p>
            <strong>{item.score}%</strong>
            <span>{getSubjectStatus(Number(item.score || 0))}</span>
            <small>{item.feedback}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmartRecommendations({ report }: { report: Report }) {
  return (
    <div className="t5-card">
      <h3>Smart Recommendations</h3>

      <div className="t5-recommendations">
        <div>
          <b>Teacher Remark</b>
          <p>{report.suggestions.teacherRemark}</p>
        </div>

        <div>
          <b>Improvement Suggestion</b>
          <p>{report.suggestions.improvementSuggestion}</p>
        </div>

        <div>
          <b>Study Recommendation</b>
          <p>{report.suggestions.studyRecommendation}</p>
        </div>

        <div>
          <b>AI Smart Recommendation</b>
          <p>{report.suggestions.smartRecommendation}</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentPerformanceReport({ report }: { report: Report }) {
  useEffect(() => {
    document.body.classList.add("report-only-mode");

    return () => {
      document.body.classList.remove("report-only-mode");
    };
  }, []);

  const reportTitle = useMemo(() => {
    return report.reportType === "monthly"
      ? "Monthly Student Performance Report"
      : "Weekly Student Performance Report";
  }, [report.reportType]);

  function downloadPdf() {
    window.print();
  }

  function shareWhatsApp() {
    const message = encodeURIComponent(
      `Student Performance Report\nName: ${report.student.name}\nPeriod: ${report.period}\nAverage Score: ${report.metrics.averageScore}%\nAccuracy: ${report.metrics.accuracyPercentage}%\nStatus: ${report.status}`
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  return (
    <main className="t5-page">
      <div className="t5-actions no-print">
        <button onClick={downloadPdf}>Download PDF</button>
        <button onClick={shareWhatsApp}>Share WhatsApp</button>
      </div>

      <section className="t5-report">
  <div className="t5-new-header">
    <div className="t5-new-logo-box">
      <img
        src="/smart-tutors-logo.png"
        alt="Smart Tutors"
        className="t5-new-logo"
      />
    </div>

    <div>
      <p>Smart Tutors</p>
      <h1>{reportTitle}</h1>
      <span>
        Analytics report with graphs, charts, AI insights and teacher feedback
      </span>
    </div>
  </div>

  <section className="t5-student-card">
          <StudentAvatar report={report} />

          <div className="t5-student-main">
            <h2>{report.student.name}</h2>
            <p>
              {report.student.classLevel} • {report.student.school}
            </p>
            <p>
              {report.student.city}, {report.student.state}
            </p>
          </div>

          <div className="t5-student-info">
            <div>
              <span>BATCH</span>
              <strong>{report.student.batch}</strong>
            </div>
            <div>
              <span>COURSE</span>
              <strong>{report.student.course}</strong>
            </div>
            <div>
              <span>PARENT</span>
              <strong>
                {report.student.parentName} ({report.student.parentRelation})
              </strong>
            </div>
            <div>
              <span>CONTACT</span>
              <strong>{report.student.parentContact}</strong>
            </div>
          </div>

          <div className="t5-status">{report.status}</div>
        </section>

        <h2 className="t5-section-heading">
          {report.reportType === "monthly" ? "Monthly Performance" : "Weekly Performance"}
        </h2>

        <section className="t5-metrics-grid">
          <MetricCard
            label={report.reportType === "monthly" ? "Monthly Average Score" : "Weekly Average Score"}
            value={report.metrics.averageScore}
            suffix="%"
            helper="Last tests average"
            tone="good"
          />
          <MetricCard
            label="Batch Rank"
            value={report.metrics.batchRank}
            helper="Latest test rank"
            tone="good"
          />
          <MetricCard
            label="Attendance"
            value={report.metrics.attendancePercentage}
            suffix="%"
            tone="good"
          />
          <MetricCard
            label="Homework Completion"
            value={report.metrics.homeworkCompletionPercentage}
            suffix="%"
            tone="average"
          />
          <MetricCard
            label="Improvement"
            value={report.metrics.improvementPercentage > 0 ? `+${report.metrics.improvementPercentage}` : report.metrics.improvementPercentage}
            suffix="%"
            tone={report.metrics.improvementPercentage >= 0 ? "good" : "bad"}
          />
          <MetricCard
            label="Accuracy"
            value={report.metrics.accuracyPercentage}
            suffix="%"
            tone="good"
          />
        </section>

        <section className="t5-chart-grid">
          <LineChart data={report.marksTrend} />
          <SubjectBars subjects={report.subjectWiseMarks} />
          <AccuracyDonut split={report.accuracySplit} />
          <AttendanceGraph items={report.attendanceGraph} />
        </section>

        <section className="t5-bottom-grid">
          <StrongWeakAreas report={report} />
          <TeacherFeedback subjects={report.subjectWiseMarks} />
          <SmartRecommendations report={report} />
        </section>

        <footer className="t5-footer">
          Generated by Smart Tutors Student Performance Analytics System
        </footer>
      </section>
    </main>
  );
}