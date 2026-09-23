"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowRight, GraduationCap, X } from "lucide-react";

import { isPublicPagePath, safeReturnPath } from "@/lib/access-routes";

type AuthState = "checking" | "guest" | "signed-in" | "unavailable";

type Reminder = "first" | "second" | null;

type Gate = {
  next: string;
  direct: boolean;
};

type QuizNotice = {
  id: string;
  source: "quiz-arena" | "mock-test";
  subject: string;
  answersByIndex: Record<string, string>;
  questions: unknown[];
};

const PREFIX = "siq-login-prompts-v1:";

const FIRST_SHOWN = PREFIX + "first-shown";
const FIRST_DISMISSED = PREFIX + "first-dismissed";
const SECOND_SHOWN = PREFIX + "second-shown";

const FIRST_ELAPSED = PREFIX + "first-elapsed";
const SECOND_ELAPSED = PREFIX + "second-elapsed";

function stored(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // The popup should work even if storage is blocked.
  }
}

function elapsed(key: string): number {
  const number = Number(stored(key) ?? "0");

  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function AuthAccessExperience() {
  const pathname = usePathname();

  const [auth, setAuth] = useState<AuthState>("checking");

  const [role, setRole] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [gate, setGate] = useState<Gate | null>(null);

  const [reminder, setReminder] = useState<Reminder>(null);

  const [quiz, setQuiz] = useState<QuizNotice | null>(null);

  const [showQuiz, setShowQuiz] = useState(false);

  const elapsedRef = useRef({
    first: 0,
    second: 0,
  });

  // ==========================================
  // CHECK LOGIN SESSION
  // ==========================================

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Session check unavailable");
      }

      const payload = (await response.json()) as {
        user?: {
          id: string;
          role: string;
        } | null;
      };

      setAuth(payload.user ? "signed-in" : "guest");

      setRole(payload.user?.role ?? null);

      setUserId(payload.user?.id ?? null);
    } catch {
      setAuth("unavailable");
      setRole(null);
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [pathname, checkSession]);

  useEffect(() => {
    const onFocus = () => {
      void checkSession();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [checkSession]);

  // ==========================================
  // DIRECT VISIT TO PROTECTED PAGE
  // ==========================================

  useEffect(() => {
    if (pathname !== "/login" || auth !== "guest") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("reason") !== "login_required") {
      return;
    }

    const next = safeReturnPath(params.get("next"));

    if (next) {
      setGate({
        next,
        direct: true,
      });
    }
  }, [pathname, auth]);

  // ==========================================
  // PROTECTED LINK POPUP
  // ==========================================

  useEffect(() => {
    function intercept(event: MouseEvent) {
      if (
        auth !== "guest" ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>("a[href]");

      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      ) {
        return;
      }

      let destination: URL;

      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (
        destination.origin !== window.location.origin ||
        isPublicPagePath(destination.pathname)
      ) {
        return;
      }

      const next = safeReturnPath(
        destination.pathname + destination.search + destination.hash,
      );

      if (!next) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setReminder(null);

      setGate({
        next,
        direct: false,
      });
    }

    document.addEventListener("click", intercept, true);

    return () => {
      document.removeEventListener("click", intercept, true);
    };
  }, [auth]);

  // ==========================================
  // HOMEPAGE LOGIN REMINDERS
  //
  // First: 7 seconds
  // Second: 120 seconds after first dismissal
  // Only counts active, visible browsing time.
  // ==========================================

  useEffect(() => {
    if (pathname !== "/" || auth !== "guest" || gate || reminder) {
      return;
    }

    elapsedRef.current = {
      first: elapsed(FIRST_ELAPSED),
      second: elapsed(SECOND_ELAPSED),
    };

    let last = performance.now();

    const timer = window.setInterval(() => {
      const now = performance.now();

      const delta = Math.min(1500, Math.max(0, now - last));

      last = now;

      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        return;
      }

      if (stored(FIRST_SHOWN) !== "yes") {
        elapsedRef.current.first += delta;

        store(FIRST_ELAPSED, String(elapsedRef.current.first));

        if (elapsedRef.current.first >= 7000) {
          store(FIRST_SHOWN, "yes");

          setReminder("first");
        }

        return;
      }

      if (stored(FIRST_DISMISSED) !== "yes" || stored(SECOND_SHOWN) === "yes") {
        return;
      }

      elapsedRef.current.second += delta;

      store(SECOND_ELAPSED, String(elapsedRef.current.second));

      if (elapsedRef.current.second >= 120000) {
        store(SECOND_SHOWN, "yes");

        setReminder("second");
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [pathname, auth, gate, reminder]);

  useEffect(() => {
    if (pathname !== "/" || auth !== "guest") {
      setReminder(null);
    }

    if (auth === "signed-in") {
      setGate(null);
    }
  }, [pathname, auth]);

  // ==========================================
  // UNFINISHED QUIZ NOTIFICATION
  // ==========================================

  useEffect(() => {
    if (
      pathname !== "/dashboard" ||
      auth !== "signed-in" ||
      role !== "student" ||
      !userId
    ) {
      return;
    }

    let cancelled = false;

    async function fetchDraft() {
      try {
        const response = await fetch("/api/quiz-arena/draft", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          draft?: QuizNotice | null;
        };

        const draft = payload.draft;

        if (
          !draft ||
          stored(PREFIX + "draft-notified:" + userId) === draft.id ||
          cancelled
        ) {
          return;
        }

        store(PREFIX + "draft-notified:" + userId, draft.id);

        setQuiz(draft);

        setShowQuiz(true);
      } catch {
        // Do not show an error if draft lookup is unavailable.
      }
    }

    void fetchDraft();

    return () => {
      cancelled = true;
    };
  }, [pathname, auth, role, userId]);

  // ==========================================
  // MODAL ACTIONS
  // ==========================================

  function dismiss() {
    if (reminder === "first") {
      store(FIRST_DISMISSED, "yes");
    }

    setReminder(null);
    setGate(null);
  }

  function navigateToAuth(target: "/login" | "/signup", next?: string) {
    const params = new URLSearchParams();

    if (next) {
      params.set("next", next);
    }

    setGate(null);
    setReminder(null);

    window.location.assign(
      target + (params.size ? `?${params.toString()}` : ""),
    );
  }

  // ==========================================
  // CONTEXT-AWARE POPUP TEXT
  // ==========================================

  const modal = gate ? "gate" : reminder;

  const showModal = auth === "guest" && modal !== null;

  const target = gate?.next.split("?")[0].split("#")[0] ?? "";

  const resourceName =
    target === "/quiz-arena"
      ? "Quiz Arena"
      : target === "/mock-test"
        ? "Mock Tests"
        : target === "/courses"
          ? "Courses"
          : target === "/library"
            ? "Digital Library"
            : target === "/student-performance"
              ? "Performance Reports"
              : target === "/exam-updates"
                ? "Exam Updates"
                : target === "/placements"
                  ? "Placement Resources"
                  : "learning resources";

  const title = "Your Learning Journey Awaits";

  const description =
    modal === "gate"
      ? `Log in to access ${resourceName}, explore learning resources and track your progress.`
      : modal === "first"
        ? "Log in to access smart courses, mock tests, study resources and track your progress."
        : "Continue your SmartIQ journey with personalised learning, practice tests and progress tracking.";

  // ==========================================
  // POPUP DESIGN
  // ==========================================

  return (
    <>
      {showModal && (
        <div
          className="
            fixed inset-0 z-[200]
            flex items-center justify-center
            bg-slate-950/75
            px-4 py-5
            backdrop-blur-md
          "
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="smartiq-auth-title"
            aria-describedby="smartiq-auth-description"
            className="
              relative w-full
max-w-[460px]
overflow-hidden
              rounded-[28px]
              border border-blue-100/80
              bg-white
              px-6 pb-6 pt-8
              text-center
              shadow-[0_30px_100px_rgba(2,20,63,0.35)]
              sm:px-9 sm:pb-8 sm:pt-10
              motion-safe:animate-in
              motion-safe:fade-in
              motion-safe:zoom-in-95
            "
          >
            {/* Decorative top-left blue shape */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute -left-28 -top-36
                h-64 w-64
                rounded-full
                bg-blue-100/65
                sm:h-72 sm:w-72
              "
            />

            {/* Decorative top-right blue shape */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute -right-28 -top-40
                h-64 w-64
                rounded-full
                bg-sky-50
              "
            />

            {/* Decorative bottom-right shape */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute -bottom-36 -right-32
                h-64 w-64
                rounded-full
                bg-blue-50
              "
            />

            {/* Close button */}

            <button
              type="button"
              aria-label="Close popup"
              onClick={dismiss}
              className="
                absolute right-4 top-4 z-20
                flex h-9 w-9
                items-center justify-center
                rounded-full
                border border-blue-100
                bg-white/90
                text-slate-500
                shadow-sm
                transition-all duration-200
                hover:rotate-90
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-700
              "
            >
              <X size={17} />
            </button>

            <div className="relative z-10">
              {/* Graduation icon */}

              <div
                className="
                  mx-auto
                  flex h-[74px] w-[74px]
                  items-center justify-center
                  rounded-[22px]
                  border border-blue-100/80
                  bg-gradient-to-br
                  from-blue-50
                  via-[#e8f1ff]
                  to-[#d9e9ff]
                  shadow-[0_8px_24px_rgba(37,99,235,0.10)]
                  sm:h-[82px] sm:w-[82px]
                "
              >
                <GraduationCap
                  size={37}
                  strokeWidth={1.8}
                  className="
                    text-[#154bb5]
                    drop-shadow-sm
                  "
                />
              </div>

              {/* Brand name */}

              <p
                className="
                  mt-5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.27em]
                  text-[#1454c5]
                  sm:text-xs
                "
              >
                SmartIQ Institute
              </p>

              {/* Small access badge */}

              {modal === "gate" && (
                <div
                  className="
                    mx-auto mt-3
                    w-fit
                    rounded-full
                    border border-blue-100
                    bg-blue-50
                    px-3 py-1
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-blue-700
                  "
                >
                  Login Required
                </div>
              )}

              {/* Heading */}

              <h2
                id="smartiq-auth-title"
                className="
                  mx-auto mt-4
                  max-w-[340px]
                  text-[27px]
                  font-black
                  leading-[1.13]
                  tracking-[-0.045em]
                  text-[#131c32]
                  sm:text-[32px]
                "
              >
                {title}
              </h2>

              {/* Supporting text */}

              <p
                id="smartiq-auth-description"
                className="
                  mx-auto mt-4
                  max-w-[340px]
                  text-[13px]
                  font-medium
                  leading-[1.8]
                  text-slate-500
                  sm:text-sm
                "
              >
                {description}
              </p>

              {/* Login and signup buttons */}

              <div className="mt-7 grid gap-3">
                {/* Login */}

                <button
                  type="button"
                  onClick={() => {
                    if (gate?.direct && pathname === "/login") {
                      setGate(null);
                      return;
                    }

                    navigateToAuth("/login", gate?.next);
                  }}
                  className="
                    group
                    flex w-full
                    items-center justify-center
                    gap-2
                    rounded-xl
                    border border-blue-500
                    bg-gradient-to-r
                    from-[#1176f8]
                    to-[#1654ed]
                    px-5 py-3.5
                    text-[14px]
                    font-bold
                    text-white
                    shadow-[0_10px_22px_rgba(37,99,235,0.22)]
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:from-[#0965e6]
                    hover:to-[#1345d7]
                    hover:shadow-[0_13px_25px_rgba(37,99,235,0.28)]
                  "
                >
                  Login Now
                  <ArrowRight
                    size={17}
                    className="
                      transition-transform
                      group-hover:translate-x-1
                    "
                  />
                </button>

                {/* Create account */}

                <button
                  type="button"
                  onClick={() => navigateToAuth("/signup", gate?.next)}
                  className="
                    group
                    flex w-full
                    items-center justify-center
                    gap-2
                    rounded-xl
                    border border-blue-200
                    bg-gradient-to-r
                    from-[#f4f8ff]
                    to-[#ebf3ff]
                    px-5 py-3.5
                    text-[14px]
                    font-bold
                    text-[#1550c5]
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:border-blue-300
                    hover:from-[#eaf3ff]
                    hover:to-[#dfeeff]
                  "
                >
                  Create Free Account
                  <ArrowRight
                    size={16}
                    className="
                      transition-transform
                      group-hover:translate-x-1
                    "
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          UNFINISHED QUIZ NOTIFICATION
          ===================================== */}

      {pathname === "/dashboard" &&
        auth === "signed-in" &&
        role === "student" &&
        showQuiz &&
        quiz &&
        !showModal && (
          <aside
            role="status"
            className="
              fixed bottom-5 right-5
              z-[180]
              w-[calc(100vw-2.5rem)]
              max-w-sm
              rounded-2xl
              border border-blue-100
              bg-white
              p-5
              text-slate-900
              shadow-2xl
            "
          >
            <button
              type="button"
              aria-label="Dismiss unfinished quiz reminder"
              onClick={() => setShowQuiz(false)}
              className="
                absolute right-3 top-3
                flex h-7 w-7
                items-center justify-center
                rounded-full
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              <X size={17} />
            </button>

            <p
              className="
                text-xs
                font-black
                uppercase
                tracking-wider
                text-blue-600
              "
            >
              Continue Learning
            </p>

            <h3
              className="
                mt-2
                pr-5
                text-lg
                font-black
              "
            >
              You have an unfinished quiz!
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-600
              "
            >
              Your {quiz.subject} quiz is waiting. You answered{" "}
              {Object.keys(quiz.answersByIndex).length} of{" "}
              {quiz.questions.length} questions.
            </p>

            <div className="mt-4 flex gap-3">
              <Link
                href={
                  quiz.source === "mock-test" ? "/mock-test" : "/quiz-arena"
                }
                className="
                  flex-1
                  rounded-lg
                  bg-blue-600
                  px-4 py-2.5
                  text-center
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-blue-700
                "
              >
                Resume Quiz
              </Link>

              <button
                type="button"
                onClick={() => setShowQuiz(false)}
                className="
                  rounded-lg
                  border border-slate-200
                  px-4 py-2.5
                  text-sm
                  font-bold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                "
              >
                Dismiss
              </button>
            </div>
          </aside>
        )}
    </>
  );
}
