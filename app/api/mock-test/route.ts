import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

import { getMockQuizQuestions } from "@/lib/data-store";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Student login is required." }, { status: 401 });
  }
  if ((session.role !== "student" && session.role !== "admin") || (session.status && session.status !== "active")) {
    return NextResponse.json({ error: "Only active student and admin accounts can access mock tests." }, { status: 403 });
  }
  return NextResponse.json({
    questions: await getMockQuizQuestions(),
  });
}
