/**
 * Temporary Digital Library lockdown.
 *
 * Keep enabled until subscriptions, payments and
 * protected file delivery have all been verified.
 */
export const DIGITAL_LIBRARY_LOCKED = true;

export function isLibraryLockdownBypass(
  role: unknown
): boolean {
  const normalized = String(role || "").toLowerCase();

  return (
    !DIGITAL_LIBRARY_LOCKED ||
    normalized === "admin" ||
    normalized === "educator"
  );
}