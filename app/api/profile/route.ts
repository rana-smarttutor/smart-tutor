import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { findUserDocumentByEmail, updateUserRecord } from "@/lib/data-store";
import { sanitizeTextInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: {
    name?: string;
    profilePhoto?: string | null;
    mobile?: string;
    dob?: string;
    gender?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const updateData: {
    name?: string;
    profilePhoto?: string | null;
    profile?: Record<string, string>;
  } = {};

  if (body.name !== undefined) {
    const name = sanitizeTextInput(body.name, 60);
    if (name) updateData.name = name;
  }

  if (body.profilePhoto !== undefined) {
    updateData.profilePhoto = body.profilePhoto || null;
  }

  const profileFields: Record<string, string | undefined> = {};
  if (body.dob !== undefined) profileFields.dob = body.dob;
  if (body.gender !== undefined) profileFields.gender = body.gender;
  if (body.addressLine1 !== undefined) profileFields.addressLine1 = body.addressLine1;
  if (body.addressLine2 !== undefined) profileFields.addressLine2 = body.addressLine2;
  if (body.city !== undefined) profileFields.city = body.city;
  if (body.state !== undefined) profileFields.state = body.state;
  if (body.pincode !== undefined) profileFields.pincode = body.pincode;

  const hasProfileUpdates = Object.values(profileFields).some((v) => v !== undefined);
  if (hasProfileUpdates) {
    const cleaned: Record<string, string> = {};
    for (const [key, val] of Object.entries(profileFields)) {
      if (val !== undefined) cleaned[key] = val;
    }
    updateData.profile = cleaned;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const existingUser = await findUserDocumentByEmail(session.email);
  if (!existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updatedUser = await updateUserRecord({
    id: session.id,
    name: updateData.name ?? existingUser.name,
    email: existingUser.email,
    role: existingUser.role as any,
    password: existingUser.password,
    program: existingUser.program,
    profilePhoto: updateData.profilePhoto,
    profile: updateData.profile as any,
  });

  return NextResponse.json({ user: updatedUser }, { status: 200 });
}
