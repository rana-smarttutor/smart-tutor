
export const APTITUDE_CATEGORIES = [
  "numerical",
  "verbal",
  "logical",
  "spatial",
  "data-interpretation",
] as const;

export type AptitudeCategory =
  (typeof APTITUDE_CATEGORIES)[number];

export const INTEREST_DIMENSIONS = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
] as const;

export type InterestDimension =
  (typeof INTEREST_DIMENSIONS)[number];

export const APTITUDE_CATEGORY_LABELS: Record<
  AptitudeCategory,
  string
> = {
  numerical: "Numerical Reasoning",
  verbal: "Verbal Reasoning",
  logical: "Logical Reasoning",
  spatial: "Spatial Reasoning",
  "data-interpretation": "Data Interpretation",
};

export const INTEREST_DIMENSION_LABELS: Record<
  InterestDimension,
  string
> = {
  realistic: "Practical & Hands-on",
  investigative: "Research & Problem Solving",
  artistic: "Creative & Expressive",
  social: "Helping & Teaching",
  enterprising: "Leadership & Business",
  conventional: "Organisation & Detail",
};

export const ASSESSMENT_CONFIG = {
  version: 3,
  aptitudePerCategory: 5,
  interestPerDimension: 3,
  aptitudeTotal: 25,
  interestTotal: 18,
  totalQuestions: 43,
  interestMin: 1,
  interestMax: 5,
} as const;

export type AssessmentOption = {
  id: string;
  text: string;
};

export type AptitudeQuestion = {
  id: string;
  category: AptitudeCategory;
  prompt: string;
  options: AssessmentOption[];
  correctOptionId: string;
  explanation: string;
};

export type InterestQuestion = {
  id: string;
  dimension: InterestDimension;
  prompt: string;
  reverseScored?: boolean;
};

export type AptitudeAnswer = {
  questionId: string;
  optionId: string;
};

export type InterestAnswer = {
  questionId: string;
  rating: number;
};

export type AssessmentAnswers = {
  aptitude: AptitudeAnswer[];
  interests: InterestAnswer[];
};

export type AptitudeCategoryResult = {
  category: AptitudeCategory;
  label: string;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number | null;
};

export type InterestDimensionResult = {
  dimension: InterestDimension;
  label: string;
  answered: number;
  total: number;
  average: number | null;
  percentage: number | null;
};

export type CareerAssessmentResult = {
  version: number;
  completed: boolean;

  aptitude: {
    correct: number;
    total: number;
    answered: number;
    unanswered: number;
    percentage: number | null;
    categories: AptitudeCategoryResult[];
  };

  interests: {
    dimensions: InterestDimensionResult[];
    leadingAreas: InterestDimension[];
  };

  disclaimer: string;
};

export const ASSESSMENT_DISCLAIMER =
  "This is an educational screening assessment, not a " +
  "validated psychometric diagnosis. Scores describe performance " +
  "on these questions and self-reported interests only. " +
  "A qualified counsellor should review the results alongside " +
  "academic records and student preferences.";

function percentage(
  numerator: number,
  denominator: number,
): number | null {
  if (denominator <= 0) {
    return null;
  }

  return Math.round(
    (numerator / denominator) * 100,
  );
}

export function isAptitudeCategory(
  value: unknown,
): value is AptitudeCategory {
  return APTITUDE_CATEGORIES.some(
    (category) => category === value,
  );
}

export function isInterestDimension(
  value: unknown,
): value is InterestDimension {
  return INTEREST_DIMENSIONS.some(
    (dimension) => dimension === value,
  );
}

/**
 * Validate the complete assessment question bank.
 *
 * Expected:
 * - 25 aptitude questions
 * - 5 questions in each aptitude category
 * - 36 interest statements
 * - 6 statements in each interest dimension
 *
 * Total: 61 questions.
 */
