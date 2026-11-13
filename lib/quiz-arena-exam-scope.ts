/**
 * SmartIQ Institute — Quiz Arena Exam Scope
 *
 * Every paid Quiz Arena subscription belongs to one
 * individual exam or one exact school programme.
 *
 * Price and payment logic are handled separately.
 *
 * IMPORTANT:
 * - Never grant access based only on category.
 * - Never grant access based on a parent exam group.
 * - Preserve existing exam IDs from quiz-arena-config.
 * - Keep Quiz Arena and Mock Test on the same scope.
 */

import {
  competitiveExams,
  getQuizSchoolClasses,
  isQuizExamGroup,
  quizBoardOptions,
  requiresQuizBoard,
  type CompetitiveExam,
  type EducationLevel,
  type QuizBoard,
  type QuizSchoolClass,
} from "@/lib/quiz-arena-config";

/**
 * Canonical subscription identifier.
 *
 * Examples:
 *
 * exam:ssc-cgl
 * exam:ssc-chsl
 * exam:cat
 *
 * school:class-11-12-science:12:mh
 * school:class-11-12-science:12:cbse
 * school:class-11-12-commerce:11:mh
 *
 * Classes 6-8 currently have no board-selection step.
 *
 * school:class-6-8:6
 */

export type QuizArenaExamScopeKey = string;

export type QuizArenaExamScope = {
  key: QuizArenaExamScopeKey;

  examId: CompetitiveExam;

  category: EducationLevel;

  schoolClass: QuizSchoolClass | null;

  board: QuizBoard | null;

  title: string;
};

export type QuizArenaExamScopeInput = {
  exam: unknown;

  level?: unknown;

  schoolClass?: unknown;

  board?: unknown;
};

const BOARD_CODE: Record<QuizBoard, string> = {
  "Maharashtra State Board": "mh",
  CBSE: "cbse",
};

const BOARD_TITLE: Record<QuizBoard, string> = {
  "Maharashtra State Board": "Maharashtra State Board",
  CBSE: "CBSE",
};

/**
 * Look up an actual individual exam.
 *
 * Parent groups such as SSC, Banking, Railway, JEE
 * and NEET are navigation groups, not purchasable
 * subscriptions.
 */
function findIndividualExam(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const exam = competitiveExams.find((item) => item.id === value);

  if (!exam) {
    return null;
  }

  if (isQuizExamGroup(exam.id)) {
    return null;
  }

  return exam;
}

function isValidSchoolClass(value: unknown): value is QuizSchoolClass {
  return (
    value === "6" ||
    value === "7" ||
    value === "8" ||
    value === "9" ||
    value === "10" ||
    value === "11" ||
    value === "12"
  );
}

function isValidBoard(value: unknown): value is QuizBoard {
  return quizBoardOptions.some((board) => board.id === value);
}

/**
 * Create the display title for a school subscription.
 *
 * The board, class and stream remain visible
 * so students know exactly what they purchase.
 */
function getSchoolScopeTitle(
  examId: CompetitiveExam,
  schoolClass: QuizSchoolClass,
  board: QuizBoard | null,
  examTitle: string,
): string {
  const stream =
    examId === "class-11-12-science"
      ? " Science"
      : examId === "class-11-12-commerce"
        ? " Commerce"
        : examId === "class-11-12-arts"
          ? " Arts"
          : "";

  const boardTitle = board ? BOARD_TITLE[board] : "";

  const classTitle = `Class ${schoolClass}${stream}`;

  if (boardTitle) {
    return `${boardTitle} — ${classTitle}`;
  }

  return classTitle || examTitle;
}

/**
 * Resolve and validate the EXACT selected exam.
 *
 * Returns null for:
 *
 * - Unknown exam IDs
 * - Parent exam groups
 * - Mismatched learning categories
 * - Missing class selections
 * - Unsupported classes
 * - Missing required school boards
 * - Unexpected school data on non-school exams
 *
 * Do not trust a scope string sent directly by
 * the browser. Always derive it from validated
 * exam selections.
 */
