"use client";

import { useEffect, useRef, useState } from "react";

const quickActions = [
  "Ask Study Question",
  "Recommend Course",
  "Make Study Plan",
  "Mock Test Help",
  "Contact Admissions",
];

const initialMessage = {
  role: "assistant",
  content:
    "Hi! I’m SmartTutors AI Assistant 👋\nI can help you with study doubts, exam preparation, course guidance, mock tests, study plans, and Smart Tutors services.\n\nTell me your class, subject, or exam goal, and I will guide you.",
};

const educationKeywords = [
  "study",
  "exam",
  "course",
  "class",
  "grade",
  "subject",
  "math",
  "maths",
  "science",
  "english",
  "history",
  "geography",
  "biology",
  "physics",
  "chemistry",
  "commerce",
  "accounts",
  "economics",
  "board",
  "hsc",
  "ssc",
  "mpsc",
  "upsc",
  "banking",
  "railway",
  "aptitude",
  "reasoning",
  "mock",
  "test",
  "timetable",
  "notes",
  "chapter",
  "syllabus",
  "career",
  "resume",
  "interview",
  "gdpi",
  "placement",
  "admission",
  "school",
  "college",
  "teacher",
  "parent",
  "student",
  "marks",
  "revision",
  "homework",
  "assignment",
  "doubt",
  "learn",
  "preparation",
  "quiz",
  "mcq",
  "neet",
  "jee",
  "photosynthesis",
  "newton",
  "algebra",
  "grammar",
  "essay",
  "degree",
  "formula",
  "definition",
  "explain",
  "summarize",
  "summary",
];

