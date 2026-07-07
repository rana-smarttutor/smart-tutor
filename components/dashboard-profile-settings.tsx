"use client";

import { useRef, useState } from "react";

import type { DashboardBundle, SessionUser } from "@/lib/types";

type ProfileSettingsProps = {
  session: SessionUser | null;
  role: string;
  dashboard: DashboardBundle;
};

export function DashboardProfileSettings({
  session,
  role,
  dashboard,
}: ProfileSettingsProps) {
  const [name, setName] = useState(session?.name ?? "");
  const [dob, setDob] = useState(dashboard.profile?.dob ?? "");
  const [gender, setGender] = useState(dashboard.profile?.gender ?? "");
  const [addressLine1, setAddressLine1] = useState(dashboard.profile?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(dashboard.profile?.addressLine2 ?? "");
  const [city, setCity] = useState(dashboard.profile?.city ?? "");
  const [state, setState] = useState(dashboard.profile?.state ?? "");
  const [pincode, setPincode] = useState(dashboard.profile?.pincode ?? "");
  const [profilePhoto, setProfilePhoto] = useState(dashboard.profile?.profilePhoto ?? "");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
        setStatus("Photo uploaded. Save profile to apply.");
      } else {
        setStatus(data.message ?? "Upload failed.");
      }
    } catch {
      setStatus("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      const body: Record<string, unknown> = {};
      if (name !== session?.name) body.name = name;
      if (dob !== dashboard.profile?.dob) body.dob = dob;
      if (gender !== dashboard.profile?.gender) body.gender = gender;
      if (addressLine1 !== dashboard.profile?.addressLine1) body.addressLine1 = addressLine1;
      if (addressLine2 !== dashboard.profile?.addressLine2) body.addressLine2 = addressLine2;
      if (city !== dashboard.profile?.city) body.city = city;
      if (state !== dashboard.profile?.state) body.state = state;
      if (pincode !== dashboard.profile?.pincode) body.pincode = pincode;
      if (profilePhoto !== dashboard.profile?.profilePhoto) body.profilePhoto = profilePhoto;

      if (Object.keys(body).length === 0) {
        setStatus("No changes to save.");
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
        setStatus("Profile updated successfully.");
      } else {
        setStatus(data.error ?? "Update failed.");
      }
    } catch {
      setStatus("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div
        className="px-6 py-5 text-white"
        style={{ background: "linear-gradient(135deg, #1E1B4B, var(--color-primary), #6D28D9)" }}
      >
        <p className="text-sm font-medium text-white/60">Account / Profile Settings</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Profile Settings</h1>
        <p className="mt-1 text-sm text-white/65">Update your personal information and photo</p>
      </div>

      {status ? (
        <div className="mx-6 mt-4 rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-[var(--color-border)]">
          {status}
        </div>
      ) : null}

      <div className="p-6 max-w-2xl">
        {/* Photo */}
        <div className="mb-6 flex items-center gap-5">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="h-20 w-20 rounded-xl object-cover ring-2 ring-white shadow-sm" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--color-primary)] text-3xl font-bold text-white shadow-sm">
              {session?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              <i className="bi bi-camera" />
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
            <p className="mt-1 text-xs text-[var(--color-muted)]">PNG, JPG or WEBP. Max 5MB.</p>
            <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Date of Birth</label>
            <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Address Line 1</label>
            <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value.slice(0, 100))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Address Line 2</label>
            <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value.slice(0, 100))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 50))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">State</label>
            <input value={state} onChange={(e) => setState(e.target.value.slice(0, 50))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Pincode</label>
            <input value={pincode} onChange={(e) => setPincode(e.target.value.slice(0, 10))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          <i className="bi bi-check-circle-fill" />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </section>
  );
}
