
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  CareerCounsellingProgress,
} from "@/components/career-counselling-progress";

import {
  EMPTY_EDUCATION,
  readCounsellingDraft,
  saveEducationDraft,
  type EducationDetails,
  type EducationStage,
  type AdditionalQualification,
  type AttemptedExam,
} from "@/lib/career-counselling-draft";

const INPUT =
  "mt-1.5 h-11 w-full min-w-0 rounded-md border border-[#B9C7DC] bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const BOARD = [
  "State Board",
  "CBSE",
  "ICSE",
  "ISC",
  "Other",
];

const SUBJECTS = [
  "Maths",
  "Science",
  "English",
  "Hindi / Marathi",
  "Social Science",
  "Computers",
  "Art",
  "Sports",
];

const STREAMS = [
  "Science (PCM)",
  "Science (PCB)",
  "Science (PCMB)",
  "Commerce",
  "Arts / Humanities",
  "Vocational / Diploma",
  "Not sure yet",
];

const EXAMS = [
  "JEE Main",
  "NEET-UG",
  "CUET-UG",
  "MHT CET",
  "CLAT",
  "NDA",
  "IPMAT",
  "Design entrance",
  "None yet",
];

const NAMES: Record<EducationStage, string> = {
  "class-6-8": "Class 6–8",
  "class-9-10": "Class 9–10",
  "class-11-12": "Class 11–12",
  college: "College",
  graduate: "Graduate",
  working: "Working",
};

type MultiField =
  | "favouriteSubjects"
  | "difficultSubjects"
  | "activities"
  | "entranceExams";

