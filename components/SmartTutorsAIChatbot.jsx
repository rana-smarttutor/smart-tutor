"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/*
 * Messages shown one-by-one when the chatbot
 * is opened for the first time.
 */
const INTRO_MESSAGES = [
  "Hi! I’m SmartIQ Institute AI Assistant 👋",
  "I'm here to help you find the perfect learning pathway.",
  "Which **Class** or **Level** are you in?",
];

const STEPS = {
  CLASS: "class",
  COURSE: "course",
  TIMING: "timing",
  COMPLETE: "complete",
};

const CLASS_OPTIONS = [
  "Class 6-8",
  "Class 9-10",
  "Class 11-12",
  "Graduation",
  "Government Exams",
  "Skill Development",
];

const COURSE_OPTIONS_BY_LEVEL = {
  "Class 6-8": [
    "Regular Academic",
    "Spoken English",
    "Abacus",
    "Robotics",
    "Olympiad Preparation",
    "UPSC Foundation",
    "Public Speaking",
    "Personality Development",
  ],

  "Class 9-10": [
    "Regular Academic / Board Prep",
    "JEE Foundation",
    "NEET Foundation",
    "UPSC Foundation",
    "Police / Army Bharti",
    "Robotics",
    "Artificial Intelligence Basics",
    "Video Editing",
    "Spoken English",
    "Career Counselling",
  ],

  "Class 11-12": [
    "Science - PCM / PCB",
    "Commerce",
    "Arts / Humanities",
    "JEE",
    "NEET",
    "MHT-CET",
    "CUET",
    "NDA",
    "CLAT",
    "CA Foundation",
    "CS Foundation",
    "CMA Foundation",
    "IPMAT / NPAT",
    "UPSC Foundation",
    "SSC CHSL",
    "Railway Exams",
    "Interview & Personality Development",
  ],

  Graduation: [
    "Government Exam Preparation",
    "Banking Exams",
    "SSC Exams",
    "Railway Exams",
    "Skill Development",
  ],


  "Government Exams": [
    "UPSC Civil Services",
    "MPSC / State PSC",
    "SSC Exams",
    "Banking Exams",
    "Railway Exams",
    "NDA / CDS",
    "Police / Army Bharti",
  ],

  "Skill Development": [
    "Communication & Personality",
    "Global / Foreign Languages",
    "Career Readiness",
    "Creative & Digital Skills",
    "Technology & Future Skills",
    "Performing Arts & Hobby Skills",
  ],
};

const TIMING_OPTIONS_BY_LEVEL = {
  "Class 6-8": ["Morning School", "Afternoon School"],

  "Class 9-10": ["Morning School", "Afternoon School"],

  "Class 11-12": [
    "Morning School",
    "Afternoon School",
    "College / Junior College",
  ],

  Graduation: [
    "Full-time College",
    "Distance / Online College",
    "Working Professional",
  ],

  "Post Graduation": [
    "Full-time College",
    "Distance / Online College",
    "Working Professional",
  ],

  "Diploma / Polytechnic": ["Full-time College", "Working Professional"],

  "Government Exams": [
    "Full-time Preparation",
    "College Student",
    "Working Professional",
  ],

  "Skill Development": [
    "School Student",
    "College Student",
    "Working Professional",
    "Flexible Schedule",
  ],
};

function getOptionsForStep(step, classLevel) {
  if (step === STEPS.CLASS) {
    return CLASS_OPTIONS;
  }

  if (step === STEPS.COURSE) {
    return COURSE_OPTIONS_BY_LEVEL[classLevel] ?? [];
  }

  if (step === STEPS.TIMING) {
    return TIMING_OPTIONS_BY_LEVEL[classLevel] ?? [];
  }

  return [];
}

