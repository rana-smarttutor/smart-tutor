import { NextResponse } from "next/server";
import { createEnquiry, getAllEnquiries } from "@/lib/data-store";
import { getSessionUser, hasAnyRole } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();

  if (!session || !hasAnyRole(session, ["admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const enquiries = await getAllEnquiries();
  return NextResponse.json({ enquiries });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact, role, courseTitle, courseKey, message, suggestedCourses } = body;

    if (!name || !contact) {
      return NextResponse.json({ error: "Name and contact are required" }, { status: 400 });
    }

    const validatedSuggested = Array.isArray(suggestedCourses)
      ? suggestedCourses
          .filter((s: unknown) => s && typeof s === "object")
          .slice(0, 10)
          .map((s: any) => ({
            standardKey: String(s.standardKey ?? "").slice(0, 80),
            title: String(s.title ?? "").slice(0, 120),
          }))
          .filter((s) => s.standardKey && s.title)
      : [];

    const enquiry = await createEnquiry({
      name: String(name).slice(0, 100),
      contact: String(contact).slice(0, 100),
      role: String(role ?? "student").slice(0, 30),
      courseTitle: String(courseTitle ?? "").slice(0, 200),
      courseKey: String(courseKey ?? "").slice(0, 80),
      message: String(message ?? "").slice(0, 500),
      suggestedCourses: validatedSuggested,
    });

    return NextResponse.json({ success: true, enquiry }, { status: 201 });
  } catch (error) {
    console.error("Enquiry submission error:", error);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
