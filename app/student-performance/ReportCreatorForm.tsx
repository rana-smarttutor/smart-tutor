"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./student-performance.css";

type SubjectRow = {
  subject: string;
  score: string;
  feedback: string;
};

type TrendRow = {
  date: string;
  score: string;
};

type AttendanceRow = {
  date: string;
  present: boolean;
};

const defaultSubjects: SubjectRow[] = [
  {
    subject: "",
    score: "",
    feedback: "",
  },
];

const defaultTrend: TrendRow[] = [
  {
    date: "",
    score: "",
  },
];

const defaultAttendance: AttendanceRow[] = [
  {
    date: "",
    present: true,
  },
];

export default function ReportCreatorForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeuristics, setShowHeuristics] = useState(false);

  const [heuristics, setHeuristics] = useState({
    outstanding: "95",
    excellent: "85",
    good: "70",
    average: "50",
    weak: "40",
  });

  const [form, setForm] = useState({
    reportType: "weekly",
    status: "",

    studentName: "",
    classLevel: "",
    city: "",
    state: "",
    batch: "",
    course: "",
    parentName: "",
    parentRelation: "",
    parentContact: "",

    averageScore: "",
    batchRank: "",
    attendancePercentage: "",
    homeworkCompletionPercentage: "",
    improvementPercentage: "",
    accuracyPercentage: "",

    correct: "",
    wrong: "",
    unattempted: "",

    strongSubject: "",
    weakSubject: "",
    timeManagement: "",
    weakChapters: "",

    teacherRemark: "",
    improvementSuggestion: "",
    studyRecommendation: "",
    smartRecommendation: "",
  });

  const reportTitle =
    form.reportType === "monthly"
      ? "Monthly Student Performance Report"
      : "Weekly Student Performance Report";

  const [subjects, setSubjects] = useState<SubjectRow[]>(defaultSubjects);
  const [trend, setTrend] = useState<TrendRow[]>(defaultTrend);
  const [attendance, setAttendance] =
    useState<AttendanceRow[]>(defaultAttendance);

  function updateForm(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateHeuristic(name: string, value: string) {
    setHeuristics((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function saveHeuristics() {
    alert("Heuristics saved successfully.");
  }

  function getPerformanceLabel(score: number) {
    if (score >= Number(heuristics.outstanding)) return "outstanding";
    if (score >= Number(heuristics.excellent)) return "excellent";
    if (score >= Number(heuristics.good)) return "good";
    if (score >= Number(heuristics.average)) return "average";
    return "weak";
  }

  function generatePersonalizedFeedback() {
    const averageScore = Number(form.averageScore) || 0;
    const accuracy = Number(form.accuracyPercentage) || 0;
    const attendanceValue = Number(form.attendancePercentage) || 0;
    const homework = Number(form.homeworkCompletionPercentage) || 0;
    const improvement = Number(form.improvementPercentage) || 0;

    const studentName = form.studentName || "The student";
    const weakSubject = form.weakSubject || "weaker subjects";
    const strongSubject = form.strongSubject || "strong subjects";
    const weakChapters = form.weakChapters || "important weak chapters";
    const performanceLabel = getPerformanceLabel(averageScore);

    let teacherRemark = "";

    if (performanceLabel === "outstanding") {
      teacherRemark = `${studentName} has shown outstanding performance with an average score of ${averageScore}%. The student is confident in concepts and should now focus on advanced-level practice, speed building, and maintaining consistency.`;
    } else if (performanceLabel === "excellent") {
      teacherRemark = `${studentName} is performing excellently with an average score of ${averageScore}%. The basics are strong, but regular revision and test analysis are needed to maintain consistency.`;
    } else if (performanceLabel === "good") {
      teacherRemark = `${studentName} has good academic progress with an average score of ${averageScore}%. With focused practice in ${weakSubject}, the student can move to the next performance level.`;
    } else if (performanceLabel === "average") {
      teacherRemark = `${studentName} is currently at an average performance level with ${averageScore}%. The student needs more revision, doubt-solving, and regular practice tests to improve confidence.`;
    } else {
      teacherRemark = `${studentName} needs immediate academic attention. The current average score is ${averageScore}%, so the student should focus on concept clarity, basics, guided revision, and regular monitoring.`;
    }

    const improvementPoints: string[] = [];

    if (accuracy && accuracy < 70) {
      improvementPoints.push(
        `Accuracy is ${accuracy}%, so the student should slow down slightly, read questions carefully, and focus on avoiding careless mistakes.`
      );
    } else if (accuracy && accuracy < 85) {
      improvementPoints.push(
        `Accuracy is ${accuracy}%, which is decent, but mistake analysis after every test will help improve performance.`
      );
    } else if (accuracy) {
      improvementPoints.push(
        `Accuracy is strong at ${accuracy}%, so the student should maintain this with timed practice.`
      );
    }

    if (homework && homework < 75) {
      improvementPoints.push(
        `Homework completion is ${homework}%, so daily homework discipline needs improvement.`
      );
    } else if (homework) {
      improvementPoints.push(
        `Homework completion is ${homework}%, which shows good learning discipline.`
      );
    }

    if (attendanceValue && attendanceValue < 85) {
      improvementPoints.push(
        `Attendance is ${attendanceValue}%, so regular class attendance should be improved for better continuity.`
      );
    } else if (attendanceValue) {
      improvementPoints.push(
        `Attendance is ${attendanceValue}%, which supports consistent academic progress.`
      );
    }

    if (improvement > 0) {
      improvementPoints.push(
        `The student has improved by ${improvement}%, which is a positive sign. The same routine should continue with weekly targets.`
      );
    } else if (improvement < 0) {
      improvementPoints.push(
        `Performance has dropped by ${Math.abs(
          improvement
        )}%, so the student needs extra revision and monitoring this week.`
      );
    } else {
      improvementPoints.push(
        `Improvement is stable, so the student should set weekly targets to create visible progress.`
      );
    }

    const improvementSuggestion = improvementPoints.join(" ");

    const studyRecommendation = `${studentName} should revise ${weakSubject} regularly, especially ${weakChapters}. A weekly plan should include concept revision, chapter-wise practice, timed tests, and mistake review. ${strongSubject} should be maintained through regular practice so the existing strength is not lost.`;

    const smartRecommendation = `Based on the report data, ${studentName} should follow a personalized improvement plan. Priority should be given to ${weakSubject} and topics like ${weakChapters}. The student should complete daily practice, attend classes regularly, and attempt short mock tests every week. Performance should be reviewed using accuracy, homework completion, attendance, improvement percentage, and marks trend. If this routine is followed consistently, the student can improve steadily in the next report cycle.`;

    const updatedSubjects = subjects.map((item) => {
      const score = Number(item.score) || 0;

      if (!item.subject && !item.score) {
        return item;
      }

      let feedback = "";

      if (score >= Number(heuristics.excellent)) {
        feedback = `${item.subject} performance is strong at ${score}%. Continue advanced practice, timed tests, and regular revision to maintain this score.`;
      } else if (score >= Number(heuristics.good)) {
        feedback = `${item.subject} performance is good at ${score}%. More timed practice and revision can help push this subject into the excellent range.`;
      } else if (score >= Number(heuristics.average)) {
        feedback = `${item.subject} is at an average level with ${score}%. The student should revise concepts, solve chapter-wise questions, and maintain a mistake notebook.`;
      } else {
        feedback = `${item.subject} needs focused attention. The score is ${score}%, so basics, formulas, and previous mistakes should be revised carefully with teacher support.`;
      }

      return {
        ...item,
        feedback,
      };
    });

    setSubjects(updatedSubjects);

    setForm((current) => ({
      ...current,
      teacherRemark,
      improvementSuggestion,
      studyRecommendation,
      smartRecommendation,
    }));
  }

  function updateSubject(index: number, field: keyof SubjectRow, value: string) {
    setSubjects((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addSubject() {
    setSubjects((current) => [
      ...current,
      {
        subject: "",
        score: "",
        feedback: "",
      },
    ]);
  }

  function removeSubject(index: number) {
    setSubjects((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function updateTrend(index: number, field: keyof TrendRow, value: string) {
    setTrend((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addTrendPoint() {
    setTrend((current) => [...current, { date: "", score: "" }]);
  }

  function removeTrendPoint(index: number) {
    setTrend((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function updateAttendance(
    index: number,
    field: keyof AttendanceRow,
    value: string | boolean
  ) {
    setAttendance((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addAttendanceDay() {
    setAttendance((current) => [...current, { date: "", present: true }]);
  }

  function removeAttendanceDay(index: number) {
    setAttendance((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const reportPayload = {
      reportType: form.reportType,
      
      status: form.status,

      heuristics: {
        outstanding: Number(heuristics.outstanding) || 95,
        excellent: Number(heuristics.excellent) || 85,
        good: Number(heuristics.good) || 70,
        average: Number(heuristics.average) || 50,
        weak: Number(heuristics.weak) || 40,
      },

      student: {
        name: form.studentName,
        classLevel: form.classLevel,
        city: form.city,
        state: form.state,
        batch: form.batch,
        course: form.course,
        parentName: form.parentName,
        parentRelation: form.parentRelation,
        parentContact: form.parentContact,

      },

      metrics: {
        averageScore: Number(form.averageScore) || 0,
        batchRank: Number(form.batchRank) || 0,
        attendancePercentage: Number(form.attendancePercentage) || 0,
        homeworkCompletionPercentage:
          Number(form.homeworkCompletionPercentage) || 0,
        improvementPercentage: Number(form.improvementPercentage) || 0,
        accuracyPercentage: Number(form.accuracyPercentage) || 0,
      },

      subjectWiseMarks: subjects.map((item) => ({
        subject: item.subject,
        score: Number(item.score) || 0,
        feedback: item.feedback,
      })),

      marksTrend: trend.map((item) => ({
        date: item.date,
        score: Number(item.score) || 0,
      })),

      accuracySplit: {
        correct: Number(form.correct) || 0,
        wrong: Number(form.wrong) || 0,
        unattempted: Number(form.unattempted) || 0,
      },

      attendanceGraph: attendance.map((item) => ({
        date: item.date,
        present: item.present,
      })),

      strengthsWeaknesses: {
        strongSubject: form.strongSubject,
        weakSubject: form.weakSubject,
        timeManagement: form.timeManagement,
        weakChapters: form.weakChapters
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },

      suggestions: {
        teacherRemark:
          form.teacherRemark ||
          "The student requires regular academic review and guided preparation.",
        improvementSuggestion:
          form.improvementSuggestion ||
          "Focused revision, homework completion, and test analysis are recommended.",
        studyRecommendation:
          form.studyRecommendation ||
          "The student should follow a structured study plan with revision, practice, and weekly assessments.",
        smartRecommendation:
          form.smartRecommendation ||
          "Based on the student's performance data, focused revision, regular practice, and mock test analysis are recommended for improvement.",
      },
    };

    try {
  const response = await fetch("/api/student-performance/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportPayload),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error("API did not return JSON:", text.slice(0, 500));
    throw new Error(
      "API returned HTML instead of JSON. Check /api/student-performance/reports route."
    );
  }

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to create report.");
  }

  router.push(`/student-performance/report/${result.reportId}`);
} catch (error) {
  console.error(error);
  alert("Failed to create performance report. Check console/server logs.");
} finally {
  setIsSubmitting(false);
}

  return (
    <main className="spr-page">
      <form className="spr-shell" onSubmit={handleSubmit}>
        <div className="spr-report-header">
          <div className="spr-report-logo-wrap">
            <img
              src="/smart-tutors-logo.png"
              alt="Smart Tutors"
              className="spr-report-logo"
            />
          </div>

          <div>
            <p className="spr-report-kicker">Smart Tutors</p>
            <h1>{reportTitle}</h1>
            <p>
              Analytics report with graphs, charts, AI insights and teacher
              feedback
            </p>
          </div>
        </div>

        <div className="spr-top">
          <div>
            <p className="spr-eyebrow">Analytics Hub</p>
            <h1>Report Creator</h1>
            <p>
              Create detailed performance reports for students. On submit, the
              data will save in MongoDB and open the final report.
            </p>
          </div>

          <button
            type="submit"
            className="spr-primary-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Report..." : "Create Performance Report"}
          </button>
        </div>

        <section className="spr-section spr-heuristics-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Performance Cutoffs (%)</h2>
              <p>Define percentage thresholds for color-coded indicators.</p>
            </div>

            <button
              type="button"
              className="spr-small-toggle-btn"
              onClick={() => setShowHeuristics((current) => !current)}
            >
              {showHeuristics ? "Hide Heuristics" : "Configure Heuristics"}
            </button>
          </div>

          {showHeuristics ? (
            <>
              <div className="spr-grid five">
                <Field
                  label="Outstanding"
                  name="outstanding"
                  value={heuristics.outstanding}
                  onChange={updateHeuristic}
                />

                <Field
                  label="Excellent"
                  name="excellent"
                  value={heuristics.excellent}
                  onChange={updateHeuristic}
                />

                <Field
                  label="Good"
                  name="good"
                  value={heuristics.good}
                  onChange={updateHeuristic}
                />

                <Field
                  label="Average"
                  name="average"
                  value={heuristics.average}
                  onChange={updateHeuristic}
                />

                <Field
                  label="Weak"
                  name="weak"
                  value={heuristics.weak}
                  onChange={updateHeuristic}
                />
              </div>

              <button
                type="button"
                className="spr-secondary-btn"
                onClick={saveHeuristics}
              >
                Save Heuristics
              </button>
            </>
          ) : (
            <p className="spr-muted-line">
              Heuristics are hidden. Click Configure Heuristics to edit the
              cutoff values.
            </p>
          )}
        </section>

        <section className="spr-section">
          <h2>Basic Information</h2>

          <div className="spr-grid three">
            <Field
              label="Report Type"
              name="reportType"
              type="select"
              value={form.reportType}
              onChange={updateForm}
              options={[
                { label: "Weekly Report", value: "weekly" },
                { label: "Monthly Report", value: "monthly" },
              ]}
            />

            

            <Field
              label="Status"
              name="status"
              value={form.status}
              onChange={updateForm}
            />

            <Field
              label="Student Name"
              name="studentName"
              value={form.studentName}
              onChange={updateForm}
            />

            <Field
              label="Class"
              name="classLevel"
              value={form.classLevel}
              onChange={updateForm}
            />

          

            <Field
              label="City"
              name="city"
              value={form.city}
              onChange={updateForm}
            />

            <Field
              label="State"
              name="state"
              value={form.state}
              onChange={updateForm}
            />


            <Field
              label="Batch"
              name="batch"
              value={form.batch}
              onChange={updateForm}
            />

            <Field
              label="Course"
              name="course"
              value={form.course}
              onChange={updateForm}
            />

            <Field
              label="Parent Contact"
              name="parentContact"
              value={form.parentContact}
              onChange={updateForm}
            />

            <Field
              label="Parent Name"
              name="parentName"
              value={form.parentName}
              onChange={updateForm}
            />

            <Field
              label="Parent Relation"
              name="parentRelation"
              value={form.parentRelation}
              onChange={updateForm}
            />
          </div>
        </section>

        <section className="spr-section">
          <h2>Performance Metrics</h2>

          <div className="spr-grid three">
            <Field
              label="Average Score (%)"
              name="averageScore"
              value={form.averageScore}
              onChange={updateForm}
            />

            <Field
              label="Batch Rank"
              name="batchRank"
              value={form.batchRank}
              onChange={updateForm}
            />

            <Field
              label="Attendance (%)"
              name="attendancePercentage"
              value={form.attendancePercentage}
              onChange={updateForm}
            />

            <Field
              label="Homework Completion (%)"
              name="homeworkCompletionPercentage"
              value={form.homeworkCompletionPercentage}
              onChange={updateForm}
            />

            <Field
              label="Improvement (%)"
              name="improvementPercentage"
              value={form.improvementPercentage}
              onChange={updateForm}
            />

            <Field
              label="Accuracy (%)"
              name="accuracyPercentage"
              value={form.accuracyPercentage}
              onChange={updateForm}
            />
          </div>
        </section>

        <section className="spr-section">
          <h2>Subject-wise Marks & Feedback</h2>

          <div className="spr-table-list">
            {subjects.map((item, index) => (
              <div className="spr-row-card" key={`subject-row-${index}`}>
                <Field
                  label="Subject"
                  name={`subject-${index}`}
                  value={item.subject}
                  onChange={(_, value) => updateSubject(index, "subject", value)}
                />

                <Field
                  label="Score (%)"
                  name={`score-${index}`}
                  value={item.score}
                  onChange={(_, value) => updateSubject(index, "score", value)}
                />

                <Field
                  label="Teacher Feedback"
                  name={`feedback-${index}`}
                  value={item.feedback}
                  onChange={(_, value) =>
                    updateSubject(index, "feedback", value)
                  }
                />

                <button
                  type="button"
                  className="spr-danger-btn"
                  onClick={() => removeSubject(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="spr-secondary-btn" onClick={addSubject}>
            Add Subject
          </button>
        </section>

        <section className="spr-section">
          <h2>Marks Trend</h2>

          <div className="spr-table-list">
            {trend.map((item, index) => (
              <div className="spr-row-card compact" key={`trend-row-${index}`}>
                <Field
                  label="Date"
                  name={`trend-date-${index}`}
                  value={item.date}
                  onChange={(_, value) => updateTrend(index, "date", value)}
                />

                <Field
                  label="Score"
                  name={`trend-score-${index}`}
                  value={item.score}
                  onChange={(_, value) => updateTrend(index, "score", value)}
                />

                <button
                  type="button"
                  className="spr-danger-btn"
                  onClick={() => removeTrendPoint(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="spr-secondary-btn"
            onClick={addTrendPoint}
          >
            Add Trend Point
          </button>
        </section>

        <section className="spr-section">
          <h2>Accuracy Breakdown</h2>

          <div className="spr-grid three">
            <Field
              label="Correct (%)"
              name="correct"
              value={form.correct}
              onChange={updateForm}
            />

            <Field
              label="Wrong (%)"
              name="wrong"
              value={form.wrong}
              onChange={updateForm}
            />

            <Field
              label="Unattempted (%)"
              name="unattempted"
              value={form.unattempted}
              onChange={updateForm}
            />
          </div>
        </section>

        <section className="spr-section">
          <h2>Attendance Graph</h2>

          <div className="spr-attendance-editor">
            {attendance.map((item, index) => (
              <div className="spr-attendance-card" key={`attendance-${index}`}>
                <input
                  value={item.date}
                  onChange={(event) =>
                    updateAttendance(index, "date", event.target.value)
                  }
                  placeholder="05-15"
                />

                <select
                  value={item.present ? "present" : "absent"}
                  onChange={(event) =>
                    updateAttendance(
                      index,
                      "present",
                      event.target.value === "present"
                    )
                  }
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>

                <button
                  type="button"
                  className="spr-danger-btn"
                  onClick={() => removeAttendanceDay(index)}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="spr-secondary-btn"
            onClick={addAttendanceDay}
          >
            Add Attendance Day
          </button>
        </section>

        <section className="spr-section">
          <h2>Strong & Weak Areas</h2>

          <div className="spr-grid three">
            <Field
              label="Strong Subject"
              name="strongSubject"
              value={form.strongSubject}
              onChange={updateForm}
            />

            <Field
              label="Weak Subject"
              name="weakSubject"
              value={form.weakSubject}
              onChange={updateForm}
            />

            <Field
              label="Time Management"
              name="timeManagement"
              value={form.timeManagement}
              onChange={updateForm}
            />
          </div>

          <Field
            label="Weak Chapters / Topics - comma separated"
            name="weakChapters"
            value={form.weakChapters}
            onChange={updateForm}
          />
        </section>

        <section className="spr-section">
          <h2>Teacher Feedback & Suggestions</h2>

          <button
            type="button"
            className="spr-secondary-btn"
            onClick={generatePersonalizedFeedback}
          >
            Analyze Data & Generate Personalized Feedback
          </button>

          <div className="spr-grid two spr-feedback-grid">
            <Field
              label="Teacher Remark"
              name="teacherRemark"
              value={form.teacherRemark}
              onChange={updateForm}
              textarea
            />

            <Field
              label="Improvement Suggestion"
              name="improvementSuggestion"
              value={form.improvementSuggestion}
              onChange={updateForm}
              textarea
            />

            <Field
              label="Study Recommendation"
              name="studyRecommendation"
              value={form.studyRecommendation}
              onChange={updateForm}
              textarea
            />

            <Field
              label="Smart Recommendation"
              name="smartRecommendation"
              value={form.smartRecommendation}
              onChange={updateForm}
              textarea
            />
          </div>
        </section>

        <button type="submit" className="spr-primary-btn full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Report..." : "Create Performance Report"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  textarea = false,
  type = "text",
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  textarea?: boolean;
  type?: "text" | "select";
  options?: { label: string; value: string }[];
}) {
  return (
    <label className="spr-field">
      <span>{label}</span>

      {type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
        >
          {(options || []).map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          rows={4}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
        />
      )}
    </label>
  );
}
}