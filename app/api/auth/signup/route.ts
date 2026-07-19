import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import {
  createUserRecord,
  findUserDocumentByEmail,
  findUserDocumentByMobile,
} from "@/lib/data-store";
import {
  sanitizeEmailInput,
  sanitizePasswordInput,
  sanitizeTextInput,
  validateEmailFormat,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      role?: string;
      name?: string;
      email?: string;
      password?: string;
      mobile?: string;
      dob?: string;

      parentName?: string;
      parentEmail?: string;
      parentMobile?: string;
      parentPassword?: string;

      courseWanted?: string;
      courseWantedTitle?: string;
      studentType?: string;
      weakSubjects?: string[];
      strongSubjects?: string[];

      latestQualification?: string;
      latestAcademicScore?: string;

      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      profilePhoto?: string;

      confirmPassword?: string;
      qualification?: string;
      cvUrl?: string;
      photoIdFrontUrl?: string;
      photoIdBackUrl?: string;
      experience?: string;
      subjects?: string[];
      examQualifications?: { examName: string; score?: string; year?: string }[];
    };

    const role = body.role === "educator" ? "educator" : "student";

    const name = sanitizeTextInput(body.name, 100);
    const email = sanitizeEmailInput(body.email);
    const password = sanitizePasswordInput(body.password);
    const mobile = sanitizeTextInput(body.mobile, 15);
    const dob = sanitizeTextInput(body.dob, 20);

    const addressLine1 = sanitizeTextInput(body.addressLine1, 200);
    const addressLine2 = sanitizeTextInput(body.addressLine2, 200);
    const city = sanitizeTextInput(body.city, 100);
    const state = sanitizeTextInput(body.state, 100);
    const pincode = sanitizeTextInput(body.pincode, 20);

    const parentName = sanitizeTextInput(body.parentName, 100);
    const parentEmail = sanitizeEmailInput(body.parentEmail);
    const parentMobile = sanitizeTextInput(body.parentMobile, 15);
    const parentPassword = sanitizePasswordInput(body.parentPassword);

    if (!name) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 },
      );
    }

    if (!email || !validateEmailFormat(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    if (role === "educator") {
      const confirmPassword = sanitizePasswordInput(body.confirmPassword);

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: "Passwords do not match." },
          { status: 400 },
        );
      }
    }

    if (!mobile || mobile.replace(/[^\d]/g, "").length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
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

    const existingMobile = await findUserDocumentByMobile(mobile);

    if (existingMobile) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists." },
        { status: 409 },
      );
    }

    if (!body.profilePhoto) {
      return NextResponse.json(
        { error: "Profile photo is required." },
        { status: 400 },
      );
    }

    const profile: Record<string, unknown> = {};

    if (dob) profile.dob = dob;
    if (addressLine1) profile.addressLine1 = addressLine1;
    if (addressLine2) profile.addressLine2 = addressLine2;
    if (city) profile.city = city;
    if (state) profile.state = state;
    if (pincode) profile.pincode = pincode;

    profile.profilePhoto = body.profilePhoto;

    if (role === "student") {
      if (!parentEmail || !validateEmailFormat(parentEmail)) {
        return NextResponse.json(
          { error: "Parent email is required and must be valid." },
          { status: 400 },
        );
      }

      if (!parentMobile || parentMobile.replace(/[^\d]/g, "").length < 10) {
        return NextResponse.json(
          { error: "Parent mobile number is required and must be 10 digits." },
          { status: 400 },
        );
      }

      if (!parentPassword || parentPassword.length < 6) {
        return NextResponse.json(
          { error: "Parent password must be at least 6 characters." },
          { status: 400 },
        );
      }

      profile.parentEmail = parentEmail;
      profile.parentMobile = parentMobile;

      if (parentName) profile.parentName = parentName;

      if (body.courseWanted) {
        profile.courseWanted = sanitizeTextInput(body.courseWanted, 200);
      }

      if (body.courseWantedTitle) {
        profile.courseWantedTitle = sanitizeTextInput(
          body.courseWantedTitle,
          200,
        );
      }

      if (body.studentType === "online" || body.studentType === "centre-based") {
        profile.studentType = body.studentType;
      }

      if (body.weakSubjects?.length) {
        profile.weakSubjects = body.weakSubjects
          .slice(0, 10)
          .map((subject) => sanitizeTextInput(subject, 80))
          .filter(Boolean);
      }

      if (body.strongSubjects?.length) {
        profile.strongSubjects = body.strongSubjects
          .slice(0, 10)
          .map((subject) => sanitizeTextInput(subject, 80))
          .filter(Boolean);
      }

      if (body.latestQualification) {
        profile.latestQualification = sanitizeTextInput(
          body.latestQualification,
          100,
        );
      }

      if (body.latestAcademicScore) {
        profile.latestAcademicScore = sanitizeTextInput(
          body.latestAcademicScore,
          50,
        );
      }
    }

    if (role === "educator") {
      const qualification = sanitizeTextInput(body.qualification, 200);

      if (!qualification) {
        return NextResponse.json(
          { error: "Qualification is required for educators." },
          { status: 400 },
        );
      }

      profile.qualification = qualification;

      if (!body.cvUrl) {
        return NextResponse.json(
          { error: "Resume / CV is required for educators." },
          { status: 400 },
        );
      }

      profile.cvUrl = body.cvUrl;

      if (!body.photoIdFrontUrl) {
        return NextResponse.json(
          { error: "Photo ID front image is required for educators." },
          { status: 400 },
        );
      }

      profile.photoIdFrontUrl = body.photoIdFrontUrl;

      if (!body.photoIdBackUrl) {
        return NextResponse.json(
          { error: "Photo ID back image is required for educators." },
          { status: 400 },
        );
      }

      profile.photoIdBackUrl = body.photoIdBackUrl;

      if (body.experience) {
        profile.experience = sanitizeTextInput(body.experience, 100);
      }

      if (body.subjects?.length) {
        profile.subjects = body.subjects
          .slice(0, 20)
          .map((subject) => sanitizeTextInput(subject, 80))
          .filter(Boolean);
      }

      if (body.examQualifications?.length) {
        profile.examQualifications = body.examQualifications
          .slice(0, 20)
          .filter((eq) => eq.examName)
          .map((eq) => ({
            examName: sanitizeTextInput(eq.examName, 100) || "",
            score: eq.score ? sanitizeTextInput(eq.score, 50) : "",
            year: eq.year ? sanitizeTextInput(eq.year, 10) : "",
          }))
          .filter((eq) => eq.examName);
      }
    }

    const status = role === "student" ? "active" : "pending";

    const user = await createUserRecord({
      name,
      email,
      password,
      mobile,
      role,
      program: body.courseWanted || "general",
      status,
      profile: profile as import("@/lib/types").UserProfile,
    });

    if (role === "student" && parentEmail) {
      const parentAccountName = parentName || `Parent of ${name}`;
      const existingParentEmail = await findUserDocumentByEmail(parentEmail);

      if (!existingParentEmail) {
        await createUserRecord({
          name: parentAccountName,
          email: parentEmail,
          mobile: parentMobile || mobile,
          role: "parent",
          password: parentPassword,
          program: "parent",
          status: "active",
          linkedStudentId: user.id,
          linkedStudentMobile: mobile,
        });
      }
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      label: user.label,
      status: user.status,
      verified: user.verified,
    };

    if (role === "student") {
      const sessionResponse = createSessionResponse(sessionUser);

      const finalResponse = NextResponse.json({
        user: sessionUser,
        message: "Student account created successfully.",
        redirectTo: "/dashboard",
      });

      const setCookieHeader = sessionResponse.headers.get("set-cookie");

      if (setCookieHeader) {
        finalResponse.headers.set("set-cookie", setCookieHeader);
      }

      return finalResponse;
    }

    return NextResponse.json({
      user: sessionUser,
      message:
        "Faculty registration submitted for admin approval. You will be notified once your account is activated.",
      redirectTo: "/application-submitted",
    });
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      },
      { status: 500 },
    );
  }
}