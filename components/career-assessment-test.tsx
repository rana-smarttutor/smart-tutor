
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

import type {
  AssessmentAnswers,
  AptitudeCategory,
  CareerAssessmentResult,
  InterestDimension,
} from "@/lib/career-assessment";

import {
  APTITUDE_CATEGORY_LABELS,
  INTEREST_DIMENSION_LABELS,
} from "@/lib/career-assessment";

import {
  CareerAssessmentResults,
} from "@/components/career-assessment-results";

type PublicAptitudeQuestion = {
  id: string;
  category: AptitudeCategory;
  prompt: string;
  options: {
    id: string;
    text: string;
  }[];
};

type PublicInterestQuestion = {
  id: string;
  dimension: InterestDimension;
  prompt: string;
};

type PublicSession = {
  id: string;
  enquiryId: string;
  bankVersion: number;
  status: "in-progress" | "submitted";
  answers: AssessmentAnswers;
  result: CareerAssessmentResult | null;
  updatedAt: string;
  expiresAt: string;
  submittedAt: string | null;
};

type AssessmentPayload = {
  session: PublicSession | null;
  questions: {
    aptitude: PublicAptitudeQuestion[];
    interests: PublicInterestQuestion[];
  };
};

type CombinedQuestion =
  | {
      type: "aptitude";
      question: PublicAptitudeQuestion;
    }
  | {
      type: "interest";
      question: PublicInterestQuestion;
    };

function emptyAnswers(): AssessmentAnswers {
  return {
    aptitude: [],
    interests: [],
  };
}

function errorMessage(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Request failed. Please try again.";
}

