
"use client";

import type {
  CareerAssessmentResult,
  InterestDimensionResult,
} from "@/lib/career-assessment";

import {
  Award,
  BookOpen,
  Brain,
  Heart,
  ShieldCheck,
} from "lucide-react";

type Props = {
  result: CareerAssessmentResult;
  submittedAt?: string | null;
};

function ScoreBar({
  label,
  score,
  detail,
}: {
  label: string;
  score: number | null;
  detail: string;
}) {
  const width =
    typeof score === "number"
      ? Math.max(
          0,
          Math.min(100, score),
        )
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {label}
          </p>

          <p className="text-xs text-slate-500">
            {detail}
          </p>
        </div>

        <span className="text-sm font-extrabold text-[#0B40A1]">
          {score === null
            ? "N/A"
            : `${score}%`}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB]"
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

function InterestScore({
  item,
}: {
  item: InterestDimensionResult;
}) {
  const complete =
    item.total > 0 &&
    item.answered === item.total;

  const hasAnswers =
    item.answered > 0 &&
    item.average !== null;

  const completion =
    item.total > 0
      ? Math.round(
          (item.answered / item.total) *
            100,
        )
      : 0;

  const rating =
    item.average === null
      ? "Not rated"
      : `${item.average.toFixed(2)} / 5`;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">
            {item.label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {item.answered} of{" "}
            {item.total} statements answered
          </p>

          {!complete && (
            <p className="mt-1 text-xs font-semibold text-amber-700">
              Incomplete section
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-lg font-extrabold text-[#0B40A1]">
            {rating}
          </p>

          <p className="text-xs text-slate-500">
            {complete
              ? "Average interest rating"
              : hasAnswers
                ? "Provisional average"
                : "No rating available"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Answer completion</span>

          <span>
            {completion}%
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2563EB]"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  completion,
                ),
              )}%`,
            }}
          />
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        A higher average reflects stronger
        agreement with the statements
        answered. It is not a percentage
        of career suitability or ability.
      </p>
    </div>
  );
}

export function CareerAssessmentResults({
  result,
  submittedAt,
}: Props) {
  const aptitudeComplete =
    result.aptitude.total > 0 &&
    result.aptitude.answered ===
      result.aptitude.total;

  const interestsComplete =
    result.interests.dimensions.every(
      (item) =>
        item.total > 0 &&
        item.answered === item.total,
    );

  const assessmentComplete =
    aptitudeComplete &&
    interestsComplete;

  const interestAnswered =
    result.interests.dimensions.reduce(
      (sum, item) =>
        sum + item.answered,
      0,
    );

  const interestTotal =
    result.interests.dimensions.reduce(
      (sum, item) =>
        sum + item.total,
      0,
    );

  const strongest = [
    ...result.aptitude.categories,
  ]
    .filter(
      (category) =>
        category.answered > 0,
    )
    .sort(
      (a, b) =>
        (b.percentage ?? 0) -
        (a.percentage ?? 0),
    )
    .slice(0, 2);

  const interestNames = new Map(
    result.interests.dimensions.map(
      (item) => [
        item.dimension,
        item.label,
      ],
    ),
  );

  const leadingAreas =
    assessmentComplete
      ? result.interests.leadingAreas
      : [];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-[#071A45] to-[#2563EB] p-6 text-white">
        <div className="flex items-center gap-3">
          <Award size={28} />

          <div>
            <h2 className="text-xl font-extrabold">
              Career Assessment Results
            </h2>

            <p className="mt-1 text-sm text-blue-100">
              Assessment submitted
              {submittedAt
                ? ` · ${new Date(
                    submittedAt,
                  ).toLocaleDateString(
                    "en-IN",
                  )}`
                : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <Brain
            className="text-blue-600"
            size={22}
          />

          <p className="mt-3 text-3xl font-black text-[#0B40A1]">
            {result.aptitude.percentage ===
            null
              ? "N/A"
              : `${result.aptitude.percentage}%`}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            Aptitude score
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {result.aptitude.correct} correct
            out of {result.aptitude.total}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <BookOpen
            className="text-blue-600"
            size={22}
          />

          <p className="mt-3 text-3xl font-black text-[#0B40A1]">
            {result.aptitude.answered}/
            {result.aptitude.total}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            Aptitude answers submitted
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {result.aptitude.unanswered} unanswered
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <Heart
            className="text-blue-600"
            size={22}
          />

          <p className="mt-3 text-3xl font-black text-[#0B40A1]">
            {interestAnswered}/
            {interestTotal}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            Interest statements answered
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {interestsComplete
              ? "All interest sections completed"
              : "Some interest answers are missing"}
          </p>
        </section>
      </div>

      {!assessmentComplete && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
        >
          This assessment was submitted with
          unanswered questions. Completed
          sections can be discussed with a
          counsellor, but incomplete interest
          ratings are provisional.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-5 text-lg font-extrabold text-[#0B1F4B]">
          Aptitude Performance
        </h3>

        <div className="space-y-5">
          {result.aptitude.categories.map(
            (category) => (
              <ScoreBar
                key={category.category}
                label={category.label}
                score={category.percentage}
                detail={`${category.correct}/${category.total} correct · ${category.answered} answered`}
              />
            ),
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-extrabold text-[#0B1F4B]">
          Interest Profile
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Interest ratings are based on
          responses to statements using a
          scale from 1 (strongly disagree)
          to 5 (strongly agree). They
          describe preferences, not
          aptitude or career suitability.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {result.interests.dimensions.map(
            (item) => (
              <InterestScore
                key={item.dimension}
                item={item}
              />
            ),
          )}
        </div>

        {leadingAreas.length > 0 && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-bold text-blue-900">
              Leading Reported Interests
            </p>

            <p className="mt-1 text-xs text-blue-700">
              These areas have the highest
              average ratings in this
              questionnaire. They are not
              definitive career recommendations.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {leadingAreas.map(
                (dimension) => (
                  <span
                    key={dimension}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-800"
                  >
                    {interestNames.get(
                      dimension,
                    ) ??
                      dimension}
                  </span>
                ),
              )}
            </div>
          </div>
        )}
      </section>

      {strongest.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-extrabold text-[#0B1F4B]">
            Areas to Discuss With a Counsellor
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            The higher-scoring aptitude
            categories in this assessment
            were{" "}
            {strongest
              .map(
                (item) => item.label,
              )
              .join(" and ")}
            . This reflects performance
            on the current questions only.
            A counsellor should consider
            these results alongside
            academic history, student
            preferences and other evidence.
          </p>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <ShieldCheck
          className="mt-0.5 shrink-0 text-blue-700"
          size={21}
        />

        <div>
          <p className="font-bold text-blue-900">
            Counsellor Review Required
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            {result.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
