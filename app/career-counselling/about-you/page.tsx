
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Save,
} from "lucide-react";

import {
  CareerCounsellingProgress,
} from "@/components/career-counselling-progress";

import {
  EMPTY_ABOUT_YOU,
  getStudentAge,
  readCounsellingDraft,
  saveAboutYouDraft,
  type AboutYouDetails,
  type EducationStage,
  type FormFiller,
  type Gender,
  type GuardianRelation,
  type SessionLanguage,
} from "@/lib/career-counselling-draft";

const INPUT =
  "mt-1.5 h-11 w-full min-w-0 rounded-md border border-[#B9C7DC] bg-white px-3 text-sm text-[#0B1F4B] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100";

const STAGES: {
  id: EducationStage;
  label: string;
  detail: string;
}[] = [
  {
    id: "class-6-8",
    label: "Class 6–8",
    detail: "School foundation",
  },
  {
    id: "class-9-10",
    label: "Class 9–10",
    detail: "Stream decisions",
  },
  {
    id: "class-11-12",
    label: "Class 11–12",
    detail: "Entrance and degree choices",
  },
  {
    id: "college",
    label: "College",
    detail: "Degree or diploma",
  },
  {
    id: "graduate",
    label: "Graduate",
    detail: "Job or exam preparation",
  },
  {
    id: "working",
    label: "Working",
    detail: "Career development",
  },
];

function phone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 10);
}

function validate(
  d: AboutYouDetails,
): string | null {
  const age = getStudentAge(
    d.dateOfBirth,
  );

  if (!d.educationStage) {
    return "Select your education stage.";
  }

  if (d.studentName.trim().length < 2) {
    return "Enter the student's full name.";
  }

  if (age === null) {
    return "Enter a valid date of birth.";
  }

  if (!d.gender) {
    return "Select a gender.";
  }

  if (!/^[6-9]\d{9}$/.test(d.mobile)) {
    return "Enter a valid 10-digit Indian mobile number.";
  }

  if (
    d.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      d.email.trim(),
    )
  ) {
    return "Enter a valid email address.";
  }

  if (d.city.trim().length < 2) {
    return "Enter your city or area.";
  }

  if (
    age < 18 ||
    d.filledBy === "parent"
  ) {
    if (
      d.guardianName.trim().length < 2 ||
      !d.guardianRelation ||
      !/^[6-9]\d{9}$/.test(
        d.guardianMobile,
      )
    ) {
      return "Complete the parent/guardian name, relationship and mobile number.";
    }
  } else if (
    d.guardianMobile &&
    !/^[6-9]\d{9}$/.test(
      d.guardianMobile,
    )
  ) {
    return "Enter a valid guardian mobile number, or leave it blank.";
  }

  if (
    age < 18 &&
    !d.guardianConsent
  ) {
    return "Guardian consent is required for students under 18.";
  }

  if (!d.privacyAccepted) {
    return "You must accept the Privacy Policy.";
  }

  return null;
}

