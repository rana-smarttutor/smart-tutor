import type { Role } from "@/lib/types";

const controlChars = /[\u0000-\u001F\u007F]/g;
const angleBrackets = /[<>]/g;

function sanitizeRaw(value: string) {
  return value.replace(controlChars, "").replace(angleBrackets, "").trim();
}

export function sanitizeTextInput(value: string | undefined, maxLength: number) {
  if (!value) {
    return "";
  }

  return sanitizeRaw(value).replace(/\s+/g, " ").slice(0, maxLength);
}

export function sanitizeTextareaInput(value: string | undefined, maxLength: number) {
  if (!value) {
    return "";
  }

  return sanitizeRaw(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, maxLength);
}

export function sanitizeEmailInput(value: string | undefined) {
  return sanitizeTextInput(value?.toLowerCase(), 120);
}

export function sanitizePasswordInput(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(controlChars, "").trim().slice(0, 64);
}

export function sanitizeIdList(values: string[] | undefined, maxItems = 50) {
  if (!values) {
    return [];
  }

  return values
    .map((value) => sanitizeTextInput(value, 80))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function sanitizeOptions(values: string[] | undefined) {
  if (!values) {
    return [];
  }

  return values
    .map((value) => sanitizeTextInput(value, 60))
    .filter(Boolean)
    .slice(0, 4);
}

export function sanitizeRoleInput(value: string | undefined): Role | null {
if (
  value === "student" ||
  value === "educator" ||
  value === "admin" ||
  value === "parent" ||
  value === "counsellor"
) {
  return value;
}

  return null;
}

export function validateEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
