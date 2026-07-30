import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  createCrmLead,
  getCrmStaff,
} from "@/lib/data-store";
import type {
  CrmLeadInterest,
  CrmLeadPriority,
  CrmLeadSource,
  CrmLeadStatus,
} from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMPORT_ROWS = 500;

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function getText(value: string | undefined, maxLength = 250) {
  return value?.trim().slice(0, maxLength) || "";
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell.trim());

      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  currentRow.push(currentCell.trim());

  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function getValue(
  row: Record<string, string>,
  possibleHeaders: string[],
) {
  for (const header of possibleHeaders) {
    if (row[header]) {
      return row[header];
    }
  }

  return "";
}

function normalizeSource(value: string): CrmLeadSource {
  const normalized = normalizeHeader(value);

  if (normalized.includes("whatsapp")) return "whatsapp";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("google")) return "google";
  if (normalized.includes("refer")) return "referral";
  if (normalized.includes("walk")) return "walk-in";
  if (normalized.includes("website") || normalized.includes("web")) {
    return "website";
  }

  return "other";
}

function normalizePriority(value: string): CrmLeadPriority {
  const normalized = normalizeHeader(value);

  if (normalized === "high" || normalized === "urgent") return "high";
  if (normalized === "low") return "low";

  return "medium";
}

function normalizeInterest(value: string): CrmLeadInterest {
  const normalized = normalizeHeader(value);

  if (
    normalized === "interested" ||
    normalized === "hot" ||
    normalized === "yes"
  ) {
    return "interested";
  }

  if (
    normalized === "notinterested" ||
    normalized === "notinterestedlead" ||
    normalized === "cold" ||
    normalized === "no"
  ) {
    return "not-interested";
  }

  return "undecided";
}

function normalizeStatus(
  value: string,
  interest: CrmLeadInterest,
): CrmLeadStatus {
  if (interest === "not-interested") {
    return "lost";
  }

  const normalized = normalizeHeader(value);

  if (normalized === "contacted") return "contacted";
  if (normalized === "followup") return "follow-up";
  if (normalized === "counselling" || normalized === "counseling") {
    return "counselling";
  }
  if (normalized === "demoscheduled" || normalized === "democlass") {
    return "demo-scheduled";
  }
  if (normalized === "admissionpending") return "admission-pending";
  if (normalized === "admitted" || normalized === "converted") {
    return "admitted";
  }
  if (normalized === "lost") return "lost";

  return "new";
}