function getCurrentTheme() {
  if (typeof window === "undefined") return "light";

  const html = document.documentElement;
  const body = document.body;

  const htmlTheme = html.getAttribute("data-theme");
  const bodyTheme = body?.getAttribute("data-theme");

  if (
    html.classList.contains("dark") ||
    body?.classList.contains("dark") ||
    htmlTheme === "dark" ||
    bodyTheme === "dark" ||
    localStorage.getItem("theme") === "dark"
  ) {
    return "dark";
  }

  if (
    html.classList.contains("light") ||
    body?.classList.contains("light") ||
    htmlTheme === "light" ||
    bodyTheme === "light" ||
    localStorage.getItem("theme") === "light"
  ) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function detectLanguage() {
  return "english";
}

function isEducationRelated(text) {
  const lower = text.toLowerCase();
  return educationKeywords.some((keyword) => lower.includes(keyword));
}

function extractMemory(text, currentMemory) {
  const lower = text.toLowerCase();
  const updated = { ...currentMemory };

  const nameMatch = text.match(/my name is\s+([a-zA-Z ]+)/i);
  if (nameMatch) {
    updated.name = nameMatch[1].trim();
  }

  const classMatch = lower.match(
    /class\s*(\d{1,2})|grade\s*(\d{1,2})|std\s*(\d{1,2})/
  );

  if (classMatch) {
    updated.classGrade = classMatch[1] || classMatch[2] || classMatch[3];
  }

  const exams = [
    "upsc",
    "mpsc",
    "ssc",
    "hsc",
    "banking",
    "railway",
    "jee",
    "neet",
    "board",
    "placement",
  ];

  const foundExam = exams.find((exam) => lower.includes(exam));
  if (foundExam) updated.targetExam = foundExam.toUpperCase();

  const subjects = [
    "math",
    "maths",
    "science",
    "english",
    "physics",
    "chemistry",
    "biology",
    "history",
    "geography",
    "accounts",
    "economics",
    "reasoning",
    "aptitude",
  ];

  const foundSubject = subjects.find((subject) => lower.includes(subject));
  if (foundSubject) updated.weakSubject = foundSubject;

  updated.preferredLanguage = "english";

  if (
    lower.includes("course") ||
    lower.includes("admission") ||
    lower.includes("recommend")
  ) {
    updated.courseInterest = text;
  }

  if (
    lower.includes("goal") ||
    lower.includes("target") ||
    lower.includes("prepare")
  ) {
    updated.studyGoal = text;
  }

  return updated;
}

function getCourseRecommendation(memory, text) {
  const lower = text.toLowerCase();
  const classNumber = Number(memory.classGrade);

  if (
    lower.includes("placement") ||
    lower.includes("resume") ||
    lower.includes("interview") ||
    lower.includes("job") ||
    lower.includes("gdpi")
  ) {
    return "Career Launch Studio";
  }

  if (
    lower.includes("upsc") ||
    lower.includes("mpsc") ||
    lower.includes("banking") ||
    lower.includes("ssc") ||
    lower.includes("railway") ||
    lower.includes("government")
  ) {
    return "Competitive Exam Plan";
  }

  if (classNumber >= 6 && classNumber <= 10) {
    return "School Student Plan";
  }

  if (
    classNumber === 11 ||
    classNumber === 12 ||
    lower.includes("hsc") ||
    lower.includes("junior college")
  ) {
    return "HSC / Junior College Plan";
  }

  if (
    lower.includes("college") ||
    lower.includes("semester") ||
    lower.includes("assignment")
  ) {
    return "Academic Excellence Program";
  }

  return "Smart Tutors Course Guidance Plan";
}

function fallbackReply(text, memory) {
  const lower = text.toLowerCase();

 if (!isEducationRelated(text)) {
  return `Hi! I can help you with Smart Tutors education support.

You can ask me about:
• Study doubts
• School or college subjects
• Exam preparation
• Study timetable
• Mock test strategy
• Course recommendations
• Admission guidance

Please tell me your class, subject, or exam goal, and I will guide you in English.`;
}

  if (
    lower.includes("course") ||
    lower.includes("recommend") ||
    lower.includes("admission")
  ) {
    const plan = getCourseRecommendation(memory, text);

    return `Based on your details, the best Smart Tutors option is: ${plan}.

To guide you better, please share:
• Your class or grade
• Target exam
• Weak subject
• Daily available study time

Smart Tutors can help with structured preparation, mock tests, mentoring, and progress tracking.`;
  }

  if (
    lower.includes("study plan") ||
    lower.includes("timetable") ||
    lower.includes("schedule")
  ) {
    const subject = memory.weakSubject || "your main subject";
    const exam = memory.targetExam || "your exam";

    return `Here is a simple study plan:

• Daily study: 2–3 hours
• 45 minutes: Revise concepts of ${subject}
• 45 minutes: Solve practice questions
• 30 minutes: Review mistakes
• 20 minutes: Make quick notes
• Every 2 days: Take a short mock test
• Sunday: Full weekly revision

Goal: Build consistent preparation for ${exam}.

Smart Tutors can help with weekly assessments, mock tests, doubt solving, and mentoring.`;
  }

  if (lower.includes("mock") || lower.includes("test") || lower.includes("mcq")) {
    return `Best mock test method:

• Start with chapter-wise tests
• Then take mixed-subject tests
• Practice with a timer
• Maintain a mistake notebook
• Revise every wrong answer
• Take one full mock test every week

Smart Tutors can help with mock tests, weekly assessments, and progress tracking.`;
  }

  if (lower.includes("photosynthesis")) {
    return `Photosynthesis is the process by which green plants make their own food using sunlight.

Simple explanation:
• Plants take carbon dioxide from the air.
• Roots absorb water from the soil.
• Leaves contain chlorophyll, which captures sunlight.
• Using sunlight, plants convert carbon dioxide and water into glucose.
• Oxygen is released as a by-product.

Formula:
Carbon dioxide + Water + Sunlight → Glucose + Oxygen`;
  }

  if (lower.includes("newton")) {
    return `Newton's laws of motion explain how objects move.

1. First Law:
An object stays at rest or keeps moving unless an external force acts on it.

2. Second Law:
Force = Mass × Acceleration.

3. Third Law:
For every action, there is an equal and opposite reaction.`;
  }

  if (lower.includes("math") || lower.includes("maths")) {
    return `For Maths, follow this method:

• First understand the formula
• Solve 5 easy examples
• Then solve 10 medium questions
• Mark your mistakes
• Revise the same topic next day
• Take a short weekly test

Tell me the exact Maths topic and I will explain it step by step.`;
  }

  return `I can answer this as your Smart Tutors AI Assistant.

Please ask your question more clearly, for example:
• Explain photosynthesis
• Make a Class 10 Maths plan
• Recommend a course for UPSC
• Give me a mock test strategy
• Help me prepare for board exams`;
}

export default function SmartTutorsAIChatbot() {
  const [theme, setTheme] = useState("light");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [typing, setTyping] = useState(false);

  const [memory, setMemory] = useState({
    name: "",
    classGrade: "",
    targetExam: "",
    weakSubject: "",
    preferredLanguage: "english",
    studyGoal: "",
    courseInterest: "",
  });

  const bottomRef = useRef(null);
  const styles = getStyles(theme);

  useEffect(() => {
    const updateTheme = () => setTheme(getCurrentTheme());

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }

    const interval = setInterval(updateTheme, 800);

    return () => {
      mediaQuery.removeEventListener("change", updateTheme);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage(text = input) {
    const cleanText = text.trim();

    if (!cleanText) return;

    const updatedMemory = extractMemory(cleanText, memory);
    const updatedMessages = [...messages, { role: "user", content: cleanText }];

    setMemory(updatedMemory);
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/smarttutors-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanText,
          memory: updatedMemory,
          history: updatedMessages.slice(-10),
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fallbackReply(cleanText, updatedMemory),
          },
        ]);
        setTyping(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || fallbackReply(cleanText, updatedMemory),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackReply(cleanText, updatedMemory),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleQuickAction(action) {
    const prompts = {
      "Ask Study Question": "I want to ask a study question",
      "Recommend Course": "Please recommend the best Smart Tutors course for me",
      "Make Study Plan": "Please make a study plan for me",
      "Mock Test Help": "I need help with mock test preparation",
      "Contact Admissions": "I want to contact admissions",
    };

    sendMessage(prompts[action] || action);
  }

  return (
    <div style={styles.wrapper}>
      {open && (
        <div style={styles.chatBox}>
          <div style={styles.header}>
            <div>
              <div style={styles.title}>Smart Tutors AI</div>
              <div style={styles.subtitle}>
                Study Assistant & Course Guide
              </div>
            </div>

            <button onClick={() => setOpen(false)} style={styles.closeButton}>
              ×
            </button>
          </div>

          <div style={styles.messages}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(message.role === "user"
                      ? styles.userBubble
                      : styles.botBubble),
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {typing && (
              <div style={styles.messageRow}>
                <div style={styles.botBubble}>Smart Tutors AI is typing...</div>
              </div>
            )}

            {messages.length === 1 && (
              <div style={styles.quickGrid}>
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    style={styles.quickButton}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={styles.footer}>
            <div style={styles.note}>
              Smart Tutors can help with study doubts, course guidance, mock tests,
              study plans, and admissions.
            </div>

            <div style={styles.inputRow}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask your study question..."
                style={styles.input}
              />

              <button onClick={() => sendMessage()} style={styles.sendButton}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={styles.floatingButton}>
        {open ? "×" : "🤖"}
      </button>
    </div>
  );
}

function getStyles(theme) {
  const isDark = theme === "dark";

  const colors = {
    pageGradient: isDark
      ? "linear-gradient(180deg, #020617 0%, #0f172a 50%, #111827 100%)"
      : "linear-gradient(180deg, #eef7ff 0%, #f8fbff 45%, #ffffff 100%)",

    cardBg: isDark ? "rgba(15, 23, 42, 0.96)" : "rgba(255, 255, 255, 0.96)",
    headerBg: isDark
      ? "linear-gradient(135deg, #0f172a, #1e3a8a)"
      : "linear-gradient(135deg, #2563eb, #1d4ed8)",

    floatingBg: isDark
      ? "linear-gradient(135deg, #1e40af, #38bdf8)"
      : "linear-gradient(135deg, #2563eb, #00b4ff)",

    botBg: isDark ? "rgba(30, 41, 59, 0.95)" : "white",
    botText: isDark ? "#e5e7eb" : "#0f172a",
    userBg: isDark
      ? "linear-gradient(135deg, #2563eb, #38bdf8)"
      : "linear-gradient(135deg, #2563eb, #0ea5e9)",

    border: isDark ? "rgba(96, 165, 250, 0.18)" : "rgba(37, 99, 235, 0.18)",
    softBorder: isDark ? "rgba(96, 165, 250, 0.18)" : "rgba(37, 99, 235, 0.12)",
    footerBg: isDark ? "#0f172a" : "white",
    noteBg: isDark ? "rgba(30, 64, 175, 0.22)" : "#eff6ff",
    noteText: isDark ? "#bfdbfe" : "#1e40af",
    inputBg: isDark ? "#111827" : "#f8fbff",
    inputText: isDark ? "#f8fafc" : "#0f172a",
    quickBg: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.92)",
    quickText: isDark ? "#dbeafe" : "#1e3a8a",
    mutedText: isDark ? "#cbd5e1" : "#475569",
    shadow: isDark
      ? "0 24px 70px rgba(0, 0, 0, 0.55)"
      : "0 24px 70px rgba(15, 23, 42, 0.22)",
  };

  return {
    wrapper: {
      position: "fixed",
      right: "24px",
      bottom: "100px",
      zIndex: 99999,
      fontFamily: "Inter, Arial, Helvetica, sans-serif",
    },

    floatingButton: {
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      border: "none",
      background: colors.floatingBg,
      color: "white",
      fontSize: "18px",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: isDark
        ? "0 18px 40px rgba(56, 189, 248, 0.22)"
        : "0 18px 40px rgba(37, 99, 235, 0.35)",
    },

    chatBox: {
      width: "400px",
      maxWidth: "92vw",
      height: "590px",
      maxHeight: "84vh",
      background: colors.cardBg,
      borderRadius: "26px",
      overflow: "hidden",
      marginBottom: "16px",
      border: `1px solid ${colors.border}`,
      boxShadow: colors.shadow,
      display: "flex",
      flexDirection: "column",
      backdropFilter: "blur(14px)",
    },

    header: {
      background: colors.headerBg,
      color: "white",
      padding: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },

    title: {
      fontSize: "18px",
      fontWeight: "800",
      letterSpacing: "-0.3px",
    },

    subtitle: {
      fontSize: "12px",
      opacity: 0.9,
      marginTop: "4px",
    },

    closeButton: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(255,255,255,0.16)",
      color: "white",
      fontSize: "24px",
      cursor: "pointer",
    },

    messages: {
      flex: 1,
      padding: "15px",
      background: colors.pageGradient,
      overflowY: "auto",
    },

    messageRow: {
      display: "flex",
      marginBottom: "10px",
    },

    messageBubble: {
      maxWidth: "82%",
      padding: "12px 14px",
      borderRadius: "18px",
      whiteSpace: "pre-line",
      fontSize: "14px",
      lineHeight: "1.45",
    },

    botBubble: {
      background: colors.botBg,
      color: colors.botText,
      border: `1px solid ${colors.softBorder}`,
      boxShadow: isDark
        ? "0 6px 16px rgba(0,0,0,0.24)"
        : "0 6px 16px rgba(15,23,42,0.06)",
    },

    userBubble: {
      background: colors.userBg,
      color: "white",
      boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
    },

    quickGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "9px",
      marginTop: "12px",
    },

    quickButton: {
      padding: "11px",
      borderRadius: "14px",
      border: `1px solid ${colors.border}`,
      background: colors.quickBg,
      color: colors.quickText,
      fontSize: "12px",
      fontWeight: "700",
      cursor: "pointer",
      textAlign: "left",
      boxShadow: isDark
        ? "0 4px 12px rgba(0,0,0,0.25)"
        : "0 4px 12px rgba(15,23,42,0.05)",
    },

    footer: {
      borderTop: `1px solid ${colors.softBorder}`,
      padding: "12px",
      background: colors.footerBg,
    },

    note: {
      background: colors.noteBg,
      color: colors.noteText,
      padding: "9px",
      borderRadius: "12px",
      fontSize: "11px",
      marginBottom: "10px",
      border: `1px solid ${colors.softBorder}`,
    },

    inputRow: {
      display: "flex",
      gap: "8px",
    },

    input: {
      flex: 1,
      padding: "12px",
      borderRadius: "14px",
      border: isDark ? "1px solid #334155" : "1px solid #bfdbfe",
      outline: "none",
      fontSize: "14px",
      background: colors.inputBg,
      color: colors.inputText,
    },

    sendButton: {
      padding: "0 16px",
      borderRadius: "14px",
      border: "none",
      background: colors.userBg,
      color: "white",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
    },
  };
}