export default function SmartTutorsAIChatbot() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  const [open, setOpen] = useState(false);

  const [showGreeting, setShowGreeting] = useState(true);
  const [isAssistantHovered, setIsAssistantHovered] = useState(false);

  const [input, setInput] = useState("");

  /*
   * IMPORTANT:
   * Start empty.
   *
   * Previously initialMessage was already inside this state,
   * which is why the entire greeting appeared immediately.
   */
  const [messages, setMessages] = useState([]);

  const [typing, setTyping] = useState(false);

  /*
   * Used so we don't replay the introduction after
   * the user has already started chatting.
   */
  const [introComplete, setIntroComplete] = useState(false);
  const [introRunning, setIntroRunning] = useState(false);

  const [step, setStep] = useState(STEPS.CLASS);

  const [memory, setMemory] = useState({
    classLevel: "",
    courseName: "",
    schoolTiming: "",
  });

  const bottomRef = useRef(null);
  const introTimersRef = useRef([]);

  const styles = getStyles(theme);
  const currentOptions = getOptionsForStep(step, memory.classLevel);

  /*
   * Client mount
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Detect website light/dark theme.
   */
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

  /*
   * Small "Hii" bubble beside assistant icon.
   */
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

  /*
   * NEW:
   * Play the introduction one message at a time.
   *
   * Chat opens
   * ↓
   * typing...
   * ↓
   * Message 1
   * ↓
   * typing...
   * ↓
   * Message 2
   * ↓
   * typing...
   * ↓
   * Message 3
   * ↓
   * Class options
   */
  useEffect(() => {
    if (!open || introComplete || messages.length > 0) {
      return;
    }

    setIntroRunning(true);
    setTyping(true);

    const timer1 = window.setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content: INTRO_MESSAGES[0],
        },
      ]);

      setTyping(false);
    }, 450);

    const typing2 = window.setTimeout(() => {
      setTyping(true);
    }, 700);

    const timer2 = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: INTRO_MESSAGES[1],
        },
      ]);

      setTyping(false);
    }, 1050);

    const typing3 = window.setTimeout(() => {
      setTyping(true);
    }, 1300);

    const timer3 = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: INTRO_MESSAGES[2],
        },
      ]);

      setTyping(false);
    }, 1650);

    const finishTimer = window.setTimeout(() => {
      setIntroComplete(true);
      setIntroRunning(false);
    }, 1950);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(typing2);
      window.clearTimeout(timer2);
      window.clearTimeout(typing3);
      window.clearTimeout(timer3);
      window.clearTimeout(finishTimer);
    };
  }, [open]);

  /*
   * Automatically scroll to newest message.
   */
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

  /*
   * Progressive questionnaire responses.
   */
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