export function validateAssessmentBank(
  aptitudeQuestions: AptitudeQuestion[],
  interestQuestions: InterestQuestion[],
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  // ---------------------------------
  // APTITUDE: TOTAL COUNT
  // ---------------------------------

  if (
    aptitudeQuestions.length !==
    ASSESSMENT_CONFIG.aptitudeTotal
  ) {
    errors.push(
      `Expected ${ASSESSMENT_CONFIG.aptitudeTotal} aptitude questions; found ${aptitudeQuestions.length}.`,
    );
  }

  // ---------------------------------
  // INTERESTS: TOTAL COUNT
  // ---------------------------------

  if (
    interestQuestions.length !==
    ASSESSMENT_CONFIG.interestTotal
  ) {
    errors.push(
      `Expected ${ASSESSMENT_CONFIG.interestTotal} interest questions; found ${interestQuestions.length}.`,
    );
  }

  // ---------------------------------
  // VALIDATE APTITUDE QUESTIONS
  // ---------------------------------

  for (const question of aptitudeQuestions) {
    if (!question.id || ids.has(question.id)) {
      errors.push(
        `Missing or duplicate question ID: ${question.id}`,
      );
    }

    ids.add(question.id);

    if (!isAptitudeCategory(question.category)) {
      errors.push(
        `Invalid category for ${question.id}.`,
      );
    }

    if (!question.prompt.trim()) {
      errors.push(
        `Missing prompt for ${question.id}.`,
      );
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length < 2
    ) {
      errors.push(
        `Insufficient options for ${question.id}.`,
      );

      continue;
    }

    const optionIds = question.options.map(
      (option) => option.id,
    );

    if (
      new Set(optionIds).size !== optionIds.length ||
      optionIds.some((id) => !id)
    ) {
      errors.push(
        `Invalid option IDs for ${question.id}.`,
      );
    }

    if (
      question.options.some(
        (option) => !option.text.trim(),
      )
    ) {
      errors.push(
        `Empty option text for ${question.id}.`,
      );
    }

    if (
      !optionIds.includes(question.correctOptionId)
    ) {
      errors.push(
        `Invalid correct answer for ${question.id}.`,
      );
    }
  }

  // ---------------------------------
  // APTITUDE: CATEGORY COUNTS
  // ---------------------------------

  for (const category of APTITUDE_CATEGORIES) {
    const count = aptitudeQuestions.filter(
      (question) => question.category === category,
    ).length;

    if (
      count !==
      ASSESSMENT_CONFIG.aptitudePerCategory
    ) {
      errors.push(
        `${category} needs ${ASSESSMENT_CONFIG.aptitudePerCategory} questions; found ${count}.`,
      );
    }
  }

  // ---------------------------------
  // VALIDATE INTEREST STATEMENTS
  // ---------------------------------

  for (const question of interestQuestions) {
    if (!question.id || ids.has(question.id)) {
      errors.push(
        `Missing or duplicate question ID: ${question.id}`,
      );
    }

    ids.add(question.id);

    if (!isInterestDimension(question.dimension)) {
      errors.push(
        `Invalid dimension for ${question.id}.`,
      );
    }

    if (!question.prompt.trim()) {
      errors.push(
        `Missing prompt for ${question.id}.`,
      );
    }
  }

  // ---------------------------------
  // INTEREST: DIMENSION COUNTS
  // ---------------------------------

  for (const dimension of INTEREST_DIMENSIONS) {
    const count = interestQuestions.filter(
      (question) => question.dimension === dimension,
    ).length;

    if (
      count !==
      ASSESSMENT_CONFIG.interestPerDimension
    ) {
      errors.push(
        `${dimension} needs ${ASSESSMENT_CONFIG.interestPerDimension} questions; found ${count}.`,
      );
    }
  }

  return errors;
}

/**
 * Score aptitude and interest responses.
 *
 * Call this from the server-side assessment
 * API only. Do not expose the aptitude answer
 * key in student-facing responses.
 */
