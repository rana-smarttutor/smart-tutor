"use client";

export async function requestLoginIfNeeded(
  returnPath: string,
): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Session check unavailable");
    }

    const data = (await response.json()) as {
      user?: {
        id: string;
        role: string;
      } | null;
    };

    if (data.user) {
      return true;
    }

    window.dispatchEvent(
      new CustomEvent("smartiq:login-required", {
        detail: {
          next: returnPath,
        },
      }),
    );

    return false;
  } catch {
    alert(
      "Unable to verify your login session. Please check your connection and try again.",
    );

    return false;
  }
}