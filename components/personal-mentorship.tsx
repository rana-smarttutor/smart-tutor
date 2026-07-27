"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Languages,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Monitor,
  RefreshCw,
  Send,
  Settings2,
  UserRoundCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import type {
  FacultyMentorshipProfile,
  MentorshipFacultyCard,
  MentorshipMode,
  MentorshipRequest,
  MentorshipRequestStatus,
  Role,
  SessionUser,
} from "@/lib/types";

type PersonalMentorshipProps = {
  session: SessionUser | null;
  role: Role;
};

type StudentRequestForm = {
  subject: string;
  goal: string;
  message: string;
  preferredMode: MentorshipMode;
  preferredDate: string;
  preferredTime: string;
};

type FacultyProfileForm = {
  isAvailable: boolean;
  subjects: string;
  modes: MentorshipMode[];
  availableDays: string[];
  availableFrom: string;
  availableTo: string;
  maximumActiveStudents: string;
  bio: string;
  languages: string;
};

type RequestActionDraft = {
  facultyResponse: string;
  scheduledAt: string;
  meetingLink: string;
  location: string;
};

const MENTORSHIP_MODES: Array<{
  value: MentorshipMode;
  label: string;
}> = [
  {
    value: "online",
    label: "Online",
  },
  {
    value: "vashi-campus",
    label: "Vashi Campus",
  },
  {
    value: "panvel-campus",
    label: "Panvel Campus",
  },
];

const AVAILABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const STATUS_LABELS: Record<MentorshipRequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

const STATUS_CLASSES: Record<MentorshipRequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  declined: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
};

const EMPTY_REQUEST_FORM: StudentRequestForm = {
  subject: "",
  goal: "",
  message: "",
  preferredMode: "online",
  preferredDate: "",
  preferredTime: "",
};

const EMPTY_PROFILE_FORM: FacultyProfileForm = {
  isAvailable: false,
  subjects: "",
  modes: ["online"],
  availableDays: [],
  availableFrom: "",
  availableTo: "",
  maximumActiveStudents: "5",
  bio: "",
  languages: "",
};

function getModeLabel(mode: MentorshipMode) {
  return MENTORSHIP_MODES.find((item) => item.value === mode)?.label ?? mode;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatDate(value?: string) {
  if (!value) {
    return "Not selected";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
  }).format(date);
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as {
      error?: string;
    };

    return body.error || "Unable to complete this request.";
  } catch {
    return "Unable to complete this request.";
  }
}

