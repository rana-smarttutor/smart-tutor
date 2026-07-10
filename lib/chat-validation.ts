export type ValidationResult = {
  hasSensitiveContent: boolean;
  reasons: Array<{
    type: "phone" | "email" | "link";
    detail: string;
  }>;
};

const PHONE_REGEX = /[\+]?(?:91)?[6-9]\d{9}/g;
const EMAIL_REGEX = /[\w\.-]+@[\w\.-]+\.\w{2,}/g;
const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/g;

export function validateChatContent(body: string): ValidationResult {
  const reasons: ValidationResult["reasons"] = [];

  const phoneMatches = body.match(PHONE_REGEX);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      reasons.push({ type: "phone", detail: `Phone number detected: ${match}` });
    }
  }

  const emailMatches = body.match(EMAIL_REGEX);
  if (emailMatches) {
    for (const match of emailMatches) {
      reasons.push({ type: "email", detail: `Email address detected: ${match}` });
    }
  }

  const urlMatches = body.match(URL_REGEX);
  if (urlMatches) {
    for (const match of urlMatches) {
      if (!match.toLowerCase().includes("smarttutors.co.in")) {
        reasons.push({ type: "link", detail: `External URL detected: ${match}` });
      }
    }
  }

  return {
    hasSensitiveContent: reasons.length > 0,
    reasons,
  };
}
