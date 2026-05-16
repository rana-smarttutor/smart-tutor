"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const quickActions = [
  { label: "Location", type: "answer", content: "Smart Tutor is located in Sector 17, Vashi, Navi Mumbai. Visit us for expert coaching!", path: "/contact" },
  { label: "Contact", type: "answer", content: "You can reach us at +91 88504 47887 or email admissions@smarttutor.in.", path: "/contact" },
  { label: "Timings", type: "answer", content: "We are open Monday to Saturday, from 8:00 AM to 8:30 PM.", path: "/contact" },
  { label: "Courses", type: "link", content: "/courses", path: "/courses" },
  { label: "Consult", type: "link", content: "/contact", path: "/contact" },
];

const initialMessage = {
  role: "assistant",
  content:
    "Hi! I’m SmartTutor AI Assistant 👋\nI can help with study doubts, course guidance, and exams.\n\nTell me your class or goal, and I'll help you. Would you like a detailed study guide?",
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
  "mht-cet",
  "cuet",
  "upsc",
  "mpsc",
  "banking",
  "ssc",
  "vashi",
  "navi mumbai",
  "prof. ravi rana",
  "smartiq",
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
    lower.includes("gdpi") ||
    lower.includes("career")
  ) {
    return "Career Launch Studio / Placement Readiness";
  }

  if (
    lower.includes("upsc") ||
    lower.includes("mpsc") ||
    lower.includes("civil service")
  ) {
    return "UPSC / MPSC Foundation Program";
  }

  if (
    lower.includes("banking") ||
    lower.includes("ssc") ||
    lower.includes("railway") ||
    lower.includes("government")
  ) {
    return "Government Exam Preparation (Banking/SSC/Railway)";
  }

  if (
    lower.includes("jee") ||
    lower.includes("neet") ||
    lower.includes("cet") ||
    lower.includes("entrance")
  ) {
    return "Entrance Exam Preparation (JEE/NEET/CET)";
  }

  if (classNumber >= 1 && classNumber <= 5) {
    return "Primary School Foundation (Class 1-5)";
  }

  if (classNumber >= 6 && classNumber <= 8) {
    return "Middle School Foundation (Class 6-8)";
  }

  if (
    classNumber === 9 ||
    classNumber === 10 ||
    lower.includes("board") ||
    lower.includes("ssc") ||
    lower.includes("hsc")
  ) {
    return "Class 9 & 10 Board Preparation";
  }

  if (
    classNumber === 11 ||
    classNumber === 12 ||
    lower.includes("junior college") ||
    lower.includes("jc")
  ) {
    return "Class 11, 12 & Junior College Support";
  }

  if (
    lower.includes("college") ||
    lower.includes("degree") ||
    lower.includes("graduation") ||
    lower.includes("diploma") ||
    lower.includes("polytechnic")
  ) {
    return "Diploma & Graduation Support Program";
  }

  return "Smart Tutor General Academic Mentoring";
}

function fallbackReply(text, memory) {
  const lower = text.toLowerCase();
  const expandPrompt = "\n\nWould you like a more detailed explanation or step-by-step guidance?";

  if (!isEducationRelated(text)) {
    return "I help with school coaching, competitive exams (UPSC/MPSC), and study plans. How can I assist with your learning today?" + expandPrompt;
  }

  if (
    lower.includes("course") ||
    lower.includes("recommend") ||
    lower.includes("admission") ||
    lower.includes("join")
  ) {
    const plan = getCourseRecommendation(memory, text);
    return `I recommend our ${plan}. We offer expert mentoring and weekly testing in Vashi.` + expandPrompt;
  }

  if (
    lower.includes("contact") ||
    lower.includes("phone") ||
    lower.includes("call") ||
    lower.includes("address") ||
    lower.includes("location") ||
    lower.includes("vashi")
  ) {
    return "Reach us at +91 88504 47887 or visit Sector 17, Vashi. Prof. Ravi Rana is available for counselling." + expandPrompt;
  }

  if (
    lower.includes("study plan") ||
    lower.includes("timetable") ||
    lower.includes("schedule")
  ) {
    return "I can create a 2-3 hour daily study plan with revision and mock tests focused on your goals." + expandPrompt;
  }

  if (lower.includes("mock") || lower.includes("test") || lower.includes("mcq")) {
    return "We provide chapter-wise precision tests and full-length mock papers with detailed mentoring." + expandPrompt;
  }

  return "I can help you with your Class, specific subjects, or exam goals (Board, JEE, NEET, UPSC)." + expandPrompt;
}

