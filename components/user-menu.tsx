"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/types";

function getInitials(name?: string) {
  if (!name) return "ST";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  session: SessionUser;
  profilePhoto?: string | null;
};

export function UserMenu({ session, profilePhoto }: Props) {
  const router = useRouter();
const [open, setOpen] = useState(false);
const [loggingOut, setLoggingOut] = useState(false);
const [photoFailed, setPhotoFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
useEffect(() => {
  setPhotoFailed(false);
}, [profilePhoto]);
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed anyway
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 cursor-pointer group focus:outline-none"
        aria-expanded={open}
        aria-haspopup="true"
      >
<div className="h-10 w-10 overflow-hidden rounded-full border-2 border-transparent bg-white shadow-sm transition-all duration-200 group-hover:border-[#0B40A1]">
  {profilePhoto && !photoFailed ? (
    <img
      src={profilePhoto}
      alt={`${session.name} profile`}
      onError={() => setPhotoFailed(true)}
      className="h-full w-full object-cover object-top"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
      {getInitials(session.name)}
    </div>
  )}
</div>
        <svg
          className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/5 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900 truncate">
              {session.name}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {session.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/my-profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <i className="bi bi-person-circle text-base text-indigo-500" />
              My Profile
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <i className="bi bi-box-arrow-right text-base" />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