function normalizeDateTime(value: string) {
  const raw = value.trim();

  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can import CRM leads." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose a CSV file to import." },
        { status: 400 },
      );
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      return NextResponse.json(
        {
          error:
            "Only CSV files are supported. Export your Excel or Google Sheet as CSV first.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected CSV file is empty." },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "CSV file must be smaller than 5 MB." },
        { status: 400 },
      );
    }

    const rows = parseCsv(await file.text());

    if (rows.length < 2) {
      return NextResponse.json(
        {
          error:
            "The CSV must include a header row and at least one lead row.",
        },
        { status: 400 },
      );
    }

    const headers = rows[0].map(normalizeHeader);

    const hasStudentName = headers.some((header) =>
      ["studentname", "name", "fullname", "student"].includes(header),
    );

    const hasStudentPhone = headers.some((header) =>
      [
        "studentphone",
        "phone",
        "mobile",
        "contact",
        "contactnumber",
        "phonenumber",
      ].includes(header),
    );

    const hasCourse = headers.some((header) =>
      [
        "course",
        "courseinterested",
        "program",
        "courseprogram",
      ].includes(header),
    );

    if (!hasStudentName || !hasStudentPhone || !hasCourse) {
      return NextResponse.json(
        {
          error:
            "CSV must contain Student Name, Student Phone, and Course columns.",
        },
        { status: 400 },
      );
    }

    const dataRows = rows.slice(1, MAX_IMPORT_ROWS + 1);
    const staff = await getCrmStaff();

    const staffByName = new Map(
      staff.map((member) => [
        member.name.trim().toLowerCase(),
        member,
      ]),
    );

    const skippedRows: Array<{
      row: number;
      error: string;
    }> = [];

    let createdCount = 0;

    for (let index = 0; index < dataRows.length; index += 1) {
      const rowValues = dataRows[index];

      const row = headers.reduce<Record<string, string>>(
        (result, header, headerIndex) => {
          result[header] = rowValues[headerIndex]?.trim() || "";
          return result;
        },
        {},
      );

      const studentName = getText(
        getValue(row, ["studentname", "name", "fullname", "student"]),
        100,
      );

      const studentPhone = getText(
        getValue(row, [
          "studentphone",
          "phone",
          "mobile",
          "contact",
          "contactnumber",
          "phonenumber",
        ]),
        25,
      );

      const courseInterested = getText(
        getValue(row, [
          "courseinterested",
          "course",
          "program",
          "courseprogram",
        ]),
        150,
      );

      const rowNumber = index + 2;

      if (!studentName || !studentPhone || !courseInterested) {
        skippedRows.push({
          row: rowNumber,
          error:
            "Student Name, Student Phone, and Course are required.",
        });
        continue;
      }

      try {
        const interest = normalizeInterest(
          getValue(row, ["interest", "leadinterest", "hotlead"]),
        );

        const staffName = getText(
          getValue(row, [
            "assignedstaff",
            "staff",
            "assignee",
            "counsellor",
            "salesexecutive",
          ]),
          100,
        );

        const assignedStaff = staffName
          ? staffByName.get(staffName.toLowerCase())
          : undefined;

        await createCrmLead({
          studentName,
          studentPhone,
          studentEmail: getText(
            getValue(row, ["studentemail", "email"]),
            120,
          ) || undefined,

          parentName: getText(
            getValue(row, ["parentname", "guardianname"]),
            100,
          ) || undefined,

          parentPhone: getText(
            getValue(row, [
              "parentphone",
              "guardianphone",
              "parentcontact",
            ]),
            25,
          ) || undefined,

          parentEmail: getText(
            getValue(row, ["parentemail", "guardianemail"]),
            120,
          ) || undefined,

          courseInterested,
          branch: getText(
            getValue(row, ["branch", "location", "centre", "center"]),
            100,
          ) || undefined,

          source: normalizeSource(
            getValue(row, ["source", "leadsource"]),
          ),

          priority: normalizePriority(getValue(row, ["priority"])),

          interest,

          status: normalizeStatus(
            getValue(row, ["status", "leadstatus"]),
            interest,
          ),

          assignedStaffId: assignedStaff?.id,
          assignedStaffName: assignedStaff?.name,

          nextFollowUpAt: normalizeDateTime(
            getValue(row, [
              "nextfollowup",
              "followupdatetime",
              "followupdate",
              "followuptime",
            ]),
          ),

          lastContactedAt: undefined,

          demo: {
            status: "not-scheduled",
          },

          admission: {
            totalFee: 0,
            paidAmount: 0,
            pendingAmount: 0,
            paymentStatus: "not-applicable",
          },

          createdBy: session.id,
          createdByName: session.name,
          updatedBy: session.id,
          updatedByName: session.name,
        });

        createdCount += 1;
      } catch (error) {
        skippedRows.push({
          row: rowNumber,
          error:
            error instanceof Error
              ? error.message
              : "Unable to import this row.",
        });
      }
    }

    await logAction({
      action: "import",
      category: "crm",
      details: `Imported ${createdCount} CRM leads from CSV (${skippedRows.length} skipped)`,
      path: "/api/crm/import",
      method: "POST",
      request,
      session,
      metadata: { createdCount, skippedCount: skippedRows.length, fileName },
    });

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount: skippedRows.length,
      skippedRows: skippedRows.slice(0, 50),
      limitedToFirstRows: rows.length - 1 > MAX_IMPORT_ROWS,
    });
  } catch (error) {
    console.error("CRM CSV import error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to import CSV leads.",
      },
      { status: 500 },
    );
  }
}