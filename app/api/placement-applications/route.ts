import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createNotifications,
  createPlacementApplication,
  getAdminNotificationRecipientIds,
  getPlacementApplicationsForAdmin,
  getPlacementApplicationsForStudent,
  getPlacementJobById,
  getPlacementStudentProfile,
} from "@/lib/data-store";
import type {
  PlacementApplicationAnswer,
  PlacementJob,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getText(value: unknown, maxLength = 500) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function getSkills(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 80))
        .filter(Boolean),
    ),
  ].slice(0, 30);
}

function getResumeUrl(value: unknown) {
  const url = getText(value, 600);

  if (!url) {
    return {
      value: undefined,
      valid: true,
    };
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        value: undefined,
        valid: false,
      };
    }

    return {
      value: url,
      valid: true,
    };
  } catch {
    return {
      value: undefined,
      valid: false,
    };
  }
}

function getAnswers(
  value: unknown,
  job: PlacementJob,
): {
  answers: PlacementApplicationAnswer[];
  error?: string;
} {
  const submittedAnswers = new Map<string, string>();

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const record = item as Record<string, unknown>;
      const questionId = getText(record.questionId, 160);
      const answer = getText(record.answer, 1500);

      if (questionId) {
        submittedAnswers.set(questionId, answer);
      }
    }
  }

  const answers = job.applicationQuestions.map((question) => {
    const answer = submittedAnswers.get(question.id) || "";

    return {
      questionId: question.id,
      questionLabel: question.label,
      answer,
    };
  });

  const missingQuestion = job.applicationQuestions.find(
    (question) =>
      question.required &&
      !(submittedAnswers.get(question.id) || "").trim(),
  );

  if (missingQuestion) {
    return {
      answers,
      error: `Answer "${missingQuestion.label}" before submitting.`,
    };
  }

  return { answers };
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Login is required." },
      { status: 401 },
    );
  }

  if (session.role === "admin") {
    return NextResponse.json({
      applications: await getPlacementApplicationsForAdmin(),
    });
  }

  if (session.role === "student") {
    return NextResponse.json({
      applications: await getPlacementApplicationsForStudent(session.id),
    });
  }

  return NextResponse.json(
    { error: "Placement applications are only available to students and admins." },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Login is required to apply." },
        { status: 401 },
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        { error: "Only student accounts can apply for placement jobs." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const jobId = getText(body.jobId, 160);
    const phone = getText(body.phone, 25);
    const studentEmail = getText(body.email, 180).toLowerCase();
    const programme = getText(body.programme, 180);
    const skills = getSkills(body.skills);
    const experience = getText(body.experience, 1200);
    const message = getText(body.message, 1500);
    const resume = getResumeUrl(body.resumeUrl);

    if (!jobId || !phone || !studentEmail || !programme) {
      return NextResponse.json(
        {
          error:
            "Phone number, email address, and course/programme are required.",
        },
        { status: 400 },
      );
    }

    if (!isEmail(studentEmail)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (!resume.valid) {
      return NextResponse.json(
        { error: "Resume link must begin with http:// or https://." },
        { status: 400 },
      );
    }

    const job = await getPlacementJobById(jobId);

    if (!job || job.status !== "published") {
      return NextResponse.json(
        { error: "This placement job is unavailable." },
        { status: 404 },
      );
    }

    const deadline = new Date(`${job.deadline}T23:59:59`);

    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "The application deadline for this job has passed." },
        { status: 400 },
      );
    }

    const student = await getPlacementStudentProfile(session.id);

    if (!student) {
      return NextResponse.json(
        { error: "Student profile could not be found." },
        { status: 404 },
      );
    }

    const answerResult = getAnswers(body.answers, job);

    if (answerResult.error) {
      return NextResponse.json(
        { error: answerResult.error },
        { status: 400 },
      );
    }

    const application = await createPlacementApplication({
      job,
      studentId: student.studentId,
      studentName: student.studentName,
      studentEmail,
      phone,
      programme,
      skills,
      resumeUrl: resume.value,
      experience: experience || undefined,
      message: message || undefined,
      answers: answerResult.answers,
    });

    const adminIds = await getAdminNotificationRecipientIds();

    if (adminIds.length > 0) {
      await createNotifications({
        userIds: adminIds,
        title: `New placement application: ${application.studentName}`,
        message: `${application.studentName} applied for ${application.jobRole} at ${application.company}.`,
        type: "placement",
        link: "/dashboard?section=placement-jobs",
      });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to submit placement application.";

    return NextResponse.json(
      { error: message },
      {
        status: message.toLowerCase().includes("already applied")
          ? 409
          : 500,
      },
    );
  }
}