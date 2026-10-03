import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  getMongoDatabase,
} from "@/lib/mongodb";

function text(
  ...values: unknown[]
): string {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function getClassLevel(
  student: Record<string, any>,
  profile: Record<string, any>,
  course: string,
) {
  /*
   * First use an explicitly stored
   * class/grade if one exists.
   */
  const directClass = text(
    profile.classLevel,
    profile.className,
    profile.grade,

    student.classLevel,
    student.className,
    student.grade,
  );

  if (directClass) {
    return directClass;
  }

  /*
   * Some older/student records may
   * contain the class inside their
   * qualification or course title.
   *
   * Example:
   * "Class 10 | CBSE"
   * "10th Standard"
   */
  const candidates = [
    text(
      profile.latestQualification,
    ),

    course,

    text(student.program),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const classMatch =
      candidate.match(
        /\b(?:class|grade|standard|std)\s*[-:]?\s*(\d{1,2})\b/i,
      );

    if (classMatch) {
      const classNumber =
        Number(classMatch[1]);

      if (
        classNumber >= 1 &&
        classNumber <= 12
      ) {
        return `Class ${classNumber}`;
      }
    }

    const ordinalMatch =
      candidate.match(
        /\b(1[0-2]|[1-9])(?:st|nd|rd|th)\b/i,
      );

    if (ordinalMatch) {
      return ordinalMatch[0];
    }
  }

  return "";
}

export async function GET() {
  const session =
    await getSessionUser();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Login required.",
      },
      {
        status: 401,
      },
    );
  }

  if (
    !hasAnyRole(
      session,
      [
        "admin",
        "educator",
      ],
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Only educators and admins can access registered students.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const db =
      await getMongoDatabase();

    const query:
      Record<string, unknown> = {
      role: "student",

      deletedAt: {
        $exists: false,
      },
    };

    /*
     * Faculty should only receive
     * students assigned to them.
     */
    if (
      session.role === "educator"
    ) {
      query.assignedFacultyIds = {
        $in: [session.id],
      };
    }

    const students =
      await db
        .collection("users")
        .find(query)
        .sort({
          name: 1,
        })
        .toArray();

    const formattedStudents =
      students.map((document) => {
        const student =
          document as Record<
            string,
            any
          >;

        const profile =
          student.profile &&
          typeof student.profile ===
            "object"
            ? (student.profile as Record<
                string,
                any
              >)
            : {};

        const program =
          text(
            student.program,
          );

        const course =
          text(
            profile.courseWantedTitle,
            profile.courseWanted,
            program,
          );

        const parentName =
          text(
            profile.parentName,
            student.parentName,
            profile.fatherName,
            student.fatherName,
          );

        /*
         * We only say "Father" if
         * fatherName was actually the
         * value we used.
         *
         * Otherwise relation stays blank
         * unless an actual relation was
         * stored.
         */
        const explicitRelation =
          text(
            profile.parentRelation,
            student.parentRelation,
          );

        const fatherName =
          text(
            profile.fatherName,
            student.fatherName,
          );

        const parentRelation =
          explicitRelation ||
          (
            fatherName &&
            parentName === fatherName
              ? "Father"
              : ""
          );

        const parentContact =
          text(
            profile.parentMobile,
            student.parentMobile,
            profile.guardianPhone,
            student.guardianPhone,
          );

        const city =
          text(
            profile.city,
            student.city,
          );

        const state =
          text(
            profile.state,
            student.state,
          );

        const pincode =
          text(
            profile.pincode,
            student.pincode,
          );

        const directAddress =
          text(
            profile.address,
            student.address,
          );

        const addressLines = [
          text(
            profile.addressLine1,
            student.addressLine1,
          ),

          text(
            profile.addressLine2,
            student.addressLine2,
          ),
        ].filter(Boolean);

        let address =
          directAddress ||
          addressLines.join(", ");

        if (
          pincode &&
          address &&
          !address.includes(pincode)
        ) {
          address =
            `${address} - ${pincode}`;
        }

        const photo =
          text(
            profile.profilePhoto,
            student.profilePhoto,
            student.photoUrl,
          );

        return {
          id:
            text(student.id),

          name:
            text(student.name),

          program,

          course,

          classLevel:
            getClassLevel(
              student,
              profile,
              course,
            ),

          city,

          state,

          address,

          parentName,

          parentRelation,

          parentContact,

          photo,
        };
      });

    return NextResponse.json({
      success: true,
      students:
        formattedStudents,
    });
  } catch (error) {
    console.error(
      "Fetch registered students error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load registered students.",
      },
      {
        status: 500,
      },
    );
  }
}