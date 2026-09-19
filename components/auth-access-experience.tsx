"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { isPublicPagePath, safeReturnPath } from "@/lib/access-routes";

type AuthState = "checking" | "guest" | "signed-in" | "unavailable";
type Reminder = "first" | "second" | null;
type Gate = { next: string; direct: boolean };
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
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function store(key: string, value: string): void {
  try { sessionStorage.setItem(key, value); } catch { /* storage may be blocked */ }
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
  const elapsedRef = useRef({ first: 0, second: 0 });

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("Session check unavailable");
      const payload = (await response.json()) as {
        user?: { id: string; role: string } | null;
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

  useEffect(() => { void checkSession(); }, [pathname, checkSession]);
  useEffect(() => {
    const onFocus = () => { void checkSession(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkSession]);

  // Direct visit to a protected URL: proxy redirected to /login?next=...&reason=login_required.
  useEffect(() => {
    if (pathname !== "/login" || auth !== "guest") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") !== "login_required") return;
    const next = safeReturnPath(params.get("next"));
    if (next) setGate({ next, direct: true });
  }, [pathname, auth]);

  // Visitors who click protected links see the modal without leaving the public page.
  useEffect(() => {
    function intercept(event: MouseEvent) {
      if (auth !== "guest" || event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
          !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      let destination: URL;
      try { destination = new URL(link.href, location.href); } catch { return; }
      if (destination.origin !== location.origin || isPublicPagePath(destination.pathname)) return;
      const next = safeReturnPath(destination.pathname + destination.search + destination.hash);
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      setReminder(null);
      setGate({ next, direct: false });
    }
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [auth]);

  // Count only visible, focused homepage time. Show first at 7 seconds,
  // and second at 120 seconds after first is dismissed, maximum twice per tab session.
  useEffect(() => {
    if (pathname !== "/" || auth !== "guest" || gate || reminder) return;
    elapsedRef.current = {
      first: elapsed(FIRST_ELAPSED),
      second: elapsed(SECOND_ELAPSED),
    };
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(1500, Math.max(0, now - last));
      last = now;
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;

      if (stored(FIRST_SHOWN) !== "yes") {
        elapsedRef.current.first += delta;
        store(FIRST_ELAPSED, String(elapsedRef.current.first));
        if (elapsedRef.current.first >= 7000) {
          store(FIRST_SHOWN, "yes");
          setReminder("first");
        }
        return;
      }
      if (stored(FIRST_DISMISSED) !== "yes" || stored(SECOND_SHOWN) === "yes") return;
      elapsedRef.current.second += delta;
      store(SECOND_ELAPSED, String(elapsedRef.current.second));
      if (elapsedRef.current.second >= 120000) {
        store(SECOND_SHOWN, "yes");
        setReminder("second");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [pathname, auth, gate, reminder]);

  useEffect(() => {
    if (pathname !== "/" || auth !== "guest") setReminder(null);
    if (auth === "signed-in") setGate(null);
  }, [pathname, auth]);

  // Feature 1: notify student about MongoDB-stored unfinished quizzes on dashboard.
  useEffect(() => {
    if (pathname !== "/dashboard" || auth !== "signed-in" || role !== "student" || !userId) return;
    let cancelled = false;
    async function fetchDraft() {
      try {
        const response = await fetch("/api/quiz-arena/draft", {
          cache: "no-store", credentials: "same-origin",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { draft?: QuizNotice | null };
        const draft = payload.draft;
        if (!draft || stored(PREFIX + "draft-notified:" + userId) === draft.id || cancelled) return;
        store(PREFIX + "draft-notified:" + userId, draft.id);
        setQuiz(draft);
        setShowQuiz(true);
      } catch { /* no notification if network is unavailable */ }
    }
    void fetchDraft();
    return () => { cancelled = true; };
  }, [pathname, auth, role, userId]);

  function dismiss() {
    if (reminder === "first") store(FIRST_DISMISSED, "yes");
    setReminder(null);
    setGate(null);
  }

  function navigateToAuth(target: "/login" | "/signup", next?: string) {
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    setGate(null);
    setReminder(null);
    location.assign(target + (params.size ? `?${params}` : ""));
  }

  const modal = gate ? "gate" : reminder;
  const showModal = auth === "guest" && modal !== null;
  const target = gate?.next.split("?")[0].split("#")[0];
  const title = modal === "gate" ? "Login Required" :
    modal === "first" ? "Welcome to SmartIQ Institute!" : "Ready to Start Learning?";
  const description = modal === "gate" ?
    `Please log in or create an account to access ${target === "/quiz-arena" ? "Quiz Arena" : target === "/mock-test" ? "Mock Test" : "this learning resource"}.` :
    modal === "first" ?
      "Create an account to explore personalised learning, practice tests and progress tracking." :
      "Your SmartIQ learning journey is waiting. Log in to access your learning workspace.";

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="smartiq-auth-title"
            className="relative w-full max-w-md rounded-3xl border border-blue-100 bg-white p-7 text-center shadow-2xl sm:p-9">
            <button type="button" aria-label="Close popup" onClick={dismiss}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200">×</button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">🎓</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-blue-600">SmartIQ Institute</p>
            <h2 id="smartiq-auth-title" className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
            <div className="mt-7 grid gap-3">
              <button type="button" onClick={() => {
                if (gate?.direct && pathname === "/login") { setGate(null); return; }
                navigateToAuth("/login", gate?.next);
              }} className="rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white hover:bg-blue-700">Login</button>
              <button type="button" onClick={() => navigateToAuth("/signup", gate?.next)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-3.5 font-bold text-blue-700 hover:bg-blue-100">Create Free Account</button>
              <button type="button" onClick={dismiss} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                {modal === "gate" ? "Continue Browsing" : "Maybe Later"}
              </button>
            </div>
          </div>
        </div>
      )}
      {pathname === "/dashboard" && auth === "signed-in" && role === "student" &&
        showQuiz && quiz && !showModal && (
          <aside role="status" className="fixed bottom-5 right-5 z-[180] w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-blue-100 bg-white p-5 text-slate-900 shadow-2xl">
            <button type="button" aria-label="Dismiss unfinished quiz reminder"
              onClick={() => setShowQuiz(false)} className="absolute right-3 top-2 text-xl text-slate-400">×</button>
            <p className="text-xs font-black uppercase tracking-wider text-blue-600">Continue Learning</p>
            <h3 className="mt-2 text-lg font-black">You have an unfinished quiz!</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your {quiz.subject} quiz is waiting. You answered {Object.keys(quiz.answersByIndex).length} of {quiz.questions.length} questions.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href={quiz.source === "mock-test" ? "/mock-test" : "/quiz-arena"}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700">Resume Quiz</Link>
              <button type="button" onClick={() => setShowQuiz(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Dismiss</button>
            </div>
          </aside>
        )}
    </>
  );
}