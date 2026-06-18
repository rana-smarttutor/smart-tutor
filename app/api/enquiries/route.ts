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
    const { name, contact, role, courseTitle, courseKey, message } = body;

    if (!name || !contact) {
      return NextResponse.json({ error: "Name and contact are required" }, { status: 400 });
    }

    const enquiry = await createEnquiry({
      name,
      contact,
      role,
      courseTitle,
      courseKey,
      message,
    });

    return NextResponse.json({ success: true, enquiry }, { status: 201 });
  } catch (error) {
    console.error("Enquiry submission error:", error);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
