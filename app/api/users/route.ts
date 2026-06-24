import { NextResponse } from "next/server";

import { getSessionUser, hasAnyRole } from "@/lib/auth";
import { createUserRecord, findUserDocumentByEmail, getStudentDirectory, getUsersForAdmin, updateUserRecord } from "@/lib/data-store";
import { sanitizeEmailInput, sanitizePasswordInput, sanitizeRoleInput, sanitizeTextInput, validateEmailFormat } from "@/lib/validation";

export async function GET() {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admins can access user management." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    users: await getUsersForAdmin(),
    students: await getStudentDirectory(),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admins can create new accounts." },
      { status: 403 },
    );
  }

  let body: {
    name?: string;
    email?: string;
    role?: string;
    password?: string;
    program?: string;
    status?: "active" | "pending";
    confirm?: boolean;
    linkedStudentId?: string;
  };

  try {
    body = (await request.json()) as {
      name?: string;
      email?: string;
      role?: string;
      password?: string;
      program?: string;
      status?: "active" | "pending";
      confirm?: boolean;
      linkedStudentId?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid user payload." }, { status: 400 });
  }

  const name = sanitizeTextInput(body.name, 60);
  const email = sanitizeEmailInput(body.email);
  const role = sanitizeRoleInput(body.role);
  const password = sanitizePasswordInput(body.password);
  const program = sanitizeTextInput(body.program, 60);

  if (!body.confirm) {
    return NextResponse.json(
      { error: "Confirm the new account details before creating the entry." },
      { status: 400 },
    );
  }

  if (
    !name || !email || !role || !password || !validateEmailFormat(email) ||
    (role !== "parent" && !program)
  ) {
    return NextResponse.json(
      { error: "Enter valid account details before creating a new user." },
      { status: 400 },
    );
  }

  if (role === "parent" && !body.linkedStudentId) {
    return NextResponse.json(
      { error: "Select a student to link this parent account with." },
      { status: 400 },
    );
  }

  const existingUser = await findUserDocumentByEmail(email);

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const user = await createUserRecord({
    name,
    email,
    role,
    password,
    program,
    status: body.status,
    linkedStudentId: role === "parent" ? body.linkedStudentId : undefined,
  });

  return NextResponse.json({ user }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();

  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json(
      { error: "Only admins can edit account details." },
      { status: 403 },
    );
  }

  let body: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    password?: string;
    program?: string;
    status?: "active" | "pending";
  };

  try {
    body = (await request.json()) as {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      password?: string;
      program?: string;
      status?: "active" | "pending";
    };
  } catch {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  const name = sanitizeTextInput(body.name, 60);
  const email = sanitizeEmailInput(body.email);
  const role = sanitizeRoleInput(body.role);
  const password = sanitizePasswordInput(body.password);
  const program = sanitizeTextInput(body.program, 60);

  if (!name || !email || !role || !password || !program || !validateEmailFormat(email)) {
    return NextResponse.json(
      { error: "Enter valid account details before updating this user." },
      { status: 400 },
    );
  }

  const duplicateUser = await findUserDocumentByEmail(email);

  if (duplicateUser && duplicateUser.id !== body.id) {
    return NextResponse.json(
      { error: "Another account already uses this email address." },
      { status: 409 },
    );
  }

  if (!body.id) {
    return NextResponse.json({ error: "User id is required for updates." }, { status: 400 });
  }

  const updatedUser = await updateUserRecord({
    id: body.id,
    name,
    email,
    role,
    password,
    program,
    status: body.status,
  });

  return NextResponse.json(
    {
      user: updatedUser,
    },
    { status: 200 },
  );
}
