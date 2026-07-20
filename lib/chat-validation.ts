export type ValidationResult = {
  hasSensitiveContent: boolean;
  reasons: Array<{
    type: "phone" | "email" | "link";
    detail: string;
  }>;
};

const PHONE_REGEX =
  /(?:\+?91[\s().-]*)?[6-9](?:[\s().-]*\d){9}\b/g;

const EMAIL_REGEX =
  /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;

const URL_REGEX =
  /\b(?:https?:\/\/|www\.)[^\s]+|\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+[^\s]*/g;

const SINGLE_DIGIT_WORDS: Record<string, string> = {
  zero: "0",
  oh: "0",
  o: "0",
  shunya: "0",
  sunya: "0",

  one: "1",
  ek: "1",

  two: "2",
  do: "2",

  three: "3",
  teen: "3",

  four: "4",
  forty: "40",
  fourty: "40",
  char: "4",
  chaar: "4",

  five: "5",
  panch: "5",
  paanch: "5",

  six: "6",
  che: "6",
  chhe: "6",

  seven: "7",
  saat: "7",

  eight: "8",
  aath: "8",
  ath: "8",

  nine: "9",
  nau: "9",
};

const TEEN_WORDS: Record<string, string> = {
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
};

const TENS_WORDS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fourty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const REPEAT_WORDS: Record<string, number> = {
  double: 2,
  triple: 3,
};

const NUMBER_CONNECTORS = new Set([
  "and",
  "dash",
  "hyphen",
  "space",
  "minus",
]);

function looksLikePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (/^[6-9]\d{9}$/.test(digits)) {
    return true;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return true;
  }

  if (/^0[6-9]\d{9}$/.test(digits)) {
    return true;
  }

  return /[6-9]\d{9}/.test(digits);
}

function detectPhoneNumberWrittenInWords(body: string) {
  const tokens =
    body
      .toLowerCase()
      .replace(/[.,/\\|()[\]{}:;_–—-]+/g, " ")
      .match(/[a-z]+|\d+/g) ?? [];

  let collectedDigits = "";

  function flushSequence() {
    const detected = looksLikePhoneNumber(collectedDigits);
    collectedDigits = "";
    return detected;
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (/^\d+$/.test(token)) {
      collectedDigits += token;

      if (looksLikePhoneNumber(collectedDigits)) {
        return true;
      }

      continue;
    }

    const repeatCount = REPEAT_WORDS[token];

    if (repeatCount) {
      const nextToken = tokens[index + 1];
      const nextDigit = nextToken
        ? SINGLE_DIGIT_WORDS[nextToken]
        : undefined;

      if (nextDigit && nextDigit.length === 1) {
        collectedDigits += nextDigit.repeat(repeatCount);
        index += 1;

        if (looksLikePhoneNumber(collectedDigits)) {
          return true;
        }

        continue;
      }

      if (flushSequence()) {
        return true;
      }

      continue;
    }

    const teenValue = TEEN_WORDS[token];

    if (teenValue) {
      collectedDigits += teenValue;

      if (looksLikePhoneNumber(collectedDigits)) {
        return true;
      }

      continue;
    }

    const tensValue = TENS_WORDS[token];

    if (tensValue !== undefined) {
      const nextToken = tokens[index + 1];
      const nextDigit = nextToken
        ? SINGLE_DIGIT_WORDS[nextToken]
        : undefined;

      if (
        nextDigit &&
        nextDigit.length === 1 &&
        nextDigit !== "0"
      ) {
        collectedDigits += String(
          tensValue + Number(nextDigit),
        );

        index += 1;
      } else {
        collectedDigits += String(tensValue);
      }

      if (looksLikePhoneNumber(collectedDigits)) {
        return true;
      }

      continue;
    }

    const singleDigit = SINGLE_DIGIT_WORDS[token];

    if (singleDigit !== undefined) {
      collectedDigits += singleDigit;

      if (looksLikePhoneNumber(collectedDigits)) {
        return true;
      }

      continue;
    }

    if (
      NUMBER_CONNECTORS.has(token) &&
      collectedDigits.length > 0
    ) {
      continue;
    }

    if (flushSequence()) {
      return true;
    }
  }

  return flushSequence();
}

export function validateChatContent(
  body: string,
): ValidationResult {
  const reasons: ValidationResult["reasons"] = [];

  const phoneMatches = body.match(PHONE_REGEX);

  if (phoneMatches?.length) {
    reasons.push({
      type: "phone",
      detail: "A phone number was detected.",
    });
  }

  if (
    detectPhoneNumberWrittenInWords(body) &&
    !reasons.some((reason) => reason.type === "phone")
  ) {
    reasons.push({
      type: "phone",
      detail:
        "A phone number written in words or mixed format was detected.",
    });
  }

  const emailMatches = body.match(EMAIL_REGEX);

  if (emailMatches?.length) {
    reasons.push({
      type: "email",
      detail: "An email address was detected.",
    });
  }

  const urlMatches = body.match(URL_REGEX) ?? [];

  const externalUrl = urlMatches.find(
    (match) =>
      !match.toLowerCase().includes("smarttutors.co.in"),
  );

  if (externalUrl) {
    reasons.push({
      type: "link",
      detail: "An external website link was detected.",
    });
  }

  return {
    hasSensitiveContent: reasons.length > 0,
    reasons,
  };
}