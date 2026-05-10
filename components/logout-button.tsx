"use client";

import { useState } from "react";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      window.location.assign("/");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="btn-surface btn-sm w-full font-bold"
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}
