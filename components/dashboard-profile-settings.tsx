"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardBundle, SessionUser } from "@/lib/types";

type ProfileSettingsProps = {
  session: SessionUser | null;
  role: string;
  dashboard: DashboardBundle;
};

type AlertType = "success" | "error" | null;

function useAutoAlert(ms = 3000) {
  const [alert, setAlert] = useState<{ type: AlertType; msg: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((type: AlertType, msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setAlert({ type, msg });
    timer.current = setTimeout(() => setAlert(null), ms);
  }, [ms]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { alert, show };
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  color,
}: {
  tags: string[];
  onAdd: (s: string) => void;
  onRemove: (s: string) => void;
  placeholder: string;
  color: "indigo" | "emerald" | "red";
}) {
  const [val, setVal] = useState("");
  const styles = {
    indigo: {
      tag: "bg-indigo-50 text-indigo-700",
      hover: "hover:bg-indigo-100",
      btn: "bg-indigo-600 hover:bg-indigo-700",
    },
    emerald: {
      tag: "bg-emerald-50 text-emerald-700",
      hover: "hover:bg-emerald-100",
      btn: "bg-emerald-600 hover:bg-emerald-700",
    },
    red: {
      tag: "bg-red-50 text-red-700",
      hover: "hover:bg-red-100",
      btn: "bg-red-500 hover:bg-red-600",
    },
  };
  const s = styles[color];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = val.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setVal("");
      }
    }
  }

  function handleClick() {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setVal("");
    }
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-1.5 rounded-full ${s.tag} px-3 py-1.5 text-xs font-semibold`}
            >
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                className={`inline-flex items-center justify-center rounded-full ${s.hover} h-4 w-4 transition-colors`}
              >
                <i className="bi bi-x text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm text-[var(--color-heading)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 rounded-xl ${s.btn} px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm`}
        >
          <i className="bi bi-plus-lg" /> Add
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[var(--color-heading)] text-right">
        {value || <span className="text-[var(--color-muted)] italic font-normal">Not set</span>}
      </span>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  maxLength,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

