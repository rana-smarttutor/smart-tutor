
import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  CAREER_ROLES,
  careerCollection,
  parseCareerDetails,
  toCareerRecord,
} from "@/lib/career-counselling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREATE_ROLES = [
  "admin",
  "staff",
  "counsellor",
] as const;

type JsonObject = Record<string, unknown>;

function isObject(
  value: unknown,
): value is JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function safeValue(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 5) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value.slice(0, 4000);
  }

  if (
    typeof value === "boolean" ||
    (typeof value === "number" &&
      Number.isFinite(value))
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 40)
      .map((item) =>
        safeValue(item, depth + 1),
      );
  }

  if (isObject(value)) {
    const result: JsonObject = {};

    for (
      const [key, item] of
      Object.entries(value).slice(0, 80)
    ) {
      if (
        key.startsWith("$") ||
        key.includes(".") ||
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      ) {
        continue;
      }

      result[key] = safeValue(
        item,
        depth + 1,
      );
    }

    return result;
  }

  return null;
}

function normalizeQuestionnaire(
  value: unknown,
):
  | { questionnaire: JsonObject | null }
  | { error: string } {
  // Legacy enquiries may be created without
  // a five-step questionnaire.
  if (
    value === undefined ||
    value === null
  ) {
    return {
      questionnaire: null,
    };
  }

  if (!isObject(value)) {
    return {
      error: "Invalid questionnaire data.",
    };
  }

  if (value.version !== 1) {
    return {
      error:
        "Unsupported counselling questionnaire version.",
    };
  }

  for (const section of [
    "aboutYou",
    "education",
    "interests",
    "routine",
    "consent",
  ]) {
    if (!isObject(value[section])) {
      return {
        error:
          `Questionnaire section "${section}" is missing or invalid.`,
      };
    }
  }

  const aboutYou = value.aboutYou as JsonObject;

  if (
    text(aboutYou.studentName).length < 2
  ) {
    return {
      error:
        "Questionnaire student name is required.",
    };
  }

  if (
    !text(aboutYou.educationStage)
  ) {
    return {
      error:
        "Questionnaire education stage is required.",
    };
  }

  // Do not accept arbitrarily large form data.
  const serialized = JSON.stringify(value);

  if (serialized.length > 100_000) {
    return {
      error:
        "Questionnaire is too large.",
    };
  }

  const clean = safeValue(value);

  if (!isObject(clean)) {
    return {
      error: "Invalid questionnaire data.",
    };
  }

  return {
    questionnaire: clean,
  };
}

async function authenticated() {
  const session =
    await getSessionUser();

  return session &&
    hasAnyRole(
      session,
      CAREER_ROLES,
    ) &&
    (
      !session.status ||
      session.status === "active"
    )
    ? session
    : null;
}

export async function GET() {
  try {
    const session =
      await authenticated();

    if (!session) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    const collection =
      await careerCollection();

    const records = await collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .limit(200)
      .toArray();

    return NextResponse.json(
      {
        records: records.map((doc) => {
          const record =
            toCareerRecord(doc);

          const source =
            doc as unknown as {
              questionnaire?: unknown;
            };

          return {
            ...record,
            questionnaire:
              source.questionnaire ??
              null,
          };
        }),

        canDelete:
          session.role === "admin",

        canCreate:
          CREATE_ROLES.some(
            (role) =>
              role === session.role,
          ),
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Career counselling GET failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load counselling records.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const session =
      await authenticated();

    if (
      !session ||
      !CREATE_ROLES.some(
        (role) =>
          role === session.role,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only admin, staff and counsellors can create career counselling entries.",
        },
        {
          status: 403,
        },
      );
    }

    const payload: unknown =
      await request
        .json()
        .catch(() => null);

    if (!isObject(payload)) {
      return NextResponse.json(
        {
          error:
            "Invalid counselling request body.",
        },
        {
          status: 400,
        },
      );
    }

    const details =
      parseCareerDetails(payload);

    if (
      !details.studentName ||
      !details.classLevel ||
      !details.parentWhatsapp
    ) {
      return NextResponse.json(
        {
          error:
            "Student name, class/level and parent WhatsApp number are required.",
        },
        {
          status: 400,
        },
      );
    }

    const normalized =
      normalizeQuestionnaire(
        payload.questionnaire,
      );

    if ("error" in normalized) {
      return NextResponse.json(
        {
          error: normalized.error,
        },
        {
          status: 400,
        },
      );
    }

    const questionnaire =
      normalized.questionnaire;

    if (questionnaire) {
      const aboutYou =
        questionnaire.aboutYou as JsonObject;

      if (
        text(aboutYou.studentName)
          .toLowerCase() !==
        details.studentName
          .trim()
          .toLowerCase()
      ) {
        return NextResponse.json(
          {
            error:
              "Student name does not match the questionnaire.",
          },
          {
            status: 400,
          },
        );
      }

      const consent =
        questionnaire.consent as JsonObject;

      // Consent on the flat dashboard record
      // must match the saved questionnaire.
      if (
        details.aiConsent !==
          (consent.aiConsent === true) ||
        details.whatsappConsent !==
          (consent.whatsappConsent === true)
      ) {
        return NextResponse.json(
          {
            error:
              "Counselling consent values do not match the submitted questionnaire.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        aboutYou.privacyAccepted !== true
      ) {
        return NextResponse.json(
          {
            error:
              "Privacy acceptance is required for the five-step questionnaire.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        typeof aboutYou.dateOfBirth ===
          "string" &&
        aboutYou.dateOfBirth !==
          details.dateOfBirth
      ) {
        return NextResponse.json(
          {
            error:
              "Date of birth does not match the questionnaire.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const now =
      new Date().toISOString();

    const collection =
      await careerCollection();

    const record = {
      ...details,

      // Save all original wizard answers.
      questionnaire,

      aiSuggestion: "",
      aiReviewed: false,

      createdBy: session.id,
      createdByName:
        session.name || "Institute Staff",
      updatedBy: session.id,

      createdAt: now,
      updatedAt: now,
    };

    const result =
      await collection.insertOne(
        record,
      );

    const savedRecord =
      toCareerRecord({
        ...record,
        _id: result.insertedId,
      });

    return NextResponse.json(
      {
        record: {
          ...savedRecord,
          questionnaire,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Career counselling POST failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save counselling enquiry.",
      },
      {
        status: 500,
      },
    );
  }
}