export function getQuizArenaExamScope(
  input: QuizArenaExamScopeInput,
): QuizArenaExamScope | null {
  const exam = findIndividualExam(input.exam);

  if (!exam) {
    return null;
  }

  if (
    input.level !== undefined &&
    input.level !== null &&
    input.level !== exam.category
  ) {
    return null;
  }

  const allowedClasses = getQuizSchoolClasses(exam.id);

  const hasClassSelection = allowedClasses.length > 0;

  if (hasClassSelection) {
    if (!isValidSchoolClass(input.schoolClass)) {
      return null;
    }

    if (!allowedClasses.includes(input.schoolClass)) {
      return null;
    }

    const schoolClass = input.schoolClass;

    if (requiresQuizBoard(exam.id)) {
      if (!isValidBoard(input.board)) {
        return null;
      }

      const board = input.board;

      const boardCode = BOARD_CODE[board];

      return {
        key: ["school", exam.id, schoolClass, boardCode].join(":"),

        examId: exam.id,

        category: exam.category,

        schoolClass,

        board,

        title: getSchoolScopeTitle(exam.id, schoolClass, board, exam.title),
      };
    }

    // Classes 6-8 do not currently select
    // a board in the existing Quiz Arena.
    if (
      input.board !== undefined &&
      input.board !== null &&
      input.board !== ""
    ) {
      return null;
    }

    return {
      key: ["school", exam.id, schoolClass].join(":"),

      examId: exam.id,

      category: exam.category,

      schoolClass,

      board: null,

      title: getSchoolScopeTitle(exam.id, schoolClass, null, exam.title),
    };
  }

  /**
   * Competitive, government and MBA exams
   * use their existing individual exam ID.
   */
  if (
    input.schoolClass !== undefined &&
    input.schoolClass !== null &&
    input.schoolClass !== ""
  ) {
    return null;
  }

  if (input.board !== undefined && input.board !== null && input.board !== "") {
    return null;
  }

  return {
    key: `exam:${exam.id}`,

    examId: exam.id,

    category: exam.category,

    schoolClass: null,

    board: null,

    title: exam.title,
  };
}

/**
 * Check that an incoming scope key exists
 * in the official Quiz Arena catalogue.
 *
 * This is useful when validating payment orders.
 *
 * The client may supply a key for the chosen exam,
 * but the server must resolve it against this
 * catalogue before creating any order.
 */
export function getQuizArenaExamScopeByKey(
  key: unknown,
): QuizArenaExamScope | null {
  if (typeof key !== "string" || !key || key.length > 200) {
    return null;
  }

  for (const exam of competitiveExams) {
    if (isQuizExamGroup(exam.id)) {
      continue;
    }

    const classes = getQuizSchoolClasses(exam.id);

    if (classes.length === 0) {
      const scope = getQuizArenaExamScope({
        exam: exam.id,
        level: exam.category,
      });

      if (scope?.key === key) {
        return scope;
      }

      continue;
    }

    for (const schoolClass of classes) {
      if (requiresQuizBoard(exam.id)) {
        for (const board of quizBoardOptions) {
          const scope = getQuizArenaExamScope({
            exam: exam.id,
            level: exam.category,
            schoolClass,
            board: board.id,
          });

          if (scope?.key === key) {
            return scope;
          }
        }
      } else {
        const scope = getQuizArenaExamScope({
          exam: exam.id,
          level: exam.category,
          schoolClass,
        });

        if (scope?.key === key) {
          return scope;
        }
      }
    }
  }

  return null;
}

/**
 * Compare two validated subscription scopes.
 *
 * A subscription to one school class,
 * board or exam never unlocks another.
 */
export function isSameQuizArenaExamScope(
  first: QuizArenaExamScope | null,
  second: QuizArenaExamScope | null,
): boolean {
  if (!first || !second) {
    return false;
  }

  return first.key === second.key;
}

/**
 * Return all individually purchasable exams.
 *
 * The frontend can use this to display prices
 * without treating category or group cards
 * as purchasable products.
 */
export function getAllQuizArenaExamScopes(): QuizArenaExamScope[] {
  const scopes: QuizArenaExamScope[] = [];

  for (const exam of competitiveExams) {
    if (isQuizExamGroup(exam.id)) {
      continue;
    }

    const classes = getQuizSchoolClasses(exam.id);

    if (classes.length === 0) {
      const scope = getQuizArenaExamScope({
        exam: exam.id,
        level: exam.category,
      });

      if (scope) {
        scopes.push(scope);
      }

      continue;
    }

    for (const schoolClass of classes) {
      if (requiresQuizBoard(exam.id)) {
        for (const board of quizBoardOptions) {
          const scope = getQuizArenaExamScope({
            exam: exam.id,
            level: exam.category,
            schoolClass,
            board: board.id,
          });

          if (scope) {
            scopes.push(scope);
          }
        }
      } else {
        const scope = getQuizArenaExamScope({
          exam: exam.id,
          level: exam.category,
          schoolClass,
        });

        if (scope) {
          scopes.push(scope);
        }
      }
    }
  }

  return scopes;
}