A SmartIQ Institute mentor will now reach out to provide your custom learning roadmap. Is there anything else you'd like to ask about our faculty or campus?`;
    }

    return "I've shared your details with our counseling team. They will contact you shortly. Do you have any other questions?";
  }

  /*
   * Send user message.
   */
  function sendMessage(textOverride) {
    /*
     * Prevent sending while the assistant is typing
     * or while the opening sequence is running.
     */
    if (typing || introRunning || !introComplete) {
      return;
    }

    const text =
      typeof textOverride === "string" ? textOverride.trim() : input.trim();

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

    /*
     * Small realistic response delay.
     */
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
    }, 2000);
  }

  /*
   * Handles bold text and multiple lines.
   */
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

          animationDelay: `${0.05 + index * 0.07}s`,
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

  /*
   * Better typing indicator.
   */
  function TypingIndicator() {
    return (
      <div
        style={{
          ...styles.msgRow,
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            ...styles.bubble,
            ...styles.botBubble,
            ...styles.typingBubble,
          }}
        >
          <span
            style={{
              ...styles.typingDot,
              animationDelay: "0s",
            }}
          />

          <span
            style={{
              ...styles.typingDot,
              animationDelay: "0.16s",
            }}
          />

          <span
            style={{
              ...styles.typingDot,
              animationDelay: "0.32s",
            }}
          />
        </div>
      </div>
    );
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
            transform: translateY(8px);
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

        @keyframes chatbot-typing-dot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }

          30% {
            transform: translateY(-5px);
            opacity: 1;
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
              aria-label="Open SmartIQ Institute AI"
            >
              <Image
                src="/image5.png"
                alt="SmartIQ Institute AI"
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
            {/* HEADER */}
            <header style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={styles.headerAvatar}>
                  <Image
                    src="/image5.png"
                    alt="SmartIQ Institute AI"
                    width={42}
                    height={42}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </div>

                <div>
                  <div style={styles.title}>SmartIQ Institute AI</div>

                  <div style={styles.subtitleRow}>
                    <span style={styles.onlineDot} />

                    <span style={styles.subtitle}>
                      Personalized Learning Guide
                    </span>
                  </div>
                </div>
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

            {/* MESSAGES */}
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

              {/* REALISTIC TYPING DOTS */}
              {typing ? <TypingIndicator /> : null}

              {/*
               * OPTIONS ARE HIDDEN UNTIL:
               * 1. Intro sequence has finished
               * 2. Assistant isn't typing
               * 3. Questionnaire isn't complete
               */}
              {introComplete && !typing && step !== STEPS.COMPLETE ? (
                <div style={styles.optionsContainer}>
                  {currentOptions.map((option) => (
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

            {/* FOOTER */}
            <footer style={styles.footer}>
              <div style={styles.inputRow}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && step === STEPS.COMPLETE) {
                      sendMessage();
                    }
                  }}
                  disabled={
                    typing ||
                    introRunning ||
                    !introComplete ||
                    step !== STEPS.COMPLETE
                  }
                  placeholder={
                    !introComplete
                      ? "SmartIQ AI is typing..."
                      : step !== STEPS.COMPLETE
                        ? "Please select an option above..."
                        : "Type your reply..."
                  }
                  style={{
                    ...styles.input,

                    ...(!introComplete ||
                    typing ||
                    introRunning ||
                    step !== STEPS.COMPLETE
                      ? styles.disabledInput
                      : {}),
                  }}
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={
                    typing ||
                    introRunning ||
                    !introComplete ||
                    step !== STEPS.COMPLETE
                  }
                  style={{
                    ...styles.sendBtn,

                    ...(!introComplete ||
                    typing ||
                    introRunning ||
                    step !== STEPS.COMPLETE
                      ? styles.disabledSendBtn
                      : {}),
                  }}
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

      padding: "16px 18px",

      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",

      color: "#ffffff",
    },

    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "11px",
    },

    headerAvatar: {
      width: "42px",
      height: "42px",

      flexShrink: 0,

      padding: "2px",

      borderRadius: "50%",

      background: "#ffffff",

      overflow: "hidden",
    },

    title: {
      fontSize: "17px",
      fontWeight: 800,

      letterSpacing: "-0.4px",
    },

    subtitleRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",

      marginTop: "3px",
    },

    subtitle: {
      fontSize: "11px",

      opacity: 0.88,
    },

    onlineDot: {
      width: "7px",
      height: "7px",

      borderRadius: "50%",

      background: "#4ade80",

      boxShadow: "0 0 0 3px rgba(74, 222, 128, 0.18)",
    },

    closeBtn: {
      border: "none",

      background: "transparent",

      color: "#ffffff",

      fontSize: "28px",
      lineHeight: 1,

      cursor: "pointer",

      opacity: 0.9,
    },

    messages: {
      flex: 1,

      display: "flex",
      flexDirection: "column",

      gap: "12px",

      padding: "20px",

      overflowY: "auto",

      background: isDark ? "#0f172a" : "#f8fafc",
    },

    msgRow: {
      display: "flex",

      width: "100%",

      animationName: "chat-text-rise",
      animationDuration: "0.3s",
      animationTimingFunction: "ease-out",
      animationFillMode: "both",
    },

    bubble: {
      maxWidth: "85%",

      padding: "13px 16px",

      borderRadius: "18px",

      fontSize: "14px",
      lineHeight: 1.5,
    },

    botBubble: {
      border: isDark ? "1px solid #334155" : "1px solid #e6ebf2",

      borderBottomLeftRadius: "6px",

      background: isDark ? "#1e293b" : "#ffffff",

      color: isDark ? "#f8fafc" : "#0f172a",

      boxShadow: isDark ? "none" : "0 4px 12px rgba(15, 23, 42, 0.05)",
    },

    userBubble: {
      borderBottomRightRadius: "6px",

      background: "#2563eb",

      color: "#ffffff",

      fontWeight: 500,

      boxShadow: "0 5px 14px rgba(37, 99, 235, 0.18)",
    },

    typingBubble: {
      display: "flex",
      alignItems: "center",

      gap: "5px",

      width: "fit-content",

      padding: "13px 16px",
    },

    typingDot: {
      display: "block",

      width: "7px",
      height: "7px",

      borderRadius: "50%",

      background: isDark ? "#94a3b8" : "#64748b",

      animationName: "chatbot-typing-dot",
      animationDuration: "1.1s",
      animationTimingFunction: "ease-in-out",
      animationIterationCount: "infinite",
    },

    optionsContainer: {
      display: "flex",
      flexWrap: "wrap",

      gap: "8px",

      marginTop: "3px",

      paddingLeft: "3px",

      animationName: "chat-text-rise",
      animationDuration: "0.35s",
      animationTimingFunction: "ease-out",
      animationFillMode: "both",
    },

    optionBtn: {
      border: "1px solid #2563eb",

      borderRadius: "11px",

      padding: "7px 12px",

      background: isDark ? "#1e293b" : "#ffffff",

      color: "#2563eb",

      fontSize: "12px",
      fontWeight: 700,

      cursor: "pointer",
    },

    footer: {
      padding: "16px",

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

      padding: "13px 16px",

      border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,

      borderRadius: "14px",

      outline: "none",

      background: isDark ? "#1e293b" : "#ffffff",

      color: isDark ? "#ffffff" : "#0f172a",

      fontSize: "14px",

      transition: "border-color 0.2s ease, opacity 0.2s ease",
    },

    disabledInput: {
      cursor: "not-allowed",

      opacity: 0.6,

      background: isDark ? "#182235" : "#f8fafc",
    },

    sendBtn: {
      border: "none",

      borderRadius: "14px",

      padding: "0 20px",

      background: "#2563eb",

      color: "#ffffff",

      fontWeight: 700,

      cursor: "pointer",

      transition: "opacity 0.2s ease, transform 0.2s ease",
    },

    disabledSendBtn: {
      cursor: "not-allowed",

      opacity: 0.5,
    },
  };
}