export function scoreCareerAssessment(
  aptitudeQuestions: AptitudeQuestion[],
  interestQuestions: InterestQuestion[],
  answers: AssessmentAnswers,
): CareerAssessmentResult {
  const aptitudeMap = new Map(
    aptitudeQuestions.map((question) => [
      question.id,
      question,
    ]),
  );

  const interestMap = new Map(
    interestQuestions.map((question) => [
      question.id,
      question,
    ]),
  );

  const aptitudeAnswers = new Map<string, string>();
  const interestAnswers = new Map<string, number>();

  // ---------------------------------
  // NORMALIZE APTITUDE ANSWERS
  // ---------------------------------

  for (const answer of answers.aptitude) {
    const question = aptitudeMap.get(
      answer.questionId,
    );

    if (
      !question ||
      !question.options.some(
        (option) => option.id === answer.optionId,
      )
    ) {
      continue;
    }

    aptitudeAnswers.set(
      answer.questionId,
      answer.optionId,
    );
  }

  // ---------------------------------
  // NORMALIZE INTEREST ANSWERS
  // ---------------------------------

  for (const answer of answers.interests) {
    if (
      !interestMap.has(answer.questionId) ||
      !Number.isInteger(answer.rating) ||
      answer.rating <
        ASSESSMENT_CONFIG.interestMin ||
      answer.rating >
        ASSESSMENT_CONFIG.interestMax
    ) {
      continue;
    }

    interestAnswers.set(
      answer.questionId,
      answer.rating,
    );
  }

  // ---------------------------------
  // SCORE APTITUDE CATEGORIES
  // ---------------------------------

  const categoryResults: AptitudeCategoryResult[] =
    APTITUDE_CATEGORIES.map((category) => {
      const questions = aptitudeQuestions.filter(
        (question) =>
          question.category === category,
      );

      const answered = questions.filter(
        (question) =>
          aptitudeAnswers.has(question.id),
      ).length;

      const correct = questions.filter(
        (question) =>
          aptitudeAnswers.get(question.id) ===
          question.correctOptionId,
      ).length;

      return {
        category,
        label: APTITUDE_CATEGORY_LABELS[category],
        total: questions.length,
        answered,
        correct,
        incorrect: answered - correct,
        unanswered: questions.length - answered,
        percentage: percentage(
          correct,
          questions.length,
        ),
      };
    });

  const totalCorrect = categoryResults.reduce(
    (sum, result) => sum + result.correct,
    0,
  );

  const totalAnswered = categoryResults.reduce(
    (sum, result) => sum + result.answered,
    0,
  );

  // ---------------------------------
  // SCORE INTEREST DIMENSIONS
  // ---------------------------------

  const dimensionResults: InterestDimensionResult[] =
    INTEREST_DIMENSIONS.map((dimension) => {
      const questions = interestQuestions.filter(
        (question) =>
          question.dimension === dimension,
      );

      const values = questions.flatMap(
        (question) => {
          const rating = interestAnswers.get(
            question.id,
          );

          if (rating === undefined) {
            return [];
          }

          return [
            question.reverseScored
              ? 6 - rating
              : rating,
          ];
        },
      );

      const answered = values.length;

      const average =
        answered > 0
          ? values.reduce(
              (sum, value) => sum + value,
              0,
            ) / answered
          : null;

      return {
        dimension,
        label:
          INTEREST_DIMENSION_LABELS[dimension],
        answered,
        total: questions.length,
        average:
          average === null
            ? null
            : Math.round(average * 100) / 100,
        percentage:
          average === null
            ? null
            : Math.round(
                ((average - 1) / 4) * 100,
              ),
      };
    });

  // ---------------------------------
  // ASSESSMENT COMPLETION
  // ---------------------------------

  const allInterestsCompleted =
    dimensionResults.every(
      (result) =>
        result.answered === result.total &&
        result.total > 0,
    );

  const completed =
    totalAnswered === aptitudeQuestions.length &&
    aptitudeQuestions.length > 0 &&
    allInterestsCompleted;

  // ---------------------------------
  // LEADING INTEREST AREAS
  // ---------------------------------

  const rankedDimensions = [
    ...dimensionResults,
  ]
    .filter(
      (result) => result.average !== null,
    )
    .sort(
      (a, b) =>
        (b.average ?? 0) -
        (a.average ?? 0),
    );

  const leadingAreas = allInterestsCompleted
    ? rankedDimensions
        .slice(0, 3)
        .map(
          (result) => result.dimension,
        )
    : [];

  // ---------------------------------
  // FINAL RESULTS
  // ---------------------------------

  return {
    version: ASSESSMENT_CONFIG.version,
    completed,

    aptitude: {
      correct: totalCorrect,
      total: aptitudeQuestions.length,
      answered: totalAnswered,
      unanswered:
        aptitudeQuestions.length -
        totalAnswered,
      percentage: percentage(
        totalCorrect,
        aptitudeQuestions.length,
      ),
      categories: categoryResults,
    },

    interests: {
      dimensions: dimensionResults,
      leadingAreas,
    },

    disclaimer: ASSESSMENT_DISCLAIMER,
  };
}
