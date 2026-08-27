"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const initialMessage = {
  role: "assistant",
  content:
    "Hi! I’m Smart IQ Institute AI Assistant 👋\nI'm here to help you find the perfect learning pathway. Which **Class** or **Level** are you in?",
};

const STEPS = {
  CLASS: "class",
  COURSE: "course",
  TIMING: "timing",
  COMPLETE: "complete",
};

const OPTIONS = {
  [STEPS.CLASS]: [
    "Class 1-5",
    "Class 6-8",
    "Class 9-10",
    "Class 11-12",
    "Graduation",
    "Post Grad",
    "Skills Only",
  ],
  [STEPS.COURSE]: [
    "Board Prep",
    "JEE/NEET",
    "Full Stack Dev",
    "Govt Exams",
    "Soft Skills",
    "Data Science",
  ],
  [STEPS.TIMING]: [
    "Morning School",
    "Afternoon School",
    "Full-time College",
    "Working Professional",
  ],
};

export default function SmartTutorsAIChatbot() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [isAssistantHovered, setIsAssistantHovered] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(STEPS.CLASS);

  const [memory, setMemory] = useState({
    classLevel: "",
    courseName: "",
    schoolTiming: "",
  });

  const bottomRef = useRef(null);
  const styles = getStyles(theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const html = document.documentElement;

      setTheme(
        html.classList.contains("dark") ||
          html.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light",
      );
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (open) {
      setShowGreeting(false);
      return;
    }

    let hideTimer;

    const showGreetingBriefly = () => {
      setShowGreeting(true);

      window.clearTimeout(hideTimer);

      hideTimer = window.setTimeout(() => {
        setShowGreeting(false);
      }, 4000);
    };

    showGreetingBriefly();

    const repeatTimer = window.setInterval(showGreetingBriefly, 25000);

    return () => {
      window.clearInterval(repeatTimer);
      window.clearTimeout(hideTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [open, messages, typing]);

  function getProgressiveResponse(userInput, currentStep) {
    if (currentStep === STEPS.CLASS) {
      setMemory((previous) => ({
        ...previous,
        classLevel: userInput,
      }));

      setStep(STEPS.COURSE);

      return `Nice. Since you are in ${userInput}, which area would you like to focus on for your growth?`;
    }

    if (currentStep === STEPS.COURSE) {
      setMemory((previous) => ({
        ...previous,
        courseName: userInput,
      }));

      setStep(STEPS.TIMING);

      return "Understood. To plan your sessions better, may I know your current daily schedule or school timing?";
    }

    if (currentStep === STEPS.TIMING) {
      setMemory((previous) => ({
        ...previous,
        schoolTiming: userInput,
      }));

      setStep(STEPS.COMPLETE);

      return `Perfect. I've curated your profile:

• Academic Level: ${memory.classLevel}
• Interest: ${memory.courseName}
• Current Schedule: ${userInput}

A Smart IQ Institute mentor will now reach out to provide your custom learning roadmap. Is there anything else you'd like to ask about our faculty or campus?`;
    }

    return "I've shared your details with our counseling team. They will contact you shortly. Do you have any other questions?";
  }

  function sendMessage(textOverride) {
    const text = textOverride || input.trim();

    if (!text) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: text,
      },
    ]);

    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      const aiResponse = getProgressiveResponse(text, step);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);

      setTyping(false);
    }, 800);
  }

  function formatContent(content) {
    const lines = content.split("\n");

    return lines.map((line, index) => (
      <div
        key={`${line}-${index}`}
        style={{
          marginBottom: index < lines.length - 1 ? "4px" : 0,
          minHeight: line.trim() ? "auto" : "6px",
          opacity: 0,
          animationName: "chat-text-rise",
          animationDuration: "0.35s",
          animationTimingFunction: "ease-out",
          animationFillMode: "both",
          animationDelay: `${0.08 + index * 0.08}s`,
        }}
      >
        {line.split("**").map((part, partIndex) =>
          partIndex % 2 === 1 ? (
            <strong
              key={`${part}-${partIndex}`}
              style={{
                fontWeight: 800,
                color: "#2563eb",
              }}
            >
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </div>
    ));
  }

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes chat-fade-in {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes greeting-strip-in {
          from {
            opacity: 0;
            transform: translateX(10px) scale(0.94);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes greeting-letter-rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes chat-text-rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes chat-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          scrollbar-width: none;
        }
      `}</style>

      <div style={styles.wrapper}>
{!open ? (
  <div
    style={styles.compactAssistant}
    onMouseEnter={() => setIsAssistantHovered(true)}
    onMouseLeave={() => setIsAssistantHovered(false)}
  >
    {showGreeting || isAssistantHovered ? (
              <div style={styles.hoverPrompt}>
                <span style={styles.greetingText}>
                  {["H", "i", "i"].map((letter, index) => (
                    <span
                      key={`${letter}-${index}`}
                      style={{
                        ...styles.greetingLetter,
                        animationDelay: `${index * 0.14}s`,
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setOpen(true)}
              style={styles.toggleBtn}
              aria-label="Open Smart IQ Institute AI"
            >
              <Image
                src="/image5.png"
                alt="Smart IQ Institute AI"
                width={70}
                height={70}
                sizes="70px"
                quality={75}
                style={styles.avatarImage}
              />
            </button>
          </div>
        ) : (
          <section style={styles.chatBox}>
            <header style={styles.header}>
              <div>
                <div style={styles.title}>Smart IQ Institute AI</div>
                <div style={styles.subtitle}>Personalized Learning Guide</div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={styles.closeBtn}
                aria-label="Close chatbot"
              >
                ×
              </button>
            </header>

            <div className="no-scrollbar" style={styles.messages}>
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    ...styles.msgRow,
                    justifyContent:
                      message.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      ...(message.role === "user"
                        ? styles.userBubble
                        : styles.botBubble),
                    }}
                  >
                    {formatContent(message.content)}
                  </div>
                </div>
              ))}

              {typing ? (
                <div style={styles.msgRow}>
                  <div style={{ ...styles.bubble, ...styles.botBubble }}>
                    Thinking...
                  </div>
                </div>
              ) : null}

              {!typing && step !== STEPS.COMPLETE && messages.length > 1 ? (
                <div style={styles.optionsContainer}>
                  {OPTIONS[step]?.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => sendMessage(option)}
                      style={styles.optionBtn}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            <footer style={styles.footer}>
              <div style={styles.inputRow}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder="Type your reply..."
                  style={styles.input}
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  style={styles.sendBtn}
                >
                  Send
                </button>
              </div>
            </footer>
          </section>
        )}
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
      bottom: "112px",
      zIndex: 100000,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      fontFamily: "Inter, Arial, sans-serif",
      pointerEvents: "none",
    },

    compactAssistant: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      pointerEvents: "auto",
      animationName: "chat-float",
      animationDuration: "3.5s",
      animationTimingFunction: "ease-in-out",
      animationIterationCount: "infinite",
    },

    hoverPrompt: {
      width: "78px",
      height: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      border: "1px solid rgba(37, 99, 235, 0.13)",
      borderRadius: "999px",
      background: "#ffffff",
      color: "#2563eb",
      boxShadow: "0 9px 20px rgba(15, 23, 42, 0.16)",
      animationName: "greeting-strip-in",
      animationDuration: "0.35s",
      animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      animationFillMode: "both",
    },

    greetingText: {
      display: "inline-flex",
      overflow: "hidden",
      fontSize: "15px",
      fontWeight: 800,
      letterSpacing: "-0.2px",
      lineHeight: 1,
    },

    greetingLetter: {
      display: "inline-block",
      opacity: 0,
      animationName: "greeting-letter-rise",
      animationDuration: "0.35s",
      animationTimingFunction: "ease-out",
      animationFillMode: "both",
    },

    toggleBtn: {
      pointerEvents: "auto",
      width: "68px",
      height: "68px",
      padding: "3px",
      border: "3px solid #ffffff",
      borderRadius: "50%",
      background: "#2563eb",
      cursor: "pointer",
      boxShadow:
        "0 14px 28px rgba(15, 23, 42, 0.22), 0 0 0 4px rgba(59, 130, 246, 0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      objectFit: "cover",
    },

    chatBox: {
      pointerEvents: "auto",
      width: "380px",
      maxWidth: "calc(100vw - 32px)",
      height: "580px",
      maxHeight: "calc(100vh - 64px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      borderRadius: "26px",
      background: isDark ? "#0f172a" : "#ffffff",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      animationName: "chat-fade-in",
      animationDuration: "0.3s",
      animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      animationFillMode: "both",
    },

    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px",
      background: "#2563eb",
      color: "#ffffff",
    },

    title: {
      fontSize: "18px",
      fontWeight: 800,
      letterSpacing: "-0.5px",
    },

    subtitle: {
      marginTop: "2px",
      fontSize: "11px",
      opacity: 0.85,
    },

    closeBtn: {
      border: "none",
      background: "transparent",
      color: "#ffffff",
      fontSize: "28px",
      lineHeight: 1,
      cursor: "pointer",
      opacity: 0.85,
    },

    messages: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      padding: "20px",
      overflowY: "auto",
      background: isDark ? "#0f172a" : "#f8fafc",
    },

    msgRow: {
      display: "flex",
      width: "100%",
    },

    bubble: {
      maxWidth: "85%",
      padding: "14px 18px",
      borderRadius: "20px",
      fontSize: "14px",
      lineHeight: 1.5,
    },

    botBubble: {
      border: isDark ? "1px solid #334155" : "none",
      background: isDark ? "#1e293b" : "#f1f5f9",
      color: isDark ? "#f8fafc" : "#0f172a",
    },

    userBubble: {
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 500,
    },

    optionsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginTop: "4px",
      paddingLeft: "4px",
    },

    optionBtn: {
      border: "1px solid #2563eb",
      borderRadius: "10px",
      padding: "6px 12px",
      background: isDark ? "#1e293b" : "#ffffff",
      color: "#2563eb",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer",
    },

    footer: {
      padding: "18px",
      borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      background: isDark ? "#0f172a" : "#ffffff",
    },

    inputRow: {
      display: "flex",
      gap: "10px",
    },

    input: {
      flex: 1,
      minWidth: 0,
      padding: "14px 18px",
      border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
      borderRadius: "14px",
      outline: "none",
      background: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#ffffff" : "#0f172a",
      fontSize: "14px",
    },

    sendBtn: {
      border: "none",
      borderRadius: "14px",
      padding: "0 20px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 700,
      cursor: "pointer",
    },
  };
}
