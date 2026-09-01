"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser, DashboardBundle } from "@/lib/types";

function getInitials(name?: string) {
  if (!name) return "ST";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleColor(role: string) {
  switch (role) {
    case "admin":
      return "from-rose-500 to-pink-600";
    case "educator":
      return "from-violet-500 to-indigo-600";
    case "student":
      return "from-emerald-500 to-teal-600";
    case "parent":
      return "from-amber-500 to-orange-600";
    case "counsellor":
      return "from-sky-500 to-cyan-600";
    default:
      return "from-indigo-500 to-purple-600";
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case "admin":
      return "bi-shield-check";
    case "educator":
      return "bi-mortarboard";
    case "student":
      return "bi-book";
    case "parent":
      return "bi-people";
    case "counsellor":
      return "bi-chat-dots";
    default:
      return "bi-person";
  }
}

type Props = {
  session: SessionUser;
};

export function MyProfileClient({ session }: Props) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [name, setName] = useState(session.name);
  const [email] = useState(session.email);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [bio, setBio] = useState("");

  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [courseWanted, setCourseWanted] = useState("");
  const [studentType, setStudentType] = useState("");
  const [latestQualification, setLatestQualification] = useState("");
  const [latestAcademicScore, setLatestAcademicScore] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [weakInput, setWeakInput] = useState("");
  const [strongInput, setStrongInput] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.dashboard) {
          const d = data.dashboard as DashboardBundle;
          setDashboard(d);
          const p = d.profile;
          if (p) {
            setProfilePhoto(p.profilePhoto ?? "");
            setPhone(p.guardianPhone ?? "");
            setGender(p.gender ?? "");
            setDob(p.dob ?? p.dateOfBirth ?? "");
            setFatherName(p.fatherName ?? "");
            setAddress(
              ([p.addressLine1, p.addressLine2].filter(Boolean).join(", ") ||
                p.address) ??
                "",
            );
            setCity(p.city ?? "");
            setState(p.state ?? "");
            setPincode(p.pincode ?? "");
            setQualification(p.qualification ?? "");
            setExperience(p.experience ?? "");
            if (p.subjects) {
              setSubjects(
                Array.isArray(p.subjects) ? p.subjects : [p.subjects],
              );
            }
            setParentName(p.parentName ?? "");
            setParentEmail(p.parentEmail ?? "");
            setParentMobile(p.parentMobile ?? "");
            setCourseWanted(p.courseWantedTitle ?? p.courseWanted ?? "");
            setStudentType(p.studentType ?? "");
            setLatestQualification(p.latestQualification ?? "");
            setLatestAcademicScore(p.latestAcademicScore ?? "");
            if (p.weakSubjects?.length) setWeakSubjects(p.weakSubjects);
            if (p.strongSubjects?.length) setStrongSubjects(p.strongSubjects);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addSubject() {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) {
      setSubjects((prev) => [...prev, s]);
      setSubjectInput("");
    }
  }
  function removeSubject(s: string) {
    setSubjects((prev) => prev.filter((x) => x !== s));
  }
  function handleSubjectKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubject();
    }
  }

  function addWeak() {
    const s = weakInput.trim();
    if (s && !weakSubjects.includes(s)) {
      setWeakSubjects((prev) => [...prev, s]);
      setWeakInput("");
    }
  }
  function removeWeak(s: string) {
    setWeakSubjects((prev) => prev.filter((x) => x !== s));
  }

  function addStrong() {
    const s = strongInput.trim();
    if (s && !strongSubjects.includes(s)) {
      setStrongSubjects((prev) => [...prev, s]);
      setStrongInput("");
    }
  }
  function removeStrong(s: string) {
    setStrongSubjects((prev) => prev.filter((x) => x !== s));
  }
  async function handleProfilePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setStatus("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus("Profile picture must be smaller than 5 MB.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setStatus("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", "photo");

      const uploadResponse = await fetch("/api/upload/signup", {
        method: "POST",
        body: formData,
      });

      const uploadData = (await uploadResponse.json()) as {
        success?: boolean;
        url?: string;
        message?: string;
        error?: string;
      };

      if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
        throw new Error(
          uploadData.message || uploadData.error || "Photo upload failed.",
        );
      }

      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profilePhoto: uploadData.url,
        }),
      });

      const profileData = (await profileResponse.json()) as {
        error?: string;
      };

      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Unable to save profile picture.");
      }

      setProfilePhoto(uploadData.url);
      setStatus("Profile picture updated successfully!");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Profile picture update failed.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  }
  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      const body: Record<string, unknown> = {};
      if (name !== session.name) body.name = name;
      const profileUpdates: Record<string, unknown> = {};
      if (phone) profileUpdates.guardianPhone = phone;
      if (gender) profileUpdates.gender = gender;
      if (dob) profileUpdates.dob = dob;
      if (fatherName) profileUpdates.fatherName = fatherName;
      if (address) profileUpdates.addressLine1 = address;
      if (city) profileUpdates.city = city;
      if (state) profileUpdates.state = state;
      if (pincode) profileUpdates.pincode = pincode;
      if (session.role === "educator") {
        if (qualification) profileUpdates.qualification = qualification;
        if (experience) profileUpdates.experience = experience;
        if (subjects.length > 0) profileUpdates.subjects = subjects;
      }
      if (session.role === "student" || session.role === "parent") {
        if (parentName) profileUpdates.parentName = parentName;
        if (parentEmail) profileUpdates.parentEmail = parentEmail;
        if (parentMobile) profileUpdates.parentMobile = parentMobile;
        if (courseWanted) profileUpdates.courseWantedTitle = courseWanted;
        if (studentType) profileUpdates.studentType = studentType;
        if (latestQualification)
          profileUpdates.latestQualification = latestQualification;
        if (latestAcademicScore)
          profileUpdates.latestAcademicScore = latestAcademicScore;
      }
      if (weakSubjects.length > 0) profileUpdates.weakSubjects = weakSubjects;
      if (strongSubjects.length > 0)
        profileUpdates.strongSubjects = strongSubjects;

      if (
        Object.keys(body).length === 0 &&
        Object.keys(profileUpdates).length === 0
      ) {
        setStatus("No changes to save.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...profileUpdates }),
      });
      if (res.ok) {
        setStatus("Profile updated successfully!");
        router.refresh();
      } else {
        const data = await res.json();
        setStatus(data.error ?? "Update failed.");
      }
    } catch {
      setStatus("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordStatus("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    setPasswordStatus("");
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordStatus("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordStatus(data.error ?? "Failed to change password.");
      }
    } catch {
      setPasswordStatus("Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/profile/delete-account", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setDeleteError(data.error ?? "Failed to delete account.");
      }
    } catch {
      setDeleteError("Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const p = dashboard?.profile;
  const roleColor = getRoleColor(session.role);
  const roleIcon = getRoleIcon(session.role);

  function ProfileField({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) {
    if (!value) return null;
    return (
      <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-800 text-right">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your personal and professional information
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <i className="bi bi-arrow-left" />
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="relative mx-auto h-24 w-24">
                {profilePhoto ? (
                  <div className="h-24 w-24 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white">
                    <img
                      src={profilePhoto}
                      alt={`${session.name} profile`}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${roleColor} shadow-lg ring-4 ring-white/80`}
                  >
                    <span className="text-3xl font-black text-white">
                      {getInitials(session.name)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  aria-label="Update profile picture"
                  title="Update profile picture"
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-indigo-600 text-white shadow-lg transition hover:scale-110 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M16.862 3.487a2.121 2.121 0 0 1 3 3L8.5 17.85 4 19l1.15-4.5L16.862 3.487Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="m14.75 5.6 3.65 3.65"
                      />
                    </svg>
                  )}
                </button>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {session.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{email}</p>
              {session.role === "educator" && session.facultyCode && (
                <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                  Faculty ID: {session.facultyCode}
                </p>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <i className={`bi ${roleIcon}`} />
                {session.label || session.role}
              </div>
              {session.verified ? (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <i className="bi bi-patch-check-fill" />
                  Verified Account
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <i className="bi bi-exclamation-triangle-fill" />
                  Not Verified
                </div>
              )}
            </div>

            {/* Profile info summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Profile Details
              </h3>
              <div className="space-y-0">
                {session.role === "educator" && session.facultyCode && (
                  <ProfileField
                    label="Faculty ID"
                    value={session.facultyCode}
                  />
                )}
                {phone && <ProfileField label="Phone" value={phone} />}
                {gender && <ProfileField label="Gender" value={gender} />}
                {dob && <ProfileField label="DOB" value={dob} />}
                {p?.fatherName && (
                  <ProfileField label="Father" value={p.fatherName} />
                )}
                {(p?.city || p?.state) && (
                  <ProfileField
                    label="Location"
                    value={[p?.city, p?.state].filter(Boolean).join(", ")}
                  />
                )}
                {p?.pincode && (
                  <ProfileField label="Pincode" value={p.pincode} />
                )}
                {session.role === "educator" && qualification && (
                  <ProfileField label="Qualification" value={qualification} />
                )}
                {session.role === "educator" && experience && (
                  <ProfileField
                    label="Experience"
                    value={`${experience} years`}
                  />
                )}
                {subjects.length > 0 && (
                  <ProfileField label="Subjects" value={subjects.join(", ")} />
                )}
                {(session.role === "student" || session.role === "parent") &&
                  courseWanted && (
                    <ProfileField label="Course" value={courseWanted} />
                  )}
                {studentType && (
                  <ProfileField label="Type" value={studentType} />
                )}
                {(session.role === "student" || session.role === "parent") &&
                  parentName && (
                    <ProfileField label="Parent" value={parentName} />
                  )}
                {(session.role === "student" || session.role === "parent") &&
                  parentMobile && (
                    <ProfileField label="Parent Phone" value={parentMobile} />
                  )}
                {latestQualification && (
                  <ProfileField
                    label="Last Qualification"
                    value={latestQualification}
                  />
                )}
                {latestAcademicScore && (
                  <ProfileField
                    label="Academic Score"
                    value={latestAcademicScore}
                  />
                )}
                {weakSubjects.length > 0 && (
                  <ProfileField
                    label="Weak Subjects"
                    value={weakSubjects.join(", ")}
                  />
                )}
                {strongSubjects.length > 0 && (
                  <ProfileField
                    label="Strong Subjects"
                    value={strongSubjects.join(", ")}
                  />
                )}
              </div>
              {!phone &&
                !gender &&
                !dob &&
                !p?.fatherName &&
                !courseWanted &&
                subjects.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No additional profile data yet. Fill the form to update.
                  </p>
                )}
            </div>

            {/* Linked student details for parents */}
            {session.role === "parent" && dashboard?.linkedStudentProfile && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-600">
                  <i className="bi bi-person-lines-fill me-1" />
                  Student Details
                </h3>
                <div className="space-y-0">
                  {dashboard.linkedStudentProfile.name && (
                    <ProfileField
                      label="Student Name"
                      value={dashboard.linkedStudentProfile.name}
                    />
                  )}
                  {dashboard.linkedStudentProfile.email && (
                    <ProfileField
                      label="Student Email"
                      value={dashboard.linkedStudentProfile.email}
                    />
                  )}
                  {dashboard.linkedStudentProfile.phone && (
                    <ProfileField
                      label="Student Phone"
                      value={dashboard.linkedStudentProfile.phone}
                    />
                  )}
                  {dashboard.linkedStudentProfile.course && (
                    <ProfileField
                      label="Course"
                      value={dashboard.linkedStudentProfile.course}
                    />
                  )}
                  {dashboard.linkedStudentProfile.batch && (
                    <ProfileField
                      label="Batch"
                      value={dashboard.linkedStudentProfile.batch}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Quick Links
              </h3>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <i className="bi bi-speedometer2 text-indigo-500" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <i className="bi bi-shield-lock text-amber-500" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Right main content */}
          <div className="space-y-6">
            {/* Profile form */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${roleColor} px-6 py-5`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232a3 3 0 114.243 4.243L9 19.95 4 21l1.05-5L15.232 5.232z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Profile Information
                    </h3>
                    <p className="text-sm text-white/70">
                      Update your personal details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {status && (
                  <div
                    className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold border ${
                      status.includes("success")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status.includes("No changes")
                          ? "bg-slate-50 text-slate-600 border-slate-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    <i
                      className={`bi ${status.includes("success") ? "bi-check-circle-fill" : "bi-info-circle-fill"} me-2`}
                    />
                    {status}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 60))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.slice(0, 15))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="Contact number"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Father&apos;s Name
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) =>
                        setFatherName(e.target.value.slice(0, 60))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="e.g. Ankit"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value.slice(0, 120))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value.slice(0, 40))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.slice(0, 40))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="Pincode"
                    />
                  </div>

                  {/* ── Educator fields ── */}
                  {session.role === "educator" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Qualification
                        </label>
                        <input
                          type="text"
                          value={qualification}
                          onChange={(e) =>
                            setQualification(e.target.value.slice(0, 80))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="e.g. M.Sc Physics, B.Ed"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) =>
                            setSpecialization(e.target.value.slice(0, 80))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="e.g. JEE Advanced Physics"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Experience (years)
                        </label>
                        <input
                          type="number"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          min="0"
                          max="50"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Faculty ID
                        </label>

                        <input
                          type="text"
                          value={session.facultyCode ?? "Not assigned"}
                          disabled
                          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-semibold text-slate-600 shadow-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* ── Student fields ── */}
                  {session.role === "student" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Student ID
                        </label>
                        <input
                          type="text"
                          value={session.id}
                          disabled
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Course
                        </label>
                        <input
                          type="text"
                          value={courseWanted}
                          onChange={(e) =>
                            setCourseWanted(e.target.value.slice(0, 80))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="e.g. Class 12 - Science"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Student Type
                        </label>
                        <select
                          value={studentType}
                          onChange={(e) => setStudentType(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        >
                          <option value="">Select</option>
                          <option value="on-campus">On Campus</option>
                          <option value="online">Online</option>
                          <option value="centre-based">Centre Based</option>
                          <option value="home">Home</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Parent Name
                        </label>
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) =>
                            setParentName(e.target.value.slice(0, 60))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="e.g. Supriya"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Parent Email
                        </label>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) =>
                            setParentEmail(e.target.value.slice(0, 80))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="parent@email.com"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Parent Mobile
                        </label>
                        <input
                          type="text"
                          value={parentMobile}
                          onChange={(e) =>
                            setParentMobile(e.target.value.slice(0, 15))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Last Qualification
                        </label>
                        <input
                          type="text"
                          value={latestQualification}
                          onChange={(e) =>
                            setLatestQualification(e.target.value.slice(0, 80))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="e.g. Class 10 - 85%"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Academic Score
                        </label>
                        <input
                          type="text"
                          value={latestAcademicScore}
                          onChange={(e) =>
                            setLatestAcademicScore(e.target.value.slice(0, 20))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="e.g. 92%"
                        />
                      </div>
                    </>
                  )}

                  {/* ── Subjects (educator & student) ── */}
                  {(session.role === "educator" ||
                    session.role === "student") && (
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        {session.role === "educator"
                          ? "Subjects Taught"
                          : "Subjects"}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {subjects.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                          >
                            {s}
                            <button
                              type="button"
                              onClick={() => removeSubject(s)}
                              className="inline-flex items-center justify-center rounded-full hover:bg-indigo-100 h-4 w-4 transition-colors"
                            >
                              <i className="bi bi-x text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          onKeyDown={handleSubjectKeyDown}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="Type subject and press Enter…"
                        />
                        <button
                          type="button"
                          onClick={addSubject}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <i className="bi bi-plus-lg" /> Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Weak / Strong Subjects (student) ── */}
                  {session.role === "student" && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Weak Subjects
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {weakSubjects.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            >
                              {s}
                              <button
                                type="button"
                                onClick={() => removeWeak(s)}
                                className="inline-flex items-center justify-center rounded-full hover:bg-red-100 h-4 w-4 transition-colors"
                              >
                                <i className="bi bi-x text-xs" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={weakInput}
                            onChange={(e) => setWeakInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addWeak();
                              }
                            }}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            placeholder="Type subject and press Enter…"
                          />
                          <button
                            type="button"
                            onClick={addWeak}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors shadow-sm"
                          >
                            <i className="bi bi-plus-lg" /> Add
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Strong Subjects
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {strongSubjects.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                            >
                              {s}
                              <button
                                type="button"
                                onClick={() => removeStrong(s)}
                                className="inline-flex items-center justify-center rounded-full hover:bg-emerald-100 h-4 w-4 transition-colors"
                              >
                                <i className="bi bi-x text-xs" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={strongInput}
                            onChange={(e) => setStrongInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addStrong();
                              }
                            }}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            placeholder="Type subject and press Enter…"
                          />
                          <button
                            type="button"
                            onClick={addStrong}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <i className="bi bi-plus-lg" /> Add
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bio */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Bio / About
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="Brief description…"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <i className="bi bi-check-lg text-base" />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            {showPasswordForm && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <i className="bi bi-shield-lock text-xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Change Password
                      </h3>
                      <p className="text-sm text-white/70">
                        Update your account password
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {passwordStatus && (
                    <div
                      className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold border ${
                        passwordStatus.includes("success")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      <i
                        className={`bi ${passwordStatus.includes("success") ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"} me-2`}
                      />
                      {passwordStatus}
                    </div>
                  )}
                  <div className="max-w-sm space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <i className="bi bi-shield-check" />
                      {savingPassword ? "Changing…" : "Change Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Account - hidden for students, educators and parents */}
            {!["student", "educator", "parent"].includes(session.role) && (
              <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <i className="bi bi-trash text-xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Delete Account
                      </h3>
                      <p className="text-sm text-white/70">
                        Permanently remove your account and all associated data
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {!showDeleteConfirm ? (
                    <div>
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5">
                        <p className="text-sm font-medium text-red-800">
                          <i className="bi bi-exclamation-triangle-fill me-2" />
                          This action is irreversible. All your data, courses,
                          messages, and records will be permanently deleted.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                      >
                        <i className="bi bi-trash" /> Delete My Account
                      </button>
                    </div>
                  ) : (
                    <div className="max-w-sm space-y-4">
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                        <p className="text-sm font-semibold text-red-800">
                          <i className="bi bi-exclamation-triangle-fill me-2" />
                          Are you absolutely sure? This cannot be undone.
                        </p>
                      </div>
                      {deleteError && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                          <i className="bi bi-exclamation-circle-fill me-2" />{" "}
                          {deleteError}
                        </div>
                      )}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Enter your password to confirm
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                          placeholder="Your password"
                        />
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deleteConfirmed}
                          onChange={(e) => setDeleteConfirmed(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-slate-600">
                          I understand this action is permanent and cannot be
                          undone
                        </span>
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword("");
                            setDeleteConfirmed(false);
                            setDeleteError("");
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={
                            !deletePassword || !deleteConfirmed || deleting
                          }
                          className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {deleting ? "Deleting..." : "Confirm Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center sm:hidden">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm"
          >
            <i className="bi bi-arrow-left" /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
