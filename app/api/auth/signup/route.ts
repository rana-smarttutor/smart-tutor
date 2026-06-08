import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import {
  createUserRecord,
  findUserDocumentByEmail,
  findUserDocumentByMobile,
} from "@/lib/data-store";
import { sanitizePasswordInput, sanitizeTextInput } from "@/lib/validation";

function normalizeMobile(value?: string) {
  return sanitizeTextInput(value, 20).replace(/[^\d]/g, "").slice(-10);
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    course?: string;
    email?: string;
    studentMobile?: string;
    parentMobile?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as {
      name?: string;
      course?: string;
      email?: string;
      studentMobile?: string;
      parentMobile?: string;
      password?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid signup payload." },
      { status: 400 },
    );
  }

  const name = sanitizeTextInput(body.name, 80);
  const course = sanitizeTextInput(body.course, 120);
  const email = sanitizeTextInput(body.email, 120).toLowerCase();
  const studentMobile = normalizeMobile(body.studentMobile);
  const parentMobile = normalizeMobile(body.parentMobile);
  const password = sanitizePasswordInput(body.password);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (
  !name ||
  !course ||
  !email ||
  !studentMobile ||
  !parentMobile ||
  !password
) {
  return NextResponse.json(
    {
      error:
        "All signup fields are required. Please fill student name, course, email, student number, parent number and password.",
    },
    { status: 400 },
  );
}

if (!emailRegex.test(email)) {
  return NextResponse.json(
    { error: "Please enter a valid student email address." },
    { status: 400 },
  );
}

if (studentMobile.length !== 10) {
  return NextResponse.json(
    { error: "Please enter a valid 10-digit student mobile number." },
    { status: 400 },
  );
}

if (parentMobile.length !== 10) {
  return NextResponse.json(
    { error: "Please enter a valid 10-digit parent mobile number." },
    { status: 400 },
  );
}

if (password.length < 6) {
  return NextResponse.json(
    { error: "Password must be at least 6 characters long." },
    { status: 400 },
  );
}
  if (studentMobile.length !== 10 || parentMobile.length !== 10) {
    return NextResponse.json(
      { error: "Please enter valid 10-digit mobile numbers." },
      { status: 400 },
    );
  }

  const existingEmail = await findUserDocumentByEmail(email);

  if (existingEmail) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const existingMobile = await findUserDocumentByMobile(studentMobile);

  if (existingMobile) {
    return NextResponse.json(
      { error: "An account with this student mobile number already exists." },
      { status: 409 },
    );
  }

  const user = await createUserRecord({
    name,
    email,
    mobile: studentMobile,
    parentMobile,
    role: "student",
    password,
    program: course,
    status: "active",
  });

  return createSessionResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    label: user.label,
  });
}