export default function AboutYouPage() {
  const router = useRouter();

  const [data, setData] =
    useState<AboutYouDetails>(
      EMPTY_ABOUT_YOU,
    );

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    const draft =
      readCounsellingDraft();

    if (draft) {
      setData(draft.aboutYou);
    }

    setLoaded(true);
  }, []);

  const age = getStudentAge(
    data.dateOfBirth,
  );

  const needsGuardian =
    (age !== null && age < 18) ||
    data.filledBy === "parent";

  const stageName = STAGES.find(
    (s) =>
      s.id === data.educationStage,
  )?.label;

  function set<
    K extends keyof AboutYouDetails
  >(
    key: K,
    value: AboutYouDetails[K],
  ) {
    setData((old) => ({
      ...old,
      [key]: value,
    }));

    setError("");
    setSaved(false);
  }

  function save(next: boolean) {
    const message =
      next ? validate(data) : null;

    if (message) {
      setError(message);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      saveAboutYouDraft({
        ...data,

        studentName:
          data.studentName.trim(),

        email:
          data.email.trim(),

        city:
          data.city.trim(),

        guardianName:
          data.guardianName.trim(),
      });

      setSaved(true);
      setError("");

      if (next) {
        router.push(
          "/career-counselling/education",
        );
      }
    } catch {
      setError(
        "Unable to save draft. Please check your browser storage.",
      );
    }
  }

  function submit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    save(true);
  }

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#0B1F4B] sm:px-6">
      <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
        <CareerCounsellingProgress
          activeStep={1}
          stageLabel={stageName}
        />

        <form
          onSubmit={submit}
          noValidate
          className="min-w-0 rounded-lg border border-[#C5CFE0] bg-white p-5 sm:p-8"
        >
          <p className="text-xs font-bold uppercase text-[#2563EB]">
            Step 1 of 5
          </p>

          <h1 className="mt-2 text-3xl font-extrabold">
            About you
          </h1>

          <p className="mt-2 text-sm text-[#53617A]">
            Your answers will determine which
            counselling questions you see next.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {saved && (
            <p
              role="status"
              className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800"
            >
              Draft saved on this browser.
              It is not yet submitted.
            </p>
          )}

          {!loaded ? (
            <p className="py-8">
              Loading draft...
            </p>
          ) : (
            <div className="mt-7 space-y-7">
              <fieldset>
                <legend className="mb-3 text-sm font-bold">
                  Who is filling this form? *
                </legend>

                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ["student", "Student"],
                      ["parent", "Parent"],
                      [
                        "counsellor",
                        "SmartIQ counsellor",
                      ],
                    ] as [FormFiller, string][]
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded border border-[#B9C7DC] px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="filledBy"
                        checked={
                          data.filledBy === value
                        }
                        onChange={() =>
                          set("filledBy", value)
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold">
                  Current education stage *
                </legend>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {STAGES.map((s) => (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-start gap-2 rounded-md border-2 p-3 ${
                        data.educationStage === s.id
                          ? "border-[#2563EB] bg-blue-50"
                          : "border-[#C5CFE0]"
                      }`}
                    >
                      <input
                        type="radio"
                        className="mt-1"
                        name="educationStage"
                        checked={
                          data.educationStage === s.id
                        }
                        onChange={() =>
                          set("educationStage", s.id)
                        }
                      />

                      <span>
                        <strong className="block text-sm">
                          {s.label}
                        </strong>

                        <span className="text-xs text-[#53617A]">
                          {s.detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <section className="border-t border-[#DCE4F0] pt-6">
                <h2 className="mb-4 text-xl font-bold">
                  Student details
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold sm:col-span-2">
                    Student&apos;s full name *

                    <input
                      className={INPUT}
                      autoComplete="name"
                      maxLength={120}
                      value={data.studentName}
                      onChange={(e) =>
                        set(
                          "studentName",
                          e.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Date of birth *

                    <input
                      className={INPUT}
                      type="date"
                      value={data.dateOfBirth}
                      onChange={(e) =>
                        set(
                          "dateOfBirth",
                          e.target.value,
                        )
                      }
                    />

                    {age !== null && (
                      <span className="mt-1 block text-xs font-normal">
                        Age: {age} years
                      </span>
                    )}
                  </label>

                  <label className="block text-sm font-semibold">
                    Gender *

                    <select
                      className={INPUT}
                      value={data.gender}
                      onChange={(e) =>
                        set(
                          "gender",
                          e.target.value as Gender,
                        )
                      }
                    >
                      <option value="">
                        Select
                      </option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label className="block text-sm font-semibold">
                    Mobile number * (+91)

                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="numeric"
                      value={data.mobile}
                      onChange={(e) =>
                        set(
                          "mobile",
                          phone(e.target.value),
                        )
                      }
                      placeholder="10-digit mobile"
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Email (optional)

                    <input
                      className={INPUT}
                      type="email"
                      value={data.email}
                      onChange={(e) =>
                        set(
                          "email",
                          e.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    City or area *

                    <input
                      className={INPUT}
                      value={data.city}
                      maxLength={120}
                      onChange={(e) =>
                        set(
                          "city",
                          e.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Counselling language

                    <select
                      className={INPUT}
                      value={data.language}
                      onChange={(e) =>
                        set(
                          "language",
                          e.target.value as
                            SessionLanguage,
                        )
                      }
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Marathi</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={
                      data.sendReportOnWhatsApp
                    }
                    onChange={(e) =>
                      set(
                        "sendReportOnWhatsApp",
                        e.target.checked,
                      )
                    }
                  />

                  I agree to receive my approved
                  report on WhatsApp at this number.
                </label>
              </section>

              <section className="border-t border-[#DCE4F0] pt-6">
                <h2 className="mb-2 text-xl font-bold">
                  Parent or guardian{" "}
                  {needsGuardian
                    ? "*"
                    : "(optional)"}
                </h2>

                <p className="mb-4 text-sm text-[#53617A]">
                  Required for applicants under
                  18 and forms completed by a
                  parent.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-sm font-semibold">
                    Full name

                    <input
                      className={INPUT}
                      value={data.guardianName}
                      onChange={(e) =>
                        set(
                          "guardianName",
                          e.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Relationship

                    <select
                      className={INPUT}
                      value={
                        data.guardianRelation
                      }
                      onChange={(e) =>
                        set(
                          "guardianRelation",
                          e.target.value as
                            GuardianRelation,
                        )
                      }
                    >
                      <option value="">
                        Select
                      </option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Guardian</option>
                    </select>
                  </label>

                  <label className="block text-sm font-semibold">
                    Mobile number

                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="numeric"
                      value={
                        data.guardianMobile
                      }
                      onChange={(e) =>
                        set(
                          "guardianMobile",
                          phone(e.target.value),
                        )
                      }
                    />
                  </label>
                </div>

                {age !== null &&
                  age < 18 && (
                    <label className="mt-4 flex gap-2 rounded bg-blue-50 p-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={
                          data.guardianConsent
                        }
                        onChange={(e) =>
                          set(
                            "guardianConsent",
                            e.target.checked,
                          )
                        }
                      />

                      I am the parent/legal guardian,
                      or I confirm their consent
                      for this counselling form. *
                    </label>
                  )}
              </section>

              <label className="flex items-start gap-2 border-t border-[#DCE4F0] pt-5 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={
                    data.privacyAccepted
                  }
                  onChange={(e) =>
                    set(
                      "privacyAccepted",
                      e.target.checked,
                    )
                  }
                />

                <span>
                  I have read and agree to the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 underline"
                  >
                    Privacy Policy
                  </Link>
                  . *
                </span>
              </label>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE4F0] pt-5">
            <Link
              href="/career-counselling"
              className="flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              <ArrowLeft size={17} />
              Back
            </Link>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!loaded}
                onClick={() => save(false)}
                className="flex min-h-11 items-center gap-2 rounded border border-blue-600 px-4 text-sm font-bold text-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                Save draft
              </button>

              <button
                type="submit"
                disabled={!loaded}
                className="flex min-h-11 items-center gap-2 rounded bg-[#2563EB] px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                Next: Education
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