function Field({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 text-sm font-semibold text-[#0B1F4B]">
      {title}
      {children}
    </label>
  );
}

function Multi({
  title,
  choices,
  selected,
  toggle,
}: {
  title: string;
  choices: string[];
  selected: string[];
  toggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">
        {title}
      </legend>

      <div className="flex flex-wrap gap-2">
        {choices.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={
              selected.includes(value)
            }
            onClick={() => toggle(value)}
            className={`rounded-md border px-3 py-2 text-sm ${
              selected.includes(value)
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-[#C5CFE0] bg-white"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function percentError(
  label: string,
  value: string,
): string | null {
  if (!value.trim()) {
    return null;
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(value) ||
    Number(value) > 100 ||
    Number(value) < 0
  ) {
    return `${label} must be between 0 and 100.`;
  }

  return null;
}

function validate(
  data: EducationDetails,
  stage: EducationStage,
): string | null {
  if (
    stage === "class-6-8" &&
    !["6", "7", "8"].includes(
      data.presentClass,
    )
  ) {
    return "Select Class 6, 7 or 8.";
  }

  if (
    stage === "class-9-10" &&
    !["9", "10"].includes(
      data.presentClass,
    )
  ) {
    return "Select Class 9 or 10.";
  }

  if (
    stage === "class-11-12" &&
    !["Class 11", "Class 12"].includes(
      data.currentClass,
    )
  ) {
    return "Select Class 11 or 12.";
  }

  return (
    percentError(
      "Last exam marks",
      data.lastExamPercentage,
    ) ||
    percentError(
      "Class 10 marks",
      data.class10Percentage,
    ) ||
    percentError(
      "Class 12 marks",
      data.class12Percentage,
    ) ||
    percentError(
      "Latest marks",
      data.currentExamPercentage,
    )
  );
}

export default function EducationPage() {
  const router = useRouter();

  const [stage, setStage] =
    useState<EducationStage | "">("");

  const [data, setData] =
    useState<EducationDetails>(
      EMPTY_EDUCATION,
    );

  const [ready, setReady] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    const draft =
      readCounsellingDraft();

    if (
      !draft?.aboutYou.educationStage
    ) {
      router.replace(
        "/career-counselling/about-you",
      );

      return;
    }

    setStage(
      draft.aboutYou.educationStage,
    );

    if (draft.education) {
      setData(draft.education);
    }

    setReady(true);
  }, [router]);

  function set<
    K extends keyof EducationDetails
  >(
    key: K,
    value: EducationDetails[K],
  ) {
    setData((old) => ({
      ...old,
      [key]: value,
    }));

    setError("");
    setSaved(false);
  }

  function toggle(
    key: MultiField,
    item: string,
  ) {
    const old = data[key];

    const isNone =
      item === "None" ||
      item === "None yet";

    set(
      key,
      old.includes(item)
        ? old.filter(
            (x) => x !== item,
          )
        : isNone
          ? [item]
          : [
              ...old.filter(
                (x) =>
                  x !== "None" &&
                  x !== "None yet",
              ),
              item,
            ],
    );
  }

  function save(next: boolean) {
    if (!stage) {
      setError(
        "Please complete About You first.",
      );
      return;
    }

    const issue = next
      ? validate(data, stage)
      : null;

    if (issue) {
      setError(issue);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      saveEducationDraft(data);

      setSaved(true);
      setError("");

      if (next) {
        router.push(
          "/career-counselling/interests",
        );
      }
    } catch {
      setError(
        "Draft could not be saved. Check browser storage.",
      );
    }
  }

  function submit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    save(true);
  }

  const school =
    stage === "class-6-8" ||
    stage === "class-9-10";

  const higher =
    stage === "college" ||
    stage === "graduate" ||
    stage === "working";

  const boardField = (
    value: string,
    onChange: (value: string) => void,
  ) => (
    <select
      className={INPUT}
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
    >
      <option value="">
        Select board
      </option>

      {BOARD.map((item) => (
        <option key={item}>
          {item}
        </option>
      ))}
    </select>
  );

  const percentageField = (
    value: string,
    onChange: (value: string) => void,
  ) => (
    <input
      className={INPUT}
      inputMode="decimal"
      maxLength={6}
      placeholder="e.g. 85.5"
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
    />
  );

  const yearField = (
    value: string,
    onChange: (value: string) => void,
  ) => (
    <input
      className={INPUT}
      inputMode="numeric"
      maxLength={4}
      placeholder="YYYY"
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
            .replace(/\D/g, "")
            .slice(0, 4),
        )
      }
    />
  );

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#0B1F4B] sm:px-6">
      <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
        <CareerCounsellingProgress
          activeStep={2}
          stageLabel={
            stage
              ? NAMES[stage]
              : undefined
          }
        />

        <form
          onSubmit={submit}
          noValidate
          className="min-w-0 rounded-lg border border-[#C5CFE0] bg-white p-5 sm:p-8"
        >
          <p className="text-xs font-bold uppercase text-[#2563EB]">
            Step 2 of 5
          </p>

          <h1 className="mt-2 text-3xl font-extrabold">
            Education
          </h1>

          <p className="mt-2 text-sm text-[#53617A]">
            These questions match your education
            stage. Leave optional answers blank
            if needed.
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
              Education saved on this device.
            </p>
          )}

          {!ready ? (
            <p className="py-8">
              Loading saved answers...
            </p>
          ) : (
            <div className="mt-7 space-y-7">
              {school && (
                <>
                  <section className="space-y-4">
                    <h2 className="text-xl font-bold">
                      School details
                    </h2>

                    <Field title="Present class *">
                      <select
                        className={INPUT}
                        value={
                          data.presentClass
                        }
                        onChange={(e) =>
                          set(
                            "presentClass",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">
                          Select class
                        </option>

                        {(
                          stage === "class-6-8"
                            ? ["6", "7", "8"]
                            : ["9", "10"]
                        ).map((c) => (
                          <option
                            key={c}
                            value={c}
                          >
                            Class {c}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field title="Board">
                        {boardField(
                          data.board,
                          (v) =>
                            set("board", v),
                        )}
                      </Field>

                      <Field title="School name">
                        <input
                          className={INPUT}
                          maxLength={180}
                          value={
                            data.schoolName
                          }
                          onChange={(e) =>
                            set(
                              "schoolName",
                              e.target.value,
                            )
                          }
                        />
                      </Field>

                      <Field title="Last exam percentage">
                        {percentageField(
                          data.lastExamPercentage,
                          (v) =>
                            set(
                              "lastExamPercentage",
                              v,
                            ),
                        )}
                      </Field>

                      {stage ===
                        "class-6-8" && (
                        <Field title="Goes for tuition?">
                          <select
                            className={INPUT}
                            value={
                              data.attendsTuition
                            }
                            onChange={(e) =>
                              set(
                                "attendsTuition",
                                e.target.value as
                                  EducationDetails["attendsTuition"],
                              )
                            }
                          >
                            <option value="">
                              Select
                            </option>

                            <option value="yes">
                              Yes
                            </option>

                            <option value="no">
                              No
                            </option>
                          </select>
                        </Field>
                      )}
                    </div>
                  </section>

                  <section className="space-y-5 border-t border-[#DCE4F0] pt-6">
                    <h2 className="text-xl font-bold">
                      Subjects and interests
                    </h2>

                    <Multi
                      title="Favourite subjects"
                      selected={
                        data.favouriteSubjects
                      }
                      choices={SUBJECTS}
                      toggle={(v) =>
                        toggle(
                          "favouriteSubjects",
                          v,
                        )
                      }
                    />

                    {stage ===
                      "class-6-8" && (
                      <>
                        <Multi
                          title="Subjects you find difficult"
                          selected={
                            data.difficultSubjects
                          }
                          choices={[
                            ...SUBJECTS,
                            "None",
                          ]}
                          toggle={(v) =>
                            toggle(
                              "difficultSubjects",
                              v,
                            )
                          }
                        />

                        <Multi
                          title="Activities outside school"
                          selected={
                            data.activities
                          }
                          choices={[
                            "Sports",
                            "Coding",
                            "Music / Dance",
                            "Art",
                            "Reading",
                            "Olympiads / Quizzes",
                            "Public speaking",
                            "None yet",
                          ]}
                          toggle={(v) =>
                            toggle(
                              "activities",
                              v,
                            )
                          }
                        />
                      </>
                    )}

                    {stage ===
                      "class-9-10" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field title="Preferred stream for Class 11">
                          <select
                            className={INPUT}
                            value={
                              data.consideredStream
                            }
                            onChange={(e) =>
                              set(
                                "consideredStream",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">
                              Select
                            </option>

                            {STREAMS.map(
                              (v) => (
                                <option key={v}>
                                  {v}
                                </option>
                              ),
                            )}
                          </select>
                        </Field>

                        <Field title="Who influenced this choice?">
                          <select
                            className={INPUT}
                            value={
                              data.streamInfluence
                            }
                            onChange={(e) =>
                              set(
                                "streamInfluence",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">
                              Select
                            </option>

                            {[
                              "My own choice",
                              "Parents",
                              "Teachers",
                              "Friends",
                              "Other",
                            ].map((v) => (
                              <option key={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    )}
                  </section>
                </>
              )}

              {(stage ===
                "class-11-12" ||
                higher) && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold">
                    Class 10 details
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field title="Board">
                      {boardField(
                        data.class10Board,
                        (v) =>
                          set(
                            "class10Board",
                            v,
                          ),
                      )}
                    </Field>

                    <Field title="Passing year">
                      {yearField(
                        data.class10Year,
                        (v) =>
                          set(
                            "class10Year",
                            v,
                          ),
                      )}
                    </Field>

                    <Field title="Percentage">
                      {percentageField(
                        data.class10Percentage,
                        (v) =>
                          set(
                            "class10Percentage",
                            v,
                          ),
                      )}
                    </Field>
                  </div>
                </section>
              )}

              {stage ===
                "class-11-12" && (
                <section className="space-y-5 border-t border-[#DCE4F0] pt-6">
                  <h2 className="text-xl font-bold">
                    Current Class 11/12
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field title="Current class *">
                      <select
                        className={INPUT}
                        value={
                          data.currentClass
                        }
                        onChange={(e) =>
                          set(
                            "currentClass",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">
                          Select
                        </option>

                        <option>
                          Class 11
                        </option>

                        <option>
                          Class 12
                        </option>
                      </select>
                    </Field>

                    <Field title="Stream">
                      <select
                        className={INPUT}
                        value={
                          data.currentStream
                        }
                        onChange={(e) =>
                          set(
                            "currentStream",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">
                          Select
                        </option>

                        {STREAMS.map(
                          (v) => (
                            <option key={v}>
                              {v}
                            </option>
                          ),
                        )}
                      </select>
                    </Field>

                    <Field title="Latest exam percentage">
                      {percentageField(
                        data.currentExamPercentage,
                        (v) =>
                          set(
                            "currentExamPercentage",
                            v,
                          ),
                      )}
                    </Field>
                  </div>

                  <Multi
                    title="Entrance exams you're considering"
                    choices={EXAMS}
                    selected={
                      data.entranceExams
                    }
                    toggle={(v) =>
                      toggle(
                        "entranceExams",
                        v,
                      )
                    }
                  />
                </section>
              )}

              {higher && (
                <>
                  <section className="space-y-4 border-t border-[#DCE4F0] pt-6">
                    <h2 className="text-xl font-bold">
                      Class 12 details
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field title="Stream">
                        <select
                          className={INPUT}
                          value={
                            data.class12Stream
                          }
                          onChange={(e) =>
                            set(
                              "class12Stream",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">
                            Select
                          </option>

                          {STREAMS.map(
                            (v) => (
                              <option key={v}>
                                {v}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>

                      <Field title="Board">
                        {boardField(
                          data.class12Board,
                          (v) =>
                            set(
                              "class12Board",
                              v,
                            ),
                        )}
                      </Field>

                      <Field title="Passing year">
                        {yearField(
                          data.class12Year,
                          (v) =>
                            set(
                              "class12Year",
                              v,
                            ),
                        )}
                      </Field>

                      <Field title="Percentage">
                        {percentageField(
                          data.class12Percentage,
                          (v) =>
                            set(
                              "class12Percentage",
                              v,
                            ),
                        )}
                      </Field>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-[#DCE4F0] pt-6">
                    <h2 className="text-xl font-bold">
                      College / graduation
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field title="Degree / qualification">
                        <input
                          className={INPUT}
                          value={data.degree}
                          onChange={(e) =>
                            set(
                              "degree",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. B.Sc. Computer Science"
                        />
                      </Field>

                      <Field title="Main subject">
                        <input
                          className={INPUT}
                          value={
                            data.mainSubject
                          }
                          onChange={(e) =>
                            set(
                              "mainSubject",
                              e.target.value,
                            )
                          }
                        />
                      </Field>

                      <Field title="University / institution">
                        <input
                          className={INPUT}
                          value={
                            data.university
                          }
                          onChange={(e) =>
                            set(
                              "university",
                              e.target.value,
                            )
                          }
                        />
                      </Field>

                      <Field title="Current status">
                        <select
                          className={INPUT}
                          value={
                            data.graduationStatus
                          }
                          onChange={(e) =>
                            set(
                              "graduationStatus",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">
                            Select
                          </option>

                          {[
                            "1st year",
                            "2nd year",
                            "3rd year",
                            "4th year",
                            "Final year",
                            "Completed",
                            "Not applicable",
                          ].map((v) => (
                            <option key={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field title="CGPA or percentage">
                        <input
                          className={INPUT}
                          value={
                            data.graduationScore
                          }
                          onChange={(e) =>
                            set(
                              "graduationScore",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. 8.49 CGPA"
                        />
                      </Field>
                    </div>

                    {data.additionalQualifications.map(
                      (q, i) => (
                        <div
                          key={i}
                          className="rounded border border-[#C5CFE0] bg-[#F7F9FD] p-4"
                        >
                          <div className="mb-3 flex justify-between">
                            <strong>
                              Additional qualification{" "}
                              {i + 1}
                            </strong>

                            <button
                              type="button"
                              aria-label={`Remove qualification ${i + 1}`}
                              onClick={() =>
                                set(
                                  "additionalQualifications",
                                  data.additionalQualifications.filter(
                                    (_, n) =>
                                      n !== i,
                                  ),
                                )
                              }
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            {(
                              [
                                "qualification",
                                "institution",
                                "year",
                              ] as (
                                keyof AdditionalQualification
                              )[]
                            ).map((k) => (
                              <Field
                                key={k}
                                title={k}
                              >
                                <input
                                  className={INPUT}
                                  value={q[k]}
                                  onChange={(e) =>
                                    set(
                                      "additionalQualifications",
                                      data.additionalQualifications.map(
                                        (x, n) =>
                                          n === i
                                            ? {
                                                ...x,
                                                [k]:
                                                  e.target.value,
                                              }
                                            : x,
                                      ),
                                    )
                                  }
                                />
                              </Field>
                            ))}
                          </div>
                        </div>
                      ),
                    )}

                    <button
                      type="button"
                      disabled={
                        data.additionalQualifications
                          .length >= 5
                      }
                      onClick={() =>
                        set(
                          "additionalQualifications",
                          [
                            ...data.additionalQualifications,
                            {
                              qualification: "",
                              institution: "",
                              year: "",
                            },
                          ],
                        )
                      }
                      className="flex items-center gap-2 text-sm font-bold text-blue-700 disabled:opacity-40"
                    >
                      <Plus size={16} />
                      Add qualification
                    </button>
                  </section>

                  <section className="space-y-4 border-t border-[#DCE4F0] pt-6">
                    <h2 className="text-xl font-bold">
                      Competitive exams attempted
                      (optional)
                    </h2>

                    {data.attemptedExams.map(
                      (exam, i) => (
                        <div
                          key={i}
                          className="rounded border border-[#C5CFE0] bg-[#F7F9FD] p-4"
                        >
                          <div className="mb-3 flex justify-between">
                            <strong>
                              Exam {i + 1}
                            </strong>

                            <button
                              type="button"
                              aria-label={`Remove exam ${i + 1}`}
                              onClick={() =>
                                set(
                                  "attemptedExams",
                                  data.attemptedExams.filter(
                                    (_, n) =>
                                      n !== i,
                                  ),
                                )
                              }
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {(
                              [
                                "exam",
                                "year",
                                "stage",
                                "scoreOrRank",
                              ] as (
                                keyof AttemptedExam
                              )[]
                            ).map((k) => (
                              <Field
                                key={k}
                                title={
                                  k === "scoreOrRank"
                                    ? "Score or rank"
                                    : k
                                }
                              >
                                <input
                                  className={INPUT}
                                  value={exam[k]}
                                  onChange={(e) =>
                                    set(
                                      "attemptedExams",
                                      data.attemptedExams.map(
                                        (x, n) =>
                                          n === i
                                            ? {
                                                ...x,
                                                [k]:
                                                  e.target.value,
                                              }
                                            : x,
                                      ),
                                    )
                                  }
                                />
                              </Field>
                            ))}
                          </div>
                        </div>
                      ),
                    )}

                    <button
                      type="button"
                      disabled={
                        data.attemptedExams.length >= 5
                      }
                      onClick={() =>
                        set(
                          "attemptedExams",
                          [
                            ...data.attemptedExams,
                            {
                              exam: "",
                              year: "",
                              stage: "",
                              scoreOrRank: "",
                            },
                          ],
                        )
                      }
                      className="flex items-center gap-2 text-sm font-bold text-blue-700 disabled:opacity-40"
                    >
                      <Plus size={16} />
                      Add exam
                    </button>
                  </section>
                </>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE4F0] pt-5">
            <Link
              href="/career-counselling/about-you"
              className="flex items-center gap-2 text-sm font-bold text-blue-700"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!ready}
                onClick={() => save(false)}
                className="flex min-h-11 items-center gap-2 rounded border border-blue-600 px-4 text-sm font-bold text-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                Save draft
              </button>

              <button
                type="submit"
                disabled={!ready}
                className="flex min-h-11 items-center gap-2 rounded bg-[#2563EB] px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                Next: Interests &amp; Goals
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
