"use client";

import { useEffect, useRef, useState } from "react";

const initialMessage = {
  role: "assistant",
  content:
    "Hi! I’m SmartTutors AI Assistant 👋\nI'm here to help you find the perfect learning pathway. Which **Class** or **Level** are you in?",
};

// Progression steps for data gathering
const STEPS = {
  CLASS: "class",
  COURSE: "course",
  TIMING: "timing",
  BATCH: "batch",
  COMPLETE: "complete"
};

const OPTIONS = {
  [STEPS.CLASS]: ["Class 1-5", "Class 6-8", "Class 9-10", "Class 11-12", "Graduation", "Post Grad", "Skills Only"],
  [STEPS.COURSE]: ["Board Prep", "JEE/NEET", "Full Stack Dev", "Govt Exams", "Soft Skills", "Data Science"],
  [STEPS.TIMING]: ["Morning School", "Afternoon School", "Full-time College", "Working Professional"],
  [STEPS.BATCH]: ["Morning Batch", "Evening Batch", "Weekend Batch", "Flexible"],
};

export default function SmartTutorsAIChatbot() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(STEPS.CLASS);

  const [memory, setMemory] = useState({
    classLevel: "",
    courseName: "",
    schoolTiming: "",
    preferredBatch: "",
  });

  const bottomRef = useRef(null);
  const styles = getStyles(theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const html = document.documentElement;
      if (html.classList.contains("dark") || html.getAttribute("data-theme") === "dark") {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [open, messages, typing]);

  const getProgressiveResponse = (userInput, currentStep) => {
    if (currentStep === STEPS.CLASS) {
      setMemory(prev => ({ ...prev, classLevel: userInput }));
      setStep(STEPS.COURSE);
      return `Nice. Since you are in ${userInput}, which area would you like to focus on for your growth?`;
    }

    if (currentStep === STEPS.COURSE) {
      setMemory(prev => ({ ...prev, courseName: userInput }));
      setStep(STEPS.TIMING);
      return "Understood. To plan your sessions better, may I know your current daily schedule or school timing?";
    }

    if (currentStep === STEPS.TIMING) {
      setMemory(prev => ({ ...prev, schoolTiming: userInput }));
      setStep(STEPS.BATCH);
      return "Almost there! What is your preferred time for attending our specialized batches?";
    }

    if (currentStep === STEPS.BATCH) {
      setMemory(prev => ({ ...prev, preferredBatch: userInput }));
      setStep(STEPS.COMPLETE);
      return `Perfect. I've curated your profile:
      
      • Academic Level: ${memory.classLevel}
      • Interest: ${memory.courseName}
      • Current Schedule: ${memory.schoolTiming}
      • Batch Preference: ${userInput}
      
      A Smart Tutors mentor will now reach out to provide your custom learning roadmap. Is there anything else you'd like to ask about our faculty or campus?`;
    }

    return "I've shared your details with our counseling team. They will contact you shortly. Do you have any other questions?";
  };

  async function sendMessage(textOverride) {
    const text = textOverride || input.trim();
    if (!text) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = getProgressiveResponse(text, step);
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      setTyping(false);
    }, 800);
  }

  // Format text to handle bold without asterisks
  const formatContent = (content) => {
    return content.split('\n').map((line, i) => (
      <div key={i} style={{ marginBottom: i < content.split('\n').length - 1 ? '4px' : 0 }}>
        {line.split('**').map((part, j) => 
          j % 2 === 1 ? <strong key={j} style={{ fontWeight: '800', color: '#2563eb' }}>{part}</strong> : part
        )}
      </div>
    ));
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes chat-fade-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hover-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={styles.wrapper}>
        {/* Hovering Help Text */}
        {!open && (
          <div style={styles.hoverPrompt}>
            Hi, how can I help you?
            <div style={styles.hoverPromptArrow} />
          </div>
        )}

        {open && (
          <div style={styles.chatBox}>
            <div style={styles.header}>
              <div>
                <div style={styles.title}>Smart Tutors AI</div>
                <div style={styles.subtitle}>Personalized Learning Guide</div>
              </div>
              <button onClick={() => setOpen(false)} style={styles.closeBtn}>×</button>
            </div>

            <div className="no-scrollbar" style={styles.messages}>
              {messages.map((m, i) => (
                <div key={i} style={{ ...styles.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ ...styles.bubble, ...(m.role === "user" ? styles.userBubble : styles.botBubble) }}>
                    {formatContent(m.content)}
                  </div>
                </div>
              ))}
              
              {typing && (
                <div style={styles.msgRow}>
                  <div style={styles.botBubble}>Thinking...</div>
                </div>
              )}

              {/* Dynamic Quick Options - Only show after the first interaction */}
              {!typing && step !== STEPS.COMPLETE && messages.length > 1 && (
                <div style={styles.optionsContainer}>
                  {OPTIONS[step]?.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => sendMessage(opt)}
                      style={styles.optionBtn}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              
              <div ref={bottomRef} />
            </div>

            <div style={styles.footer}>
              <div style={styles.inputRow}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your reply..."
                  style={styles.input}
                />
                <button onClick={() => sendMessage()} style={styles.sendBtn}>Send</button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          style={{ ...styles.toggleBtn, transform: open ? 'rotate(180deg)' : 'none' }}
        >
          {open ? (
            <span style={styles.closeIcon}>×</span>
          ) : (
            <img src="/image5.png" alt="AI" style={styles.logoIcon} />
          )}
        </button>
      </div>
    </>
  );
}

function getStyles(theme) {
  const isDark = theme === "dark";
  return {
    wrapper: {
      position: "fixed",
      right: "24px",
      bottom: "100px",
      zIndex: 100000,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      fontFamily: "Inter, sans-serif",
      pointerEvents: "none",
    },
    hoverPrompt: {
      pointerEvents: "auto",
      background: "#2563eb",
      color: "white",
      padding: "10px 18px",
      borderRadius: "16px",
      fontSize: "14px",
      fontWeight: "700",
      marginBottom: "12px",
      boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
      position: "relative",
      animation: "chat-fade-in 0.4s ease-out, hover-float 3s ease-in-out infinite",
      whiteSpace: "nowrap",
      marginRight: "4px",
    },
    hoverPromptArrow: {
      position: "absolute",
      bottom: "-6px",
      right: "22px",
      width: "12px",
      height: "12px",
      background: "#2563eb",
      transform: "rotate(45deg)",
    },
    chatBox: {
      pointerEvents: "auto",
      width: "380px",
      maxWidth: "92vw",
      height: "580px",
      maxHeight: "calc(100vh - 220px)",
      background: isDark ? "#0f172a" : "white",
      borderRadius: "26px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      marginBottom: "16px",
      overflow: "hidden",
      animation: "chat-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    header: {
      background: "#2563eb",
      padding: "20px 24px",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "11px", opacity: 0.85, marginTop: "2px" },
    closeBtn: { background: "none", border: "none", color: "white", fontSize: "28px", cursor: "pointer", opacity: 0.8 },
    messages: { flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
    msgRow: { display: "flex", width: "100%" },
    bubble: { maxWidth: "85%", padding: "14px 18px", borderRadius: "20px", fontSize: "14px", lineHeight: "1.5" },
    botBubble: { background: isDark ? "#1e293b" : "#f1f5f9", color: isDark ? "#f8fafc" : "#0f172a", border: isDark ? "1px solid #334155" : "none" },
    userBubble: { background: "#2563eb", color: "white", fontWeight: "500" },
    optionsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginTop: "4px",
      paddingLeft: "4px",
    },
    optionBtn: {
      background: isDark ? "#1e293b" : "white",
      color: "#2563eb",
      border: `1px solid #2563eb`,
      padding: "6px 12px",
      borderRadius: "10px",
      fontSize: "12px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease",
      hover: { background: "#2563eb", color: "white" }
    },
    footer: { padding: "18px", borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, background: isDark ? "#0f172a" : "white" },
    inputRow: { display: "flex", gap: "10px" },
    input: { flex: 1, padding: "14px 18px", borderRadius: "14px", border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`, outline: "none", fontSize: "14px", background: isDark ? "#1e293b" : "white", color: isDark ? "white" : "black" },
    sendBtn: { background: "#2563eb", color: "white", border: "none", padding: "0 20px", borderRadius: "14px", fontWeight: "700", cursor: "pointer" },
    toggleBtn: {
      pointerEvents: "auto",
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      background: "#2563eb",
      border: "4px solid white",
      cursor: "pointer",
      boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      padding: "0",
      overflow: "hidden",
    },
    logoIcon: { width: "100%", height: "100%", objectFit: "cover" },
    closeIcon: { color: "white", fontSize: "32px", fontWeight: "300" },
  };
}
