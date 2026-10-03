"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import "./student-performance.css";

type SubjectRow = {
  teacherName: string;
  subject: string;
  marks: string;
  outOfMarks: string;
  score: string;
  feedback: string;
};

type HomeworkRow = {
  date: string;
  task: string;
  assigned: string;
  completed: string;
  completion: string;
};

type AttendanceRow = {
  date: string;
  present: boolean;
};

type RegisteredStudent = {
  id: string;
  name: string;
  program: string;

  classLevel: string;
  city: string;
  state: string;
  address: string;
  course: string;

  parentName: string;
  parentRelation: string;
  parentContact: string;

  photo: string;
};

function createEmptySubject(): SubjectRow {
  return {
    teacherName: "",
    subject: "",
    marks: "",
    outOfMarks: "",
    score: "",
    feedback: "",
  };
}

function createEmptyHomework(): HomeworkRow {
  return {
    date: "",
    task: "",
    assigned: "",
    completed: "",
    completion: "",
  };
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function metricText(value: number | null) {
  return value === null ? "" : String(value);
}

export default function ReportCreatorForm() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showHeuristics, setShowHeuristics] = useState(false);

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const [studentEntryMode, setStudentEntryMode] = useState<
    "registered" | "manual"
  >("registered");

  const [registeredStudents, setRegisteredStudents] = useState<
    RegisteredStudent[]
  >([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [previousAverageScore, setPreviousAverageScore] = useState<
    number | null
  >(null);

  const [isLoadingPreviousReport, setIsLoadingPreviousReport] = useState(false);

  const [improvementMessage, setImprovementMessage] = useState(
    "Select a registered student to compare with the previous report.",
  );

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

    academyName: "SmartIQ Institute",

    studentName: "",
    classLevel: "",

    city: "",
    state: "",
    address: "",

    course: "",

    parentName: "",
    parentRelation: "",
    parentContact: "",

    photo: "",

    /*
     * Accuracy source data.
     */
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
    smartStrategy: "",
  });

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(
    null,
  );

  const [subjectDraft, setSubjectDraft] =
    useState<SubjectRow>(createEmptySubject());

  const [homework, setHomework] = useState<HomeworkRow[]>([]);

  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);

  const [editingHomeworkIndex, setEditingHomeworkIndex] = useState<
    number | null
  >(null);

  const [homeworkDraft, setHomeworkDraft] = useState<HomeworkRow>(
    createEmptyHomework(),
  );

  const [attendance, setAttendance] = useState<AttendanceRow[]>([
    {
      date: "",
      present: true,
    },
  ]);

  function updateForm(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /*
   * ==========================================
   * KPI 1
   * AVERAGE SCORE
   *
   * Depends ONLY on Subject-wise Marks.
   *
   * Total obtained marks
   * -------------------- × 100
   * Total out-of marks
   * ==========================================
   */
  const averageScore = useMemo(() => {
    let obtained = 0;

    let maximum = 0;

    for (const item of subjects) {
      const marks = Number(item.marks);

      const outOf = Number(item.outOfMarks);

      if (!Number.isFinite(marks) || !Number.isFinite(outOf) || outOf <= 0) {
        continue;
      }

      obtained += Math.max(0, marks);

      maximum += outOf;
    }

    if (maximum <= 0) {
      return null;
    }

    return roundMetric((obtained / maximum) * 100);
  }, [subjects]);

  /*
   * ==========================================
   * KPI 2
   * HOMEWORK COMPLETION
   *
   * Depends ONLY on Homework table.
   *
   * Total completed
   * --------------- × 100
   * Total assigned
   * ==========================================
   */
  const homeworkCompletionPercentage = useMemo(() => {
    let assigned = 0;

    let completed = 0;

    for (const item of homework) {
      const itemAssigned = Number(item.assigned);

      const itemCompleted = Number(item.completed);

      if (
        !Number.isFinite(itemAssigned) ||
        itemAssigned <= 0 ||
        !Number.isFinite(itemCompleted) ||
        itemCompleted < 0
      ) {
        continue;
      }

      assigned += itemAssigned;

      completed += Math.min(itemCompleted, itemAssigned);
    }

    if (assigned <= 0) {
      return null;
    }

    return roundMetric((completed / assigned) * 100);
  }, [homework]);

  /*
   * ==========================================
   * KPI 3
   * ATTENDANCE
   *
   * Depends ONLY on Attendance section.
   *
   * Present dated rows
   * ------------------ × 100
   * All dated rows
   * ==========================================
   */
  const attendancePercentage = useMemo(() => {
    const validRows = attendance.filter((item) => item.date.trim());

    if (!validRows.length) {
      return null;
    }

    const present = validRows.filter((item) => item.present).length;

    return roundMetric((present / validRows.length) * 100);
  }, [attendance]);

  /*
   * ==========================================
   * KPI 4
   * ACCURACY
   *
   * Correct
   * ---------------- × 100
   * Correct + Wrong
   *
   * Unattempted does NOT reduce accuracy.
   * ==========================================
   */
  const accuracyPercentage = useMemo(() => {
    const correct = Number(form.correct);

    const wrong = Number(form.wrong);

    const safeCorrect = Number.isFinite(correct) && correct >= 0 ? correct : 0;

    const safeWrong = Number.isFinite(wrong) && wrong >= 0 ? wrong : 0;

    const attempted = safeCorrect + safeWrong;

    if (attempted <= 0) {
      return null;
    }

    return roundMetric((safeCorrect / attempted) * 100);
  }, [form.correct, form.wrong]);

  /*
   * ==========================================
   * KPI 5
   * IMPROVEMENT
   *
   * Current Average Score
   * -
   * Previous same-type report Average Score
   *
   * Weekly → previous weekly
   * Monthly → previous monthly
   * ==========================================
   */
  const improvementPercentage = useMemo(() => {
    if (averageScore === null || previousAverageScore === null) {
      return null;
    }

    return roundMetric(averageScore - previousAverageScore);
  }, [averageScore, previousAverageScore]);

  /*
   * ==========================================
   * LOAD REGISTERED STUDENTS
   * ==========================================
   */
  useEffect(() => {
    async function loadRegisteredStudents() {
      setIsLoadingStudents(true);

      try {
        const response = await fetch(
          "/api/student-performance/registered-students",
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setRegisteredStudents(result.students || []);
        }
      } catch (error) {
        console.error("Failed to load registered students:", error);
      } finally {
        setIsLoadingStudents(false);
      }
    }

    void loadRegisteredStudents();
  }, []);

  /*
   * ==========================================
   * LOAD PREVIOUS PERFORMANCE REPORT
   *
   * This API is used ONLY for Improvement.
   * It does not control the other KPIs.
   * ==========================================
   */
  useEffect(() => {
    if (studentEntryMode !== "registered" || !selectedStudentId) {
      setPreviousAverageScore(null);

      setImprovementMessage(
        studentEntryMode === "manual"
          ? "Improvement comparison is available for linked registered students."
          : "Select a registered student to compare with the previous report.",
      );

      return;
    }

    const controller = new AbortController();

    async function loadPreviousReport() {
      setIsLoadingPreviousReport(true);

      setPreviousAverageScore(null);

      setImprovementMessage("Checking previous report...");

      try {
        const params = new URLSearchParams({
          studentId: selectedStudentId,

          reportType: form.reportType,
        });

        const response = await fetch(
          `/api/student-performance/previous-report?${params.toString()}`,
          {
            cache: "no-store",

            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load previous report.");
        }

        if (
          result.found === true &&
          typeof result.previousAverageScore === "number" &&
          Number.isFinite(result.previousAverageScore)
        ) {
          setPreviousAverageScore(result.previousAverageScore);

          setImprovementMessage(
            `Compared with previous ${form.reportType} report: ${result.previousAverageScore}%.`,
          );
        } else {
          setPreviousAverageScore(null);

          setImprovementMessage(
            `No previous ${form.reportType} report found. This will be the baseline report.`,
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Previous report error:", error);

        setPreviousAverageScore(null);

        setImprovementMessage("Unable to load previous performance data.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreviousReport(false);
        }
      }
    }

    void loadPreviousReport();

    return () => {
      controller.abort();
    };
  }, [selectedStudentId, studentEntryMode, form.reportType]);

  /*
   * ==========================================
   * STUDENT SELECTION
   * ==========================================
   */
  function selectRegisteredStudent(studentId: string) {
    setSelectedStudentId(studentId);

    if (!studentId) {
      setForm((current) => ({
        ...current,

        studentName: "",

        classLevel: "",

        city: "",

        state: "",

        address: "",

        course: "",

        parentName: "",

        parentRelation: "",

        parentContact: "",

        photo: "",
      }));

      setPreviousAverageScore(null);

      return;
    }

    const selectedStudent = registeredStudents.find(
      (student) => student.id === studentId,
    );

    if (!selectedStudent) {
      return;
    }

    setForm((current) => ({
      ...current,

      studentName: selectedStudent.name || "",

      classLevel: selectedStudent.classLevel || "",

      city: selectedStudent.city || "",

      state: selectedStudent.state || "",

      address: selectedStudent.address || "",

      course: selectedStudent.course || selectedStudent.program || "",

      parentName: selectedStudent.parentName || "",

      parentRelation: selectedStudent.parentRelation || "",

      parentContact: selectedStudent.parentContact || "",

      photo: selectedStudent.photo || "",
    }));
  }

  /*
   * ==========================================
   * PHOTO
   * ==========================================
   */
  async function handleStudentPhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validType =
      ["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      /\.(png|jpg|jpeg|webp)$/i.test(file.name);

    if (!validType) {
      alert("Only PNG, JPG and WEBP images are allowed.");

      event.target.value = "";

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Student photo must be smaller than 2 MB.");

      event.target.value = "";

      return;
    }

    setIsPhotoUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/student-performance/upload-photo", {
        method: "POST",

        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload student photo.");
      }

      updateForm("photo", result.url);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload student photo.",
      );
    } finally {
      setIsPhotoUploading(false);
    }
  }

  /*
   * ==========================================
   * HEURISTICS
   * ==========================================
   */
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
    if (score >= Number(heuristics.outstanding)) {
      return "outstanding";
    }

    if (score >= Number(heuristics.excellent)) {
      return "excellent";
    }

    if (score >= Number(heuristics.good)) {
      return "good";
    }

    if (score >= Number(heuristics.average)) {
      return "average";
    }

    return "weak";
  }

  /*
   * ==========================================
   * SUBJECT POPUP
   * ==========================================
   */
  function openAddSubject() {
    setEditingSubjectIndex(null);

    setSubjectDraft(createEmptySubject());

    setIsSubjectModalOpen(true);
  }

  function openEditSubject(index: number) {
    const item = subjects[index];

    if (!item) {
      return;
    }

    setEditingSubjectIndex(index);

    setSubjectDraft({
      ...createEmptySubject(),
      ...item,
    });

    setIsSubjectModalOpen(true);
  }

  function closeSubjectModal() {
    setIsSubjectModalOpen(false);

    setEditingSubjectIndex(null);

    setSubjectDraft(createEmptySubject());
  }

  function updateSubjectDraft(
    field: keyof SubjectRow,

    value: string,
  ) {
    setSubjectDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveSubjectDetails() {
    const teacherName = subjectDraft.teacherName.trim();

    const subject = subjectDraft.subject.trim();

    const marks = Number(subjectDraft.marks);

    const outOfMarks = Number(subjectDraft.outOfMarks);

    if (!teacherName) {
      alert("Please enter the teacher's name.");

      return;
    }

    if (!subject) {
      alert("Please enter the subject.");

      return;
    }

    if (!Number.isFinite(marks) || marks < 0) {
      alert("Please enter valid marks.");

      return;
    }

    if (!Number.isFinite(outOfMarks) || outOfMarks <= 0) {
      alert("Out Of Marks must be greater than 0.");

      return;
    }

    if (marks > outOfMarks) {
      alert("Marks cannot be greater than Out Of Marks.");

      return;
    }

    const score = roundMetric((marks / outOfMarks) * 100);

    const nextSubject: SubjectRow = {
      teacherName,

      subject,

      marks: String(marks),

      outOfMarks: String(outOfMarks),

      score: String(score),

      feedback: subjectDraft.feedback.trim(),
    };

    if (editingSubjectIndex === null) {
      setSubjects((current) => [...current, nextSubject]);
    } else {
      setSubjects((current) =>
        current.map((item, index) =>
          index === editingSubjectIndex ? nextSubject : item,
        ),
      );
    }

    closeSubjectModal();
  }

  function removeSubject(index: number) {
    setSubjects((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  /*
   * ==========================================
   * HOMEWORK POPUP
   * ==========================================
   */
  function openAddHomework() {
    setEditingHomeworkIndex(null);

    setHomeworkDraft(createEmptyHomework());

    setIsHomeworkModalOpen(true);
  }

  function openEditHomework(index: number) {
    const item = homework[index];

    if (!item) {
      return;
    }

    setEditingHomeworkIndex(index);

    setHomeworkDraft({
      ...createEmptyHomework(),
      ...item,
    });

    setIsHomeworkModalOpen(true);
  }

  function closeHomeworkModal() {
    setIsHomeworkModalOpen(false);

    setEditingHomeworkIndex(null);

    setHomeworkDraft(createEmptyHomework());
  }

  function updateHomeworkDraft(
    field: keyof HomeworkRow,

    value: string,
  ) {
    setHomeworkDraft((current) => ({
      ...current,

      [field]: value,
    }));
  }

  function saveHomeworkDetails() {
    const date = homeworkDraft.date.trim();

    const task = homeworkDraft.task.trim();

    const assigned = Number(homeworkDraft.assigned);

    const completed = Number(homeworkDraft.completed);

    if (!date) {
      alert("Please select the homework date.");

      return;
    }

    if (!task) {
      alert("Please enter the homework or task.");

      return;
    }

    if (!Number.isFinite(assigned) || assigned <= 0) {
      alert("Total Assigned must be greater than 0.");

      return;
    }

    if (!Number.isFinite(completed) || completed < 0) {
      alert("Please enter a valid Completed value.");

      return;
    }

    if (completed > assigned) {
      alert("Completed cannot be greater than Assigned.");

      return;
    }

    const completion = roundMetric((completed / assigned) * 100);

    const nextHomework: HomeworkRow = {
      date,

      task,

      assigned: String(assigned),

      completed: String(completed),

      completion: String(completion),
    };

    if (editingHomeworkIndex === null) {
      setHomework((current) => [...current, nextHomework]);
    } else {
      setHomework((current) =>
        current.map((item, index) =>
          index === editingHomeworkIndex ? nextHomework : item,
        ),
      );
    }

    closeHomeworkModal();
  }

  function removeHomework(index: number) {
    setHomework((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  /*
   * ==========================================
   * ATTENDANCE
   * ==========================================
   */
  function updateAttendance(
    index: number,

    field: keyof AttendanceRow,

    value: string | boolean,
  ) {
    setAttendance((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addAttendanceDay() {
    setAttendance((current) => [
      ...current,

      {
        date: "",

        present: true,
      },
    ]);
  }

  function removeAttendanceDay(index: number) {
    setAttendance((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  /*
   * ==========================================
   * AUTOMATIC PERSONALIZED FEEDBACK
   * ==========================================
   */
  function generatePersonalizedFeedback() {
    const score = averageScore ?? 0;

    const accuracy = accuracyPercentage ?? 0;

    const attendanceValue = attendancePercentage ?? 0;

    const homeworkValue = homeworkCompletionPercentage ?? 0;

    const improvement = improvementPercentage;

    const studentName = form.studentName || "The student";

    const weakSubject = form.weakSubject || "weaker subjects";

    const strongSubject = form.strongSubject || "strong subjects";

    const weakChapters = form.weakChapters || "important weak chapters";

    const performanceLabel = getPerformanceLabel(score);

    let teacherRemark = "";

    if (performanceLabel === "outstanding") {
      teacherRemark = `${studentName} has shown outstanding performance with an average score of ${score}%. The student should continue advanced practice and maintain consistency.`;
    } else if (performanceLabel === "excellent") {
      teacherRemark = `${studentName} is performing excellently with an average score of ${score}%. Regular revision and test analysis should continue.`;
    } else if (performanceLabel === "good") {
      teacherRemark = `${studentName} has good academic progress with an average score of ${score}%. Focused practice in ${weakSubject} can help improve further.`;
    } else if (performanceLabel === "average") {
      teacherRemark = `${studentName} is currently at an average performance level with ${score}%. More revision and guided practice are recommended.`;
    } else {
      teacherRemark = `${studentName} needs additional academic attention. The current average score is ${score}%, so concept clarity and guided revision should be prioritised.`;
    }

    const points: string[] = [];

    if (accuracyPercentage !== null) {
      if (accuracy < 70) {
        points.push(
          `Accuracy is ${accuracy}%. The student should focus on reducing incorrect answers and carefully reviewing mistakes.`,
        );
      } else if (accuracy < 85) {
        points.push(
          `Accuracy is ${accuracy}%. Regular mistake analysis can improve this further.`,
        );
      } else {
        points.push(`Accuracy is strong at ${accuracy}%.`);
      }
    }

    if (homeworkCompletionPercentage !== null) {
      if (homeworkValue < 75) {
        points.push(
          `Homework completion is ${homeworkValue}%, so homework discipline needs improvement.`,
        );
      } else {
        points.push(
          `Homework completion is ${homeworkValue}%, showing good learning discipline.`,
        );
      }
    }

    if (attendancePercentage !== null) {
      if (attendanceValue < 85) {
        points.push(
          `Attendance is ${attendanceValue}%, so regular attendance should be improved.`,
        );
      } else {
        points.push(
          `Attendance is ${attendanceValue}%, supporting consistent academic progress.`,
        );
      }
    }

    if (improvement !== null) {
      if (improvement > 0) {
        points.push(
          `The student's average score improved by ${improvement} percentage points compared with the previous ${form.reportType} report.`,
        );
      } else if (improvement < 0) {
        points.push(
          `The student's average score decreased by ${Math.abs(
            improvement,
          )} percentage points compared with the previous ${form.reportType} report.`,
        );
      } else {
        points.push(
          `The average score is unchanged from the previous ${form.reportType} report.`,
        );
      }
    } else {
      points.push(
        "No previous comparable report is available yet, so this report will serve as the performance baseline.",
      );
    }

    const improvementSuggestion = points.join(" ");

    const studyRecommendation = `${studentName} should revise ${weakSubject} regularly, especially ${weakChapters}. The study plan should include concept revision, homework completion, chapter-wise practice and mistake review. ${strongSubject} should continue to be practised to maintain the student's strengths.`;

    const smartStrategy = `Based on the current report, ${studentName} should prioritise ${weakSubject}, complete homework consistently, maintain attendance and review incorrect test answers. Future ${form.reportType} reports can then measure improvement against this performance.`;

    const updatedSubjects = subjects.map((item) => {
      if (item.feedback.trim()) {
        return item;
      }

      const subjectScore = Number(item.score) || 0;

      let feedback = "";

      if (subjectScore >= Number(heuristics.excellent)) {
        feedback = `${item.subject} performance is strong at ${subjectScore}%. Continue advanced practice and regular revision.`;
      } else if (subjectScore >= Number(heuristics.good)) {
        feedback = `${item.subject} performance is good at ${subjectScore}%. More practice can improve this further.`;
      } else if (subjectScore >= Number(heuristics.average)) {
        feedback = `${item.subject} is currently at ${subjectScore}%. Concept revision and chapter-wise practice are recommended.`;
      } else {
        feedback = `${item.subject} needs focused attention. Basics and previous mistakes should be reviewed with teacher support.`;
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

      smartStrategy,
    }));
  }

  /*
   * ==========================================
   * SAVE REPORT
   * ==========================================
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const periodLabel =
      form.reportType === "monthly"
        ? "Monthly Student Performance Report"
        : "Weekly Student Performance Report";

    if (studentEntryMode === "registered" && !selectedStudentId) {
      alert(
        "Please select a registered student or switch to manual report mode.",
      );

      return;
    }

    setIsSubmitting(true);

    const reportPayload = {
      reportType: form.reportType,

      period: periodLabel,

      title: periodLabel,

      periodLabel,

      linkedStudentId:
        studentEntryMode === "registered" ? selectedStudentId : null,

      status: form.status,

      academyName: form.academyName || "SmartIQ Institute",

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

        address: form.address,

        course: form.course,

        parentName: form.parentName,

        parentRelation: form.parentRelation,

        parentContact: form.parentContact,

        photo: form.photo,
      },

      /*
       * These are all derived values.
       * Nobody types these manually.
       */
      metrics: {
        averageScore: averageScore ?? 0,

        attendancePercentage: attendancePercentage ?? 0,

        homeworkCompletionPercentage: homeworkCompletionPercentage ?? 0,

        improvementPercentage: improvementPercentage ?? 0,

        improvementAvailable: improvementPercentage !== null,

        previousAverageScore,

        accuracyPercentage: accuracyPercentage ?? 0,
      },

      subjectWiseMarks: subjects.map((item) => ({
        teacherName: item.teacherName,

        subject: item.subject,

        marks: Number(item.marks) || 0,

        outOfMarks: Number(item.outOfMarks) || 0,

        score: Number(item.score) || 0,

        feedback: item.feedback,
      })),

      homeworkCompletion: homework.map((item) => ({
        date: item.date,

        task: item.task,

        assigned: Number(item.assigned) || 0,

        completed: Number(item.completed) || 0,

        completion: Number(item.completion) || 0,
      })),

      accuracySplit: {
        correct: Number(form.correct) || 0,

        wrong: Number(form.wrong) || 0,

        unattempted: Number(form.unattempted) || 0,
      },

      attendanceGraph: attendance
        .filter((item) => item.date.trim())
        .map((item) => ({
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
          "Focused revision, homework completion, attendance and test analysis are recommended.",

        studyRecommendation:
          form.studyRecommendation ||
          "The student should follow a structured study plan with revision, practice and regular assessments.",

        smartStrategy:
          form.smartStrategy ||
          "Use the student's marks, homework completion, attendance and test accuracy to guide the next improvement cycle.",
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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create report.");
      }

      router.push(`/student-performance/report/${result.reportId}`);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create performance report.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="spr-page">
      <form className="spr-shell" onSubmit={handleSubmit}>
        <div className="spr-top">
          <div>
            <p className="spr-eyebrow">Analytics Hub</p>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",

                lineHeight: "1.05",
              }}
            >
              Report Creator
            </h1>

            <p>
              Enter the detailed performance data. SmartIQ calculates the
              performance KPIs automatically.
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

        {/* PERFORMANCE CUTOFFS */}

        <section className="spr-section spr-heuristics-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Performance Cutoffs (%)</h2>

              <p>
                Define the percentage thresholds used for performance colours
                and feedback.
              </p>
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
              Heuristics are hidden. Click Configure Heuristics to edit them.
            </p>
          )}
        </section>

        {/* STUDENT ACCOUNT */}

        <section className="spr-section">
          <h2>Student Account Link</h2>

          <div className="spr-grid two">
            <label className="spr-field">
              <span>Student Type</span>

              <select
                value={studentEntryMode}
                onChange={(event) => {
                  const nextMode = event.target.value as
                    | "registered"
                    | "manual";

                  setStudentEntryMode(nextMode);

                  if (nextMode === "manual") {
                    selectRegisteredStudent("");
                  }
                }}
              >
                <option value="registered">
                  Select a SmartIQ Institute Student
                </option>

                <option value="manual">Create Report Manually</option>
              </select>
            </label>

            {studentEntryMode === "registered" ? (
              <label className="spr-field">
                <span>Registered Student</span>

                <select
                  value={selectedStudentId}
                  disabled={isLoadingStudents}
                  onChange={(event) =>
                    selectRegisteredStudent(event.target.value)
                  }
                >
                  <option value="">
                    {isLoadingStudents
                      ? "Loading students..."
                      : "Select a registered student"}
                  </option>

                  {registeredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                      {" — "}
                      {student.program}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="spr-muted-line">
                This will be a standalone performance report.
              </p>
            )}
          </div>
        </section>

        {/* BASIC INFORMATION */}

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
                {
                  label: "Weekly Report",

                  value: "weekly",
                },

                {
                  label: "Monthly Report",

                  value: "monthly",
                },
              ]}
            />

            <Field
              label="Status"
              name="status"
              value={form.status}
              onChange={updateForm}
            />

            <Field
              label="Academy / Institute Name"
              name="academyName"
              value={form.academyName}
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
              label="Address"
              name="address"
              value={form.address}
              onChange={updateForm}
              textarea
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

            <div className="spr-field spr-photo-upload-field">
              <span>Student Photo</span>

              <label className="spr-photo-upload-button">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={handleStudentPhotoUpload}
                  disabled={isPhotoUploading}
                />

                {isPhotoUploading
                  ? "Uploading Photo..."
                  : "Upload Student Photo"}
              </label>

              {form.photo ? (
                <div className="spr-photo-preview">
                  <img src={form.photo} alt="Student preview" />

                  <button
                    type="button"
                    className="spr-remove-photo-btn"
                    onClick={() => updateForm("photo", "")}
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <p className="spr-muted-line">No student photo uploaded.</p>
              )}
            </div>
          </div>
        </section>

        {/* KPI SECTION */}

        <section className="spr-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Performance Metrics</h2>

              <p>
                These KPIs are calculated automatically from the detailed
                sections below.
              </p>
            </div>

            <span
              style={{
                border: "1px solid rgba(96,165,250,.3)",

                background: "rgba(37,99,235,.12)",

                color: "#bfdbfe",

                borderRadius: "999px",

                padding: "9px 14px",

                fontSize: "12px",

                fontWeight: 900,
              }}
            >
              Auto Calculated
            </span>
          </div>

          <div className="spr-grid three">
            <Field
              label="Average Score (%)"
              name="averageScore"
              value={metricText(averageScore)}
              onChange={() => {}}
              readOnly
            />

            <Field
              label="Attendance (%)"
              name="attendancePercentage"
              value={metricText(attendancePercentage)}
              onChange={() => {}}
              readOnly
            />

            <Field
              label="Homework Completion (%)"
              name="homeworkCompletionPercentage"
              value={metricText(homeworkCompletionPercentage)}
              onChange={() => {}}
              readOnly
            />

            <Field
              label="Improvement (%)"
              name="improvementPercentage"
              value={metricText(improvementPercentage)}
              onChange={() => {}}
              readOnly
            />

            <Field
              label="Accuracy (%)"
              name="accuracyPercentage"
              value={metricText(accuracyPercentage)}
              onChange={() => {}}
              readOnly
            />
          </div>

          <div
            style={{
              marginTop: "16px",

              color: "#94a3b8",

              fontSize: "12px",

              fontWeight: 700,

              lineHeight: 1.9,
            }}
          >
          </div>
        </section>

        {/* SUBJECTS */}

        <section className="spr-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Subject-wise Marks & Feedback</h2>

              <p>The Average Score KPI is calculated from these marks.</p>
            </div>

            <button
              type="button"
              className="spr-secondary-btn"
              style={{
                marginTop: 0,
              }}
              onClick={openAddSubject}
            >
              + Add Subject
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-950/20">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr className="bg-slate-800/90 text-left">
                  {[
                    "Teacher Name",
                    "Subject",
                    "Marks",
                    "Out Of",
                    "Feedback",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-blue-300"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {subjects.length ? (
                  subjects.map((item, index) => (
                    <tr
                      key={`subject-${index}`}
                      className="cursor-pointer border-t border-slate-700/60 hover:bg-blue-500/10"
                      onClick={() => openEditSubject(index)}
                    >
                      <td className="px-4 py-4 font-black text-white">
                        {item.teacherName}
                      </td>

                      <td className="px-4 py-4 font-black text-white">
                        {item.subject}
                      </td>

                      <td className="px-4 py-4 text-slate-200">{item.marks}</td>

                      <td className="px-4 py-4 text-slate-200">
                        {item.outOfMarks}
                      </td>

                      <td className="max-w-[320px] px-4 py-4 text-slate-300">
                        {item.feedback
                          ? item.feedback.length > 70
                            ? `${item.feedback.slice(0, 70)}…`
                            : item.feedback
                          : "No feedback added"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-200"
                            onClick={(event) => {
                              event.stopPropagation();

                              openEditSubject(index);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200"
                            onClick={(event) => {
                              event.stopPropagation();

                              removeSubject(index);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center font-bold text-slate-400"
                    >
                      No subject records added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* HOMEWORK */}

        <section className="spr-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Homework Completion</h2>

              <p>The Homework Completion KPI depends only on this table.</p>
            </div>

            <button
              type="button"
              className="spr-secondary-btn"
              style={{
                marginTop: 0,
              }}
              onClick={openAddHomework}
            >
              + Add Homework
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-950/20">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-slate-800/90 text-left">
                  {[
                    "Date",
                    "Homework / Task",
                    "Assigned",
                    "Completed",
                    "Completion",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-blue-300"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {homework.length ? (
                  homework.map((item, index) => (
                    <tr
                      key={`homework-${index}`}
                      className="cursor-pointer border-t border-slate-700/60 hover:bg-blue-500/10"
                      onClick={() => openEditHomework(index)}
                    >
                      <td className="px-4 py-4 text-slate-200">{item.date}</td>

                      <td className="px-4 py-4 font-black text-white">
                        {item.task}
                      </td>

                      <td className="px-4 py-4 text-slate-200">
                        {item.assigned}
                      </td>

                      <td className="px-4 py-4 text-slate-200">
                        {item.completed}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-500/15 px-3 py-2 text-sm font-black text-blue-200">
                          {item.completion}%
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-2 text-xs font-black text-blue-200"
                            onClick={(event) => {
                              event.stopPropagation();

                              openEditHomework(index);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200"
                            onClick={(event) => {
                              event.stopPropagation();

                              removeHomework(index);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center font-bold text-slate-400"
                    >
                      No homework records added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="rounded-2xl border border-blue-400/25 bg-blue-500/10 px-5 py-4">
              <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                Overall Homework Completion
              </span>

              <strong className="ml-4 text-xl font-black text-white">
                {homeworkCompletionPercentage ?? 0}%
              </strong>
            </div>
          </div>
        </section>

        {/* TEST ANSWERS */}

        <section className="spr-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Test Answer Analysis</h2>

              <p>
                Accuracy depends only on correct and wrong answers. Unattempted
                questions are shown separately.
              </p>
            </div>

            <span
              style={{
                border: "1px solid rgba(96,165,250,.3)",

                background: "rgba(37,99,235,.12)",

                color: "#bfdbfe",

                borderRadius: "999px",

                padding: "9px 14px",

                fontWeight: 900,
              }}
            >
              Accuracy: {accuracyPercentage ?? 0}%
            </span>
          </div>

          <div className="spr-grid three">
            <Field
              label="Correct Answers"
              name="correct"
              value={form.correct}
              onChange={updateForm}
            />

            <Field
              label="Wrong Answers"
              name="wrong"
              value={form.wrong}
              onChange={updateForm}
            />

            <Field
              label="Unattempted"
              name="unattempted"
              value={form.unattempted}
              onChange={updateForm}
            />
          </div>
        </section>

        {/* ATTENDANCE */}

        <section className="spr-section">
          <div className="spr-section-title-row">
            <div>
              <h2>Attendance</h2>

              <p>
                The Attendance KPI depends only on these dated attendance
                entries.
              </p>
            </div>

            <span
              style={{
                border: "1px solid rgba(96,165,250,.3)",

                background: "rgba(37,99,235,.12)",

                color: "#bfdbfe",

                borderRadius: "999px",

                padding: "9px 14px",

                fontWeight: 900,
              }}
            >
              Attendance: {attendancePercentage ?? 0}%
            </span>
          </div>

          <div className="spr-attendance-editor">
            {attendance.map((item, index) => (
              <div className="spr-attendance-card" key={`attendance-${index}`}>
                <input
                  type="date"
                  value={item.date}
                  onChange={(event) =>
                    updateAttendance(index, "date", event.target.value)
                  }
                />

                <select
                  value={item.present ? "present" : "absent"}
                  onChange={(event) =>
                    updateAttendance(
                      index,
                      "present",
                      event.target.value === "present",
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

        {/* STRONG / WEAK */}

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

        {/* FEEDBACK */}

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
              label="Smart Strategy"
              name="smartStrategy"
              value={form.smartStrategy}
              onChange={updateForm}
              textarea
            />
          </div>
        </section>

        {/* SUBJECT POPUP */}

        {isSubjectModalOpen ? (
          <ModalShell onClose={closeSubjectModal}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">
                  Subject Details
                </p>

                <h3 className="mt-2 text-2xl font-black text-white">
                  {editingSubjectIndex === null
                    ? "Add Subject Record"
                    : "Edit Subject Record"}
                </h3>
              </div>

              <CloseButton onClick={closeSubjectModal} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PopupField
                label="Teacher Name *"
                value={subjectDraft.teacherName}
                onChange={(value) => updateSubjectDraft("teacherName", value)}
              />

              <PopupField
                label="Subject *"
                value={subjectDraft.subject}
                onChange={(value) => updateSubjectDraft("subject", value)}
              />

              <PopupField
                label="Marks Obtained *"
                type="number"
                value={subjectDraft.marks}
                onChange={(value) => updateSubjectDraft("marks", value)}
              />

              <PopupField
                label="Out Of Marks *"
                type="number"
                value={subjectDraft.outOfMarks}
                onChange={(value) => updateSubjectDraft("outOfMarks", value)}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-3">
              <span className="text-sm font-bold text-blue-200">
                Calculated Percentage
              </span>

              <strong className="float-right text-xl font-black text-white">
                {calculatePercentage(
                  subjectDraft.marks,
                  subjectDraft.outOfMarks,
                )}
              </strong>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-xs font-black uppercase text-slate-400">
                Teacher Feedback
              </span>

              <textarea
                rows={5}
                value={subjectDraft.feedback}
                onChange={(event) =>
                  updateSubjectDraft("feedback", event.target.value)
                }
                className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
              />
            </label>

            <PopupActions
              onCancel={closeSubjectModal}
              onSave={saveSubjectDetails}
              saveLabel={
                editingSubjectIndex === null ? "Add Subject" : "Save Changes"
              }
            />
          </ModalShell>
        ) : null}

        {/* HOMEWORK POPUP */}

        {isHomeworkModalOpen ? (
          <ModalShell onClose={closeHomeworkModal}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">
                  Homework Details
                </p>

                <h3 className="mt-2 text-2xl font-black text-white">
                  {editingHomeworkIndex === null
                    ? "Add Homework Record"
                    : "Edit Homework Record"}
                </h3>
              </div>

              <CloseButton onClick={closeHomeworkModal} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PopupField
                label="Date *"
                type="date"
                value={homeworkDraft.date}
                onChange={(value) => updateHomeworkDraft("date", value)}
              />

              <PopupField
                label="Homework / Task *"
                value={homeworkDraft.task}
                onChange={(value) => updateHomeworkDraft("task", value)}
              />

              <PopupField
                label="Total Assigned *"
                type="number"
                value={homeworkDraft.assigned}
                onChange={(value) => updateHomeworkDraft("assigned", value)}
              />

              <PopupField
                label="Completed *"
                type="number"
                value={homeworkDraft.completed}
                onChange={(value) => updateHomeworkDraft("completed", value)}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-3">
              <span className="text-sm font-bold text-blue-200">
                Completion
              </span>

              <strong className="float-right text-xl font-black text-white">
                {calculatePercentage(
                  homeworkDraft.completed,
                  homeworkDraft.assigned,
                )}
              </strong>
            </div>

            <PopupActions
              onCancel={closeHomeworkModal}
              onSave={saveHomeworkDetails}
              saveLabel={
                editingHomeworkIndex === null ? "Add Homework" : "Save Changes"
              }
            />
          </ModalShell>
        ) : null}

        <button
          type="submit"
          className="spr-primary-btn full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Report..." : "Create Performance Report"}
        </button>
      </form>
    </main>
  );
}

function calculatePercentage(
  numerator: string,

  denominator: string,
) {
  const first = Number(numerator);

  const second = Number(denominator);

  if (!Number.isFinite(first) || !Number.isFinite(second) || second <= 0) {
    return "—";
  }

  return `${roundMetric((first / second) * 100)}%`;
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;

  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 bg-slate-800 text-2xl text-slate-300"
      onClick={onClick}
    >
      ×
    </button>
  );
}

function PopupField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;

  value: string;

  onChange: (value: string) => void;

  type?: "text" | "number" | "date";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-[16px] font-bold text-white outline-none focus:border-blue-400"
      />
    </label>
  );
}

function PopupActions({
  onCancel,
  onSave,
  saveLabel,
}: {
  onCancel: () => void;

  onSave: () => void;

  saveLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        className="rounded-full border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-black text-slate-200"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        type="button"
        className="rounded-full bg-gradient-to-r from-blue-600 to-blue-400 px-5 py-3 text-sm font-black text-white"
        onClick={onSave}
      >
        {saveLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  textarea = false,
  readOnly = false,
  type = "text",
  options,
}: {
  label: string;

  name: string;

  value: string;

  onChange: (
    name: string,

    value: string,
  ) => void;

  textarea?: boolean;

  readOnly?: boolean;

  type?: "text" | "select";

  options?: {
    label: string;

    value: string;
  }[];
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
          readOnly={readOnly}
          onChange={(event) => onChange(name, event.target.value)}
          rows={4}
        />
      ) : (
        <input
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(name, event.target.value)}
          style={
            readOnly
              ? {
                  opacity: 0.8,

                  cursor: "not-allowed",
                }
              : undefined
          }
        />
      )}
    </label>
  );
}