export default function SmartTutorAIChatbot() {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [memory, setMemory] = useState({});
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const styles = getStyles(theme);

  useEffect(() => {
    const updateTheme = () => setTheme(getCurrentTheme());
    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, displayedText]);

  const typeEffect = (text) => {
    setIsTypingAnimation(true);
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTypingAnimation(false);
      }
    }, 20);
  };

  async function sendMessage(text = input) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const updatedMemory = extractMemory(cleanText, memory);
    const updatedMessages = [...messages, { role: "user", content: cleanText }];

    setMemory(updatedMemory);
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);
    setDisplayedText("");

    try {
      const response = await fetch("/api/smarttutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanText,
          memory: updatedMemory,
          history: updatedMessages.slice(-10),
          isExpanded,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      let data = await response.json();
      const reply = data?.reply || fallbackReply(cleanText, updatedMemory);
      
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      typeEffect(reply);
    } catch (error) {
      console.error("Chat error:", error);
      setTyping(false);
      const reply = fallbackReply(cleanText, updatedMemory);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      typeEffect(reply);
    }
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setTyping(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/upload-material", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorText = `Upload failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          // not json
        }
        throw new Error(errorText);
      }

      const data = await response.json();
      setUploading(false);
      setTyping(false);

      if (data.success) {
        const fileNames = data.uploaded.map((f) => f.fileName).join(", ");
        const msg = `Successfully uploaded: ${fileNames}. You can now ask questions about these materials!`;
        setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
        typeEffect(msg);
      } else {
        const errorMsg = data.message || "Failed to upload files.";
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMsg}` }]);
        typeEffect(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      setTyping(false);
      const displayError = error.message?.includes("fetch") 
        ? "Network error: Connection lost or file too large for server limits." 
        : `Upload error: ${error.message}`;
      
      setMessages((prev) => [...prev, { role: "assistant", content: displayError }]);
      typeEffect(displayError);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleQuickAction(action) {
    if (action.type === "link") {
      router.push(action.content);
      return;
    }
    
    if (action.type === "answer") {
      const userMsg = { role: "user", content: action.label };
      const botMsg = { role: "assistant", content: action.content };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      typeEffect(action.content);
      return;
    }

    sendMessage(action.label || action);
  }

  function handleVisit(path) {
    if (path) router.push(path);
  }

  return (
    <div style={styles.wrapper}>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
        accept=".pdf,.docx,.txt,image/*"
      />
      {open ? (
        <div style={styles.chatBox}>
          <div style={styles.header}>
            <div style={{ flex: 1 }}>
              <div style={styles.title}>SmartTutor AI</div>
              <div style={styles.subtitle}>Vashi's Expert Study Guide</div>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                style={styles.expandedButton}
              >
                {isExpanded ? "🚀 Full" : "⚡ Lite"}
              </button>
              <button onClick={() => setOpen(false)} style={styles.closeButton}>×</button>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              const isBot = message.role === "assistant";
              const showText = (isBot && isLast && (isTypingAnimation || displayedText)) ? displayedText : message.content;

              return (
                <div key={index} style={{ ...styles.messageRow, justifyContent: isBot ? "flex-start" : "flex-end" }}>
                  <div style={{ ...styles.messageBubble, ...(isBot ? styles.botBubble : styles.userBubble) }}>
                    {showText}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div style={styles.messageRow}>
                <div style={{ ...styles.botBubble, padding: "8px 12px" }}>
                  <span className="animate-pulse" style={{ fontSize: "10px", letterSpacing: "2px" }}>● ● ●</span>
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>

          <div style={styles.footer}>
            <div style={styles.quickActionsRow}>
              {quickActions.map((action, idx) => (
                <div key={idx} style={styles.quickActionGroup}>
                  <button
                    onClick={() => handleQuickAction(action)}
                    style={styles.quickActionButton}
                  >
                    {action.label}
                  </button>
                  <button
                    onClick={() => handleVisit(action.path)}
                    style={styles.visitButton}
                    title="Visit page"
                  >
                    ↗
                  </button>
                </div>
              ))}
            </div>
            <div style={styles.inputRow}>
              <button onClick={() => fileInputRef.current?.click()} style={styles.attachButton}>📎</button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask me anything..."
                style={styles.input}
              />
              <button onClick={() => sendMessage()} style={styles.sendButton}>➤</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={styles.floatingButton}>AI</button>
      )}
    </div>
  );
}

function getStyles(theme) {
  const isDark = theme === "dark";
  const violetPrimary = "#7c3aed"; // Violet-600
  const violetSoft = "#ddd6fe"; // Violet-200

  return {
    wrapper: {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: 100000,
      fontFamily: "Inter, sans-serif",
      pointerEvents: "none", // Allow clicks to pass through wrapper to items below if needed
    },
    floatingButton: {
      width: "56px",
      height: "56px",
      position: "absolute",
      bottom: "68px", // Stacked above WhatsApp (which is at bottom 24, gap of 12px)
      right: "0", 
      borderRadius: "50%",
      border: "none",
      background: `linear-gradient(135deg, ${violetPrimary}, #4f46e5)`,
      color: "white",
      fontWeight: "bold",
      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      pointerEvents: "auto", // Re-enable pointer events for the button
    },
    chatBox: {
      width: "320px",
      height: "460px",
      position: "absolute",
      bottom: "0",
      right: "0",
      background: isDark ? "#0f172a" : "#ffffff",
      borderRadius: "16px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      overflow: "hidden",
      pointerEvents: "auto", // Re-enable pointer events for the chatbox
    },
    header: {
      background: `linear-gradient(135deg, ${violetPrimary}, #4f46e5)`,
      color: "white",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
    },
    title: { fontSize: "14px", fontWeight: "700" },
    subtitle: { fontSize: "10px", opacity: 0.9 },
    closeButton: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
    },
    expandedButton: {
      fontSize: "9px",
      color: "white",
      border: "1px solid rgba(255,255,255,0.3)",
      padding: "2px 6px",
      borderRadius: "6px",
      background: "transparent",
      cursor: "pointer",
    },
    messages: {
      flex: 1,
      padding: "12px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      background: isDark ? "#020617" : "#f8fafc",
    },
    messageRow: {
      display: "flex",
      width: "100%",
    },
    messageBubble: {
      maxWidth: "80%",
      padding: "10px 14px",
      fontSize: "13px",
      lineHeight: "1.5",
      position: "relative",
    },
    botBubble: {
      background: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#f1f5f9" : "#1e293b",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      borderRadius: "16px 16px 16px 4px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    userBubble: {
      background: `linear-gradient(135deg, ${violetPrimary}, #6d28d9)`,
      color: "white",
      borderRadius: "16px 16px 4px 16px",
      boxShadow: `0 4px 10px ${violetPrimary}20`,
    },
    footer: {
      padding: "10px",
      background: isDark ? "#0f172a" : "#ffffff",
      borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
    },
    quickActionsRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      paddingBottom: "10px",
    },
    quickActionGroup: {
      display: "flex",
      alignItems: "center",
      background: isDark ? "#1e293b" : "#f1f5f9",
      borderRadius: "20px",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      overflow: "hidden",
    },
    quickActionButton: {
      padding: "5px 8px 5px 10px",
      background: "none",
      border: "none",
      color: isDark ? "#f1f5f9" : "#475569",
      fontSize: "10px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.2s",
    },
    visitButton: {
      padding: "5px 8px",
      background: isDark ? "#334155" : "#e2e8f0",
      border: "none",
      color: isDark ? "#94a3b8" : "#64748b",
      fontSize: "10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderLeft: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
      transition: "all 0.2s",
    },
    inputRow: { display: "flex", gap: "8px", alignItems: "center" },
    input: {
      flex: 1,
      padding: "8px 12px",
      borderRadius: "8px",
      border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
      fontSize: "13px",
      outline: "none",
      background: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "white" : "black",
    },
    attachButton: {
      background: "none",
      border: "none",
      fontSize: "16px",
      cursor: "pointer",
      color: "#64748b",
    },
    sendButton: {
      background: violetPrimary,
      border: "none",
      color: "white",
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };
}
