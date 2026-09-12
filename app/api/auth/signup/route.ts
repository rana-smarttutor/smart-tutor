import { NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import {
  createEducatorReferral,
  validateEducatorReferralCode,
} from "@/lib/reward-store";
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
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicSignupRole = "student" | "educator" | "staff";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      role?: string;

      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      mobile?: string;
      dob?: string;

      parentName?: string;
      parentEmail?: string;
      parentMobile?: string;
      parentPassword?: string;

      courseWanted?: string;
      courseWantedTitle?: string;
      studentType?: string;
      campusLocation?: string;
      referralCode?: string;

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

      // Faculty
      qualification?: string;
      experience?: string;
      subjects?: string[];
      examQualifications?: {
        examName: string;
        score?: string;
        year?: string;
      }[];

      // Staff
      designation?: string;
      department?: string;
      branch?: string;
      employmentType?: string;
      joiningDate?: string;

      // Employee verification documents
      cvUrl?: string;
      photoIdFrontUrl?: string;
      photoIdBackUrl?: string;
    };

    /*
     * ---------------------------------------------------------
     * ROLE
     * ---------------------------------------------------------
     */

    if (
      body.role !== "student" &&
      body.role !== "educator" &&
      body.role !== "staff"
    ) {
      return NextResponse.json(
        {
          error: "Please select a valid registration role.",
        },
        { status: 400 },
      );
    }

    const role: PublicSignupRole = body.role;

    /*
     * ---------------------------------------------------------
     * COMMON DETAILS
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * STUDENT / PARENT DETAILS
     * ---------------------------------------------------------
     */

    const parentName = sanitizeTextInput(body.parentName, 100);
    const parentEmail = sanitizeEmailInput(body.parentEmail);
    const parentMobile = sanitizeTextInput(body.parentMobile, 15);
    const parentPassword = sanitizePasswordInput(body.parentPassword);

    const referralCode =
      role === "student"
        ? sanitizeTextInput(body.referralCode, 40)
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, "")
        : "";

    /*
     * ---------------------------------------------------------
     * COMMON VALIDATION
     * ---------------------------------------------------------
     */

    if (!name) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        { status: 400 },
      );
    }

    if (!email || !validateEmailFormat(email)) {
      return NextResponse.json(
        {
          error: "A valid email address is required.",
        },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 },
      );
    }

    /*
     * Faculty and Staff both require password confirmation.
     */
    if (role === "educator" || role === "staff") {
      const confirmPassword = sanitizePasswordInput(body.confirmPassword);

      if (password !== confirmPassword) {
        return NextResponse.json(
          {
            error: "Passwords do not match.",
          },
          { status: 400 },
        );
      }
    }

    if (!mobile || mobile.replace(/[^\d]/g, "").length < 10) {
      return NextResponse.json(
        {
          error: "A valid 10-digit mobile number is required.",
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * DUPLICATE ACCOUNT CHECK
     * ---------------------------------------------------------
     */

    const existingEmail = await findUserDocumentByEmail(email);

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const existingMobile = await findUserDocumentByMobile(mobile);

    if (existingMobile) {
      return NextResponse.json(
        {
          error: "An account with this mobile number already exists.",
        },
        { status: 409 },
      );
    }

    /*
     * ---------------------------------------------------------
     * PROFILE PHOTO
     * ---------------------------------------------------------
     */

    if (!body.profilePhoto) {
      return NextResponse.json(
        {
          error: "Profile photo is required.",
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * BASE PROFILE
     * ---------------------------------------------------------
     */

    const profile: Record<string, unknown> = {};

    if (dob) {
      profile.dob = dob;
    }

    if (addressLine1) {
      profile.addressLine1 = addressLine1;
    }

    if (addressLine2) {
      profile.addressLine2 = addressLine2;
    }

    if (city) {
      profile.city = city;
    }

    if (state) {
      profile.state = state;
    }

    if (pincode) {
      profile.pincode = pincode;
    }

    profile.profilePhoto = body.profilePhoto;

    /*
     * =========================================================
     * STUDENT REGISTRATION
     * =========================================================
     */

    if (role === "student") {
      if (!parentEmail || !validateEmailFormat(parentEmail)) {
        return NextResponse.json(
          {
            error: "Parent email is required and must be valid.",
          },
          { status: 400 },
        );
      }

      if (!parentMobile || parentMobile.replace(/[^\d]/g, "").length < 10) {
        return NextResponse.json(
          {
            error: "Parent mobile number is required and must be 10 digits.",
          },
          { status: 400 },
        );
      }

      if (!parentPassword || parentPassword.length < 6) {
        return NextResponse.json(
          {
            error: "Parent password must be at least 6 characters.",
          },
          { status: 400 },
        );
      }

      /*
       * Referral
       */
      if (referralCode) {
        const validReferral =
          await validateEducatorReferralCode(referralCode);

        if (!validReferral) {
          return NextResponse.json(
            {
              error:
                "The referral code is invalid or inactive. Correct it or leave the field blank.",
            },
            { status: 400 },
          );
        }

        profile.referralCode = validReferral.referralCode;
      }

      /*
       * Parent profile details
       */
      profile.parentEmail = parentEmail;
      profile.parentMobile = parentMobile;

      if (parentName) {
        profile.parentName = parentName;
      }

      /*
       * Course
       */
      if (body.courseWanted) {
        profile.courseWanted = sanitizeTextInput(
          body.courseWanted,
          200,
        );
      }

      if (body.courseWantedTitle) {
        profile.courseWantedTitle = sanitizeTextInput(
          body.courseWantedTitle,
          200,
        );
      }

      /*
       * Student Type
       */
      const studentType = sanitizeTextInput(
        body.studentType,
        30,
      );

      if (
        studentType !== "online" &&
        studentType !== "campus" &&
        studentType !== "home"
      ) {
        return NextResponse.json(
          {
            error: "Please select a valid student type.",
          },
          { status: 400 },
        );
      }

      profile.studentType = studentType;

      /*
       * Campus
       */
      if (studentType === "campus") {
        const campusLocation = sanitizeTextInput(
          body.campusLocation,
          50,
        );

        if (
          campusLocation !== "vashi" &&
          campusLocation !== "panvel"
        ) {
          return NextResponse.json(
            {
              error: "Please select a valid campus location.",
            },
            { status: 400 },
          );
        }

        profile.campusLocation = campusLocation;
      }

      /*
       * Weak Subjects
       */
      if (body.weakSubjects?.length) {
        profile.weakSubjects = body.weakSubjects
          .slice(0, 10)
          .map((subject) =>
            sanitizeTextInput(subject, 80),
          )
          .filter(Boolean);
      }

      /*
       * Strong Subjects
       */
      if (body.strongSubjects?.length) {
        profile.strongSubjects = body.strongSubjects
          .slice(0, 10)
          .map((subject) =>
            sanitizeTextInput(subject, 80),
          )
          .filter(Boolean);
      }

      /*
       * Previous Academic Details
       */
      if (body.latestQualification) {
        profile.latestQualification =
          sanitizeTextInput(
            body.latestQualification,
            100,
          );
      }

      if (body.latestAcademicScore) {
        profile.latestAcademicScore =
          sanitizeTextInput(
            body.latestAcademicScore,
            50,
          );
      }
    }

    /*
     * =========================================================
     * FACULTY REGISTRATION
     * =========================================================
     */

    if (role === "educator") {
      const qualification = sanitizeTextInput(
        body.qualification,
        200,
      );

      if (!qualification) {
        return NextResponse.json(
          {
            error:
              "Qualification is required for Faculty registration.",
          },
          { status: 400 },
        );
      }

      profile.qualification = qualification;

      /*
       * Resume
       */
      if (!body.cvUrl) {
        return NextResponse.json(
          {
            error:
              "Resume / CV is required for Faculty registration.",
          },
          { status: 400 },
        );
      }

      profile.cvUrl = body.cvUrl;

      /*
       * Photo ID
       */
      if (!body.photoIdFrontUrl) {
        return NextResponse.json(
          {
            error:
              "Photo ID front image is required for Faculty verification.",
          },
          { status: 400 },
        );
      }

      if (!body.photoIdBackUrl) {
        return NextResponse.json(
          {
            error:
              "Photo ID back image is required for Faculty verification.",
          },
          { status: 400 },
        );
      }

      profile.photoIdFrontUrl =
        body.photoIdFrontUrl;

      profile.photoIdBackUrl =
        body.photoIdBackUrl;

      /*
       * Experience
       */
      if (body.experience) {
        profile.experience = sanitizeTextInput(
          body.experience,
          100,
        );
      }

      /*
       * Subjects
       */
      if (body.subjects?.length) {
        profile.subjects = body.subjects
          .slice(0, 20)
          .map((subject) =>
            sanitizeTextInput(subject, 80),
          )
          .filter(Boolean);
      }

      /*
       * Exam Qualifications
       */
      if (body.examQualifications?.length) {
        profile.examQualifications =
          body.examQualifications
            .slice(0, 20)
            .filter(
              (qualification) =>
                qualification.examName,
            )
            .map((qualification) => ({
              examName:
                sanitizeTextInput(
                  qualification.examName,
                  100,
                ) || "",

              score: qualification.score
                ? sanitizeTextInput(
                    qualification.score,
                    50,
                  )
                : "",

              year: qualification.year
                ? sanitizeTextInput(
                    qualification.year,
                    10,
                  )
                : "",
            }))
            .filter(
              (qualification) =>
                qualification.examName,
            );
      }
    }

    /*
     * =========================================================
     * STAFF REGISTRATION
     * =========================================================
     */

    if (role === "staff") {
      const designation = sanitizeTextInput(
        body.designation,
        100,
      );

      const department = sanitizeTextInput(
        body.department,
        100,
      );

      const branch = sanitizeTextInput(
        body.branch,
        100,
      );

      const employmentType = sanitizeTextInput(
        body.employmentType,
        30,
      );

      const joiningDate = sanitizeTextInput(
        body.joiningDate,
        20,
      );

      /*
       * Designation
       */
      if (!designation) {
        return NextResponse.json(
          {
            error:
              "Designation is required for Staff registration.",
          },
          { status: 400 },
        );
      }

      /*
       * Department
       */
      if (!department) {
        return NextResponse.json(
          {
            error:
              "Department is required for Staff registration.",
          },
          { status: 400 },
        );
      }

      /*
       * Branch
       */
      if (!branch) {
        return NextResponse.json(
          {
            error:
              "Branch is required for Staff registration.",
          },
          { status: 400 },
        );
      }

      /*
       * Employment Type
       *
       * Must match UserProfile employmentType values.
       */
      const validEmploymentTypes = [
        "full_time",
        "part_time",
        "contractual",
        "hourly",
      ];

      if (
        employmentType &&
        !validEmploymentTypes.includes(
          employmentType,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Please select a valid employment type.",
          },
          { status: 400 },
        );
      }

      /*
       * Resume
       */
      if (!body.cvUrl) {
        return NextResponse.json(
          {
            error:
              "Resume / CV is required for Staff registration.",
          },
          { status: 400 },
        );
      }

      /*
       * Photo ID
       */
      if (!body.photoIdFrontUrl) {
        return NextResponse.json(
          {
            error:
              "Photo ID front image is required for Staff verification.",
          },
          { status: 400 },
        );
      }

      if (!body.photoIdBackUrl) {
        return NextResponse.json(
          {
            error:
              "Photo ID back image is required for Staff verification.",
          },
          { status: 400 },
        );
      }

      /*
       * Save Staff profile
       */
      profile.designation = designation;
      profile.department = department;
      profile.branch = branch;

      profile.employmentType =
        employmentType || "full_time";

      if (joiningDate) {
        profile.joiningDate = joiningDate;
      }

      profile.cvUrl = body.cvUrl;

      profile.photoIdFrontUrl =
        body.photoIdFrontUrl;

      profile.photoIdBackUrl =
        body.photoIdBackUrl;
    }

    /*
     * =========================================================
     * ACCOUNT STATUS
     * =========================================================
     *
     * Student:
     * active immediately
     *
     * Faculty:
     * pending until Admin verification
     *
     * Staff:
     * pending until Admin verification
     */

    const status =
      role === "student"
        ? "active"
        : "pending";

    /*
     * =========================================================
     * PROGRAM VALUE
     * =========================================================
     */

    const program =
      role === "student"
        ? body.courseWanted || "general"
        : role === "educator"
          ? "faculty"
          : "staff";

    /*
     * =========================================================
     * CREATE USER
     * =========================================================
     */

    const user = await createUserRecord({
      name,
      email,
      password,
      mobile,
      role,
      program,
      status,
      profile:
        profile as import("@/lib/types").UserProfile,
    });

    /*
     * =========================================================
     * STUDENT REFERRAL RECORD
     * =========================================================
     */

    if (
      role === "student" &&
      referralCode
    ) {
      await createEducatorReferral({
        referralCode,

        studentId: user.id,
        studentName: user.name,
        studentEmail: user.email,
        studentMobile: mobile,

        programId:
          typeof profile.courseWanted ===
          "string"
            ? profile.courseWanted
            : undefined,

        programTitle:
          typeof profile.courseWantedTitle ===
          "string"
            ? profile.courseWantedTitle
            : undefined,
      });
    }

    /*
     * =========================================================
     * CREATE PARENT ACCOUNT
     * =========================================================
     */

    if (
      role === "student" &&
      parentEmail
    ) {
      const parentAccountName =
        parentName || `Parent of ${name}`;

      const existingParentEmail =
        await findUserDocumentByEmail(
          parentEmail,
        );

      if (!existingParentEmail) {
        await createUserRecord({
          name: parentAccountName,
          email: parentEmail,
          mobile:
            parentMobile || mobile,
          role: "parent",
          password: parentPassword,
          program: "parent",
          status: "active",
          linkedStudentId: user.id,
          linkedStudentMobile: mobile,
        });
      }
    }

    /*
     * =========================================================
     * SESSION USER
     * =========================================================
     */

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      label: user.label,
      status: user.status,
      verified: user.verified,
      employeeCode: user.employeeCode,
      facultyCode: user.facultyCode,
    };

    /*
     * =========================================================
     * STUDENT LOGIN IMMEDIATELY
     * =========================================================
     */

    if (role === "student") {
      const sessionResponse =
        createSessionResponse(
          sessionUser,
        );

      const finalResponse =
        NextResponse.json({
          user: sessionUser,

          message:
            "Student account created successfully.",

          redirectTo:
            "/dashboard",
        });

      const setCookieHeader =
        sessionResponse.headers.get(
          "set-cookie",
        );

      if (setCookieHeader) {
        finalResponse.headers.set(
          "set-cookie",
          setCookieHeader,
        );
      }

      await logAction({
        action: "create",
        category: "auth",

        details:
          `User signed up: ${user.email}`,

        path:
          "/api/auth/signup",

        method: "POST",

        request,

        metadata: {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
      });

      return finalResponse;
    }

    /*
     * =========================================================
     * FACULTY / STAFF AUDIT LOG
     * =========================================================
     */

    await logAction({
      action: "create",
      category: "auth",

      details:
        `User signed up: ${user.email}`,

      path:
        "/api/auth/signup",

      method: "POST",

      request,

      metadata: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    });

    /*
     * =========================================================
     * FACULTY / STAFF APPROVAL RESPONSE
     * =========================================================
     *
     * Do NOT create a logged-in session here.
     * Employee account remains pending until Admin approves it.
     */

    return NextResponse.json(
      {
        user: sessionUser,

        message:
          role === "staff"
            ? "Staff registration submitted for admin approval. You will be notified once your account is activated."
            : "Faculty registration submitted for admin approval. You will be notified once your account is activated.",

        redirectTo:
          "/application-submitted",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Signup error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create account. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}