export function PersonalMentorship({ session, role }: PersonalMentorshipProps) {
  const [faculty, setFaculty] = useState<MentorshipFacultyCard[]>([]);

  const [requests, setRequests] = useState<MentorshipRequest[]>([]);

  const [profile, setProfile] = useState<FacultyMentorshipProfile | null>(null);

  const [profileForm, setProfileForm] =
    useState<FacultyProfileForm>(EMPTY_PROFILE_FORM);

  const [selectedFaculty, setSelectedFaculty] =
    useState<MentorshipFacultyCard | null>(null);

  const [viewingFaculty, setViewingFaculty] =
    useState<MentorshipFacultyCard | null>(null);

  const [requestForm, setRequestForm] =
    useState<StudentRequestForm>(EMPTY_REQUEST_FORM);

  const [actionDrafts, setActionDrafts] = useState<
    Record<string, RequestActionDraft>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadData = useCallback(async () => {
    if (!session?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (role === "student") {
        const [facultyResponse, requestsResponse] = await Promise.all([
          fetch("/api/mentorship/faculty", {
            cache: "no-store",
          }),
          fetch("/api/mentorship/requests", {
            cache: "no-store",
          }),
        ]);

        if (!facultyResponse.ok) {
          throw new Error(await readApiError(facultyResponse));
        }

        if (!requestsResponse.ok) {
          throw new Error(await readApiError(requestsResponse));
        }

        const facultyBody = (await facultyResponse.json()) as {
          faculty?: MentorshipFacultyCard[];
        };

        const requestsBody = (await requestsResponse.json()) as {
          requests?: MentorshipRequest[];
        };

        setFaculty(facultyBody.faculty ?? []);
        setRequests(requestsBody.requests ?? []);
      }

      if (role === "educator") {
        const [profileResponse, requestsResponse] = await Promise.all([
          fetch("/api/mentorship/profile", {
            cache: "no-store",
          }),
          fetch("/api/mentorship/requests", {
            cache: "no-store",
          }),
        ]);

        if (!profileResponse.ok) {
          throw new Error(await readApiError(profileResponse));
        }

        if (!requestsResponse.ok) {
          throw new Error(await readApiError(requestsResponse));
        }

        const profileBody = (await profileResponse.json()) as {
          profile?: FacultyMentorshipProfile | null;
        };

        const requestsBody = (await requestsResponse.json()) as {
          requests?: MentorshipRequest[];
        };

        const loadedProfile = profileBody.profile ?? null;

        setProfile(loadedProfile);
        setRequests(requestsBody.requests ?? []);

        if (loadedProfile) {
          setProfileForm({
            isAvailable: loadedProfile.isAvailable,
            subjects: loadedProfile.subjects.join(", "),
            modes: loadedProfile.modes,
            availableDays: loadedProfile.availableDays,
            availableFrom: loadedProfile.availableFrom ?? "",
            availableTo: loadedProfile.availableTo ?? "",
            maximumActiveStudents: String(loadedProfile.maximumActiveStudents),
            bio: loadedProfile.bio ?? "",
            languages: loadedProfile.languages?.join(", ") ?? "",
          });
        } else {
          setProfileForm(EMPTY_PROFILE_FORM);
        }
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [role, session?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openRequestModal(selectedMentor: MentorshipFacultyCard) {
    setSelectedFaculty(selectedMentor);

    setRequestForm({
      subject: selectedMentor.subjects[0] ?? "",
      goal: "",
      message: "",
      preferredMode: selectedMentor.modes[0] ?? "online",
      preferredDate: "",
      preferredTime: "",
    });

    setError("");
    setSuccess("");
  }

  function closeRequestModal() {
    setSelectedFaculty(null);
    setRequestForm(EMPTY_REQUEST_FORM);
  }

  async function submitMentorshipRequest() {
    if (!selectedFaculty) {
      return;
    }

    if (!requestForm.subject.trim()) {
      setError("Select a mentorship subject.");
      return;
    }

    if (!requestForm.goal.trim()) {
      setError("Tell the mentor what help you need.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/mentorship/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId: selectedFaculty.facultyId,
          subject: requestForm.subject,
          goal: requestForm.goal,
          message: requestForm.message,
          preferredMode: requestForm.preferredMode,
          preferredDate: requestForm.preferredDate,
          preferredTime: requestForm.preferredTime,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccess(
        `Your mentorship request has been sent to ${selectedFaculty.facultyName}.`,
      );

      closeRequestModal();
      await loadData();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function saveMentorshipProfile() {
    const subjects = profileForm.subjects
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const languages = profileForm.languages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!subjects.length) {
      setError("Add at least one mentorship subject.");
      return;
    }

    if (!profileForm.modes.length) {
      setError("Select at least one mentorship mode.");
      return;
    }

    if (!profileForm.availableDays.length) {
      setError("Select at least one available day.");
      return;
    }

    const maximumActiveStudents = Number(profileForm.maximumActiveStudents);

    if (!Number.isInteger(maximumActiveStudents) || maximumActiveStudents < 1) {
      setError("Maximum active students must be at least 1.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/mentorship/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailable: profileForm.isAvailable,
          subjects,
          modes: profileForm.modes,
          availableDays: profileForm.availableDays,
          availableFrom: profileForm.availableFrom,
          availableTo: profileForm.availableTo,
          maximumActiveStudents,
          bio: profileForm.bio,
          languages,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const body = (await response.json()) as {
        profile?: FacultyMentorshipProfile;
      };

      setProfile(body.profile ?? null);
      setSuccess("Your mentorship profile has been saved.");

      await loadData();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function getActionDraft(requestId: string): RequestActionDraft {
    return (
      actionDrafts[requestId] ?? {
        facultyResponse: "",
        scheduledAt: "",
        meetingLink: "",
        location: "",
      }
    );
  }

  function updateActionDraft(
    requestId: string,
    updates: Partial<RequestActionDraft>,
  ) {
    setActionDrafts((current) => ({
      ...current,
      [requestId]: {
        ...getActionDraft(requestId),
        ...updates,
      },
    }));
  }

  async function updateRequestStatus(
    request: MentorshipRequest,
    status: MentorshipRequestStatus,
  ) {
    const draft = getActionDraft(request.id);

    setProcessingRequestId(request.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/mentorship/requests/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          facultyResponse: draft.facultyResponse,
          scheduledAt: draft.scheduledAt,
          meetingLink: draft.meetingLink,
          location: draft.location,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccess(`${request.subject} mentorship has been ${status}.`);

      setActionDrafts((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });

      await loadData();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setProcessingRequestId(null);
    }
  }

  function toggleProfileMode(mode: MentorshipMode) {
    setProfileForm((current) => ({
      ...current,
      modes: current.modes.includes(mode)
        ? current.modes.filter((item) => item !== mode)
        : [...current.modes, mode],
    }));
  }

  function toggleAvailableDay(day: string) {
    setProfileForm((current) => ({
      ...current,
      availableDays: current.availableDays.includes(day)
        ? current.availableDays.filter((item) => item !== day)
        : [...current.availableDays, day],
    }));
  }

  const activeRequests = requests.filter(
    (request) => request.status === "pending" || request.status === "accepted",
  );

  const completedRequests = requests.filter(
    (request) =>
      request.status === "completed" ||
      request.status === "declined" ||
      request.status === "cancelled",
  );

  if (!session) {
    return (
      <section className="surface rounded-[2rem] p-6">
        <p className="text-sm font-semibold text-rose-600">
          Your session could not be loaded.
        </p>
      </section>
    );
  }

  if (role !== "student" && role !== "educator") {
    return (
      <section className="surface rounded-[2rem] p-6">
        <p className="text-sm text-[var(--color-muted)]">
          Personal Mentorship is available for students and educators.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
        <div className="surface rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-label">Personal Mentorship</p>

              <h2 className="mt-3 text-2xl font-black text-[var(--color-heading)]">
                {role === "student"
                  ? "Connect With a Personal Mentor"
                  : "Manage Your Mentorship"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                {role === "student"
                  ? "Choose an available faculty mentor, share your academic goal, and request personalised guidance."
                  : "Set your availability and manage mentorship requests received from students."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="surface flex min-h-56 items-center justify-center rounded-[2rem] p-6">
            <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-muted)]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Loading mentorship information...
            </div>
          </div>
        ) : null}

        {!loading && role === "student" ? (
          <>
            <div className="surface rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <UsersRound className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-[var(--color-heading)]">
                    Available Faculty Mentors
                  </h3>

                  <p className="text-sm text-[var(--color-muted)]">
                    Only faculty with remaining mentorship capacity are shown.
                  </p>
                </div>
              </div>

              {faculty.length ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {faculty.map((mentor) => (
                    <article
                      key={mentor.facultyId}
                      className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex min-h-[72px] items-start gap-4">
                        {mentor.facultyPhoto ? (
                          <img
                            src={mentor.facultyPhoto}
                            alt={mentor.facultyName}
                            className="h-14 w-14 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <UserRoundCheck className="h-7 w-7" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="truncate text-base font-black text-slate-900">
                            {mentor.facultyName}
                          </h4>

                          <p className="mt-1 min-h-[32px] line-clamp-2 text-xs font-semibold leading-4 text-slate-500">
                            {mentor.qualification || "Faculty Mentor"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-1 flex-col gap-3 text-sm">
                        <div className="flex min-h-[72px] items-start gap-2">
                          <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                          <span className="line-clamp-4 leading-6 text-slate-600">
                            {mentor.subjects.join(", ")}
                          </span>
                        </div>

                        <div className="flex min-h-[24px] items-start gap-2">
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                          <span className="leading-5 text-slate-600">
                            {mentor.experience?.trim() ||
                              "Experience not specified"}
                          </span>
                        </div>

                        <div className="flex min-h-[24px] items-start gap-2">
                          <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                          <span className="leading-5 text-slate-600">
                            {mentor.modes.map(getModeLabel).join(", ")}
                          </span>
                        </div>

                        <div className="mt-auto flex min-h-[40px] items-center rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                          {mentor.remainingCapacity} mentorship
                          {mentor.remainingCapacity === 1
                            ? " seat"
                            : " seats"}{" "}
                          remaining
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-5">
                        <button
                          type="button"
                          onClick={() => setViewingFaculty(mentor)}
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          View Profile
                        </button>

                        <button
                          type="button"
                          onClick={() => openRequestModal(mentor)}
                          className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          Request
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <UserRoundCheck className="mx-auto h-9 w-9 text-slate-400" />

                  <p className="mt-3 font-bold text-slate-700">
                    No faculty mentors are available right now.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Available faculty will appear here after setting up their
                    mentorship profile.
                  </p>
                </div>
              )}
            </div>

            <RequestList
              title="Your Active Requests"
              requests={activeRequests}
              role={role}
              processingRequestId={processingRequestId}
              onUpdateStatus={updateRequestStatus}
            />

            {completedRequests.length ? (
              <RequestList
                title="Request History"
                requests={completedRequests}
                role={role}
                processingRequestId={processingRequestId}
                onUpdateStatus={updateRequestStatus}
              />
            ) : null}
          </>
        ) : null}

        {!loading && role === "educator" ? (
          <>
            <div className="surface rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                  <Settings2 className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-[var(--color-heading)]">
                    Mentorship Profile
                  </h3>

                  <p className="text-sm text-[var(--color-muted)]">
                    Students can see your profile only when availability is
                    enabled.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Mentorship subjects *
                  </span>

                  <input
                    value={profileForm.subjects}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        subjects: event.target.value,
                      }))
                    }
                    placeholder="Mathematics, Physics, Chemistry"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <span className="text-xs text-slate-500">
                    Separate subjects using commas.
                  </span>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Maximum active students *
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={profileForm.maximumActiveStudents}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        maximumActiveStudents: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="space-y-2 lg:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    Mentorship modes *
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {MENTORSHIP_MODES.map((mode) => {
                      const selected = profileForm.modes.includes(mode.value);

                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => toggleProfileMode(mode.value)}
                          className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    Available days *
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_DAYS.map((day) => {
                      const selected = profileForm.availableDays.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleAvailableDay(day)}
                          className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                            selected
                              ? "border-violet-600 bg-violet-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Available from
                  </span>

                  <input
                    type="time"
                    value={profileForm.availableFrom}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        availableFrom: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Available until
                  </span>

                  <input
                    type="time"
                    value={profileForm.availableTo}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        availableTo: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2 lg:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    Languages
                  </span>

                  <input
                    value={profileForm.languages}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        languages: event.target.value,
                      }))
                    }
                    placeholder="English, Hindi, Marathi"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2 lg:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    Mentorship introduction
                  </span>

                  <textarea
                    rows={4}
                    value={profileForm.bio}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        bio: event.target.value,
                      }))
                    }
                    placeholder="Explain how you support students and what they can expect from your mentorship."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profileForm.isAvailable}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        isAvailable: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-slate-300 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-black text-slate-800">
                      Available for mentorship
                    </p>

                    <p className="text-xs text-slate-500">
                      Your profile will be shown to students.
                    </p>
                  </div>
                </label>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveMentorshipProfile()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {profile ? "Update Profile" : "Create Profile"}
                </button>
              </div>
            </div>

            <EducatorRequestList
              title="Active Mentorship Requests"
              requests={activeRequests}
              actionDrafts={actionDrafts}
              processingRequestId={processingRequestId}
              onDraftChange={updateActionDraft}
              onUpdateStatus={updateRequestStatus}
            />

            {completedRequests.length ? (
              <EducatorRequestList
                title="Mentorship History"
                requests={completedRequests}
                actionDrafts={actionDrafts}
                processingRequestId={processingRequestId}
                onDraftChange={updateActionDraft}
                onUpdateStatus={updateRequestStatus}
              />
            ) : null}
          </>
        ) : null}
      </section>

      {selectedFaculty ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  Request Mentorship
                </p>

                <h3 className="mt-2 text-2xl font-black text-slate-900">
                  {selectedFaculty.facultyName}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeRequestModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">
                  Subject *
                </span>

                <select
                  value={requestForm.subject}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {selectedFaculty.subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">
                  Preferred mode *
                </span>

                <select
                  value={requestForm.preferredMode}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      preferredMode: event.target.value as MentorshipMode,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {selectedFaculty.modes.map((mode) => (
                    <option key={mode} value={mode}>
                      {getModeLabel(mode)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">
                  Preferred date
                </span>

                <input
                  type="date"
                  min={today}
                  value={requestForm.preferredDate}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      preferredDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">
                  Preferred time
                </span>

                <input
                  type="time"
                  value={requestForm.preferredTime}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      preferredTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  What help do you need? *
                </span>

                <textarea
                  rows={3}
                  value={requestForm.goal}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      goal: event.target.value,
                    }))
                  }
                  placeholder="Example: I need help improving my Physics problem-solving and exam strategy."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Message to mentor
                </span>

                <textarea
                  rows={3}
                  value={requestForm.message}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Add any additional information for the faculty mentor."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRequestModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void submitMentorshipRequest()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewingFaculty ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {viewingFaculty.facultyPhoto ? (
                  <img
                    src={viewingFaculty.facultyPhoto}
                    alt={viewingFaculty.facultyName}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <UserRoundCheck className="h-8 w-8" />
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {viewingFaculty.facultyName}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {viewingFaculty.qualification || "Faculty Mentor"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingFaculty(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {viewingFaculty.bio ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {viewingFaculty.bio}
                </p>
              ) : null}

              <ProfileRow
                icon={<BookOpenCheck className="h-4 w-4" />}
                label="Subjects"
                value={viewingFaculty.subjects.join(", ")}
              />

              <ProfileRow
                icon={<GraduationCap className="h-4 w-4" />}
                label="Experience"
                value={viewingFaculty.experience || "Not specified"}
              />

              <ProfileRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Available days"
                value={viewingFaculty.availableDays.join(", ")}
              />

              <ProfileRow
                icon={<Clock3 className="h-4 w-4" />}
                label="Available time"
                value={
                  viewingFaculty.availableFrom && viewingFaculty.availableTo
                    ? `${viewingFaculty.availableFrom} - ${viewingFaculty.availableTo}`
                    : "Contact mentor after acceptance"
                }
              />

              <ProfileRow
                icon={<Monitor className="h-4 w-4" />}
                label="Modes"
                value={viewingFaculty.modes.map(getModeLabel).join(", ")}
              />

              <ProfileRow
                icon={<Languages className="h-4 w-4" />}
                label="Languages"
                value={viewingFaculty.languages?.join(", ") || "Not specified"}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setViewingFaculty(null);
                openRequestModal(viewingFaculty);
              }}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              Request Mentorship
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
      <div className="mt-0.5 text-blue-600">{icon}</div>

      <div>
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function RequestList({
  title,
  requests,
  role,
  processingRequestId,
  onUpdateStatus,
}: {
  title: string;
  requests: MentorshipRequest[];
  role: Role;
  processingRequestId: string | null;
  onUpdateStatus: (
    request: MentorshipRequest,
    status: MentorshipRequestStatus,
  ) => Promise<void>;
}) {
  return (
    <div className="surface rounded-[2rem] p-6">
      <h3 className="text-lg font-black text-[var(--color-heading)]">
        {title}
      </h3>

      {requests.length ? (
        <div className="mt-5 space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {request.subject}
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Mentor: {request.facultyName}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_CLASSES[request.status]}`}
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <RequestDetail label="Goal" value={request.goal} />

                <RequestDetail
                  label="Mode"
                  value={getModeLabel(request.preferredMode)}
                />

                <RequestDetail
                  label="Preferred date"
                  value={formatDate(request.preferredDate)}
                />

                <RequestDetail
                  label="Preferred time"
                  value={request.preferredTime || "Not selected"}
                />
              </div>

              {request.facultyResponse ? (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                    Faculty response
                  </p>

                  <p className="mt-1 text-sm text-blue-900">
                    {request.facultyResponse}
                  </p>
                </div>
              ) : null}

              {request.scheduledAt ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Session scheduled for{" "}
                  <strong>{formatDate(request.scheduledAt)}</strong>
                </div>
              ) : null}

              {request.meetingLink ? (
                <a
                  href={request.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                >
                  <Monitor className="h-4 w-4" />
                  Join Session
                </a>
              ) : null}

              {request.location ? (
                <div className="mt-4 flex items-start gap-2 text-sm font-semibold text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {request.location}
                </div>
              ) : null}

              {role === "student" &&
              (request.status === "pending" ||
                request.status === "accepted") ? (
                <button
                  type="button"
                  disabled={processingRequestId === request.id}
                  onClick={() => void onUpdateStatus(request, "cancelled")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  {processingRequestId === request.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Cancel Request
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          No mentorship requests are available in this section.
        </p>
      )}
    </div>
  );
}

function EducatorRequestList({
  title,
  requests,
  actionDrafts,
  processingRequestId,
  onDraftChange,
  onUpdateStatus,
}: {
  title: string;
  requests: MentorshipRequest[];
  actionDrafts: Record<string, RequestActionDraft>;
  processingRequestId: string | null;
  onDraftChange: (
    requestId: string,
    updates: Partial<RequestActionDraft>,
  ) => void;
  onUpdateStatus: (
    request: MentorshipRequest,
    status: MentorshipRequestStatus,
  ) => Promise<void>;
}) {
  return (
    <div className="surface rounded-[2rem] p-6">
      <h3 className="text-lg font-black text-[var(--color-heading)]">
        {title}
      </h3>

      {requests.length ? (
        <div className="mt-5 space-y-5">
          {requests.map((request) => {
            const draft = actionDrafts[request.id] ?? {
              facultyResponse: "",
              scheduledAt: "",
              meetingLink: "",
              location: "",
            };

            const processing = processingRequestId === request.id;

            return (
              <article
                key={request.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {request.studentName}
                    </h4>

                    <p className="mt-1 text-sm font-semibold text-blue-600">
                      {request.subject}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_CLASSES[request.status]}`}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <RequestDetail label="Student goal" value={request.goal} />

                  <RequestDetail
                    label="Preferred mode"
                    value={getModeLabel(request.preferredMode)}
                  />

                  <RequestDetail
                    label="Preferred date"
                    value={formatDate(request.preferredDate)}
                  />

                  <RequestDetail
                    label="Preferred time"
                    value={request.preferredTime || "Not selected"}
                  />
                </div>

                {request.message ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Student message
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {request.message}
                    </p>
                  </div>
                ) : null}

                {request.status === "pending" ||
                request.status === "accepted" ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Response to student
                      </span>

                      <textarea
                        rows={3}
                        value={draft.facultyResponse}
                        onChange={(event) =>
                          onDraftChange(request.id, {
                            facultyResponse: event.target.value,
                          })
                        }
                        placeholder="Add guidance, acceptance details, or decline reason."
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        First session date and time
                      </span>

                      <input
                        type="datetime-local"
                        value={draft.scheduledAt}
                        onChange={(event) =>
                          onDraftChange(request.id, {
                            scheduledAt: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    {request.preferredMode === "online" ? (
                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">
                          Meeting link
                        </span>

                        <input
                          type="url"
                          value={draft.meetingLink}
                          onChange={(event) =>
                            onDraftChange(request.id, {
                              meetingLink: event.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    ) : (
                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">
                          Session location
                        </span>

                        <input
                          value={draft.location}
                          onChange={(event) =>
                            onDraftChange(request.id, {
                              location: event.target.value,
                            })
                          }
                          placeholder={getModeLabel(request.preferredMode)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    )}
                  </div>
                ) : null}

                {request.status === "pending" ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => void onUpdateStatus(request, "accepted")}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {processing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Accept
                    </button>

                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => void onUpdateStatus(request, "declined")}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                ) : null}

                {request.status === "accepted" ? (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => void onUpdateStatus(request, "completed")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {processing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark Completed
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <MessageSquareText className="mx-auto h-9 w-9 text-slate-400" />

          <p className="mt-3 font-bold text-slate-700">
            No mentorship requests found.
          </p>
        </div>
      )}
    </div>
  );
}

function RequestDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