export function CareerAssessmentTest({
  enquiryId,
}: {
  enquiryId: string;
}) {
  const [session, setSession] =
    useState<PublicSession | null>(null);

  const [questions, setQuestions] = useState<{
    aptitude: PublicAptitudeQuestion[];
    interests: PublicInterestQuestion[];
  }>({
    aptitude: [],
    interests: [],
  });

  const [answers, setAnswers] =
    useState<AssessmentAnswers>(emptyAnswers);

  const [position, setPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [remainingSeconds, setRemainingSeconds] =
    useState(0);

  const answersRef = useRef<AssessmentAnswers>(
    emptyAnswers(),
  );

  const sessionRef = useRef<PublicSession | null>(
    null,
  );

  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  // Serialise answer updates so an older
  // autosave cannot overwrite newer answers.
  const saveQueueRef = useRef<Promise<void>>(
    Promise.resolve(),
  );

  const combined: CombinedQuestion[] = [
    ...questions.aptitude.map(
      (question): CombinedQuestion => ({
        type: "aptitude",
        question,
      }),
    ),
    ...questions.interests.map(
      (question): CombinedQuestion => ({
        type: "interest",
        question,
      }),
    ),
  ];

  const current = combined[position];

  const total = combined.length;

  const answeredAptitude =
    answers.aptitude.length;

  const answeredInterests =
    answers.interests.length;

  const answered =
    answeredAptitude + answeredInterests;

  const expired =
    session !== null &&
    session.status === "in-progress" &&
    remainingSeconds <= 0;

  const applySession = useCallback(
    (next: PublicSession) => {
      sessionRef.current = next;
      setSession(next);
    },
    [],
  );

  const applyAnswers = useCallback(
    (next: AssessmentAnswers) => {
      answersRef.current = next;
      setAnswers(next);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/career-assessment?enquiryId=${encodeURIComponent(
          enquiryId,
        )}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(errorMessage(payload));
      }

      if (!mountedRef.current) return;

      const result = payload as AssessmentPayload;

      setQuestions(result.questions);

      if (result.session) {
        applySession(result.session);
        applyAnswers(result.session.answers);
      } else {
        sessionRef.current = null;
        setSession(null);
        applyAnswers(emptyAnswers());
      }

      dirtyRef.current = false;
      setSaveMessage("");
    } catch (cause) {
      if (mountedRef.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load assessment.",
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enquiryId, applySession, applyAnswers]);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (
      !session ||
      session.status !== "in-progress"
    ) {
      return;
    }

    function updateTimer() {
      const seconds = Math.max(
        0,
        Math.ceil(
          (Date.parse(session!.expiresAt) -
            Date.now()) /
            1000,
        ),
      );

      setRemainingSeconds(seconds);
    }

    updateTimer();

    const interval = window.setInterval(
      updateTimer,
      1000,
    );

    return () => window.clearInterval(interval);
  }, [session?.id, session?.expiresAt, session?.status]);

  async function start() {
    if (starting) return;

    setStarting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/career-assessment",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enquiryId,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(errorMessage(payload));
      }

      setQuestions(payload.questions);
      applySession(payload.session);
      applyAnswers(payload.session.answers);
      dirtyRef.current = false;
      setPosition(0);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to start assessment.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function saveLatest(): Promise<void> {
    const active = sessionRef.current;

    if (
      !active ||
      active.status !== "in-progress" ||
      !dirtyRef.current ||
      submittingRef.current
    ) {
      return;
    }

    if (Date.now() >= Date.parse(active.expiresAt)) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    const snapshot = answersRef.current;

    try {
      const response = await fetch(
        `/api/career-assessment/${encodeURIComponent(
          active.id,
        )}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: snapshot,
            updatedAt: active.updatedAt,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(errorMessage(payload));
      }

      if (!mountedRef.current) return;

      applySession(payload.session);

      // If answers changed during the request,
      // keep the newer changes dirty.
      dirtyRef.current =
        answersRef.current !== snapshot;

      setSaveMessage("Progress saved");
      setError("");
    } catch (cause) {
      if (mountedRef.current) {
        dirtyRef.current = true;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to autosave answers.",
        );
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }

  function queueSave(): Promise<void> {
    const next = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveLatest());

    saveQueueRef.current = next;

    return next;
  }

  function selectAptitude(
    questionId: string,
    optionId: string,
  ) {
    if (submitting || expired) return;

    const next: AssessmentAnswers = {
      ...answersRef.current,
      aptitude: [
        ...answersRef.current.aptitude.filter(
          (item) => item.questionId !== questionId,
        ),
        {
          questionId,
          optionId,
        },
      ],
    };

    applyAnswers(next);
    dirtyRef.current = true;
    setSaveMessage("");
  }

  function selectInterest(
    questionId: string,
    rating: number,
  ) {
    if (submitting || expired) return;

    const next: AssessmentAnswers = {
      ...answersRef.current,
      interests: [
        ...answersRef.current.interests.filter(
          (item) => item.questionId !== questionId,
        ),
        {
          questionId,
          rating,
        },
      ],
    };

    applyAnswers(next);
    dirtyRef.current = true;
    setSaveMessage("");
  }

  // Autosave shortly after each change.
  useEffect(() => {
    if (!session || session.status !== "in-progress") {
      return;
    }

    if (!dirtyRef.current) return;

    const timeout = window.setTimeout(
      () => {
        void queueSave();
      },
      800,
    );

    return () => window.clearTimeout(timeout);
  }, [answers, session?.id, session?.status]);

  async function submit() {
    const active = sessionRef.current;

    if (
      !active ||
      active.status !== "in-progress" ||
      submittingRef.current
    ) {
      return;
    }

    if (
      !window.confirm(
        "Submit this assessment? Answers cannot be changed after submission.",
      )
    ) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      // Finish any in-flight autosave before
      // sending the final answer snapshot.
      await saveQueueRef.current.catch(
        () => undefined,
      );

      const response = await fetch(
        `/api/career-assessment/${encodeURIComponent(
          active.id,
        )}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: answersRef.current,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(errorMessage(payload));
      }

      applySession(payload.session);
      applyAnswers(payload.session.answers);
      dirtyRef.current = false;
      setSaveMessage("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit assessment.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-slate-600">
        <Loader2 className="animate-spin" size={20} />
        Loading Career Assessment...
      </div>
    );
  }

  if (
    session?.status === "submitted" &&
    session.result
  ) {
    return (
      <CareerAssessmentResults
        result={session.result}
        submittedAt={session.submittedAt}
      />
    );
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-xl font-extrabold text-[#0B1F4B]">
          Career Aptitude & Interest Assessment
        </h2>

<p className="mt-3 text-sm leading-6 text-slate-600">
  This assessment contains 25 aptitude questions
  and 18 interest statements.

  The time allowance is 45 minutes.

  The results require counsellor review.
  Unanswered questions may result in a
  provisional assessment report.
</p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={starting}
          onClick={() => void start()}
          className="mt-5 rounded-xl bg-[#0B40A1] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {starting
            ? "Starting..."
            : "Start Assessment"}
        </button>
      </section>
    );
  }

  const minutes = Math.floor(
    remainingSeconds / 60,
  );

  const seconds = remainingSeconds % 60;

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-[#F5F8FF] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            SmartIQ Institute
          </p>

          <h2 className="mt-1 text-xl font-extrabold text-[#0B1F4B]">
            Career Assessment
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {answered} of {total} questions answered
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 font-bold text-blue-900">
          <Clock3 size={17} />

          {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-blue-600"
          style={{
            width:
              total > 0
                ? `${(answered / total) * 100}%`
                : "0%",
          }}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}

          <button
            type="button"
            onClick={() => void load()}
            className="ml-3 inline-flex items-center gap-1 font-bold underline"
          >
            <RefreshCw size={14} />
            Reload
          </button>
        </div>
      )}

      {expired && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Time has expired. Only answers saved
          before the deadline can be submitted.
        </p>
      )}

      {current && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Question {position + 1} of {total}
            </p>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
              {current.type === "aptitude"
                ? APTITUDE_CATEGORY_LABELS[
                    current.question.category
                  ]
                : INTEREST_DIMENSION_LABELS[
                    current.question.dimension
                  ]}
            </span>
          </div>

          <h3 className="text-lg font-extrabold leading-7 text-[#0B1F4B]">
            {current.question.prompt}
          </h3>

          {current.type === "aptitude" ? (
            <div className="mt-6 space-y-3">
              {current.question.options.map(
                (option) => {
                  const chosen =
                    answers.aptitude.find(
                      (item) =>
                        item.questionId ===
                        current.question.id,
                    )?.optionId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={expired || submitting}
                      onClick={() =>
                        selectAptitude(
                          current.question.id,
                          option.id,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold disabled:opacity-60 ${
                        chosen
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                      }`}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current text-xs">
                        {String.fromCharCode(
                          65 + Number(option.id),
                        )}
                      </span>

                      {option.text}

                      {chosen && (
                        <CheckCircle2
                          size={17}
                          className="ml-auto"
                        />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-slate-500">
                How much do you agree with this statement?
              </p>

              {[
                "Strongly disagree",
                "Disagree",
                "Neutral",
                "Agree",
                "Strongly agree",
              ].map((label, index) => {
                const rating = index + 1;

                const selected =
                  answers.interests.find(
                    (item) =>
                      item.questionId ===
                      current.question.id,
                  )?.rating === rating;

                return (
                  <button
                    key={rating}
                    type="button"
                    disabled={expired || submitting}
                    onClick={() =>
                      selectInterest(
                        current.question.id,
                        rating,
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold disabled:opacity-60 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <span className="font-extrabold">
                      {rating}.
                    </span>

                    {label}

                    {selected && (
                      <CheckCircle2
                        size={17}
                        className="ml-auto"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <button
          type="button"
          disabled={position === 0 || submitting}
          onClick={() =>
            setPosition((value) =>
              Math.max(0, value - 1),
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-40"
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        <span className="text-xs font-semibold text-slate-500">
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </span>
          ) : saveMessage ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Save size={14} />
              {saveMessage}
            </span>
          ) : dirtyRef.current ? (
            "Unsaved changes"
          ) : (
            "Progress saved"
          )}
        </span>

        <button
          type="button"
          disabled={
            position >= total - 1 || submitting
          }
          onClick={() =>
            setPosition((value) =>
              Math.min(total - 1, value + 1),
            )
          }
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B40A1] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          Next
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={saving || submitting || expired}
          onClick={() => void queueSave()}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-800 disabled:opacity-40"
        >
          <Save size={16} />
          Save Progress
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting
            ? "Submitting..."
            : expired
              ? "Submit Saved Answers"
              : "Finish & Submit Assessment"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
        Assessment progress is stored on the server.
        Do not close the page while an answer is
        displaying as unsaved. Submitted results
        are final unless an authorised retake is
        arranged.
      </div>
    </section>
  );
}