export function DashboardProfileSettings({
  session,
  role,
  dashboard,
}: ProfileSettingsProps) {
  const p = dashboard.profile;
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState(p?.guardianPhone ?? "");
  const [gender, setGender] = useState(p?.gender ?? "");
  const [dob, setDob] = useState(p?.dob ?? p?.dateOfBirth ?? "");
  const [addressLine1, setAddressLine1] = useState(p?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(p?.addressLine2 ?? "");
  const [city, setCity] = useState(p?.city ?? "");
  const [state, setState] = useState(p?.state ?? "");
  const [pincode, setPincode] = useState(p?.pincode ?? "");
  const [profilePhoto, setProfilePhoto] = useState(p?.profilePhoto ?? "");

  const [qualification, setQualification] = useState(p?.qualification ?? "");
  const [experience, setExperience] = useState(p?.experience ?? "");
  const [subjects, setSubjects] = useState<string[]>(Array.isArray(p?.subjects) ? p.subjects : []);

  const [parentName, setParentName] = useState(p?.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(p?.parentEmail ?? "");
  const [parentMobile, setParentMobile] = useState(p?.parentMobile ?? "");
  const [course, setCourse] = useState(p?.courseWantedTitle ?? p?.courseWanted ?? "");
  const [studentType, setStudentType] = useState(p?.studentType ?? "");
  const [latestQualification, setLatestQualification] = useState(p?.latestQualification ?? "");
  const [latestAcademicScore, setLatestAcademicScore] = useState(p?.latestAcademicScore ?? "");
  const [strongSubjects, setStrongSubjects] = useState<string[]>(p?.strongSubjects ?? []);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(p?.weakSubjects ?? []);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [savingPassword, setSavingPassword] = useState(false);

  const { alert, show: showAlert } = useAutoAlert();

  const isEducator = role === "educator";
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const isParent = role === "parent";

  function roleLabel(r: string) {
    if (r === "admin") return "Administrator";
    if (r === "educator") return "Educator";
    if (r === "student") return "Student";
    if (r === "parent") return "Parent";
    if (r === "counsellor") return "Counsellor";
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  function roleBadgeStyle(r: string) {
    if (r === "admin") return "bg-rose-50 text-rose-700 ring-rose-600/20";
    if (r === "educator") return "bg-violet-50 text-violet-700 ring-violet-600/20";
    if (r === "student") return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (r === "parent") return "bg-amber-50 text-amber-700 ring-amber-600/20";
    if (r === "counsellor") return "bg-sky-50 text-sky-700 ring-sky-600/20";
    return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
  }

  function roleIcon(r: string) {
    if (r === "admin") return "bi-shield-check";
    if (r === "educator") return "bi-mortarboard";
    if (r === "student") return "bi-book";
    if (r === "parent") return "bi-people";
    if (r === "counsellor") return "bi-chat-dots";
    return "bi-person";
  }

  function getInitials(n?: string) {
    if (!n) return "U";
    return n
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", "photo");
      const res = await fetch("/api/upload/signup", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setProfilePhoto(data.url);
        showAlert("success", "Photo uploaded. Save profile to apply.");
      } else {
        showAlert("error", data.message ?? "Upload failed.");
      }
    } catch {
      showAlert("error", "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};

      if (name !== session?.name) body.name = name;
      if (phone !== (p?.guardianPhone ?? "")) body.guardianPhone = phone;
      if (gender !== (p?.gender ?? "")) body.gender = gender;
      if (dob !== (p?.dob ?? p?.dateOfBirth ?? "")) body.dob = dob;
      if (addressLine1 !== (p?.addressLine1 ?? "")) body.addressLine1 = addressLine1;
      if (addressLine2 !== (p?.addressLine2 ?? "")) body.addressLine2 = addressLine2;
      if (city !== (p?.city ?? "")) body.city = city;
      if (state !== (p?.state ?? "")) body.state = state;
      if (pincode !== (p?.pincode ?? "")) body.pincode = pincode;
      if (profilePhoto !== (p?.profilePhoto ?? "")) body.profilePhoto = profilePhoto;

      if (isEducator) {
        if (qualification !== (p?.qualification ?? "")) body.qualification = qualification;
        if (experience !== (p?.experience ?? "")) body.experience = experience;
        const origSubjects = Array.isArray(p?.subjects) ? p.subjects : [];
        if (JSON.stringify(subjects) !== JSON.stringify(origSubjects)) body.subjects = subjects;
      }

      if (isStudent) {
        if (parentName !== (p?.parentName ?? "")) body.parentName = parentName;
        if (parentEmail !== (p?.parentEmail ?? "")) body.parentEmail = parentEmail;
        if (parentMobile !== (p?.parentMobile ?? "")) body.parentMobile = parentMobile;
        if (course !== (p?.courseWantedTitle ?? p?.courseWanted ?? "")) body.courseWantedTitle = course;
        if (studentType !== (p?.studentType ?? "")) body.studentType = studentType;
        if (latestQualification !== (p?.latestQualification ?? "")) body.latestQualification = latestQualification;
        if (latestAcademicScore !== (p?.latestAcademicScore ?? "")) body.latestAcademicScore = latestAcademicScore;
        if (JSON.stringify(strongSubjects) !== JSON.stringify(p?.strongSubjects ?? [])) body.strongSubjects = strongSubjects;
        if (JSON.stringify(weakSubjects) !== JSON.stringify(p?.weakSubjects ?? [])) body.weakSubjects = weakSubjects;
      }

      if (Object.keys(body).length === 0) {
        showAlert("success", "No changes to save.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("success", "Profile updated successfully!");
        setEditing(false);
      } else {
        showAlert("error", data.error ?? "Update failed.");
      }
    } catch {
      showAlert("error", "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    const errs: string[] = [];
    if (!currentPassword) errs.push("Current password is required.");
    if (newPassword.length < 8) errs.push("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) errs.push("Passwords do not match.");
    if (errs.length) {
      setPasswordErrors(errs);
      return;
    }
    setPasswordErrors([]);
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        showAlert("success", "Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors([]);
      } else {
        const data = await res.json();
        setPasswordErrors([data.error ?? "Failed to change password."]);
      }
    } catch {
      setPasswordErrors(["Failed to change password."]);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* ── Header ── */}
      <div
        className="px-6 py-5"
        style={{ background: "linear-gradient(135deg, #1E1B4B, var(--color-primary), #6D28D9)" }}
      >
        <p className="text-sm font-medium text-white/50">Account / Profile</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">My Profile</h1>
        <p className="mt-1 text-sm text-white/60">View and manage your personal information</p>
      </div>

      {/* ── Alerts ── */}
      {alert && (
        <div
          className={`mx-6 mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <i
            className={`bi ${
              alert.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"
            }`}
          />
          {alert.msg}
        </div>
      )}

      <div className="p-6 max-w-3xl">
        {/* ── Profile Header Card ── */}
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-8">
          {/* Avatar / Photo */}
          <div className="relative group">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="h-24 w-24 rounded-2xl object-cover ring-2 ring-[var(--color-border)] shadow-sm"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[#6D28D9] text-3xl font-black text-white shadow-sm">
                {getInitials(session?.name)}
              </div>
            )}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="text-white text-xs font-semibold">
                {uploading ? "Uploading..." : "Change Photo"}
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-black text-[var(--color-heading)]">{session?.name || "User"}</h2>
            <p className="text-sm text-[var(--color-muted)]">{session?.email}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${roleBadgeStyle(
                role
              )}`}
            >
              <i className={`bi ${roleIcon(role)}`} />
              {roleLabel(role)}
            </span>
            {session?.verified && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <i className="bi bi-patch-check-fill" />
                Verified
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              editing
                ? "bg-[var(--color-panel)] text-[var(--color-heading)] border border-[var(--color-border)]"
                : "bg-[var(--color-primary)] text-white hover:opacity-90"
            }`}
          >
            <i className={`bi ${editing ? "bi-x-lg" : "bi-pencil-square"}`} />
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* ── READ-ONLY INFO GRID ── */}
        {!editing && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Personal Information
              </h3>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5">
                <InfoRow label="Full Name" value={session?.name} />
                <InfoRow label="Email" value={session?.email} />
                <InfoRow label="Phone" value={phone} />
                <InfoRow label="Gender" value={gender} />
                <InfoRow label="Date of Birth" value={dob} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Address
              </h3>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5">
                <InfoRow label="Address Line 1" value={addressLine1} />
                <InfoRow label="Address Line 2" value={addressLine2} />
                <InfoRow label="City" value={city} />
                <InfoRow label="State" value={state} />
                <InfoRow label="Pincode" value={pincode} />
              </div>
            </div>

            {/* Educator */}
            {isEducator && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                  Professional Details
                </h3>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5">
                  <InfoRow label="Qualification" value={qualification} />
                  <InfoRow label="Experience" value={experience ? `${experience}` : null} />
                  <InfoRow label="Subjects" value={subjects.length ? subjects.join(", ") : null} />
                </div>
              </div>
            )}

            {/* Student */}
            {isStudent && (
              <>
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                    Academic Information
                  </h3>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5">
                    <InfoRow label="Course" value={course} />
                    <InfoRow label="Student Type" value={studentType} />
                    <InfoRow label="Latest Qualification" value={latestQualification} />
                    <InfoRow label="Academic Score" value={latestAcademicScore} />
                    <InfoRow label="Strong Subjects" value={strongSubjects.length ? strongSubjects.join(", ") : null} />
                    <InfoRow label="Weak Subjects" value={weakSubjects.length ? weakSubjects.join(", ") : null} />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                    Parent / Guardian
                  </h3>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5">
                    <InfoRow label="Parent Name" value={parentName} />
                    <InfoRow label="Parent Email" value={parentEmail} />
                    <InfoRow label="Parent Mobile" value={parentMobile} />
                  </div>
                </div>
              </>
            )}

            {/* Parent linked student */}
            {isParent && dashboard.linkedStudentProfile && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-600">
                  <i className="bi bi-person-lines-fill me-1" />
                  Linked Student
                </h3>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5">
                  <InfoRow label="Student Name" value={dashboard.linkedStudentProfile.name} />
                  <InfoRow label="Student Email" value={dashboard.linkedStudentProfile.email} />
                  <InfoRow label="Phone" value={dashboard.linkedStudentProfile.phone} />
                  <InfoRow label="Course" value={dashboard.linkedStudentProfile.course} />
                </div>
              </div>
            )}

            {/* Admin special badge note */}
            {isAdmin && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <i className="bi bi-shield-check" />
                  Administrator Account &mdash; Full system access granted
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {editing && (
          <div className="space-y-6">
            {/* Common Fields */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput label="Full Name" value={name} onChange={setName} maxLength={60} />
                <FieldInput label="Email" value={session?.email ?? ""} disabled />
                <FieldInput label="Phone" value={phone} onChange={setPhone} placeholder="Contact number" maxLength={15} />
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <FieldInput label="Date of Birth" value={dob} onChange={setDob} type="date" />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Address
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldInput label="Address Line 1" value={addressLine1} onChange={setAddressLine1} maxLength={100} placeholder="Street address" />
                </div>
                <div className="sm:col-span-2">
                  <FieldInput label="Address Line 2" value={addressLine2} onChange={setAddressLine2} maxLength={100} placeholder="Apartment, suite, etc. (optional)" />
                </div>
                <FieldInput label="City" value={city} onChange={setCity} maxLength={50} />
                <FieldInput label="State" value={state} onChange={setState} maxLength={50} />
                <FieldInput label="Pincode" value={pincode} onChange={setPincode} maxLength={10} />
              </div>
            </div>

            {/* Educator Fields */}
            {isEducator && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                  Professional Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldInput label="Qualification" value={qualification} onChange={setQualification} maxLength={80} placeholder="e.g. M.Sc Physics, B.Ed" />
                  <FieldInput label="Experience (years)" value={experience} onChange={setExperience} type="number" placeholder="0" />
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      Subjects Taught
                    </label>
                    <TagInput
                      tags={subjects}
                      onAdd={(s) => setSubjects((prev) => [...prev, s])}
                      onRemove={(s) => setSubjects((prev) => prev.filter((x) => x !== s))}
                      placeholder="Type subject and press Enter..."
                      color="indigo"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Student Fields */}
            {isStudent && (
              <>
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                    Academic Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldInput label="Course" value={course} onChange={setCourse} maxLength={80} placeholder="e.g. Class 12 - Science" />
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Student Type
                      </label>
                      <select
                        value={studentType}
                        onChange={(e) => setStudentType(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <option value="">Select</option>
                        <option value="on-campus">On Campus</option>
                        <option value="online">Online</option>
                        <option value="centre-based">Centre Based</option>
                        <option value="home">Home</option>
                      </select>
                    </div>
                    <FieldInput label="Latest Qualification" value={latestQualification} onChange={setLatestQualification} maxLength={80} placeholder="e.g. Class 10" />
                    <FieldInput label="Academic Score" value={latestAcademicScore} onChange={setLatestAcademicScore} maxLength={20} placeholder="e.g. 92%" />
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Strong Subjects
                      </label>
                      <TagInput
                        tags={strongSubjects}
                        onAdd={(s) => setStrongSubjects((prev) => [...prev, s])}
                        onRemove={(s) => setStrongSubjects((prev) => prev.filter((x) => x !== s))}
                        placeholder="Type subject and press Enter..."
                        color="emerald"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Weak Subjects
                      </label>
                      <TagInput
                        tags={weakSubjects}
                        onAdd={(s) => setWeakSubjects((prev) => [...prev, s])}
                        onRemove={(s) => setWeakSubjects((prev) => prev.filter((x) => x !== s))}
                        placeholder="Type subject and press Enter..."
                        color="red"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                    Parent / Guardian
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldInput label="Parent Name" value={parentName} onChange={setParentName} maxLength={60} placeholder="e.g. Supriya" />
                    <FieldInput label="Parent Email" value={parentEmail} onChange={setParentEmail} type="email" placeholder="parent@email.com" />
                    <FieldInput label="Parent Mobile" value={parentMobile} onChange={setParentMobile} maxLength={15} placeholder="Parent phone number" />
                  </div>
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <i className="bi bi-check-circle-fill" />
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-3 text-sm font-bold text-[var(--color-heading)] hover:opacity-80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Password Change ── */}
        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center gap-3 w-full text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <i className="bi bi-shield-lock" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[var(--color-heading)]">Change Password</h3>
              <p className="text-xs text-[var(--color-muted)]">Update your account password</p>
            </div>
            <i
              className={`bi bi-chevron-down text-[var(--color-muted)] transition-transform ${
                showPassword ? "rotate-180" : ""
              }`}
            />
          </button>

          {showPassword && (
            <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 space-y-4 max-w-md">
              {passwordErrors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 space-y-1">
                  {passwordErrors.map((e, i) => (
                    <p key={i} className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                      <i className="bi bi-exclamation-circle-fill" />
                      {e}
                    </p>
                  ))}
                </div>
              )}

              <FieldInput
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                type="password"
              />
              <FieldInput
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                placeholder="Min. 8 characters"
              />
              <FieldInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
              />

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <i className="bi bi-shield-check" />
                {savingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
